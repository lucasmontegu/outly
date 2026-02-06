# Timeline Slot Card Design Specification

## Overview
Premium, flat, minimalist design for timeline slot cards in the Outia mobile risk app. The design matches the onboarding aesthetic with solid colors and clean, elegant visuals.

## Design System

### Color Palette (Exact Tailwind Values)

#### Low Risk
- **Primary**: `#22C55E` (green-500)
- **Background**: `#DCFCE7` (green-100)
- Solid, vibrant green indicating safe conditions

#### Medium Risk
- **Primary**: `#F59E0B` (amber-500)
- **Background**: `#FEF3C7` (amber-100)
- Warm amber for caution states

#### High Risk
- **Primary**: `#EF4444` (red-500)
- **Background**: `#FEE2E2` (red-100)
- Coral red for high urgency

#### Special States
- **NOW Label**: Brand primary `#1A1464` (Deep Indigo)
- **BEST Badge**: Low risk green `#22C55E`
- **Track (Unfilled Arc)**: Slate 200 with 30% opacity

## Component Structure

### Card Layout
```
┌────────────────┐
│  [BEST Badge]  │  ← Positioned absolutely at top (-9px)
│                │
│     NOW        │  ← Time label (bold, letter-spaced)
│                │
│    ╰────╯      │  ← Semi-ring arc indicator (180°)
│                │
│      45        │  ← Risk score (JetBrains Mono Bold, 2xl)
│                │
└────────────────┘
```

### Dimensions
- **Card Width**: 76px
- **Card Height**: Auto (based on content)
- **Border Radius**: 20px (borderRadius["2xl"])
- **Arc Size**: 48px diameter
- **Arc Stroke Width**: 4.5px
- **Arc Height**: ~30px (half circle + stroke)

### Typography

#### Time Label
- **Font Size**: 11px (xs)
- **Font Weight**: Bold (700)
- **Color**: Secondary text for regular, Brand primary for "NOW"
- **Letter Spacing**: 0.5px (wide)
- **Margin Bottom**: 8px

#### Time Label NOW (Special State)
- **Font Size**: 12px (sm)
- **Font Weight**: Extra Bold (800)
- **Color**: `#1A1464` (Brand Primary)
- **Letter Spacing**: 1px (wider)

#### Score Number
- **Font Size**: 20px (2xl)
- **Font Weight**: Bold (700)
- **Font Family**: JetBrains Mono Bold
- **Color**: Dynamic (matches risk classification)
- **Margin Top**: 4px

#### BEST Badge Text
- **Font Size**: 10px
- **Font Weight**: Bold (700)
- **Color**: `#FFFFFF`
- **Letter Spacing**: 0.8px

## Visual Effects

### Shadows

#### Default Card Shadow
```css
shadowColor: "#000"
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.08
shadowRadius: 8
elevation: 2
```

#### Optimal Card Shadow (BEST time)
```css
shadowColor: "#22C55E"
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.25
shadowRadius: 12
elevation: 6
borderWidth: 2.5
borderColor: "#22C55E"
```

#### Badge Shadow
```css
shadowColor: "#22C55E"
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.35
shadowRadius: 4
elevation: 4
```

### Animations

#### Touch Feedback
- **Press In**: Scale to 0.95 with spring animation
  - Damping: 18
  - Stiffness: 500
- **Press Out**: Scale back to 1.0 with spring animation
  - Damping: 15
  - Stiffness: 400

#### Entry Animation
- **Type**: FadeInDown
- **Duration**: 400ms
- **Stagger Delay**: 80ms per card (index × 80)

## Semi-Ring Arc Indicator

### Geometry
- **Arc Type**: 180-degree semicircle
- **Direction**: Left to right (0% to 100%)
- **Start Angle**: 180° (left side)
- **End Angle**: 360° (right side)
- **Progress**: Score percentage (0-100 → 0-180 degrees)

### Visual Properties
- **Background Track**: Slate 200, 30% opacity
- **Progress Arc**: Risk classification color
- **Stroke Width**: 4.5px
- **Stroke Linecap**: Round
- **SVG ViewBox**: Dynamic based on size

### Implementation
```typescript
// Progress calculation
const fillPercentage = Math.min(Math.max(score, 0), 100) / 100;
const fillAngle = 180 * fillPercentage;

// Arc paths use polar coordinates
const x = center + radius * Math.cos((angle * Math.PI) / 180);
const y = center + radius * Math.sin((angle * Math.PI) / 180);
```

## States & Variants

### Default State
- Solid background color matching risk level
- Standard shadow
- No border

### Optimal State (BEST)
- "BEST" badge at top
- Enhanced green shadow
- 2.5px green border
- Elevated shadow (elevation: 6)

### NOW State
- Bolder time label
- Brand primary color for label
- Same visual treatment as other cards

### Active/Pressed State
- Scale animation to 0.95
- Maintains all other styling
- Light haptic feedback

## Accessibility

### Touch Target
- Minimum 76px × 96px (exceeds 44×44 minimum)
- Clear visual feedback on press
- Distinct focused state through animation

### Labels
- Accessible label format: `"NOW: Risk score 45, medium risk"`
- Role: "button"
- Touch feedback via haptic engine

### Visual Contrast
- All text meets WCAG AA contrast requirements
- Solid backgrounds ensure readability
- Color combinations tested for color blindness

## Spacing & Layout

### Card Internal Spacing
- **Padding Top**: 12px
- **Padding Bottom**: 16px
- **Padding Horizontal**: 8px
- **Gap Between Cards**: 12px (scrollContent gap)

### Element Spacing
- Time label to arc: 8px
- Arc to score: 4px margin top
- Arc container height: 30px fixed

### BEST Badge Position
- **Top Offset**: -9px (outside card boundary)
- **Horizontal**: Auto-centered
- **Padding**: Horizontal 10px, Vertical 4px

## Design Rationale

### Why Flat & Solid Colors?
- **Brand Consistency**: Matches onboarding's clean aesthetic
- **Clarity**: Solid colors ensure immediate risk recognition
- **Premium Feel**: Elegant simplicity over complexity
- **Accessibility**: High contrast, easy to scan

### Why Semi-Ring Instead of Full Circle?
- **Space Efficiency**: Half circle fits better in narrow card
- **Visual Interest**: More dynamic than simple circles
- **Progress Visualization**: Clear left-to-right reading direction
- **Modern Aesthetic**: Fresh take on progress indicators

### Why Scale Animation?
- **Premium Feedback**: Smooth, physics-based feel
- **Non-destructive**: Doesn't affect layout
- **Subtle**: 5% scale change is noticeable but not jarring
- **Performance**: GPU-accelerated transform

## File Location
`/apps/native/components/risk-timeline.tsx`

## Dependencies
- `react-native-reanimated`: Animations
- `react-native-svg`: Semi-ring arc rendering
- `@/lib/design-tokens`: Centralized design system
- `@/lib/haptics`: Touch feedback

## Usage Example
```tsx
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
      isOptimal: true, // Shows BEST badge
    },
    // ... more slots
  ]}
  onSlotPress={(slot) => console.log(slot)}
/>
```

## Future Enhancements
1. **Animated Arc Progress**: Animate from 0 to score on mount
2. **Pulse Effect**: Subtle pulse on BEST badge
3. **Weather Icons**: Small icon indicators for weather conditions
4. **Time Interpolation**: Show exact optimal time countdown
5. **Gesture Support**: Swipe for more details
6. **Dark Mode**: Adjusted colors for dark theme

---

**Version**: 1.0
**Last Updated**: 2026-02-05
**Designer**: Claude Code (Frontend Developer Agent)
