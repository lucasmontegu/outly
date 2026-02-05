# Outia Map Redesign - Executive Summary

## Problems Identified

Based on the screenshot analysis and 7 parallel agent investigations:

| Problem | Impact | Root Cause |
|---------|--------|------------|
| **749 markers without hierarchy** | Visual overload, cognitive fatigue | No clustering, all markers rendered equally |
| **No user route displayed** | Users can't understand relevance to their commute | Routes table only stores origin/destination, no polyline geometry |
| **Popovers don't work** | Frustrating interaction, broken UX | Markers missing callout configuration |
| **No route-incident correlation** | "Does this affect me?" unanswered | Events fetched by radius, not route proximity |

---

## Solution Architecture

### Visual Hierarchy System

```
┌─────────────────────────────────────────────────────────────┐
│                        MAP VIEW                              │
│                                                              │
│   [Cluster: 24]                              [Cluster: 18]   │
│        ○                                          ○          │
│                                                              │
│              ◉ NEAR (32px, faded)                           │
│                                                              │
│     ════════════════════════════════════════                │
│     ║  USER'S ROUTE (Blue #2563EB, 8px)    ║                │
│     ════════════════════════════════════════                │
│            ⬤ ON-ROUTE (44px, pulse)                         │
│                  ⬤ ON-ROUTE                                  │
│                                                              │
│                      ◉ NEAR                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ━━━━━━━  (handle bar)                                      │
│  5 alerts on your route  ●●● ●●●●● ●●●●                     │
│                         (red)(amber)(green)                  │
│  ↑ Swipe for details                                        │
└─────────────────────────────────────────────────────────────┘
```

### Marker Tiers

| Tier | Condition | Size | Style | Behavior |
|------|-----------|------|-------|----------|
| **Tier 1** | ON user's route (<200m) | 44px | Colored bg + pulse ring + shadow | Always visible, never clustered |
| **Tier 2** | NEAR route (200m-1km) | 32px | Colored bg, 80% opacity | Visible at zoom >12 |
| **Tier 3** | DISTANT (>1km) | 24px | Muted, clustered | Only visible at high zoom |

### Bottom Sheet States

| State | Height | Content |
|-------|--------|---------|
| **Collapsed** | 120px | "X alerts on your route" + severity dots |
| **Half** | 50% | Scrollable list with filter tabs |
| **Full** | 85% | Detailed list + filtering + mini-map |

---

## Implementation Plan

### Phase 1: Route Visualization (Week 1)

**Files to modify:**
- `packages/backend/convex/schema.ts` - Add `routeGeometry` field to routes table
- `packages/backend/convex/routes.ts` - Add mutation to compute route geometry via HERE API
- `apps/native/app/(tabs)/map.tsx` - Render user routes as polylines

**Key code:**
```tsx
// Render user's saved routes
{userRoutes?.map((route) => (
  <Polyline
    key={`route-${route._id}`}
    coordinates={route.routeGeometry?.map(p => ({
      latitude: p.lat,
      longitude: p.lng,
    })) || []}
    strokeColor="#2563EB"
    strokeWidth={6}
    lineCap="round"
  />
))}
```

### Phase 2: Marker Hierarchy + Clustering (Week 2)

**Install:**
```bash
npm install react-native-map-clustering supercluster
```

**New files:**
- `apps/native/hooks/use-clustered-markers.ts`
- `apps/native/components/map/event-marker.tsx`
- `apps/native/components/map/cluster-marker.tsx`
- `apps/native/utils/geo-utils.ts`

**Key features:**
- `isPointNearPolyline()` - Check if event is on user's route
- Categorize events: `{ onRoute, nearby, distant }`
- Cluster distant markers using supercluster

### Phase 3: Bottom Sheet Alert List (Week 3)

**New file:**
- `apps/native/components/alerts-list-sheet.tsx`

**Features:**
- 3-state draggable bottom sheet using @gorhom/bottom-sheet
- FlashList for performant scrolling
- Filter tabs: All | Weather | Traffic
- Sort options: Distance | Severity | Time
- "ON ROUTE" badges

### Phase 4: Performance + Polish (Week 4)

**Optimizations:**
- Switch to `listNearbySlim` query (70% bandwidth savings)
- Add `tracksViewChanges={false}` to all markers
- Memoize components with `React.memo`
- Add `useCallback` to all handlers
- Debounce region changes

**UX Enhancements:**
- expo-haptics for tactile feedback
- Smooth animations with Reanimated 3
- Platform-specific map providers

---

## Design Mockups

Created in Google Stitch: **Project ID: 17569630674558560033**

| Screen | Description |
|--------|-------------|
| Minimized Alerts | Collapsed bottom sheet with summary |
| Alert Carousel View | Horizontal card carousel alternative |
| Expanded List | Full alert list with filters |
| Route + Clusters | Main map with user route and clustered markers |

---

## Key Metrics to Track

| Metric | Current (Est.) | Target |
|--------|----------------|--------|
| Time to identify on-route alerts | >30s | <5s |
| Frame rate during pan | ~35fps | 60fps |
| Memory usage | ~250MB | <150MB |
| Marker render count | 749 | <100 (clustered) |
| User voting participation | baseline | +30% |

---

## Competitor Patterns Adopted

From Waze, Google Maps, Apple Maps, Citymapper:

1. **Marker merging** (Waze) - Cluster overlapping alerts
2. **Traffic layer toggle** (Google) - Separate traffic flow from incidents
3. **Confidence-based display** (Apple) - Only show high-confidence events
4. **Route-specific alerts** (All) - Prioritize incidents on user's route
5. **Multi-state bottom sheet** (Uber/Google) - Collapsed → Half → Full

---

## Files Reference

| Document | Location |
|----------|----------|
| UX Research | `/apps/native/components/MAP_UX_RESEARCH_FINDINGS.md` |
| Visual Design Spec | `/apps/native/components/MAP_VISUALIZATION_DESIGN_SPEC.md` |
| Implementation Guide | `/apps/native/components/MAP_IMPLEMENTATION_GUIDE.md` |
| Alerts Component | `/apps/native/components/alerts-list-sheet.tsx` |
| Geo Utilities | `/apps/native/lib/geo-utils.ts` |

---

## Next Steps

1. **Review this summary** with stakeholders
2. **Approve design mockups** in Stitch
3. **Begin Phase 1** - Route visualization
4. **Schedule user testing** for Week 3
5. **Iterate** based on feedback

---

*Generated by 7 parallel specialist agents analyzing UX research, mobile development, UI design, competitor patterns, performance optimization, and Expo best practices.*
