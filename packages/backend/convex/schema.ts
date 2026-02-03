import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users synced from Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tier: v.union(v.literal("free"), v.literal("pro")),
    onboardingCompleted: v.boolean(),
    // Subscription fields (RevenueCat)
    subscriptionId: v.optional(v.string()),
    subscriptionExpiresAt: v.optional(v.number()),
    subscriptionStatus: v.optional(
      v.union(
        v.literal("active"),
        v.literal("cancelled"),
        v.literal("expired"),
        v.literal("grace_period"),
        v.literal("paused")
      )
    ),
    // User preferences from onboarding
    preferences: v.optional(
      v.object({
        primaryConcern: v.union(
          v.literal("weather"),
          v.literal("traffic"),
          v.literal("both")
        ),
        commuteTime: v.optional(v.string()),
        alertAdvanceMinutes: v.optional(v.number()),
      })
    ),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Weather and traffic events from APIs and users
  events: defineTable({
    type: v.union(v.literal("weather"), v.literal("traffic")),
    subtype: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    // Geospatial grid cell for efficient location queries (e.g., "45.5_-73.5")
    // ~50km cells - calculated as floor(lat/0.5)*0.5 + "_" + floor(lng/0.5)*0.5
    gridCell: v.optional(v.string()),
    // Route points for drawing polylines (traffic events)
    routePoints: v.optional(
      v.array(
        v.object({
          lat: v.number(),
          lng: v.number(),
        })
      )
    ),
    radius: v.number(),
    severity: v.number(),
    source: v.union(
      v.literal("openweathermap"),
      v.literal("tomorrow"),
      v.literal("here"),
      v.literal("user")
    ),
    confidenceScore: v.number(),
    ttl: v.number(),
    rawData: v.optional(v.any()),
  })
    .index("by_type", ["type"])
    .index("by_ttl", ["ttl"])
    .index("by_grid_ttl", ["gridCell", "ttl"]),

  // User saved locations (home, work, etc.)
  userLocations: defineTable({
    userId: v.string(),
    name: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    // Geospatial grid cell for efficient cron job grouping
    gridCell: v.optional(v.string()),
    address: v.optional(v.string()),
    isDefault: v.boolean(),
    pushToken: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_grid", ["gridCell"]),

  // Community votes on events
  confirmations: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    vote: v.union(
      v.literal("still_active"),
      v.literal("cleared"),
      v.literal("not_exists")
    ),
  })
    .index("by_event", ["eventId"])
    .index("by_user_event", ["userId", "eventId"]),

  // User saved routes
  routes: defineTable({
    userId: v.string(),
    name: v.string(),
    fromLocationId: v.optional(v.id("userLocations")),
    fromName: v.string(),
    toLocationId: v.optional(v.id("userLocations")),
    toName: v.string(),
    fromLocation: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    toLocation: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    icon: v.union(v.literal("building"), v.literal("running"), v.literal("home")),
    monitorDays: v.array(v.boolean()),
    alertThreshold: v.number(),
    alertTime: v.string(),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"]),

  // Calculated risk scores per location
  riskSnapshots: defineTable({
    locationId: v.id("userLocations"),
    userId: v.string(),
    score: v.number(),
    previousScore: v.optional(v.number()),
    classification: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    breakdown: v.object({
      weatherScore: v.number(),
      trafficScore: v.number(),
      eventScore: v.number(),
    }),
    weatherData: v.optional(v.any()),
    trafficData: v.optional(v.any()),
  })
    .index("by_location", ["locationId"])
    .index("by_user", ["userId"]),

  // Gamification: User stats and progression
  userStats: defineTable({
    userId: v.string(),

    // Points & Level
    totalPoints: v.number(),
    level: v.number(),

    // Accuracy tracking
    totalVotes: v.number(),
    correctVotes: v.number(),
    accuracyPercent: v.number(),

    // Activity tracking
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastVoteDate: v.string(),
    votesThisWeek: v.number(),
    inactiveWeeks: v.number(),

    // Category stats
    weatherVotes: v.number(),
    trafficVotes: v.number(),
    firstResponderCount: v.number(),

    // Percentile (recalculated periodically)
    percentileRank: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_points", ["totalPoints"]),

  // Gamification: Earned badges
  userBadges: defineTable({
    userId: v.string(),
    badgeId: v.string(),
    earnedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_badge", ["badgeId"])
    .index("by_user_badge", ["userId", "badgeId"]),
});
