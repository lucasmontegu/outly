# Map Screen Redesign - Implementation Guide

## Quick Reference for Developers

This guide provides specific code patterns and implementation steps for the map screen redesign based on UX research findings.

---

## Problem Summary

**Current Issues:**
1. User's saved routes are not visible on the map
2. All events shown as individual markers (visual overload)
3. No clear relationship between events and user's routes
4. Cannot quickly answer "Is my commute affected?"

**User Expectation:**
Users expect to see their saved routes as bold polylines (like Waze/Google Maps) with events contextualized relative to those routes.

---

## Phase 1: Add Route Polylines (Critical Priority)

### Step 1: Query User Routes

**In `/apps/native/app/(tabs)/map.tsx`:**

```typescript
// Add after existing location query (around line 354)
const userRoutes = useQuery(
  api.routes.getUserRoutes,
  isScreenFocused ? {} : "skip"
);
```

### Step 2: Render Route Polylines

**Add before event markers (around line 610):**

```typescript
{/* User Route Polylines - PRIMARY VISUAL ELEMENT */}
{userRoutes?.map((route) => {
  // Calculate current risk for this route
  const routeRisk = calculateRouteRiskScore(route, events);
  const routeColor = getRiskColorForRoute(routeRisk);

  return (
    <Polyline
      key={`user-route-${route._id}`}
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
      strokeWidth={selectedRoute === route._id ? 8 : 6}
      strokeColor={routeColor}
      strokeOpacity={selectedRoute === route._id ? 1.0 : 0.85}
      lineCap="round"
      lineJoin="round"
      tappable
      onPress={() => handleRoutePress(route)}
      zIndex={100} // Highest z-index - routes are primary
    />
  );
})}

{/* Route Start/End Markers */}
{userRoutes?.map((route) => (
  <React.Fragment key={`route-markers-${route._id}`}>
    {/* Start marker */}
    <Marker
      coordinate={{
        latitude: route.fromLocation.lat,
        longitude: route.fromLocation.lng,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.routeEndpointMarker}>
        <HugeiconsIcon
          icon={route.icon === 'home' ? Home01Icon : Building02Icon}
          size={16}
          color={colors.brand.primary}
        />
      </View>
    </Marker>

    {/* End marker */}
    <Marker
      coordinate={{
        latitude: route.toLocation.lat,
        longitude: route.toLocation.lng,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.routeEndpointMarker}>
        <HugeiconsIcon
          icon={Building02Icon}
          size={16}
          color={colors.brand.primary}
        />
      </View>
    </Marker>
  </React.Fragment>
))}
```

### Step 3: Helper Functions

**Add before component export:**

```typescript
/**
 * Calculate risk score for a specific route based on nearby events
 */
function calculateRouteRiskScore(
  route: any,
  events: EventType[] | undefined
): number {
  if (!events || events.length === 0) return 0;

  // Filter events within 2km of route line (simplified: check endpoints)
  const routeEvents = events.filter((event) => {
    const distToStart = haversineDistance(
      route.fromLocation.lat,
      route.fromLocation.lng,
      event.location.lat,
      event.location.lng
    );
    const distToEnd = haversineDistance(
      route.toLocation.lat,
      route.toLocation.lng,
      event.location.lat,
      event.location.lng
    );

    // Event is "on route" if within 2km of start OR end
    return Math.min(distToStart, distToEnd) <= 2;
  });

  if (routeEvents.length === 0) return 0;

  // Weighted average based on severity and confidence
  let totalScore = 0;
  for (const event of routeEvents) {
    const impact = event.severity * 10 * (event.confidenceScore / 100);
    totalScore += impact;
  }

  return Math.min(100, Math.round(totalScore / routeEvents.length));
}

/**
 * Get color for route polyline based on risk score
 */
function getRiskColorForRoute(riskScore: number): string {
  if (riskScore >= 67) return colors.risk.high.primary;   // Red
  if (riskScore >= 34) return colors.risk.medium.primary; // Orange
  return colors.risk.low.primary;                         // Green
}

/**
 * Haversine distance between two points (km)
 */
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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
```

