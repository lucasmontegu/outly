# Minimized Alerts State - Quick Reference

## Visual Layout

```
┌──────────────────────────────────────────────┐
│    ════════                                  │  Drag handle (36px × 4px)
│                                              │
│  12 alerts nearby               ●●●●●        │  Summary + Severity dots
│  ───────────────               ─────────     │
│  Bold base (14px)              8px circles   │
│  + tertiary sm (12px)                        │
│                                              │
│  Padding: 20px H, 12px V                     │
└──────────────────────────────────────────────┘
```

## Snap Points

```typescript
const snapPoints = useMemo(() => ["15%", "50%", "90%"], []);
```

- **15%** - Minimized (summary view)
- **50%** - Half (preview with 8-10 alerts)
- **90%** - Full (complete scrollable list)

## State Tracking

```typescript
const [currentSnapIndex, setCurrentSnapIndex] = useState(0);
```

Updated in `onChange` handler:
```typescript
onChange={(index) => {
  setCurrentSnapIndex(index);
  if (index > 0) lightHaptic();
}}
```

## Severity Distribution Logic

```typescript
const severityDistribution = useMemo(() => {
  const distribution = { high: 0, medium: 0, low: 0 };
  sortedAlerts.forEach((alert) => {
    if (alert.severity >= 4) distribution.high++;
    else if (alert.severity >= 3) distribution.medium++;
    else distribution.low++;
  });
  return distribution;
}, [sortedAlerts]);
```

## Minimized View JSX

```tsx
{currentSnapIndex === 0 ? (
  <View style={styles.minimizedContainer}>
    <TouchableOpacity
      style={styles.minimizedContent}
      onPress={() => bottomSheetRef.current?.snapToIndex(1)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${sortedAlerts.length} alerts. Tap to expand.`}
    >
      <View style={styles.minimizedTextContainer}>
        <Text style={styles.minimizedCount}>
          {sortedAlerts.length} alert{sortedAlerts.length !== 1 ? "s" : ""}
        </Text>
        <Text style={styles.minimizedLabel}>
          {sortedAlerts.some((a) => a.onRoute) ? "on your route" : "nearby"}
        </Text>
      </View>

      <View style={styles.severityDots}>
        {severityDistribution.high > 0 &&
          Array.from({ length: Math.min(severityDistribution.high, 5) }).map((_, i) => (
            <View
              key={`high-${i}`}
              style={[styles.severityDot, { backgroundColor: colors.risk.high.primary }]}
            />
          ))}
        {/* medium and low dots follow same pattern */}
      </View>
    </TouchableOpacity>
  </View>
) : (
  /* Expanded view with header and list */
)}
```

## Styles

```typescript
// Drag handle (updated from 40px to 36px)
handleIndicator: {
  backgroundColor: colors.slate[300],
  width: 36,
  height: 4,
}

// Minimized container
minimizedContainer: {
  paddingHorizontal: spacing[5],    // 20px
  paddingVertical: spacing[3],      // 12px
}

minimizedContent: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

minimizedTextContainer: {
  flexDirection: "row",
  alignItems: "baseline",
  gap: spacing[2],                  // 8px
}

minimizedCount: {
  fontSize: typography.size.base,   // 14px
  fontWeight: typography.weight.bold,  // 700
  color: colors.text.primary,       // #111827
}

minimizedLabel: {
  fontSize: typography.size.sm,     // 12px
  fontWeight: typography.weight.medium,  // 500
  color: colors.text.tertiary,      // #9CA3AF
}

severityDots: {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing[1],                  // 4px
}

severityDot: {
  width: 8,
  height: 8,
  borderRadius: borderRadius.full,  // 9999
}
```

## Color Mapping

```typescript
// High severity (4-5)
colors.risk.high.primary     // #E63946 (Coral Red)

// Medium severity (3)
colors.risk.medium.primary   // #F4A261 (Warm Amber)

// Low severity (1-2)
colors.state.info            // #3B82F6 (Info Blue)
```

## User Interactions

| Action | Result |
|--------|--------|
| Tap minimized area | Expands to 50% |
| Swipe up from minimized | Expands to 50% or 90% |
| Swipe down from expanded | Collapses toward 15% |
| Tap alert in list | Map centers + collapses to 15% |
| Tap outside (backdrop) | Collapses to 15% |

## Conditional Label Logic

```typescript
{sortedAlerts.some((a) => a.onRoute) ? "on your route" : "nearby"}
```

- **"on your route"** - If any alerts fall on saved routes
- **"nearby"** - If all alerts are not on routes

## Dot Rendering Logic

```typescript
Math.min(severityDistribution.high, 5)
```

- Shows maximum 5 dots per severity level
- Prevents visual clutter with many alerts
- Dots render in order: high → medium → low

## Accessibility

```typescript
accessibilityRole="button"
accessibilityLabel={`${sortedAlerts.length} alerts. Tap to expand.`}
```

Screen reader announces:
- "12 alerts. Tap to expand. Button."

## Performance Notes

- Severity distribution computed with `useMemo`
- Only recalculates when `sortedAlerts` changes
- Minimized view prevents FlatList rendering at 15%
- Tap to expand triggers smooth animation (no lag)

## Integration Example

```tsx
// In map.tsx
<AlertsListSheet
  alerts={events}
  userLocation={location}
  userRoutes={userRoutes}
  mapRef={mapRef}
  onAlertSelect={handleAlertSelect}
/>
```

No prop changes needed - minimized state works automatically.

## Testing Commands

```bash
# Type check
npm run check-types

# Build native app
npm run build -- --filter=native

# Development
npm run dev:native
```

## Key Design Tokens Used

| Token | Value | Usage |
|-------|-------|-------|
| `spacing[1]` | 4px | Dot gap |
| `spacing[2]` | 8px | Text gap |
| `spacing[3]` | 12px | Vertical padding |
| `spacing[5]` | 20px | Horizontal padding |
| `typography.size.sm` | 12px | Label text |
| `typography.size.base` | 14px | Count text |
| `borderRadius.full` | 9999 | Dots |
| `colors.slate[300]` | #CBD5E1 | Drag handle |

## Files Modified

1. `/apps/native/components/alerts-list-sheet.tsx`
2. `/apps/native/components/ALERTS_LIST_SHEET_GUIDE.md`
3. `/apps/native/components/ALERTS_LIST_IMPLEMENTATION.md`

## New Files Created

1. `/apps/native/components/MINIMIZED_ALERTS_FEATURE.md`
2. `/apps/native/components/MINIMIZED_STATE_QUICK_REF.md` (this file)

## Common Issues

**Issue**: Dots don't show
**Fix**: Check `severityDistribution` has values > 0

**Issue**: Sheet doesn't collapse to 15%
**Fix**: Verify snap point is "15%" (string, not number)

**Issue**: Wrong label appears
**Fix**: Check `userRoutes` prop is passed and populated

**Issue**: Tap doesn't expand
**Fix**: Ensure `bottomSheetRef.current?.snapToIndex(1)` is called

## Summary

The minimized state provides instant visual context about nearby alerts without blocking the map view. The 15% snap point with severity dots creates a clean, scannable interface that encourages exploration while maintaining focus on the map.

**Design Philosophy:**
- Show, don't tell (dots > numbers)
- Tap to learn more (progressive disclosure)
- Don't block the map (minimal footprint)
- Make it feel native (smooth animations)

Ready to ship. ✅
