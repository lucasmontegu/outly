# Outly MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first weather/traffic risk alerts app with community confirmations and push notifications.

**Architecture:** Expo mobile app → Convex backend → External APIs (OpenWeatherMap, Tomorrow.io, HERE Traffic). Risk Score calculated server-side, pushed to clients via Convex's reactive queries. Scheduled functions poll APIs every 10 minutes.

**Tech Stack:** Expo 54, React Native 0.81, Convex, Clerk auth, expo-location, expo-notifications

---

## Phase 1: Backend Foundation

### Task 1.1: Define Convex Schema

**Files:**
- Modify: `packages/backend/convex/schema.ts`

**Step 1: Write the schema with all tables**

```typescript
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
```

**Step 2: Run Convex dev to validate schema**

```bash
cd packages/backend && npx convex dev --once
```

Expected: Schema compiles without errors

**Step 3: Commit**

```bash
git add packages/backend/convex/schema.ts
git commit -m "feat(backend): add Convex schema for events, locations, confirmations, risk"
```

---

### Task 1.2: Create User Locations Mutations

**Files:**
- Create: `packages/backend/convex/userLocations.ts`

**Step 1: Write the mutations**

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("userLocations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    address: v.optional(v.string()),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // If this is default, unset other defaults
    if (args.isDefault) {
      const existing = await ctx.db
        .query("userLocations")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .collect();

      for (const loc of existing) {
        if (loc.isDefault) {
          await ctx.db.patch(loc._id, { isDefault: false });
        }
      }
    }

    return await ctx.db.insert("userLocations", {
      userId: identity.subject,
      name: args.name,
      location: args.location,
      address: args.address,
      isDefault: args.isDefault,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("userLocations"),
    name: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    address: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    pushToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const location = await ctx.db.get(args.id);
    if (!location || location.userId !== identity.subject) {
      throw new Error("Location not found");
    }

    const { id, ...updates } = args;

    // If setting as default, unset others
    if (updates.isDefault) {
      const existing = await ctx.db
        .query("userLocations")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .collect();

      for (const loc of existing) {
        if (loc._id !== id && loc.isDefault) {
          await ctx.db.patch(loc._id, { isDefault: false });
        }
      }
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("userLocations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const location = await ctx.db.get(args.id);
    if (!location || location.userId !== identity.subject) {
      throw new Error("Location not found");
    }

    await ctx.db.delete(args.id);
  },
});
```

**Step 2: Validate with Convex dev**

```bash
cd packages/backend && npx convex dev --once
```

**Step 3: Commit**

```bash
git add packages/backend/convex/userLocations.ts
git commit -m "feat(backend): add userLocations CRUD mutations"
```

---

### Task 1.3: Create Events Queries and Mutations

**Files:**
- Create: `packages/backend/convex/events.ts`

**Step 1: Write events module**

```typescript
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const listActive = query({
  args: {
    type: v.optional(v.union(v.literal("weather"), v.literal("traffic"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    let eventsQuery = ctx.db.query("events");

    if (args.type) {
      eventsQuery = eventsQuery.withIndex("by_type", (q) => q.eq("type", args.type));
    }

    const events = await eventsQuery.collect();

    // Filter expired and low confidence events
    return events.filter(
      (e) => e.ttl > now && e.confidenceScore > 20
    );
  },
});

export const listNearby = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const events = await ctx.db.query("events").collect();

    // Filter by distance, TTL, and confidence
    return events.filter((e) => {
      if (e.ttl <= now || e.confidenceScore <= 20) return false;

      const distance = haversineDistance(
        args.lat, args.lng,
        e.location.lat, e.location.lng
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
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
```

**Step 2: Validate**

```bash
cd packages/backend && npx convex dev --once
```

**Step 3: Commit**

```bash
git add packages/backend/convex/events.ts
git commit -m "feat(backend): add events queries and mutations"
```

---

### Task 1.4: Create Confirmations Module

**Files:**
- Create: `packages/backend/convex/confirmations.ts`

**Step 1: Write confirmations with confidence adjustment**

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("confirmations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

export const getMyVote = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const votes = await ctx.db
      .query("confirmations")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", identity.subject).eq("eventId", args.eventId)
      )
      .collect();

    return votes[0] ?? null;
  },
});

export const vote = mutation({
  args: {
    eventId: v.id("events"),
    vote: v.union(
      v.literal("still_active"),
      v.literal("cleared"),
      v.literal("not_exists")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Check if user already voted
    const existingVotes = await ctx.db
      .query("confirmations")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", identity.subject).eq("eventId", args.eventId)
      )
      .collect();

    if (existingVotes.length > 0) {
      // Update existing vote
      const existing = existingVotes[0];
      const oldVote = existing.vote;

      // Reverse old vote impact
      let confidenceChange = 0;
      if (oldVote === "still_active") confidenceChange -= 10;
      else if (oldVote === "cleared") confidenceChange += 20;
      else if (oldVote === "not_exists") confidenceChange += 30;

      // Apply new vote impact
      if (args.vote === "still_active") confidenceChange += 10;
      else if (args.vote === "cleared") confidenceChange -= 20;
      else if (args.vote === "not_exists") confidenceChange -= 30;

      await ctx.db.patch(existing._id, { vote: args.vote });

      const newConfidence = Math.max(0, Math.min(100, event.confidenceScore + confidenceChange));
      await ctx.db.patch(args.eventId, { confidenceScore: newConfidence });

      return existing._id;
    }

    // Create new vote
    const confirmationId = await ctx.db.insert("confirmations", {
      eventId: args.eventId,
      userId: identity.subject,
      vote: args.vote,
    });

    // Adjust confidence based on vote
    let confidenceChange = 0;
    if (args.vote === "still_active") confidenceChange = 10;
    else if (args.vote === "cleared") confidenceChange = -20;
    else if (args.vote === "not_exists") confidenceChange = -30;

    const newConfidence = Math.max(0, Math.min(100, event.confidenceScore + confidenceChange));
    await ctx.db.patch(args.eventId, { confidenceScore: newConfidence });

    // Extend or reduce TTL based on vote
    if (args.vote === "still_active") {
      // Extend TTL by 30 minutes
      await ctx.db.patch(args.eventId, { ttl: event.ttl + 30 * 60 * 1000 });
    } else if (args.vote === "cleared" || args.vote === "not_exists") {
      // Reduce TTL to 15 minutes if many negative votes
      const allVotes = await ctx.db
        .query("confirmations")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      const negativeVotes = allVotes.filter(
        (v) => v.vote === "cleared" || v.vote === "not_exists"
      ).length;

      if (negativeVotes >= 3) {
        await ctx.db.patch(args.eventId, { ttl: Date.now() + 15 * 60 * 1000 });
      }
    }

    return confirmationId;
  },
});
```

**Step 2: Validate**

```bash
cd packages/backend && npx convex dev --once
```

**Step 3: Commit**

```bash
git add packages/backend/convex/confirmations.ts
git commit -m "feat(backend): add confirmations with confidence adjustment"
```

---

### Task 1.5: Create Risk Score Calculation

**Files:**
- Create: `packages/backend/convex/riskScore.ts`

**Step 1: Write risk score calculation logic**

```typescript
import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Weather score thresholds
function calculateWeatherScore(data: {
  precipitation?: number;  // mm/h
  windSpeed?: number;      // km/h
  visibility?: number;     // meters
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
  jamFactor?: number;      // 0-10
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
function calculateEventScore(events: {
  severity: number;
  confidenceScore: number;
}[]): number {
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
    nearbyEvents: v.array(v.object({
      severity: v.number(),
      confidenceScore: v.number(),
    })),
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
          precipitation: args.weatherData.rain?.["1h"] ?? args.weatherData.rain,
          windSpeed: args.weatherData.wind?.speed ? args.weatherData.wind.speed * 3.6 : undefined, // m/s to km/h
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
      (weatherScore * 0.4) +
      (trafficScore * 0.4) +
      (eventScore * 0.2)
    );

    const classification = score < 34 ? "low" : score < 67 ? "medium" : "high";

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
```

**Step 2: Validate**

```bash
cd packages/backend && npx convex dev --once
```

**Step 3: Commit**

```bash
git add packages/backend/convex/riskScore.ts
git commit -m "feat(backend): add risk score calculation with weighted average"
```

---

### Task 1.6: Create API Integration Actions

**Files:**
- Create: `packages/backend/convex/integrations/weather.ts`
- Create: `packages/backend/convex/integrations/traffic.ts`

**Step 1: Create weather integration**

```typescript
// packages/backend/convex/integrations/weather.ts
"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

export const fetchOpenWeatherMap = action({
  args: {
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) throw new Error("OPENWEATHERMAP_API_KEY not configured");

    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${args.lat}&lon=${args.lng}&appid=${apiKey}&units=metric&exclude=minutely,daily`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      current: {
        temp: data.current.temp,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_speed,
        visibility: data.current.visibility,
        weather: data.current.weather[0],
        rain: data.current.rain,
        snow: data.current.snow,
      },
      alerts: data.alerts ?? [],
      hourly: data.hourly?.slice(0, 12).map((h: any) => ({
        dt: h.dt,
        temp: h.temp,
        pop: h.pop, // Probability of precipitation
        rain: h.rain?.["1h"],
        weather: h.weather[0],
      })),
    };
  },
});

export const fetchTomorrowIO = action({
  args: {
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.TOMORROW_IO_API_KEY;
    if (!apiKey) throw new Error("TOMORROW_IO_API_KEY not configured");

    const url = `https://api.tomorrow.io/v4/timelines?location=${args.lat},${args.lng}&fields=precipitationIntensity,precipitationType,visibility&timesteps=1m&units=metric&apikey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Tomorrow.io API error: ${response.status}`);
    }

    const data = await response.json();
    const intervals = data.data?.timelines?.[0]?.intervals ?? [];

    return {
      minutely: intervals.slice(0, 60).map((i: any) => ({
        time: i.startTime,
        precipitationIntensity: i.values.precipitationIntensity,
        precipitationType: i.values.precipitationType,
        visibility: i.values.visibility,
      })),
    };
  },
});
```

**Step 2: Create traffic integration**

```typescript
// packages/backend/convex/integrations/traffic.ts
"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

export const fetchHereTraffic = action({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusMeters: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.HERE_API_KEY;
    if (!apiKey) throw new Error("HERE_API_KEY not configured");

    const radius = args.radiusMeters ?? 5000;

    // Fetch traffic flow
    const flowUrl = `https://data.traffic.hereapi.com/v7/flow?in=circle:${args.lat},${args.lng};r=${radius}&locationReferencing=shape&apiKey=${apiKey}`;

    const flowResponse = await fetch(flowUrl);
    if (!flowResponse.ok) {
      throw new Error(`HERE Traffic Flow API error: ${flowResponse.status}`);
    }

    const flowData = await flowResponse.json();

    // Fetch incidents
    const incidentsUrl = `https://data.traffic.hereapi.com/v7/incidents?in=circle:${args.lat},${args.lng};r=${radius}&apiKey=${apiKey}`;

    const incidentsResponse = await fetch(incidentsUrl);
    if (!incidentsResponse.ok) {
      throw new Error(`HERE Traffic Incidents API error: ${incidentsResponse.status}`);
    }

    const incidentsData = await incidentsResponse.json();

    // Calculate average jam factor
    const flows = flowData.results ?? [];
    let totalJamFactor = 0;
    let flowCount = 0;

    for (const flow of flows) {
      if (flow.currentFlow?.jamFactor !== undefined) {
        totalJamFactor += flow.currentFlow.jamFactor;
        flowCount++;
      }
    }

    const avgJamFactor = flowCount > 0 ? totalJamFactor / flowCount : 0;

    // Process incidents
    const incidents = (incidentsData.results ?? []).map((inc: any) => ({
      id: inc.incidentDetails?.id,
      type: inc.incidentDetails?.type,
      description: inc.incidentDetails?.description?.value,
      severity: mapHereSeverity(inc.incidentDetails?.criticality),
      startTime: inc.incidentDetails?.startTime,
      endTime: inc.incidentDetails?.endTime,
      location: inc.location,
    }));

    const maxSeverity = incidents.length > 0
      ? Math.max(...incidents.map((i: any) => i.severity))
      : 0;

    return {
      jamFactor: avgJamFactor,
      incidents,
      maxSeverity,
      flowCount,
    };
  },
});

function mapHereSeverity(criticality: string | undefined): number {
  switch (criticality) {
    case "critical": return 5;
    case "major": return 4;
    case "minor": return 2;
    case "lowImpact": return 1;
    default: return 3;
  }
}
```

**Step 3: Validate**

```bash
cd packages/backend && npx convex dev --once
```

**Step 4: Commit**

```bash
git add packages/backend/convex/integrations/
git commit -m "feat(backend): add OpenWeatherMap, Tomorrow.io, HERE Traffic integrations"
```

---

### Task 1.7: Create Scheduled Data Fetcher

**Files:**
- Create: `packages/backend/convex/scheduled/dataFetcher.ts`
- Modify: `packages/backend/convex/convex.config.ts` (if needed for crons)

**Step 1: Write the scheduled function**

```typescript
// packages/backend/convex/scheduled/dataFetcher.ts
import { cronJobs } from "convex/server";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

// Main data fetcher action
export const fetchAllData = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all user locations
    const locations = await ctx.runQuery(internal.scheduled.dataFetcher.getAllLocations);

    if (locations.length === 0) return { processed: 0 };

    // Group by grid cell (~50km)
    const gridCells = groupByGridCell(locations, 0.5); // 0.5 degrees ≈ 50km

    let processed = 0;

    for (const [cellKey, cellLocations] of Object.entries(gridCells)) {
      // Use center of cell for API calls
      const center = getCellCenter(cellLocations as any[]);

      try {
        // Fetch weather data
        const weatherData = await ctx.runAction(
          internal.integrations.weather.fetchOpenWeatherMap,
          { lat: center.lat, lng: center.lng }
        );

        // Fetch traffic data
        const trafficData = await ctx.runAction(
          internal.integrations.traffic.fetchHereTraffic,
          { lat: center.lat, lng: center.lng, radiusMeters: 10000 }
        );

        // Get nearby events
        const nearbyEvents = await ctx.runQuery(
          internal.scheduled.dataFetcher.getNearbyEvents,
          { lat: center.lat, lng: center.lng, radiusKm: 10 }
        );

        // Calculate risk for each location in cell
        for (const location of cellLocations as any[]) {
          await ctx.runMutation(internal.riskScore.calculate, {
            locationId: location._id,
            weatherData,
            trafficData,
            nearbyEvents: nearbyEvents.map((e: any) => ({
              severity: e.severity,
              confidenceScore: e.confidenceScore,
            })),
          });
          processed++;
        }

        // Create weather events from alerts
        for (const alert of weatherData.alerts ?? []) {
          await ctx.runMutation(internal.events.upsertFromAPI, {
            type: "weather",
            subtype: alert.event ?? "severe_weather",
            location: center,
            radius: 50000, // 50km radius for weather alerts
            severity: mapAlertSeverity(alert),
            source: "openweathermap",
            ttl: (alert.end ?? Date.now() + 3600000),
            rawData: alert,
          });
        }

        // Create traffic events from incidents
        for (const incident of trafficData.incidents ?? []) {
          if (incident.location?.lat && incident.location?.lng) {
            await ctx.runMutation(internal.events.upsertFromAPI, {
              type: "traffic",
              subtype: incident.type ?? "incident",
              location: {
                lat: incident.location.lat,
                lng: incident.location.lng,
              },
              radius: 1000,
              severity: incident.severity,
              source: "here",
              ttl: incident.endTime ? new Date(incident.endTime).getTime() : Date.now() + 3600000,
              rawData: incident,
            });
          }
        }

      } catch (error) {
        console.error(`Error fetching data for cell ${cellKey}:`, error);
      }
    }

    // Clean expired events
    await ctx.runMutation(internal.events.cleanExpired, {});

    return { processed };
  },
});

