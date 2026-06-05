# Jordan Bot - Versão 3

Plataforma de hospedagem para o bot WhatsApp GataBot-MD, renomeado para Jordan Bot Versão 3. Painel web completo para gerenciar o bot 24/7 com auto-restart.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (porta 5000/8080)
- `pnpm --filter @workspace/bot-panel run dev` — Painel web (porta 23571)
- `pnpm run typecheck` — Typecheck completo
- `pnpm run build` — Build de todos os pacotes
- `pnpm --filter @workspace/api-spec run codegen` — Regenerar hooks e schemas do OpenAPI

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Frontend: React + Vite (painel de controle)
- Bot: GataBot-MD (bots/jordan-bot/) — inicia com `npm start`
- Processo: child_process.spawn gerenciado pelo BotManager
- Build: esbuild (CJS bundle)

## Where things live

- `bots/jordan-bot/` — Código do bot WhatsApp (GataBot-MD / Jordan Bot v3)
- `artifacts/bot-panel/` — Painel web de gerenciamento (React + Vite)
- `artifacts/api-server/src/lib/bot-manager.ts` — Serviço de gerenciamento do processo do bot
- `artifacts/api-server/src/routes/bot.ts` — Rotas de API para controle do bot
- `lib/api-spec/openapi.yaml` — Contrato OpenAPI (fonte da verdade)

## Architecture decisions

- O bot é gerenciado como child process pelo `BotManager` no API server
- Auto-restart ativado por padrão: reinicia automaticamente se o bot cair com código != 0
- Código de pareamento: para 8 dígitos, o bot é iniciado com `npm start -- code`, que mostra o código no stdout
- Logs ficam em memória (últimas 500 linhas), expostos via polling REST a cada 5s
- O painel faz polling do status a cada 3s para manter o dashboard ao vivo

## Product

- Dashboard com status em tempo real (STOPPED/STARTING/RUNNING/CONNECTED/DISCONNECTED)
- Botões de Iniciar/Parar/Reiniciar o bot
- Página de conexão: QR code + código de pareamento de 8 dígitos
- Viewer de logs estilo terminal (color-coded por nível)
- Configuração de auto-restart com delay ajustável
- Reset de sessão (zona de perigo)
- Info de versão do Node.js

## User preferences

- Bot inicia com `npm start` (node index.js)
- Auto-restart ligado por padrão
- Painel dark mode, tema terminal/cyberpunk verde neon
- Bot renomeado para "Jordan Bot - Versão 3"

## Gotchas

- Sempre rodar `pnpm --filter @workspace/api-spec run codegen` após mudar o openapi.yaml
- O bot usa npm (não pnpm) — suas dependências ficam em `bots/jordan-bot/node_modules/`
- O BotManager vive como singleton no processo do API server — restart do API server reseta o estado do bot
- Para iniciar o bot, clicar em "INITIALIZE" no dashboard ou chamar POST /api/bot/start

## Pointers

- Ver `pnpm-workspace` skill para estrutura do workspace, TypeScript e detalhes de pacotes
