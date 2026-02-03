# OUTIA: Copy Templates - Ready to Implement

Copy producción lista para pegar en componentes de Outia. Cada sección está marcada con el archivo/componente donde debe ir.

---

## SECTION 1: WEB LANDING PAGE

### File: `/apps/web/src/components/landing/hero-section.tsx`

#### Option A: Conservative (Keep Current Energy)

```jsx
// Badge
<span className="inline-block py-1 px-3 rounded-full bg-accent text-primary text-xs font-semibold tracking-wide uppercase mb-6">
    The smarter commute
</span>

// Headline
<h1 className="text-[48px] md:text-[64px] lg:text-[72px] font-serif font-medium leading-[1.05] tracking-tight text-primary mb-8 text-balance">
  Know exactly when to <br/>
  <span className="italic text-muted-foreground">leave.</span>
</h1>

// Subheadline
<p className="text-lg md:text-xl text-muted-foreground/80 mb-10 leading-relaxed max-w-2xl mx-auto">
  Stop guessing if it's safe. Real-time weather, traffic, and community alerts combined into one score (0-100) that tells you when to depart with confidence.
</p>

// CTA
<Button size="lg" className="...">
  See Your Risk Score — Free
</Button>
```

---

#### Option B: Bold (Higher Conversion Potential)

```jsx
// Badge
<span className="inline-block py-1 px-3 rounded-full bg-accent text-primary text-xs font-semibold tracking-wide uppercase mb-6">
    Join 500K smarter commuters
</span>

// Headline
<h1 className="text-[48px] md:text-[64px] lg:text-[72px] font-serif font-medium leading-[1.05] tracking-tight text-primary mb-8 text-balance">
  Your departure <br/>
  <span className="italic text-muted-foreground">advantage</span> starts here.
</h1>

// Subheadline
<p className="text-lg md:text/xl text-muted-foreground/80 mb-10 leading-relaxed max-w-2xl mx-auto">
  Every morning, others guess. You decide. Real-time intelligence + community insights = arrival time you can trust. Always.
</p>

// CTA
<Button size="lg" className="...">
  Get Your First Risk Score
</Button>
```

---

#### Option C: Benefit-First (A/B Test Champion)

```jsx
// Badge
<span className="inline-block py-1 px-3 rounded-full bg-accent text-primary text-xs font-semibold tracking-wide uppercase mb-6">
    Commuters who use outia arrive 14 min earlier
</span>

// Headline
<h1 className="text-[48px] md:text-[64px] lg:text-[72px] font-serif font-medium leading-[1.05] tracking-tight text-primary mb-8 text-balance">
  Leave smart.<br/>
  <span className="italic text-muted-foreground">Arrive on time.</span>
</h1>

// Subheadline
<p className="text-lg md:text-xl text-muted-foreground/80 mb-10 leading-relaxed max-w-2xl mx-auto">
  One score tells you everything: weather conditions, traffic delays, and real-time incidents. No guessing. No anxiety. Just confident departures.
</p>

// CTA
<Button size="lg" className="...">
  Try Free — 30 Seconds
</Button>
```

---

### File: `/apps/web/src/components/landing/features-section.tsx`

#### Current Features to Rewrite (Benefit-First)

```jsx
const features = [
  {
    title: "One Number, One Decision",
    description: "Your risk score (0-100) combines weather, traffic, and community reports. No more checking 5 apps.",
    icon: <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-6 h-6 text-emerald-600" />,
  },
  {
    title: "Real-Time Intelligence",
    description: "Updates every minute. Weather changing? Traffic building? Community reporting incidents? You know instantly.",
    icon: <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-6 h-6 text-emerald-600" />,
  },
  {
    title: "Smart Notifications",
    description: "Get alerted exactly when you need to leave—no guessing, no being late, no unnecessary rushing.",
    icon: <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-6 h-6 text-emerald-600" />,
  },
];
```

#### Section Headline

```jsx
<h2 className="text-[32px] md:text-[48px] font-serif font-medium text-primary mb-8 leading-tight">
  Everything you need to decide.<br/>
  <span className="text-muted-foreground/60">Nothing to configure.</span>
</h2>
```

---

### File: `/apps/web/src/components/landing/final-cta-section.tsx`

#### Call to Action Section

