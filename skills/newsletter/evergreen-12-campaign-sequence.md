---
name: campaign-sequence-orchestration
description: Designs and executes multi-email campaign sequences that build momentum from teaser through conversion to last-chance. Use when launching time-bound campaigns (seasonal promotions, product launches, events) requiring coordinated email progression.
---

# Campaign Sequence Orchestration

Design and execute multi-email sequences that create narrative arc from awareness to urgency to conversion. Each email builds on previous one, moving subscribers through journey from curiosity to action.

## Input Requirements
- Campaign goal (string: "Whale Season promo," "New product launch," "Event registration," etc.)
- Primary audience segment (Active, At-Risk, New, or mixed)
- Campaign duration (total days from first email to last chance)
- Number of emails (3-5 recommended, rarely >7)
- Conversion goal (purchase, signup, RSVP, booking, etc.)
- Budget/incentive level (if applicable: discount %, free offer, urgency play)
- Content hook or unique angle (what makes this campaign worth opening?)

## Output Artifacts

```markdown
## Campaign Sequence Architecture

### Campaign: [Name]
**Goal:** [Specific conversion: bookings, signups, purchases]
**Duration:** [X days total]
**Emails in sequence:** [3-5]
**Target segment:** [Active, At-Risk, or mixed]

## Email Sequence Breakdown

### Email 1: Teaser / Announcement (Day 0)
**Send time:** [Based on segment + content]
**Subject line:** [Curiosity + clarity]
**Purpose:** Awareness + stop the scroll
**Length:** 200-300 words (short, quick read)
**Content arc:**
- Opening: Hook with emotion or surprise
- Body: What's happening + why now (seasonality, scarcity, relevance)
- CTA: "Learn more" or "See what's new" (soft CTA, curiosity-driven)

**Key elements:**
- Strong visual (hero image)
- Benefit-focused headline (not just feature)
- One clear CTA (avoid multiple links)
- Tone: Intriguing, warm, "heads up"

---

### Email 2: Education / Details (Day 3 or 4)
**Send time:** [Mid-week for best open rates]
**Subject line:** [Specific benefit or answer]
**Purpose:** Build interest + provide details
**Length:** 400-600 words (meaty, informative)
**Content arc:**
- Opening: Reference previous email (continuity)
- Body: Deep dive on details (what, why, how, who)
  - Why this matters to them
  - How it works / what to expect
  - Social proof (testimonials, numbers, results)
  - FOMO-lite (limited spots, time-bound nature)
- CTA: "Reserve now" or "Claim yours" (moderate urgency)

**Key elements:**
- 2-3 benefit bullets
- 1-2 social proof elements
- Clear next step
- Tone: Informative, helpful, slightly warmer

---

### Email 3: Social Proof / FOMO (Day 6-7)
**Send time:** [Same as Email 1 for consistency, or late afternoon]
**Subject line:** [Urgency without manipulation]
**Purpose:** Overcome objections + create momentum
**Length:** 300-400 words
**Content arc:**
- Opening: Urgency signal (spots filling, deadline approaching)
- Body: Social proof (how many have committed, testimonials, results)
  - "X people have already reserved..."
  - Reviews, testimonials, case studies
  - What they'll miss if they don't act
- CTA: "Join them" or "Secure your spot" (clear urgency)

**Key elements:**
- Social proof (numbers, names, quotes)
- Deadline clearly stated (date + time if possible)
- Scarcity signal (limited spots, limited time)
- Tone: Inclusive, exciting, slightly urgent

---

### Email 4: Last Chance / Final Push (Day 9-10, 24 hours before deadline)
**Send time:** [Late afternoon/evening for last-day opens]
**Subject line:** [Direct urgency, no ambiguity]
**Purpose:** Capture fence-sitters + maximize conversions
**Length:** 150-250 words (short, urgent)
**Content arc:**
- Opening: Time/spots urgency (deadline in X hours)
- Body: Benefit + deadline (one final value statement)
- CTA: "Claim now" or "Secure your spot" (high urgency)

**Key elements:**
- Countdown or specific deadline (e.g., "Ends tomorrow at 11:59 PM PT")
- Single, dominant CTA (remove all other links)
- Optional: Final objection removal (FAQs, guarantee)
- Tone: Urgent, respectful, final

---

### Email 5 (Optional): Last-Minute Extension or Win-Back (Day 11, post-deadline)
**Send time:** [Morning after deadline]
**Subject line:** [Second chance or last-last-chance]
**Purpose:** Capture last-minute deciderers + feedback collection
**Length:** 200-300 words
**Content arc:**
- Opening: Deadline passed, but...
- Body: Extension offer (48 more hours) OR feedback request (why didn't you join?)
- CTA: "Claim your spot" (if extension) OR "Tell us why" (if feedback)

**Key elements:**
- Genuine extension or pivot to feedback
- NOT manipulative (don't fake a deadline twice)
- Tone: Understanding, flexible

## Sequence Timing Decision Tree

### For 3-Email Sequence (Tight Timeline):
```
Email 1 (Day 0): Teaser/Announcement (Tuesday)
Email 2 (Day 3): Education/Details (Friday)
Email 3 (Day 6): Last Chance (Monday before deadline)
Deadline: End of Day (Tuesday)
```

### For 4-Email Sequence (Standard):
```
Email 1 (Day 0): Teaser (Tuesday)
Email 2 (Day 3): Education (Friday)
Email 3 (Day 7): Social Proof (Tuesday, one week later)
Email 4 (Day 10): Last Chance (24 hours before deadline)
Deadline: Day 11 end of day
```

### For 5-Email Sequence (Extended Campaign):
```
Email 1 (Day 0): Teaser (Tuesday)
Email 2 (Day 4): Education (Saturday)
Email 3 (Day 7): Social Proof (Tuesday)
Email 4 (Day 10): Last Chance (Friday, 24 hours before)
Email 5 (Day 12): Extension / Win-Back (Monday, post-deadline)
Deadline: Day 11 end of day (extended to Day 13)
```

## Segment-Specific Strategy

### For Active Subscribers (High engagement):
- **Teaser email:** Direct, assume familiarity with brand
- **Education email:** Deeper details, less hand-holding
- **Urgency level:** Moderate (they understand without manipulation)
- **Total sequence:** 3-4 emails over 10 days

### For At-Risk Subscribers (Low engagement):
- **Teaser email:** Strong hook, clear benefit
- **Education email:** More accessible, social proof heavy
- **Urgency level:** Higher (need motivation to act)
- **Total sequence:** 4-5 emails, allow 2 weeks for decisions
- **Bonus:** Add "win-back" angle (e.g., "We miss you—here's an exclusive offer")

### For New Subscribers (Still learning):
- **Teaser email:** Educational + intriguing
- **Education email:** Explain full context (who are we, why this matters)
- **Urgency level:** Light (don't pressure new subscribers)
- **Total sequence:** 3-4 emails over 2 weeks
- **Bonus:** Include brand context and testimonials

## Email Copy Progression Logic

### Teaser Email:
- **Hook:** Sensory detail, surprise, or question
- **Body:** What + When + Why (seasonal context, limited nature)
- **CTA:** Soft, curiosity-driven ("Learn more")
- **Tone:** Intriguing, warm, no pressure

Example opening:
> "Picture this: You're watching grey whales migrate just miles from shore. It's happening again this season—starting this weekend. Here's what's new..."

### Education Email:
- **Hook:** Reference previous email (continuity)
- **Body:** Deep dive (how to participate, what to expect, why it matters)
- **Social proof:** Early testimonials, booking counts, expert endorsement
- **CTA:** Moderate urgency ("Reserve your spot")
- **Tone:** Helpful, informed, slightly more urgent

Example body:
> "Guests who've experienced this tell us it's a bucket-list moment. Over 200 visitors have already booked this season. Here's what makes it special..."

### Social Proof Email:
- **Hook:** Urgency signal ("Spots are filling fast")
- **Body:** Proof (testimonials, numbers, results)
- **CTA:** Clear urgency ("Join the 200+ who've already reserved")
- **Tone:** Inclusive, exciting, FOMO-lite

Example proof:
> "Sarah from San Francisco: 'It was the most magical morning of my trip.'
> Marcus from NYC: 'Worth every penny. Worth clearing your schedule.'
> 203 others have booked for this season."

### Last Chance Email:
- **Hook:** Deadline countdown ("Ends tomorrow at 11:59 PM")
- **Body:** One final value statement (what they'll miss)
- **CTA:** High urgency, single ("Secure your spot now")
- **Tone:** Urgent, respectful, final

Example opening:
> "This ends tomorrow at midnight. If you've been thinking about it—now's the moment."

## Campaign Conversion Framework

### CTA Progression:

| Email | CTA Text | CTA Type | Goal |
|-------|----------|----------|------|
| 1 | "See what's happening" | Learn more (soft) | Awareness |
| 2 | "Reserve your spot" | Action (moderate) | Interest → Intent |
| 3 | "Claim your spot" | Urgency (higher) | Decision |
| 4 | "Secure now" | Conversion (highest) | Action |
| 5 | "Don't miss this extension" | Final chance (very high) | Last chance |

### Objection Handling by Email:

**Email 1:** Establish credibility + excitement
**Email 2:** Provide logistics, address "How does this work?"
**Email 3:** Social proof addresses "Should I trust this?"
**Email 4:** Pricing/guarantee addresses "Is it worth it?"
**Email 5:** Flexibility addresses "I'm unsure"

## Performance Metrics by Email Type

### Teaser Email
- **Target open rate:** 25-35% (lower, it's mysterious)
- **Target click rate:** 2-4% (curiosity click)
- **Success metric:** 15%+ click-through to learn more

### Education Email
- **Target open rate:** 30-40% (building interest)
- **Target click rate:** 3-6% (informed interest)
- **Success metric:** 20%+ conversion intent (bookmarks, shares)

### Social Proof Email
- **Target open rate:** 35-45% (people want to see reviews)
- **Target click rate:** 5-8% (FOMO is real)
- **Success metric:** 10%+ of openers click to book

### Last Chance Email
- **Target open rate:** 40-50% (highest, urgency)
- **Target click rate:** 8-12% (urgency drives action)
- **Success metric:** 15-20% of openers convert

### Win-Back / Extension Email
- **Target open rate:** 20-30% (post-deadline fatigue)
- **Target click rate:** 2-5% (second chance)
- **Success metric:** 5-10% of at-risk subscribers convert

## Subject Line Strategy by Email

### Email 1 (Teaser):
✅ "Grey whale season is here (and it's magical)"
✅ "What's happening off the coast this weekend"
❌ "Big announcement!"
❌ "Don't miss out"

### Email 2 (Education):
✅ "How to see whales + what to expect"
✅ "Why 200+ guests are booking this season"
❌ "More info inside"
❌ "Check this out"

### Email 3 (Social Proof):
✅ "Spots are filling fast (here's what guests are saying)"
✅ "203 visitors booked, places are limited"
❌ "Last call!"
❌ "Act now"

### Email 4 (Last Chance):
✅ "Ends tomorrow: Your whale watching reservation"
✅ "Last 24 hours to book this experience"
❌ "This ends tomorrow!!!"
❌ "FINAL NOTICE"

## Always Do
- Build sequence with clear emotional/logical arc (curiosity → education → FOMO → action)
- Space emails 3-4 days apart (allow time to think, avoid fatigue)
- Maintain consistent voice across all emails (same sender, same personality)
- Escalate urgency gradually (not max urgency from Email 1)
- Include social proof in at least 1 email (testimonials, numbers, authority)
- Provide clear deadline in at least 2 emails (Email 3 + 4)
- Test subject lines per email type (teaser vs. urgency require different hooks)
- Track conversion rate by email (which email drove actual conversion?)
- Segment audience appropriately (Active vs. At-Risk need different sequences)

## Never Do
- Send more than 5 emails in a sequence (fatigue + unsubscribes)
- Use fake deadlines or "limited spots" without truth
- Change CTA mid-sequence (pick primary goal and stick with it)
- Send all emails on same day of week (varies impact)
- Make all emails urgent (urgency loses power if overused)
- Forget to include unsubscribe option (legal requirement)
- End sequence abruptly (always close with clarity, even if deadline passes)
- Ignore segment preferences (active subscribers respond to different triggers)

## Campaign Success Checklist

### Before Launch:
- [ ] Campaign goal is specific (not "drive awareness," but "30 bookings")
- [ ] Sequence is 3-5 emails (not 7+)
- [ ] Emails are spaced 3-4 days apart
- [ ] Subject lines vary by email type (teaser, education, urgency)
- [ ] CTAs escalate in urgency (soft → moderate → high)
- [ ] Deadline is real and clearly stated
- [ ] At least 1 email includes social proof
- [ ] Segment strategy matches audience (Active vs. At-Risk)

### After Launch:
- [ ] Email 1 open rate 25-35%
- [ ] Email 2 open rate 30-40% (higher, building interest)
- [ ] Email 3 open rate 35-45% (peak, urgency)
- [ ] Email 4 open rate 40-50% (highest, last chance)
- [ ] Overall sequence conversion rate >5% of sent (minimum viable)
- [ ] Email 4 (Last Chance) drives 30-40% of conversions
- [ ] Social proof email drives engagement lift

## Integration with Other Skills

### With Newsletter Orchestration:
- **Campaign sequences complement weekly newsletters**
- Example: Weekly educational content → Campaign sequence when promoting seasonal offer
- **Same orchestration approach:** Validate topic → Draft → Structure → Polish → Send

### With Subscriber Segmentation:
- **Different sequences for different segments**
  - Active: 3-4 emails, moderate urgency
  - At-Risk: 4-5 emails, higher urgency, win-back angle
  - New: 3-4 emails, educational focus, light urgency

### With Send-Time Optimization:
- **Apply segment-specific send times to campaign emails**
  - Email 1: Tuesday 9 AM for Active subscribers
  - Email 4: Sunday 6 PM for At-Risk subscribers (lower competition)

### With Performance Learning:
- **Track campaign metrics separately**
  - Which email drove conversion?
  - What subject line format worked best?
  - Did urgency escalation work?
- **Log learnings for next campaign**

## Campaign Examples

### Example 1: Seasonal Whale Watching (3-Email, 10-Day)
```
Email 1 (Day 0, Tuesday 9 AM): "Grey whale season starts this weekend"
  → Hook: Sensory + timing
  → CTA: "Learn what's happening"
  
