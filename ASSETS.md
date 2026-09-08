# ASSETS — Final Bell v3

Este manifesto documenta a origem e a licença dos assets visuais usados pelo roster e os assets originais/procedurais do projeto. **Nenhum asset foi extraído de Street Fighter, Mortal Kombat, Tekken, King of Fighters, Dragon Ball, Marvel, DC, Rocky ou outra franquia comercial.**

## Personagens externos

| Lutador no jogo | Pack | Autor | Fonte original | Licença | Mirror usado em runtime | Adaptações no projeto |
|---|---|---|---|---|---|---|
| Mateo | Martial Hero | LuizMelo | https://luizmelo.itch.io/martial-hero | CC0 1.0 | `RudraO2/tokenbrawl` em commit imutável | Mapeamento de idle/run/jump/fall/hit/death; Attack1/Attack2 separados em variantes A/B; escala e anchor ajustados; block usa a pose mais próxima disponível. |
| Darius | Martial Hero 3 | LuizMelo | https://luizmelo.itch.io/martial-hero-3 | CC0 1.0 | `tomas-trls/javascript-game-challenge` em commit imutável | Clips de 126px mapeados para idle/run/jump/hit/death; Attack1/2/3 reutilizados no kit de boxe; tint, escala e anchor calibrados. |
| Nox | Hero Knight | LuizMelo | https://luizmelo.itch.io/hero-knight | CC0 1.0 | `vlee489/AC31009-Client` em commit imutável | Attack1/2 usados como variantes; alcance físico continua configurado no `FighterDefinition`; escala/anchor calibrados. |
| Aldric | Martial Hero 2 | LuizMelo | https://luizmelo.itch.io/martial-hero-2 | CC0 1.0 | `RudraO2/tokenbrawl` em commit imutável | Clips mapeados para o state machine existente; ataques alternativos associados às variantes corporais; escala/anchor calibrados. |

### Evidências de licença

- O catálogo público consultado para **Martial Hero**, **Martial Hero 2**, **Martial Hero 3** e **Hero Knight** classifica os packs como **CC0 1.0 / Creative Commons Zero**.

## Estratégia de distribuição dos sprites

`src/characters/spriteProfiles.ts` usa uma estratégia **local-first**:

1. tenta `/assets/fighters/<pack>/<arquivo>.png`;
2. se o arquivo local não existir, tenta o mirror em commit Git imutável;
3. se ambos falharem, a UI mantém um estado visual de carregamento/retentativa coerente com a estética arcade até o asset ficar disponível.

Para baixar os PNGs para o projeto:

```bash
npm run assets:vendor
```

O script `scripts/vendor-assets.mjs` baixa apenas os sprite sheets usados pelo roster e verifica a assinatura PNG antes de escrever. Depois, `npm run build` copia `public/` para `dist/`.

**Estado desta entrega:** a infraestrutura local-first está implementada, mas o ambiente de geração não possui resolução DNS para `raw.githubusercontent.com`, portanto o comando de vendorização não pôde completar aqui. Isso não impede o jogo de iniciar: ele tenta os mirrors no navegador e mantém placeholders de carregamento elegantes nas áreas dependentes de sprite. Para uma publicação comercial offline, execute o comando em uma máquina conectada e inclua os PNGs resultantes no repositório/pacote.

## Assets originais do projeto

| Asset | Autor/fonte | Licença | Arquivo / observação |
|---|---|---|---|
| Corcovado Heights | Projeto Final Bell | MIT do projeto | `src/stages/StageRenderer.ts`; vista inspirada no Cristo Redentor, morros e luz de fim de tarde. |
| Amazon Twilight | Projeto Final Bell | MIT do projeto | `src/stages/StageRenderer.ts`; floresta amazônica estilizada com rio, névoa e profundidade de camadas. |
| Ouro Square | Projeto Final Bell | MIT do projeto | `src/stages/StageRenderer.ts`; centro histórico colonial com igreja, bandeirolas e telhados. |
| Sertão Arena | Projeto Final Bell | MIT do projeto | `src/stages/StageRenderer.ts`; caatinga estilizada com mandacarus, rochas e calor do interior. |
| Partículas/impactos | Projeto Final Bell | MIT do projeto | `src/systems/ParticleSystem.ts`. |
| Música de menu | Projeto Final Bell, síntese Web Audio | MIT do projeto | `src/systems/AudioManager.ts`; composição original em runtime. |
| Música de character select | Projeto Final Bell, síntese Web Audio | MIT do projeto | Cue própria; sem samples externos. |
| Música de luta | Projeto Final Bell, síntese Web Audio | MIT do projeto | Energia esportiva/training montage; não copia melodias de obras comerciais. |
| Música de vitória | Projeto Final Bell, síntese Web Audio | MIT do projeto | Cue própria. |
| Música de campeonato | Projeto Final Bell, síntese Web Audio | MIT do projeto | Cue própria. |
| SFX de combate, especiais, projéteis, super e finalização | Projeto Final Bell, síntese Web Audio | MIT do projeto | Síntese em camadas com variações, filtros, envelopes, ducking e limitador em runtime. |
| HUD, menus, lobby e bracket | Projeto Final Bell | MIT do projeto | Canvas UI em `src/ui/` e `src/scenes/`. |
| Placeholders de carregamento dos lutadores | Projeto Final Bell | MIT do projeto | `src/characters/SpriteFighterRenderer.ts`; usado quando preview ou sprite sheet ainda não está disponível. |

## Código de terceiros

| Componente | Autor | Licença | Uso |
|---|---|---|---|
| Loop/core derivado de Kontra.js | Steven Lambert e contribuidores | MIT | `src/vendor/kontra.ts`. |
| TypeScript compiler vendorizado | Microsoft | Apache-2.0 | `vendor/typescript/`; build/typecheck offline. |

Consulte também `THIRD_PARTY_NOTICES.md`.