```jsx
// Main Headline
<h2 className="text-4xl md:text-5xl font-serif font-medium text-center mb-4">
  Ready to stop guessing?
</h2>

// Subheadline with Social Proof
<p className="text-xl text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
  500K drivers already know their risk score. See yours in 30 seconds. Free forever, no credit card needed.
</p>

// Buttons
<div className="flex flex-col sm:flex-row gap-4 justify-center">
  <Button size="lg" className="...">
    Get Your Score Free
  </Button>
  <Button size="lg" variant="outline" className="...">
    Learn More
  </Button>
</div>

// Trust Signal
<p className="text-sm text-muted-foreground text-center mt-8">
  ✓ Used by commuters in 250+ cities  •  ✓ 91% accuracy rating  •  ✓ Zero data sharing
</p>
```

---

## SECTION 2: MOBILE ONBOARDING

### File: `/apps/native/app/(onboarding)/index.tsx`

#### Improved Copy (Replace lines 71-74)

**Option A: Action-Focused**
```jsx
<Text style={styles.title}>Your smarter departure starts here.</Text>
<Text style={styles.subtitle}>
  See your risk score. Know when to leave. Arrive confident. That's it.
</Text>
```

**Option B: Benefit-Focused**
```jsx
<Text style={styles.title}>Never guess again.</Text>
<Text style={styles.subtitle}>
  Weather. Traffic. Community. One score tells you exactly when to depart.
</Text>
```

**Option C: Social Proof + Benefit**
```jsx
<Text style={styles.title}>Join 500K smarter drivers.</Text>
<Text style={styles.subtitle}>
  Real-time risk score + community alerts = confident departures. Every day.
</Text>
```

#### CTA Copy (Replace line 84)

**Current:**
```jsx
Get Started — It's Free
```

**Options:**

```jsx
// Option 1: Speed + Benefit
See My Risk Score

// Option 2: Action + Benefit
Get Started in 30 Seconds

// Option 3: Curiosity Driver
Show Me My Score

// Option 4: Social Proof
Join 500K Drivers
```

---

### Mobile Demo Risk Card (lines 39-41)

**Current:**
```jsx
<Text style={styles.scoreDescription}>
  Light rain expected. Consider leaving 10 min earlier.
</Text>
```

**Improved Options:**

```jsx
// Option 1: Action-Oriented
<Text style={styles.scoreDescription}>
  Light rain + moderate traffic. Leave 10 min earlier to arrive on time.
</Text>

// Option 2: Benefit-Focused
<Text style={styles.scoreDescription}>
  42 means: Leave in 10 minutes and arrive 5 minutes early. Perfect.
</Text>

// Option 3: Confidence-Building
<Text style={styles.scoreDescription}>
  Light rain expected today. Leave 10 min earlier than usual. You'll arrive exactly on time.
</Text>
```

---

## SECTION 3: IN-APP MESSAGING

### File: `/apps/native/app/(tabs)/index.tsx`

#### Risk Score Explanation (After card displays)

**Current State:** Shows score, label (MEDIUM RISK)

**Proposed Enhancement: Actionable Context**

```jsx
// Component: RiskScoreExplanation.tsx

function RiskScoreExplanation({ score, breakdown }) {
  const getContext = (score) => {
    if (score <= 33) {
      return {
        action: "Leave on schedule",
        confidence: "Conditions are perfect",
        details: "No delays expected. Arrive early."
      };
    }
    if (score <= 66) {
      return {
        action: "Leave 10 min earlier",
        confidence: "Minor delays expected",
        details: "Light rain and moderate traffic. Extra time needed."
      };
    }
    return {
      action: "Leave 25 min earlier (or postpone)",
      confidence: "Significant delays expected",
      details: "Heavy weather + traffic. Major delays likely."
    };
  };

  const context = getContext(score);

  return (
    <View>
      <Text style={styles.actionCopy}>{context.action}</Text>
      <Text style={styles.confidenceText}>{context.confidence}</Text>
      <Text style={styles.detailsText}>{context.details}</Text>
    </View>
  );
}
```

---

#### Weather & Traffic Cards Copy

**Current:** "Weather: Clear" / "Traffic: Fluent"

**Improved (More Conversational):**

```jsx
// Weather Card
label="WEATHER"
value="Light Rain"
subtext="Expected: 15 min heavier at 7:30 AM"

// Traffic Card
label="TRAFFIC"
value="Moderate"
subtext="Your route +8 min | Alternate -3 min"

// Plus new card:
label="DECISION"
value="Leave in 10 Min"
subtext="You'll arrive 5 min early"
```

