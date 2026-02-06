# Alerts List Sheet Component Guide

## Overview

The `AlertsListSheet` is a high-performance, draggable bottom sheet component that displays a scannable list of map alerts with intelligent sorting, filtering, and route detection capabilities.

## Features

### Core Functionality
- **Draggable bottom sheet** with three snap points (15%, 50%, 90% of screen)
- **Minimized summary view** - shows alert count and severity distribution with colored dots
- **Performance-optimized** with BottomSheetFlatList (handles 700+ items smoothly)
- **Map synchronization** - tapping an alert centers the map on that location
- **Distance calculation** - shows distance from user's current location
- **Route detection** - highlights alerts that fall on user's saved routes
- **Smart sorting** - by distance, severity, or type
- **Filtering** - show all, weather only, or traffic only
- **Haptic feedback** - tactile responses for all interactions

### Visual Design
- Follows Outia design tokens exactly
- Severity-based color coding (low/medium/high risk colors)
- Visual indicators for alerts on saved routes
- Smooth animations with Reanimated
- Glassmorphic blur effects (iOS)

## Component API

### Props

```typescript
type AlertsListSheetProps = {
  alerts: AlertItem[];              // Array of event/alert objects
  userLocation: Location | null;    // User's current location
  userRoutes?: UserRoute[];         // User's saved routes (optional)
  mapRef?: RefObject<MapView>;      // Reference to map for auto-centering
  onAlertSelect: (alert) => void;   // Callback when alert is tapped
};
```

### AlertItem Type

```typescript
type AlertItem = {
  _id: string;
  type: "weather" | "traffic";
  subtype: string;
  severity: number;                 // 1-5 scale
  confidenceScore: number;          // 0-100
  location: { lat: number; lng: number };
  _creationTime: number;
};
```

### UserRoute Type

```typescript
type UserRoute = {
  _id: string;
  name: string;
  fromLocation: { lat: number; lng: number };
  toLocation: { lat: number; lng: number };
};
```

## Integration Example

```tsx
import { AlertsListSheet } from "@/components/alerts-list-sheet";

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const { location } = useLocation();
  const events = useQuery(api.events.listNearby, ...);
  const userRoutes = useQuery(api.routes.getUserRoutes);
  const [selectedEventId, setSelectedEventId] = useState(null);

  return (
    <View style={{ flex: 1 }}>
      <MapView ref={mapRef} ... />

      {events && location && (
        <AlertsListSheet
          alerts={events}
          userLocation={location}
          userRoutes={userRoutes}
          mapRef={mapRef}
          onAlertSelect={(alert) => {
            setSelectedEventId(alert._id);
            // Show detail sheet, etc.
          }}
        />
      )}
    </View>
  );
}
```

## User Experience Flow

### Minimized State (15% - Collapsed)
- Shows drag handle (pill shape, centered)
- Summary text: "{count} alerts on your route" or "{count} alerts nearby"
- Small colored dots indicating severity distribution (max 5 per severity level)
- Tap anywhere to expand to 50%
- User can swipe up to expand

### Half State (50%)
- Comfortable reading height
- Shows ~8-10 alerts
- Scrollable list
- Full header with filter/sort controls
- Good balance between map and list

### Full State (90%)
- Maximum list view
- Can scroll through all alerts
- Map still visible at top
- Good for browsing many alerts

### Interactions

1. **Tap minimized summary** → Expands to 50% (half state)
2. **Tap alert** → Map centers on location + sheet collapses to 15%
3. **Tap sort button** → Cycles: Distance → Severity → Type
4. **Tap filter button** → Cycles: All → Weather → Traffic
5. **Swipe sheet** → Smooth snap to nearest point
6. **Tap outside (backdrop)** → Collapses to 15%

## Sorting Logic

### Distance (Default)
- Closest alerts first
- **Always prioritizes alerts on saved routes** (they appear first regardless)
- Uses Haversine formula for accurate geo distance

### Severity
- Highest severity (5) to lowest (1)
- Alerts on routes still prioritized

### Type
- Groups by type (traffic/weather)
- Within each group, sorts by distance
- Routes still prioritized

## Route Detection

The component uses geometric calculations to determine if an alert falls on a saved route:

```typescript
isPointNearRoute(
  alertLocation,
  routeStart,
  routeEnd,
  thresholdKm: 1.5  // Default 1.5km radius
)
```

### Algorithm
1. Checks distance to route start/end points
2. Performs bounding box optimization
3. Uses line segment distance approximation
4. Returns true if within threshold

### Visual Indicators
- **"On route" badge** with location icon
- **Route name** displayed (if multiple routes, shows first match)
- **Blue accent color** (brand.secondary)
- **Prioritized in sort order**

