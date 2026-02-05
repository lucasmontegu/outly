# Map Screen Implementation Guide

## Quick Reference

This document provides ready-to-use code snippets and visual specifications for implementing the UX research recommendations.

---

## 1. Route Polyline Visualization

### Component Structure

```typescript
// apps/native/app/(tabs)/map.tsx

import { Fragment } from 'react';
import { Polyline, Marker } from 'react-native-maps';

// Add state for route selection
const [selectedRouteId, setSelectedRouteId] = useState<Id<"routes"> | null>(null);

// Query user routes
const userRoutes = useQuery(
  api.routes.getUserRoutes,
  isScreenFocused ? {} : "skip"
);

// Filter to routes monitored today
const activeRoutes = useMemo(() => {
  if (!userRoutes) return [];
  const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  return userRoutes.filter(route =>
    route.isActive &&
    route.monitorDays[today]
  );
}, [userRoutes]);

// In MapView JSX
{activeRoutes.map((route) => {
  const isSelected = selectedRouteId === route._id;

  return (
    <RoutePolylineGroup
      key={route._id}
      route={route}
      isSelected={isSelected}
      onPress={() => setSelectedRouteId(isSelected ? null : route._id)}
    />
  );
})}
```

### RoutePolylineGroup Component

```typescript
// apps/native/components/map/route-polyline-group.tsx

import { Fragment } from 'react';
import { View, StyleSheet } from 'react-native';
import { Polyline, Marker } from 'react-native-maps';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Home01Icon, Building01Icon, Location01Icon } from '@hugeicons/core-free-icons';
import type { Id } from '@outia/backend/convex/_generated/dataModel';
import { colors, borderRadius } from '@/lib/design-tokens';

type Route = {
  _id: Id<"routes">;
  name: string;
  fromName: string;
  toName: string;
  fromLocation: { lat: number; lng: number };
  toLocation: { lat: number; lng: number };
  icon: "building" | "running" | "home";
};

type Props = {
  route: Route;
  isSelected: boolean;
  onPress: () => void;
};

export function RoutePolylineGroup({ route, isSelected, onPress }: Props) {
  // Determine route icon
  const getRouteIcon = (iconType: Route['icon']) => {
    switch (iconType) {
      case 'home': return Home01Icon;
      case 'building': return Building01Icon;
      default: return Location01Icon;
    }
  };

  const RouteIcon = getRouteIcon(route.icon);

  return (
    <Fragment>
      {/* Route polyline */}
      <Polyline
        coordinates={[
          {
            latitude: route.fromLocation.lat,
            longitude: route.fromLocation.lng,
          },
          {
            latitude: route.toLocation.lat,
            longitude: route.toLocation.lng,
          },
        ]}
        strokeColor={isSelected ? colors.brand.primary : colors.slate[400]}
        strokeWidth={isSelected ? 8 : 4}
        lineCap="round"
        lineJoin="round"
        tappable
        onPress={onPress}
        zIndex={isSelected ? 100 : 50}
      />

      {/* Start marker (from location) */}
      <Marker
        coordinate={{
          latitude: route.fromLocation.lat,
          longitude: route.fromLocation.lng,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={false} // Performance optimization
      >
        <View
          style={[
            styles.routeMarker,
            isSelected && styles.routeMarkerSelected,
          ]}
        >
          <HugeiconsIcon
            icon={RouteIcon}
            size={isSelected ? 18 : 14}
            color={isSelected ? colors.brand.primary : colors.slate[500]}
          />
        </View>
      </Marker>

      {/* End marker (to location) */}
      <Marker
        coordinate={{
          latitude: route.toLocation.lat,
          longitude: route.toLocation.lng,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={false}
      >
        <View
          style={[
            styles.routeMarker,
            styles.routeMarkerEnd,
            isSelected && styles.routeMarkerSelected,
          ]}
        >
          <View
            style={[
              styles.routeMarkerPin,
              { backgroundColor: isSelected ? colors.brand.primary : colors.slate[500] }
            ]}
          />
        </View>
      </Marker>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  routeMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.slate[300],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  routeMarkerSelected: {
    borderColor: colors.brand.primary,
    transform: [{ scale: 1.15 }],
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  routeMarkerEnd: {
    // End marker is a pin instead of icon
  },
  routeMarkerPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
```

