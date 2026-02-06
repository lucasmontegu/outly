# Convex Bandwidth Monitoring and Optimization Strategy

## Executive Summary

This document provides a comprehensive strategy for monitoring and optimizing Convex bandwidth usage for the Outia mobile app. Based on analysis of the current codebase, several high-impact optimization opportunities have been identified that could reduce bandwidth consumption by 60-80%.

**Free Tier Limits:**
- Database bandwidth: 1GB/month
- Function calls: 1M/month

---

## Part 1: Bandwidth Consumption Analysis

### 1.1 Identified High-Bandwidth Queries

| Query | Location | Estimated Size | Call Frequency | Monthly Impact |
|-------|----------|----------------|----------------|----------------|
| `events.listNearby` | map.tsx | ~50KB per call | Every map view | HIGH |
| `events.listActive` | Multiple | ~50KB per call | Subscribed | HIGH |
| `riskScore.getCurrentRisk` | index.tsx | ~5KB per call | Every refresh | MEDIUM |
| `riskScore.getForecast` | index.tsx | ~3KB per call | Every refresh | MEDIUM |
| `routes.getRoutesWithForecast` | index.tsx | ~10KB per call | Subscribed | MEDIUM |
| `gamification.getMyStats` | Multiple | ~1KB per call | Frequent | LOW |
| `confirmations.getMyVote` | map.tsx | ~0.5KB per call | Per event | LOW |

### 1.2 Critical Issues Identified

#### Issue 1: Full Table Scans in Event Queries
**File:** `/packages/backend/convex/events.ts` (lines 62-79)
```typescript
// PROBLEM: Fetches ALL events, then filters client-side
const events = await ctx.db.query("events").collect();
```
**Impact:** Every call to `listNearby` or `getCurrentRisk` downloads the entire events table.

#### Issue 2: Duplicate Data in Risk Calculations
**File:** `/packages/backend/convex/riskScore.ts` (lines 173-176, 282-288)
```typescript
// PROBLEM: Same events query executed multiple times
const events = await ctx.db.query("events").collect();
```
**Impact:** `getCurrentRisk` and `getForecast` both fetch all events independently.

#### Issue 3: Subscription Overload on Home Screen
**File:** `/apps/native/app/(tabs)/index.tsx` (lines 49-64)
```typescript
// 4 simultaneous subscriptions on every home screen mount
const currentUser = useQuery(api.users.getCurrentUser);
const riskData = useQuery(api.riskScore.getCurrentRisk, ...);
const forecastData = useQuery(api.riskScore.getForecast, ...);
const routesWithForecast = useQuery(api.routes.getRoutesWithForecast);
```
**Impact:** Each subscription maintains a WebSocket connection and triggers re-queries on any data change.

#### Issue 4: Raw Data Storage in Risk Snapshots
**File:** `/packages/backend/convex/schema.ts` (lines 140-141)
```typescript
weatherData: v.optional(v.any()),
trafficData: v.optional(v.any()),
```
**Impact:** Large raw API responses stored and transmitted with every risk query.

#### Issue 5: No Geospatial Indexing
**File:** `/packages/backend/convex/events.ts`
**Impact:** Cannot efficiently query events by location, requiring full table scan + client-side filtering.

---

## Part 2: Monitoring Approach

### 2.1 Convex Dashboard Metrics to Monitor

#### Primary Metrics (Check Daily)
1. **Database Bandwidth Used** - Total bandwidth consumption
2. **Function Calls** - Number of queries/mutations executed
3. **Active Subscriptions** - Real-time subscription count
4. **Document Reads** - Total documents read across all queries

#### Secondary Metrics (Check Weekly)
1. **Query Execution Time** - Identify slow queries
2. **Cache Hit Rate** - Convex internal caching effectiveness
3. **Scheduled Function Executions** - Cron job resource usage

### 2.2 Custom Bandwidth Tracking Implementation

Create a bandwidth monitoring system within Convex:

