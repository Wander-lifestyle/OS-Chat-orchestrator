# Editorial OS: The Canonical Document

Version 1.0 | January 15, 2026

This is the source of truth for Editorial OS: what it is, how it works, how to
build it, and how to sell it.

## What is Editorial OS?

Editorial OS is an AI-first operating system for content and communications
teams.

It is NOT:
- A tool (email builder, social scheduler, DAM)
- A feature set
- A template library
- A workflow diagram

It IS:
- An AI team (agents with roles, responsibilities, knowledge)
- Connected to real tools (Vercel apps, APIs, orchestrated via MCP)
- Autonomous and learning (Execute -> Track -> Analyze -> Learn -> Report loops)
- Vendorizable and customizable (ship base OS, add specialized agents per
  client)

Core insight: Your customers do not need better tools. They need a team that
orchestrates tools, learns what works, and executes autonomously.

## The Architecture

### Three Layers

Layer 1: Agents (Intelligence + Orchestration)
- CLAUDE.md (Team Lead / Orchestrator)
- brief-specialist.md (Campaign Strategist)
- newsletter-agent.md (Email Marketing Manager)
- social-engine.md (Social Media Lead)
- dam-agent.md (Asset Librarian)
- [Custom agents per client] (Domain-specific roles)

Layer 2: MCP Protocol (The Bridge)
- brief-mcp-route.ts (Brief Engine <-> Claude)
- light-dam-mcp-route.ts (DAM <-> Claude)
- ledger-mcp-route.ts (Ledger <-> Claude)
- [Custom MCP routes] (Any Vercel app)
- .claude/mcp.json (Registration)

Layer 3: Tools (Stateless Infrastructure)
- os-brief (Brief Engine, Vercel)
- light-dam (Asset Management, Vercel)
- campaign-ledger (State Tracking, Vercel)
- beehiiv (Newsletter Execution, External API)
- buffer (Social Scheduling, External API)
- [Customer integrations] (Notion, Slack, Salesforce, etc.)

The MCP Protocol is the genius: It converts stateless Vercel tools into
Claude-native capabilities.

## How It Works: The Campaign Loop

User says:

```
"Launch campaign for Europe eSIM with newsletter and social"
```

What happens (automatically):

1. CLAUDE.md reads routing rules.
   - Identifies: multi-agent task (Brief -> Newsletter + Social)
   - Routes to brief-specialist first
2. brief-specialist executes.
3. brief-specialist (Claude Code) calls MCP:
   ```
   calls brief-engine/api/mcp via MCP
   createbrief("Europe eSIM", channels: ["email", "social"], ...)
   Returns: BRF-2026-001, ledgerid: LED-xyz
   ```
4. CLAUDE hands off to dam-agent.
5. dam-agent (Claude Code) calls MCP:
   ```
   calls light-dam/api/mcp via MCP
   searchassets(query: "Europe travel lifestyle", channels: ["email", "social"])
   Returns: 5 recommended images with usage rights
   ```
6. CLAUDE calls newsletter-agent and social-engine in parallel.
7. newsletter-agent:
   ```
   reads brief from campaign-ledger
   loads learned patterns (Question subjects: +23% opens, etc.)
   calls beehiiv/api (createPost, schedule for Tuesday 8am)
   updates ledger with status: scheduled
   ```
   social-engine:
   ```
   reads brief from campaign-ledger
   generates 2-week calendar (40 posts across X, LinkedIn, Instagram)
   calls buffer/api (schedulePost x 40)
   updates ledger with status: scheduled
   ```
8. CLAUDE reports back:
   ```
   Brief finalized: BRF-2026-001
   Newsletter: Scheduled Tuesday 8am (Beehiiv link)
   Social: 40 posts scheduled (Buffer calendar)
   Next steps:
   - Approve newsletter
   - Review social calendar
   - I'll track performance and send VP report after send
   ```
9. 48 hours later (automatic).
10. newsletter-agent detects: status=sent and sentat > 48hr ago
   ```
   pulls performance from beehiiv/api
   compares to historical benchmarks
   identifies patterns (Question subject: +11% vs avg)
   updates learned-patterns
   generates VP report (metrics, wins, recommendations)
   ```