### Step 4: Add State and Handlers

**Add to component state (around line 360):**

```typescript
const [selectedRoute, setSelectedRoute] = useState<Id<"routes"> | null>(null);
```

**Add handler:**

```typescript
const handleRoutePress = (route: any) => {
  mediumHaptic();
  setSelectedRoute(route._id);
  setSelectedEventId(null); // Deselect any selected event

  // Zoom to fit entire route
  if (mapRef.current) {
    // Calculate bounds that include both endpoints
    const padding = 0.02; // Add padding around route
    const minLat = Math.min(route.fromLocation.lat, route.toLocation.lat) - padding;
    const maxLat = Math.max(route.fromLocation.lat, route.toLocation.lat) + padding;
    const minLng = Math.min(route.fromLocation.lng, route.toLocation.lng) - padding;
    const maxLng = Math.max(route.fromLocation.lng, route.toLocation.lng) + padding;

    mapRef.current.animateToRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: maxLat - minLat,
      longitudeDelta: maxLng - minLng,
    }, 500);
  }
};
```

### Step 5: Add Styles

**Add to StyleSheet (end of file):**

```typescript
routeEndpointMarker: {
  width: 32,
  height: 32,
  borderRadius: borderRadius.full,
  backgroundColor: colors.background.primary,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 3,
  borderColor: colors.brand.primary,
  shadowColor: colors.brand.primary,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
},
```

---

## Phase 2: Filter Events by Route Relevance

### Step 1: Categorize Events

**Add before MapView render (around line 596):**

```typescript
// Categorize events by route relevance
const { routeRelevantEvents, offRouteEvents } = React.useMemo(() => {
  if (!events || !userRoutes) {
    return { routeRelevantEvents: events || [], offRouteEvents: [] };
  }

  const relevant: EventType[] = [];
  const offRoute: EventType[] = [];

  for (const event of events) {
    // Check if event is near any user route
    const isRelevant = userRoutes.some(route => {
      const distToStart = haversineDistance(
        route.fromLocation.lat,
        route.fromLocation.lng,
        event.location.lat,
        event.location.lng
      );
      const distToEnd = haversineDistance(
        route.toLocation.lat,
        route.toLocation.lng,
        event.location.lat,
        event.location.lng
      );
      return Math.min(distToStart, distToEnd) <= 2; // 2km threshold
    });

    if (isRelevant) {
      relevant.push(event);
    } else {
      offRoute.push(event);
    }
  }

  return { routeRelevantEvents: relevant, offRouteEvents: offRoute };
}, [events, userRoutes]);
```

### Step 2: Update Event Rendering

**Replace current event markers section (around line 642):**

```typescript
{/* HIGH-PRIORITY: High-severity events on user routes */}
{routeRelevantEvents
  ?.filter((e) => e.severity >= 4)
  .map((event) => (
    <EventMarker
      key={event._id}
      event={event}
      isSelected={selectedEventId === event._id}
      onPress={() => handleMarkerPress(event._id)}
    />
  ))}

{/* MEDIUM-PRIORITY: Medium-severity events on user routes */}
{routeRelevantEvents
  ?.filter((e) => e.severity >= 2 && e.severity < 4)
  .map((event) => (
    <EventMarker
      key={event._id}
      event={event}
      isSelected={selectedEventId === event._id}
      onPress={() => handleMarkerPress(event._id)}
    />
  ))}

{/* LOW-PRIORITY: Off-route high-severity events (dimmed) */}
{offRouteEvents
  ?.filter((e) => e.severity >= 4)
  .map((event) => (
    <View key={event._id} style={{ opacity: 0.5 }}>
      <EventMarker
        event={event}
        isSelected={selectedEventId === event._id}
        onPress={() => handleMarkerPress(event._id)}
      />
    </View>
  ))}
```

---

## Phase 3: Route Detail Bottom Sheet

### Step 1: Create RouteDetailSheet Component

**Add new component before MapScreen export:**

