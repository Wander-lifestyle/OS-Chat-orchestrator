# Editorial OS - Complete Implementation

Production-grade architecture for an AI-first Editorial OS using Claude + Notion + Next.js.

## Architecture

- **Claude** = reasoning + content generation (never mutates data directly)
- **Next.js API** = orchestration + control
- **Tool Runtime** = executes side effects (Notion, Cloudinary, Beehiiv, Slack)
- **Notion** = system of record (ledger, briefs, clients)
- **UI** = triggers agents + displays live ledger

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` using the template in this repo.
3. Create the Notion databases using the schema below.
4. Run locally:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000

---

## Notion Schema (Standard)

### 1) Campaign Ledger Database

Required properties (exact names):

| Property Name | Type |
| --- | --- |
| Name | Title |
| Track | Select |
| Status | Select |
| Approval Status | Select |
| Created Date | Date |

### 2) Clients Database

Required properties (exact names):

| Property Name | Type | Notes |
| --- | --- | --- |
| Name | Title | Human-readable client name |
| Client ID | Rich text | Used for API requests |
| Workspace ID | Rich text | Optional tenant identifier |
| Brand Voice | Rich text | Brand voice notes for Claude |
| Beehiiv API Key | Rich text | Client-owned API key |
| Beehiiv Publication ID | Rich text | Client-owned publication ID |
| Slack Webhook | URL | Channel webhook |
| Cloudinary Cloud Name | Rich text | Optional |
| Cloudinary API Key | Rich text | Optional |
| Cloudinary API Secret | Rich text | Optional |
| Ledger Database ID | Rich text | Optional override per client |
| Briefs Database ID | Rich text | Optional override per client |

### 3) Briefs Database (Optional)

If you want Claude to store briefs separately, create a database with a standard
Title property named `Name`, plus any fields you want to track.

---

## Environment Variables

Create `.env.local`:

```env
# Claude API
ANTHROPIC_API_KEY=sk-ant-v1-...

# Notion
NOTION_API_KEY=ntn_...
NOTION_LEDGER_DATABASE_ID=abc123def456
NOTION_CLIENTS_DATABASE_ID=xyz789abc
NOTION_BRIEFS_DATABASE_ID=def456xyz

# Cloudinary (optional for now)
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Beehiiv (optional for now)
BEEHIIV_API_KEY=your_key
BEEHIIV_PUBLICATION_ID=your_publication_id

# Slack (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## Multi-Tenancy

Pass `clientId` or `workspaceId` in the API request body:

```json
{
  "userMessage": "Create newsletter for this week...",
  "clientId": "wander",
  "trackId": 3
}
```

The system will:
1. Fetch the client config from the Notion Clients database.
2. Inject the client brand voice into the Claude system prompt.
3. Use client-specific Beehiiv/Slack credentials when running tools.

---

## How It Works

1. User sends a request in the UI
2. `/api/agents/newsletter` loads the agent spec + client context
3. Claude calls tools
4. Tool runtime executes side effects (Notion, Beehiiv, Slack)
5. UI polls `/api/notion/ledger` every 5 seconds

---

## Testing Checklist

- [ ] Claude can query Notion database
- [ ] Claude can create pages in Campaign Ledger
- [ ] UI fetches and displays ledger
- [ ] Agent response shown to user
- [ ] Tool calls logged to console
- [ ] End-to-end: User message → Claude → Notion → UI
