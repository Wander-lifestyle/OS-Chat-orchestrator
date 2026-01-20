# Editorial OS

AI-first operating system for content and communications. One chat, all tools.

## The Vision

```
┌─────────────────────────────────────────────────┐
│  ◈ Editorial OS                                 │
├─────────────────────────────────────────────────┤
│  [ Brief Engine ]  [ Campaign Deck ]  [ DAM ]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ "Create a brief for EU eSIM launch..."   │  │
│  └───────────────────────────────────────────┘  │
│                                    [Send ✨]    │
│                                                 │
│  🤖 Editorial OS:                              │
│  ✓ Brief created                               │
│  ✓ Added to Campaign Deck (status: intake)     │
│  ✓ Slack notified                              │
│                                                 │
│  [View Brief] [View in Deck] [Search DAM]      │
└─────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## Environment Variables

**Required**: Set these in Vercel or your `.env.local`:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_BRIEF_ENGINE_URL` | Brief Engine deployment URL | `https://os-brief.vercel.app` |
| `NEXT_PUBLIC_LEDGER_URL` | Campaign Ledger deployment URL | `https://os-ledger-v3.vercel.app` |
| `NEXT_PUBLIC_CAMPAIGN_DECK_URL` | Legacy Campaign Deck URL (fallback) | `https://campaign-ledger.vercel.app` |
| `NEXT_PUBLIC_LIGHT_DAM_URL` | Light DAM deployment URL | `https://light-dam-v1.vercel.app` |

## Deploy to Vercel

### Option 1: Via GitHub

1. Push this repo to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Set environment variables in Project Settings → Environment Variables
4. Deploy

### Option 2: Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Preview deploy (staging)
vercel

# Production deploy
vercel --prod
```

### Setting Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `NEXT_PUBLIC_BRIEF_ENGINE_URL` = your Brief Engine URL
   - `NEXT_PUBLIC_LEDGER_URL` = your Campaign Ledger URL
   - `NEXT_PUBLIC_CAMPAIGN_DECK_URL` = legacy Campaign Deck URL (optional)
   - `NEXT_PUBLIC_LIGHT_DAM_URL` = your Light DAM URL

## How It Works

1. **You type** a natural language request
2. **Router** determines which module handles it (Brief, Deck, DAM)
3. **Executor** calls the appropriate API with timeout handling
4. **Results** displayed with action buttons

## Connected Modules

| Module | Purpose | URL |
|--------|---------|-----|
| Brief Engine | Create structured campaign briefs | `os-brief.vercel.app` |
| Campaign Ledger | Track campaign lifecycle | `os-ledger-v3.vercel.app` |
| Light DAM | Search digital assets | `light-dam-v1.vercel.app` |

## Example Queries

**Creating briefs:**
- "Create a brief for EU eSIM launch"
- "New campaign for Q1 brand awareness targeting millennials"
- "Make a brief called Holiday Sale for email and Instagram"

**Checking campaigns:**
- "Show me active campaigns"
- "What's the status of the EU launch?"
- "List all projects"

**Finding assets:**
- "Find hero images for Instagram"
- "Search for travel photos"
- "I need visuals for the EU campaign"

## Architecture

```
User Query
    ↓
Editorial OS (API Route)
    ↓
Router (with 5s timeout)
    ↓
┌───────────┬───────────┬───────────┐
│  Brief    │  Campaign │   Light   │
│  Engine   │   Deck    │    DAM    │
└───────────┴───────────┴───────────┘
    ↓
Results + Actions
```

## The Flow

```
"Create a brief for EU eSIM launch"
    ↓
API Route: POST /api/chat
    ↓
Router: module=brief, intent=create
    ↓
POST brief-engine.vercel.app/api/brief/create (5s timeout)
    ↓
Brief Engine: Creates brief + POSTs to Campaign Deck
    ↓
Campaign Deck: Creates ledger entry (intake)
    ↓
Editorial OS: "✓ Brief created. ✓ Added to Deck."
    ↓
Action buttons: [View Brief] [View in Deck]
```

## Project Structure

```
editorial-os/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # API endpoint for chat
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main chat interface
├── components/
│   ├── ChatInput.tsx         # Message input component
│   ├── ChatMessage.tsx       # Message display component
│   ├── ErrorBoundary.tsx     # Error handling wrapper
│   └── ModuleTabs.tsx        # Module navigation tabs
├── lib/
│   ├── router.ts             # Query routing logic
│   └── types.ts              # TypeScript types
├── .env.example              # Environment variables template
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## This is the Product

Not individual tools. One unified interface.

- **Solopreneur**: "Create a brief for my launch" → Done
- **Marketing team**: "Show active campaigns" → Dashboard
- **Agency**: "Find assets for client X" → Results

All from one chat box.

---

Part of Editorial OS. Built for content operations at any scale.
