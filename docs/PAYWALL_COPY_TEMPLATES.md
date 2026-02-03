# Paywall Copy Templates (Copy-Paste Ready)

**Contenido listo para implementar directamente en componentes React**

---

## Paywall #1: 7-Day Forecast (Soft Gate)

### Para usar en: `apps/native/app/paywall.tsx` (Feature gate variation)

```typescript
export const FORECAST_PAYWALL_COPY = {
  hero: {
    badge: "FORECAST PRO",
    headline: "Plan 7 Days Ahead. Leave Stress Behind.",
    subheadline: "See exactly when conditions improve.\nSchedule your commute for the safest window.",
  },

  features: [
    {
      icon: "📊", // Replace with actual icon
      title: "Hour-by-Hour Breakdown",
      description: "See conditions every 60 minutes, not just today",
    },
    {
      icon: "📈",
      title: "Predictive Trends",
      description: "Know when weather & traffic improves this week",
    },
    {
      icon: "🎯",
      title: "Find Your Best Days",
      description: "Identify the safest & fastest times to commute",
    },
  ],

  socialProof: {
    rating: "4.9",
    count: "2,400+",
    testimonials: [
      {
        text: "I stopped obsessing over weather. Now I just check Outia and go.",
        author: "Maria S.",
        location: "Denver, CO",
      },
      {
        text: "This feature alone saves me 1 hour per week I used to spend checking forecasts.",
        author: "Alex P.",
        location: "Boston, MA",
      },
    ],
  },

  trialInfo: [
    "7-day free trial included",
    "Cancel anytime before trial ends",
    "Reminder 24 hours before billing",
  ],

  trustSignals: [
    { emoji: "🔒", text: "Secure Payment" },
    { emoji: "⚡", text: "Instant Access" },
    { emoji: "💯", text: "Money Back" },
  ],

  cta: {
    primary: "Try 7-Day Forecast Free",
    secondary: "Already subscribed? Restore purchases",
  },

  legal: "7-day free trial. Cancel anytime. Then just $2.50/month or $29.99/year.",
};
```

---

## Paywall #2: Smart Departure Advisor (Hard Gate)

### Para usar en: Feature wall o modal

```typescript
export const SMART_DEPARTURE_PAYWALL_COPY = {
  hero: {
    badge: "OUTIA PRO",
    headline: "Never Guess When to Leave Again.",
    subheadline: "Get AI recommendations:\n'Leave now for 32-min commute' or 'Wait 45 min, save 15 min'",
    socialProof: "Join 2,400+ pro members who save 2.5 hours weekly",
  },

  features: [
    {
      title: "Smart Timing",
      description: "Your AI advisor recommends the exact moment to leave",
      example: "Tuesday 8:15 AM\nLeave now: 34 min\nWait 10 min: 29 min ← RECOMMENDED\nWait 25 min: 38 min",
      icon: "🎯",
    },
    {
      title: "Save 2.5 Hours Weekly",
      description: "Eliminate the daily decision paralysis",
      stat: "You currently spend 15 min/day checking weather, traffic, news = 75 min/week",
      benefit: "That's 1 hour saved per week. 52 hours saved per year.",
      icon: "⏱️",
    },
    {
      title: "Save $300-500 Annually",
      description: "Better route planning & time efficiency",
      breakdown: [
        "Avoid congested routes = -5-8% gas waste",
        "Skip toll roads when possible = $3-5/day",
        "Avoid accidents/claims = priceless",
      ],
      estimate: "Your estimated savings: $384/year",
      icon: "💰",
    },
    {
      title: "Track Your Wins",
      description: "See recommendations vs actual times",
      example: [
        "✓ Recommendation: Leave at 8:15 → Actual: 28 min",
        "✓ Recommendation: Wait 10 min → Actual: 25 min",
        "✓ Recommendation: Leave early → Actual: 22 min",
      ],
      note: "Advisor accuracy improves as it learns your patterns",
      icon: "📈",
    },
  ],

  pricing: {
    plans: [
      {
        name: "Yearly",
        price: "$29.99",
        period: "/year",
        monthlyEquivalent: "$2.50/month",
        badge: "SAVE 50%",
        benefits: [
          "Best value",
          "50% savings vs monthly",
        ],
        recommended: true,
      },
      {
        name: "Monthly",
        price: "$4.99",
        period: "/month",
        benefits: [
          "Flexible billing",
        ],
        recommended: false,
      },
    ],
    comparison: "$2.50/month is less than a coffee per week",
  },

  trialInfo: [
    "7-day free trial included",
    "Cancel anytime before trial ends",
    "Reminder 24 hours before billing",
  ],

  trustSignals: [
    { emoji: "🔒", text: "Secure Payment" },
    { emoji: "⚡", text: "Instant Access" },
    { emoji: "💯", text: "Money Back Guarantee" },
  ],

  cta: {
    primary: "Start 7-Day Free Trial",
    secondary: "Already subscribed? Restore purchases",
    disclaimer: "Recurring billing. Cancel anytime in settings.",
  },

  legal: "7-day free trial. Cancel anytime. Then $29.99/year or $4.99/month.",
};
```

