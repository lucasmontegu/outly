# Map Components

This directory contains specialized components for the map screen.

## Components

### AlertCarousel

A horizontal carousel of alert cards displayed at the bottom of the map screen.

**Location:** `alert-carousel.tsx`

**Quick Start:**
```typescript
import { AlertCarousel } from "@/components/map/alert-carousel";

<AlertCarousel
  alerts={events}
  userLocation={{ lat: 37.7749, lng: -122.4194 }}
  onAlertSelect={(alert) => handleAlertSelect(alert)}
/>
```

**Props:**
- `alerts` - Array of alert items to display
- `userLocation` - Current user location for distance calculations
- `userRoutes` - Optional saved routes for "On route" indicators
- `onAlertSelect` - Callback when alert is tapped
- `selectedAlertId` - Optional ID of currently selected alert
- `userVotes` - Optional map of eventId to hasVoted status

**Features:**
- 280×120px cards with 12px gap
- Snap-to-card horizontal scrolling
- Severity-colored icons and backgrounds
- Distance/"On your route" badges
- Selection highlighting with animation
- Pagination dots
- Platform-specific blur (iOS) / solid (Android)
- Haptic feedback
- Automatic sorting (route alerts first)

## Documentation

- **ALERT_CAROUSEL_GUIDE.md** - Complete guide with API, design rationale, and integration
- **ALERT_CAROUSEL_VISUAL_REFERENCE.md** - Visual specs, anatomy, colors, and styling
- **alert-carousel-example.tsx** - Integration examples with different patterns
- **IMPLEMENTATION_CHECKLIST.md** - Step-by-step integration and testing checklist

## Design Tokens

All components use tokens from `@/lib/design-tokens`:
- Colors: `colors.brand`, `colors.risk`, `colors.text`, `colors.slate`
- Spacing: `spacing[1-24]`
- Border Radius: `borderRadius.xl`, `borderRadius.full`
- Typography: `typography.size`, `typography.weight`
- Shadows: `shadows.lg`, `shadows.xl`

## Integration Pattern

1. Import component
2. Pass alert data and user location
3. Handle alert selection callback
4. Optional: Pass user routes and votes
5. Component handles all UI, animations, and interactions

## Performance

- Optimized FlatList with `getItemLayout`
- `removeClippedSubviews` on Android
- Memoized enrichment and sorting
- Efficient rendering with `initialNumToRender={3}`

## Accessibility

- Proper `accessibilityRole` and `accessibilityLabel`
- Haptic feedback on interactions
- High contrast text and icons
- Clear touch targets (280×120)

## Platform Support

- iOS 13+ (with BlurView)
- Android 6+ (solid background)
- Expo SDK 54+
- React Native 0.75+

## Testing

See IMPLEMENTATION_CHECKLIST.md for complete testing checklist including:
- Functional tests
- Visual tests
- Platform-specific tests
- Edge cases
- Accessibility tests

## Future Components

This directory can house additional map-specific components:
- Custom marker components
- Route polyline renderers
- Location search bars
- Map control panels
- Filter/sort UI for alerts
