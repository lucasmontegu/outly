# Roadmap Técnico: Implementación de Estrategia de Conversión

**Plan semana-a-semana para implementar la estrategia de conversión**

---

## SEMANA 1-2: Fundación & Paywall Update

### Objetivo
Actualizar paywall con nuevo copy y configurar tracking básico

### Tasks

#### 1.1 Update Paywall Component
**Archivo:** `/Users/lucasmontegu/lumlabs-projects/outia/apps/native/app/paywall.tsx`

```typescript
// Replace features array with:
const features = [
  {
    icon: SparklesIcon,
    title: "Smart Departure Advisor",
    description: "Leave at the perfect time. Save 2.5 hours weekly.",
    gradient: ["#3B82F6", "#2563EB"],
  },
  {
    icon: Calendar02Icon,
    title: "7-Day Risk Forecast",
    description: "Plan ahead with predictive weather and traffic intel.",
    gradient: ["#10B981", "#059669"],
  },
  {
    icon: ShieldKeyIcon,
    title: "Priority Safety Alerts",
    description: "Get instant notifications before conditions worsen.",
    gradient: ["#F59E0B", "#D97706"],
  },
];

// Update headline
headline: "Never Miss the Perfect Window"

// Update subheadline
subheadline: "Join 2,400+ commuters who save time and stress every single day."
```

**Effort:** 30 min | **Priority:** P1

#### 1.2 Add Feature Comparison Table
**New Component:** `/apps/native/components/ui/FeatureComparison.tsx`

```typescript
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

export function FeatureComparison() {
  const features = [
    {
      name: "Risk Scoring",
      free: true,
      pro: true,
      note: "Current location + 24-hour look-ahead",
    },
    {
      name: "Smart Departure Advisor",
      free: false,
      pro: true,
      note: "AI-powered timing recommendations",
    },
    {
      name: "7-Day Forecast",
      free: false,
      pro: true,
      note: "Hour-by-hour breakdown, 7 days ahead",
    },
    {
      name: "Saved Locations",
      free: "1",
      pro: "5",
      note: "Home, work, gym, etc.",
    },
    {
      name: "Community Voting",
      free: "3/day",
      pro: "20/day",
      note: "All users earn points and badges",
    },
    {
      name: "Routes",
      free: false,
      pro: true,
      note: "Unlimited route management",
    },
  ];

  return (
    <View>
      {features.map((feature) => (
        <View key={feature.name} style={styles.row}>
          <Text style={styles.featureName}>{feature.name}</Text>
          <View style={styles.freeCell}>
            {feature.free === true ? (
              <CheckIcon />
            ) : feature.free === false ? (
              <LockIcon />
            ) : (
              <Text>{feature.free}</Text>
            )}
          </View>
          <View style={styles.proCell}>
            {feature.pro === true ? (
              <CheckIcon />
            ) : (
              <Text>{feature.pro}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
```

**Effort:** 1.5 hours | **Priority:** P1

#### 1.3 Setup Conversion Tracking Mutations
**File:** `/packages/backend/convex/analytics.ts` (Create new)

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const trackPaywallView = mutation({
  args: {
    userId: v.string(),
    paywallType: v.union(
      v.literal("7day_forecast"),
      v.literal("smart_departure"),
      v.literal("onboarding"),
      v.literal("location_limit"),
      v.literal("level_milestone")
    ),
    trigger: v.string(), // "day3", "day14", "location_save_2nd", etc.
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("paywallAnalytics", {
      userId: args.userId,
      paywallType: args.paywallType,
      trigger: args.trigger,
      viewedAt: Date.now(),
      converted: false,
    });
  },
});

