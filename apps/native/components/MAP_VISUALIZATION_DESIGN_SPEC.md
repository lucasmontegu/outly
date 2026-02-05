# Map Visualization Design Specification
## Outia Risk Intelligence Map - Enhanced UX System

**Version:** 1.0
**Last Updated:** 2026-02-05
**Status:** Design Specification

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current Problems & Solutions](#current-problems--solutions)
3. [Visual Hierarchy System](#visual-hierarchy-system)
4. [Route Visualization](#route-visualization)
5. [Marker Clustering Strategy](#marker-clustering-strategy)
6. [Bottom Sheet Design](#bottom-sheet-design)
7. [Interaction Patterns](#interaction-patterns)
8. [Technical Implementation Guide](#technical-implementation-guide)
9. [Accessibility Considerations](#accessibility-considerations)

---

## Executive Summary

### Design Philosophy
The enhanced map visualization follows a **context-first** approach where information is layered by relevance to the user's routes and current location. This reduces cognitive load and helps users quickly identify risks that matter to them.

### Key Design Principles
1. **Relevance-Based Hierarchy** - Most relevant information is most prominent
2. **Progressive Disclosure** - Information revealed as needed, not all at once
3. **Visual Clarity** - Clear distinction between risk levels and proximity
4. **Contextual Awareness** - User's routes define what's important

---

## Current Problems & Solutions

| Problem | Impact | Solution |
|---------|--------|----------|
| 749+ uniform markers creating visual noise | Cognitive overload, can't identify important events | 3-tier visual hierarchy based on route relevance |
| No user route displayed | No context for decision-making | Prominent route visualization with risk-colored segments |
| Popovers don't work well on mobile | Poor touch interaction, occlusion issues | Bottom sheet with 3 states (collapsed/half/full) |
| All markers look identical | Can't distinguish high vs low priority | Size, color, opacity, and clustering based on relevance |

---

## Visual Hierarchy System

### Marker Hierarchy (3 Tiers)

#### Tier 1: ON-ROUTE Markers
**When:** Event is within 100m of user's route polyline

**Visual Specifications:**
```typescript
{
  size: 44,                           // Largest, easily tappable
  iconSize: 24,
  borderWidth: 3,
  borderColor: '#FFFFFF',
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 8,
  zIndex: 100,
  pulseAnimation: true,               // Subtle pulse for high severity (4-5)
}
```

**Color Coding by Severity:**
- **Severity 5:** `colors.risk.high.primary` (#E63946) - Coral Red
- **Severity 4:** `colors.risk.high.dark` (#C62634) - Deep Red
- **Severity 3:** `colors.risk.medium.primary` (#F4A261) - Warm Amber
- **Severity 2:** `colors.risk.medium.dark` (#E07B3C) - Dark Amber
- **Severity 1:** `colors.state.info` (#3B82F6) - Blue

**Pulse Animation (Severity 4-5):**
```typescript
// React Native Reanimated
const pulseScale = useSharedValue(1);

useEffect(() => {
  pulseScale.value = withRepeat(
    withSequence(
      withTiming(1.15, { duration: 800 }),
      withTiming(1, { duration: 800 })
    ),
    -1, // infinite
    false
  );
}, []);
```

#### Tier 2: NEAR-ROUTE Markers
**When:** Event is 100m - 1km from user's route

**Visual Specifications:**
```typescript
{
  size: 32,                           // Medium size
  iconSize: 18,
  borderWidth: 2,
  borderColor: '#FFFFFF',
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 4,
  zIndex: 50,
  opacity: 0.9,
}
```

**Color Coding:** Same as Tier 1, but with 90% opacity

#### Tier 3: DISTANT Markers
**When:** Event is >1km from user's route OR user has no active route

**Visual Specifications:**
```typescript
{
  size: 24,                           // Smallest
  iconSize: 14,
  borderWidth: 0,
  shadowOpacity: 0.15,
  shadowRadius: 4,
  elevation: 2,
  zIndex: 10,
  opacity: 0.6,
}
```

**Clustering Behavior:** Always cluster at zoom < 13

### Visual Example

```
┌─────────────────────────────────────────┐
│                                         │
│     ◉ Tier 1 (On-Route)                │
│     44px, bold, white border, shadow    │
│                                         │
│        ◎ Tier 2 (Near-Route)           │
│        32px, medium, subtle border      │
│                                         │
│           ○ Tier 3 (Distant)           │
│           24px, minimal styling         │
│                                         │
└─────────────────────────────────────────┘
```

---

## Route Visualization

### User Route Polyline

**Base Route Styling:**
```typescript
{
  strokeWidth: 8,
  strokeColor: '#4B3BF5',             // colors.brand.secondary (Indigo Blue)
  lineCap: 'round',
  lineJoin: 'round',
  zIndex: 5,
}
```

**Glow Effect (iOS):**
```typescript
// Render two polylines - base + glow
// Bottom layer (glow)
{
  strokeWidth: 16,
  strokeColor: '#4B3BF540',           // 25% opacity
  lineCap: 'round',
  lineJoin: 'round',
  zIndex: 4,
}

// Top layer (solid)
{
  strokeWidth: 8,
  strokeColor: '#4B3BF5',
  lineCap: 'round',
  lineJoin: 'round',
  zIndex: 5,
}
```

**Glow Effect (Android):**
```typescript
// Single polyline with shadow (elevation handles glow on Android)
{
  strokeWidth: 8,
  strokeColor: '#4B3BF5',
  lineCap: 'round',
  lineJoin: 'round',
  zIndex: 5,
  // No shadow property on Polyline, use dual-layer approach above
}
```

### Risk-Segmented Route (Advanced)

**Concept:** Divide route into segments colored by localized risk score

**Segment Length:** 200m per segment

**Color Mapping:**
- **Low Risk (0-33):** `colors.risk.low.primary` (#00C896) - Jade Green
- **Medium Risk (34-66):** `colors.risk.medium.primary` (#F4A261) - Warm Amber
- **High Risk (67-100):** `colors.risk.high.primary` (#E63946) - Coral Red

**Implementation:**
```typescript
<Polyline
  coordinates={routeSegments.low}
  strokeWidth={8}
  strokeColor={colors.risk.low.primary}
  lineCap="round"
  lineJoin="round"
  zIndex={5}
/>
<Polyline
  coordinates={routeSegments.medium}
  strokeWidth={8}
  strokeColor={colors.risk.medium.primary}
  lineCap="round"
  lineJoin="round"
  zIndex={5}
/>
<Polyline
  coordinates={routeSegments.high}
  strokeWidth={8}
  strokeColor={colors.risk.high.primary}
  lineCap="round"
  lineJoin="round"
  zIndex={5}
/>
```

**Visual Pattern:**
```
Origin ━━━━━━━━━━━━━━━━━━━━━━━━━━ Destination
       ╰─green─╯╰amber╯╰─green──╯
       Low Risk  Caution  Safe
```

### Start/End Markers

**Origin Marker:**
```typescript
{
  icon: 'Location01Icon',
  size: 48,
  backgroundColor: colors.brand.primary,
  iconColor: '#FFFFFF',
  iconSize: 24,
  borderWidth: 4,
  borderColor: '#FFFFFF',
  shadow: {
    color: colors.brand.primary,
    opacity: 0.3,
    radius: 12,
    offset: { width: 0, height: 4 }
  },
  label: 'Home' | 'Office' | location.name,
  labelPosition: 'bottom'
}
```

**Destination Marker:**
```typescript
{
  icon: 'Navigation03Icon',
  size: 48,
  backgroundColor: colors.brand.secondary,
  iconColor: '#FFFFFF',
  iconSize: 24,
  borderWidth: 4,
  borderColor: '#FFFFFF',
  shadow: {
    color: colors.brand.secondary,
    opacity: 0.3,
    radius: 12,
    offset: { width: 0, height: 4 }
  },
  label: destination.name,
  labelPosition: 'bottom'
}
```

---

## Marker Clustering Strategy

### Zoom-Based Clustering Rules

| Zoom Level | Behavior | Cluster Radius | Max Markers |
|------------|----------|----------------|-------------|
| < 10 | Aggressive clustering | 80px | 50 |
| 10-12 | Cluster distant, show route-relevant | 60px | 150 |
| 12-14 | Cluster Tier 3 only | 40px | 300 |
| > 14 | Show all, minimal clustering | 30px | unlimited |

### Cluster Visual Design

**Small Cluster (2-9 events):**
```typescript
{
  size: 40,
  backgroundColor: colors.slate[700],
  borderWidth: 3,
  borderColor: '#FFFFFF',
  labelColor: '#FFFFFF',
  labelSize: 14,
  labelWeight: '700',
  shadow: {
    opacity: 0.25,
    radius: 8,
    offset: { width: 0, height: 2 }
  }
}
```

**Medium Cluster (10-49 events):**
```typescript
{
  size: 52,
  backgroundColor: colors.risk.medium.primary,
  borderWidth: 4,
  borderColor: '#FFFFFF',
  labelColor: '#FFFFFF',
  labelSize: 16,
  labelWeight: '700',
  shadow: {
    opacity: 0.3,
    radius: 10,
    offset: { width: 0, height: 3 }
  }
}
```

**Large Cluster (50+ events):**
```typescript
{
  size: 64,
  backgroundColor: colors.risk.high.primary,
  borderWidth: 4,
  borderColor: '#FFFFFF',
  labelColor: '#FFFFFF',
  labelSize: 18,
  labelWeight: '800',
  shadow: {
    opacity: 0.35,
    radius: 12,
    offset: { width: 0, height: 4 }
  }
}
```

### Cluster Priority

**Never cluster:**
- Tier 1 markers (on-route events)
- Severity 5 events
- User-selected marker

**Always cluster:**
- Tier 3 markers (distant events) at zoom < 14
- Low confidence events (< 40% confidence)

**Visual Representation:**
```
Zoom 8:  [150+] [80+] [50+]  (Only clusters)
Zoom 12: [40+]  ◎  ◎  ○ ○ ○  (Mix of clusters + individuals)
Zoom 15: ◉ ◉ ◎ ◎ ○ ○ ○ ○ ○  (Mostly individual markers)
```

---

## Bottom Sheet Design

### Three States System

#### State 1: COLLAPSED (Default)
**Height:** 120px
**Purpose:** Glanceable summary without obscuring map

**Layout:**
```
┌────────────────────────────────────────┐
│  ──  [Handle]                          │
│                                        │
│  ⚠️  12 alerts on your route           │
│     3 high priority • 9 medium         │
│                                        │
│  [Tap to view details] ▼               │
└────────────────────────────────────────┘
```

**Specifications:**
```typescript
{
  height: 120,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  backgroundColor: Platform.OS === 'ios'
    ? 'rgba(255, 255, 255, 0.95)'
    : '#FFFFFF',
  backdropBlur: 20,                      // iOS only
  shadow: {
    color: '#000',
    opacity: 0.15,
    radius: 20,
    offset: { width: 0, height: -4 }
  },
  padding: 20,
}
```

**Content:**
- **Handle bar:** 40×4px, centered, `colors.slate[300]`
- **Alert icon:** 32×32px, `colors.risk.high.primary` if any high risk
- **Primary text:** "X alerts on your route" - `typography.size['2xl']`, `weight.bold`
- **Secondary text:** Priority breakdown - `typography.size.sm`, `colors.text.secondary`
- **Interaction hint:** Chevron down icon, subtle bounce animation

**Alert Calculation:**
```typescript
const routeAlerts = events.filter(event =>
  isOnRoute(event, userRoute, threshold = 100m)
);
const highPriority = routeAlerts.filter(e => e.severity >= 4).length;
const mediumPriority = routeAlerts.filter(e => e.severity === 3).length;
```

#### State 2: HALF-EXPANDED
**Height:** 50% of screen (~ 400px on standard phone)
**Purpose:** Scrollable list of alerts with quick actions

**Layout:**
```
┌────────────────────────────────────────┐
│  ──  [Handle]                          │
│                                        │
│  Route: Home → Office                  │
│                                        │
│  ┌──────────────────────────────┐     │
│  │ 🌧️  Heavy Rain                │     │
│  │  Severity 4 • 2.1km ahead     │     │
│  │  [Still Active] [Cleared]     │     │
│  └──────────────────────────────┘     │
│                                        │
│  ┌──────────────────────────────┐     │
│  │ 🚗  Traffic Jam               │     │
│  │  Severity 3 • 0.8km ahead     │     │
│  │  [Still Active] [Cleared]     │     │
│  └──────────────────────────────┘     │
│                                        │
│  ... (scrollable)                      │
│                                        │
│  [Filter: All • High Only] [Sort ▼]   │
└────────────────────────────────────────┘
```

**Specifications:**
```typescript
{
  height: Dimensions.get('window').height * 0.5,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  backgroundColor: Platform.OS === 'ios'
    ? 'rgba(255, 255, 255, 0.95)'
    : '#FFFFFF',
  backdropBlur: 20,
}
```

**Alert Card:**
```typescript
{
  marginHorizontal: 16,
  marginVertical: 8,
  padding: 16,
  backgroundColor: colors.background.secondary,
  borderRadius: 16,
  borderLeftWidth: 4,
  borderLeftColor: getRiskColor(event.severity),
  shadow: shadows.sm,
}
```

**Alert Card Content:**
- **Icon:** 40×40px circle, severity-based color background
- **Title:** Event subtype (formatted), `typography.size.lg`, `weight.semibold`
- **Metadata:** "Severity X • Y.Zkm ahead" - `typography.size.sm`, `colors.text.secondary`
- **Quick Actions:** Inline voting buttons (Still Active / Cleared)
- **Distance:** Calculated from user location to event, along route polyline

**Sorting Options:**
- Distance (default)
- Severity (high to low)
- Time (newest first)

**Filtering:**
- All alerts (default)
- High priority only (severity 4-5)
- On my route only
- Weather only / Traffic only

#### State 3: FULL-EXPANDED
**Height:** 85% of screen
**Purpose:** Detailed view with full event information, voting, and map context

**Layout:**
```
┌────────────────────────────────────────┐
│  ──  [Handle]                [Close X] │
│                                        │
│  ┌────────────────────────────────┐   │
│  │                                │   │
│  │      [Mini Map Preview]        │   │
│  │      Event location marked     │   │
│  │                                │   │
│  └────────────────────────────────┘   │
│                                        │
│  🌧️  Heavy Rain Alert                 │
│                                        │
│  Severity 4/5 • 87% Confidence         │
│  Reported 14 minutes ago               │
│  Expires in 1h 46m                     │
│                                        │
│  📍 Location                           │
│  2.1 km ahead on your route            │
│  Oak Street & Maple Ave                │
│                                        │
│  👥 Community Votes (23)               │
│  18 confirmed • 3 cleared • 2 disputed │
│                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                        │
│  IS THIS STILL HAPPENING?              │
│                                        │
│  [  ✓  Yes  ] [ ━  Cleared ] [ ✗ No ] │
│                                        │
│  [View Similar Alerts Nearby (4)]      │
│                                        │
└────────────────────────────────────────┘
```

**Mini Map Preview:**
```typescript
{
  height: 180,
  width: '100%',
  borderRadius: 16,
  marginBottom: 20,
  interactive: false,                    // Static preview
  showsUserLocation: true,
  centerOnEvent: true,
  zoomLevel: 14,
}
```

**Voting Section:**
- Large, tappable buttons (minimum 48×48px touch target)
- Haptic feedback on press
- Success animation on vote submission
- Optimistic UI update

**Community Votes Breakdown:**
```typescript
{
  votes: {
    stillActive: number,
    cleared: number,
    notExists: number
  },
  display: "X confirmed • Y cleared • Z disputed",
  barChart: {
    height: 8,
    borderRadius: 4,
    segments: [
      { color: colors.risk.low.primary, percentage },
      { color: colors.slate[300], percentage },
      { color: colors.risk.high.primary, percentage }
    ]
  }
}
```

### Gesture Interactions

**Swipe Down:** Collapse to previous state
**Swipe Up:** Expand to next state
**Tap Handle:** Toggle between collapsed/half
**Tap Outside (when half/full):** Collapse to collapsed state
**Long Press Card:** Quick preview + haptic feedback

**Gesture Thresholds:**
```typescript
{
  swipeVelocity: 500,                    // Minimum velocity for quick swipe
  swipeDistance: 50,                     // Minimum distance for slow swipe
  snapPoints: [120, '50%', '85%'],       // Discrete sheet positions
  damping: 20,                           // Spring animation damping
  stiffness: 300,                        // Spring animation stiffness
}
```

---

## Interaction Patterns

### Map Tap Behaviors

| Target | Action | Visual Feedback |
|--------|--------|-----------------|
| Tier 1/2 Marker | Select event, expand bottom sheet to half | Marker scales to 1.15x, sheet slides up |
| Tier 3 Marker | Select event, expand to half | Marker scales to 1.15x, sheet slides up |
| Cluster | Zoom to cluster bounds, dissolve | Smooth zoom animation (300ms) |
| User Route | Show route details in sheet | Route pulses briefly, sheet shows route info |
| Empty Map | Deselect current event, collapse sheet | Sheet slides down |

### Marker Selection State

**Selected Marker:**
```typescript
{
  scale: 1.15,
  borderWidth: current + 1,
  shadowOpacity: current * 1.5,
  shadowRadius: current * 1.5,
  zIndex: current + 1000,                // Always on top
}
```

**Animation:**
```typescript
// Spring animation for selection
withSpring(1.15, {
  damping: 15,
  stiffness: 300,
  mass: 0.5
})
```

### Loading States

**Initial Map Load:**
```typescript
<View style={styles.loadingOverlay}>
  <ActivityIndicator size="large" color={colors.brand.secondary} />
  <Text style={styles.loadingText}>Loading nearby events...</Text>
</View>
```

**Event Refresh (Pull to Refresh on Sheet):**
```typescript
<RefreshControl
  refreshing={isRefreshing}
  onRefresh={handleRefresh}
  tintColor={colors.brand.secondary}
  title="Updating events..."
  titleColor={colors.text.secondary}
/>
```

**Incremental Load Indicator:**
```typescript
// Small badge on map for background updates
{
  position: 'absolute',
  top: 200,
  right: 16,
  backgroundColor: colors.brand.secondary,
  borderRadius: 20,
  padding: 8,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
}
// "3 new alerts" with subtle pulse
```

---

## Technical Implementation Guide

### Performance Optimizations

#### 1. Marker Rendering
**Problem:** 749 markers = 749 React Native views = janky performance

**Solution:** Progressive marker rendering with virtualization

```typescript
// Only render markers in current viewport + buffer
const visibleMarkers = useMemo(() => {
  const bounds = mapBounds; // from onRegionChangeComplete
  const buffer = 0.05; // 5% buffer around viewport

  return events.filter(event => {
    return (
      event.location.lat >= bounds.southWest.lat - buffer &&
      event.location.lat <= bounds.northEast.lat + buffer &&
      event.location.lng >= bounds.southWest.lng - buffer &&
      event.location.lng <= bounds.northEast.lng + buffer
    );
  });
}, [events, mapBounds]);
```

**Result:** Render ~50-150 markers instead of 749

#### 2. Clustering Implementation

**Library:** `react-native-map-clustering` or custom supercluster

```typescript
import Supercluster from 'supercluster';

const cluster = useMemo(() => {
  const index = new Supercluster({
    radius: getClusterRadius(zoom),      // Dynamic by zoom
    maxZoom: 16,
    minZoom: 0,
    minPoints: 2,                        // Minimum 2 points to cluster
  });

  // Convert events to GeoJSON
  const points = events.map(event => ({
    type: 'Feature',
    properties: {
      cluster: false,
      eventId: event._id,
      severity: event.severity,
      tier: calculateTier(event),
    },
    geometry: {
      type: 'Point',
      coordinates: [event.location.lng, event.location.lat]
    }
  }));

  index.load(points);
  return index;
}, [events]);

const clustersAndPoints = cluster.getClusters(bounds, zoom);
```

#### 3. Route Calculation

**Use Convex backend for route polylines:**

```typescript
// In Convex routes.ts
export const getRoutePolyline = query({
  args: { routeId: v.id("routes") },
  returns: v.object({
    polyline: v.array(v.object({ lat: v.number(), lng: v.number() })),
    distance: v.number(),
    duration: v.number(),
  }),
  handler: async (ctx, args) => {
    // Fetch from HERE API or cache
    const route = await ctx.db.get(args.routeId);

    if (route.cachedPolyline &&
        Date.now() - route.polylineCachedAt < 24 * 60 * 60 * 1000) {
      return route.cachedPolyline;
    }

    // Fetch fresh from HERE Routing API
    const polyline = await fetchHERERoute(
      route.fromLocation,
      route.toLocation
    );

    // Cache for 24h
    await ctx.db.patch(args.routeId, {
      cachedPolyline: polyline,
      polylineCachedAt: Date.now()
    });

    return polyline;
  }
});
```

#### 4. Event Proximity Detection

**Calculate if event is on/near route:**

```typescript
function calculateEventTier(
  event: Event,
  routePolyline: LatLng[],
  userLocation: LatLng
): 1 | 2 | 3 {
  if (!routePolyline || routePolyline.length === 0) {
    // No active route - tier by distance from user
    const distanceFromUser = haversineDistance(
      userLocation,
      event.location
    );
    return distanceFromUser < 2 ? 2 : 3;
  }

  // Find minimum distance from event to any point on route
  let minDistance = Infinity;

  for (let i = 0; i < routePolyline.length - 1; i++) {
    const segmentStart = routePolyline[i];
    const segmentEnd = routePolyline[i + 1];

    const distance = pointToLineSegmentDistance(
      event.location,
      segmentStart,
      segmentEnd
    );

    minDistance = Math.min(minDistance, distance);
  }

  // Classify tier
  if (minDistance < 0.1) return 1;        // <100m = on route
  if (minDistance < 1.0) return 2;        // 100m-1km = near route
  return 3;                               // >1km = distant
}

function pointToLineSegmentDistance(
  point: LatLng,
  lineStart: LatLng,
  lineEnd: LatLng
): number {
  // Calculate perpendicular distance from point to line segment
  // Using cross product method for efficiency

  const A = point.lat - lineStart.lat;
  const B = point.lng - lineStart.lng;
  const C = lineEnd.lat - lineStart.lat;
  const D = lineEnd.lng - lineStart.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lineStart.lat;
    yy = lineStart.lng;
  } else if (param > 1) {
    xx = lineEnd.lat;
    yy = lineEnd.lng;
  } else {
    xx = lineStart.lat + param * C;
    yy = lineStart.lng + param * D;
  }

  return haversineDistance(
    { lat: point.lat, lng: point.lng },
    { lat: xx, lng: yy }
  );
}
```

### Component Architecture

```
MapScreen (apps/native/app/(tabs)/map.tsx)
├── MapView (react-native-maps)
│   ├── UserRoute component
│   │   ├── Glow Polyline (bottom layer)
│   │   └── Route Polyline (top layer)
│   ├── RiskSegmentedRoute component (optional)
│   │   ├── Low Risk Polylines
│   │   ├── Medium Risk Polylines
│   │   └── High Risk Polylines
│   ├── RouteMarkers component
│   │   ├── Origin Marker
│   │   └── Destination Marker
│   └── EventMarkers component
│       ├── Tier1Markers (on-route)
│       ├── Tier2Markers (near-route)
│       ├── Tier3Markers (distant)
│       └── ClusterMarkers
├── FloatingSearchBar component
├── MyLocationButton component
├── EventCountBadge component
└── BottomSheet component
    ├── CollapsedView
    ├── HalfExpandedView
    │   ├── RouteHeader
    │   ├── AlertList (ScrollView)
    │   │   └── AlertCard[]
    │   └── FilterBar
    └── FullExpandedView
        ├── MiniMapPreview
        ├── EventHeader
        ├── EventMetadata
        ├── CommunityVotes
        ├── VotingSection
        └── RelatedAlerts
```

### State Management

```typescript
// Map Screen State
const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
const [sheetState, setSheetState] = useState<'collapsed' | 'half' | 'full'>('collapsed');
const [mapBounds, setMapBounds] = useState<Bounds | null>(null);
const [zoom, setZoom] = useState<number>(12);
const [eventTiers, setEventTiers] = useState<{
  tier1: Event[],
  tier2: Event[],
  tier3: Event[]
}>({ tier1: [], tier2: [], tier3: [] });

// Computed values
const routePolyline = useQuery(api.routes.getRoutePolyline,
  selectedRoute ? { routeId: selectedRoute._id } : "skip"
);

const routeAlerts = useMemo(() => {
  if (!routePolyline) return [];
  return eventTiers.tier1.concat(eventTiers.tier2);
}, [eventTiers, routePolyline]);

// Recalculate tiers when route or events change
useEffect(() => {
  if (!events || !userLocation) return;

  const categorized = {
    tier1: [] as Event[],
    tier2: [] as Event[],
    tier3: [] as Event[]
  };

  events.forEach(event => {
    const tier = calculateEventTier(
      event,
      routePolyline?.polyline || [],
      userLocation
    );

    if (tier === 1) categorized.tier1.push(event);
    else if (tier === 2) categorized.tier2.push(event);
    else categorized.tier3.push(event);
  });

  setEventTiers(categorized);
}, [events, routePolyline, userLocation]);
```

---

## Accessibility Considerations

### Screen Reader Support

**Marker Labels:**
```typescript
<Marker
  accessible={true}
  accessibilityLabel={`${event.subtype} alert, severity ${event.severity}, ${distanceFromUser} kilometers away`}
  accessibilityHint="Double tap to view details"
  accessibilityRole="button"
/>
```

**Bottom Sheet:**
```typescript
<View
  accessible={true}
  accessibilityLabel={`${routeAlerts.length} alerts on your route`}
  accessibilityHint="Swipe up to expand alert list"
  accessibilityRole="adjustable"
/>
```

### Voice Control

**Voice Commands:**
- "Show my route"
- "Hide route"
- "What alerts are on my route?"
- "Show high priority alerts"
- "Zoom to [location name]"

### Color Contrast

**WCAG AA Compliance:**
- All text on colored backgrounds: minimum 4.5:1 contrast
- Large text (18pt+): minimum 3:1 contrast
- Interactive elements: 3:1 contrast with surroundings

**Contrast Checks:**
```typescript
// Tier 1 marker - Red background + White icon
contrastRatio('#E63946', '#FFFFFF') = 5.2:1 ✓ (passes AA)

// Bottom sheet text - Dark gray on white
contrastRatio('#111827', '#FFFFFF') = 16.8:1 ✓ (passes AAA)

// Secondary text - Medium gray on white
contrastRatio('#6B7280', '#FFFFFF') = 5.5:1 ✓ (passes AA)
```

### Reduced Motion

**Respect OS preference:**
```typescript
import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
    setReduceMotion(enabled);
  });
}, []);

// Conditionally disable animations
const markerScale = reduceMotion
  ? 1.0
  : withSpring(1.15, springConfig);

const pulseAnimation = reduceMotion
  ? null
  : withRepeat(withSequence(...), -1);
```

### Minimum Touch Targets

**WCAG 2.5.5 - Target Size:**
All interactive elements minimum 44×44pt

```typescript
// Marker minimum size
TIER_1_SIZE: 44,      // ✓
TIER_2_SIZE: 32,      // ✗ Too small for accessibility

// Solution: Increase touch area without increasing visual size
<TouchableOpacity
  style={{
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  }}
>
  <View style={{ width: 32, height: 32 }}>
    {/* Visual marker */}
  </View>
</TouchableOpacity>
```

---

## Design Token Reference

### Colors Quick Reference

```typescript
// Primary Actions
colors.brand.primary      // #1A1464 - Deep Indigo
colors.brand.secondary    // #4B3BF5 - Indigo Blue

// Risk States
colors.risk.low.primary   // #00C896 - Jade Green
colors.risk.medium.primary // #F4A261 - Warm Amber
colors.risk.high.primary   // #E63946 - Coral Red

// Neutrals
colors.slate[100]         // #F1F5F9 - Light backgrounds
colors.slate[300]         // #CBD5E1 - Borders
colors.slate[700]         // #334155 - Dark elements

// Text
colors.text.primary       // #111827 - Headings
colors.text.secondary     // #6B7280 - Body text
colors.text.tertiary      // #9CA3AF - Subtle text
```

### Typography Quick Reference

```typescript
// Sizes
typography.size.sm        // 12 - Metadata
typography.size.base      // 14 - Body text
typography.size.lg        // 16 - Subheadings
typography.size['2xl']    // 20 - Headings

// Weights
typography.weight.medium  // '500' - Body emphasis
typography.weight.semibold // '600' - Subheadings
typography.weight.bold    // '700' - Headings
```

### Spacing Quick Reference

```typescript
spacing[2]   // 8px  - Tight gaps
spacing[3]   // 12px - Default gaps
spacing[4]   // 16px - Card padding
spacing[5]   // 20px - Section padding
spacing[6]   // 24px - Large spacing
```

---

## Implementation Checklist

### Phase 1: Route Visualization (Week 1)
- [ ] Add route polyline with glow effect
- [ ] Create origin/destination markers
- [ ] Implement route selection from saved routes
- [ ] Add "Show/Hide Route" toggle

### Phase 2: Marker Hierarchy (Week 2)
- [ ] Implement tier calculation logic
- [ ] Create 3 marker size variants
- [ ] Add proximity-based opacity
- [ ] Implement pulse animation for high severity

### Phase 3: Clustering (Week 3)
- [ ] Integrate Supercluster
- [ ] Implement zoom-based clustering rules
- [ ] Create cluster marker components
- [ ] Add cluster tap → zoom behavior

### Phase 4: Bottom Sheet (Week 4)
- [ ] Create bottom sheet component with 3 states
- [ ] Implement swipe gestures
- [ ] Build collapsed summary view
- [ ] Build half-expanded list view
- [ ] Build full-expanded detail view
- [ ] Add filtering and sorting

### Phase 5: Performance & Polish (Week 5)
- [ ] Optimize marker rendering
- [ ] Add loading states
- [ ] Implement haptic feedback
- [ ] Test accessibility
- [ ] Conduct user testing
- [ ] Iterate based on feedback

---

## Success Metrics

### Quantitative
- **Reduced cognitive load:** <150 markers visible at zoom 12 (down from 749)
- **Faster decision making:** <5 seconds to identify high-priority alerts
- **Improved engagement:** 30% increase in community voting participation
- **Performance:** 60fps maintained with 500+ events in database

### Qualitative
- Users can easily identify risks on their route
- Bottom sheet feels natural and responsive
- Visual hierarchy is clear and intuitive
- Users trust the clustering behavior

---

## Future Enhancements

1. **Real-time Event Updates**
   - Live marker animations when new events appear
   - Push notifications for on-route high-severity events

2. **AR Map Overlay**
   - Use device camera to show alerts overlaid on real world
   - Distance indicators in AR view

3. **Historical Heatmap**
   - Toggle to show risk density over past 7/30 days
   - Time-based heatmap animation

4. **Multi-Route Comparison**
   - Show 2-3 alternative routes with risk scores
   - Side-by-side route comparison view

5. **Collaborative Filtering**
   - "Users with similar commutes also avoid..."
   - Personalized route suggestions based on community behavior

---

**End of Specification**

For implementation questions or design clarifications, reference this document and consult with the design team.