11. Result: One user command -> entire campaign orchestrated, tracked,
    analyzed, learned from, reported on.

## The Five Loops (How Agents Learn)

Every agent implements these five loops:

### Loop 1: EXECUTE
- Input: Brief + learned patterns
- Action: Create content, schedule, send
- Output: Scheduled status, artifact ID

### Loop 2: TRACK
- Trigger: 48hr after execution
- Action: Pull performance from source (Beehiiv, Buffer, etc.)
- Output: Store metrics in Ledger

### Loop 3: ANALYZE
- Trigger: After tracking
- Action: Compare this campaign vs historical (12 previous)
- Output: What worked? What did not? Patterns detected?

### Loop 4: LEARN
- Trigger: After analysis
- Action: Update learned-patterns with high-confidence rules
- Output: Patterns feed into next EXECUTE loop

Example: "Question subjects: +23% open rate (12 samples, high confidence)"

### Loop 5: REPORT
- Trigger: Weekly or on-demand
- Action: Aggregate metrics, generate executive summary
- Output: VP-ready brief with key metrics, wins, recommendations

This is what turns "tool" into "team member." Agents do not just execute; they
improve.

## The Delivery Model: Levels 1-5

You do not sell "Editorial OS" on day one. You build trust progressively.

### Level 1: Tools (Foundation)
- What customer sees: Organized, powerful tools
- Time to build: 1 week (already done)
- Demo: "Here's Brief Engine, DAM, Ledger - one interface for your content OS"

### Level 2: Orchestrated Tools
- What customer sees: Tools talking to each other via CLAUDE
- Time to build: 1 week (MCP wiring)
- Demo: "Brief in -> routed to right tool -> results back"

### Level 3: Simple Track (Single Workflow)
- What customer sees: End-to-end path (Brief -> Newsletter -> Output)
- Time to build: 2 weeks (newsletter-agent without learning)
- Demo: "Brief in -> newsletter draft -> scheduled"
- Price: $999/mo (base service)

### Level 4: Connected Track (Integrated with Real Tools)
- What customer sees: Briefs scheduled in their real tools (Beehiiv, Buffer)
- Time to build: 2 weeks (API integrations)
- Demo: "Brief in -> scheduled in your Beehiiv -> Slack notification"
- Price: $1,999/mo

### Level 5: Autonomous Agent (Full Five Loops)
- What customer sees: Campaign runs autonomously, learns over time, reports
  weekly
- Time to build: 2 weeks (tracking + analysis + learning loops)
- Demo: "Hand off brief -> agents execute, track, analyze, learn -> VP report"
- Price: $5,000-10,000/mo

Progression builds trust: By Level 4, they are comfortable with Level 5
autonomy.

## The Customization Model: Additive, Not From Scratch

For any client:

### Week 1: Deploy base OS
- os-brief + brief-specialist
- light-dam + dam-agent
- campaign-ledger + orchestrator
- newsletter-agent + social-engine
- Fully functional Editorial OS in 1 week

### Week 2: Add ONE specialized agent

If client = Internal Comms brand:
- Create internal-comms-agent.md
- Add to CLAUDE.md routing rules
- MCP wire to their tools (Slack, Notion, etc.)
- Ready to use

If client = Ecommerce brand:
- Create product-agent.md
- MCP wire to their inventory (Shopify, custom)
- Now agents can auto-generate product descriptions, recommendations

If client = Recipe brand:
- Create recipe-agent.md
- MCP wire to recipe database
- Now agents generate seasonal content from recipe data

### Week 3+: Add specialized tools as needed

Custom Notion integration?
- Write notion-mcp-route.ts, add to MCP config

Custom Slack workflow?
- Write slack-mcp-route.ts

Custom CRM sync?
- Write crm-mcp-route.ts

Each is just: Vercel endpoint + /api/mcp route + reference in agent.

Result: You scale without rebuilding. Base OS + specialized agents =
customer-specific team.

## Competitive Moat

Why Editorial OS is defensible:

1. Composability (like Maxicor)
   - Base agents + specialized agents + custom tools
   - No two customers identical, no two easy to replicate
