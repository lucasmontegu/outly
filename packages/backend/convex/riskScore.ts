import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

// Weather score thresholds
function calculateWeatherScore(data: {
  precipitation?: number; // mm/h
  nowcastPrecipitation?: number; // mm/h from Tomorrow.io (next 10 min)
  windSpeed?: number; // km/h
  visibility?: number; // meters
  hasSevereAlert?: boolean;
}): number {
  let score = 0;

  // Use max of current precipitation or upcoming nowcast precipitation
  const effectivePrecipitation = Math.max(
    data.precipitation ?? 0,
    data.nowcastPrecipitation ?? 0
  );

  // Precipitation
  if (effectivePrecipitation > 0) {
    if (effectivePrecipitation > 10) score += 30;
    else if (effectivePrecipitation > 5) score += 20;
    else if (effectivePrecipitation > 1) score += 10;
  }

  // Wind
  if (data.windSpeed) {
    if (data.windSpeed > 60) score += 25;
    else if (data.windSpeed > 40) score += 15;
    else if (data.windSpeed > 25) score += 5;
  }

  // Visibility
  if (data.visibility !== undefined) {
    if (data.visibility < 200) score += 40;
    else if (data.visibility < 500) score += 25;
    else if (data.visibility < 1000) score += 10;
  }

  // Severe alert
  if (data.hasSevereAlert) score += 50;

  return Math.min(100, score);
}

// Traffic score thresholds
function calculateTrafficScore(data: {
  jamFactor?: number; // 0-10
  incidentCount?: number;
  maxIncidentSeverity?: number;
}): number {
  let score = 0;

  // Jam factor (0-10 scale from HERE)
  if (data.jamFactor) {
    if (data.jamFactor > 7) score += 40;
    else if (data.jamFactor > 5) score += 25;
    else if (data.jamFactor > 3) score += 10;
  }

  // Incidents
  if (data.incidentCount) {
    score += Math.min(30, data.incidentCount * 10);
  }

  // Severity of worst incident
  if (data.maxIncidentSeverity) {
    score += data.maxIncidentSeverity * 5;
  }

  return Math.min(100, score);
}

// Event score based on nearby confirmed events
function calculateEventScore(
  events: {
    severity: number;
    confidenceScore: number;
  }[]
): number {
  if (events.length === 0) return 0;

  let score = 0;

  // Sum contribution from each event
  for (const event of events) {
    if (event.confidenceScore > 50) {
      score += event.severity * 4; // Up to 20 per event
    }
  }

  return Math.min(100, score);
}

// Risk snapshot validator (reusable)
const riskSnapshotDoc = v.object({
  _id: v.id("riskSnapshots"),
  _creationTime: v.number(),
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
});

export const getForLocation = query({
  args: { locationId: v.id("userLocations") },
  returns: v.union(riskSnapshotDoc, v.null()),
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("riskSnapshots")
      .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
      .order("desc")
      .take(1);

    return snapshots[0] ?? null;
  },
});