export const trackPaywallConversion = mutation({
  args: {
    userId: v.string(),
    paywallType: v.string(),
    subscriptionType: v.union(v.literal("monthly"), v.literal("yearly")),
  },
  handler: async (ctx, args) => {
    // Update user tier
    await ctx.db.patch(ctx.userId, {
      tier: "pro",
    });

    // Track conversion
    await ctx.db.insert("conversionEvents", {
      userId: args.userId,
      event: "paywall_conversion",
      paywallType: args.paywallType,
      subscriptionType: args.subscriptionType,
      convertedAt: Date.now(),
    });
  },
});
```

**Effort:** 1 hour | **Priority:** P1

#### 1.4 Add Conversion Tracking to Paywall Component
**Update:** `/apps/native/app/paywall.tsx`

```typescript
import { useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";

export default function PaywallScreen() {
  // ... existing code ...

  const trackPaywallView = useMutation(api.analytics.trackPaywallView);
  const trackConversion = useMutation(api.analytics.trackPaywallConversion);

  useEffect(() => {
    // Track that user viewed paywall
    trackPaywallView({
      userId: user?.id,
      paywallType: "smart_departure", // or appropriate type
      trigger: "location_save_2nd", // or appropriate trigger
    });
  }, []);

  const handleStartTrial = async () => {
    // ... existing purchase logic ...

    if (result.success) {
      // Track conversion
      await trackConversion({
        userId: user?.id,
        paywallType: "smart_departure",
        subscriptionType: selectedPlan,
      });
    }
  };
}
```

**Effort:** 30 min | **Priority:** P1

#### 1.5 Schema Update (Add Tracking Tables)
**File:** `/packages/backend/convex/schema.ts`

```typescript
// Add these tables to schema:

paywallAnalytics: defineTable({
  userId: v.string(),
  paywallType: v.string(),
  trigger: v.string(),
  viewedAt: v.number(),
  converted: v.boolean(),
})
  .index("by_user", ["userId"])
  .index("by_type", ["paywallType"]),

conversionEvents: defineTable({
  userId: v.string(),
  event: v.string(),
  paywallType: v.string(),
  subscriptionType: v.string(),
  convertedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_event", ["event"]),
```

**Effort:** 30 min | **Priority:** P1

**Week 1-2 Total Effort:** ~4 hours

---

## SEMANA 3-4: Feature Gates & Gamification Integration

### Objetivo
Implementar soft paywalls y conectar gamification con triggers de pro

### Tasks

#### 2.1 Implement Soft Paywall for 7-Day Forecast
**New Component:** `/apps/native/components/ForecastGate.tsx`

```typescript
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";

export function ForecastGate({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);

  const isPro = currentUser?.tier === "pro";

  if (!isPro) {
    return (
      <View style={styles.gateContainer}>
        <Text style={styles.gateTitle}>Unlock 7-Day Forecast</Text>
        <Text style={styles.gateSubtitle}>
          See exactly when conditions improve this week
        </Text>

        <View style={styles.benefitsList}>
          <BenefitItem icon="📊" text="Hour-by-hour breakdown" />
          <BenefitItem icon="📈" text="Predictive trends" />
          <BenefitItem icon="🎯" text="Find your best days" />
        </View>

        <Button
          onPress={() => router.push("/paywall?type=forecast")}
          size="lg"
          className="w-full"
        >
          Try Free for 7 Days
        </Button>

        <Text style={styles.disclaimer}>
          No credit card required. Cancel anytime.
        </Text>
      </View>
    );
  }

  return children;
}
```

**Usage:** Wrap forecast component with `<ForecastGate>`

**Effort:** 1.5 hours | **Priority:** P1

#### 2.2 Implement Hard Paywall for Smart Departure
**New Component:** `/apps/native/components/SmartDepartureGate.tsx`

Similar structure to ForecastGate, but with more aggressive messaging:

```typescript
// Show exact time savings stat
<Text style={styles.stat}>
  You spend 15 min/day checking weather + traffic
</Text>
<Text style={styles.statHighlight}>
  That's 2.5 hours per week Pro users get back
</Text>

// Show calculation
<View style={styles.calculation}>
  <Text>Time value: 52 hours/year × $50-500/hour wage</Text>
  <Text style={styles.calculationResult}>= $2,600-26,000 annually</Text>
  <Text style={styles.roiHighlight}>Subscription: $29.99/year</Text>
</View>
```

**Effort:** 1.5 hours | **Priority:** P1

#### 2.3 Add Level Milestone Paywall Trigger
**File:** `/packages/backend/convex/gamification.ts`

```typescript
export const checkLevelMilestones = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userStats = await ctx.db
      .query("userStats")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (!userStats) return;

    const isPro = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("clerkId"), args.userId))
      .first();

    // If user reaches Level 3 and is NOT pro, show paywall
    if (userStats.level === 3 && !isPro?.tier === "pro") {
      await ctx.db.insert("paywallTriggers", {
        userId: args.userId,
        trigger: "level_3_milestone",
        level: 3,
        triggeredAt: Date.now(),
      });

      // This will be checked in app to show modal
      return { showPaywall: true, reason: "level_3_milestone" };
    }

    // If user reaches Level 4+, encourage pro for faster leveling
    if (userStats.level >= 4 && !isPro?.tier === "pro") {
      return {
        showPaywall: true,
        reason: "level_milestone",
        message: `You're Level ${userStats.level}. Pro users reach here 2x faster.`,
      };
    }
  },
});
```

**Effort:** 1 hour | **Priority:** P2

#### 2.4 Location Limit Gate
**File:** `/packages/backend/convex/userLocations.ts`

```typescript
export const addLocation = mutation({
  args: { userId: v.string(), name: v.string(), location: LocationSchema },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("clerkId"), args.userId))
      .first();

    const existingLocations = await ctx.db
      .query("userLocations")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .collect();

    // Check limit
    const maxLocations = user?.tier === "pro" ? 5 : 1;

    if (existingLocations.length >= maxLocations) {
      // Throw error or return upgrade trigger
      return {
        success: false,
        needsUpgrade: true,
        message: `Free users can save ${maxLocations} location(s). Upgrade to Pro for 5.`,
      };
    }

    // Add location
    return await ctx.db.insert("userLocations", {
      userId: args.userId,
      name: args.name,
      location: args.location,
      isDefault: existingLocations.length === 0,
    });
  },
});
```

**Effort:** 1 hour | **Priority:** P1

#### 2.5 Hook Level Milestone to UI
**File:** `/apps/native/app/(tabs)/index.tsx` (Update)

```typescript
useEffect(() => {
  // After user levels up, show milestone modal if not pro
  if (userStats?.level === 3 && currentUser?.tier !== "pro") {
    router.push("/paywall?type=level_milestone&level=3");
  }
}, [userStats?.level, currentUser?.tier]);
```

**Effort:** 30 min | **Priority:** P1

**Week 3-4 Total Effort:** ~6 hours

---

## SEMANA 5-6: Email & Push Setup

### Objetivo
Configurar secuencia de emails y push notifications

### Tasks

#### 3.1 Email Service Setup
**Choose service:** SendGrid, Mailgun, or Resend

**Create email templates in service:**

1. Day 14 Email: "Time Angle"
2. Day 28 Email: "Money Angle"
3. Day 42 Email: "Community Angle"
4. Day 56 Email: "Limited Offer"

**Example SendGrid template:**

```html
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text font-size="24px" align="center">
          You're missing 2.5 hours of saved time
        </mj-text>

        <mj-text>
          Hi {{firstName}},

          Quick question: How many minutes do you spend each morning checking weather, traffic, and commute news?
        </mj-text>

        <mj-button href="https://outia.app/calculate-time">
          Calculate Your Time
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

