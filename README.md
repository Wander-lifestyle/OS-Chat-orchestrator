# Editorial OS v1 Bridge

Lightweight Next.js project that pairs a Slack interface with a single
agent runner. The agent is stateless, Notion is the source of truth, and
skills are loaded per client from Notion. Tools are execution-only and
are invoked by the agent after skills run.

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
{ "message": "string", "clientId": "wander", "track": "newsletter" }
```

`track` accepts `newsletter`, `social`, or `press_release`. `clientId` is optional
and defaults to `NOTION_DEFAULT_CLIENT_ID`.

Output:

```json
{
  "status": "success",
  "response": "string",
  "tools": [
    { "name": "schedule_beehiiv_newsletter", "ok": true, "summary": "..." }
  ],
  "records": {
    "outputUrl": "https://www.notion.so/...",
    "ledgerUrl": "https://www.notion.so/..."
  }
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/run-editorial-os \
  -H "Content-Type: application/json" \
  -d '{"message":"Draft a newsletter intro","clientId":"wander","track":"newsletter"}'
```

### POST /api/slack/events

Slack Events API endpoint for @mention support. Configure your Slack app
to point its Request URL here. The handler verifies Slack signatures and
responds in the same channel/thread.

## Slack Setup (App Mention)

1. Create a Slack app in your workspace.
2. Enable **Event Subscriptions** and set the Request URL to:
   `https://<your-domain>/api/slack/events`
3. Subscribe to the **app_mention** event.
4. Add OAuth scopes:
   - `chat:write`
   - `app_mentions:read`
5. Install the app to your workspace and invite it to the target channel.
6. Set env vars:
   - `SLACK_BOT_TOKEN`
   - `SLACK_SIGNING_SECRET`
   - `SLACK_DEFAULT_CHANNEL` (optional)
   - `SLACK_DEFAULT_TRACK` (optional)
   - `SLACK_DEFAULT_CLIENT_ID` (optional)
   - `SLACK_CHANNEL_CLIENT_MAP` (optional JSON map)

## Configuration

The bridge uses Anthropic directly. Skills and client state live in Notion.
Tools live in `/lib`.

Environment variables:

- `ANTHROPIC_API_KEY` (required)
- `ANTHROPIC_MODEL` (optional)
- `ANTHROPIC_MAX_TOKENS` (optional)
- `ANTHROPIC_TEMPERATURE` (optional)
- `EDITORIAL_OS_TOOL_TIMEOUT_MS` (optional)
- `NEXT_PUBLIC_EDITORIAL_OS_API_BASE_URL` (default: same origin)
- `CORS_ALLOW_ORIGIN` (default: `*`)
- `NOTION_TOKEN`
- `NOTION_DEFAULT_CLIENT_ID`, `NOTION_DEFAULT_CLIENT_NAME`
- `NOTION_BASE_OS_PAGE_ID`, `NOTION_SKILLS_DB_ID`
- `NOTION_OUTPUTS_DB_ID`, `NOTION_HISTORY_DB_ID`
- `NOTION_LEDGER_DB_ID`
- `NOTION_CLIENT_CONFIG_JSON` (optional per-client map)
- `NOTION_VERSION` (optional, default `2022-06-28`)
- `NOTION_TITLE_FIELD`, `NOTION_STATUS_FIELD`, `NOTION_STATUS_TYPE`
- `NOTION_SUMMARY_FIELD`, `NOTION_TAGS_FIELD`
- `NOTION_LEDGER_OUTPUT_FIELD`, `NOTION_LEDGER_OUTPUT_FIELD_TYPE`
- `NOTION_SKILLS_*` fields (see .env.local.example)
- `NOTION_OUTPUTS_*` fields (see .env.local.example)
- `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`, `BEEHIIV_API_BASE_URL`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- `SLACK_DEFAULT_CHANNEL`
- `SLACK_DEFAULT_TRACK`
- `SLACK_DEFAULT_CLIENT_ID`
- `SLACK_CHANNEL_CLIENT_MAP`
- `EDITORIAL_OUTPUT_STATUS_IN_REVIEW`
- `EDITORIAL_LEDGER_STATUS_IN_PROGRESS`
- `EDITORIAL_LEDGER_STATUS_IN_REVIEW`
- `EDITORIAL_LEDGER_STATUS_COMPLETED`
- `EDITORIAL_BASE_OS_TEXT`

## Notion as Source of Truth

Editorial OS v1 stores all state in Notion:

- Client Base OS page
- Claude Skills database
- Historical Files database
- Editorial Outputs database
- Ledger database (jobs in progress, queue, completed)

Skills are loaded on each request. The agent is stateless and only uses
the data in the client’s Notion space.

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
- One agent: Level 4 only.
- Notion is the system of record for every client.

## Production

```bash
npm run build
npm run start
```
