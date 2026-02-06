import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// ============================================================================
// GRID CELL UTILITIES - For geospatial bandwidth optimization
// Grid size: 0.5 degrees ≈ 50km cells
// ============================================================================

const GRID_SIZE = 0.5;

/**
 * Calculate grid cell identifier from coordinates
 * Format: "lat_lng" (e.g., "45.5_-73.5")
 */
export function calculateGridCell(lat: number, lng: number): string {
  const cellLat = Math.floor(lat / GRID_SIZE) * GRID_SIZE;
  const cellLng = Math.floor(lng / GRID_SIZE) * GRID_SIZE;
  return `${cellLat.toFixed(1)}_${cellLng.toFixed(1)}`;
}

/**
 * Get all grid cells that intersect a radius around a point
 * Used for efficient location-based queries
 */
export function getIntersectingGridCells(
  lat: number,
  lng: number,
  radiusKm: number
): string[] {
  // 1 degree ≈ 111km at equator, less at higher latitudes
  const kmPerDegree = 111 * Math.cos((lat * Math.PI) / 180);
  const cellsNeeded = Math.ceil(radiusKm / (GRID_SIZE * kmPerDegree)) + 1;

  const baseLat = Math.floor(lat / GRID_SIZE) * GRID_SIZE;
  const baseLng = Math.floor(lng / GRID_SIZE) * GRID_SIZE;

  const cells: string[] = [];
  for (let i = -cellsNeeded; i <= cellsNeeded; i++) {
    for (let j = -cellsNeeded; j <= cellsNeeded; j++) {
      const cellLat = baseLat + i * GRID_SIZE;
      const cellLng = baseLng + j * GRID_SIZE;
      cells.push(`${cellLat.toFixed(1)}_${cellLng.toFixed(1)}`);
    }
  }
  return cells;
}

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
  gridCell: v.optional(v.string()),
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

// Slim event for list views (excludes rawData and routePoints to save bandwidth)
const slimEventDoc = v.object({
  _id: v.id("events"),
  _creationTime: v.number(),
  type: v.union(v.literal("weather"), v.literal("traffic")),
  subtype: v.string(),
  location: v.object({ lat: v.number(), lng: v.number() }),
  radius: v.number(),
  severity: v.number(),
  confidenceScore: v.number(),
  ttl: v.number(),
});

// Medium event for map view (includes routePoints for traffic polylines, excludes rawData)
const mediumEventDoc = v.object({
  _id: v.id("events"),
  _creationTime: v.number(),
  type: v.union(v.literal("weather"), v.literal("traffic")),
  subtype: v.string(),
  location: v.object({ lat: v.number(), lng: v.number() }),
  routePoints: v.optional(v.array(v.object({ lat: v.number(), lng: v.number() }))),
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
});

export const listActive = query({
  args: {
    type: v.optional(v.union(v.literal("weather"), v.literal("traffic"))),
    // Client provides timestamp rounded to minute for better cache hits
    asOfTimestamp: v.optional(v.number()),
  },
  returns: v.array(eventDoc),
  handler: async (ctx, args) => {
    // Round to nearest minute for cache-friendly behavior
    const now = args.asOfTimestamp
      ? Math.floor(args.asOfTimestamp / 60000) * 60000
      : Date.now();

    // Use TTL index to filter at database level (more efficient)
    const events = await ctx.db
      .query("events")
      .withIndex("by_ttl", (q) => q.gt("ttl", now))
      .collect();

    // Apply remaining filters in memory
    return events.filter(
      (e) =>
        e.confidenceScore > 20 && (!args.type || e.type === args.type)
    );
  },
});

// Slim version for mobile - excludes rawData and routePoints (saves ~70% bandwidth)
export const listActiveSlim = query({
  args: {
    type: v.optional(v.union(v.literal("weather"), v.literal("traffic"))),
    asOfTimestamp: v.optional(v.number()),
  },
  returns: v.array(slimEventDoc),
  handler: async (ctx, args) => {
    const now = args.asOfTimestamp
      ? Math.floor(args.asOfTimestamp / 60000) * 60000
      : Date.now();

    const events = await ctx.db
      .query("events")
      .withIndex("by_ttl", (q) => q.gt("ttl", now))
      .collect();

    return events
      .filter(
        (e) =>
          e.confidenceScore > 20 && (!args.type || e.type === args.type)
      )
      .map(({ _id, _creationTime, type, subtype, location, radius, severity, confidenceScore, ttl }) => ({
        _id,
        _creationTime,
        type,
        subtype,
        location,
        radius,
        severity,
        confidenceScore,
        ttl,
      }));
  },
});