**Effort:** 2 hours | **Priority:** P1

#### 3.2 Email Delivery Mutations
**File:** `/packages/backend/convex/emails.ts` (Create)

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

export const sendReEngagementEmail = mutation({
  args: {
    userId: v.string(),
    emailType: v.union(
      v.literal("day_14_time"),
      v.literal("day_28_money"),
      v.literal("day_42_community"),
      v.literal("day_56_offer")
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("clerkId"), args.userId))
      .first();

    if (!user) return;

    const emailTemplates = {
      day_14_time: "d-template-id-1",
      day_28_money: "d-template-id-2",
      day_42_community: "d-template-id-3",
      day_56_offer: "d-template-id-4",
    };

    // Send via SendGrid
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: user.email }],
            dynamic_template_data: {
              firstName: user.firstName,
              daysAsUser: Math.floor(
                (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
              ),
            },
          },
        ],
        from: { email: "team@outia.app", name: "Outia Team" },
        template_id: emailTemplates[args.emailType],
      }),
    });

    // Track email send
    await ctx.db.insert("emailEvents", {
      userId: args.userId,
      emailType: args.emailType,
      sentAt: Date.now(),
    });
  },
});
```

**Effort:** 1.5 hours | **Priority:** P1

#### 3.3 Email Scheduler (Convex Cron)
**File:** `/packages/backend/convex/scheduled/emailScheduler.ts` (Create)

```typescript
import { internal } from "../_generated/api";
import { cronJob } from "convex/server";

