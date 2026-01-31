import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

// Weather score thresholds
function calculateWeatherScore(data: {
  precipitation?: number; // mm/h
  windSpeed?: number; // km/h
  visibility?: number; // meters
  hasSevereAlert?: boolean;
}): number {
  let score = 0;

  // Precipitation
  if (data.precipitation) {
    if (data.precipitation > 10) score += 30;
    else if (data.precipitation > 5) score += 20;
    else if (data.precipitation > 1) score += 10;
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

export const getForLocation = query({
  args: { locationId: v.id("userLocations") },
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
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("riskSnapshots")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

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