export const listForUser = query({
  args: {},
  returns: v.array(riskSnapshotDoc),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("riskSnapshots")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

// Public query to get current risk for a location (coordinates-based, no stored location needed)
export const getCurrentRisk = query({
  args: {
    lat: v.number(),
    lng: v.number(),
  },
  returns: v.object({
    score: v.number(),
    classification: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    breakdown: v.object({
      weatherScore: v.number(),
      trafficScore: v.number(),
      eventScore: v.number(),
    }),
    description: v.string(),
    nearbyEvents: v.array(
      v.object({
        _id: v.id("events"),
        type: v.union(v.literal("weather"), v.literal("traffic")),
        subtype: v.string(),
        severity: v.number(),
        confidenceScore: v.number(),
        _creationTime: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    // Get nearby events
    const now = Date.now();
    const events = await ctx.db.query("events").collect();

    const nearbyEvents = events.filter((e) => {
      if (e.ttl <= now || e.confidenceScore <= 20) return false;

      const distance = haversineDistance(
        args.lat,
        args.lng,
        e.location.lat,
        e.location.lng
      );
      return distance <= 10; // 10km radius
    });

    // Calculate scores
    let weatherScore = 0;
    let trafficScore = 0;
    let eventScore = 0;

    for (const event of nearbyEvents) {
      const distance = haversineDistance(
        args.lat,
        args.lng,
        event.location.lat,
        event.location.lng
      );
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
    const classification: "low" | "medium" | "high" = score < 34 ? "low" : score < 67 ? "medium" : "high";

    // Generate description
    let description: string;
    if (score <= 20) {
      description = "Conditions are optimal. Minimal traffic and clear skies reported in your area.";
    } else if (score <= 40) {
      description = "Conditions are generally good with minor concerns. Light traffic expected.";
    } else if (score <= 60) {
      description = "Moderate risk level. Monitor conditions before departing.";
    } else if (score <= 80) {
      description = "Elevated risk. Consider delaying departure or using alternative routes.";
    } else {
      description = "High risk conditions. Travel not recommended unless necessary.";
    }

    return {
      score,
      classification,
      breakdown: { weatherScore, trafficScore, eventScore },
      description,
      nearbyEvents: nearbyEvents.map((e) => ({
        _id: e._id,
        type: e.type,
        subtype: e.subtype,
        severity: e.severity,
        confidenceScore: e.confidenceScore,
        _creationTime: e._creationTime,
      })),
    };
  },
});

// Haversine formula for distance
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Internal mutation to calculate and store risk score
export const calculate = internalMutation({
  args: {
    locationId: v.id("userLocations"),
    weatherData: v.optional(v.any()),
    trafficData: v.optional(v.any()),
    nearbyEvents: v.array(
      v.object({
        severity: v.number(),
        confidenceScore: v.number(),
      })
    ),
  },
  returns: v.id("riskSnapshots"),
  handler: async (ctx, args) => {
    const location = await ctx.db.get(args.locationId);
    if (!location) throw new Error("Location not found");

    // Get previous snapshot for comparison
    const previousSnapshots = await ctx.db
      .query("riskSnapshots")
      .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
      .order("desc")
      .take(1);

    const previousScore = previousSnapshots[0]?.score;

    // Calculate component scores
    const weatherScore = args.weatherData
      ? calculateWeatherScore({
          precipitation:
            args.weatherData.rain?.["1h"] ?? args.weatherData.rain,
          nowcastPrecipitation: args.weatherData.nowcastPrecipitation, // from Tomorrow.io
          windSpeed: args.weatherData.wind?.speed
            ? args.weatherData.wind.speed * 3.6
            : undefined, // m/s to km/h
          visibility: args.weatherData.visibility,
          hasSevereAlert: args.weatherData.alerts?.length > 0,
        })
      : 0;

    const trafficScore = args.trafficData
      ? calculateTrafficScore({
          jamFactor: args.trafficData.jamFactor,
          incidentCount: args.trafficData.incidents?.length ?? 0,
          maxIncidentSeverity: args.trafficData.maxSeverity,
        })
      : 0;

    const eventScore = calculateEventScore(args.nearbyEvents);

    // Weighted average
    const score = Math.round(
      weatherScore * 0.4 + trafficScore * 0.4 + eventScore * 0.2
    );

    const classification =
      score < 34 ? "low" : score < 67 ? "medium" : "high";

    // Delete old snapshot if exists
    if (previousSnapshots[0]) {
      await ctx.db.delete(previousSnapshots[0]._id);
    }

    // Insert new snapshot
    return await ctx.db.insert("riskSnapshots", {
      locationId: args.locationId,
      userId: location.userId,
      score,
      previousScore,
      classification,
      breakdown: {
        weatherScore,
        trafficScore,
        eventScore,
      },
      weatherData: args.weatherData,
      trafficData: args.trafficData,
    });
  },
});