---

## Soft Paywall Variations (For Different Triggers)

### Cuando user intenta guardar 2nd location

```typescript
export const LOCATION_LIMIT_PAYWALL = {
  headline: "Save Up to 5 Locations",
  subheadline: "Free users can save 1 location.\nPro users monitor 5: Home, Work, Gym, Grocery, School.",
  features: [
    "5 saved locations (vs 1 free)",
    "Route-specific risk alerts",
    "Automatic monitoring for all locations",
  ],
  cta: "Unlock 5 Locations",
  note: "7-day free trial • Cancel anytime",
};
```

### Cuando user intenta ver análisis de rutas

```typescript
export const ROUTE_ANALYTICS_PAYWALL = {
  headline: "See Your Monthly Impact",
  subheadline: "Pro users get detailed analytics:\n• Time saved\n• Money saved\n• Emissions avoided",
  stats: [
    "Last month: 4.2 hours saved",
    "Gas savings: $42",
    "Equivalent to planting 3 trees",
  ],
  cta: "View Analytics",
  note: "7-day free trial • Cancel anytime",
};
```

### Cuando user llega a Level 3

```typescript
export const LEVEL_3_PAYWALL = {
  headline: "🎉 You've Reached Route Guardian!",
  subheadline: "You're in the top 15% of voters.\nNext levels are Pro-exclusive.",
  unlocks: [
    "Level 4: Road Watcher (Pro users reach here 2x faster)",
    "Level 5: Traffic Sentinel (unlock custom badges)",
    "Level 6+: Elite status (exclusive perks)",
  ],
  cta: "Join Pro & Level Up Faster",
  note: "7-day free trial • Cancel anytime",
};
```

---

## Re-engagement Email Copy

### Email #1: Day 14 (Time Angle)

```markdown
Subject: "You're missing 2.5 hours of saved time"

---

Hi [First Name],

Quick question: How many minutes do you spend each morning checking:
• Weather forecast?
• Traffic conditions?
• Commute news?

Most people say 15 minutes. That's 1.5 hours every week.

2,400+ Pro members just gave us permission to do that for them.

With Smart Departure Advisor, they get one notification with the recommendation.
No guessing. No stress. Takes 30 seconds.

**That's 2.5 hours freed up weekly to do things that actually matter.**

We've put together a calculator so you can see exactly how many hours you're spending:

[Calculate Your Time]

Curious? Try Pro free for 7 days. See how much you actually save.

—The Outia Team

P.S. No credit card required for the trial. Cancel anytime.
```

### Email #2: Day 28 (Money Angle)

```markdown
Subject: "$384 in potential savings. Here's how."

---

Hi [First Name],

You've been using Outia for a month. Great!

Here's what Pro members with your engagement level are doing:

**SMARTER ROUTES** = Gas savings
Better route planning with advance notice → -5-8% fuel waste → ~$150-200/year

**SKIP THE TOLLS** = Direct savings
Avoid congested routes Pro users recommend → $3-5/day saved → ~$100-150/year

**AVOID WASTED TIME** = Time value
2.5 hours saved weekly = $260-1,300/year (depending on your hourly rate)

**Total opportunity: $510-1,650/year**
Subscription cost: $29.99/year

**This pays for itself in 3 weeks.**

[Start Calculating Your Savings]

7-day free trial. Cancel anytime.

—The Outia Team
```

### Email #3: Day 42 (Community Angle)

```markdown
Subject: "See what 2,400+ Pro members are doing this week"

---

Hi [First Name],

We just noticed something: You've voted 47 times in the last month.

You're literally in the top 18% of community members. 🎯

Here's what community members like you are doing now:

**PLANNING AHEAD**
Pro members see 7-day forecasts. They know exactly which days are safe.
"Thursday looks rough. Friday 8-9 AM is perfect."

**SHARING WINS**
Pro members are posting on social: "Just saved 12 min with @Outia."
More drivers are joining every week.

**EARNING EXCLUSIVE STATUS**
You're close to Level 4 (Road Watcher). Pro members reach that 2x faster.
Plus: Exclusive badges, higher leaderboard visibility, VIP voting perks.

Your next move? Join the 2,400+ who are making this community stronger.

[Start 7-Day Free Trial]

7-day free trial. Cancel anytime.

—The Outia Team

P.S. You're already helping 10,000+ drivers with your votes.
Imagine the impact as a Pro member.
```