```typescript
// packages/backend/convex/monitoring.ts
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Track query execution metrics
export const logQueryExecution = internalMutation({
  args: {
    queryName: v.string(),
    estimatedBytes: v.number(),
    documentCount: v.number(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    // Aggregate daily stats (store in a dedicated table)
    const existing = await ctx.db
      .query("bandwidthMetrics")
      .withIndex("by_query_date", (q) =>
        q.eq("queryName", args.queryName).eq("date", today)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalBytes: existing.totalBytes + args.estimatedBytes,
        callCount: existing.callCount + 1,
        totalDocuments: existing.totalDocuments + args.documentCount,
      });
    } else {
      await ctx.db.insert("bandwidthMetrics", {
        queryName: args.queryName,
        date: today,
        totalBytes: args.estimatedBytes,
        callCount: 1,
        totalDocuments: args.documentCount,
      });
    }
  },
});

// Get bandwidth report
export const getBandwidthReport = internalQuery({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - args.days);

    const metrics = await ctx.db.query("bandwidthMetrics").collect();

    return metrics
      .filter(m => m.date >= startDate.toISOString().split("T")[0])
      .reduce((acc, m) => {
        if (!acc[m.queryName]) {
          acc[m.queryName] = { totalBytes: 0, callCount: 0, totalDocuments: 0 };
        }
        acc[m.queryName].totalBytes += m.totalBytes;
        acc[m.queryName].callCount += m.callCount;
        acc[m.queryName].totalDocuments += m.totalDocuments;
        return acc;
      }, {} as Record<string, any>);
  },
});
```

### 2.3 Subscription Frequency Tracking

Add to schema for monitoring:

```typescript
// Add to schema.ts
bandwidthMetrics: defineTable({
  queryName: v.string(),
  date: v.string(),
  totalBytes: v.number(),
  callCount: v.number(),
  totalDocuments: v.number(),
})
  .index("by_query_date", ["queryName", "date"])
  .index("by_date", ["date"]),

subscriptionMetrics: defineTable({
  subscriptionId: v.string(),
  queryName: v.string(),
  userId: v.string(),
  startedAt: v.number(),
  updateCount: v.number(),
  lastUpdateAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_query", ["queryName"]),
```

### 2.4 Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Daily Bandwidth | > 35MB | > 50MB | Investigate top queries |
| Hourly Function Calls | > 5,000 | > 10,000 | Check subscription loops |
| Single Query Bandwidth | > 100KB | > 500KB | Add pagination |
| Active Subscriptions/User | > 5 | > 10 | Consolidate queries |
| Events Table Size | > 1,000 docs | > 5,000 docs | Increase cleanup frequency |

---

## Part 3: Optimization Checklist

### 3.1 Query Batching Strategies

#### Strategy A: Consolidated Dashboard Query
Replace 4 separate queries with 1 batched query:

```typescript
// packages/backend/convex/dashboard.ts
export const getDashboardData = query({
  args: {
    lat: v.number(),
    lng: v.number(),
  },
  returns: v.object({
    user: v.union(userDoc, v.null()),
    risk: v.object({...}),
    forecast: v.object({...}),
    routes: v.array(routeWithForecastDoc),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // Single events fetch shared across all calculations
    const now = Date.now();
    const allEvents = await ctx.db.query("events").collect();
    const validEvents = allEvents.filter(e => e.ttl > now && e.confidenceScore > 20);

    // Calculate everything in one pass
    const [user, risk, forecast, routes] = await Promise.all([
      identity ? getUserInternal(ctx, identity.subject) : null,
      calculateRisk(validEvents, args.lat, args.lng),
      calculateForecast(validEvents, args.lat, args.lng),
      identity ? getRoutesWithForecast(ctx, identity.subject, validEvents) : [],
    ]);

    return { user, risk, forecast, routes };
  },
});
```

**Estimated Savings:** 60-70% bandwidth reduction on home screen

#### Strategy B: Event Pre-filtering with Bounding Box

```typescript
// Approximate geospatial query using index
export const listNearbyOptimized = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Calculate bounding box (approximate)
    const latDelta = args.radiusKm / 111; // ~111km per degree
    const lngDelta = args.radiusKm / (111 * Math.cos(args.lat * Math.PI / 180));

    const minLat = args.lat - latDelta;
    const maxLat = args.lat + latDelta;
    const minLng = args.lng - lngDelta;
    const maxLng = args.lng + lngDelta;

    // Still need to collect all, but filter more aggressively
    const events = await ctx.db
      .query("events")
      .withIndex("by_ttl")
      .filter((q) => q.gt(q.field("ttl"), now))
      .collect();

    // Pre-filter by bounding box before expensive distance calc
    return events.filter((e) => {
      if (e.confidenceScore <= 20) return false;
      if (e.location.lat < minLat || e.location.lat > maxLat) return false;
      if (e.location.lng < minLng || e.location.lng > maxLng) return false;

      // Final precise distance check
      const distance = haversineDistance(
        args.lat, args.lng,
        e.location.lat, e.location.lng
      );
      return distance <= args.radiusKm;
    });
  },
});
```

