# Editorial OS Bridge

Lightweight Next.js project that pairs a clean chat UI with a single
bridge API. Messages are forwarded to Anthropic via a prompt-driven
agent runner, which can call server-side tools (Notion, Beehiiv,
Cloudinary, Slack). No database, no orchestration layer—just
UI → API → Agent → Tools.

## Requirements

- Node.js 18+
- Anthropic API key
- Optional API credentials for Notion, Beehiiv, Cloudinary, Slack

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
{ "message": "string", "agentLevel": 3, "os": "newsletter" }
```

`agentLevel` accepts 3, 4, or 5. `os` is optional (defaults to `newsletter`).

Output:

```json
{
  "status": "success",
  "response": "string",
  "tools": [
    { "name": "create_ledger_entry", "ok": true, "summary": "..." }
  ]
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/run-editorial-os \
  -H "Content-Type: application/json" \
  -d '{"message":"Draft a newsletter intro","agentLevel":3,"os":"newsletter"}'
```

## Configuration

The bridge uses Anthropic directly. Agent prompts live in `/agents` and
tools live in `/lib`.

Environment variables:

- `ANTHROPIC_API_KEY` (required)
- `ANTHROPIC_MODEL` (optional)
- `ANTHROPIC_MAX_TOKENS` (optional)
- `ANTHROPIC_TEMPERATURE` (optional)
- `EDITORIAL_OS_TOOL_TIMEOUT_MS` (optional)
- `NEXT_PUBLIC_EDITORIAL_OS_API_BASE_URL` (default: same origin)
- `CORS_ALLOW_ORIGIN` (default: `*`)
- `NOTION_TOKEN`, `NOTION_LEDGER_DB_ID`
- `NOTION_VERSION` (optional, default `2022-06-28`)
- `NOTION_TITLE_FIELD`, `NOTION_STATUS_FIELD`, `NOTION_STATUS_TYPE`
- `NOTION_SUMMARY_FIELD`, `NOTION_TAGS_FIELD`
- `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`, `BEEHIIV_API_BASE_URL`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SLACK_BOT_TOKEN`

## Agent Prompts

Agent prompts live in the `/agents` directory:

- `agents/newsletter-level-3.md`
- `agents/newsletter-level-4.md`
- `agents/newsletter-level-5.md`
- `agents/social-level-3.md`
- `agents/social-level-4.md`
- `agents/social-level-5.md`

To add a new OS later, create new prompt files and allow the `os` value
in the API route.

## Tools

Tool helpers are intentionally thin and live in `/lib`:

- `lib/notion-ledger.ts`
- `lib/beehiiv.ts`
- `lib/cloudinary.ts`
- `lib/slack.ts`

These call real APIs. Keep credentials in `.env.local` and update any
payload mappings as your services evolve.

## Bridge Notes

- One endpoint: `/api/run-editorial-os`.
- Stateless: no database or session tracking.
- Tools are explicit and easy to extend.

## Production

```bash
npm run build
npm run start
```
