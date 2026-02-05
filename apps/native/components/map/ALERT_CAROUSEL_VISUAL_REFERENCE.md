# Alert Carousel Visual Reference

## Component Anatomy

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                   MAP AREA                      │
│                                                 │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
                       ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Card 1  │  │  Card 2  │  │  Card 3  │  ← Horizontal scroll
│  280x120 │  │  280x120 │  │  280x120 │
└──────────┘  └──────────┘  └──────────┘
    ↑             ↑             ↑
 12px gap     Selected      12px gap
                (border)

       ● ● ○ ○ ○  ← Pagination dots
```

## Card Structure (280px × 120px)

```
┌──────────────────────────────────────────┐
│ ┌────┐  Heavy Rain                       │  ← Title (semibold, base)
│ │ ☁️ │                                    │
│ │52px│  ╭─────────╮  ●                   │  ← Badges row
│ │icon│  │ 2.3km   │  severity dot        │
│ └────┘  ╰─────────╯                      │
│                                           │
│         ✓ Tap to vote                    │  ← Vote CTA (if not voted)
└──────────────────────────────────────────┘
```

## Icon Container (52px × 52px)

```
┌────────────┐
│  ╭──────╮  │  ← Severity-colored background
│  │      │  │     • High: #FDEBED (light coral)
│  │  ☁️  │  │     • Medium: #FFF4ED (light amber)
│  │ 24px │  │     • Low: rgba(info, 0.15)
│  │ icon │  │
│  ╰──────╯  │
└────────────┘
```

## Badge Types

### Distance Badge
```
╭────────────╮
│ → 2.3km    │  ← Navigation icon + distance
╰────────────╯
Background: slate.100 (#F1F5F9)
Text: text.tertiary (#9CA3AF)
```

### On Route Badge
```
╭──────────────────╮
│ → On your route  │  ← Navigation icon + text
╰──────────────────╯
Background: rgba(brand.secondary, 0.15) (#4B3BF515)
Text: brand.secondary (#4B3BF5)
Icon: brand.secondary
```

### Severity Indicator
```
● ← 8px colored dot
High: #E63946 (coral red)
Medium: #F4A261 (warm amber)
Low: #3B82F6 (info blue)
```

## Selection State

### Normal Card
```
┌──────────────────────────────────────────┐
│ [Card content]                           │
│ No border                                │
│ Scale: 1.0                               │
│ Shadow: lg                               │
└──────────────────────────────────────────┘
```

### Selected Card
```
╔══════════════════════════════════════════╗
║ [Card content]                           ║  ← 2px brand.primary border
║ Border: #1A1464                          ║
║ Scale: 1.02 (spring animation)           ║
║ Shadow: xl (elevated)                    ║
╚══════════════════════════════════════════╝
```

## Platform Differences

### iOS
```
┌──────────────────────────────────────────┐
│ BlurView (intensity: 90, tint: light)    │
│ Semi-transparent background              │
│ Blur: High quality backdrop filter       │
└──────────────────────────────────────────┘
```

### Android
```
┌──────────────────────────────────────────┐
│ Solid white background (#FFFFFF)         │
│ No blur effect                           │
│ Clean, crisp appearance                  │
└──────────────────────────────────────────┘
```

## Pagination Dots

```
● ● ○ ○ ○  ← 5 alerts
↑ ↑
│ └─ Inactive: 6px, slate.300 (#CBD5E1)
└─── Active: 8px, brand.primary (#1A1464)

Spacing: 4px gap between dots
Position: Centered below carousel, 12px margin-top
```

## Color Semantics

### Event Types

**Weather Events** (CloudIcon)
- Icon background: Severity-based (high/medium/low light colors)
- Icon color: Severity-based (high/medium/low primary colors)

**Traffic Events** (Car01Icon)
- Icon background: Severity-based
- Icon color: Severity-based

### Severity Levels

| Severity | Background | Icon Color | Dot Color |
|----------|-----------|-----------|-----------|
| 1-2 (Low) | `${colors.state.info}15` | `#3B82F6` | `#3B82F6` |
| 3 (Medium) | `#FFF4ED` | `#F4A261` | `#F4A261` |
| 4-5 (High) | `#FDEBED` | `#E63946` | `#E63946` |

## Typography

```
Alert Title
- Size: base (14px)
- Weight: semibold (600)
- Color: text.primary (#111827)
- Lines: 1 (ellipsis)

Distance/Route Text
- Size: sm (12px)
- Weight: medium (500)
- Color: text.tertiary (#9CA3AF) or brand.secondary (#4B3BF5)

Vote CTA
- Size: xs (11px)
- Weight: medium (500)
- Color: text.tertiary (#9CA3AF)
- Icon: CheckmarkCircle02Icon (12px)
```

## Spacing & Layout

```
Card Padding: 16px (spacing[4])
Icon-to-Content Gap: 12px (spacing[3])
Badge Row Gap: 8px (spacing[2])
Title-to-Badges Gap: 8px (spacing[2])
Badges-to-CTA Gap: 8px (spacing[2])

Card Border Radius: xl (16px)
Badge Border Radius: full (9999px)
Icon Border Radius: xl (16px)

Card Horizontal Gap: 12px
Side Padding: 16px
Bottom Position: 20px from screen bottom
```

## Shadows

### Normal Card (shadows.lg)
```css
shadowColor: #000
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.12
shadowRadius: 12
elevation: 8 (Android)
```

### Selected Card (shadows.xl)
```css
shadowColor: #000
shadowOffset: { width: 0, height: 8 }
shadowOpacity: 0.15
shadowRadius: 20
elevation: 12 (Android)
```

## Animations

### Card Selection (react-native-reanimated)
```
Scale: 1.0 → 1.02
Spring config: { damping: 15, stiffness: 200 }
Duration: ~300ms natural spring
```

### Card Entry (FadeIn)
```
Duration: 300ms
Delay: 100ms
Opacity: 0 → 1
```

### Scroll Behavior
```
Snap to interval: 292px (280px card + 12px gap)
Deceleration rate: fast
Smooth snap-to-card on release
```

## Interactions

1. **Tap Card**
   - Haptic: medium
   - Action: Call onAlertSelect callback
   - Visual: Scale to 1.02, add border
   - Map: Center on alert location (handled by parent)

2. **Scroll Carousel**
   - Haptic: light (on snap to new card)
   - Visual: Pagination dot updates
   - Smooth horizontal scroll with momentum

3. **Current Index Change**
   - Update pagination dots
   - Light haptic feedback
   - Track visible card

## Accessibility

```html
Card TouchableOpacity:
  accessibilityRole="button"
  accessibilityLabel="{formattedSubtype} alert, {distanceLabel} away, severity {severity}"

Example:
  "Heavy Rain alert, 2.3km away, severity 4"
  "Traffic Jam alert, On your route, severity 3"
```

## Integration Positioning

```
Map Screen Hierarchy:
├── MapView (flex: 1)
├── Search Bar (position: absolute, top)
├── My Location Button (position: absolute, right, top: 140)
├── Events Badge (position: absolute, left, top: 140)
├── Alert Carousel (position: absolute, bottom: 20)  ← NEW
└── Event Detail Sheet (position: absolute, bottom: 120)
```

Ensure carousel doesn't overlap with:
- Bottom sheet (when expanded)
- Tab bar (adjust bottom position if needed)
- Other floating UI elements

## Responsive Considerations

- **Small screens (<350px)**: Consider reducing CARD_WIDTH to 260px
- **Large screens (>400px)**: Current 280px works well
- **Tablets**: May want to increase CARD_WIDTH or show multiple cards
- **Bottom sheet conflict**: Position carousel at bottom: 20 (below sheet handle area)

## Performance Notes

- Cards rendered via FlatList for optimal memory usage
- `getItemLayout` provides instant scroll positioning
- `removeClippedSubviews` on Android reduces overdraw
- `initialNumToRender={3}` loads only visible + adjacent cards
- `windowSize={5}` balances memory and scroll performance
