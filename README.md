# Editorial OS Bridge

Minimal Next.js bridge that includes a lightweight chat UI and a single
API endpoint. It forwards messages to Claude Code subagents and returns
their responses.

## Requirements

- Node.js 18+
- Claude CLI installed and authenticated (`claude code run ...`)
- Local agents at `~/.claude/agents/newsletter-level-{3,4,5}.md`

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

## Production

```bash
npm run build
npm run start
```
