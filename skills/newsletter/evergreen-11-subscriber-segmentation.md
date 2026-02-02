---
name: subscriber-lifecycle-segmentation
description: Defines subscriber segments and lifecycle flows based on engagement patterns, behavior data, and conversion goals. Use when setting up or refining audience segmentation strategy for targeted newsletter campaigns.
---

# Subscriber Lifecycle & Segmentation

Analyze subscriber data to create meaningful segments and design lifecycle flows that move readers from awareness to engagement to conversion. Every segment should have clear criteria, content needs, and success metrics.

## Input Requirements
- Total subscriber count (number)
- Engagement data: open rates, click rates, reply volume by cohort
- Subscriber sources (signup form, lead magnet, referral, etc.)
- Conversion goals (purchase, community join, referral, content consumption)
- Current sending frequency and cadence
- ESP capabilities (Beehiiv, Mailchimp, Klaviyo, etc.)

## Output Artifacts

```markdown
## Segment Definitions

### Active Subscribers
**Criteria:** Opened 3+ of last 5 newsletters OR clicked link in last 30 days
**Size:** [X subscribers, Y% of list]
**Content needs:** Regular cadence, deeper topics, exclusive content
**Send frequency:** Weekly (maintain engagement)

### Engaged but Quiet
**Criteria:** Opens regularly but low click/reply rate
**Size:** [X subscribers, Y% of list]
**Content needs:** More CTAs, easier engagement opportunities, polls/questions
**Send frequency:** Weekly (with engagement prompts)

### At-Risk
**Criteria:** Opened 1-2 of last 5 newsletters, declining engagement trend
**Size:** [X subscribers, Y% of list]
**Content needs:** Re-engagement hooks, "we miss you" content, value reminders
**Send frequency:** Reduce to bi-weekly + targeted win-back sequence

### Lapsed
**Criteria:** 0 opens in last 5 newsletters (30+ days)
**Size:** [X subscribers, Y% of list]
**Content needs:** Win-back campaign, survey, content preference check
**Send frequency:** Pause regular sends, trigger win-back flow

### New Subscribers
**Criteria:** Joined in last 30 days
**Size:** [X subscribers, Y% of list]
**Content needs:** Welcome series, brand introduction, expectation setting
**Send frequency:** Welcome flow (days 1, 3, 7, 14), then regular cadence

## Lifecycle Flows

### Welcome Flow (New Subscribers)
**Email 1 (Day 0):** Welcome + what to expect + founder story
**Email 2 (Day 3):** Best-of archive + core content pillars
**Email 3 (Day 7):** Community invitation + how to get most value
**Email 4 (Day 14):** Transition to regular newsletter + ask for preferences

**Goal:** 60%+ open rate on Email 1, 40%+ on Email 4
**Success metric:** 70%+ remain engaged after 30 days

### Nurture Flow (Active → Engaged)
**Ongoing:** Weekly newsletter with clear CTAs
**Monthly:** Exclusive content for engaged readers
**Quarterly:** Feedback survey + content direction input

**Goal:** Maintain 35%+ open rate, 5%+ click rate
**Success metric:** 80%+ retention after 90 days

### Re-Engagement Flow (At-Risk → Active)
**Email 1 (Trigger: 2 weeks no open):** "We noticed you've been quiet" + value reminder
**Email 2 (3 days later if no open):** Best recent content + preference update option
**Email 3 (1 week later if no open):** Final check-in + easy unsubscribe option

**Goal:** 15-20% re-activation rate
**Success metric:** Prevented churn for 15%+ of at-risk segment

### Win-Back Flow (Lapsed → Active or Clean Exit)
**Email 1 (Trigger: 30+ days no open):** "We miss you" + survey (what changed?)
**Email 2 (1 week later if no response):** Special content offer + last chance
**Email 3 (1 week later if no response):** Graceful offboard + clean unsubscribe

**Goal:** 8-12% win-back rate
**Success metric:** Clean list (remove truly unengaged, re-activate some)

## Segment-Specific Content Strategy

### For Active Subscribers
- **Tone:** Insider, confident, assumes familiarity
- **Content depth:** Deeper techniques, advanced tips, cultural stories
- **CTAs:** Reply with questions, share with friend, join community
- **Frequency:** Maintain weekly (they expect it)

### For At-Risk Subscribers
- **Tone:** Warm check-in, value reminder, low-pressure
- **Content depth:** Quick wins, practical tips, "greatest hits"
- **CTAs:** One-click engagement (poll, simple reply), preference update
- **Frequency:** Reduce to bi-weekly (less pressure) + targeted win-back

### For New Subscribers
- **Tone:** Welcoming, orienting, expectation-setting
- **Content depth:** Introductory, foundational, "start here" content
- **CTAs:** Set preferences, explore archive, introduce yourself
- **Frequency:** Structured welcome flow, then weekly

## Send Cadence Recommendations

### By Segment
- **Active:** Weekly, consistent day/time
- **Engaged but Quiet:** Weekly with stronger CTAs
- **At-Risk:** Bi-weekly regular + triggered re-engagement
- **Lapsed:** Pause regular, trigger win-back flow
- **New:** Welcome flow (4 emails over 14 days), then weekly

### By Content Type
- **Educational (technique/ingredient):** Mid-week (Tuesday-Wednesday)
- **Recipe/Weekend project:** Thursday-Friday
- **Community/engagement:** Monday (start of week energy)
- **Win-back/re-engagement:** Sunday evening (lower inbox competition)

## Segmentation Decision Trees

### When to Create New Segment:
```
IS there a distinct behavior pattern?
  → YES: Does it require different content or cadence?
    → YES: Create segment
    → NO: Track as sub-group within existing segment
  → NO: Keep in broader segment
