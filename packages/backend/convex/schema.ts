import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Weather and traffic events from APIs and users
  events: defineTable({
    type: v.union(v.literal("weather"), v.literal("traffic")),
    subtype: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
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
    .index("by_ttl", ["ttl"]),

  // User saved locations (home, work, etc.)
  userLocations: defineTable({
    userId: v.string(),
    name: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    address: v.optional(v.string()),
    isDefault: v.boolean(),
    pushToken: v.optional(v.string()),
  })
    .index("by_user", ["userId"]),

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
});