Email 2 (Day 3, Friday 6 PM): "See whales + here's what guests expect"
  → Hook: Logistics + social proof
  → CTA: "Reserve your morning"
  
Email 3 (Day 10, Friday 9 AM): "Ends tomorrow: Your whale watching spot"
  → Hook: Deadline countdown
  → CTA: "Secure now"

Deadline: Saturday midnight
Expected conversion: 5-8% of sent
```

### Example 2: New Product Launch (4-Email, 14-Day)
```
Email 1 (Day 0, Tuesday): "Something new is launching"
  → Hook: Teaser
  → CTA: "See what's coming"
  
Email 2 (Day 4, Saturday): "Here's what we built + why"
  → Hook: Education + benefit
  → CTA: "Be first to try"
  
Email 3 (Day 10, Friday): "Insiders are already loving it"
  → Hook: Social proof
  → CTA: "Get yours"
  
Email 4 (Day 14, Tuesday): "Ends this week"
  → Hook: Deadline
  → CTA: "Claim now"

Deadline: End of week
Expected conversion: 8-12% of sent
```

## Cross-Skill Dependencies
- **Works alongside:** `newsletter-orchestration-jam-lab` (campaigns ≠ weekly newsletters)
- **Uses:** `subscriber-lifecycle-segmentation` (different sequences for segments)
- **Uses:** `subject-line-craft` (subject lines per email vary by type)
- **Uses:** `send-time-optimization` (segment-specific send times)
- **Feeds into:** `newsletter-performance-learning` (track campaign metrics separately)
- **Updates:** Historical Files (campaign conversion rates, what worked)
