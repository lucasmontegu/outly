# Map Visualization - Visual Reference Guide
## Quick reference for developers implementing the map redesign

---

## Color Palette Reference

### Marker Colors by Severity

```
Severity 5 (Critical)     ■ #E63946  colors.risk.high.primary
Severity 4 (High)         ■ #C62634  colors.risk.high.dark
Severity 3 (Medium)       ■ #F4A261  colors.risk.medium.primary
Severity 2 (Low-Medium)   ■ #E07B3C  colors.risk.medium.dark
Severity 1 (Info)         ■ #3B82F6  colors.state.info
```

### Route Colors

```
Primary Route             ■ #4B3BF5  colors.brand.secondary (Indigo Blue)
Route Glow                ■ #4B3BF540 (25% opacity)
Low Risk Segment          ■ #00C896  colors.risk.low.primary (Green)
Medium Risk Segment       ■ #F4A261  colors.risk.medium.primary (Amber)
High Risk Segment         ■ #E63946  colors.risk.high.primary (Red)
```

---

## Marker Size Reference

### Visual Comparison

```
Tier 1 (On-Route) - 44px
    ┌──────────┐
    │          │
    │    ◉     │   ← Most prominent
    │          │   ← White border (3px)
    └──────────┘   ← Strong shadow

Tier 2 (Near-Route) - 32px
    ┌────────┐
    │   ◎    │     ← Medium size
    │        │     ← White border (2px)
    └────────┘     ← Moderate shadow

Tier 3 (Distant) - 24px
    ┌──────┐
    │  ○   │       ← Smallest
    │      │       ← No border
    └──────┘       ← Subtle shadow
```

### Precise Specifications

```typescript
// TIER 1: On-Route (0-100m from route)
{
  outerSize: 44,
  innerIconSize: 24,
  borderWidth: 3,
  borderColor: '#FFFFFF',
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 8,
  zIndex: 100,
  opacity: 1.0
}

// TIER 2: Near-Route (100m-1km from route)
{
  outerSize: 32,
  innerIconSize: 18,
  borderWidth: 2,
  borderColor: '#FFFFFF',
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 4,
  zIndex: 50,
  opacity: 0.9
}

// TIER 3: Distant (>1km from route)
{
  outerSize: 24,
  innerIconSize: 14,
  borderWidth: 0,
  shadowOpacity: 0.15,
  shadowRadius: 4,
  elevation: 2,
  zIndex: 10,
  opacity: 0.6
}

// CLUSTER: Variable size
{
  smallCluster: 40,   // 2-9 events
  mediumCluster: 52,  // 10-49 events
  largeCluster: 64,   // 50+ events
}
```

---

## Route Visualization Examples

### Simple Route (Solid Color)

```
Origin                                    Destination
  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
  │ #4B3BF5 (8px stroke)                   │
  │ With 16px glow layer underneath        │
  Home                                   Office
```

### Risk-Segmented Route

```
Origin                                    Destination
  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
  │                                         │
  ╰─ Green ─╯╰ Amber ╯╰── Green ──╯╰ Red ╯
     Low      Caution     Safe      High
     0-33     34-66       0-33      67+
```

**Implementation:**
```typescript
// Divide route into 200m segments
// Calculate risk score for each segment
// Render as separate polylines with different colors

segments = [
  { coords: [...], risk: 22, color: '#00C896' },  // Green
  { coords: [...], risk: 45, color: '#F4A261' },  // Amber
  { coords: [...], risk: 18, color: '#00C896' },  // Green
  { coords: [...], risk: 78, color: '#E63946' },  // Red
]
```

---

## Bottom Sheet States

### State 1: Collapsed (120px)

```
┌─────────────────────────────────────────────┐
│                    ──                       │ ← Handle (40×4px)
│                                             │
│  ⚠️  12 alerts on your route                │ ← Icon + Title (20pt bold)
│     3 high priority • 9 medium              │ ← Subtitle (12pt)
│                                             │
│  Tap to view details  ▼                     │ ← Hint
└─────────────────────────────────────────────┘
      ↑
   120px tall
   24px border radius (top corners)
   White background (95% opacity on iOS)
```

