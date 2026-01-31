import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

// Helper queries for the data fetcher action
// These run in V8 (not Node.js) for better performance

export const getAllLocations = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userLocations").collect();
  },
});

export const getNearbyEvents = internalQuery({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const events = await ctx.db.query("events").collect();

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
