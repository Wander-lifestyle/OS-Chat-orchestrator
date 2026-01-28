# OS Brief

OS Brief is a SaaS product for structured campaign briefs. It handles
collaboration, export, and automated delivery to Notion and Slack.

## Core Features

- Clerk auth + organizations (Admin / Editor / Viewer).
- Create structured briefs with download export.
- Archive every brief in Notion.
- Realtime Slack message to #brief on creation.
- Usage limits + audit logs.
- Stripe billing with checkout + portal + webhook handling.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

See `.env.example` for the full list. Required values:

- Clerk
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  - CLERK_SECRET_KEY
- Supabase
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
- Stripe
  - STRIPE_SECRET_KEY
  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  - STRIPE_PRICE_MONTHLY_ID
  - STRIPE_WEBHOOK_SECRET
  - NEXT_PUBLIC_APP_URL

## Supabase SQL (Milestones 2, 4, 5)

```sql
create table if not exists organization_integrations (
  org_id text primary key,
  notion_access_token text,
  notion_workspace_id text,
  notion_database_id text,
  slack_access_token text,
  slack_team_id text,
  slack_channel_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  user_id text not null,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists audit_logs_org_id_idx on audit_logs (org_id);
create index if not exists audit_logs_created_at_idx on audit_logs (created_at desc);

create table if not exists organization_billing (
  org_id text primary key,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  price_id text,
  current_period_end timestamptz,
  trial_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Notion Integration

1. Create a Notion integration and copy the token.
2. Share the brief archive database with the integration.
3. In OS Brief → Settings → Notion, enter the token and database ID.

The system auto-detects the title property and writes the brief details as page
content if the database does not include matching fields.

## Slack Integration

1. Create a Slack app with `chat:write` scope.
2. Install the app, copy the bot token, and find the channel ID for #brief.
3. In OS Brief → Settings → Slack, enter the token and channel ID.

## End-to-End Checklist

- Create a brief.
- Download the exported brief file.
- Confirm the Notion archive page was created.
- Confirm the Slack message posted in #brief.
- Verify audit logs in the Audit view.

---

Built for OS Brief. All milestones map to the SaaS launch plan.