// Helper queries exposed for internal use
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
        args.lat, args.lng,
        e.location.lat, e.location.lng
      );

      return distance <= args.radiusKm;
    });
  },
});

// Import from events.ts or duplicate
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

function groupByGridCell(locations: any[], cellSize: number): Record<string, any[]> {
  const cells: Record<string, any[]> = {};

  for (const loc of locations) {
    const cellLat = Math.floor(loc.location.lat / cellSize);
    const cellLng = Math.floor(loc.location.lng / cellSize);
    const key = `${cellLat},${cellLng}`;

    if (!cells[key]) cells[key] = [];
    cells[key].push(loc);
  }

  return cells;
}

function getCellCenter(locations: any[]): { lat: number; lng: number } {
  const sum = locations.reduce(
    (acc, loc) => ({
      lat: acc.lat + loc.location.lat,
      lng: acc.lng + loc.location.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / locations.length,
    lng: sum.lng / locations.length,
  };
}

function mapAlertSeverity(alert: any): number {
  // OpenWeatherMap doesn't have severity, infer from event type
  const event = (alert.event ?? "").toLowerCase();
  if (event.includes("tornado") || event.includes("hurricane")) return 5;
  if (event.includes("flood") || event.includes("severe")) return 4;
  if (event.includes("storm") || event.includes("warning")) return 3;
  if (event.includes("watch") || event.includes("advisory")) return 2;
  return 1;
}

// Need to add imports at top
import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
```

**Step 2: Add cron job to convex.config.ts**

```typescript
// packages/backend/convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every 10 minutes
crons.interval(
  "fetch weather and traffic data",
  { minutes: 10 },
  internal.scheduled.dataFetcher.fetchAllData
);

export default crons;
```

**Step 3: Validate**

```bash
cd packages/backend && npx convex dev --once
```

**Step 4: Commit**

```bash
git add packages/backend/convex/scheduled/ packages/backend/convex/crons.ts
git commit -m "feat(backend): add scheduled data fetcher with regional batching"
```

---

## Phase 2: Mobile App Foundation

### Task 2.1: Install Location Dependencies

**Step 1: Install expo-location**

```bash
cd apps/native && npx expo install expo-location
```

**Step 2: Commit**

```bash
git add apps/native/package.json package-lock.json
git commit -m "deps(native): add expo-location"
```

---

### Task 2.2: Create Location Hook

**Files:**
- Create: `apps/native/hooks/use-location.ts`

**Step 1: Write the hook**

```typescript
import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";

export type LocationCoords = {
  lat: number;
  lng: number;
};

export type LocationState = {
  location: LocationCoords | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useLocation(): LocationState {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setError("Location permission denied");
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get location");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    loading,
    error,
    refresh: fetchLocation,
  };
}
```

**Step 2: Commit**

```bash
git add apps/native/hooks/use-location.ts
git commit -m "feat(native): add useLocation hook"
```

---

### Task 2.3: Create Risk Circle Component

**Files:**
- Create: `apps/native/components/risk-circle.tsx`

**Step 1: Write the animated risk circle**

```typescript
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";

type Classification = "low" | "medium" | "high";

type RiskCircleProps = {
  score: number;
  classification: Classification;
  size?: number;
};

const COLORS = {
  low: "#22c55e",      // green-500
  medium: "#eab308",   // yellow-500
  high: "#ef4444",     // red-500
};

const LABELS = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
};

export function RiskCircle({ score, classification, size = 200 }: RiskCircleProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = withTiming(COLORS[classification], { duration: 500 });
    return { backgroundColor };
  }, [classification]);

  const innerSize = size * 0.85;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.outerCircle,
          { width: size, height: size, borderRadius: size / 2 },
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          <Text style={styles.score}>{score}</Text>
          <Text style={[styles.label, { color: COLORS[classification] }]}>
            {LABELS[classification]}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  innerCircle: {
    backgroundColor: "#0f172a", // slate-900
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#fff",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
});
```

**Step 2: Commit**

```bash
git add apps/native/components/risk-circle.tsx
git commit -m "feat(native): add animated RiskCircle component"
```

---

### Task 2.4: Create Location Card Component

**Files:**
- Create: `apps/native/components/location-card.tsx`

**Step 1: Write the location card**

```typescript
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Classification = "low" | "medium" | "high";