2. Learned Patterns (like Maxicor's data advantage)
   - Your agents learn what works for each customer
   - That knowledge is proprietary IP
   - Customers stay because your agents improve over time
3. Multi-domain Orchestration
   - No other tool coordinates Brief -> Newsletter + Social + DAM simultaneously
   - No other tool has learned patterns across domains
   - Switching costs are real (customers lose their learned models)
4. Human Trust
   - Levels 1-4 prove the system works before autonomy
   - By Level 5, customers trust agents with their brand
   - Trust is not easily replicated

## Go-to-Market

### Positioning

> "Editorial OS is the AI team for your content. It executes, learns, and
> improves autonomously."

### Sales Motion

1. Demo Level 3 (simple track) to newsletter creators/agencies
   - Proof: "Saves 2 hours per newsletter, better performance"
2. Upgrade to Level 4 (connected to their tools)
   - Proof: "Now scheduled in Beehiiv automatically"
3. Unlock Level 5 (autonomous agent)
   - Proof: "Weekly VP report shows learned patterns improving"

### Pricing Ladder

- Level 3: $999/mo (base service, 5-10 customers)
- Level 4: $1,999/mo (integrated, same 5-10 customers)
- Level 5: $5,000/mo (autonomous, 2-3 early adopters)
- Custom: $10,000+/mo (specialized agents + tools, enterprise)

Year 1 target: 10 Level 3-4 customers, 3 Level 5 pilots -> $50-80k MRR

## What You Ship (30-Day Roadmap)

### Week 1 (This Week)
- Deploy os-brief with MCP route
- Register brief-engine MCP in Claude Code
- Install brief-specialist agent
- Test: @brief-specialist create brief for Europe eSIM launch

### Week 2
- Deploy light-dam with MCP route
- Deploy campaign-ledger with MCP route
- Install dam-agent + ledger agent
- Wire newsletter-agent to read/write ledger

### Week 3
- Deploy newsletter-agent with Beehiiv integration
- Deploy social-engine with Buffer integration
- Run full scenario: Brief -> Newsletter + Social -> Scheduled
- Record as internal demo

### Week 4
- Add learning loops (Track + Analyze + Learn)
- Generate first VP report
- Find first customer POC

## Key Numbers

| Metric | Today | 30 Days | 90 Days |
| --- | --- | --- | --- |
| Agents deployed | 5 | 5 | 7-8 |
| Levels shipped | 0 | 3 | 5 |
| Paying customers | 0 | 1 | 5-10 |
| MRR | $0 | $1k | $50k |
| Learned patterns | 0 | 50 | 500+ |

## One Thing to Remember

This is not about building better tools. This is about building a team.

A tool solves one problem. A team solves many problems, learns, adapts, and
improves.

Your competitive advantage is not that Brief Engine is better than Notion, or
that your newsletter agent is better than a template library. Your advantage is
that your agents:

- Coordinate across domains
- Learn what works (and apply it automatically)
- Improve with every campaign
- Can be customized without being rebuilt

That is Editorial OS.

## Questions This Document Answers

Q: Is this like Maxicor?
A: Yes. API platform + vertical orchestration + composable customer workflows.
Same moat (composability + data advantage).

Q: How do I scale to many customers without building a new "team" each time?
A: Base OS (5 agents) + specialized agents per domain (add 1 per customer, week
2) + custom tools (add as needed, 1-2 hours each). You are additive, never from
scratch.

Q: How do agents learn?
A: Five-loop pattern. Execute -> Track (48hr after) -> Analyze (vs. historical)
-> Learn (update patterns) -> Report (weekly). Each loop feeds back into next
EXECUTE.

Q: How do I sell this?
A: Levels 1-5. Do not sell autonomy on day one. Sell tools -> coordination ->
simple workflow -> integrated workflow -> autonomy. Trust builds at each level.

Q: What is the moat?
A: Composability (no two customers same), learned patterns (proprietary, improve
over time), multi-domain coordination (no one else does it), and human trust
(takes time to build, hard to replicate).

Q: What do I build in the next 30 days?
A: MCP wiring + agents -> full scenario demo -> first customer POC. That is it.
Ship the base OS, then customize from there.

This is your source of truth. Refer to it. Build from it. Sell from it.