### Email #4: Day 56 (Limited-Time Offer)

```markdown
Subject: "Last chance: 15% off your first year"

---

Hi [First Name],

This is our final offer.

We've been testing different ways to help users like you make the move to Pro.
Time to make a decision.

**Limited to this week: $25.49/year instead of $29.99**

That's 15% off. And it comes with:
• Smart Departure Advisor (saves 2.5 hours weekly)
• 7-Day forecasts (plan your entire week)
• Priority alerts (real-time notifications)
• 5 saved locations (home, work, gym, etc.)
• Historical accuracy tracking (see your wins)

Plus: 7-day free trial. Cancel anytime.

[Claim Your Discount]

This deal expires Friday at midnight.

—The Outia Team
```

---

## Push Notification Copy

### Daily Engagement Pushes

```typescript
export const PUSH_NOTIFICATIONS = {
  morning_commute: {
    title: "Bad weather today",
    body: "2,400+ Pro users got 1-hour advance warnings. See who they did it.",
    action: "Learn Strategy",
    target_screen: "paywall",
  },

  evening_streak: {
    title: "Your 14-day streak is alive!",
    body: "1 more vote keeps it alive. Help someone avoid traffic.",
    action: "Vote Now",
    target_screen: "map", // Show events to vote on
  },

  milestone: {
    title: "🎉 Level 3 reached!",
    body: "You're a Route Guardian. Pro members reach Level 4+ in 2 weeks.",
    action: "See Pro Benefits",
    target_screen: "paywall",
  },

  community_proof: {
    title: "Traffic alert just saved 2,400 drivers",
    body: "See the real-time impact of your voting.",
    action: "View Impact",
    target_screen: "my_impact",
  },

  re_engagement_day_7: {
    title: "Save 1 hour per week",
    body: "See what Pro members are doing differently.",
    action: "Learn More",
    target_screen: "paywall",
  },

  re_engagement_day_14: {
    title: "$384 in potential savings",
    body: "Here's how Pro members calculate their ROI.",
    action: "Calculate",
    target_screen: "paywall",
  },
};
```

### Timing Strategy

```typescript
export const NOTIFICATION_TIMING = {
  // Daily active users
  morning_7am: {
    message: PUSH_NOTIFICATIONS.morning_commute,
    frequency: "Daily if bad weather",
  },

  evening_6pm: {
    message: PUSH_NOTIFICATIONS.evening_streak,
    frequency: "Daily active users only",
  },

  // Weekly
  monday_9am: {
    message: PUSH_NOTIFICATIONS.community_proof,
    frequency: "Weekly",
  },

  // Conversion moments
  level_3_milestone: {
    message: PUSH_NOTIFICATIONS.milestone,
    trigger: "When user reaches Level 3",
  },

  // Re-engagement
  day_7_inactive: {
    message: PUSH_NOTIFICATIONS.re_engagement_day_7,
    trigger: "Day 7 if user hasn't converted",
  },
};
```

---

## In-App Feature Gate Copy

### When user tries to access Smart Departure (locked feature)

```typescript
export const FEATURE_LOCKED_MODAL = {
  title: "Smart Departure Advisor",
  subtitle: "Pro Feature",
  description: "AI-powered recommendations tell you exactly when to leave.\n\nSave 2.5 hours per week.",

  explanation: [
    "Example: 'Leave at 8:15 AM for fastest 32-minute commute'",
    "Learns from your actual commute times",
    "Improves accuracy every day",
  ],

  locked_icon: "🔒",

  upgrade_cta: {
    primary: "Unlock with Pro Trial",
    secondary: "Learn More About Pro",
  },

  trial_info: "7-day free trial • Cancel anytime",

  preview: {
    show: false, // Don't show partial feature
    note: "This feature requires Pro subscription",
  },
};
```

### When user tries to view 7-day forecast (locked feature)

```typescript
export const FORECAST_LOCKED_MODAL = {
  title: "7-Day Risk Forecast",
  subtitle: "Pro Feature",
  description: "See 7 days ahead with hour-by-hour breakdowns.\n\nPlan your entire week in seconds.",

  what_you_get: [
    "Hour-by-hour weather & traffic",
    "Predictive trends (when conditions improve)",
    "Best departure windows identified",
  ],

  example: "Thursday is your best day to depart early (clear, low traffic)",

  upgrade_cta: {
    primary: "Try Forecast Preview Free",
    secondary: "View Pricing",
  },

  trial_info: "7-day free trial included",

  preview: {
    show: true, // Show partial data (1-day forecast)
    note: "Free preview shows 24 hours. Pro shows 7 days ahead.",
  },
};
```