**Estimated Savings:** 20-40% fewer events transmitted

### 3.2 Subscription Management Patterns

#### Pattern A: Conditional Subscriptions
Only subscribe when tab is active:

```typescript
// apps/native/app/(tabs)/index.tsx
import { useIsFocused } from '@react-navigation/native';

export default function OverviewScreen() {
  const isFocused = useIsFocused();

  // Only maintain subscription when screen is visible
  const riskData = useQuery(
    api.riskScore.getCurrentRisk,
    isFocused && location ? { lat: location.lat, lng: location.lng } : "skip"
  );

  // ...
}
```

**Estimated Savings:** 50% reduction in subscription updates

#### Pattern B: Polling Instead of Subscriptions for Stable Data

```typescript
// For data that doesn't need real-time updates
import { useQuery } from "convex/react";
import { useState, useEffect } from "react";

function usePolledQuery(queryRef, args, intervalMs = 60000) {
  const [pollKey, setPollKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPollKey(k => k + 1);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  // The pollKey change triggers a re-render, not a new subscription
  return useQuery(queryRef, args);
}

// Usage - weather data only needs 1-minute updates
const forecastData = usePolledQuery(
  api.riskScore.getForecast,
  location ? { lat: location.lat, lng: location.lng } : "skip",
  60000 // Poll every 60 seconds
);
```

#### Pattern C: Subscription Consolidation

```typescript
// Instead of multiple subscriptions, use a single aggregated subscription
// with client-side data extraction

// packages/backend/convex/subscriptions.ts
export const subscribeToUserData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Bundle all user-specific data
    const [user, stats, locations, routes] = await Promise.all([
      getCurrentUser(ctx, identity.subject),
      getMyStats(ctx, identity.subject),
      getLocations(ctx, identity.subject),
      getRoutes(ctx, identity.subject),
    ]);

    return { user, stats, locations, routes };
  },
});
```

### 3.3 Data Denormalization Opportunities

#### Opportunity A: Pre-computed Risk Scores in Routes

```typescript
// Instead of computing forecast for each route on every query,
// store last-computed values

// Update schema
routes: defineTable({
  // ... existing fields ...
  cachedScore: v.optional(v.number()),
  cachedClassification: v.optional(v.union(
    v.literal("low"), v.literal("medium"), v.literal("high")
  )),
  cachedAt: v.optional(v.number()),
})
```

Update during scheduled data fetch instead of on every query.

**Estimated Savings:** 80% reduction in route forecast computation

#### Opportunity B: Compact Event Representation

```typescript
// Create a slim event representation for list views
export const listNearbyCompact = query({
  args: { lat: v.number(), lng: v.number(), radiusKm: v.number() },
  returns: v.array(v.object({
    _id: v.id("events"),
    type: v.union(v.literal("weather"), v.literal("traffic")),
    subtype: v.string(),
    severity: v.number(),
    lat: v.number(),
    lng: v.number(),
  })),
  handler: async (ctx, args) => {
    const events = await listNearbyInternal(ctx, args);

    // Return only essential fields for map display
    return events.map(e => ({
      _id: e._id,
      type: e.type,
      subtype: e.subtype,
      severity: e.severity,
      lat: e.location.lat,
      lng: e.location.lng,
    }));
  },
});
```

**Estimated Savings:** 70% reduction per event (remove routePoints, rawData, etc.)

#### Opportunity C: Flatten Risk Snapshot Response

Remove `weatherData` and `trafficData` from query responses - only store for debugging:

```typescript
// Return only computed values, not raw API data
export const getForLocationCompact = query({
  args: { locationId: v.id("userLocations") },
  returns: v.union(
    v.object({
      score: v.number(),
      classification: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      breakdown: v.object({
        weatherScore: v.number(),
        trafficScore: v.number(),
        eventScore: v.number(),
      }),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const snapshot = await ctx.db
      .query("riskSnapshots")
      .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
      .order("desc")
      .take(1);

    if (!snapshot[0]) return null;

    // Don't return weatherData/trafficData
    return {
      score: snapshot[0].score,
      classification: snapshot[0].classification,
      breakdown: snapshot[0].breakdown,
    };
  },
});
```

