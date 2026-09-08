# Produção e segurança

## Inicialização

1. Copie `.env.example` para `.env` e defina `ALLOWED_ORIGINS` com a origem HTTPS pública exata.
2. Use `TRUST_PROXY=true` somente quando a aplicação estiver atrás de um proxy reverso confiável que sobrescreva `X-Forwarded-For` e `X-Forwarded-Host`.
3. Execute `docker compose up --build -d`.
4. Termine TLS no proxy/load balancer e encaminhe HTTP e o upgrade de `/ws` ao contêiner na porta 4173.

O processo roda como usuário sem privilégios, com filesystem somente leitura, capabilities removidas, limites de CPU/memória/PIDs, health check e encerramento gracioso.

## Proteções aplicadas

- CSP, HSTS, anti-iframe, `nosniff`, política de permissões e referrer restrito.
- Somente GET/HEAD, resolução segura de arquivos, limite de headers/timeouts e rate limit por IP.
- WebSocket restrito a `/ws`, origem validada, handshake RFC 6455 validado e limite por IP/global.
- Frames de cliente obrigatoriamente mascarados, JSON UTF-8 válido, payload máximo, backpressure e heartbeat.
- Rate limits separados para mensagens e ações; códigos, lutadores, regras, frames e bits validados.
- Retomada de sessão protegida por token aleatório e comparação em tempo constante.
- Resultado da luta aceito somente quando os dois jogadores concordam; desconexões seguem a regra de W.O.

O estado de salas é mantido em memória. Para múltiplas réplicas, use afinidade de sessão no balanceador ou migre salas/sessões para um backend compartilhado antes de escalar horizontalmente.
