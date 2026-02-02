---
name: newsletter-orchestration-jam-lab
description: Master orchestration skill that coordinates all newsletter production skills in proper sequence with validation gates. Ensures coherent end-to-end newsletter creation for Jam Lab with quality control at each stage.
---

# Newsletter Orchestration – Jam Lab

Execute newsletter production as a coordinated workflow across specialized skills. Validate outputs at each stage before proceeding. Surface conflicts and quality issues for human review when gates fail.

## Input Requirements
- Newsletter topic or recipe concept (string)
- Seasonal context or timing (string, e.g., "early March, citrus season")
- Target publication date (date)
- Previous newsletter IDs for context (optional, array of Historical Files relations)
- Performance goals (optional, defaults: open rate >30%, engagement rate >5%)

## Execution Sequence

### Stage 1: Topic Development
**Skill:** `jam-lab-content-sourcing`
- Input: Raw topic idea + seasonal context
- Output: Refined topic with cultural context, ingredient focus, technique opportunity
- **Gate Check:** Does topic align with seasonal availability and cultural authenticity?

### Stage 2: Audience Validation  
**Skill:** `jam-lab-audience-lens`
- Input: Refined topic from Stage 1
- Output: Audience appropriateness assessment (skill level, family context, practicality)
- **Gate Check:** Is this achievable for intermediate home cooks? Are substitutions possible?
- **STOP if:** Topic requires restaurant equipment, >90min active time, or unobtainable ingredients without alternatives

### Stage 3: Voice & Narrative Draft
**Skill:** `jam-lab-brand-voice`
- Input: Validated topic + audience context
- Output: Draft newsletter body in Amisha's voice (markdown, unedited)
- **Gate Check:** Does voice feel authentic? Are cultural elements grounded in personal experience?

### Stage 4: Structure Organization
**Skill:** `newsletter-structure-flow`
- Input: Draft body copy
- Output: Organized sections with clear beginning/middle/end, proper transitions
- **Gate Check:** Single primary focus maintained? Logical paragraph flow?

### Stage 5: Content Prioritization
**Skill:** `content-prioritization-focus`
- Input: Structured draft
- Output: Trimmed content (target 400-800 words), secondary material removed or condensed
- **Gate Check:** Word count in range? Every paragraph serves primary theme?
- **Decision Tree:**
  - IF >800 words → trim secondary details, cut tangents
  - IF <400 words → expand with sensory detail, cultural context, or practical tips
  - IF 400-800 words → proceed

### Stage 6: Editorial Quality Control
**Skill:** `editorial-clarity-quality-control`
- Input: Prioritized draft
- Output: Edited copy (grammar, clarity, fact-check, voice consistency)
- **Gate Check:** Zero factual errors? Consistent voice? Reading level appropriate?
- **STOP if:** Unverified claims present, tonal shifts detected, or jargon unexplained

### Stage 7: Engagement & Closure
**Skill:** `reader-engagement-closure`
- Input: Edited body copy
- Output: Completed draft with warm closing, clear next step or reflection
- **Gate Check:** Does ending resolve opening tension? Natural conversational tone maintained?

### Stage 8: Subject Line Generation
**Skill:** `subject-line-craft`
- Input: Final newsletter draft
- Output: 3 subject line variants (A/B/C) with rationale for each
- **Gate Check:** All variants accurately represent content? No clickbait?

### Stage 9: Format Validation
**Skill:** `jam-lab-newsletter-format`
- Input: Complete draft + subject lines
- Output: Final format-checked newsletter ready for Beehiiv
- **Gate Check:** Proper structure? Personal opening? Complete closure? 400-800 words?

## Conflict Resolution Protocol
If any skill flags a conflict (e.g., voice requires complexity but audience requires simplicity):

1. Apply **Priority Hierarchy:**
   - Brand Voice (never compromise Amisha's authenticity)
   - Audience Lens (never lose the reader)
   - Quality Control (never ship errors)
   - Engagement (never leave readers hanging)
   - Structure & Format (flexible if higher priorities require)

2. If unresolvable → **Flag for human review** with:
   - Conflicting skills identified
   - Specific tension described
   - Recommendation based on priority hierarchy

## Output Artifacts

### Primary Outputs
```markdown
## Newsletter Draft
[Complete markdown-formatted newsletter, 400-800 words]

## Subject Line Variants
A: [25-50 characters]
B: [25-50 characters]  
C: [25-50 characters]

## Rationale
[Why each subject line was chosen, which might perform best]
```

### Metadata Bundle
```yaml
word_count: [number]
primary_focus: [string, e.g., "weekend squash curry"]
cultural_references: [array]
spices_featured: [array]
sensory_word_count: [number]
skill_level_required: [string: beginner/intermediate/advanced]
active_cooking_time: [string]
```

### Quality Report
```markdown
## Gates Passed: [X/9]

- Stage 1 (Content Sourcing): ✅/❌
- Stage 2 (Audience Validation): ✅/❌
- Stage 3 (Brand Voice): ✅/❌
- Stage 4 (Structure): ✅/❌
- Stage 5 (Prioritization): ✅/❌
- Stage 6 (Quality Control): ✅/❌
- Stage 7 (Engagement): ✅/❌
- Stage 8 (Subject Lines): ✅/❌
- Stage 9 (Format): ✅/❌

## Issues Flagged for Human Review:
[List any STOP conditions triggered or unresolved conflicts]
```

## Performance Tracking (Post-Publish)
After newsletter is sent, log to Historical Files:
- Newsletter ID (relation → Editorial Outputs)
- Performance metrics: open rate, click rate, reply volume, unsubscribe rate
- What worked: patterns in subject line, voice, topic
- What to adjust: recommendations for next newsletter

## Never Do
- Skip gate checks to save time
- Proceed if STOP condition triggered
- Merge multiple unrelated topics into one newsletter
- Override brand voice for "performance optimization"
- Ship newsletter with unresolved quality flags

## Always Do
- Execute skills in sequence (no skipping)
- Validate at each gate before proceeding
- Surface conflicts immediately with context
- Maintain metadata bundle for learning
- Log performance post-publish for continuous improvement