---

### File: `/apps/native/app/(setup)/gamification.tsx`

#### Gamification Onboarding Copy

```jsx
// Screen 1: Why Gamification Matters
<View>
  <Text style={styles.title}>
    Your accuracy is valuable.
  </Text>
  <Text style={styles.subtitle}>
    Every report you make helps 500K drivers stay safe.
    Get recognized. Level up. Become a legend.
  </Text>
</View>

// Level Overview
<View style={styles.levelCard}>
  <Text style={styles.levelTitle}>7 Levels. From Newcomer to Legend.</Text>

  <View style={styles.levelRow}>
    <Text>Level 1: Newcomer</Text>
    <Text style={styles.levelDesc}>Just joined. Start here.</Text>
  </View>

  <View style={styles.levelRow}>
    <Text>Level 2: Spotter</Text>
    <Text style={styles.levelDesc}>You notice incidents. 3 votes this week.</Text>
  </View>

  <View style={styles.levelRow}>
    <Text>Level 3: Route Guardian</Text>
    <Text style={styles.levelDesc}>Your routes, your expertise.</Text>
  </View>

  {/* ... etc */}
</View>

// CTA
<Button
  onPress={() => router.push("/confirm")}
  style={styles.cta}
>
  Let's Level You Up
</Button>
```

---

## SECTION 4: NOTIFICATION TEMPLATES

### Push Notification Copy

#### Type 1: High Risk Alert (Score > 75)

```
Headline: "Heavy weather alert"
Body: "Risk score 78. Leave 25 min earlier or consider alternate route."
Action: [View Details] [Confirm Departure]
```

#### Type 2: Traffic Jam Alert

```
Headline: "Traffic on your usual route"
Body: "I-95 backed up. Your commute: 28 min (usual 12). Scenic route: 18 min."
Action: [See Map] [Take Scenic Route]
```

#### Type 3: Community Alert

```
Headline: "Flood reported on Route 9"
Body: "1 min ago: Heavy flooding near Exit 42. Avoid if possible."
Action: [Confirm] [Report Issue]
```

#### Type 4: Gamification (Milestone)

```
Headline: "You're close to Road Watcher! 🚀"
Body: "2 more accurate votes this week = Level 4. Help drivers today?"
Action: [View Map] [Later]
```

#### Type 5: Weekly Summary

```
Headline: "This week: You saved 47 minutes"
Body: "Your smart departures meant less traffic. Plus: Helped 1,240 drivers."
Action: [See Stats] [View Impact]
```

---

## SECTION 5: EMAIL TEMPLATES

### Welcome Email (Day 1)

```
Subject: "Your first risk score is ready (and it's 34)"

Hi [Name],

Welcome to Outia.

Your risk score for today is: 34 (MEDIUM RISK)

Here's what it means:
→ Light rain expected
→ Moderate traffic (typical for Tuesday)
→ Leave 10 minutes earlier than usual

Do that, and you'll arrive exactly on time with a calm commute.

But here's the real power of Outia:

Tomorrow your score might be 18 (leave on schedule).
Next week it might be 67 (leave 20 min early).

Each time, Outia tells you the truth about conditions,
based on real data from weather stations, traffic cameras, and
drivers exactly like you.

In a week, you'll stop guessing. Ever.

[See Your Risk Score] [Learn More]

Safe travels,
The Outia Team

---
P.S. When you report incidents you see on the road, you earn points
toward 7 achievement levels. The first level, "Spotter," unlocks after
your first 3 accurate reports. Get going.
```

---

### Day 7: "You're Getting Better at This"

```
Subject: "Your accuracy is 89% this week"

Hi [Name],

You've been using Outia for a week. Here's what happened:

Reports you made:
✓ Heavy rain at 7:15 AM (88% of drivers confirmed)
✓ Traffic on I-95 exit 42 (92% confirmed)
✓ Accident cleared by 8:30 AM (verified)

Your accuracy: 89%
Level: 2 - Spotter
Points this week: 42

What this means:
You're not just using Outia. You're making it better.

Every accurate report you make helps the next driver. When you reported
that rain, 47 drivers saw it and left earlier. Guess how many arrived
on time instead of being late?

All 47.

Next milestone: Level 3 - Route Guardian (requires 1,500 points)
You'll unlock: Early notifications + weekly impact reports

You're 3 points away. One more accurate report gets you there.

[View Your Profile] [See This Week's Stats]

Keep it up,
The Outia Team
```