### 3.4 Client-Side Caching Strategies

#### Strategy A: React Query / TanStack Query Integration

```typescript
// apps/native/lib/cache.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

// For static data like badge definitions
export const staticQueryOptions = {
  staleTime: Infinity,
  cacheTime: Infinity,
};
```

#### Strategy B: AsyncStorage Persistence

```typescript
// apps/native/lib/storage-cache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'convex_cache_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return data as T;
  } catch {
    return null;
  }
}

export async function setCachedData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}
```

#### Strategy C: Optimistic Updates for Votes

```typescript
// apps/native/hooks/useOptimisticVote.ts
import { useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { useState } from "react";

export function useOptimisticVote() {
  const [optimisticVote, setOptimisticVote] = useState<string | null>(null);
  const voteMutation = useMutation(api.confirmations.vote);

  const vote = async (eventId: string, voteType: string) => {
    // Set optimistic state immediately
    setOptimisticVote(voteType);

    try {
      await voteMutation({ eventId, vote: voteType });
    } catch (error) {
      // Revert on error
      setOptimisticVote(null);
      throw error;
    }
  };

  return { vote, optimisticVote };
}
```

---

## Part 4: Development Practices

### 4.1 Code Review Checklist for Bandwidth

Before merging any Convex-related code, verify:

- [ ] **No full table scans:** Query uses appropriate index
- [ ] **Minimal data returned:** Only required fields selected
- [ ] **Subscription necessity:** Real-time updates actually needed?
- [ ] **Query deduplication:** Not fetching same data multiple times
- [ ] **Pagination implemented:** For potentially large result sets
- [ ] **rawData excluded:** Large nested objects not returned to client

### 4.2 Query Sizing Guidelines

| Data Type | Target Size | Max Size |
|-----------|-------------|----------|
| Single document | < 2KB | < 10KB |
| List query (10 items) | < 20KB | < 50KB |
| Dashboard aggregate | < 30KB | < 100KB |
| Full event with rawData | Never return | Store only |

### 4.3 Subscription Rules

1. **One subscription per unique data need** - Don't create overlapping subscriptions
2. **Skip when not visible** - Use "skip" when component not mounted
3. **Prefer polling for slow-changing data** - Weather updates every 10 min anyway
4. **Consolidate user data** - Single subscription for all user-specific data

### 4.4 Index Requirements

Every new query should have a matching index:

```typescript
// BAD - Full table scan
const events = await ctx.db.query("events").collect();

// GOOD - Indexed query
const events = await ctx.db
  .query("events")
  .withIndex("by_ttl", (q) => q.gt("ttl", Date.now()))
  .collect();
```

---

## Part 5: Testing Strategies

### 5.1 Bandwidth Testing in Development

```typescript
// packages/backend/convex/testing/bandwidth.ts
import { internalQuery } from "../_generated/server";

// Estimate response size
export const measureQuerySize = internalQuery({
  args: { queryName: v.string() },
  handler: async (ctx, args) => {
    let result;

    switch (args.queryName) {
      case "events.listNearby":
        result = await ctx.db.query("events").collect();
        break;
      case "riskScore.getCurrentRisk":
        // ... simulate query
        break;
    }

    const sizeBytes = JSON.stringify(result).length;
    const documentCount = Array.isArray(result) ? result.length : 1;

    return {
      queryName: args.queryName,
      sizeBytes,
      sizeKB: Math.round(sizeBytes / 1024 * 10) / 10,
      documentCount,
      avgDocSize: Math.round(sizeBytes / documentCount),
    };
  },
});
```

### 5.2 Automated Bandwidth Tests

```typescript
// __tests__/bandwidth.test.ts
describe('Bandwidth Budget Tests', () => {
  it('events.listNearby should not exceed 50KB', async () => {
    const result = await convex.query(api.testing.measureQuerySize, {
      queryName: 'events.listNearby',
    });
    expect(result.sizeKB).toBeLessThan(50);
  });

  it('dashboard aggregate should not exceed 100KB', async () => {
    const result = await convex.query(api.testing.measureQuerySize, {
      queryName: 'dashboard.getDashboardData',
    });
    expect(result.sizeKB).toBeLessThan(100);
  });

  it('single event should not exceed 5KB', async () => {
    const result = await convex.query(api.testing.measureQuerySize, {
      queryName: 'events.get',
    });
    expect(result.sizeKB).toBeLessThan(5);
  });
});
```

