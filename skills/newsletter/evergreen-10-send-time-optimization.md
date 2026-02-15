---
name: send-time-optimization
description: Recommends optimal send times and cadence based on historical performance data, subscriber behavior patterns, and segment-specific engagement windows. Use when scheduling newsletters or refining send strategy.
---

# Send Time Optimization

Analyze historical send-time performance and subscriber behavior to recommend optimal send windows, cadence, and timing strategy per segment. Maximize open and engagement rates by sending when subscribers are most likely to read.

## Input Requirements
- Historical send data: date, time, day of week for past 10-20 newsletters
- Performance by send time: open rates, click rates, reply volume by send window
- Subscriber timezone distribution (if available)
- Subscriber segment data (Active, At-Risk, New, etc.)
- ESP send-time capabilities (immediate, scheduled, send-time optimization features)

## Output Artifacts

```markdown
## Recommended Send Times

### Primary Send Window (Highest Engagement)
**Day:** [Tuesday / Wednesday / Thursday]
**Time:** [9:00 AM / 6:00 PM] [Timezone]
**Why:** [Data insight: "Tuesday 9 AM shows 8% higher open rate vs. other days"]
**Expected open rate:** [X%] (based on historical avg)

### Secondary Send Window (Alternative)
**Day:** [Sunday / Monday]
**Time:** [7:00 PM] [Timezone]
**Why:** [Data insight: "Sunday evening shows strong engagement for 'weekend project' content"]
**Expected open rate:** [X%]

### Avoid Windows (Low Engagement)
**Days to avoid:** [Friday afternoon, Monday early AM]
**Why:** [Data insight: "Friday sends see 15% lower open rate, high inbox competition"]

## Segment-Specific Send Time Strategy

### Active Subscribers (30-40% of list)
**Optimal window:** Tuesday 9:00 AM PT
**Rationale:** Peak engagement, established habit
**Cadence:** Weekly, consistent day/time
**Performance data:** 42% avg open rate at this window vs. 32% overall

### At-Risk Subscribers (10-15% of list)
**Optimal window:** Sunday 6:00 PM PT
**Rationale:** Lower inbox competition, "reset" feeling for re-engagement
**Cadence:** Bi-weekly, off-peak to stand out
**Performance data:** 18% open rate (vs. 12% at standard Tuesday time)

### New Subscribers (5-10% of list)
**Optimal window:** Immediate (trigger-based) or same-day as signup
**Rationale:** Strike while interest is hot
**Cadence:** Welcome flow (Day 0, 3, 7, 14), then standard weekly
**Performance data:** 68% open rate on Day 0 welcome email

### Engaged but Quiet (20-30% of list)
**Optimal window:** Wednesday 10:00 AM PT
**Rationale:** Mid-week, slightly later (after morning rush)
**Cadence:** Weekly, with stronger CTAs
**Performance data:** 38% open rate, 4% click rate

## Cadence Recommendations

### By Content Type

#### Educational / Technique Content
**Best day:** Tuesday or Wednesday
**Best time:** 9:00 AM - 10:00 AM PT
**Why:** Weekday mornings, readers in "learning mode"
**Frequency:** Weekly
**Avg performance:** 38% open, 5% click

#### Recipe / Weekend Project
**Best day:** Thursday or Friday
**Best time:** 5:00 PM - 7:00 PM PT
**Why:** Readers planning weekend cooking
**Frequency:** Weekly (Thursday preferred)
**Avg performance:** 40% open, 6% click

#### Community / Engagement Content
**Best day:** Monday
**Best time:** 8:00 AM PT
**Why:** Start-of-week energy, fresh inbox
**Frequency:** Bi-weekly or monthly
**Avg performance:** 35% open, 8% reply rate

#### Re-Engagement / Win-Back
**Best day:** Sunday
**Best time:** 6:00 PM - 8:00 PM PT
**Why:** Lower competition, reflective mood, week prep
**Frequency:** Triggered (not scheduled)
**Avg performance:** 15-20% reactivation

### Overall Cadence Guidelines

**Weekly Newsletter:**
- **Day:** Tuesday (primary) or Wednesday (secondary)
- **Time:** 9:00 AM PT (professional audience) or 6:00 PM PT (evening readers)
- **Consistency:** Same day/time every week (builds habit)

**Bi-Weekly Newsletter:**
- **Day:** Alternate Tuesday/Thursday to maintain variety
- **Time:** Consistent within each cycle
- **Avoid:** Sending exactly 14 days apart if it lands on Friday/Monday

**Triggered Flows:**
- **Welcome Email 1:** Immediate (within 5 minutes of signup)
- **Welcome Email 2-4:** Day 3, 7, 14 (fixed schedule)
- **Re-engagement:** Trigger after 14 days no open
- **Win-back:** Trigger after 30 days no open

## Decision Trees

### Choosing Primary Send Day:
```
WHAT type of content?
  → Educational/Technique: Tuesday or Wednesday
  → Recipe/Weekend project: Thursday or Friday
  → Community/Engagement: Monday or Sunday evening

