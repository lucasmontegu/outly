# Road-Following Routes Implementation Guide

Complete guide for implementing professional road-following polylines in Outia using Expo SDK 54.

## Table of Contents

1. [Overview](#overview)
2. [HERE Routing Implementation (DONE)](#here-routing-implementation-done)
3. [Address Search with HERE Autosuggest](#address-search-with-here-autosuggest)
4. [Weather Waypoints Along Route](#weather-waypoints-along-route)
5. [Traffic-Colored Route Segments](#traffic-colored-route-segments)
6. [Dark Mode Map Styling](#dark-mode-map-styling)
7. [Alternative: Google Directions](#alternative-google-directions)
8. [Alternative: Mapbox Directions](#alternative-mapbox-directions)

---

## Overview

**What We've Built:**
- HERE Routing API v8 integration for road-following polylines
- Flexible polyline decoder (HERE's efficient format)
- 3 route alternatives with traffic-aware ETAs
- Database schema for storing polylines
- React Native map component with road-following visualization

**Status:** Core routing is complete. This guide covers the remaining features.

---

## HERE Routing Implementation (DONE)

### Files Created/Modified:

1. **Backend:**
   - `/packages/backend/convex/integrations/routing.ts` - HERE Routing API v8 wrapper
   - `/packages/backend/convex/routes.ts` - Added polyline fetching actions
   - `/packages/backend/convex/schema.ts` - Added polyline fields to routes table

2. **Frontend:**
   - `/apps/native/lib/polyline-decoder.ts` - Flexible polyline decoder + utilities
   - `/apps/native/components/map/route-polyline-group.tsx` - Updated to render polylines

### How It Works:

1. User creates a route
2. Backend immediately schedules `fetchRoutePolylines` action
3. Action calls HERE Routing API with origin/destination
4. API returns 3 route alternatives with:
   - Encoded polyline (flexiblePolyline format)
   - Traffic-aware duration
   - Typical duration (no traffic)
   - Distance in meters
5. Backend decodes polylines and stores in database
6. Frontend renders road-following polylines on map
7. Daily cron job refreshes polylines (routes change over time)

### Testing:

```bash
# 1. Deploy backend changes
npx convex dev

# 2. Start Expo app
npm run dev:native

# 3. Create a new route in the app
# - Polyline will load within 1-2 seconds
# - Check Convex dashboard for routing.getRouteAlternatives logs

# 4. View on map - should follow roads instead of straight line
```

---

## Address Search with HERE Autosuggest

### Problem
Current Nominatim search is inaccurate for Argentina addresses. HERE Autosuggest provides better results with business POI support.

### Backend Action

**File:** `/packages/backend/convex/integrations/search.ts`

```typescript
"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * HERE Autosuggest API v1
 * Docs: https://developer.here.com/documentation/geocoding-search-api/dev_guide/topics/endpoint-autosuggest-brief.html
 */
export const searchLocations = action({
  args: {
    query: v.string(),
    // User's current location for better results
    userLocation: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    // Limit results
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.HERE_API_KEY;
    if (!apiKey) throw new Error("HERE_API_KEY not configured");

    const { query, userLocation, limit = 5 } = args;

    const url = new URL("https://autosuggest.search.hereapi.com/v1/autosuggest");
    url.searchParams.set("q", query);
    url.searchParams.set("at", `${userLocation.lat},${userLocation.lng}`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("lang", "es"); // Spanish for Argentina
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HERE Autosuggest error: ${response.status}`);
    }

    const data = await response.json();

    // Transform to consistent format
    return data.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      address: item.address?.label || "",
      category: item.resultType, // "locality", "street", "place", etc.
      location: {
        lat: item.position?.lat,
        lng: item.position?.lng,
      },
      distance: item.distance, // meters from user location
    }));
  },
});

/**
 * Get full place details by ID
 */
export const getPlaceDetails = action({
  args: {
    placeId: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.HERE_API_KEY;
    if (!apiKey) throw new Error("HERE_API_KEY not configured");

    const url = new URL("https://lookup.search.hereapi.com/v1/lookup");
    url.searchParams.set("id", args.placeId);
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HERE Lookup error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      title: data.title,
      address: data.address,
      position: data.position,
      categories: data.categories,
      contacts: data.contacts,
      openingHours: data.openingHours,
    };
  },
});
```

### React Native Hook

**File:** `/apps/native/hooks/use-location-search.ts`

```typescript
import { useState, useCallback, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { useLocation } from "./use-location";

type SearchResult = {
  id: string;
  title: string;
  address: string;
  category: string;
  location: { lat: number; lng: number };
  distance?: number;
};

export function useLocationSearch() {
  const { location } = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchAction = useAction(api.integrations.search.searchLocations);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 3 || !location) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchAction({
          query: searchQuery,
          userLocation: location,
          limit: 5,
        });
        setResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [location, searchAction]
  );

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (searchQuery.length >= 3) {
        timeoutRef.current = setTimeout(() => {
          search(searchQuery);
        }, 300);
      } else {
        setResults([]);
      }
    },
    [search]
  );

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    query,
    results,
    isSearching,
    search: debouncedSearch,
    clear,
  };
}
```

### Update Map Search Component

**File:** `/apps/native/app/(tabs)/map.tsx` (lines 733-792)

Replace Nominatim search with:

```typescript
import { useLocationSearch } from "@/hooks/use-location-search";