export const sendReEngagementEmails = cronJob({
  schedule: "0 9 * * *", // 9 AM UTC daily
  handler: async (ctx) => {
    // Find users who are Day 14, 28, 42, 56 without trial/pro
    const users = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("tier"), "free"))
      .collect();

    for (const user of users) {
      const daysAsUser = Math.floor(
        (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
      );

      if (daysAsUser === 14) {
        await ctx.runMutation(internal.emails.sendReEngagementEmail, {
          userId: user.clerkId,
          emailType: "day_14_time",
        });
      } else if (daysAsUser === 28) {
        await ctx.runMutation(internal.emails.sendReEngagementEmail, {
          userId: user.clerkId,
          emailType: "day_28_money",
        });
      } else if (daysAsUser === 42) {
        await ctx.runMutation(internal.emails.sendReEngagementEmail, {
          userId: user.clerkId,
          emailType: "day_42_community",
        });
      } else if (daysAsUser === 56) {
        await ctx.runMutation(internal.emails.sendReEngagementEmail, {
          userId: user.clerkId,
          emailType: "day_56_offer",
        });
      }
    }
  },
});
```

**Effort:** 1.5 hours | **Priority:** P2

#### 3.4 Push Notifications Setup
**Update:** `/apps/native/providers/RevenueCatProvider.tsx`

```typescript
// Add push notification payloads for different triggers

export const PUSH_NOTIFICATION_TRIGGERS = {
  // Daily engagement
  morning_weather_alert: {
    title: "Bad weather today",
    body: "2,400+ Pro users got 1-hour advance warnings. See how.",
    deeplink: "app://paywall?type=forecast",
    badge: "2",
  },

  evening_streak: {
    title: "Your streak is alive!",
    body: "1 more vote keeps it going. Help the community.",
    deeplink: "app://map",
    badge: "1",
  },

  level_3_milestone: {
    title: "🎉 Route Guardian unlocked!",
    body: "Pro members reach Level 4+ in 2 weeks. See what's next.",
    deeplink: "app://paywall?type=level_milestone",
    badge: "1",
  },

  // Weekly re-engagement
  week_2_impact: {
    title: "See your impact this week",
    body: "You helped 5,000+ drivers. Pro members influence 10,000+.",
    deeplink: "app://paywall",
    badge: "1",
  },
};
```

**Effort:** 1 hour | **Priority:** P2

**Week 5-6 Total Effort:** ~6 hours

---

## SEMANA 7-8: Analytics & Dashboard

### Objetivo
Configurar tracking completo y dashboard de conversión

### Tasks

#### 4.1 Conversion Funnel Query
**File:** `/packages/backend/convex/analytics.ts` (Update)

```typescript
export const getConversionFunnel = query({
  args: { paywallType: v.string() },
  handler: async (ctx, args) => {
    const views = await ctx.db
      .query("paywallAnalytics")
      .filter(q => q.eq(q.field("paywallType"), args.paywallType))
      .collect();

    const conversions = await ctx.db
      .query("conversionEvents")
      .filter(q => q.eq(q.field("paywallType"), args.paywallType))
      .collect();

    return {
      totalViews: views.length,
      totalConversions: conversions.length,
      conversionRate: (conversions.length / views.length) * 100,
      viewsByTrigger: groupBy(views, "trigger"),
      conversionsByType: groupBy(conversions, "subscriptionType"),
    };
  },
});

