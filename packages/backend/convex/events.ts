import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Event document validator (reusable)
const eventDoc = v.object({
  _id: v.id("events"),
  _creationTime: v.number(),
  type: v.union(v.literal("weather"), v.literal("traffic")),
  subtype: v.string(),
  location: v.object({
    lat: v.number(),
    lng: v.number(),
  }),
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
});

export const listActive = query({
  args: {
    type: v.optional(v.union(v.literal("weather"), v.literal("traffic"))),
  },
  returns: v.array(eventDoc),
  handler: async (ctx, args) => {
    const now = Date.now();

    const events = args.type
      ? await ctx.db
          .query("events")
          .withIndex("by_type", (q) => q.eq("type", args.type!))
          .collect()
      : await ctx.db.query("events").collect();

    // Filter expired and low confidence events
    return events.filter((e) => e.ttl > now && e.confidenceScore > 20);
  },
});

export const listNearby = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.number(),
  },
  returns: v.array(eventDoc),
  handler: async (ctx, args) => {
    const now = Date.now();
    const events = await ctx.db.query("events").collect();

    // Filter by distance, TTL, and confidence
    return events.filter((e) => {
      if (e.ttl <= now || e.confidenceScore <= 20) return false;

      const distance = haversineDistance(
        args.lat,
        args.lng,
        e.location.lat,
        e.location.lng
      );

      return distance <= args.radiusKm;
    });
  },
});

export const report = mutation({
  args: {
    type: v.union(v.literal("weather"), v.literal("traffic")),
    subtype: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    severity: v.number(),
  },
  returns: v.id("events"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // User-reported events start with 60 confidence, expire in 1 hour
    return await ctx.db.insert("events", {
      type: args.type,
      subtype: args.subtype,
      location: args.location,
      radius: 1000, // 1km default radius
      severity: Math.min(5, Math.max(1, args.severity)),
      source: "user",
      confidenceScore: 60,
      ttl: Date.now() + 60 * 60 * 1000, // 1 hour
    });
  },
});

// Internal mutation for API-sourced events
export const upsertFromAPI = internalMutation({
  args: {
    type: v.union(v.literal("weather"), v.literal("traffic")),
    subtype: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
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
      v.literal("here")
    ),
    ttl: v.number(),
    rawData: v.optional(v.any()),
  },
  returns: v.id("events"),
  handler: async (ctx, args) => {
    // API events have 100 confidence
    return await ctx.db.insert("events", {
      ...args,
      confidenceScore: 100,
    });
  },
});

// Internal: clean expired events
export const cleanExpired = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("events")
      .withIndex("by_ttl")
      .filter((q) => q.lt(q.field("ttl"), now))
      .collect();

    for (const event of expired) {
      await ctx.db.delete(event._id);
    }

    return expired.length;
  },
});

// Haversine formula for distance calculation
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