```typescript
function RouteDetailSheet({
  route,
  events,
  onClose,
}: {
  route: any;
  events: EventType[] | undefined;
  onClose: () => void;
}) {
  // Filter events on this specific route
  const routeEvents = events?.filter(event => {
    const distToStart = haversineDistance(
      route.fromLocation.lat,
      route.fromLocation.lng,
      event.location.lat,
      event.location.lng
    );
    const distToEnd = haversineDistance(
      route.toLocation.lat,
      route.toLocation.lng,
      event.location.lat,
      event.location.lng
    );
    return Math.min(distToStart, distToEnd) <= 2;
  }) || [];

  const riskScore = calculateRouteRiskScore(route, events);
  const riskLabel = riskScore >= 67 ? "High" : riskScore >= 34 ? "Medium" : "Low";
  const riskColor = getRiskColorForRoute(riskScore);

  return (
    <Animated.View
      style={styles.sheetContainer}
      entering={SlideInDown.springify().damping(20)}
      exiting={SlideOutDown.duration(200)}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 90 : 100}
        tint="light"
        style={styles.sheetBlur}
      >
        <View style={styles.sheetContent}>
          {/* Handle bar */}
          <View style={styles.sheetHandle} />

          {/* Route Header */}
          <View style={styles.routeDetailHeader}>
            <View style={styles.routeDetailInfo}>
              <Text style={styles.routeDetailName}>{route.name}</Text>
              <View style={styles.routeDetailPath}>
                <Text style={styles.routePathText}>{route.fromName}</Text>
                <HugeiconsIcon icon={ArrowDown01Icon} size={12} color={colors.text.tertiary} />
                <Text style={styles.routePathText}>{route.toName}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeSheetButton}
              onPress={onClose}
              accessibilityLabel="Close route details"
              accessibilityRole="button"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Risk Score Card */}
          <View style={[styles.riskScoreCard, { borderColor: riskColor }]}>
            <Text style={styles.riskScoreLabel}>Current Risk</Text>
            <Text style={[styles.riskScoreValue, { color: riskColor }]}>
              {riskScore}
            </Text>
            <Text style={[styles.riskScoreBadge, { backgroundColor: `${riskColor}15`, color: riskColor }]}>
              {riskLabel} Risk
            </Text>
          </View>

          {/* Events on Route */}
          {routeEvents.length > 0 ? (
            <View style={styles.routeEventsSection}>
              <Text style={styles.sectionLabel}>
                {routeEvents.length} EVENT{routeEvents.length !== 1 ? 'S' : ''} ON THIS ROUTE
              </Text>
              {routeEvents.slice(0, 3).map((event) => (
                <TouchableOpacity
                  key={event._id}
                  style={styles.routeEventItem}
                  onPress={() => {
                    onClose();
                    handleMarkerPress(event._id);
                  }}
                >
                  <View style={styles.routeEventIcon}>
                    <HugeiconsIcon
                      icon={event.type === 'weather' ? CloudIcon : Car01Icon}
                      size={18}
                      color={event.severity >= 4 ? colors.risk.high.primary : colors.risk.medium.primary}
                    />
                  </View>
                  <View style={styles.routeEventInfo}>
                    <Text style={styles.routeEventTitle}>
                      {formatSubtype(event.subtype)}
                    </Text>
                    <Text style={styles.routeEventMeta}>
                      Severity {event.severity}/5 • {event.confidenceScore}% confidence
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noEventsCard}>
              <HugeiconsIcon icon={Tick02Icon} size={24} color={colors.risk.low.primary} />
              <Text style={styles.noEventsText}>
                No active events on this route
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.routeActions}>
            <Button
              className="flex-1 h-12 rounded-xl"
              onPress={() => {
                /* Navigate to route detail page */
                router.push(`/(tabs)/saved`);
              }}
            >
              View Full Details
            </Button>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

// Helper function
function formatSubtype(subtype: string): string {
  return subtype
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
```

### Step 2: Add Route Sheet to Render

**Add after EventDetailSheet (around line 726):**