### State 2: Half-Expanded (~400px)

```
┌─────────────────────────────────────────────┐
│                    ──                       │
│                                             │
│  Route: Home → Office                       │
│  [All • High Only] [Sort: Distance ▼]       │
│  ─────────────────────────────────────────  │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │ ┐
│  ┃ 🌧️ Heavy Rain                       ┃   │ │
│  ┃ Severity 4 • 2.1km ahead            ┃   │ │ Alert
│  ┃ [Still Active] [Cleared]            ┃   │ │ Card
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │ ┘
│                                             │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃ 🚗 Traffic Jam                      ┃   │
│  ┃ Severity 3 • 0.8km ahead            ┃   │
│  ┃ [Still Active] [Cleared]            ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                             │
│  ... (scrollable)                           │
└─────────────────────────────────────────────┘
      ↑
   ~400px tall (50% screen)
   Scrollable content
   Filter/sort controls
```

### State 3: Full-Expanded (~85% screen)

```
┌─────────────────────────────────────────────┐
│               ──              [Close ✕]     │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │                                       │ │
│  │        Mini Map Preview               │ │ 180px
│  │        (Static, event centered)       │ │ tall
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  🌧️  Heavy Rain Alert                      │ ← 24pt bold
│                                             │
│  ┌─────┐ ┌─────────┐ ┌──────────────┐     │
│  │Sev 4│ │87% conf.│ │Expires: 1h46m│     │ ← Pills
│  └─────┘ └─────────┘ └──────────────┘     │
│                                             │
│  📍 Location                                │
│  2.1 km ahead on your route                │
│  Oak Street & Maple Ave                     │
│                                             │
│  👥 Community Votes                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░ 18/3/2               │ ← Vote bar
│                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                             │
│  IS THIS STILL HAPPENING?                   │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │    ✓    │ │    ━    │ │    ✗    │      │
│  │   Yes   │ │ Cleared │ │    No   │      │
│  └─────────┘ └─────────┘ └─────────┘      │
│                                             │
│  [View Similar Alerts Nearby (4) →]        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Map Layout Composition

### Full Screen View

```
┌───────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────┐ │ ← Search bar (top)
│ │  🔍 Search location...              ✕   │ │   SafeArea + 16px
│ └──────────────────────────────────────────┘ │
│                                               │
│          [12 signals nearby]                  │ ← Event badge (left)
│               ╭─────────╮                     │   140px from top
│               │    🧭   │                     │ ← My Location (right)
│               ╰─────────╯                     │   140px from top
│                                               │
│                    ◉                          │
│        ◎      ◎                               │
│                         [8]                   │ ← Cluster
│    ○   ○                     ◎                │
│                                               │
│  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●    │ ← Route
│  Origin                           Destination │
│                                               │
│                                               │
│                                               │
│ ┌─────────────────────────────────────────┐  │
│ │              ──                         │  │ ← Bottom sheet
│ │  ⚠️  12 alerts on your route            │  │   (collapsed state)
│ │     3 high • 9 medium                   │  │
│ │  [Tap to view] ▼                        │  │
│ └─────────────────────────────────────────┘  │
│ [════════════════Tab Bar═══════════════════] │
└───────────────────────────────────────────────┘
```

---

## Clustering Visual Behavior

### Zoom Level 8 (City-wide view)

```
┌───────────────────────────────────────┐
│                                       │
│         [150+]                        │ ← Large cluster
│                                       │
│                  [80+]                │ ← Medium cluster
│                                       │
│    [50+]                              │ ← Small cluster
│                                       │
│                         [120+]        │
│                                       │
└───────────────────────────────────────┘

