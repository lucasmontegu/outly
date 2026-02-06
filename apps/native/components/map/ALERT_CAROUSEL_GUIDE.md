# Alert Carousel Component Guide

## Overview

The `AlertCarousel` component provides an alternative horizontal carousel view for displaying alerts at the bottom of the map screen. It's designed as a modern, space-efficient alternative to the `AlertsListSheet` component.

## Design Specifications

- **Card Size:** 280px width × 120px height
- **Gap:** 12px between cards
- **Snap Behavior:** Smooth horizontal scroll with snap-to-card
- **Platform Optimization:**
  - iOS: BlurView with 90 intensity
  - Android: Solid white background

## Features

- ✅ Horizontal scrollable cards with snap-to-card behavior
- ✅ Severity-colored icon backgrounds (high/medium/low)
- ✅ Distance badges ("1.2km" or "On your route" indicator)
- ✅ Severity indicators (colored dots)
- ✅ Vote CTA ("Tap to vote") for unvoted alerts
- ✅ Selected card highlighting with border and scale animation
- ✅ Pagination dots for multiple alerts
- ✅ Haptic feedback on interaction
- ✅ Automatic sorting (route alerts first, then by distance)
- ✅ Performance optimized with FlatList

## Component API

```typescript
type AlertCarouselProps = {
  alerts: AlertItem[];
  userLocation: { lat: number; lng: number };
  userRoutes?: UserRoute[];
  onAlertSelect: (alert: AlertItem) => void;
  selectedAlertId?: string;
  userVotes?: Record<string, boolean>; // eventId -> hasVoted
};
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `alerts` | `AlertItem[]` | Yes | Array of alerts to display |
| `userLocation` | `{ lat: number; lng: number }` | Yes | Current user location for distance calculations |
| `userRoutes` | `UserRoute[]` | No | User's saved routes for "On route" indicator |
| `onAlertSelect` | `(alert: AlertItem) => void` | Yes | Callback when alert is tapped |
| `selectedAlertId` | `string` | No | ID of currently selected alert (for highlighting) |
| `userVotes` | `Record<string, boolean>` | No | Map of eventId to hasVoted status for vote CTAs |

## Integration Example

Replace or add alongside `AlertsListSheet` in `map.tsx`:

```typescript
import { AlertCarousel } from "@/components/map/alert-carousel";
import type { AlertItem } from "@/components/map/alert-carousel";

// In your MapScreen component:
export default function MapScreen() {
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);

  // Query user votes if needed
  const userVotes = useQuery(api.confirmations.getMyVotes) || {};

  // ... rest of your map setup

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView ref={mapRef} ...>
        {/* markers, circles, etc */}
      </MapView>

      {/* Alert Carousel - positioned at bottom */}
      {events && events.length > 0 && location && (
        <AlertCarousel
          alerts={events as AlertItem[]}
          userLocation={location}
          userRoutes={userRoutes}
          onAlertSelect={(alert) => setSelectedEventId(alert._id as Id<"events">)}
          selectedAlertId={selectedEventId || undefined}
          userVotes={userVotes}
        />
      )}

      {/* Event detail sheet when alert is selected */}
      {selectedEvent && (
        <EventDetailSheet
          event={selectedEvent}
          myVote={myVote}
          isVoting={isVoting}
          justVoted={justVoted}
          onVote={handleVote}
          onClose={() => setSelectedEventId(null)}
        />
      )}
    </View>
  );
}
```

## Design Rationale

### Why Carousel vs List Sheet?

1. **Visual Prominence**: Cards are always visible, not hidden in a collapsed sheet
2. **Quick Scanning**: Horizontal swipe is more natural for browsing nearby alerts
3. **Screen Real Estate**: Takes less vertical space than bottom sheet
4. **Modern UX**: Carousel pattern is familiar from maps apps (Google Maps, Apple Maps)
5. **At-a-Glance**: Shows one alert in focus with clear pagination

### Card Design Decisions

- **52px Icon Container**: Large enough to be recognizable, severity-colored background for quick identification
- **On Route Badge**: High-visibility blue badge replaces distance for route alerts
- **Severity Dot**: Simple 8px colored dot provides quick severity scan without cluttering
- **Vote CTA**: Subtle "Tap to vote" encourages community participation
- **White/Blur Background**: Ensures readability over any map content

## Accessibility

- Proper `accessibilityRole="button"` on cards
- Descriptive `accessibilityLabel` with all key info
- Haptic feedback on interactions (medium for selection, light for pagination)
- High contrast text and icons

## Performance Optimizations

- FlatList with `getItemLayout` for smooth scrolling
- `removeClippedSubviews` on Android
- `initialNumToRender={3}` and `maxToRenderPerBatch={3}`
- Memoized enrichment and sorting
- `windowSize={5}` for optimal memory usage

## Alternative: Switching Between Carousel and List

If you want to provide both views with a toggle:

```typescript
const [viewMode, setViewMode] = useState<"carousel" | "list">("carousel");

// Toggle button in header
<TouchableOpacity onPress={() => setViewMode(prev => prev === "carousel" ? "list" : "carousel")}>
  <HugeiconsIcon icon={viewMode === "carousel" ? ListIcon : CardsIcon} />
</TouchableOpacity>

// Conditional rendering
{viewMode === "carousel" ? (
  <AlertCarousel
    alerts={events}
    userLocation={location}
    onAlertSelect={handleAlertSelect}
  />
) : (
  <AlertsListSheet
    alerts={events}
    userLocation={location}
    mapRef={mapRef}
    onAlertSelect={handleAlertSelect}
  />
)}
```

## Styling Customization

All styles use design tokens from `@/lib/design-tokens`. Key customization points:

- `CARD_WIDTH`: Default 280px
- `CARD_HEIGHT`: Default 120px
- `CARD_GAP`: Default 12px
- `CAROUSEL_PADDING`: Default 16px (side padding)
- Shadow: Uses `shadows.lg` for cards, `shadows.xl` for selected

## Known Limitations

- Carousel works best with 1-10 alerts (performance tested up to 50)
- On small screens (<350px width), cards may need width adjustment
- Blur effect only on iOS (Android uses solid white)
- Pagination dots hidden when only 1 alert

## Next Steps

- Add swipe-to-dismiss gesture for clearing alerts
- Implement pull-to-refresh on carousel
- Add filter chips above carousel (weather/traffic toggle)
- Animate card entry/exit when alerts are added/removed
- Add long-press for quick vote menu