export const listNearby = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.number(),
    asOfTimestamp: v.optional(v.number()),
  },
  returns: v.array(eventDoc),
  handler: async (ctx, args) => {
    const now = args.asOfTimestamp
      ? Math.floor(args.asOfTimestamp / 60000) * 60000
      : Date.now();

    // Get grid cells that intersect with search radius
    const gridCells = getIntersectingGridCells(args.lat, args.lng, args.radiusKm);

    // Query events from relevant grid cells only (huge bandwidth savings!)
    const eventPromises = gridCells.map((cell) =>
      ctx.db
        .query("events")
        .withIndex("by_grid_ttl", (q) => q.eq("gridCell", cell).gt("ttl", now))
        .collect()
    );

    const eventArrays = await Promise.all(eventPromises);
    const events = eventArrays.flat();

    // Deduplicate and filter by exact distance
    const seen = new Set<string>();
    return events.filter((e) => {
      if (seen.has(e._id)) return false;
      seen.add(e._id);

      if (e.confidenceScore <= 20) return false;

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

// Slim version for mobile map view
export const listNearbySlim = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.number(),
    asOfTimestamp: v.optional(v.number()),
  },
  returns: v.array(slimEventDoc),
  handler: async (ctx, args) => {
    const now = args.asOfTimestamp
      ? Math.floor(args.asOfTimestamp / 60000) * 60000
      : Date.now();

    const gridCells = getIntersectingGridCells(args.lat, args.lng, args.radiusKm);

    const eventPromises = gridCells.map((cell) =>
      ctx.db
        .query("events")
        .withIndex("by_grid_ttl", (q) => q.eq("gridCell", cell).gt("ttl", now))
        .collect()
    );

    const eventArrays = await Promise.all(eventPromises);
    const events = eventArrays.flat();

    const seen = new Set<string>();
    return events
      .filter((e) => {
        if (seen.has(e._id)) return false;
        seen.add(e._id);
        if (e.confidenceScore <= 20) return false;
        const distance = haversineDistance(
          args.lat,
          args.lng,
          e.location.lat,
          e.location.lng
        );
        return distance <= args.radiusKm;
      })
      .map(({ _id, _creationTime, type, subtype, location, radius, severity, confidenceScore, ttl }) => ({
        _id,
        _creationTime,
        type,
        subtype,
        location,
        radius,
        severity,
        confidenceScore,
        ttl,
      }));
  },
});

// Medium version for map view - includes routePoints for traffic polylines, excludes rawData
export const listNearbyMedium = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.number(),
    asOfTimestamp: v.optional(v.number()),
  },
  returns: v.array(mediumEventDoc),
  handler: async (ctx, args) => {
    const now = args.asOfTimestamp
      ? Math.floor(args.asOfTimestamp / 60000) * 60000
      : Date.now();

    const gridCells = getIntersectingGridCells(args.lat, args.lng, args.radiusKm);

    const eventPromises = gridCells.map((cell) =>
      ctx.db
        .query("events")
        .withIndex("by_grid_ttl", (q) => q.eq("gridCell", cell).gt("ttl", now))
        .collect()
    );

    const eventArrays = await Promise.all(eventPromises);
    const events = eventArrays.flat();

    const seen = new Set<string>();
    return events
      .filter((e) => {
        if (seen.has(e._id)) return false;
        seen.add(e._id);
        if (e.confidenceScore <= 20) return false;
        const distance = haversineDistance(
          args.lat,
          args.lng,
          e.location.lat,
          e.location.lng
        );
        return distance <= args.radiusKm;
      })
      .map(({ _id, _creationTime, type, subtype, location, routePoints, radius, severity, source, confidenceScore, ttl }) => ({
        _id,
        _creationTime,
        type,
        subtype,
        location,
        routePoints,
        radius,
        severity,
        source,
        confidenceScore,
        ttl,
      }));
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
      gridCell: calculateGridCell(args.location.lat, args.location.lng),
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
      gridCell: calculateGridCell(args.location.lat, args.location.lng),
      confidenceScore: 100,
    });
  },
});

// Batch insert for cron jobs (reduces mutation overhead)
export const batchInsertFromAPI = internalMutation({
  args: {
    events: v.array(
      v.object({
        type: v.union(v.literal("weather"), v.literal("traffic")),
        subtype: v.string(),
        location: v.object({ lat: v.number(), lng: v.number() }),
        routePoints: v.optional(v.array(v.object({ lat: v.number(), lng: v.number() }))),
        radius: v.number(),
        severity: v.number(),
        source: v.union(v.literal("openweathermap"), v.literal("tomorrow"), v.literal("here")),
        ttl: v.number(),
        rawData: v.optional(v.any()),
      })
    ),
  },
  returns: v.array(v.id("events")),
  handler: async (ctx, args) => {
    const ids = [];
    for (const event of args.events) {
      const id = await ctx.db.insert("events", {
        ...event,
        gridCell: calculateGridCell(event.location.lat, event.location.lng),
        confidenceScore: 100,
      });
      ids.push(id);
    }
    return ids;
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