export const getUserCohortAnalysis = query({
  args: { daysRange: v.number() },
  handler: async (ctx, args) => {
    const cohortDate = Date.now() - args.daysRange * 24 * 60 * 60 * 1000;

    const users = await ctx.db
      .query("users")
      .filter(q => q.gte(q.field("createdAt"), cohortDate))
      .collect();

    const conversionsByDay = {};
    for (let i = 0; i < args.daysRange; i++) {
      const dayStart = cohortDate + i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayConversions = users.filter(
        u => u.createdAt >= dayStart && u.createdAt < dayEnd && u.tier === "pro"
      );

      conversionsByDay[i] = {
        date: new Date(dayStart).toISOString(),
        signups: users.filter(u => u.createdAt >= dayStart && u.createdAt < dayEnd).length,
        conversions: dayConversions.length,
        rate: (dayConversions.length / users.filter(u => u.createdAt >= dayStart && u.createdAt < dayEnd).length) * 100,
      };
    }

    return conversionsByDay;
  },
});
```

**Effort:** 2 hours | **Priority:** P1

#### 4.2 Create Analytics Dashboard Component
**New:** `/apps/web/src/app/analytics/page.tsx`

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function AnalyticsDashboard() {
  const funnelData = useQuery(api.analytics.getConversionFunnel, {
    paywallType: "smart_departure",
  });

  const cohortData = useQuery(api.analytics.getUserCohortAnalysis, {
    daysRange: 30,
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Conversion Analytics</h1>

      {/* Funnel Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Paywall Views"
          value={funnelData?.totalViews || 0}
        />
        <MetricCard
          title="Conversions"
          value={funnelData?.totalConversions || 0}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${(funnelData?.conversionRate || 0).toFixed(1)}%`}
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${((funnelData?.totalConversions || 0) * 2.50).toFixed(2)}`}
        />
      </div>

      {/* Conversion Rate Over Time */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Conversion Rate (30 days)</h2>
        <LineChart width={800} height={300} data={Object.values(cohortData || {})}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="rate" stroke="#3B82F6" />
        </LineChart>
      </div>

      {/* Views by Trigger */}
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Views by Trigger</h3>
          {funnelData?.viewsByTrigger && Object.entries(funnelData.viewsByTrigger).map(([trigger, count]) => (
            <div key={trigger} className="flex justify-between py-2 border-b">
              <span>{trigger}</span>
              <span className="font-semibold">{count as number}</span>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Conversions by Plan</h3>
          {funnelData?.conversionsByType && Object.entries(funnelData.conversionsByType).map(([type, count]) => (
            <div key={type} className="flex justify-between py-2 border-b">
              <span>{type}</span>
              <span className="font-semibold">{count as number}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Effort:** 2 hours | **Priority:** P2

#### 4.3 A/B Test Framework
**File:** `/packages/backend/convex/abTests.ts` (Create)

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createABTest = mutation({
  args: {
    name: v.string(),
    variants: v.array(v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
    })),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("abTests", {
      name: args.name,
      variants: args.variants,
      startDate: args.startDate,
      endDate: args.endDate,
      active: true,
    });
  },
});

export const assignUserToVariant = mutation({
  args: { userId: v.string(), testId: v.id("abTests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) return;

    // Assign randomly to variant
    const variantIndex = Math.floor(Math.random() * test.variants.length);
    const variant = test.variants[variantIndex];

    await ctx.db.insert("userVariantAssignments", {
      userId: args.userId,
      testId: args.testId,
      variantId: variant.id,
      assignedAt: Date.now(),
    });

    return variant;
  },
});

export const trackTestConversion = mutation({
  args: {
    userId: v.string(),
    testId: v.id("abTests"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query("userVariantAssignments")
      .filter(
        q =>
          q.and(
            q.eq(q.field("userId"), args.userId),
            q.eq(q.field("testId"), args.testId)
          )
      )
      .first();

    if (!assignment) return;

    await ctx.db.insert("testConversions", {
      userId: args.userId,
      testId: args.testId,
      variantId: assignment.variantId,
      convertedAt: Date.now(),
    });
  },
});

export const getTestResults = query({
  args: { testId: v.id("abTests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) return null;

    const results = {};
    for (const variant of test.variants) {
      const assigned = await ctx.db
        .query("userVariantAssignments")
        .filter(q => q.eq(q.field("variantId"), variant.id))
        .collect();

      const conversions = await ctx.db
        .query("testConversions")
        .filter(q => q.eq(q.field("variantId"), variant.id))
        .collect();

      results[variant.id] = {
        name: variant.name,
        assigned: assigned.length,
        conversions: conversions.length,
        rate: (conversions.length / assigned.length) * 100,
      };
    }

    return results;
  },
});
```

