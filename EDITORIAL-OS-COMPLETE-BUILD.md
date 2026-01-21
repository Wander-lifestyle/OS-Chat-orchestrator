# EDITORIAL-OS-COMPLETE-BUILD.md
## Complete Build Specification for Cursor (Revised)
### Aligned with Existing OS Ledger Database

This revision fixes naming collisions, reduces brittle schema changes, and
enforces scheduling safety while staying aligned with your existing Ledger.

---

## ⚠️ IMPORTANT: Existing Database Integration

This build integrates with an **existing Supabase database** that already has:
- `campaigns` (OS Ledger)
- `campaign_assets`
- `campaign_events`
- `campaign_metrics`
- `external_executions`
- `learned_patterns`

**DO NOT drop or modify existing tables.** This spec **adds** new tables
(`briefs`, `newsletter_drafts`, `chat_history`) and **reuses** `campaign_assets`
for asset usage tracking.

### Existing `campaigns` Table Structure
```
| Column       | Type        | Description                    |
|--------------|-------------|--------------------------------|
| ledger_id    | text (PK)   | Primary key (e.g., LED-xxx)    |
| project_name | text        | Campaign name                  |
| brief_id     | text        | Links to briefs.brief_id       |
| status       | text        | intake, active, shipped, etc.  |
| owner_name   | text        | Campaign owner                 |
| channels     | text[]      | Array of channels              |
| created_at   | timestamptz | Creation timestamp             |
| updated_at   | timestamptz | Last update timestamp          |
| metadata     | jsonb       | Flexible metadata storage      |
```

---

## What You're Building

A chat interface where users talk to Claude. Claude orchestrates campaign
creation using tools (Supabase, Cloudinary, Beehiiv, Slack). Claude responds
showing its **team reasoning** and returns real links when scheduled.

The system integrates with the existing OS Ledger to track campaign state.

---

## Project Setup
```bash
npx create-next-app@latest editorial-os --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd editorial-os
npm install @anthropic-ai/sdk @supabase/supabase-js cloudinary
```

---

## File Structure

Create this exact structure:
```
/app
  /page.tsx
  /layout.tsx
  /api
    /chat
      /route.ts
    /projects
      /route.ts

/lib
  /prompts
    /claude.md
    /brief-specialist.md
    /newsletter-agent.md
    /dam-agent.md
    /social-engine.md
    /loader.ts
  /tools
    /definitions.ts
    /executor.ts
    /brief.ts
    /cloudinary.ts
    /newsletter.ts
    /beehiiv.ts
    /slack.ts
    /ledger.ts
  /db
    /client.ts

/types
  /index.ts

.env.local
```

---

## 1. Environment Variables

Create `.env.local`
```env
# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Supabase Database (OS Ledger project)
NEXT_PUBLIC_SUPABASE_URL=https://gfazcqghrsxdfnrotzfn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Cloudinary Digital Asset Management
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Beehiiv Newsletter Platform
BEEHIIV_API_KEY=your_beehiiv_api_key
BEEHIIV_PUBLICATION_ID=your_beehiiv_publication_id

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url

# Optional: Base URL for link generation
NEXT_PUBLIC_BASE_URL=https://workspace-five-ashy.vercel.app
```

---

## 2. Database Setup (Supabase)

### ⚠️ CRITICAL: Read Before Running

This SQL **ADDS** new tables to work with your existing database. It **does not**
modify existing tables.

Run this SQL in Supabase SQL Editor:

```sql
-- ============================================
-- Editorial OS Schema Extension
-- ADDS to existing OS Ledger database
-- DO NOT DROP EXISTING TABLES
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BRIEFS TABLE (NEW)
-- Stores campaign strategy/brief data
-- Links TO campaigns via campaigns.brief_id (text)
-- ============================================
CREATE TABLE IF NOT EXISTS briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id TEXT UNIQUE GENERATED ALWAYS AS ('BRF-' || SUBSTRING(id::text, 1, 8)) STORED,
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(100) NOT NULL,
  target_audience TEXT NOT NULL,
  core_message TEXT NOT NULL,
  key_benefits TEXT[],
  channels TEXT[] DEFAULT '{"email"}',
  success_metrics JSONB,
  timeline JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NEWSLETTER DRAFTS TABLE (NEW)
-- Stores email content before publishing
-- NOTE: Use brief_uuid to avoid collision with brief_id text field
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_uuid UUID REFERENCES briefs(id) ON DELETE CASCADE,
  ledger_id TEXT,
  subject_line VARCHAR(255) NOT NULL,
  preview_text VARCHAR(255),
  body_html TEXT NOT NULL,
  body_text TEXT,
  recommended_send_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft',
  beehiiv_post_id VARCHAR(255),
  performance_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CHAT HISTORY TABLE (NEW)
-- For conversation context continuity
-- ============================================
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_message TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  tools_used TEXT[],
  created_briefs UUID[],
  created_newsletters UUID[],
  ledger_ids TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES (new tables only)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_briefs_created_at ON briefs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefs_brief_id ON briefs(brief_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_drafts_brief_uuid ON newsletter_drafts(brief_uuid);
CREATE INDEX IF NOT EXISTS idx_newsletter_drafts_ledger_id ON newsletter_drafts(ledger_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_drafts_status ON newsletter_drafts(status);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);

-- ============================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_briefs_updated_at ON briefs;
DROP TRIGGER IF EXISTS update_newsletter_drafts_updated_at ON newsletter_drafts;

CREATE TRIGGER update_briefs_updated_at BEFORE UPDATE ON briefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_drafts_updated_at BEFORE UPDATE ON newsletter_drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFY: existing campaigns table still works
-- ============================================
-- SELECT * FROM campaigns LIMIT 1;
```

### Note on Assets
Use the existing `campaign_assets` table to track which Cloudinary assets were
used in a campaign. Do **not** create a second asset usage table.

---

## 3. Types

Create `/types/index.ts` (see the implementation section for exact types).

---

## 4. Build Order Checklist

```
[ ] 1. Create Next.js project
[ ] 2. Install dependencies
[ ] 3. Create .env.local with keys
[ ] 4. Run SQL to add new tables (briefs, newsletter_drafts, chat_history)
[ ] 5. Create /types/index.ts
[ ] 6. Create /lib/db/client.ts
[ ] 7. Add /lib/prompts/*
[ ] 8. Add /lib/tools/*
[ ] 9. Create /app/api/chat/route.ts
[ ] 10. Create /app/api/projects/route.ts
[ ] 11. Replace /app/page.tsx with Cursor-style UI
[ ] 12. Run npm run dev
```

---

## 5. Required Behavior (the goal flow)

User:
```
Create newsletter for this week. Theme: Valentine's weekend getaway
```

Claude (team reasoning loaded):
- Brief Specialist: Valentine’s -> couples audience, romantic tone
- DAM Agent: romantic/lifestyle imagery from Cloudinary
- Newsletter Agent: question subject line + proven patterns
- Schedules for Tuesday 8am if user asked for "this week"

Response:
```
Newsletter drafted and scheduled.
Subject: "Fall in Love with Monterey This Valentine's"
(Question subjects have 23% higher opens for you)
Preview here: [link]
```

---

## 6. Scheduling Safety

Only schedule automatically if the user **explicitly** asks for scheduling,
or includes timing language (e.g. "this week", "Tuesday 8am").

Otherwise: draft only.

---

This document is the build spec to implement in code.