WHO is primary audience?
  → Professionals (9-5 jobs): Tuesday-Thursday, 9-10 AM
  → Parents/Home cooks: Thursday-Friday, 5-7 PM
  → Weekend enthusiasts: Friday evening or Sunday

WHEN did historical best performers send?
  → Check last 10 newsletters
  → Identify top 3 by open rate
  → What days/times were they?
```

### Choosing Send Time:
```
WHEN does audience check email?
  → Morning routine (7-10 AM): Send 9:00 AM
  → Lunch break (12-1 PM): Send 11:30 AM
  → Evening wind-down (6-8 PM): Send 6:00 PM

WHAT is inbox competition?
  → High competition (Monday AM, Friday PM): Avoid or differentiate
  → Low competition (Sunday PM, Tuesday AM): Optimal for engagement
  → Medium (Wednesday mid-day): Test and monitor

WHAT does data show?
  → Check performance by send time over last 20 sends
  → Identify 2-hour windows with highest open rates
  → Recommend primary + secondary windows
```

### Adjusting for Underperformance:
```
IF last 3 newsletters underperformed (open rate <25%):
  → Test different send day (move from Tuesday → Thursday)
  → Test different send time (move from AM → PM)
  → Run A/B test: 50% list at old time, 50% at new time
  → Measure over 4 weeks, then commit to winner

IF specific segment underperforms:
  → Check: Are they receiving at wrong time?
  → Adjust: Send at-risk subscribers on Sunday PM instead of Tuesday AM
  → Monitor: Did engagement improve after 2-3 sends?
