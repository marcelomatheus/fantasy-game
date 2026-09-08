# MULTIPLAYER — Final Bell v3

## Visão geral

O multiplayer foi adicionado sem acoplar sockets ao `Fighter` ou ao `CombatSystem`. A simulação continua recebendo apenas um contrato de input (`InputSource`). No local, esse contrato é atendido pelo `InputManager`; no online, por `NetworkInputSource`.

```text
teclado local ──> InputManager ───────────────┐
                                               ├─> Fighter / CombatSystem / RoundManager
WebSocket ──> NetworkClient ─> NetworkInputSource ┘

renderização <── estado da simulação
```

Nenhuma posição de lutador é transmitida a cada frame.

## Stack de rede

- transporte: WebSocket;
- cliente: WebSocket nativo do navegador;
- servidor: Node.js, implementação WebSocket mínima no próprio projeto;
- protocolo: JSON tipado em `src/network/protocol.ts`;
- servidor: `server/multiplayer.mjs`;
- sem banco de dados nesta versão: salas e torneios vivem em memória.

O servidor HTTP e o WebSocket usam a mesma origem. Em produção, `npm start` serve `dist/` e aceita upgrade em `/ws`.

## Sincronização de luta

A versão atual usa **input synchronization com input delay e predição simples**:

1. cada cliente captura seus controles em um frame lógico;
2. o cliente envia `{ matchId, frame, bits }`;
3. o servidor apenas retransmite o input ao adversário;
4. ambos aplicam inputs com um atraso configurado de 5 frames;
5. se o input remoto daquele frame ainda não chegou, o último estado remoto conhecido é mantido temporariamente.

Os sete comandos são compactados em bits:

```text
left | right | jump | crouch | light | heavy | block
```

Isso reduz tráfego e mantém a rede orientada a comandos, não a snapshots de posição.

### Limitação atual

Ainda **não existe rollback completo**. Sob jitter/latência elevada, a predição pode gerar divergência temporária entre clientes. O objetivo da v3 é fornecer um multiplayer funcional e uma arquitetura compatível com evolução para rollback, sem contaminar o núcleo de combate com sockets.

## Caminho para rollback completo

A arquitetura atual já separa os componentes necessários. A evolução recomendada é:

1. tornar todos os dados da simulação serializáveis em um `GameStateSnapshot` compacto;
2. remover das decisões de gameplay qualquer fonte não determinística baseada em clock real;
3. manter um ring buffer de snapshots por frame;
4. manter histórico de inputs local/remoto confirmado;
5. ao receber input remoto atrasado diferente da predição:
   - restaurar snapshot do frame anterior;
   - substituir input previsto pelo real;
   - ressimular até o frame atual;
6. não refazer side effects durante ressimulação (áudio/partículas devem consumir eventos confirmados ou deduplicados);
7. adicionar checksum periódico de estado para detectar desync;
8. ajustar janela máxima de rollback e input delay dinamicamente conforme ping/jitter.

`Fighter`, `CombatSystem` e `RoundManager` continuam sendo a simulação autoritativa local; `NetworkInputSource` pode ser substituído por um `RollbackInputSource/Session` sem reescrever golpes e colisões.

## Protocolo de mensagens

### Cliente → servidor

| Tipo | Função |
|---|---|
| `hello` | Identifica uma sessão persistente e nome do jogador. |
| `createRoom` | Cria sala versus ou tournament. |
| `joinRoom` | Entra usando código privado. |
| `leaveRoom` | Sai explicitamente. |
| `selectFighter` | Atualiza lutador escolhido no lobby. |
| `ready` | Alterna READY. |
| `startTournament` | Host inicia bracket. |
| `input` | Envia frame + bitmask de input. |
| `matchResult` | Reporta lado vencedor ao fim da simulação. |
| `ping` / `pingReport` | Mede e publica latência aproximada. |

### Servidor → cliente

