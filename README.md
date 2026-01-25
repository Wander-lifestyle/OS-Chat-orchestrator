# Editorial OS Bridge

Lightweight Next.js project that pairs a clean chat UI with a single
bridge API. Messages are forwarded to Claude Code subagents and the
responses are returned to the browser. No database, no orchestration
layer—just UI → API → CLI delegation → Claude Code.

## Requirements

- Node.js 18+
- Claude CLI installed and authenticated (`claude code run ...`)
- Local agents at `~/.claude/agents/newsletter-level-{3,4,5}.md`
- Local skills at `~/.claude/skills/editorial-os/`
- Claude Code desktop app running in the background

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

The dev server runs on http://localhost:3000.

Open the UI at http://localhost:3000 and send a message from the chat.

## Endpoints

### GET /api/health

Returns a simple health check:

```json
{ "status": "ok" }
```

### POST /api/run-editorial-os

Input:

```json
{ "message": "string", "agentLevel": 3 }
```

`agentLevel` accepts 3, 4, or 5. The UI displays levels 1-5, but levels
1-2 are marked as coming soon and will run at level 3 for now.

Output:

```json
{ "status": "success", "response": "string" }
```

#### Example

```bash
curl -X POST http://localhost:3000/api/run-editorial-os \
  -H "Content-Type: application/json" \
  -d '{"message":"Draft a newsletter intro","agentLevel":3}'
```

## Configuration

All orchestration logic lives in Claude Code. The bridge only needs
access to the Claude CLI.

Optional environment variables:

- `CLAUDE_CLI_PATH` (default: `claude`)
- `NEXT_PUBLIC_EDITORIAL_OS_API_BASE_URL` (default: same origin)
- `CORS_ALLOW_ORIGIN` (default: `*`)
- `NOTION_TOKEN` (used by your Claude Code skills/scripts)
- `NOTION_LEDGER_DB_ID` (used by your Claude Code skills/scripts)

## Bridge Notes

- The API only forwards requests to `claude code run`.
- No database or session state is stored here.
- Keep your Claude Code agents and skills configured locally.

## Production

```bash
npm run build
npm run start
```