## Performance Optimizations

### FlatList Configuration
```typescript
initialNumToRender={10}      // Render first 10 immediately
maxToRenderPerBatch={10}     // Render 10 at a time
windowSize={5}               // Keep 5 viewports in memory
removeClippedSubviews={true} // Android optimization
```

### Memoization
- `enrichedAlerts` - Computed once when alerts/location/routes change
- `filteredAlerts` - Recomputed only when filter changes
- `sortedAlerts` - Recomputed only when sort or filtered data changes
- `renderAlertItem` - Memoized with useCallback

### Distance Calculations
- Computed once during enrichment
- Cached in enriched alert object
- Not recalculated on sort/filter

## Haptic Feedback

| Action | Haptic Type | Feel |
|--------|-------------|------|
| Tap alert | Medium impact | Satisfying click |
| Change sort | Light impact | Subtle feedback |
| Change filter | Light impact | Subtle feedback |
| Expand sheet | Light impact | Smooth transition |

## Styling & Design

### Color System
- **High severity** - Coral Red (#E63946)
- **Medium severity** - Warm Amber (#F4A261)
- **Low severity** - Info Blue (#3B82F6)
- **On route** - Indigo Blue (#4B3BF5)

### Typography
- **Alert title** - base size, semibold
- **Distance** - sm size, medium weight
- **Severity badge** - xs size, semibold
- **Header** - xl size, bold

### Spacing
- Uses consistent spacing scale (4px increments)
- Card padding: 12px (spacing[3])
- List padding: 16px horizontal (spacing[4])
- Gap between items: 4px (spacing[1])

## Accessibility

### ARIA Labels
```tsx
accessibilityLabel={`${item.formattedSubtype} alert, ${item.distanceLabel} away, severity ${item.severity}`}
accessibilityRole="button"
```

### Screen Reader Support
- Descriptive labels on all interactive elements
- Alert count announced in header
- Filter/sort state announced on change

### Keyboard Navigation
- Automatically handled by BottomSheet
- Focus management on sheet expansion

## Dependencies

```json
{
  "@gorhom/bottom-sheet": "^5.2.8",
  "expo-blur": "~15.0.8",
  "expo-haptics": "~15.0.8",
  "react-native-reanimated": "~4.1.1",
  "react-native-maps": "1.20.1"
}
```

## Files Created

1. **`/apps/native/components/alerts-list-sheet.tsx`** - Main component
2. **`/apps/native/lib/geo-utils.ts`** - Distance calculation utilities
3. **`/apps/native/components/ALERTS_LIST_SHEET_GUIDE.md`** - This guide

## Future Enhancements

### Potential Features
- [ ] Search/filter by alert name
- [ ] Time-based filtering (last hour, today, etc.)
- [ ] Cluster view for high-density areas
- [ ] Swipe-to-dismiss for individual alerts
- [ ] Pull-to-refresh for live updates
- [ ] Share alert functionality
- [ ] Bookmark/save alerts
- [ ] Alert detail quick view (long press)

### Performance Ideas
- [ ] Virtual scrolling for 1000+ alerts
- [ ] Debounced search input
- [ ] Lazy load route calculations
- [ ] Web worker for heavy computations

## Troubleshooting

### Sheet doesn't appear
- Ensure `alerts.length > 0`
- Check `userLocation` is not null
- Verify BottomSheet provider is in layout tree

### Map doesn't center on tap
- Confirm `mapRef` is passed correctly
- Check ref is attached to MapView
- Verify `animateToRegion` is supported on platform

### "On route" not showing
- Ensure `userRoutes` prop is passed
- Check routes have valid from/to locations
- Verify threshold (1.5km) is appropriate for use case

### Performance issues
- Check alert count (>1000 may need virtual scrolling)
- Verify `removeClippedSubviews` on Android
- Consider reducing `windowSize` if memory constrained

## Testing Checklist

- [ ] Drag sheet between snap points smoothly
- [ ] Tap alert centers map correctly
- [ ] Distance calculations accurate (compare with map)
- [ ] "On route" appears for alerts on saved routes
- [ ] Sort cycling works: distance → severity → type
- [ ] Filter cycling works: all → weather → traffic
- [ ] Haptics fire on all interactions
- [ ] Empty state shows when no alerts
- [ ] Severity colors correct (red/amber/blue)
- [ ] Performance smooth with 700+ alerts
- [ ] Accessibility labels announced correctly
- [ ] Works on both iOS and Android

## Questions?

Contact the frontend team or check:
- Outia design system: `/apps/native/lib/design-tokens.ts`
- Haptics guide: `/apps/native/lib/haptics.ts`
- Location hook: `/apps/native/hooks/use-location.ts`