| Tipo | Função |
|---|---|
| `welcome` | Confirma sessão e restaura sala quando há reconnect. |
| `roomState` | Snapshot do lobby/bracket. |
| `matchStart` | Define participantes, fighters, regras e `matchId`. |
| `remoteInput` | Input do adversário. |
| `matchEnded` | Resultado consolidado pelo servidor. |
| `tournamentComplete` | Declara campeão. |
| `pong` | Resposta de latência. |
| `notice` / `error` | Mensagem de estado/erro para UI. |

## Salas privadas

Fluxo versus:

```text
ONLINE FIGHT
  -> Criar sala
  -> código de 6 caracteres
  -> segundo jogador entra
  -> ambos escolhem fighter
  -> READY
  -> matchStart
  -> luta
  -> lobby
```

A sala mantém:

- sessão;
- nome;
- fighter selecionado;
- READY;
- host;
- connected/disconnected;
- ping aproximado;
- status (`WAITING`, `READY`, `IN MATCH`, etc.).

## Reconexão e desconexão

O cliente grava um `sessionId` no `localStorage`. Se o socket cair:

- tenta reconectar com backoff exponencial;
- envia novamente a mesma sessão;
- o servidor restaura a sala e o status do participante;
- durante uma luta existe uma janela de reconexão de 12 segundos;
- após o timeout, se apenas um participante continua conectado, ele vence por forfeit;
- se o host desconectar, a liderança migra para o próximo jogador conectado;
- participantes desconectados do lobby são mantidos temporariamente para reconnect e depois limpos.

O smoke test de rede usa timeouts menores injetáveis para testar o mesmo caminho sem esperar 12 segundos.

## Tournament Room

Formato atual: **single elimination**, com capacidade configurável para 4 ou 8 jogadores.

O host:

1. cria Tournament Room;
2. define nome e limite;
3. participantes entram pelo código;
4. todos selecionam personagem e marcam READY;
5. host inicia;
6. servidor gera bracket;
7. partidas são ativadas sequencialmente;
8. o vencedor de cada partida é propagado para a próxima rodada;
9. ao fim, o campeão recebe status `CHAMPION` e todos recebem `tournamentComplete`.

O bracket vive no `RoomState` e é renderizado pelo `OnlineLobbyScene`, portanto participantes que aguardam continuam acompanhando os resultados.

### Spectator mode

Nesta versão, jogadores que não estão no match permanecem no lobby e acompanham o bracket, mas **não recebem a simulação visual ao vivo da partida**. Um spectator real exigiria distribuir os dois streams de input (ou snapshots confirmados) também aos espectadores e permitir catch-up; isso está documentado como evolução futura em vez de introduzir uma implementação frágil agora.

## Segurança e limites do MVP

- não há autenticação de conta; identidade é uma sessão local gerada pelo navegador;
- resultado de partida é reportado por um dos participantes e não validado por uma simulação autoritativa no servidor;
- não há persistência de torneios após reinício do processo;
- não há rate limiting/abuse protection de produção;
- o servidor deve ser colocado atrás de HTTPS/WSS e proxy/reverse proxy em produção;
- códigos privados não são mecanismos de autenticação forte.

Para um lançamento comercial, recomenda-se autenticação, persistência, observabilidade, rate limits e validação/consenso de resultados.

## Testes

`npm run network:test` cobre com sockets reais:

- criação de sala;
- entrada por código;
- READY;
- `matchStart`;
- relay de frame/bitmask;
- desconexão;
- migração de host;
- reconnect na mesma sessão;
- recuperação do estado `IN MATCH`;
- timeout + vitória por forfeit;
- criação de tournament para 4 participantes;
- bracket de 3 partidas;
- avanço automático;
- final e campeão.

## Runtime smoke

Além dos testes de sockets, `scripts/runtime-smoke.mjs` inicializa `dist/src/main.js` com Canvas/DOM simulados, confirma que a aplicação entra no menu principal, agenda o fixed-step loop e executa um frame de update/render. Isso complementa os testes de combate quando Chromium headless não está disponível no ambiente.