### Visual Specifications

| State | Stroke Width | Color | Opacity | Z-Index |
|-------|-------------|-------|---------|---------|
| **Default** | 4dp | slate-400 (#94A3B8) | 50% | 50 |
| **Selected** | 8dp | brand-primary (#8B5CF6) | 90% | 100 |
| **Hover** (web) | 6dp | slate-500 (#64748B) | 70% | 75 |

---

## 2. Smart Event Filtering

### Filtering Logic

```typescript
// apps/native/lib/map-filters.ts

import type { Id } from '@outia/backend/convex/_generated/dataModel';

export type MapFilterMode = 'focus' | 'all' | 'route';

type Event = {
  _id: Id<"events">;
  type: 'weather' | 'traffic';
  subtype: string;
  location: { lat: number; lng: number };
  severity: number;
  confidenceScore: number;
  routePoints?: { lat: number; lng: number }[];
};

type Route = {
  _id: Id<"routes">;
  fromLocation: { lat: number; lng: number };
  toLocation: { lat: number; lng: number };
};

type FilterOptions = {
  mode: MapFilterMode;
  userLocation: { lat: number; lng: number };
  selectedRoute?: Route;
  allRoutes: Route[];
  maxMarkers?: number;
};

export function filterEvents(
  events: Event[],
  options: FilterOptions
): Event[] {
  const {
    mode,
    userLocation,
    selectedRoute,
    allRoutes,
    maxMarkers = 25,
  } = options;

  // Mode: Show all (power user)
  if (mode === 'all') {
    return events.slice(0, maxMarkers);
  }

  // Mode: Route-specific
  if (mode === 'route' && selectedRoute) {
    return events.filter(event =>
      isEventNearRoute(event, selectedRoute, 0.5) // 500m buffer
    );
  }

  // Mode: Focus (smart filtering)
  // Priority 1: Events on any saved route
  const routeRelevantEvents = events.filter(event =>
    allRoutes.some(route => isEventNearRoute(event, route, 0.5))
  );

  // Priority 2: Critical events nearby (severity 4-5, within 2km)
  const criticalNearbyEvents = events.filter(event => {
    if (routeRelevantEvents.find(e => e._id === event._id)) {
      return false; // Already included in P1
    }
    return (
      event.severity >= 4 &&
      haversineDistance(
        userLocation.lat,
        userLocation.lng,
        event.location.lat,
        event.location.lng
      ) <= 2
    );
  });

  // Priority 3: Moderate events nearby (severity 3, within 1km)
  const moderateNearbyEvents = events.filter(event => {
    if (
      routeRelevantEvents.find(e => e._id === event._id) ||
      criticalNearbyEvents.find(e => e._id === event._id)
    ) {
      return false; // Already included
    }
    return (
      event.severity >= 3 &&
      haversineDistance(
        userLocation.lat,
        userLocation.lng,
        event.location.lat,
        event.location.lng
      ) <= 1
    );
  });

  // Combine and limit
  const filtered = [
    ...routeRelevantEvents,
    ...criticalNearbyEvents,
    ...moderateNearbyEvents,
  ];

  return filtered.slice(0, maxMarkers);
}

// Helper: Check if event is near a route
function isEventNearRoute(
  event: Event,
  route: Route,
  bufferKm: number
): boolean {
  // Calculate perpendicular distance from point to line segment
  const distance = pointToLineSegmentDistance(
    event.location,
    route.fromLocation,
    route.toLocation
  );
  return distance <= bufferKm;
}

// Helper: Point-to-line-segment distance
function pointToLineSegmentDistance(
  point: { lat: number; lng: number },
  lineStart: { lat: number; lng: number },
  lineEnd: { lat: number; lng: number }
): number {
  // Convert to Cartesian for simpler math (approximation for short distances)
  const px = point.lng;
  const py = point.lat;
  const x1 = lineStart.lng;
  const y1 = lineStart.lat;
  const x2 = lineEnd.lng;
  const y2 = lineEnd.lat;

  // Vector from line start to point
  const dx = x2 - x1;
  const dy = y2 - y1;

  // If line segment is a point, return distance to that point
  if (dx === 0 && dy === 0) {
    return haversineDistance(point.lat, point.lng, lineStart.lat, lineStart.lng);
  }

  // Calculate parameter t for projection onto line
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));

  // Find closest point on line segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  // Return distance from point to closest point
  return haversineDistance(point.lat, point.lng, closestY, closestX);
}

// Helper: Haversine distance
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
```

### Filter Control UI

```typescript
// apps/native/components/map/filter-control.tsx

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Target01Icon, ViewIcon, Route01Icon } from '@hugeicons/core-free-icons';
import type { MapFilterMode } from '@/lib/map-filters';
import { colors, spacing, borderRadius, typography } from '@/lib/design-tokens';

type Props = {
  mode: MapFilterMode;
  onModeChange: (mode: MapFilterMode) => void;
  eventCounts: {
    focus: number;
    all: number;
    route?: number;
  };
  hasRouteSelected: boolean;
};

export function MapFilterControl({
  mode,
  onModeChange,
  eventCounts,
  hasRouteSelected,
}: Props) {
  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="light" style={styles.blur}>
        <View style={styles.inner}>
          {/* Focus mode */}
          <TouchableOpacity
            style={[styles.button, mode === 'focus' && styles.buttonActive]}
            onPress={() => onModeChange('focus')}
            accessibilityRole="button"
            accessibilityLabel="Focus mode"
            accessibilityState={{ selected: mode === 'focus' }}
          >
            <HugeiconsIcon
              icon={Target01Icon}
              size={16}
              color={mode === 'focus' ? colors.brand.primary : colors.text.secondary}
            />
            <Text style={[styles.buttonText, mode === 'focus' && styles.buttonTextActive]}>
              Focus
            </Text>
            <View style={[styles.badge, mode === 'focus' && styles.badgeActive]}>
              <Text style={[styles.badgeText, mode === 'focus' && styles.badgeTextActive]}>
                {eventCounts.focus}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Route mode (only if route selected) */}
          {hasRouteSelected && (
            <TouchableOpacity
              style={[styles.button, mode === 'route' && styles.buttonActive]}
              onPress={() => onModeChange('route')}
              accessibilityRole="button"
              accessibilityLabel="Route mode"
              accessibilityState={{ selected: mode === 'route' }}
            >
              <HugeiconsIcon
                icon={Route01Icon}
                size={16}
                color={mode === 'route' ? colors.brand.primary : colors.text.secondary}
              />
              <Text style={[styles.buttonText, mode === 'route' && styles.buttonTextActive]}>
                Route
              </Text>
              <View style={[styles.badge, mode === 'route' && styles.badgeActive]}>
                <Text style={[styles.badgeText, mode === 'route' && styles.badgeTextActive]}>
                  {eventCounts.route ?? 0}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* All mode */}
          <TouchableOpacity
            style={[styles.button, mode === 'all' && styles.buttonActive]}
            onPress={() => onModeChange('all')}
            accessibilityRole="button"
            accessibilityLabel="Show all mode"
            accessibilityState={{ selected: mode === 'all' }}
          >
            <HugeiconsIcon
              icon={ViewIcon}
              size={16}
              color={mode === 'all' ? colors.brand.primary : colors.text.secondary}
            />
            <Text style={[styles.buttonText, mode === 'all' && styles.buttonTextActive]}>
              All
            </Text>
            <View style={[styles.badge, mode === 'all' && styles.badgeActive]}>
              <Text style={[styles.badgeText, mode === 'all' && styles.badgeTextActive]}>
                {eventCounts.all}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  blur: {
    borderRadius: borderRadius.full,
  },
  inner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    gap: spacing[2],
    backgroundColor: 'transparent',
  },
  buttonActive: {
    backgroundColor: `${colors.brand.primary}15`,
  },
  buttonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
  buttonTextActive: {
    color: colors.brand.primary,
    fontWeight: typography.weight.semibold,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.slate[200],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeActive: {
    backgroundColor: colors.brand.primary,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  badgeTextActive: {
    color: colors.text.inverse,
  },
});
```

### Integration in Map Screen

```typescript
// In map.tsx

import { filterEvents, MapFilterMode } from '@/lib/map-filters';
import { MapFilterControl } from '@/components/map/filter-control';

// Add state
const [filterMode, setFilterMode] = useState<MapFilterMode>('focus');

// Apply filtering
const filteredEvents = useMemo(() => {
  if (!events || !location) return [];

  return filterEvents(events, {
    mode: filterMode,
    userLocation: location,
    selectedRoute: selectedRouteId
      ? activeRoutes.find(r => r._id === selectedRouteId)
      : undefined,
    allRoutes: activeRoutes,
    maxMarkers: 25,
  });
}, [events, location, filterMode, selectedRouteId, activeRoutes]);

// In JSX (below search bar)
<View style={styles.filterControlWrapper}>
  <MapFilterControl
    mode={filterMode}
    onModeChange={setFilterMode}
    eventCounts={{
      focus: filterEvents(events, { mode: 'focus', ... }).length,
      all: events?.length ?? 0,
      route: selectedRouteId
        ? filterEvents(events, { mode: 'route', ... }).length
        : undefined,
    }}
    hasRouteSelected={!!selectedRouteId}
  />
</View>

// Update marker rendering to use filteredEvents
{filteredEvents.map((event) => (
  <EventMarker key={event._id} event={event} ... />
))}
```

---

## 3. Marker Callout Preview

### Backend Query for Vote Summary

```typescript
// packages/backend/convex/confirmations.ts

export const getVoteSummary = query({
  args: { eventId: v.id("events") },
  returns: v.object({
    total: v.number(),
    stillActive: v.number(),
    cleared: v.number(),
    notExists: v.number(),
    topVote: v.union(
      v.literal("still_active"),
      v.literal("cleared"),
      v.literal("not_exists")
    ),
    percentage: v.number(),
  }),
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("confirmations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const counts = {
      stillActive: votes.filter(v => v.vote === "still_active").length,
      cleared: votes.filter(v => v.vote === "cleared").length,
      notExists: votes.filter(v => v.vote === "not_exists").length,
    };

    const total = votes.length;
    const topVote = Object.entries(counts).sort(([,a], [,b]) => b - a)[0][0] as
      "stillActive" | "cleared" | "notExists";

    const topCount = counts[topVote];
    const percentage = total > 0 ? Math.round((topCount / total) * 100) : 0;

    return {
      total,
      stillActive: counts.stillActive,
      cleared: counts.cleared,
      notExists: counts.notExists,
      topVote: topVote === "stillActive" ? "still_active" :
               topVote === "cleared" ? "cleared" : "not_exists",
      percentage,
    };
  },
});
```

### Callout Component

```typescript
// apps/native/components/map/event-callout.tsx

import { View, Text, StyleSheet } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  CheckmarkCircle02Icon,
  Tick02Icon,
  Cancel01Icon,
  CloudIcon,
  Car01Icon,
} from '@hugeicons/core-free-icons';
import type { Id } from '@outia/backend/convex/_generated/dataModel';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/design-tokens';

type Event = {
  _id: Id<"events">;
  type: 'weather' | 'traffic';
  subtype: string;
  severity: number;
  _creationTime: number;
};

type VoteSummary = {
  total: number;
  topVote: 'still_active' | 'cleared' | 'not_exists';
  percentage: number;
};

type Props = {
  event: Event;
  votes?: VoteSummary;
};

export function EventCallout({ event, votes }: Props) {
  const timeAgo = formatTimeAgo(event._creationTime);
  const severityColor = getSeverityColor(event.severity);
  const EventIcon = event.type === 'weather' ? CloudIcon : Car01Icon;

  const getVoteIcon = (voteType: string) => {
    switch (voteType) {
      case 'still_active': return CheckmarkCircle02Icon;
      case 'cleared': return Tick02Icon;
      case 'not_exists': return Cancel01Icon;
      default: return CheckmarkCircle02Icon;
    }
  };

  const getVoteLabel = (voteType: string) => {
    switch (voteType) {
      case 'still_active': return 'Still happening';
      case 'cleared': return 'Cleared';
      case 'not_exists': return 'Not here';
      default: return voteType;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with icon and title */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${severityColor}15` }]}>
          <HugeiconsIcon icon={EventIcon} size={20} color={severityColor} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>
            {formatSubtype(event.subtype)}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>{timeAgo}</Text>
            {votes && votes.total > 0 && (
              <>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={styles.metaText}>{votes.total} reports</Text>
              </>
            )}
          </View>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
          <Text style={styles.severityText}>{event.severity}</Text>
        </View>
      </View>

      {/* Consensus (if enough votes) */}
      {votes && votes.total >= 3 && (
        <View style={styles.consensus}>
          <HugeiconsIcon
            icon={getVoteIcon(votes.topVote)}
            size={14}
            color={colors.text.secondary}
          />
          <Text style={styles.consensusText}>
            {votes.percentage}% say {getVoteLabel(votes.topVote).toLowerCase()}
          </Text>
        </View>
      )}

      {/* Tap hint */}
      <Text style={styles.hint}>Tap for details</Text>
    </View>
  );
}

function formatTimeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatSubtype(subtype: string): string {
  return subtype
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getSeverityColor(severity: number): string {
  if (severity >= 4) return colors.risk.high.primary;
  if (severity >= 3) return colors.risk.medium.primary;
  return colors.state.info;
}

const styles = StyleSheet.create({
  container: {
    width: 240,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  metaText: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
  metaSeparator: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  severityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  consensus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.slate[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
  },
  consensusText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
  hint: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
```

### Integration with EventMarker

```typescript
// Update EventMarker component

import { Callout } from 'react-native-maps';
import { EventCallout } from '@/components/map/event-callout';

function EventMarker({
  event,
  isSelected,
  showCallout,
  onPress
}: {
  event: EventType;
  isSelected: boolean;
  showCallout: boolean;
  onPress: () => void;
}) {
  const votes = useQuery(
    api.confirmations.getVoteSummary,
    showCallout ? { eventId: event._id } : "skip"
  );

  return (
    <Marker
      coordinate={{
        latitude: event.location.lat,
        longitude: event.location.lng,
      }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={[
        styles.customMarker,
        { backgroundColor: getMarkerColor(event.type, event.severity) },
        isSelected && styles.customMarkerSelected,
      ]}>
        <HugeiconsIcon icon={getEventIcon(event.type)} size={16} color="#FFFFFF" />
      </View>

      {showCallout && (
        <Callout tooltip onPress={onPress}>
          <EventCallout event={event} votes={votes} />
        </Callout>
      )}
    </Marker>
  );
}

// In map.tsx, update marker press handling

const [calloutEventId, setCalloutEventId] = useState<Id<"events"> | null>(null);

const handleMarkerPress = (eventId: Id<"events">) => {
  if (calloutEventId === eventId) {
    // Double tap - open full bottom sheet
    setSelectedEventId(eventId);
    setCalloutEventId(null);
  } else {
    // Single tap - show callout
    setCalloutEventId(eventId);
    lightHaptic();
  }
};

// Pass showCallout to EventMarker
<EventMarker
  event={event}
  isSelected={selectedEventId === event._id}
  showCallout={calloutEventId === event._id}
  onPress={() => handleMarkerPress(event._id)}
/>
```

---

## 4. Styling Constants

### Map-Specific Design Tokens

```typescript
// apps/native/lib/map-constants.ts

import { colors } from './design-tokens';

export const MAP_CONSTANTS = {
  // Route visualization
  route: {
    default: {
      strokeWidth: 4,
      strokeColor: colors.slate[400],
      opacity: 0.5,
      zIndex: 50,
    },
    selected: {
      strokeWidth: 8,
      strokeColor: colors.brand.primary,
      opacity: 0.9,
      zIndex: 100,
    },
    marker: {
      size: 32,
      selectedSize: 36,
      borderWidth: 2,
    },
  },

  // Event markers
  marker: {
    sizes: {
      small: 28,  // Low severity
      medium: 36, // Moderate severity
      large: 42,  // Critical severity
    },
    colors: {
      critical: colors.risk.high.primary,
      high: colors.risk.high.primary,
      medium: colors.risk.medium.primary,
      low: colors.state.info,
    },
    selectedScale: 1.3,
  },

  // Event circles (weather)
  circle: {
    weather: {
      radius: 1000, // 1km
      fillOpacity: 0.15,
      strokeOpacity: 0.6,
      strokeWidth: 2,
    },
    traffic: {
      radius: 500, // 500m
      fillOpacity: 0.15,
      strokeOpacity: 0.6,
      strokeWidth: 2,
    },
  },

  // Filtering thresholds
  filtering: {
    routeBufferKm: 0.5,
    criticalRadiusKm: 2,
    moderateRadiusKm: 1,
    maxMarkersDefault: 25,
    minConfidenceScore: 20,
  },

  // Map view defaults
  view: {
    defaultZoom: {
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    },
    focusedZoom: {
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    },
    animationDuration: 500,
  },
};
```

---

## 5. Performance Optimizations

### Memoization Strategy

```typescript
// In map.tsx

import React, { memo, useMemo, useCallback } from 'react';

// Memoize EventMarker to prevent unnecessary re-renders
export const EventMarker = memo(function EventMarker(props: EventMarkerProps) {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.event._id === nextProps.event._id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.showCallout === nextProps.showCallout
  );
});

// Memoize RoutePolylineGroup
export const RoutePolylineGroup = memo(function RoutePolylineGroup(props: RouteProps) {
  // Component implementation
}, (prevProps, nextProps) => {
  return (
    prevProps.route._id === nextProps.route._id &&
    prevProps.isSelected === nextProps.isSelected
  );
});

// Memoize expensive calculations
const filteredEvents = useMemo(() => {
  return filterEvents(events, filterOptions);
}, [events, filterMode, selectedRouteId, activeRoutes]);

// Use useCallback for event handlers
const handleMarkerPress = useCallback((eventId: Id<"events">) => {
  // Handler implementation
}, [calloutEventId]);
```

### Reduce MapView Re-renders

```typescript
// Separate map props into stable values
const mapInitialRegion = useMemo(() => ({
  latitude: location?.lat ?? 0,
  longitude: location?.lng ?? 0,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}), []); // Only compute once

<MapView
  ref={mapRef}
  style={styles.map}
  provider={PROVIDER_DEFAULT}
  initialRegion={mapInitialRegion}
  showsUserLocation
  showsMyLocationButton={false}
  onPress={handleMapPress}
  // Disable expensive features if not needed
  showsBuildings={false}
  showsIndoors={false}
  showsTraffic={false}
  // Reduce re-renders
  tracksViewChanges={false}
>
```

---

## 6. Accessibility Checklist

### WCAG AA Compliance

```typescript
// Add accessibility labels to all interactive elements

<Marker
  accessibilityLabel={`${event.subtype} incident, severity ${event.severity} out of 5`}
  accessibilityHint="Double tap to view details and vote on status"
  accessibilityRole="button"
/>

<Polyline
  accessible
  accessibilityLabel={`Route from ${route.fromName} to ${route.toName}`}
  accessibilityHint="Tap to highlight this route and see incidents along it"
  accessibilityRole="button"
/>

// Color contrast verification
const ensureContrast = (foreground: string, background: string) => {
  const contrastRatio = calculateContrast(foreground, background);
  if (contrastRatio < 4.5) {
    console.warn(`Low contrast: ${contrastRatio.toFixed(2)}:1`);
  }
};
```

### Screen Reader Support

```typescript
// Announce important state changes
import { AccessibilityInfo } from 'react-native';

useEffect(() => {
  if (filteredEvents.length > 0) {
    AccessibilityInfo.announceForAccessibility(
      `${filteredEvents.length} incidents found. ${
        filteredEvents.filter(e => e.severity >= 4).length
      } are critical.`
    );
  }
}, [filteredEvents]);
```

---

## 7. Testing Utilities

### Mock Data Generator

```typescript
// apps/native/__tests__/map-test-utils.ts

import type { Id } from '@outia/backend/convex/_generated/dataModel';

export function generateMockEvent(overrides?: Partial<Event>): Event {
  return {
    _id: `event_${Math.random()}` as Id<"events">,
    type: 'traffic',
    subtype: 'accident',
    location: { lat: 42.3601, lng: -71.0589 },
    severity: 3,
    confidenceScore: 75,
    source: 'here',
    _creationTime: Date.now() - 10 * 60 * 1000, // 10 min ago
    ttl: Date.now() + 2 * 60 * 60 * 1000, // 2 hours from now
    radius: 500,
    ...overrides,
  };
}

export function generateMockRoute(overrides?: Partial<Route>): Route {
  return {
    _id: `route_${Math.random()}` as Id<"routes">,
    name: 'Home to Work',
    fromName: 'Home',
    toName: 'Office',
    fromLocation: { lat: 42.3601, lng: -71.0589 },
    toLocation: { lat: 42.3656, lng: -71.0596 },
    icon: 'building',
    monitorDays: [false, true, true, true, true, true, false],
    alertThreshold: 50,
    alertTime: '08:00',
    isActive: true,
    _creationTime: Date.now(),
    userId: 'user_123',
    ...overrides,
  };
}

// Test scenarios
export const TEST_SCENARIOS = {
  lowDensity: {
    events: [
      generateMockEvent({ severity: 2 }),
      generateMockEvent({ severity: 1 }),
    ],
    routes: [generateMockRoute()],
  },
  highDensity: {
    events: Array.from({ length: 50 }, (_, i) =>
      generateMockEvent({
        location: {
          lat: 42.36 + (Math.random() - 0.5) * 0.05,
          lng: -71.06 + (Math.random() - 0.5) * 0.05,
        },
        severity: Math.floor(Math.random() * 5) + 1,
      })
    ),
    routes: Array.from({ length: 3 }, generateMockRoute),
  },
  criticalIncident: {
    events: [
      generateMockEvent({ severity: 5, subtype: 'major_accident' }),
    ],
    routes: [generateMockRoute()],
  },
};
```

---

## Quick Integration Checklist

- [ ] Add route polylines to map
- [ ] Implement smart event filtering
- [ ] Add filter control UI
- [ ] Create marker callout component
- [ ] Update marker press handling (single/double tap)
- [ ] Add route selector UI
- [ ] Adjust z-index for proper layering
- [ ] Memoize expensive components
- [ ] Add accessibility labels
- [ ] Test with mock data
- [ ] Verify performance with 50+ markers
- [ ] Test on iOS and Android devices
- [ ] Validate color contrast ratios

---

**Files to Create:**
1. `/apps/native/lib/map-filters.ts`
2. `/apps/native/lib/map-constants.ts`
3. `/apps/native/components/map/route-polyline-group.tsx`
4. `/apps/native/components/map/filter-control.tsx`
5. `/apps/native/components/map/event-callout.tsx`
6. `/apps/native/__tests__/map-test-utils.ts`

**Files to Modify:**
1. `/apps/native/app/(tabs)/map.tsx` (main integration)
2. `/packages/backend/convex/confirmations.ts` (add getVoteSummary query)

**Estimated Implementation Time:**
- Phase 1 (Routes + Filtering): 6-8 hours
- Phase 2 (Callouts + Selector): 4-6 hours
- Phase 3 (Polish + Testing): 3-4 hours
- **Total: 13-18 hours**