```

## Send-Time Testing Protocol

### A/B Test Setup:
1. **Split list:** 50% Group A (current send time), 50% Group B (test send time)
2. **Send identical content:** Same newsletter, same subject line, only time differs
3. **Test duration:** 4 weeks minimum (4 data points per group)
4. **Measure:** Open rate, click rate, time-to-open, reply volume

### Success Criteria:
- **Group B open rate >5% higher than Group A:** Adopt new time
- **Group B open rate 2-5% higher:** Continue testing (not conclusive)
- **Group B open rate <2% different:** Keep current time (no meaningful difference)

### What to Test:
- **Day shift:** Tuesday → Thursday, Friday → Sunday
- **Time shift:** 9 AM → 6 PM, 6 PM → 11 AM
- **Cadence:** Weekly → Bi-weekly for at-risk segment

## Timezone Considerations

### If Subscribers Are Concentrated (80%+ in one timezone):
- **Send at optimal time for that timezone**
- Example: 9:00 AM PT if most subscribers are US West Coast

### If Subscribers Are Distributed (multiple timezones):
- **Option 1:** Send at optimal time for largest segment
  - Example: 9:00 AM PT if 50% US West, 30% US East, 20% International
- **Option 2:** Use ESP send-time optimization (if available)
  - Beehiiv Pro: "Send at optimal time per subscriber"
  - Mailchimp: Send Time Optimization feature
- **Option 3:** Segment by timezone, send at localized times
  - US East: 9:00 AM ET
  - US West: 9:00 AM PT (3 hours later)
  - Requires: ESP support for timezone-based sending

### Recommended Approach:
- **If <5,000 subscribers:** Send at one optimal time for majority
- **If >5,000 subscribers:** Consider timezone segmentation or ESP optimization
- **Always:** Test and monitor performance by timezone if data available

## ESP-Specific Features

### Beehiiv
- **Scheduled sends:** Set exact date/time
- **Send-time optimization (Pro):** Sends at optimal time per subscriber (48-hour window)
- **Recommendation:** Use scheduled sends for consistency, test optimization feature

### Mailchimp
- **Send Time Optimization:** Predicts best send time per subscriber
- **Timewarp:** Sends at same local time across timezones
- **Recommendation:** Use Timewarp if audience is global, otherwise schedule manually

### Klaviyo
- **Smart Sending:** Prevents over-sending, optimizes timing
- **Timezone-based sends:** Built-in for flows
- **Recommendation:** Use Smart Sending for triggered flows, manual schedule for campaigns

## Always Do
- Analyze last 10-20 sends to identify patterns (best days, times)
- Recommend primary and secondary send windows with data rationale
- Adjust send time by segment (Active vs. At-Risk vs. New)
- Test new send times via A/B split (4 weeks minimum)
- Maintain consistency once optimal time is found (builds subscriber habit)
- Monitor performance monthly (open rate by send time)
- Account for timezone distribution if significant
- Use ESP features (send-time optimization, timewarp) when appropriate

## Never Do
- Recommend send times without historical data (guessing is unreliable)
- Change send time every week (breaks subscriber habit, can't isolate performance)
- Ignore segment differences (at-risk subscribers need different timing)
- Send Friday afternoon or Monday early AM (lowest engagement windows)
- Test multiple variables at once (day + time + subject line = can't identify cause)
- Assume "best practices" apply to your audience (every list is different)
- Forget to account for holidays, events, or unusual weeks (skip or adjust)

## Performance Indicators (Track in Historical Files)

### By Send Day:
- Monday: [X% avg open rate]
- Tuesday: [X% avg open rate] ← Typically highest
- Wednesday: [X% avg open rate]
- Thursday: [X% avg open rate]
- Friday: [X% avg open rate] ← Typically lowest
- Saturday/Sunday: [X% avg open rate]

### By Send Time:
- 7-9 AM: [X% avg open rate]
- 9-11 AM: [X% avg open rate] ← Often highest
- 11 AM-1 PM: [X% avg open rate]
- 1-5 PM: [X% avg open rate]
- 5-8 PM: [X% avg open rate]
- 8-11 PM: [X% avg open rate]

### By Content Type:
- Educational/Technique: Tuesday 9 AM → [X% open]
- Recipe/Project: Thursday 6 PM → [X% open]
- Community: Monday 8 AM → [X% open]
- Re-engagement: Sunday 6 PM → [X% open]

## Integration with Other Skills

### With Newsletter Orchestration:
- **Before scheduling:** Check optimal send time for content type and segment
- **Recommend:** Specific day/time based on content (educational = Tuesday AM)

### With Subscriber Segmentation:
- **Segment-specific sends:** At-risk on Sunday PM, Active on Tuesday AM
- **Lifecycle flows:** Welcome immediate, re-engagement triggered

### With Performance Learning:
- **After each send:** Log send time + performance
- **Monthly review:** Identify which send times consistently outperform
- **Adjust strategy:** Update recommendations based on rolling 90-day data

## Cross-Skill Dependencies
- **Receives from:** `newsletter-performance-learning` (historical send performance)
- **Receives from:** `subscriber-lifecycle-segmentation` (segment definitions)
- **Feeds into:** `newsletter-orchestration-jam-lab` (scheduling decision)
- **Updates:** Historical Files (send-time performance data)

## Example Output

```markdown
## Send Time Recommendation – Jam Lab Newsletter

### Primary Send Window
**Day:** Tuesday
**Time:** 9:00 AM PT
**Expected open rate:** 40% (based on avg of last 8 Tuesday AM sends)
**Rationale:** Historical data shows Tuesday AM outperforms other days by 8-12%. Professional audience checks email during morning routine.

### Content-Specific Adjustments
- **Educational (technique/ingredient):** Tuesday 9 AM (standard)
- **Recipe/Weekend project:** Thursday 6 PM (planning mode)
- **Re-engagement:** Sunday 6 PM (lower competition)

### Segment-Specific Strategy
- **Active (40% of list):** Tuesday 9 AM
- **At-Risk (12% of list):** Sunday 6 PM (separate send)
- **New (8% of list):** Immediate (welcome flow)

### Next Test
A/B test Thursday 6 PM vs. Tuesday 9 AM for recipe content over next 4 weeks.
```