**Effort:** 2 hours | **Priority:** P2

#### 4.4 Add A/B Test Schema
**File:** `/packages/backend/convex/schema.ts` (Update)

```typescript
abTests: defineTable({
  name: v.string(),
  variants: v.array(v.object({
    id: v.string(),
    name: v.string(),
    description: v.string(),
  })),
  startDate: v.number(),
  endDate: v.number(),
  active: v.boolean(),
}).index("by_active", ["active"]),

userVariantAssignments: defineTable({
  userId: v.string(),
  testId: v.id("abTests"),
  variantId: v.string(),
  assignedAt: v.number(),
})
.index("by_user", ["userId"])
.index("by_test", ["testId"]),

testConversions: defineTable({
  userId: v.string(),
  testId: v.id("abTests"),
  variantId: v.string(),
  convertedAt: v.number(),
})
.index("by_test", ["testId"])
.index("by_variant", ["variantId"]),
```

**Effort:** 30 min | **Priority:** P2

**Week 7-8 Total Effort:** ~8.5 hours

---

## SEMANA 9-10: A/B Testing & Optimization

### Objetivo
Lanzar y monitorear A/B tests

### Tasks

#### 5.1 Launch Test #1: Headlines

**In code:** `/apps/native/app/paywall.tsx`

```typescript
const [headlineVariant, setHeadlineVariant] = useState("control");

useEffect(() => {
  // Assign user to test variant
  assignUserToVariant(user?.id, testIds.headlineTest).then(variant => {
    setHeadlineVariant(variant.id);
  });
}, []);

const headlines = {
  control: "Never Miss the Perfect Window",
  variant_a: "Save 2.5 Hours Every Week",
  variant_b: "Stop Guessing When to Leave",
  variant_c: "Get Back 1 Hour Weekly",
};
```

**Effort:** 1 hour | **Priority:** P1

#### 5.2 Monitor Results Daily
**Daily check-in:** Review `/analytics` dashboard for:
- Views by variant
- Conversions by variant
- Statistical significance (need 300+ samples per variant for significance)

**Expected timeline:** 2-3 weeks for results

**Effort:** 30 min/day | **Priority:** P1