```typescript
{/* Route Detail Bottom Sheet */}
{selectedRoute && userRoutes && (
  <RouteDetailSheet
    route={userRoutes.find(r => r._id === selectedRoute)}
    events={events}
    onClose={() => setSelectedRoute(null)}
  />
)}
```

### Step 3: Add Styles

```typescript
// Route Detail Sheet
routeDetailHeader: {
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: spacing[4],
},
routeDetailInfo: {
  flex: 1,
},
routeDetailName: {
  fontSize: typography.size.xl,
  fontWeight: typography.weight.bold,
  color: colors.text.primary,
  marginBottom: spacing[1],
},
routeDetailPath: {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing[2],
},
routePathText: {
  fontSize: typography.size.sm,
  color: colors.text.secondary,
},
riskScoreCard: {
  backgroundColor: colors.background.tertiary,
  borderRadius: borderRadius.xl,
  padding: spacing[4],
  alignItems: "center",
  borderWidth: 2,
  marginBottom: spacing[4],
},
riskScoreLabel: {
  fontSize: typography.size.xs,
  fontWeight: typography.weight.semibold,
  color: colors.text.tertiary,
  letterSpacing: typography.tracking.wide,
  textTransform: "uppercase",
  marginBottom: spacing[1],
},
riskScoreValue: {
  fontSize: typography.size['4xl'],
  fontWeight: typography.weight.black,
  marginBottom: spacing[2],
},
riskScoreBadge: {
  paddingHorizontal: spacing[3],
  paddingVertical: spacing[1],
  borderRadius: borderRadius.full,
  fontSize: typography.size.xs,
  fontWeight: typography.weight.semibold,
},
routeEventsSection: {
  marginBottom: spacing[4],
},
routeEventItem: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.background.tertiary,
  borderRadius: borderRadius.lg,
  padding: spacing[3],
  marginBottom: spacing[2],
},
routeEventIcon: {
  width: 36,
  height: 36,
  borderRadius: borderRadius.lg,
  backgroundColor: colors.background.primary,
  alignItems: "center",
  justifyContent: "center",
  marginRight: spacing[3],
},
routeEventInfo: {
  flex: 1,
},
routeEventTitle: {
  fontSize: typography.size.base,
  fontWeight: typography.weight.semibold,
  color: colors.text.primary,
  marginBottom: 2,
},
routeEventMeta: {
  fontSize: typography.size.xs,
  color: colors.text.secondary,
},
noEventsCard: {
  backgroundColor: colors.risk.low.light,
  borderRadius: borderRadius.lg,
  padding: spacing[4],
  alignItems: "center",
  marginBottom: spacing[4],
},
noEventsText: {
  fontSize: typography.size.sm,
  color: colors.risk.low.dark,
  fontWeight: typography.weight.medium,
  marginTop: spacing[2],
},
routeActions: {
  flexDirection: "row",
  gap: spacing[3],
},
```

---

## Phase 4: Enhanced Event Detail (Show Affected Routes)

### Update EventDetailSheet Component

**Add to existing EventDetailSheet (after info pills, around line 293):**

```typescript
{/* NEW: Show which user routes are affected */}
{userRoutes && userRoutes.length > 0 && (() => {
  const affectedRoutes = userRoutes.filter(route => {
    const distToStart = haversineDistance(
      route.fromLocation.lat,
      route.fromLocation.lng,
      event.location.lat,
      event.location.lng
    );
    const distToEnd = haversineDistance(
      route.toLocation.lat,
      route.toLocation.lng,
      event.location.lat,
      event.location.lng
    );
    return Math.min(distToStart, distToEnd) <= 2;
  });

  if (affectedRoutes.length === 0) return null;

  return (
    <View style={styles.affectedRoutesSection}>
      <Text style={styles.affectedRoutesLabel}>
        AFFECTS YOUR ROUTES
      </Text>
      <View style={styles.affectedRoutesChips}>
        {affectedRoutes.map(route => {
          const Icon = route.icon === 'home' ? Home01Icon :
                      route.icon === 'running' ? WorkoutRunIcon :
                      Building02Icon;

          return (
            <View key={route._id} style={styles.routeChip}>
              <HugeiconsIcon icon={Icon} size={14} color={colors.brand.primary} />
              <Text style={styles.routeChipText} numberOfLines={1}>
                {route.name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
})()}
```

