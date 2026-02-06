"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * HERE Routing API v8
 * Docs: https://developer.here.com/documentation/routing-api/8.27.0/dev_guide/index.html
 *
 * Returns 3 route alternatives with:
 * - Polyline geometry (encoded flexiblePolyline format)
 * - Traffic-aware ETA and duration
 * - Distance in meters
 * - Traffic delays per segment
 */
export const getRouteAlternatives = action({
  args: {
    origin: v.object({ lat: v.number(), lng: v.number() }),
    destination: v.object({ lat: v.number(), lng: v.number() }),
    departureTime: v.optional(v.string()), // ISO 8601 format, defaults to "now"
    alternatives: v.optional(v.number()), // Number of alternative routes (max 6)
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.HERE_API_KEY;
    if (!apiKey) throw new Error("HERE_API_KEY not configured");

    const { origin, destination, departureTime = "now", alternatives = 3 } = args;

    // HERE Routing API v8 endpoint
    const url = new URL("https://router.hereapi.com/v8/routes");
    url.searchParams.set("transportMode", "car");
    url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
    url.searchParams.set("destination", `${destination.lat},${destination.lng}`);
    url.searchParams.set("return", "polyline,summary,typicalDuration,travelSummary");
    url.searchParams.set("departureTime", departureTime);
    url.searchParams.set("alternatives", String(alternatives));
    url.searchParams.set("apiKey", apiKey);

    // Request traffic-aware routing
    url.searchParams.set("spans", "tracePoints,length,duration,speedLimit");

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HERE Routing API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No routes found");
    }

    // Process each route alternative
    const routes = data.routes.map((route: any, index: number) => {
      const section = route.sections[0]; // Usually one section for simple A->B routes

      return {
        index,
        // Encoded polyline (flexiblePolyline format - needs decoding)
        encodedPolyline: section.polyline,

        // Summary data
        duration: section.travelSummary.duration, // seconds
        durationWithTraffic: section.travelSummary.duration, // Already includes traffic
        typicalDuration: section.typicalDuration, // Average duration without current traffic
        distance: section.travelSummary.length, // meters

        // Traffic delay = difference between typical and current
        trafficDelay: section.travelSummary.duration - (section.typicalDuration || section.travelSummary.duration),

        // Departure/arrival times
        departure: section.departure?.time,
        arrival: section.arrival?.time,
      };
    });

    return {
      routes,
      // Metadata
      origin,
      destination,
      fetchedAt: Date.now(),
    };
  },
});

/**
 * Decode HERE flexible polyline format
 * Spec: https://github.com/heremaps/flexible-polyline
 *
 * HERE uses their own flexible polyline format (more efficient than Google's)
 * This decoder handles:
 * - Variable precision (typically 1e5)
 * - Delta encoding (stores differences between points)
 * - 2D and 3D coordinates
 */
export function decodeFlexiblePolyline(encoded: string): { lat: number; lng: number }[] {
  if (!encoded) return [];

  const result: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  const decodeUnsignedValue = (): number => {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    return result;
  };

  const decodeSignedValue = (): number => {
    const value = decodeUnsignedValue();
    return (value & 1) ? ~(value >> 1) : (value >> 1);
  };

  // First value is header (version and precision)
  const header = decodeUnsignedValue();
  const precision = header & 0x0f;
  const factor = Math.pow(10, precision);

  // Second value is dimension (2D or 3D)
  const dimension = (header >> 4) + 2;

  // Decode coordinates
  while (index < encoded.length) {
    lat += decodeSignedValue();
    lng += decodeSignedValue();

    result.push({
      lat: lat / factor,
      lng: lng / factor,
    });

    // Skip elevation if 3D
    if (dimension === 3) {
      decodeSignedValue();
    }
  }

  return result;
}