// Inside MapScreen component:
const { query, results, isSearching, search, clear } = useLocationSearch();

// Replace handleSearchChange:
const handleSearchChange = (text: string) => {
  search(text);
};

// Replace searchLocations function - REMOVE IT

// Update handleSearchSelect:
const handleSearchSelect = (result: SearchResult) => {
  clear();
  Keyboard.dismiss();

  if (mapRef.current && result.location) {
    mapRef.current.animateToRegion({
      latitude: result.location.lat,
      longitude: result.location.lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 500);
  }
};
```

---

## Weather Waypoints Along Route

Like Wayther shows weather bubbles at intervals along the route.

### Backend: Fetch Weather for Waypoints

**File:** `/packages/backend/convex/routes.ts` (add to end)

```typescript
import { samplePolylineByDistance } from "./lib/polyline-utils";

/**
 * Get weather waypoints along a route
 * Samples route every 50km and fetches current weather
 */
export const getRouteWeatherWaypoints = query({
  args: {
    routeId: v.id("routes"),
    intervalKm: v.optional(v.number()), // Default 50km
  },
  returns: v.array(
    v.object({
      location: v.object({ lat: v.number(), lng: v.number() }),
      distanceKm: v.number(),
      temperature: v.number(),
      condition: v.string(),
      icon: v.string(),
      windSpeed: v.number(),
      precipitation: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const route = await ctx.db.get(args.routeId);
    if (!route || route.userId !== identity.subject || !route.polyline) {
      return [];
    }

    // Sample waypoints along polyline
    const samples = samplePolylineByDistance(route.polyline, args.intervalKm || 50);

    // Fetch weather for each waypoint
    const weatherPromises = samples.map(async (sample) => {
      // Query cached weather events near this waypoint
      const gridCell = getGridCell(sample.lat, sample.lng);
      const events = await ctx.db
        .query("events")
        .withIndex("by_grid_ttl", (q) =>
          q.eq("gridCell", gridCell).gt("ttl", Date.now())
        )
        .filter((q) => q.eq(q.field("type"), "weather"))
        .take(1);

      const weatherEvent = events[0];

      if (weatherEvent?.rawData) {
        // Extract OpenWeatherMap data
        const data = weatherEvent.rawData;
        return {
          location: sample,
          distanceKm: sample.distanceKm,
          temperature: Math.round(data.main?.temp || 0),
          condition: data.weather?.[0]?.main || "Clear",
          icon: data.weather?.[0]?.icon || "01d",
          windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // m/s to km/h
          precipitation: data.rain?.["1h"] || 0,
        };
      }

      // No cached data, return placeholder
      return {
        location: sample,
        distanceKm: sample.distanceKm,
        temperature: 20,
        condition: "Unknown",
        icon: "01d",
        windSpeed: 0,
        precipitation: 0,
      };
    });

    return await Promise.all(weatherPromises);
  },
});

function getGridCell(lat: number, lng: number): string {
  return `${Math.floor(lat / 0.5) * 0.5}_${Math.floor(lng / 0.5) * 0.5}`;
}
```

### Polyline Utils

**File:** `/packages/backend/convex/lib/polyline-utils.ts`

```typescript
/**
 * Sample polyline points at regular distance intervals
 */
export function samplePolylineByDistance(
  points: { lat: number; lng: number }[],
  intervalKm: number = 50
): Array<{ lat: number; lng: number; distanceKm: number }> {
  if (points.length === 0) return [];

  const samples: Array<{ lat: number; lng: number; distanceKm: number }> = [];
  let accumulatedDistance = 0;
  let nextSampleDistance = 0;

  // Always include start point
  samples.push({ ...points[0], distanceKm: 0 });

  for (let i = 1; i < points.length; i++) {
    const segmentDistance = haversineDistance(points[i - 1], points[i]);
    accumulatedDistance += segmentDistance;

    // Check if we crossed a sample point
    while (accumulatedDistance >= nextSampleDistance + intervalKm) {
      nextSampleDistance += intervalKm;

      // Interpolate point at exact sample distance
      const ratio =
        (nextSampleDistance - (accumulatedDistance - segmentDistance)) /
        segmentDistance;
      const interpolated = {
        lat: points[i - 1].lat + (points[i].lat - points[i - 1].lat) * ratio,
        lng: points[i - 1].lng + (points[i].lng - points[i - 1].lng) * ratio,
        distanceKm: nextSampleDistance,
      };
      samples.push(interpolated);
    }
  }

  // Always include end point
  const lastPoint = points[points.length - 1];
  samples.push({ ...lastPoint, distanceKm: accumulatedDistance });

  return samples;
}

function haversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
```

### React Native Weather Markers

**File:** `/apps/native/components/map/weather-waypoint-marker.tsx`

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { colors, typography, borderRadius } from '@/lib/design-tokens';

type Props = {
  waypoint: {
    location: { lat: number; lng: number };
    distanceKm: number;
    temperature: number;
    condition: string;
    icon: string;
    windSpeed: number;
    precipitation: number;
  };
  onPress?: () => void;
};

export function WeatherWaypointMarker({ waypoint, onPress }: Props) {
  return (
    <Marker
      coordinate={{
        latitude: waypoint.location.lat,
        longitude: waypoint.location.lng,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={styles.container}>
        <Text style={styles.temperature}>{waypoint.temperature}°</Text>
        <Text style={styles.distance}>{Math.round(waypoint.distanceKm)}km</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: colors.brand.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
  },
  temperature: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  distance: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});
```

### Add to Map Screen

```typescript
// Inside MapScreen, after route polylines:
{selectedRoute && selectedRoute.polyline && (
  <WeatherWaypoints routeId={selectedRoute._id} />
)}

// Create wrapper component:
function WeatherWaypoints({ routeId }: { routeId: Id<"routes"> }) {
  const waypoints = useQuery(api.routes.getRouteWeatherWaypoints, { routeId });

  if (!waypoints || waypoints.length === 0) return null;

  return (
    <>
      {waypoints.map((waypoint, index) => (
        <WeatherWaypointMarker
          key={`waypoint-${index}`}
          waypoint={waypoint}
        />
      ))}
    </>
  );
}
```

---

## Traffic-Colored Route Segments

Color-code the route polyline by traffic congestion level (like Google Maps).

### Backend: Add Traffic Segments

**File:** `/packages/backend/convex/routes.ts`

```typescript
/**
 * Get traffic-colored segments for a route
 * Returns polyline split into segments with congestion colors
 */
export const getRouteTrafficSegments = query({
  args: {
    routeId: v.id("routes"),
  },
  returns: v.array(
    v.object({
      coordinates: v.array(
        v.object({ lat: v.number(), lng: v.number() })
      ),
      congestion: v.union(
        v.literal("free_flow"),
        v.literal("moderate"),
        v.literal("slow"),
        v.literal("jam")
      ),
      jamFactor: v.number(), // 0-10 scale from HERE
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const route = await ctx.db.get(args.routeId);
    if (!route || route.userId !== identity.subject || !route.polyline) {
      return [];
    }

    // Query traffic events along route
    const gridCells = getIntersectingGridCells(
      route.fromLocation.lat,
      route.fromLocation.lng,
      10
    );

    const trafficEvents = await Promise.all(
      gridCells.map((cell) =>
        ctx.db
          .query("events")
          .withIndex("by_grid_ttl", (q) =>
            q.eq("gridCell", cell).gt("ttl", Date.now())
          )
          .filter((q) => q.eq(q.field("type"), "traffic"))
          .collect()
      )
    ).then((arrays) => arrays.flat());

    // Split polyline into 100m segments and assign traffic level
    const segments = [];
    const polyline = route.polyline;

    for (let i = 0; i < polyline.length - 1; i++) {
      const start = polyline[i];
      const end = polyline[i + 1];

      // Find nearest traffic event
      let maxJamFactor = 0;
      for (const event of trafficEvents) {
        if (event.rawData?.jamFactor !== undefined) {
          const distance = Math.min(
            haversineDistance(start.lat, start.lng, event.location.lat, event.location.lng),
            haversineDistance(end.lat, end.lng, event.location.lat, event.location.lng)
          );

          if (distance < 0.5) {
            maxJamFactor = Math.max(maxJamFactor, event.rawData.jamFactor);
          }
        }
      }

      // Map jam factor to congestion level
      const congestion =
        maxJamFactor >= 8
          ? "jam"
          : maxJamFactor >= 5
          ? "slow"
          : maxJamFactor >= 3
          ? "moderate"
          : "free_flow";

      segments.push({
        coordinates: [start, end],
        congestion,
        jamFactor: maxJamFactor,
      });
    }

    // Merge adjacent segments with same congestion level
    const merged = [];
    let current = segments[0];

    for (let i = 1; i < segments.length; i++) {
      if (segments[i].congestion === current.congestion) {
        current.coordinates.push(segments[i].coordinates[1]);
      } else {
        merged.push(current);
        current = segments[i];
      }
    }
    merged.push(current);

    return merged;
  },
});
```

### React Native Traffic Polyline Component

**File:** `/apps/native/components/map/traffic-colored-route.tsx`

```typescript
import { Fragment } from 'react';
import { Polyline } from 'react-native-maps';
import { colors } from '@/lib/design-tokens';

type TrafficSegment = {
  coordinates: { lat: number; lng: number }[];
  congestion: 'free_flow' | 'moderate' | 'slow' | 'jam';
  jamFactor: number;
};

type Props = {
  segments: TrafficSegment[];
  isSelected: boolean;
};

export function TrafficColoredRoute({ segments, isSelected }: Props) {
  const getSegmentColor = (congestion: TrafficSegment['congestion']) => {
    switch (congestion) {
      case 'free_flow':
        return colors.risk.low.primary; // Green
      case 'moderate':
        return colors.state.warning; // Yellow
      case 'slow':
        return '#FF8C00'; // Orange
      case 'jam':
        return colors.risk.high.primary; // Red
      default:
        return colors.slate[400];
    }
  };

  return (
    <>
      {segments.map((segment, index) => (
        <Polyline
          key={`segment-${index}`}
          coordinates={segment.coordinates.map((coord) => ({
            latitude: coord.lat,
            longitude: coord.lng,
          }))}
          strokeColor={getSegmentColor(segment.congestion)}
          strokeWidth={isSelected ? 6 : 4}
          lineCap="round"
          lineJoin="round"
          zIndex={isSelected ? 100 : 50}
        />
      ))}
    </>
  );
}
```

### Update RoutePolylineGroup

Replace the single polyline with:

```typescript
import { TrafficColoredRoute } from './traffic-colored-route';

// Inside component:
const trafficSegments = useQuery(api.routes.getRouteTrafficSegments, {
  routeId: route._id,
});

return (
  <Fragment>
    {trafficSegments && trafficSegments.length > 0 ? (
      <TrafficColoredRoute
        segments={trafficSegments}
        isSelected={isSelected}
      />
    ) : (
      <Polyline
        coordinates={coordinates}
        strokeColor={isSelected ? colors.brand.primary : colors.slate[400]}
        strokeWidth={isSelected ? 6 : 4}
        lineCap="round"
        lineJoin="round"
        zIndex={isSelected ? 100 : 50}
      />
    )}
    {/* ... markers */}
  </Fragment>
);
```

---

## Dark Mode Map Styling

### iOS (Apple Maps) Dark Mode

react-native-maps automatically follows system dark mode on iOS 13+. No code needed!

### Android (Google Maps) Dark Mode

**File:** `/apps/native/assets/map-styles/dark.json`

```json
[
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8ec3b9" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1a3646" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#38414e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#212a37" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#746855" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#0e1626" }]
  }
]
```

### Apply to MapView

```typescript
import { useColorScheme } from 'react-native';
import mapStyleDark from '@/assets/map-styles/dark.json';

// Inside MapScreen:
const colorScheme = useColorScheme();

<MapView
  ref={mapRef}
  style={styles.map}
  provider={PROVIDER_DEFAULT}
  customMapStyle={Platform.OS === 'android' && colorScheme === 'dark' ? mapStyleDark : undefined}
  // ... other props
/>
```

---

## Alternative: Google Directions API

If you want to use Google instead of HERE:

### Backend

```typescript
"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

export const getGoogleRoute = action({
  args: {
    origin: v.object({ lat: v.number(), lng: v.number() }),
    destination: v.object({ lat: v.number(), lng: v.number() }),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY not configured");

    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", `${args.origin.lat},${args.origin.lng}`);
    url.searchParams.set("destination", `${args.destination.lat},${args.destination.lng}`);
    url.searchParams.set("departure_time", "now"); // Traffic-aware
    url.searchParams.set("alternatives", "true"); // Get 3 routes
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google Directions error: ${data.status}`);
    }

    return data.routes.map((route: any) => ({
      polyline: decodeGooglePolyline(route.overview_polyline.points),
      distance: route.legs[0].distance.value,
      duration: route.legs[0].duration.value,
      durationInTraffic: route.legs[0].duration_in_traffic?.value,
    }));
  },
});

