# Editorial OS Bridge

Minimal Next.js API bridge that forwards chat messages to Claude Code
subagents and returns their responses. No UI, no database, just a thin
HTTP layer.

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

## Production

```bash
npm run build
npm run start
```
