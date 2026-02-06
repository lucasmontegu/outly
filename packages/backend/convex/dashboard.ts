import { v } from "convex/values";
import { query } from "./_generated/server";
import { getIntersectingGridCells } from "./events";

// ============================================================================
// CONSOLIDATED DASHBOARD QUERY
// Combines 4 queries into 1 subscription to reduce bandwidth by ~75%
// - getCurrentUser
// - getCurrentRisk
// - getForecast
// - getRoutesWithForecast
// ============================================================================

// Time slot schema for forecast
const timeSlotSchema = v.object({
  time: v.string(),
  label: v.string(),
  score: v.number(),
  classification: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  isNow: v.boolean(),
  isOptimal: v.boolean(),
  reason: v.string(), // NEW: brief explanation of why the score is what it is
});

// Route preview schema
const routePreviewSchema = v.object({
  _id: v.id("routes"),
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

// Nearby event schema (slim) with deduplication and distance
const nearbyEventSchema = v.object({
  _id: v.id("events"),
  type: v.union(v.literal("weather"), v.literal("traffic")),
  subtype: v.string(),
  severity: v.number(),
  confidenceScore: v.number(),
  count: v.number(),        // Number of events of this subtype
  distanceKm: v.number(),   // Distance from user location
});

/**
 * Consolidated dashboard data - SINGLE SUBSCRIPTION for home screen
 * Replaces 4 separate useQuery calls with 1
 */
export const getDashboardData = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    // Client provides timestamp rounded to minute for better cache hits
    asOfTimestamp: v.optional(v.number()),
  },
  returns: v.object({
    // User data
    user: v.union(
      v.object({
        _id: v.id("users"),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        tier: v.union(v.literal("free"), v.literal("pro")),
        onboardingCompleted: v.boolean(),
        preferences: v.optional(
          v.object({
            primaryConcern: v.union(v.literal("weather"), v.literal("traffic"), v.literal("both")),
            commuteTime: v.optional(v.string()),
            alertAdvanceMinutes: v.optional(v.number()),
          })
        ),
      }),
      v.null()
    ),
    // Current risk
    risk: v.object({
      score: v.number(),
      classification: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      breakdown: v.object({
        weatherScore: v.number(),
        trafficScore: v.number(),
        eventScore: v.number(),
      }),
      description: v.string(),
      nearbyEvents: v.array(nearbyEventSchema),
    }),
    // 2-hour forecast
    forecast: v.object({
      slots: v.array(timeSlotSchema),
      optimalSlotIndex: v.number(),
      optimalDepartureMinutes: v.number(),
    }),
    // Routes preview (max 3 for home screen)
    routes: v.array(routePreviewSchema),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // Round to nearest minute for cache-friendly behavior
    const now = args.asOfTimestamp
      ? Math.floor(args.asOfTimestamp / 60000) * 60000
      : Date.now();

    // ========== USER DATA ==========
    let user = null;
    if (identity) {
      const userDoc = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (userDoc) {
        user = {
          _id: userDoc._id,
          firstName: userDoc.firstName,
          lastName: userDoc.lastName,
          imageUrl: userDoc.imageUrl,
          tier: userDoc.tier,
          onboardingCompleted: userDoc.onboardingCompleted,
          preferences: userDoc.preferences,
        };
      }
    }

    // ========== EVENTS (shared between risk, forecast, and routes) ==========
    // Fetch events ONCE for all calculations
    const gridCells = getIntersectingGridCells(args.lat, args.lng, 10);
    const eventPromises = gridCells.map((cell) =>
      ctx.db
        .query("events")
        .withIndex("by_grid_ttl", (q) => q.eq("gridCell", cell).gt("ttl", now))
        .collect()
    );
    const eventArrays = await Promise.all(eventPromises);
    const allEvents = eventArrays.flat();

    // Deduplicate
    const seen = new Set<string>();
    const nearbyEvents = allEvents.filter((e) => {
      if (seen.has(e._id)) return false;
      seen.add(e._id);
      if (e.confidenceScore <= 20) return false;
      const distance = haversineDistance(args.lat, args.lng, e.location.lat, e.location.lng);
      return distance <= 10;
    });

    // ========== RISK CALCULATION ==========
    let weatherScore = 0;
    let trafficScore = 0;
    let eventScore = 0;

    for (const event of nearbyEvents) {
      const distance = haversineDistance(args.lat, args.lng, event.location.lat, event.location.lng);
      const impactFactor = Math.max(0, 1 - distance / 10);
      const impact = event.severity * impactFactor * (event.confidenceScore / 100) * 10;

      if (event.type === "weather") {
        weatherScore += impact;
      } else {
        trafficScore += impact;
      }
      eventScore += impact * 0.5;
    }

    weatherScore = Math.min(100, Math.round(weatherScore));
    trafficScore = Math.min(100, Math.round(trafficScore));
    eventScore = Math.min(100, Math.round(eventScore));

    const score = Math.round(weatherScore * 0.35 + trafficScore * 0.45 + eventScore * 0.2);
    const classification: "low" | "medium" | "high" =
      score < 34 ? "low" : score < 67 ? "medium" : "high";

    // Generate description
    let description: string;
    if (score <= 20) {
      description = "Conditions are optimal. Minimal traffic and clear skies reported.";
    } else if (score <= 40) {
      description = "Conditions are generally good with minor concerns.";
    } else if (score <= 60) {
      description = "Moderate risk level. Monitor conditions before departing.";
    } else if (score <= 80) {
      description = "Elevated risk. Consider delaying departure.";
    } else {
      description = "High risk conditions. Travel not recommended unless necessary.";
    }

    // ========== FORECAST (8 slots, 15-min intervals) ==========
    const slots: {
      time: string;
      label: string;
      score: number;
      classification: "low" | "medium" | "high";
      isNow: boolean;
      isOptimal: boolean;
      reason: string;
    }[] = [];

    for (let i = 0; i < 8; i++) {
      const slotTime = new Date(now + i * 15 * 60 * 1000);
      const slotHour = slotTime.getHours();
      const hours = slotHour % 12 || 12;
      const minutes = slotTime.getMinutes();
      const label = `${hours}:${minutes.toString().padStart(2, "0")}`;

      const weatherDecay = Math.max(0, 1 - i * 0.08);
      const predictedWeatherScore = Math.round(weatherScore * weatherDecay);
      const trafficModifier = getTrafficModifier(slotHour);
      const predictedTrafficScore = Math.round(Math.min(100, Math.max(0, trafficScore * trafficModifier)));

      const slotScore = Math.round(predictedWeatherScore * 0.4 + predictedTrafficScore * 0.6);
      const slotClassification: "low" | "medium" | "high" =
        slotScore < 34 ? "low" : slotScore < 67 ? "medium" : "high";

      // Generate reason based on primary score contributor
      const reason = getSlotReason(
        predictedWeatherScore,
        predictedTrafficScore,
        slotHour,
        i === 0,
        weatherScore,
        trafficScore
      );

      slots.push({
        time: slotTime.toISOString(),
        label,
        score: slotScore,
        classification: slotClassification,
        isNow: i === 0,
        isOptimal: false,
        reason,
      });
    }

    // Find optimal slot
    let optimalIndex = 0;
    let minScore = slots[0].score;
    for (let i = 1; i < slots.length; i++) {
      if (slots[i].score < minScore) {
        minScore = slots[i].score;
        optimalIndex = i;
      }
    }
    slots[optimalIndex].isOptimal = true;

    // ========== ROUTES (max 3 for home screen) ==========
    const routesData: {
      _id: typeof routePreviewSchema.type["_id"];
      name: string;
      fromName: string;
      toName: string;
      icon: "building" | "running" | "home";
      currentScore: number;
      classification: "low" | "medium" | "high";
      optimalDepartureMinutes: number;
      optimalTime: string;
      isOptimalNow: boolean;
    }[] = [];

    if (identity) {
      const routes = await ctx.db
        .query("routes")
        .withIndex("by_user_active", (q) =>
          q.eq("userId", identity.subject).eq("isActive", true)
        )
        .take(3); // Only first 3 for home screen

      for (const route of routes) {
        // Use same events, filter for route location
        const routeNearbyEvents = nearbyEvents.filter((e) => {
          const distance = haversineDistance(
            route.fromLocation.lat,
            route.fromLocation.lng,
            e.location.lat,
            e.location.lng
          );
          return distance <= 10;
        });

        let routeWeatherScore = 0;
        let routeTrafficScore = 0;
        for (const event of routeNearbyEvents) {
          const distance = haversineDistance(
            route.fromLocation.lat,
            route.fromLocation.lng,
            event.location.lat,
            event.location.lng
          );
          const impactFactor = Math.max(0, 1 - distance / 10);
          const impact = event.severity * impactFactor * (event.confidenceScore / 100) * 10;
          if (event.type === "weather") {
            routeWeatherScore += impact;
          } else {
            routeTrafficScore += impact;
          }
        }
        routeWeatherScore = Math.min(100, Math.round(routeWeatherScore));
        routeTrafficScore = Math.min(100, Math.round(routeTrafficScore));

        // Find optimal time for route
        let routeOptimalIndex = 0;
        let routeMinScore = Infinity;
        for (let i = 0; i < 8; i++) {
          const slotTime = new Date(now + i * 15 * 60 * 1000);
          const slotHour = slotTime.getHours();
          const weatherDecay = Math.max(0, 1 - i * 0.08);
          const predictedWeather = Math.round(routeWeatherScore * weatherDecay);
          const trafficMod = getTrafficModifier(slotHour);
          const predictedTraffic = Math.round(Math.min(100, Math.max(0, routeTrafficScore * trafficMod)));
          const routeSlotScore = Math.round(predictedWeather * 0.4 + predictedTraffic * 0.6);
          if (routeSlotScore < routeMinScore) {
            routeMinScore = routeSlotScore;
            routeOptimalIndex = i;
          }
        }

        const optimalTime = new Date(now + routeOptimalIndex * 15 * 60 * 1000);
        const optHours = optimalTime.getHours() % 12 || 12;
        const optMinutes = optimalTime.getMinutes();
        const ampm = optimalTime.getHours() >= 12 ? "PM" : "AM";
        const optimalTimeLabel = `${optHours}:${optMinutes.toString().padStart(2, "0")} ${ampm}`;

        const routeScore = Math.round(routeWeatherScore * 0.4 + routeTrafficScore * 0.6);
        const routeClassification: "low" | "medium" | "high" =
          routeScore < 34 ? "low" : routeScore < 67 ? "medium" : "high";

        routesData.push({
          _id: route._id,
          name: route.name,
          fromName: route.fromName,
          toName: route.toName,
          icon: route.icon,
          currentScore: routeScore,
          classification: routeClassification,
          optimalDepartureMinutes: routeOptimalIndex * 15,
          optimalTime: optimalTimeLabel,
          isOptimalNow: routeOptimalIndex === 0,
        });
      }
    }

    // ========== DEDUPLICATE AND ADD DISTANCE TO NEARBY EVENTS ==========
    // Group events by type+subtype, keep highest severity, add count and distance
    const eventGroups = new Map<string, {
      events: typeof nearbyEvents;
      highestSeverity: number;
      closestDistance: number;
    }>();

    for (const event of nearbyEvents) {
      const key = `${event.type}:${event.subtype}`;
      const distance = haversineDistance(args.lat, args.lng, event.location.lat, event.location.lng);

      const existing = eventGroups.get(key);
      if (!existing) {
        eventGroups.set(key, {
          events: [event],
          highestSeverity: event.severity,
          closestDistance: distance,
        });
      } else {
        existing.events.push(event);
        if (event.severity > existing.highestSeverity) {
          existing.highestSeverity = event.severity;
        }
        if (distance < existing.closestDistance) {
          existing.closestDistance = distance;
        }
      }
    }

    // Convert groups to deduplicated events with count and distance
    const deduplicatedEvents = Array.from(eventGroups.values())
      .map((group) => {
        // Find the event with highest severity in this group
        const representative = group.events.reduce((max, e) =>
          e.severity > max.severity ? e : max
        , group.events[0]);

        return {
          _id: representative._id,
          type: representative.type,
          subtype: representative.subtype,
          severity: representative.severity,
          confidenceScore: representative.confidenceScore,
          count: group.events.length,
          distanceKm: Math.round(group.closestDistance * 10) / 10, // Round to 1 decimal
        };
      })
      .sort((a, b) => {
        // Sort by severity desc, then distance asc
        if (b.severity !== a.severity) return b.severity - a.severity;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, 10); // Keep top 10

    return {
      user,
      risk: {
        score,
        classification,
        breakdown: { weatherScore, trafficScore, eventScore },
        description,
        nearbyEvents: deduplicatedEvents,
      },
      forecast: {
        slots,
        optimalSlotIndex: optimalIndex,
        optimalDepartureMinutes: optimalIndex * 15,
      },
      routes: routesData,
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate reason based on primary score contributor
 */
function getSlotReason(
  weatherScore: number,
  trafficScore: number,
  hour: number,
  isNow: boolean,
  originalWeatherScore: number,
  originalTrafficScore: number
): string {
  if (isNow) {
    // Current conditions - explain what's happening now
    if (weatherScore > 60 && trafficScore > 60) return "Storm + rush hour";
    if (weatherScore > 60) return "Severe weather";
    if (trafficScore > 60) return "Heavy traffic";
    if (weatherScore > 30 && trafficScore > 30) return "Rain + congestion";
    if (weatherScore > 30) return "Light rain";
    if (trafficScore > 30) return "Moderate traffic";
    return "Clear conditions";
  }

  // Future slots - explain what changes
  // Check if weather is clearing
  const weatherClearing = originalWeatherScore > 40 && weatherScore < originalWeatherScore * 0.7;

  // Rush hour analysis
  if (hour >= 7 && hour < 9) return "Rush hour peak";
  if (hour >= 17 && hour < 19) return "Evening rush";

  // Weather-driven
  if (weatherClearing && weatherScore > 20) return "Rain clearing";
  if (weatherScore > 40) return "Weather improving";

  // Traffic-driven
  if (hour >= 9 && hour < 12) return "Traffic easing";
  if (hour >= 19 && hour < 21) return "Traffic clearing";
  if (trafficScore < 20) return "Roads clear";

  // General improvement
  return "Conditions improving";
}

function getTrafficModifier(hour: number): number {
  if (hour >= 7 && hour < 9) return 1.4;
  if (hour >= 9 && hour < 12) return 1.0;
  if (hour >= 12 && hour < 14) return 1.1;
  if (hour >= 14 && hour < 17) return 1.0;
  if (hour >= 17 && hour < 19) return 1.5;
  if (hour >= 19 && hour < 21) return 0.8;
  return 0.5;
}

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