// Google polyline decoder (different from HERE)
function decodeGooglePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}
```

**Pros:**
- Very accurate worldwide
- Excellent traffic data
- Places Autocomplete for search

**Cons:**
- More expensive ($5-$10 per 1000 requests)
- Separate API keys for routing + search
- Rate limits

---

## Alternative: Mapbox Directions

### Backend

```typescript
"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

export const getMapboxRoute = action({
  args: {
    origin: v.object({ lat: v.number(), lng: v.number() }),
    destination: v.object({ lat: v.number(), lng: v.number() }),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.MAPBOX_ACCESS_TOKEN;
    if (!apiKey) throw new Error("MAPBOX_ACCESS_TOKEN not configured");

    const coords = `${args.origin.lng},${args.origin.lat};${args.destination.lng},${args.destination.lat}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}`;

    const response = await fetch(
      `${url}?alternatives=true&geometries=geojson&access_token=${apiKey}`
    );
    const data = await response.json();

    if (data.code !== "Ok") {
      throw new Error(`Mapbox Directions error: ${data.code}`);
    }

    return data.routes.map((route: any) => ({
      polyline: route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
        lat,
        lng,
      })),
      distance: route.distance,
      duration: route.duration,
      typicalDuration: route.duration_typical,
    }));
  },
});
```

**Pros:**
- Free tier: 100,000 requests/month
- Beautiful maps
- GeoJSON format (no decoding needed)

**Cons:**
- Not as accurate as Google in some regions
- Less detailed traffic data than HERE/Google

---

## Testing Checklist

- [ ] Create new route - polyline loads within 2 seconds
- [ ] Route follows roads instead of straight line
- [ ] Selected route shows 2 alternative routes (dashed)
- [ ] Weather waypoints appear every 50km with temperature
- [ ] Route colors match traffic congestion
- [ ] Dark mode map style applies correctly
- [ ] Address search returns Argentina locations accurately
- [ ] Search autocomplete is fast (<500ms)
- [ ] Route refreshes daily via cron job

---

## Performance Optimization

### 1. Polyline Simplification

For routes with 1000+ points:

```typescript
import { simplifyPolyline } from '@/lib/polyline-decoder';

