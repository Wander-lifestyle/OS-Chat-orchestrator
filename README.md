# Light Brief

Light Brief is a minimal, stateless brief capture tool. It provides a clean form,
generates a PDF, and sends the brief summary + PDF attachment to Slack.

## Features

- Clean brief form (no auth, no storage).
- Slack notification with PDF attachment.
- PDF export (download).

## Quick Start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Environment Variables

```
SLACK_BOT_TOKEN=
SLACK_CHANNEL_ID=
```

## Slack Setup

1. Create a Slack app and install it to your workspace.
2. Add scopes: `chat:write`, `files:write`.
3. Copy the bot token and channel ID for your target channel.

## API

`POST /api/briefs`

Payload:

```json
{
  "name": "Q2 Product Launch",
  "objective": "Drive 25% signup growth",
  "target_audience": "Growth marketers at SaaS teams",
  "core_message": "Ship clear briefs faster.",
  "key_benefits": ["Faster approvals", "Clear alignment"],
  "channels": ["email", "social"]
}
```

Response includes a `pdf_base64` string (client converts to download) and Slack
status.

## Future Extensions

The current app is intentionally minimal. If you later want Notion or Airtable,
we can add storage + integrations without changing the form.
