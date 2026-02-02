---
name: editorial-conflict-resolver
description: Resolves conflicts when multiple skills produce contradictory guidance during newsletter production. Use when orchestration detects misalignments between skills. Applies priority hierarchy and escalates unresolvable conflicts to human editor.
---

# Editorial Conflict Resolver

When skills produce conflicting guidance during orchestration, apply prioritization rules to resolve. Surface unresolvable conflicts to human editor with full context. Maintain editorial integrity while enabling progress.

## Priority Hierarchy (Jam Lab)

### Tier 1: Brand Voice (Highest Priority)
**Skill:** `jam-lab-brand-voice`

**Why highest:** Authenticity is non-negotiable. If Amisha's voice is compromised, newsletter loses its core value and reader trust.

**Never compromise:**
- First-person perspective
- Personal/family stories
- Cultural authenticity grounded in lived experience
- Warm + confident tone

**When it wins:**
- Voice requires complexity but audience lens suggests simplification → Find middle path (complex topic, simple explanation in warm voice)
- Voice requires longer personal story but length constraint → Keep story, trim other sections

### Tier 2: Audience Lens (Protect the Reader)
**Skill:** `jam-lab-audience-lens`

**Why critical:** If readers can't understand or execute content, newsletter fails its purpose. Never lose the reader.

**Never compromise:**
- Skill level appropriateness (intermediate home cooks)
- Ingredient accessibility (provide substitutions)
- Practical achievability (real kitchens, real time constraints)

**When it wins:**
- Content complexity risks losing readers → Simplify or scaffold heavily
- Specialty ingredients without alternatives → Flag as ⚠️ and require substitution guidance
- Technique too advanced → Reject topic or break into simpler steps

### Tier 3: Quality Control (Never Ship Errors)
**Skill:** `editorial-clarity-quality-control`

**Why critical:** Errors destroy trust. Factual accuracy and professionalism are non-negotiable.

**Never compromise:**
- Factual accuracy (cooking times, temperatures, ingredient names)
- Grammar and spelling correctness
- Clear, unambiguous language
- Voice consistency

### Tier 4: Engagement & Closure (Never Leave Readers Hanging)
**Skill:** `reader-engagement-closure`

**Why important:** Readers invested time; they deserve resolution and next step.

**Never compromise:**
- Callback to opening promise
- Clear next step (action/reflection/connection)
- Warm, complete sign-off

### Tier 5: Structure & Format (Flexible If Higher Priorities Require)
**Skills:** `newsletter-structure-flow`, `content-prioritization-focus`, `jam-lab-newsletter-format`

**Why flexible:** Structure serves content, voice, and audience—not vice versa. Can be adjusted if higher priorities demand it.

**Can be compromised:**
- Ideal word count (500-650) can stretch to 750 if voice/audience require
- Section count (2-3) can adjust based on content needs
- Paragraph length guidelines can flex for narrative flow

## Conflict Types & Resolution

### Type 1: Philosophical Conflict (Voice vs. Audience)
**Example:** Brand voice wants long, winding family story; audience lens says it's too complex.

**Resolution:**
- Apply Priority Hierarchy: Brand Voice (Tier 1) > Audience Lens (Tier 2)
- BUT: Find MIDDLE PATH
  - Keep family story (preserve authenticity)
  - Simplify language and structure (maintain accessibility)
  - Scaffold with clear transitions
- **Human review required:** ❌ (middle path found)

### Type 2: Technical Conflict (Quality vs. Voice)
**Example:** Quality control flags conversational fragments as grammar errors; voice insists on conversational tone.

**Resolution:**
- Identify fragment type:
  - Intentional for voice? → Allow it
  - Unintentional error? → Fix it
- Brand Voice (Tier 1) wins if intentional
- Quality Control (Tier 3) wins if error
- **Human review required:** ❌ (clear rule application)

### Type 3: Impossible Tradeoff (No Clear Winner)
**Example:** Topic requires specialty ingredient (audience ⚠️) AND authentic cultural story (voice ✅), but substitution undermines authenticity.

**Resolution:**
- Both are high priority, genuine tension exists
- No clear middle path
- **Escalate to human**
- **Options for human:**
  - Option A: Frame as aspirational ("Worth seeking out") + provide best-possible substitute
  - Option B: Save topic for future, choose different topic now
- **Recommendation:** Option A (serve both authenticity and accessibility with honest framing)
- **Human review required:** ✅

## Always Do
- Identify conflicts immediately when skills flag misalignments
- Apply priority hierarchy transparently (state reasoning)
- Attempt middle path before escalating (creative solutions preferred)
- Provide full context if human review needed
- Document resolution decision for learning
- Proceed only when conflict is resolved or escalated

## Never Do
- Ignore conflicts or "split the difference" without reasoning
- Override high-priority skills (Tiers 1-3) for convenience
- Escalate to human for conflicts that can be resolved by hierarchy
- Fail to explain rationale for resolution decision
- Proceed with unresolved conflicts (causes downstream issues)
- Compromise core principles (authenticity, accessibility, accuracy)

## Cross-Skill Dependencies
- **Called by:** `newsletter-orchestration-jam-lab` when conflicts detected
- **Informs:** All skills (resolution decisions guide execution)
- **Escalates to:** Human editor (when unresolvable)
- **Logs to:** Historical Files (conflict patterns inform future skill adjustments)