type LocationCardProps = {
  name: string;
  address?: string;
  score: number;
  classification: Classification;
  isDefault?: boolean;
  onPress?: () => void;
};

const COLORS = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#ef4444",
};

const ICONS = {
  Home: "home",
  Work: "briefcase",
  Gym: "fitness",
} as const;

export function LocationCard({
  name,
  address,
  score,
  classification,
  isDefault,
  onPress,
}: LocationCardProps) {
  const iconName = ICONS[name as keyof typeof ICONS] ?? "location";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={iconName as any} size={24} color="#94a3b8" />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Principal</Text>
            </View>
          )}
        </View>
        {address && <Text style={styles.address} numberOfLines={1}>{address}</Text>}
      </View>

      <View style={[styles.scoreBadge, { backgroundColor: COLORS[classification] }]}>
        <Text style={styles.scoreText}>{score}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b", // slate-800
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#334155", // slate-700
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc", // slate-50
  },
  defaultBadge: {
    backgroundColor: "#3b82f6", // blue-500
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  address: {
    fontSize: 14,
    color: "#94a3b8", // slate-400
    marginTop: 2,
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
```

**Step 2: Commit**

```bash
git add apps/native/components/location-card.tsx
git commit -m "feat(native): add LocationCard component"
```

---

### Task 2.5: Create Event Card Component

**Files:**
- Create: `apps/native/components/event-card.tsx`

**Step 1: Write the event card with confirmation buttons**

```typescript
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type EventType = "weather" | "traffic";
type Vote = "still_active" | "cleared" | "not_exists";

type EventCardProps = {
  type: EventType;
  subtype: string;
  severity: number;
  confidenceScore: number;
  distance?: number;
  myVote?: Vote | null;
  onVote?: (vote: Vote) => void;
  onPress?: () => void;
};

const TYPE_ICONS = {
  weather: "cloud",
  traffic: "car",
} as const;

const SUBTYPE_LABELS: Record<string, string> = {
  storm: "Tormenta",
  rain: "Lluvia fuerte",
  flood: "Inundación",
  fog: "Niebla",
  wind: "Viento fuerte",
  accident: "Accidente",
  congestion: "Congestión",
  roadwork: "Obras",
  closure: "Corte de vía",
};

const SEVERITY_COLORS = [
  "#22c55e", // 1 - green
  "#84cc16", // 2 - lime
  "#eab308", // 3 - yellow
  "#f97316", // 4 - orange
  "#ef4444", // 5 - red
];

export function EventCard({
  type,
  subtype,
  severity,
  confidenceScore,
  distance,
  myVote,
  onVote,
  onPress,
}: EventCardProps) {
  const severityColor = SEVERITY_COLORS[severity - 1] ?? SEVERITY_COLORS[2];
  const label = SUBTYPE_LABELS[subtype] ?? subtype;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: severityColor + "20" }]}>
          <Ionicons
            name={TYPE_ICONS[type] as any}
            size={24}
            color={severityColor}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{label}</Text>
          <View style={styles.meta}>
            {distance !== undefined && (
              <Text style={styles.metaText}>
                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
              </Text>
            )}
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>{confidenceScore}% confianza</Text>
          </View>
        </View>

        <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
          <Text style={styles.severityText}>{severity}</Text>
        </View>
      </View>

      {onVote && (
        <View style={styles.voteContainer}>
          <VoteButton
            icon="checkmark-circle"
            label="Sigue"
            active={myVote === "still_active"}
            color="#22c55e"
            onPress={() => onVote("still_active")}
          />
          <VoteButton
            icon="checkmark-done-circle"
            label="Despejado"
            active={myVote === "cleared"}
            color="#3b82f6"
            onPress={() => onVote("cleared")}
          />
          <VoteButton
            icon="close-circle"
            label="No existe"
            active={myVote === "not_exists"}
            color="#ef4444"
            onPress={() => onVote("not_exists")}
          />
        </View>
      )}
    </Pressable>
  );
}