```

### When to Trigger Lifecycle Flow:
```
HAS subscriber met segment criteria for [X] days?
  → Active → Engaged: Immediate (welcome flow on signup)
  → Engaged → At-Risk: 14 days (2 weeks declining engagement)
  → At-Risk → Lapsed: 30 days (1 month no opens)
```

### When to Remove from List:
```
HAS subscriber completed win-back flow with no engagement?
  → YES: Remove after 60 days total inactivity
  → NO: Keep in lapsed segment, try again in 90 days

EXCEPTION: Never remove if:
  - Subscriber joined in last 90 days (still in consideration phase)
  - Subscriber has purchased/converted (moved to customer segment)
```

## Always Do
- Define segments based on observable behavior (opens, clicks, replies)
- Create clear criteria with specific thresholds (not vague "low engagement")
- Design lifecycle flows with specific triggers and timelines
- Assign each segment a content strategy and cadence
- Set success metrics for each flow (what does "working" look like?)
- Review segment health monthly (size, engagement trends)
- Test segment assumptions (are at-risk subscribers actually different?)
- Make unsubscribe easy at every stage (clean list > vanity metrics)

## Never Do
- Create segments without clear behavioral criteria
- Over-segment (too many tiny segments = operational complexity)
- Use demographic data alone (behavior > demographics for email)
- Send same content/cadence to all segments
- Ignore lapsed subscribers forever (win-back or remove)
- Remove subscribers too quickly (give flows time to work)
- Penalize new subscribers for low engagement (they're still learning)
- Keep truly unengaged subscribers to inflate list size

## Segment Health Metrics (Track Monthly)

### Overall List Health
- **List growth rate:** Net new subscribers - unsubscribes
- **Engagement rate:** % of list opening regularly (active + engaged segments)
- **At-risk rate:** % trending toward lapsed (early warning)
- **Churn rate:** % moving from engaged → lapsed

### Segment Distribution (Healthy Newsletter)
- **Active:** 30-40% of list
- **Engaged but Quiet:** 20-30% of list
- **At-Risk:** 10-15% of list (acceptable, manageable)
- **Lapsed:** 10-20% of list (needs attention if >20%)
- **New:** 5-10% of list (depends on growth rate)

### Flow Performance
- **Welcome flow:** 60%+ Email 1 open, 70%+ stay active after 30 days
- **Re-engagement flow:** 15-20% move from at-risk → active
- **Win-back flow:** 8-12% move from lapsed → active

## ESP-Specific Implementation Notes

### Beehiiv
- Segment by engagement score (built-in metric)
- Use automations for welcome and win-back flows
- Tag subscribers by lifecycle stage
- Export segment data monthly for analysis

### Mailchimp
- Use "Groups" for manual segment assignment
- Use "Segments" for behavioral criteria (opens, clicks)
- Automate welcome series via Customer Journeys
- Monitor engagement score (built-in)

### Klaviyo
- Create dynamic segments based on properties + events
- Use flows for lifecycle automation (welcome, win-back)
- Track custom events (reply, forward, specific link clicks)
- More advanced segmentation (ecommerce-focused)

## Integration with Newsletter Production

### Before Writing Newsletter:
- Check: Which segments are receiving this newsletter?
- Adjust: Tone, depth, CTAs based on segment needs
- Personalize: Subject line or opening if multi-segment send

### After Publishing Newsletter:
- Track: Segment-specific performance (which segments engaged most?)
- Learn: Did at-risk subscribers respond to different content?
- Adjust: Next newsletter strategy based on segment response

### Monthly Segment Review:
- Analyze: Which segments are growing/shrinking?
- Identify: Content topics that moved at-risk → active
- Refine: Segment criteria if behavior patterns shift

## Cross-Skill Dependencies
- **Feeds into:** `newsletter-orchestration-jam-lab` (segment-specific content decisions)
- **Feeds into:** `subject-line-craft` (segment-appropriate subject lines)
- **Feeds into:** `send-time-optimization` (cadence by segment)
- **Receives from:** `newsletter-performance-learning` (segment engagement data)
- **Updates:** Historical Files (segment definitions, flow performance)

## Performance Indicators (Learn from Historical Files)
- Segment size trends over time (growing/shrinking segments)
- Flow completion rates (how many finish welcome series?)
- Reactivation success rates (at-risk → active, lapsed → active)
- Churn patterns (when/why do subscribers leave?)