All events clustered, no individual markers visible
```

### Zoom Level 12 (Neighborhood view)

```
┌───────────────────────────────────────┐
│                                       │
│    ◉ ◉                                │ ← Tier 1 (on-route)
│  ━━━━━━━━━━━━━━━━                   │    Always visible
│    Route                              │
│                                       │
│              [40+]                    │ ← Distant events
│                                       │    clustered
│       ◎  ◎                            │ ← Tier 2 (near-route)
│                                       │    Visible individually
│  ○ ○                                  │ ← Tier 3
│     [12+]                             │    Some clustered
│                                       │
└───────────────────────────────────────┘

Mix of clusters and individual markers
Route-relevant events always shown
```

### Zoom Level 15 (Street view)

```
┌───────────────────────────────────────┐
│                                       │
│  ◉ ◉ ◉                                │ ← All Tier 1
│  ━━━━━━━━━━━━━━━━                   │    individual
│  Route                                │
│                                       │
│        ◎ ◎ ◎ ◎                        │ ← All Tier 2
│                                       │    individual
│  ○ ○ ○ ○                              │
│  ○ ○ ○                                │ ← All Tier 3
│     ○ ○ ○                             │    individual
│                                       │
└───────────────────────────────────────┘

All markers visible individually
No clustering at street level
```

---

## Alert Card Anatomy

```
┌─────────────────────────────────────────────────┐
│ ║  ┌──────┐                                     │ ← 4px colored
│ ║  │  🌧️  │  Heavy Rain                         │   left border
│ ║  └──────┘  Severity 4 • 2.1km ahead           │   (severity color)
│ ║             Reported 14m ago                   │
│ ║                                                │
│ ║  ┌────────────┐ ┌────────────┐                │
│ ║  │Still Active│ │  Cleared   │                │ ← Quick vote
│ ║  └────────────┘ └────────────┘                │   buttons
│ ║                                                │
└─────────────────────────────────────────────────┘
 ↑