---

### Day 30: "Monthly Impact Report"

```
Subject: "[Name], you saved 4 hours this month"

Hi [Name],

A month of smart departures. Here's the impact:

Time saved: 4 hours 12 minutes
(By leaving at the exact right moment, every day)

Community helped: 3,240 drivers
(Through your 18 accurate reports)

Current level: 3 - Route Guardian
Points: 1,847 / 50,000 to Level 7 (Community Legend)

What it means:
You're no longer guessing. You're deciding based on facts.
That's 4 hours you'll get back this month. Hours for your family,
your health, your peace of mind.

Plus, 3,240 drivers benefit from your insights.

Next milestone: Unlock Weather Expert badge (5 rain reports)
You've done: 4/5. One more rainy day prediction.

Keep it up. You're becoming a legend.

[View Full Report] [See Badges]

- The Outia Team
```

---

## SECTION 6: COPY FOR SPECIFIC FEATURES

### Feature: Interactive Map

**Current:** Just shows incidents

**With Copy:**

```
Map Screen Header:
"Real-time incidents from 500K drivers + official data"

When user taps incident:

HIGH RISK (Heavy Rain):
"Heavy rain on I-95 North
 Reported: 2 minutes ago
 Severity: High | 42 drivers confirmed
 Tip: Consider Route 9 (10 min less delay)

 [Mark as Cleared] [Take Alternate Route]"

MEDIUM (Traffic Jam):
"Traffic at Exit 42
 Reported: 8 minutes ago
 Cause: Accident (appears clearing)
 Impact: +12 minutes | Should clear 8:15 AM

 [Confirm Still Here] [Mark as Cleared]"

LOW (All Clear):
"Route 9 - All Clear ✓
 Reported: 3 minutes ago
 Status: Flowing smoothly
 Speed: Normal traffic

 Great insight! +5 bonus points for being first."
```

---

### Feature: Saved Routes

**Current:** List of routes

**With Copy & CTA:**

```
Route Card:
"Home to Office"
"Mon-Fri commute"
"Avg. time: 18 min"
"This week saved: 45 min"

On click:
"This route has 1,247 drivers using it.
 Your accuracy on this route: 91%

 This week you helped 340 drivers by reporting:
 ✓ Rain at 7:45 AM
 ✓ Traffic at Exit 18
 ✓ Cleared confirmation at 8:30 AM

 Ready for tomorrow?"
```

---

## SECTION 7: UPGRADE/PAYWALL COPY

### File: `/apps/native/app/paywall.tsx`

#### Pro Tier Messaging

```jsx
<View style={styles.headerContainer}>
  <Text style={styles.headerTitle}>
    Outia Pro: Master Your Commute
  </Text>
  <Text style={styles.headerSubtitle}>
    Everything in Free, plus predictive intelligence.
  </Text>
</View>

<View style={styles.featureList}>
  <ProFeature
    icon="🔮"
    title="Predictive Alerts"
    description="Know about traffic 2 hours before it happens. Plan your day perfectly."
  />
  <ProFeature
    icon="🗂️"
    title="5 Saved Routes"
    description="Monitor your commute, gym, client meetings, everywhere."
  />
  <ProFeature
    icon="📊"
    title="Weekly Insights"
    description="See exactly how many hours you saved. See your community impact."
  />
  <ProFeature
    icon="🗺️"
    title="Offline Maps"
    description="Never lose navigation, even without cell service."
  />
  <ProFeature
    icon="⚡"
    title="2x Points"
    description="Level up faster. Reach Legend status quicker."
  />
</View>

<View style={styles.pricingSection}>
  <Text style={styles.pricingTitle}>$4.99/month or $39/year</Text>
  <Text style={styles.pricingSave}>(Save 35% with annual)</Text>
  <Text style={styles.pricingOffer}>First 7 days free. Cancel anytime.</Text>

  <Button style={styles.upgradeCta}>
    Start 7-Day Free Trial
  </Button>
</View>

<Text style={styles.testimonial}>
  "Pro alerts saved me 2 hours last week. I know traffic before it happens now."
  - Sarah M., Road Watcher
</Text>
```

---

## SECTION 8: ERROR & EMPTY STATES

### No Nearby Signals (Empty State)