// Before rendering:
const simplifiedPolyline = simplifyPolyline(route.polyline, 0.0001); // 100m tolerance
```

### 2. Debounce Map Re-renders

```typescript
const [shouldRenderPolylines, setShouldRenderPolylines] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setShouldRenderPolylines(true), 500);
  return () => clearTimeout(timer);
}, []);

{shouldRenderPolylines && <RoutePolylineGroup ... />}
```

### 3. Cache Weather Waypoints

Add to schema:

```typescript
routeWeatherCache: v.optional(
  v.object({
    waypoints: v.array(/* ... */),
    fetchedAt: v.number(),
  })
),
```

---

## Cost Estimation (HERE APIs)

**Routing API:**
- Free: 250,000 transactions/month
- $1.00 per 1,000 after free tier
- Your usage: ~100 routes/day × 30 = 3,000/month = FREE

**Autosuggest API:**
- Free: 50,000 requests/month
- $1.00 per 1,000 after free tier
- Your usage: ~500 searches/day × 30 = 15,000/month = FREE

**Total monthly cost:** $0

---

## Next Steps

1. **Deploy routing backend:**
   ```bash
   npx convex deploy
   ```

2. **Test route creation:**
   - Create route in app
   - Watch Convex dashboard for routing API calls
   - Verify polyline appears on map

3. **Add search:**
   - Implement HERE Autosuggest
   - Replace Nominatim in map search bar
   - Test Argentina addresses

4. **Add weather waypoints:**
   - Implement backend query
   - Add markers to map
   - Style temperature bubbles

5. **Add traffic coloring:**
   - Implement traffic segments query
   - Replace solid polyline with colored segments
   - Test with live traffic data

6. **Test dark mode:**
   - Add map style JSON
   - Test on iOS and Android
   - Verify polylines are visible

---

## Support & Resources

**HERE Developer Portal:**
- https://developer.here.com/
- Documentation, pricing, API explorer

**Expo Maps:**
- https://docs.expo.dev/versions/latest/sdk/map-view/
- Polyline, Marker, Circle APIs

**React Native Maps:**
- https://github.com/react-native-maps/react-native-maps
- Advanced styling, clustering

**Testing:**
- Use Expo Go for fast iteration
- Test on real devices for performance
- Monitor Convex logs for API errors

---

## Troubleshooting

**Polylines not appearing:**
- Check Convex logs for routing API errors
- Verify HERE_API_KEY is set in backend env
- Check route.polyline exists in database

**Search not working:**
- Verify user location permission granted
- Check search results in console
- Test with longer queries (3+ chars)

**Map performance:**
- Simplify polylines if >500 points
- Use tracksViewChanges={false} on markers
- Debounce re-renders on zoom/pan

**Traffic colors not updating:**
- Check traffic events exist in database
- Verify cron job is running
- Test with known congested routes