### 5.3 Load Testing for Subscriptions

```typescript
// scripts/subscription-load-test.ts
import { ConvexHttpClient } from "convex/browser";

async function testSubscriptionLoad() {
  const clients: ConvexHttpClient[] = [];
  const CONCURRENT_USERS = 100;

  console.log(`Starting ${CONCURRENT_USERS} concurrent subscription test...`);

  for (let i = 0; i < CONCURRENT_USERS; i++) {
    const client = new ConvexHttpClient(process.env.CONVEX_URL!);
    clients.push(client);

    // Simulate user subscribing to dashboard
    await client.query(api.dashboard.getDashboardData, {
      lat: 40.7128 + (Math.random() * 0.1),
      lng: -74.0060 + (Math.random() * 0.1),
    });
  }

  // Monitor bandwidth in Convex dashboard during this test
  console.log("Test running - check Convex dashboard for bandwidth usage");

  // Cleanup
  await new Promise(resolve => setTimeout(resolve, 60000));
  clients.forEach(c => c.close());
}
```

### 5.4 CI/CD Integration

```yaml
# .github/workflows/bandwidth-check.yml
name: Bandwidth Budget Check

on:
  pull_request:
    paths:
      - 'packages/backend/convex/**'

jobs:
  bandwidth-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run bandwidth tests
        run: npm run test:bandwidth
        env:
          CONVEX_URL: ${{ secrets.CONVEX_TEST_URL }}

      - name: Comment PR with results
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            // Post bandwidth test results as PR comment
```

---

## Part 6: Estimated Savings Summary

| Optimization | Implementation Effort | Bandwidth Reduction | Priority |
|--------------|----------------------|---------------------|----------|
| Consolidated dashboard query | Medium | 60-70% on home screen | P0 |
| Compact event representation | Low | 70% per event list | P0 |
| Conditional subscriptions | Low | 50% subscription traffic | P0 |
| Remove rawData from responses | Low | 40-60% per snapshot | P1 |
| Pre-computed route scores | Medium | 80% route forecast | P1 |
| Client-side caching | Medium | 30-50% repeat queries | P1 |
| Bounding box pre-filter | Low | 20-40% events query | P2 |
| Polling for stable data | Low | 30% subscription | P2 |

### Monthly Bandwidth Projection

**Current (estimated):**
- 100 active users
- 20 app opens per user per day
- 4 subscriptions per open
- ~50KB average response
- **Total: ~1.2GB/month** (over free tier)

**After P0 optimizations:**
- Consolidated query: 1 subscription instead of 4
- Compact responses: 15KB average
- Conditional subscriptions: 50% fewer updates
- **Total: ~200MB/month** (80% reduction)

---

## Part 7: Implementation Roadmap

### Week 1: Monitoring Setup
1. Add bandwidthMetrics table to schema
2. Implement query logging
3. Set up dashboard alerts in Convex

### Week 2: Quick Wins (P0)
1. Implement consolidated dashboard query
2. Add conditional subscriptions (skip when not focused)
3. Create compact event list endpoint

### Week 3: Data Optimization (P1)
1. Remove rawData from query responses
2. Implement client-side caching with AsyncStorage
3. Add pre-computed scores to routes table

### Week 4: Testing & Polish (P2)
1. Add automated bandwidth tests
2. Implement bounding box pre-filtering
3. Convert stable data to polling pattern
4. Document all optimizations

---

## Appendix: Quick Reference

### Convex Dashboard URLs
- Production: `https://dashboard.convex.dev/t/{team}/{project}`
- Logs: `https://dashboard.convex.dev/t/{team}/{project}/logs`
- Functions: `https://dashboard.convex.dev/t/{team}/{project}/functions`

### Key Files
- Schema: `/packages/backend/convex/schema.ts`
- Events: `/packages/backend/convex/events.ts`
- Risk: `/packages/backend/convex/riskScore.ts`
- Routes: `/packages/backend/convex/routes.ts`
- Home Screen: `/apps/native/app/(tabs)/index.tsx`
- Map Screen: `/apps/native/app/(tabs)/map.tsx`

### Emergency Actions
If bandwidth spikes unexpectedly:
1. Check Convex logs for query patterns
2. Disable scheduled data fetcher temporarily
3. Enable aggressive client-side caching
4. Reduce subscription refresh rates
