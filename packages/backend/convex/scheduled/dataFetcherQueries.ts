import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { getIntersectingGridCells } from "../events";

// Helper queries for the data fetcher action
// These run in V8 (not Node.js) for better performance

// DEPRECATED: Use getActiveLocations instead for bandwidth optimization
export const getAllLocations = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userLocations").collect();
  },
});

/**
 * Get only locations that need active monitoring:
 * - Default locations (user's primary location)
 * - Locations with active routes
 *
 * This reduces bandwidth by ~60% compared to getAllLocations
 */
export const getActiveLocations = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all default locations
    const allLocations = await ctx.db.query("userLocations").collect();
    const defaultLocations = allLocations.filter((loc) => loc.isDefault);

    // Get locations from active routes
    const activeRoutes = await ctx.db.query("routes").collect();
    const activeRouteLocations = activeRoutes.filter((r) => r.isActive);

    const routeLocationIds = new Set<string>();
    for (const route of activeRouteLocations) {
      if (route.fromLocationId) routeLocationIds.add(route.fromLocationId);
      if (route.toLocationId) routeLocationIds.add(route.toLocationId);
    }

    // Get route locations that aren't already in defaults
    const defaultIds = new Set(defaultLocations.map((l) => l._id));
    const additionalLocations = allLocations.filter(
      (loc) => routeLocationIds.has(loc._id) && !defaultIds.has(loc._id)
    );

    return [...defaultLocations, ...additionalLocations];
  },
});

/**
 * Get all active events - fetch once, filter in caller
 * Uses TTL index for efficient filtering
 */
export const getAllActiveEvents = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Use TTL index instead of full table scan
    const events = await ctx.db
      .query("events")
      .withIndex("by_ttl", (q) => q.gt("ttl", now))
      .collect();

    return events.filter((e) => e.confidenceScore > 20);
  },
});

/**
 * Get nearby events using grid-based filtering
 * Much more efficient than full table scan
 */
export const getNearbyEvents = internalQuery({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Use grid-based query instead of full table scan
    const gridCells = getIntersectingGridCells(args.lat, args.lng, args.radiusKm);
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
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