16px padding all sides
12px border radius
Background: colors.background.secondary (#F8FAFC)
Shadow: shadows.sm
```

**Component Breakdown:**

```typescript
<View style={styles.alertCard}>
  {/* Left accent border */}
  <View style={[styles.accentBorder, { backgroundColor: severityColor }]} />

  {/* Icon circle */}
  <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
    <Icon name={eventIcon} size={24} color={iconColor} />
  </View>

  {/* Content */}
  <View style={styles.cardContent}>
    <Text style={styles.cardTitle}>{event.subtype}</Text>
    <Text style={styles.cardMeta}>
      Severity {event.severity} • {distance}km ahead
    </Text>
    <Text style={styles.cardTime}>
      Reported {timeAgo}
    </Text>
  </View>

  {/* Quick actions */}
  <View style={styles.quickActions}>
    <Button variant="outline">Still Active</Button>
    <Button variant="outline">Cleared</Button>
  </View>
</View>
```

---

## Interaction State Transitions

### Marker Selection Flow

```
1. IDLE STATE
   Marker: Normal size (24/32/44px)
   Bottom Sheet: Collapsed (120px)
   ┌─────┐
   │  ○  │
   └─────┘

2. TAP MARKER
   Marker: Scales to 1.15x with spring animation
   Bottom Sheet: Slides up to Half (400px)
   ┌─────┐
   │  ◎  │ ← Slightly larger, stronger shadow
   └─────┘

3. SELECTED STATE
   Marker: Stays at 1.15x, zIndex +1000
   Bottom Sheet: Shows event details
   ┌─────┐
   │  ◉  │ ← Prominent
   └─────┘

4. TAP ELSEWHERE
   Marker: Springs back to normal
   Bottom Sheet: Slides down to Collapsed
   ┌─────┐
   │  ○  │
   └─────┘
```

### Bottom Sheet Gesture Flow

```
COLLAPSED (120px)
     │
     │ Swipe Up / Tap Handle
     ▼
HALF-EXPANDED (400px)
     │
     │ Swipe Up
     ▼
FULL-EXPANDED (85%)
     │
     │ Swipe Down
     ▼
HALF-EXPANDED (400px)
     │
     │ Swipe Down / Tap Outside
     ▼
COLLAPSED (120px)
```

**Gesture Thresholds:**
```typescript
const GESTURE_CONFIG = {
  // Velocity-based (fast swipe)
  velocityThreshold: 500,        // px/s

  // Distance-based (slow swipe)
  distanceThreshold: 50,         // px

  // Snap points
  snapPoints: [
    120,                         // Collapsed
    '50%',                       // Half
    '85%'                        // Full
  ],

  // Animation
  springConfig: {
    damping: 20,
    stiffness: 300,
    mass: 0.5
  }
};
```

---

## Performance Optimization Zones

### Marker Rendering Viewport

```
┌─────────────────────────────────────────┐
│ ░░░░░░░░░░░░ BUFFER ZONE ░░░░░░░░░░░░░ │ ← 5% buffer
│ ░┌─────────────────────────────────┐░  │
│ ░│                                 │░  │
│ ░│         VISIBLE                 │░  │ ← Actual viewport
│ ░│         VIEWPORT                │░  │   Render all markers
│ ░│                                 │░  │
│ ░└─────────────────────────────────┘░  │
│ ░░░░░░░░░░░░ BUFFER ZONE ░░░░░░░░░░░░░ │
└─────────────────────────────────────────┘

Markers OUTSIDE buffer zone: Not rendered
Markers IN buffer zone: Pre-loaded for smooth pan
Markers IN viewport: Fully visible
```

**Implementation:**

```typescript
const getVisibleMarkers = (bounds, buffer = 0.05) => {
  const expandedBounds = {
    north: bounds.northEast.lat + buffer,
    south: bounds.southWest.lat - buffer,
    east: bounds.northEast.lng + buffer,
    west: bounds.southWest.lng - buffer
  };

  return events.filter(event =>
    event.location.lat <= expandedBounds.north &&
    event.location.lat >= expandedBounds.south &&
    event.location.lng <= expandedBounds.east &&
    event.location.lng >= expandedBounds.west
  );
};
```

---

## Z-Index Layer Stacking

```
Layer 10000: Selected marker         (Always on top)
Layer 1000:  Bottom sheet             (Covers everything)
Layer 100:   Tier 1 markers           (On-route, high priority)
Layer 50:    Tier 2 markers           (Near-route)
Layer 20:    Cluster markers          (Groups)
Layer 10:    Tier 3 markers           (Distant)
Layer 5:     Route polyline           (User's route)
Layer 4:     Route glow               (Route shadow/glow)
Layer 1:     Map base layer           (Streets, terrain)
```

**Why this order:**
- Selected marker always visible above bottom sheet
- Bottom sheet covers all markers when expanded
- Route-relevant markers above distant markers
- Route visible above base map but below markers

---

## Responsive Breakpoints

### Phone Sizes

```typescript
// iPhone SE (smallest)
{
  screenWidth: 375,
  screenHeight: 667,
  mapHeight: 667 - 120 - 88,      // Screen - sheet - tab bar = 459px
  sheetCollapsed: 120,
  sheetHalf: 333,                 // 50% of screen
  sheetFull: 567                  // 85% of screen
}

// iPhone Pro Max (largest)
{
  screenWidth: 430,
  screenHeight: 932,
  mapHeight: 932 - 120 - 88,      // = 724px
  sheetCollapsed: 120,
  sheetHalf: 466,                 // 50% of screen
  sheetFull: 792                  // 85% of screen
}
```

**Adapt bottom sheet:**
```typescript
const SHEET_CONFIG = {
  collapsed: 120,                   // Fixed
  half: Dimensions.get('window').height * 0.5,
  full: Dimensions.get('window').height * 0.85
};
```

---

## Animation Timing Reference

### Micro-interactions

```typescript
const ANIMATION_DURATIONS = {
  markerSelect: 200,              // Marker scale up
  markerDeselect: 150,            // Marker scale down
  sheetExpand: 300,               // Sheet slide up
  sheetCollapse: 250,             // Sheet slide down
  clusterDissolve: 350,           // Cluster → markers
  routeAppear: 400,               // Route fade in
  pulseLoop: 1600,                // 800ms expand + 800ms contract
};

const SPRING_CONFIGS = {
  snappy: {
    damping: 20,
    stiffness: 400,
    mass: 0.5
  },
  bouncy: {
    damping: 12,
    stiffness: 300,
    mass: 0.8
  },
  gentle: {
    damping: 25,
    stiffness: 200,
    mass: 0.6
  }
};
```

### Animation Examples

**Marker selection:**
```typescript
// Spring animation (feels natural)
scale.value = withSpring(1.15, SPRING_CONFIGS.snappy);
```

**Sheet transition:**
```typescript
// Timing animation (predictable)
translateY.value = withTiming(
  targetY,
  { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }
);
```

**Pulse animation:**
```typescript
// Infinite loop
scale.value = withRepeat(
  withSequence(
    withTiming(1.15, { duration: 800 }),
    withTiming(1.0, { duration: 800 })
  ),
  -1,  // infinite
  false
);
```

---

## Touch Target Accessibility

### Minimum Touch Targets (44×44pt)

```
Visual Size vs Touch Target
───────────────────────────

Tier 2 Marker (Visual: 32px)
┌────────────────┐
│                │  ← 44×44 touch area
│   ┌──────┐     │
│   │  ◎   │     │  ← 32×32 visual marker
│   └──────┘     │
│                │
└────────────────┘

Implementation:
<TouchableOpacity style={{ width: 44, height: 44 }}>
  <View style={{ width: 32, height: 32 }}>
    {/* Visual marker */}
  </View>
</TouchableOpacity>
```

---

## Testing Scenarios

### Scenario 1: Dense Urban Area (749 events)

```
Zoom 10:  Should show ~10-15 clusters
Zoom 12:  Should show ~30-50 markers + 5-8 clusters
Zoom 14:  Should show ~100-150 individual markers
Zoom 16:  Should show all markers in viewport (~200-300)

Performance: Maintain 60fps during pan/zoom
```

### Scenario 2: Route with Multiple Alerts

```
Given: User route with 12 on-route events
When: Map loads
Then:
  - 12 Tier 1 markers (44px, prominent)
  - Bottom sheet shows "12 alerts on your route"
  - Route polyline visible with glow
  - Markers sorted by distance in sheet
```

### Scenario 3: No Active Route

```
Given: User has no route selected
When: Map loads
Then:
  - All markers classified as Tier 2 (nearby) or Tier 3 (far)
  - Based on distance from user location
  - Bottom sheet shows "X signals nearby"
  - No route polyline visible
```

### Scenario 4: Cluster Interaction

```
Given: Zoom level 10, visible cluster with 50+ events
When: User taps cluster
Then:
  - Map zooms to cluster bounds (zoom level ~14)
  - Cluster dissolves into individual markers
  - Animation duration: 350ms
  - Haptic feedback on tap
```

---

## File Structure for Implementation

```
apps/native/app/(tabs)/map.tsx
apps/native/components/map/
  ├── EventMarker.tsx              # Individual event marker
  ├── ClusterMarker.tsx            # Cluster marker
  ├── RoutePolyline.tsx            # User route with glow
  ├── RiskSegmentedRoute.tsx       # Multi-colored risk route
  ├── RouteMarkers.tsx             # Origin/destination markers
  ├── BottomSheet.tsx              # Main bottom sheet container
  │   ├── CollapsedView.tsx
  │   ├── HalfExpandedView.tsx
  │   └── FullExpandedView.tsx
  ├── AlertCard.tsx                # Individual alert in list
  └── MapControls.tsx              # Search, location, filters
apps/native/lib/
  └── map-utils.ts                 # Tier calculation, clustering
```

---

**End of Visual Reference Guide**

Use this as a quick lookup during implementation. Refer to MAP_VISUALIZATION_DESIGN_SPEC.md for detailed requirements.