#### 5.3 Implement Winning Variants
Once winner identified (10%+ lift or statistical significance):

```typescript
// Update copy across all paywalls
const WINNING_HEADLINE = "Save 2.5 Hours Every Week"; // Example winner
const WINNING_CTA = "Try Pro Free"; // Example winner
```

**Effort:** 1 hour | **Priority:** P1

#### 5.4 Launch Test #2: CTA Button

After Test #1 results (week 10+)

**Effort:** 1 hour | **Priority:** P2

**Week 9-10 Total Effort:** ~3.5 hours

---

## TIMELINE RESUMEN

| Semana | Hito | Esfuerzo | Status |
|--------|------|----------|--------|
| 1-2 | Paywall update + tracking | 4h | [ ] |
| 3-4 | Feature gates + gamification | 6h | [ ] |
| 5-6 | Email + push setup | 6h | [ ] |
| 7-8 | Analytics dashboard | 8.5h | [ ] |
| 9-10 | A/B tests (Headline) | 3.5h | [ ] |
| 11-12 | A/B tests (CTA) + optimize | 2h | [ ] |
|  | **TOTAL** | **30h** |  |

---

## CHECKLIST DE IMPLEMENTACIÓN

### Semana 1-2
- [ ] Update paywall copy in component
- [ ] Add feature comparison table
- [ ] Create analytics tracking mutations
- [ ] Update schema with tracking tables
- [ ] Add tracking calls to paywall component

### Semana 3-4
- [ ] Create ForecastGate component
- [ ] Create SmartDepartureGate component
- [ ] Add level milestone paywall trigger
- [ ] Implement location limit gate
- [ ] Hook gamification to paywall triggers

### Semana 5-6
- [ ] Setup email service (SendGrid/Mailgun)
- [ ] Create email templates
- [ ] Implement email delivery mutations
- [ ] Setup cron job for email scheduling
- [ ] Configure push notification triggers

### Semana 7-8
- [ ] Create funnel query
- [ ] Create user cohort analysis query
- [ ] Build analytics dashboard
- [ ] Setup A/B test framework
- [ ] Add A/B test schema

### Semana 9-10
- [ ] Launch headline A/B test
- [ ] Monitor test results
- [ ] Implement winner
- [ ] Launch CTA A/B test

### Semana 11-12
- [ ] Final optimization
- [ ] Deploy winning variants
- [ ] Monitor conversion metrics
- [ ] Prepare next test cycle

---

## ARCHIVOS A CREAR

```
/Users/lucasmontegu/lumlabs-projects/outia/
├── docs/
│   ├── CONVERSION_STRATEGY.md ✓ (created)
│   ├── PAYWALL_COPY_TEMPLATES.md ✓ (created)
│   ├── IMPLEMENTATION_ROADMAP.md ✓ (created)
│   └── EMAIL_TEMPLATES.md (create in week 5)
├── apps/native/components/
│   ├── ForecastGate.tsx (create week 3)
│   └── SmartDepartureGate.tsx (create week 3)
├── packages/backend/convex/
│   ├── analytics.ts (create week 1)
│   ├── emails.ts (create week 5)
│   ├── abTests.ts (create week 7)
│   └── scheduled/emailScheduler.ts (create week 5)
└── apps/web/src/app/analytics/
    └── page.tsx (create week 7)
```

---

## MÉTRICAS DE ÉXITO

**By End of Week 12:**

- [ ] Paywall view rate: 40%+ of new users
- [ ] Trial start rate: 15%+ of paywall viewers
- [ ] Trial-to-paid conversion: 35%+
- [ ] LTV: $35+/user
- [ ] Monthly recurring revenue: $5,000+
- [ ] Headline A/B test winner: +5-10% lift
- [ ] CTA A/B test winner: +3-5% lift

---

**Documento preparado:** Lucas Montegudo
**Fecha:** Feb 3, 2026
**Estado:** Listo para implementar