### Add Styles

```typescript
affectedRoutesSection: {
  marginTop: spacing[4],
  paddingTop: spacing[4],
  borderTopWidth: 1,
  borderTopColor: colors.slate[100],
},
affectedRoutesLabel: {
  fontSize: typography.size.xs - 1,
  fontWeight: typography.weight.semibold,
  color: colors.text.tertiary,
  letterSpacing: typography.tracking.wide,
  marginBottom: spacing[2],
},
affectedRoutesChips: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing[2],
},
routeChip: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: `${colors.brand.primary}10`,
  paddingHorizontal: spacing[3],
  paddingVertical: spacing[2],
  borderRadius: borderRadius.full,
  gap: spacing[2],
  maxWidth: 180,
},
routeChipText: {
  fontSize: typography.size.xs,
  fontWeight: typography.weight.semibold,
  color: colors.brand.primary,
},
```

---

## Testing Checklist

### Visual Testing
- [ ] Route polylines render correctly with proper colors
- [ ] Route start/end markers appear at correct locations
- [ ] Selected route has thicker stroke width
- [ ] Off-route events appear dimmed (50% opacity)
- [ ] High-severity on-route events stand out
- [ ] Route detail sheet displays correct information

### Interaction Testing
- [ ] Tapping route polyline selects route and shows detail sheet
- [ ] Tapping map background deselects route
- [ ] Tapping event marker shows event detail
- [ ] Route detail sheet shows only events on that route
- [ ] "Affects your routes" section shows in event detail
- [ ] Close button on sheets works correctly

### Performance Testing
- [ ] No lag when rendering multiple routes (test with 5 routes)
- [ ] Map panning/zooming remains smooth
- [ ] Event filtering doesn't cause frame drops
- [ ] Sheet animations are smooth (60fps)

### Edge Cases
- [ ] User with no saved routes (empty state)
- [ ] User with 1 route
- [ ] Route with 0 events
- [ ] Route with 10+ events
- [ ] Overlapping routes
- [ ] Events equidistant from multiple routes

---

## Performance Optimization Notes

### Memoization
Use `React.useMemo` for expensive calculations:
```typescript
const routeRiskScores = React.useMemo(() => {
  return userRoutes?.map(route => ({
    routeId: route._id,
    score: calculateRouteRiskScore(route, events)
  }));
}, [userRoutes, events]);
```

### Virtualization
If user has many routes (5+), consider rendering only visible routes:
```typescript
// Only render routes within current map viewport
const visibleRoutes = userRoutes?.filter(route => {
  // Check if route intersects current map region
  return isRouteInViewport(route, mapRegion);
});
```

### Debouncing
Debounce risk recalculation when events update frequently:
```typescript
const debouncedEvents = useDebounce(events, 500); // 500ms delay
```

---

## Next Steps

1. **Implement Phase 1** (route polylines) - This is the critical foundation
2. **User test with 5-10 users** - Validate that route visibility solves the core problem
3. **Iterate on filtering logic** - Adjust 2km threshold based on feedback
4. **Implement Phase 2** (event filtering) - Reduce visual clutter
5. **Add route detail sheet** - Provide route-specific insights
6. **Polish animations** - Add pulse effect for high-severity on-route events

---

## Questions & Troubleshooting

### Q: What if routes database doesn't have polyline data?
A: Start with straight line between from/to points. Later enhancement can fetch actual route polyline from HERE API.

### Q: How to handle overlapping routes?
A: Use z-index based on selection state. Selected route = highest z-index.

### Q: Should we cluster on-route events?
A: No, on-route events should always be visible individually (unless low severity). Only cluster off-route events.

### Q: What if event is equidistant from multiple routes?
A: Show it as affecting all routes within threshold. User can see which routes in event detail sheet.

---

**Last Updated:** February 5, 2026
**Implementation Status:** Ready to start Phase 1