---

## Settings Screen Copy (Subscription Management)

### Active Subscriber View

```typescript
export const ACTIVE_SUBSCRIPTION_VIEW = {
  status: "Your Outia Pro Subscription",
  plan: "Annual Plan • $29.99/year",
  renewal_date: "Renews on March 3, 2026",

  benefits: [
    "✓ Smart Departure Advisor",
    "✓ 7-Day Risk Forecast",
    "✓ Priority Safety Alerts",
    "✓ 5 Saved Locations",
    "✓ Unlimited Voting",
    "✓ Advanced Analytics",
  ],

  actions: [
    {
      label: "Change Plan",
      action: "open_billing",
    },
    {
      label: "Cancel Subscription",
      action: "cancel_flow",
    },
  ],

  support: "Questions? Contact support@outia.app",
};
```

### Trial Subscriber View

```typescript
export const TRIAL_SUBSCRIPTION_VIEW = {
  status: "7-Day Free Trial",
  trial_ends: "Trial ends on February 10, 2026",

  message: "Your trial includes access to all Pro features.",

  on_trial_expires: {
    title: "Your trial is ending",
    body: "Your subscription will renew for $29.99/year on February 10.",
    actions: [
      "Continue Subscription",
      "Cancel Trial",
    ],
  },

  trial_benefits: [
    "Smart Departure Advisor",
    "7-Day Forecast",
    "Priority Alerts",
    "5 Locations",
  ],

  support: "Questions? Contact support@outia.app",
};
```

---

## Copy A/B Testing Variants

### Test: Headlines

```typescript
export const HEADLINE_VARIANTS = {
  control: "Never Miss the Perfect Window",

  variant_a: "Save 2.5 Hours Every Week",

  variant_b: "Stop Guessing When to Leave",

  variant_c: "Get Back 1 Hour Weekly",

  variant_d: "Your AI Commute Coach",
};
```

### Test: CTA Button

```typescript
export const CTA_VARIANTS = {
  control: "Start 7-Day Free Trial",

  variant_a: "Try Pro Free",

  variant_b: "Unlock Smart Advisor",

  variant_c: "Get Instant Recommendations",

  variant_d: "Join 2,400+ Pro Members",
};
```

### Test: Primary Value Prop

```typescript
export const VALUE_PROP_VARIANTS = {
  control: "Save 2.5 hours every week. Never stress about departure time again.",

  variant_a: "Get smart recommendations. Leave at exactly the right time.",

  variant_b: "Save $384 annually on gas and tolls. Get the roadmap.",

  variant_c: "Join 2,400+ drivers who trust Outia Pro for their commute.",
};
```

---

## Backup Copy (If A/B tests don't improve)

These are solid fallbacks if testing doesn't yield winners:

```typescript
export const BACKUP_COPY = {
  headlines: [
    "One notification. Perfect timing. Every day.",
    "Your commute just got smarter",
    "The easiest $0.58 you'll ever spend",
    "Join drivers who never waste time again",
  ],

  subheadlines: [
    "Smart Departure recommends exactly when to leave. Save 2.5 hours weekly.",
    "Real-time alerts + AI advice = less stress, more free time",
    "See 7 days ahead. Plan your entire week in seconds.",
    "2,400+ drivers trust us. You will too.",
  ],

  ctas: [
    "See Pro in Action",
    "Calculate Your Savings",
    "Join Pro Today",
    "Get Started Free",
  ],

  objection_handlers: [
    "Your first 7 days are completely free. Cancel anytime.",
    "99% of users see the value by day 3.",
    "Average user saves $384 in year one.",
    "No hidden fees. Transparent pricing.",
  ],
};
```

---

## Implementation Checklist

- [ ] Copy Paywall #1 copy to `apps/native/app/paywall.tsx`
- [ ] Create feature gate modals with locked feature copy
- [ ] Set up email templates with copy in email service
- [ ] Implement push notifications with copy in RevenueCat/OneSignal
- [ ] Add A/B test variants to tracking system (Amplitude)
- [ ] Create settings screen subscription management copy
- [ ] Update onboarding paywall with appropriate copy
- [ ] Test all copy in-app for typos and formatting
- [ ] Set up analytics to track which copy converts best
- [ ] Plan A/B test schedule (8-week cycle)

---

**Last updated: Feb 3, 2026**
**Ready to implement: ✓**