function VoteButton({
  icon,
  label,
  active,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.voteButton,
        active && { backgroundColor: color + "20", borderColor: color },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={active ? color : "#64748b"}
      />
      <Text style={[styles.voteLabel, active && { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  severityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  severityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  voteContainer: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  voteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 4,
  },
  voteLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
  },
});
```

**Step 2: Commit**

```bash
git add apps/native/components/event-card.tsx
git commit -m "feat(native): add EventCard with vote buttons"
```

---

### Task 2.6: Create Home Screen

**Files:**
- Modify: `apps/native/app/(drawer)/(tabs)/index.tsx`

**Step 1: Rewrite home screen with risk display**

```typescript
import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";

import { Container } from "@/components/container";
import { RiskCircle } from "@/components/risk-circle";
import { LocationCard } from "@/components/location-card";
import { useLocation } from "@/hooks/use-location";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function HomeScreen() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

  const { location: currentLocation, loading: locationLoading, refresh: refreshLocation } = useLocation();

  const userLocations = useQuery(api.userLocations.list);
  const riskSnapshots = useQuery(api.riskScore.listForUser);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshLocation();
    setRefreshing(false);
  }, [refreshLocation]);

  // Get the default location's risk or the first one
  const defaultLocation = userLocations?.find((l) => l.isDefault) ?? userLocations?.[0];
  const defaultRisk = defaultLocation
    ? riskSnapshots?.find((r) => r.locationId === defaultLocation._id)
    : null;

  const loading = locationLoading || userLocations === undefined;

  return (
    <Container>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <Text style={[styles.title, { color: theme.text }]}>Outly</Text>
        <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
          Tu riesgo de viaje actual
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <>
            {/* Main Risk Circle */}
            <View style={styles.riskContainer}>
              {defaultRisk ? (
                <RiskCircle
                  score={defaultRisk.score}
                  classification={defaultRisk.classification}
                />
              ) : (
                <View style={styles.noRiskContainer}>
                  <Text style={[styles.noRiskText, { color: theme.text }]}>
                    Agrega una ubicación para ver tu riesgo
                  </Text>
                </View>
              )}
            </View>

            {/* Risk Breakdown */}
            {defaultRisk && (
              <View style={styles.breakdownContainer}>
                <BreakdownItem
                  label="Clima"
                  score={defaultRisk.breakdown.weatherScore}
                  color="#3b82f6"
                />
                <BreakdownItem
                  label="Tráfico"
                  score={defaultRisk.breakdown.trafficScore}
                  color="#f97316"
                />
                <BreakdownItem
                  label="Eventos"
                  score={defaultRisk.breakdown.eventScore}
                  color="#a855f7"
                />
              </View>
            )}

            {/* Saved Locations */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Mis ubicaciones
            </Text>

            {userLocations && userLocations.length > 0 ? (
              userLocations.map((loc) => {
                const risk = riskSnapshots?.find((r) => r.locationId === loc._id);
                return (
                  <LocationCard
                    key={loc._id}
                    name={loc.name}
                    address={loc.address}
                    score={risk?.score ?? 0}
                    classification={risk?.classification ?? "low"}
                    isDefault={loc.isDefault}
                  />
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.text, opacity: 0.5 }]}>
                  No hay ubicaciones guardadas
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Container>
  );
}

function BreakdownItem({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <View style={styles.breakdownItem}>
      <View style={[styles.breakdownBar, { backgroundColor: color + "30" }]}>
        <View
          style={[
            styles.breakdownFill,
            { backgroundColor: color, width: `${score}%` },
          ]}
        />
      </View>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={[styles.breakdownScore, { color }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  riskContainer: {
    alignItems: "center",
    marginVertical: 32,
  },
  noRiskContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  noRiskText: {
    fontSize: 14,
    textAlign: "center",
  },
  breakdownContainer: {
    gap: 12,
    marginBottom: 32,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  breakdownBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  breakdownFill: {
    height: "100%",
    borderRadius: 4,
  },
  breakdownLabel: {
    width: 60,
    fontSize: 14,
    color: "#94a3b8",
  },
  breakdownScore: {
    width: 30,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
```

**Step 2: Commit**

```bash
git add apps/native/app/\(drawer\)/\(tabs\)/index.tsx
git commit -m "feat(native): implement home screen with risk display"
```

---

### Task 2.7: Create Events Tab

**Files:**
- Modify: `apps/native/app/(drawer)/(tabs)/two.tsx` → rename to `events.tsx`
- Modify: `apps/native/app/(drawer)/(tabs)/_layout.tsx`

**Step 1: Create events screen**

```typescript
// apps/native/app/(drawer)/(tabs)/events.tsx
import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import { Id } from "@outly/backend/convex/_generated/dataModel";

import { Container } from "@/components/container";
import { EventCard } from "@/components/event-card";
import { useLocation } from "@/hooks/use-location";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

type FilterType = "all" | "weather" | "traffic";

export default function EventsScreen() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const { location, refresh: refreshLocation } = useLocation();

  const events = useQuery(
    api.events.listNearby,
    location ? { lat: location.lat, lng: location.lng, radiusKm: 20 } : "skip"
  );

  const vote = useMutation(api.confirmations.vote);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    setRefreshing(false);
  };

  const handleVote = async (eventId: Id<"events">, voteType: "still_active" | "cleared" | "not_exists") => {
    await vote({ eventId, vote: voteType });
  };

  const filteredEvents = events?.filter((e) => {
    if (filter === "all") return true;
    return e.type === filter;
  });

  return (
    <Container>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <Text style={[styles.title, { color: theme.text }]}>Eventos</Text>
        <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
          Incidentes cercanos a ti
        </Text>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <FilterButton
            label="Todos"
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />
          <FilterButton
            label="Clima"
            active={filter === "weather"}
            onPress={() => setFilter("weather")}
          />
          <FilterButton
            label="Tráfico"
            active={filter === "traffic"}
            onPress={() => setFilter("traffic")}
          />
        </View>

        {/* Events List */}
        {filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCardWithVote
              key={event._id}
              event={event}
              userLocation={location}
              onVote={(voteType) => handleVote(event._id, voteType)}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text, opacity: 0.5 }]}>
              {events === undefined
                ? "Cargando eventos..."
                : "No hay eventos cercanos"}
            </Text>
          </View>
        )}
      </ScrollView>
    </Container>
  );
}

function EventCardWithVote({
  event,
  userLocation,
  onVote,
}: {
  event: any;
  userLocation: { lat: number; lng: number } | null;
  onVote: (vote: "still_active" | "cleared" | "not_exists") => void;
}) {
  const myVote = useQuery(api.confirmations.getMyVote, { eventId: event._id });

  const distance = userLocation
    ? haversineDistance(
        userLocation.lat,
        userLocation.lng,
        event.location.lat,
        event.location.lng
      )
    : undefined;

  return (
    <EventCard
      type={event.type}
      subtype={event.subtype}
      severity={event.severity}
      confidenceScore={event.confidenceScore}
      distance={distance}
      myVote={myVote?.vote}
      onVote={onVote}
    />
  );
}

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text
        style={[styles.filterLabel, active && styles.filterLabelActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
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

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#1e293b",
  },
  filterButtonActive: {
    backgroundColor: "#3b82f6",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
  },
  filterLabelActive: {
    color: "#fff",
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
```

**Step 2: Update tab layout**

```typescript
// apps/native/app/(drawer)/(tabs)/_layout.tsx
import { Tabs } from "expo-router";

import { TabBarIcon } from "@/components/tabbar-icon";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function TabLayout() {
  const { isDarkColorScheme } = useColorScheme();
  const theme = isDarkColorScheme ? NAV_THEME.dark : NAV_THEME.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.text,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Eventos",
          tabBarIcon: ({ color }) => <TabBarIcon name="alert-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color }) => <TabBarIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
```

**Step 3: Delete old two.tsx and create settings placeholder**

```bash
rm apps/native/app/\(drawer\)/\(tabs\)/two.tsx
```

```typescript
// apps/native/app/(drawer)/(tabs)/settings.tsx
import React from "react";
import { ScrollView, Text, StyleSheet } from "react-native";

import { Container } from "@/components/container";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function SettingsScreen() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

  return (
    <Container>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Ajustes</Text>
        <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
          Configuración de la app
        </Text>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
});
```

**Step 4: Commit**

```bash
git add apps/native/app/\(drawer\)/\(tabs\)/
git commit -m "feat(native): add events tab with filtering and voting"
```

---

## Phase 3 & 4: Events, Community & Push Notifications

*These phases follow the same pattern. Due to length, I'll summarize the remaining tasks:*

### Remaining Tasks

**Phase 3:**
- Task 3.1: Add location screen with search/geocoding
- Task 3.2: Add report event screen
- Task 3.3: Implement settings screen with location management

**Phase 4:**
- Task 4.1: Install expo-notifications
- Task 4.2: Create notification registration hook
- Task 4.3: Create push notification action in Convex
- Task 4.4: Add alert checker to scheduled function
- Task 4.5: Handle notification deep linking

---

## Environment Setup

Before running, add these environment variables:

**packages/backend/.env.local:**
```bash
OPENWEATHERMAP_API_KEY=your_key_here
TOMORROW_IO_API_KEY=your_key_here
HERE_API_KEY=your_key_here
```

## Running the App

```bash
# Terminal 1: Start Convex backend
cd packages/backend && npm run dev

# Terminal 2: Start Expo app
cd apps/native && npx expo start
```

## Testing Checklist

- [ ] Schema deploys without errors
- [ ] User can sign in with Clerk
- [ ] Location permission is requested
- [ ] Risk circle displays with score
- [ ] Events list shows nearby incidents
- [ ] Voting updates confidence score
- [ ] Push notifications trigger on high risk