**Current:**
```
"No nearby signals reported"
```

**Improved:**

```
"All clear in your area"

Everything is flowing smoothly right now.
Be the first to report if conditions change.

[View Map] [Continue]
```

---

### Location Permission Denied

**Current:**
```
"Please enable location access"
```

**Improved:**

```
"We need your location to show your risk score"

Outia only uses your location to calculate weather and traffic
for YOUR commute. Nothing else. Your data never leaves your phone.

[Enable Location] [Learn More about Privacy]
```

---

### Data Not Available (API Down)

**Current:**
```
"Unable to load risk data"
```

**Improved:**

```
"We're having trouble connecting right now"

Our servers are updating. This usually takes < 2 minutes.

Last known score: 34 (20 min ago)
"Leave 10 min early" - still good advice

[Retry] [Check Status Page]
```

---

## SECTION 9: RETENTION/WIN-BACK COPY

### In-App Prompt: Notification Permission

**Current:** Standard OS prompt

**Pre-Prompt Copy (In-App):**

```
Title: "Don't miss your perfect departure"

Body: "Outia sends notifications at exactly the moment
       you should leave. Never miss the optimal time again."

[Enable Notifications] [Maybe Later]
```

---

### Push: Reactivation (After 7 Days Inactive)

```
Subject: "Your route misses you (literally)"

Body: "1,240 drivers reported incidents this week.
       Your insights could have helped 340 of them.

       Plus: You're 1 vote away from Level 4! 🚀"

[Come Back] [View Level Progress]
```

---

### Email: Win-Back (14 Days Inactive)

```
Subject: "Route Guardian, we need you back"

Hi [Name],

You haven't reported any incidents in 2 weeks.

Here's what happened without you:

Last week, Route 9 had a major accident at Exit 42.
1,240 drivers were affected.

Before, when incidents like this happened, you reported them.
340 drivers saved 12 minutes each because you did.

This week, they didn't have that advantage.

We miss your contributions. Your community misses you.

Ready to get back? Your routes are waiting.

[Resume Reporting] [See Your Stats]

- The Outia Team

P.S. You're still 1 vote away from Road Watcher level.
Come back this week and get there.
```

---

## SECTION 10: A/B TESTING PRIORITIES

### High Impact Variants to Test

1. **Headline**: "Know when to leave" vs. "Your departure advantage"
   - Expected impact: +8-15% CTR

2. **CTA Copy**: "Get Started Free" vs. "See Your Risk Score"
   - Expected impact: +5-10% conversion

3. **Value Prop**: "One score" vs. "Real-time intelligence"
   - Expected impact: +6-12% understanding

4. **Email Subject**: "Your risk score is ready" vs. "[Name], you saved 12 min today"
   - Expected impact: +15-25% open rate

5. **Notification**: Action-focused vs. Benefit-focused
   - Expected impact: +10-20% engagement

---

## SECTION 11: VOICE & TONE REFERENCE

### Examples: DO & DON'T

**DO: Be Specific**
```
✓ "Leave 10 minutes earlier to arrive 5 min early"
✗ "Leave earlier to optimize arrival"
```

**DO: Show Benefit First**
```
✓ "Save 3 hours per month by leaving at the perfect time"
✗ "Outia uses AI to calculate departure optimization"
```

**DO: Use Their Language**
```
✓ "Risk score 42 means: Light rain + moderate traffic"
✗ "Composite risk calculation: 0.4*weather + 0.4*traffic + 0.2*community"
```

**DO: Be Human & Conversational**
```
✓ "You saved 47 minutes this week. That's your time back."
✗ "Weekly time savings: 47 minutes accumulated"
```

**DO: Celebrate Wins**
```
✓ "You just leveled up to Route Guardian! 🎉"
✗ "User progression: Level 3 achieved"
```

---

## QUICK IMPLEMENTATION CHECKLIST

- [ ] Update hero headline (web)
- [ ] Update onboarding title/subtitle (mobile)
- [ ] Create risk score explanation card (in-app)
- [ ] Update CTA copy on all buttons
- [ ] Create welcome email template
- [ ] Create push notification templates
- [ ] Update empty states copy
- [ ] Create paywall messaging
- [ ] Set up A/B testing framework
- [ ] Track metrics for each variant

---

**Document Version:** 1.0
**Last Updated:** February 2026
**Status:** Ready for Implementation
**Estimated Implementation Time:** 6-8 hours

