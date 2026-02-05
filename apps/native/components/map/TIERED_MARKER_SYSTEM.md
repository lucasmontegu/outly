# Tiered Marker System Implementation

## Overview

The map now implements a 3-tier marker hierarchy system to reduce visual clutter and highlight important events:

- **TIER 1**: Events on your active route (highest priority)
- **TIER 2**: Events nearby (< 2km from your location)
- **TIER 3**: Events far away (>= 2km from your location)

## Visual Specifications

### TIER 1 (On Route)
- Size: 44px diameter
- Opacity: 100%
- Border: 2px white
- Animation: Pulse effect (scale 1.0 → 1.15 → 1.0, 800ms loop)
- Icon size: 20px
- Always visible

### TIER 2 (Nearby)
- Size: 32px diameter
- Opacity: 80%
- Border: 1px white
- Animation: None
- Icon size: 16px

### TIER 3 (Far)
- Size: 24px diameter
- Opacity: 60%
- Border: 1px white
- Animation: None
- Icon size: 12px

## Components

### TieredEventMarker (`components/map/tiered-event-marker.tsx`)

Replaces the old `EventMarker` component with tier support.

**Props:**
```typescript
{
  event: EventType;
  tier: 1 | 2 | 3;
  isSelected: boolean;
  onPress: () => void;
}
```

**Features:**
- Automatic size/opacity based on tier
- Pulse animation for TIER 1 only
- Severity-based background colors
- White icon with tier-appropriate sizing
- Performance optimized with `memo` and `tracksViewChanges={false}`

### ClusterMarker (`components/map/cluster-marker.tsx`)

Ready for future clustering implementation.

**Props:**
```typescript
{
  coordinate: { latitude: number; longitude: number };
  count: number;
  onPress: () => void;
}
```

**Visual:**
- 36px diameter circular badge
- Brand secondary color background
- White text showing count (99+ for large clusters)
- 1px white border

## Tier Calculation Logic

Located in `map.tsx`:

```typescript
function calculateEventTier(
  event: EventType,
  userLocation: { lat: number; lng: number } | null,
  activeRoutes: UserRoute[]
): 1 | 2 | 3 {
  // TIER 1: On any active route (within 1.5km of route line)
  for (const route of activeRoutes) {
    if (isPointNearRoute(event.location, route.fromLocation, route.toLocation, 1.5)) {
      return 1;
    }
  }

  // TIER 2: Nearby (< 2km from user)
  const distance = calculateDistance(userLocation, event.location);
  if (distance < 2) {
    return 2;
  }

  // TIER 3: Far (>= 2km)
  return 3;
}
```

## Performance Optimizations

1. **Memoized tier calculation**: `useMemo` recalculates only when events, location, or routes change
2. **Map-based tier storage**: O(1) lookup for each event's tier
3. **Marker optimization**: `tracksViewChanges={false}` prevents unnecessary re-renders
4. **Component memoization**: `memo` wrapper prevents re-renders on unchanged props

## Integration

### In map.tsx:

```typescript
// Calculate tiers for all events
const eventTiers = useMemo(() => {
  if (!events || !location) return new Map<Id<"events">, 1 | 2 | 3>();

  const tierMap = new Map<Id<"events">, 1 | 2 | 3>();
  events.forEach((event) => {
    const tier = calculateEventTier(event, location, activeRoutes);
    tierMap.set(event._id, tier);
  });
  return tierMap;
}, [events, location, activeRoutes]);

// Render markers with tiers
{events?.map((event) => {
  const tier = eventTiers.get(event._id) || 3;
  return (
    <TieredEventMarker
      key={event._id}
      event={event}
      tier={tier}
      isSelected={selectedEventId === event._id}
      onPress={() => handleMarkerPress(event._id)}
    />
  );
})}
```

## Color System

Background colors based on event type and severity:

**Weather events:**
- Severity >= 4: `colors.risk.high.primary` (Coral Red)
- Severity >= 3: `colors.risk.medium.primary` (Warm Amber)
- Severity < 3: `colors.state.info` (Blue)

**Traffic events:**
- Severity >= 4: `colors.risk.high.primary` (Coral Red)
- Severity >= 3: `colors.risk.medium.primary` (Warm Amber)
- Severity < 3: `colors.state.warning` (Yellow/Orange)

## Future Enhancements

### Phase 2: Clustering for TIER 3
- Group TIER 3 events within 500m radius
- Replace individual markers with ClusterMarker showing count
- Tap cluster to zoom in and reveal individual markers

### Phase 3: Smart Filtering
- Auto-hide TIER 3 markers when zoom level < threshold
- Show cluster count in map controls
- Filter toggle: "Show all" vs "Route only"

## Dependencies

- `react-native-reanimated`: Pulse animation
- `@/lib/geo-utils`: Distance and route proximity calculations
- `@/lib/design-tokens`: Colors, spacing, typography
- `react-native-maps`: Map and marker components
