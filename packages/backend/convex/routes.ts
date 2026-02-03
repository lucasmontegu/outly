import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Route document type for return validators
const routeDoc = v.object({
  _id: v.id("routes"),
  _creationTime: v.number(),
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
});

// Get all routes for current user
export const getUserRoutes = query({
  args: {},
  returns: v.array(routeDoc),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const routes = await ctx.db
      .query("routes")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return routes;
  },
});

// Get a single route
export const getRoute = query({
  args: { routeId: v.id("routes") },
  returns: v.union(routeDoc, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const route = await ctx.db.get(args.routeId);
    if (!route || route.userId !== identity.subject) {
      return null;
    }

    return route;
  },
});

// Create a new route
export const createRoute = mutation({
  args: {
    name: v.string(),
    fromName: v.string(),
    toName: v.string(),
    fromLocation: v.object({ lat: v.number(), lng: v.number() }),
    toLocation: v.object({ lat: v.number(), lng: v.number() }),
    fromLocationId: v.optional(v.id("userLocations")),
    toLocationId: v.optional(v.id("userLocations")),
    icon: v.union(v.literal("building"), v.literal("running"), v.literal("home")),
    monitorDays: v.array(v.boolean()),
    alertThreshold: v.number(),
    alertTime: v.string(),
  },
  returns: v.id("routes"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const routeId = await ctx.db.insert("routes", {
      userId: identity.subject,
      name: args.name,
      fromName: args.fromName,
      toName: args.toName,
      fromLocation: args.fromLocation,
      toLocation: args.toLocation,
      fromLocationId: args.fromLocationId,
      toLocationId: args.toLocationId,
      icon: args.icon,
      monitorDays: args.monitorDays,
      alertThreshold: args.alertThreshold,
      alertTime: args.alertTime,
      isActive: true,
    });

    return routeId;
  },
});

// Update a route
export const updateRoute = mutation({
  args: {
    routeId: v.id("routes"),
    name: v.optional(v.string()),
    monitorDays: v.optional(v.array(v.boolean())),
    alertThreshold: v.optional(v.number()),
    alertTime: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const route = await ctx.db.get(args.routeId);
    if (!route || route.userId !== identity.subject) {
      throw new Error("Route not found");
    }

    const { routeId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(routeId, filteredUpdates);
    return null;
  },
});

// Delete a route
export const deleteRoute = mutation({
  args: { routeId: v.id("routes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const route = await ctx.db.get(args.routeId);
    if (!route || route.userId !== identity.subject) {
      throw new Error("Route not found");
    }

    await ctx.db.delete(args.routeId);
    return null;
  },
});

// Route with forecast info
const routeWithForecastDoc = v.object({
  _id: v.id("routes"),
  _creationTime: v.number(),
  userId: v.string(),
  name: v.string(),
  fromName: v.string(),
  toName: v.string(),
  icon: v.union(v.literal("building"), v.literal("running"), v.literal("home")),
  currentScore: v.number(),
  classification: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  optimalDepartureMinutes: v.number(),
  optimalTime: v.string(),
  isOptimalNow: v.boolean(),
});

// Get all routes with forecast data for the current user
export const getRoutesWithForecast = query({
  args: {},
  returns: v.array(routeWithForecastDoc),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const routes = await ctx.db
      .query("routes")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (routes.length === 0) return [];

    const now = Date.now();
    const events = await ctx.db.query("events").collect();

    const results = routes.map((route) => {
      // Calculate forecast for route's origin location
      const nearbyEvents = events.filter((e) => {
        if (e.ttl <= now || e.confidenceScore <= 20) return false;
        const distance = haversineDistance(
          route.fromLocation.lat,
          route.fromLocation.lng,
          e.location.lat,
          e.location.lng
        );
        return distance <= 10;
      });

      let baseWeatherScore = 0;
      let baseTrafficScore = 0;
      for (const event of nearbyEvents) {
        const distance = haversineDistance(
          route.fromLocation.lat,
          route.fromLocation.lng,
          event.location.lat,
          event.location.lng
        );
        const impactFactor = Math.max(0, 1 - distance / 10);
        const impact = event.severity * impactFactor * (event.confidenceScore / 100) * 10;
        if (event.type === "weather") {
          baseWeatherScore += impact;
        } else {
          baseTrafficScore += impact;
        }
      }
      baseWeatherScore = Math.min(100, Math.round(baseWeatherScore));
      baseTrafficScore = Math.min(100, Math.round(baseTrafficScore));

      // Generate forecast slots
      let optimalIndex = 0;
      let minScore = Infinity;

      for (let i = 0; i < 8; i++) {
        const slotTime = new Date(now + i * 15 * 60 * 1000);
        const slotHour = slotTime.getHours();

        const weatherDecay = Math.max(0, 1 - i * 0.08);
        const predictedWeatherScore = Math.round(baseWeatherScore * weatherDecay);
        const trafficModifier = getTrafficModifier(slotHour);
        const predictedTrafficScore = Math.round(
          Math.min(100, Math.max(0, baseTrafficScore * trafficModifier))
        );

        const score = Math.round(predictedWeatherScore * 0.4 + predictedTrafficScore * 0.6);

        if (score < minScore) {
          minScore = score;
          optimalIndex = i;
        }
      }

      const optimalTime = new Date(now + optimalIndex * 15 * 60 * 1000);
      const hours = optimalTime.getHours() % 12 || 12;
      const minutes = optimalTime.getMinutes();
      const ampm = optimalTime.getHours() >= 12 ? "PM" : "AM";
      const optimalTimeLabel = `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;

      const currentScore = Math.round(baseWeatherScore * 0.4 + baseTrafficScore * 0.6);
      const classification: "low" | "medium" | "high" =
        currentScore < 34 ? "low" : currentScore < 67 ? "medium" : "high";

      return {
        _id: route._id,
        _creationTime: route._creationTime,
        userId: route.userId,
        name: route.name,
        fromName: route.fromName,
        toName: route.toName,
        icon: route.icon,
        currentScore,
        classification,
        optimalDepartureMinutes: optimalIndex * 15,
        optimalTime: optimalTimeLabel,
        isOptimalNow: optimalIndex === 0,
      };
    });

    return results;
  },
});

// Traffic modifier based on time of day
function getTrafficModifier(hour: number): number {
  if (hour >= 7 && hour < 9) return 1.4;
  if (hour >= 9 && hour < 12) return 1.0;
  if (hour >= 12 && hour < 14) return 1.1;
  if (hour >= 14 && hour < 17) return 1.0;
  if (hour >= 17 && hour < 19) return 1.5;
  if (hour >= 19 && hour < 21) return 0.8;
  return 0.5;
}

// Haversine formula for distance
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
