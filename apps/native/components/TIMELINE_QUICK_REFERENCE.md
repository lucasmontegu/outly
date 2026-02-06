# Timeline Slot Cards - Quick Reference

## Color Palette (Copy-Paste Ready)

### Risk Level Colors
```typescript
// Low Risk - Green
primary: "#22C55E"      // green-500
background: "#DCFCE7"   // green-100

// Medium Risk - Amber
primary: "#F59E0B"      // amber-500
background: "#FEF3C7"   // amber-100

// High Risk - Red
primary: "#EF4444"      // red-500
background: "#FEE2E2"   // red-100
```

### Special Colors
```typescript
nowLabel: "#1A1464"     // Brand primary (Deep Indigo)
bestBadge: "#22C55E"    // Same as low risk green
trackColor: "#E2E8F0"   // Slate 200 at 30% opacity
```

---

## Key Measurements

### Card Dimensions
```typescript
width: 76px
paddingTop: 12px
paddingBottom: 16px
paddingHorizontal: 8px
borderRadius: 20px
```

### Semi-Ring Arc
```typescript
size: 48px (diameter)
strokeWidth: 4.5px
height: ~30px (semicircle)
```

### Typography
```typescript
// Time Label
fontSize: 11px (xs)
fontWeight: "700" (bold)
letterSpacing: 0.5px

// Time Label NOW
fontSize: 12px (sm)
fontWeight: "800" (extrabold)
letterSpacing: 1px

// Score Number
fontSize: 20px (2xl)
fontWeight: "700" (bold)
fontFamily: "JetBrainsMono_700Bold"

// BEST Badge
fontSize: 10px
fontWeight: "700" (bold)
letterSpacing: 0.8px
```

---

## Shadow Values

### Default Card
```typescript
shadowColor: "#000"
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.08
shadowRadius: 8
elevation: 2
```

### Optimal Card (BEST)
```typescript
shadowColor: "#22C55E"
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.25
shadowRadius: 12
elevation: 6
borderWidth: 2.5
borderColor: "#22C55E"
```

### Badge Shadow
```typescript
shadowColor: "#22C55E"
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.35
shadowRadius: 4
elevation: 4
```

---

## Animation Values

### Touch Feedback (Scale)
```typescript
// Press In
scale.value = withSpring(0.95, {
  damping: 18,
  stiffness: 500,
})

// Press Out
scale.value = withSpring(1, {
  damping: 15,
  stiffness: 400,
})
```

### Entry Animation
```typescript
FadeInDown
  .duration(400)
  .delay(index * 80)
```

---

## Component Props

```typescript
type TimeSlot = {
  time: string;           // e.g., "6:30"
  label: string;          // e.g., "NOW" or "6:30 PM"
  score: number;          // 0-100
  classification: "low" | "medium" | "high";
  isNow?: boolean;        // Shows "NOW" label in brand color
  isOptimal?: boolean;    // Shows "BEST" badge + enhanced styling
};

type RiskTimelineProps = {
  slots: TimeSlot[];
  onSlotPress?: (slot: TimeSlot) => void;
};
```

---

## Usage Example

```tsx
import { RiskTimeline } from "@/components/risk-timeline";

<RiskTimeline
  slots={[
    {
      time: "14:30",
      label: "NOW",
      score: 45,
      classification: "medium",
      isNow: true,
      isOptimal: false,
    },
    {
      time: "15:00",
      label: "3:00 PM",
      score: 28,
      classification: "low",
      isNow: false,
      isOptimal: true, // BEST time
    },
    {
      time: "15:30",
      label: "3:30 PM",
      score: 62,
      classification: "high",
      isNow: false,
      isOptimal: false,
    },
  ]}
  onSlotPress={(slot) => {
    console.log(`Selected: ${slot.label}, Score: ${slot.score}`);
  }}
/>
```

---

## Customization Guide

### Change Card Width
```typescript
// In styles.slotCard
width: 80,  // Default: 76
```

### Adjust Arc Size
```typescript
// In TimeSlotCard component
<SemiRingArc size={52} ... />  // Default: 48

// Also update arcContainer height
arcContainer: {
  height: 32,  // Adjust based on new arc size
}
```

### Modify Score Font Size
```typescript
// In styles.scoreText
fontSize: typography.size.xl,  // Default: typography.size["2xl"]
```

### Change BEST Badge Position
```typescript
// In styles.bestBadge
top: -10,  // Default: -9 (negative values move up)
```

### Adjust Card Spacing
```typescript
// In styles.scrollContent
gap: spacing[4],  // Default: spacing[3] (12px)
```

---

## Accessibility Checklist

✅ Touch target: 76×96px (exceeds 44×44 minimum)
✅ Accessible labels: `"NOW: Risk score 45, medium risk"`
✅ Role: "button"
✅ Haptic feedback on press
✅ High contrast text (WCAG AA compliant)
✅ Visual feedback (scale animation)
✅ Screen reader friendly

---

## Common Modifications

### Remove Legend
```tsx
// In RiskTimeline component, comment out or remove:
{/* Legend */}
<View style={styles.legend}>...</View>
```

### Add Custom Badge
```tsx
// In TimeSlotCard, after BEST badge:
{slot.isCustom && (
  <View style={styles.customBadge}>
    <Text style={styles.customText}>NEW</Text>
  </View>
)}
```

### Change Arc to Full Circle
```typescript
// In SemiRingArc component
const bgStartAngle = 0;     // Start from top
const bgEndAngle = 360;     // Full circle
const fillAngle = 360 * fillPercentage;  // 0-360 instead of 0-180

// Update SVG viewBox
<Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
```

---

## Debugging Tips

### Arc Not Showing
- Check that `score > 0`
- Verify SVG imports: `import Svg, { Path } from "react-native-svg"`
- Ensure classification is one of: "low", "medium", "high"

### Animation Not Working
- Verify `react-native-reanimated` is installed and configured
- Check that `useSharedValue` and `withSpring` are imported
- Ensure Reanimated plugin is in babel.config.js

### Colors Look Wrong
- Verify exact hex values (case-sensitive)
- Check that StyleSheet.create is used (not inline styles for complex objects)
- Test on both iOS and Android

### Badge Not Visible
- Check `top: -9` negative value (should be outside card)
- Ensure parent has `overflow: "visible"` (default behavior)
- Verify `position: "absolute"` is set

---

## Files Reference

| File | Purpose |
|------|---------|
| `risk-timeline.tsx` | Main component implementation |
| `TIMELINE_DESIGN_SPEC.md` | Full design specification |
| `TIMELINE_IMPROVEMENTS.md` | Before/after comparison |
| `TIMELINE_QUICK_REFERENCE.md` | This file (quick reference) |

---

## Dependencies

```json
{
  "react": "19.1.0",
  "react-native": "~0.76.5",
  "react-native-reanimated": "~4.0.0",
  "react-native-svg": "15.8.0"
}
```

---

## Performance Notes

- All animations run on UI thread (60 FPS)
- SVG arcs are lightweight (no performance impact)
- Spring animations are GPU-accelerated
- No re-renders on scroll (Animated.View memoization)
- Haptic feedback is non-blocking

---

## Browser/Platform Support

✅ iOS 13+
✅ Android 6.0+ (API 23+)
✅ Expo Go
✅ Expo Dev Client
✅ Production builds

---

**Last Updated**: 2026-02-05
**Component Version**: 1.0
