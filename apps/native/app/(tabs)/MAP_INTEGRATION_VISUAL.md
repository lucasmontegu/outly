# Map Integration - Visual Reference

## Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐   │ ← SafeAreaView top
│  │  🔍  Search location...                        ⊗    │   │ ← Floating search bar
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌──────┐                                    ╭─────╮       │
│   │ 12 • │                                    │  ◎  │       │ ← Events badge + My Location
│   └──────┘                                    ╰─────╯       │
│                                                              │
│                    ◉ TIER 2 Marker                          │ ← 32px, 80% opacity
│                      (nearby)                                │
│                                                              │
│     ════════════════════════════════════                    │
│     ║  USER ROUTE (Active, Selected)    ║                   │ ← 6px polyline
│     ════════════════════════════════════                    │
│              ⬤ TIER 1 Marker                                │ ← 44px, pulse
│                (on route)                                    │
│                                                              │
│                         ○ TIER 3 Marker                     │ ← 24px, 60% opacity
│                           (distant)                          │
│                                                              │
│                                            ╭─────╮           │
│                                            │  ⊞  │           │ ← View toggle button
│                                            ╰─────╯           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ━━━━━  (handle bar)                                 │   │
│  │  5 alerts on your route  ● ● ● ●●●● ●●●●●           │   │ ← AlertsListSheet (collapsed)
│  │                        (high)(med)(low)               │   │
│  │  ↑ Swipe for details                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## View Toggle States

### Sheet View (Default)
```
┌─────────────────────────────────────────────────┐
│  ━━━━━  (handle bar)                            │
│                                                  │
│  🔴 Road Closure                    🔴 ON ROUTE │
│  0.3km away • Severity 4/5                      │
│  - - - - - - - - - - - - - - - - - - - - - - - │
│  🟠 Heavy Traffic                         1.2km │
│  Severity 3/5                                   │
│  - - - - - - - - - - - - - - - - - - - - - - - │
│  🔵 Light Rain                            2.4km │
│  Severity 2/5                                   │
│                                                  │
│  ↑ Swipe to see more                            │
└─────────────────────────────────────────────────┘
```

### Carousel View (Toggled)
```
┌─────────────────────────────────────────────────┐
│                                                  │
│    ┌─────────────┐  ┌─────────────┐            │
│    │ 🔴          │  │ 🟠          │ →          │
│    │ Road        │  │ Heavy       │            │
│    │ Closure     │  │ Traffic     │            │
│    │             │  │             │            │
│    │ ON ROUTE ✓  │  │ 1.2km       │            │
│    └─────────────┘  └─────────────┘            │
│                                                  │
│         ● ○ ○ ○ ○                               │ ← Pagination dots
└─────────────────────────────────────────────────┘
```

## Marker Tier System

### TIER 1: On Route (< 1.5km from route line)
```
╭─────────╮
│         │ ← 44px diameter
│    ⚠️   │    White icon, colored bg
│         │    2px white border
╰─────────╯    Pulse animation ring
   ●●●●●●       100% opacity
  Pulse ring    Shadow: 0.4 opacity
```

### TIER 2: Nearby (< 2km from user)
```
╭────────╮
│        │ ← 32px diameter
│   ⚠️   │    White icon, colored bg
│        │    1px white border
╰────────╯    No animation
              80% opacity
              Shadow: 0.25 opacity
```

### TIER 3: Distant (>= 2km from user)
```
╭──────╮
│      │ ← 24px diameter
│  ⚠️  │    White icon, colored bg
│      │    1px white border
╰──────╯    No animation
            60% opacity
            Shadow: 0.25 opacity
```

## Route Polyline States

### Default Route (Inactive Day)
```
- - - - - - - - - - - - - - -  ← 4px width, dashed
slate-400 (#94A3B8), 50% opacity
```

### Active Route (Today, Unselected)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← 4px width, solid
slate-400 (#94A3B8)
```

### Selected Route
```
████████████████████████████  ← 6px width, solid
brand-primary (#1A1464)
Start marker: Home icon, 18px
End marker: Pin, 12px dot
Both scale to 1.15x with border color change
```

## Bottom UI Toggle Button

```
╭─────╮
│  ⊞  │ ← ViewIcon when showing Sheet
╰─────╯    48px × 48px, circular
           Background: white
           Icon: brand-secondary
           Position: right 16px, bottom 200px
           Light haptic on tap

╭─────╮
│  ≡  │ ← GridViewIcon when showing Carousel
╰─────╯    (Same styling)
```

## Haptic Feedback Map

```
Interaction               Haptic Type    Duration
─────────────────────────────────────────────────
Marker tap                Light          ~10ms
Route selection           Medium         ~15ms
View toggle               Light          ~10ms
Alert selection (Sheet)   Light          ~10ms
Alert selection (Carousel) Medium        ~15ms
```

## Color System for Risk Levels

### High Risk (Severity 4-5)
```
Primary: #E63946 (Coral Red)
Light:   #FDEBED (Background tint)
Dark:    #C62634 (Emphasis)
```

### Medium Risk (Severity 3)
```
Primary: #F4A261 (Warm Amber)
Light:   #FFF4ED (Background tint)
Dark:    #E07B3C (Emphasis)
```

### Low Risk (Severity 1-2)
```
Primary: #00C896 (Jade Green)
Light:   #E6F9F4 (Background tint)
Dark:    #008F6B (Emphasis)
```

## Event Type Icons

```
Weather Events:  ☁️  CloudIcon (20/16/12px based on tier)
Traffic Events:  🚗  Car01Icon (20/16/12px based on tier)
```

## Alert Card Structure (Carousel)

```
┌─────────────────────────────────────┐
│ ╭─────╮                              │
│ │  ⚠️  │  Road Closure                │ ← Icon + Title
│ ╰─────╯                              │
│         ┌────────────┐ ●             │ ← Distance + Severity
│         │ ON ROUTE ✓ │               │
│         └────────────┘               │
│         ✓ Tap to vote                │ ← Vote CTA (if not voted)
└─────────────────────────────────────┘
280px × 120px, rounded 16px
BlurView (iOS) or solid white (Android)
```

## Animation Timings

```
Component             Animation              Duration    Easing
────────────────────────────────────────────────────────────────
TIER 1 pulse          Scale 1.0 → 1.15      800ms       ease-in-out
Route selection       Scale 1.0 → 1.15      150ms       spring (damping: 15)
Sheet slide in        Bottom → Up            200ms       spring (damping: 20)
Carousel card         FadeIn                 300ms       linear
View toggle           Icon swap              150ms       linear
```

## Z-Index Layering

```
Layer                   Z-Index    Notes
──────────────────────────────────────────────────────────
User route polylines    50-100     Lower when unselected, higher when selected
Traffic polylines       (default)  Rendered after routes, inherits z-order
Event circles           (default)  Transparent fills, don't block interaction
Event markers           (default)  Always on top, tier opacity provides depth
UI controls             10-20      Search bar, buttons, badges
Bottom sheets           100        Always above map elements
```

## Performance Targets

```
Metric                    Target       Current
──────────────────────────────────────────────────
Frame rate (pan/zoom)     60 fps       ~60 fps
Time to render 100 events <200ms       ~150ms
Memory usage              <150MB       ~120MB
Bandwidth per query       <50KB        ~15KB (slim query)
Initial map load          <1s          ~800ms
Tier calculation          <50ms        ~30ms
```

## Accessibility Labels

```
Element                 Label
────────────────────────────────────────────────────────────
Search bar              "Search for a location"
Clear search            "Clear search"
My location button      "Center on my location"
View toggle (sheet)     "Switch to carousel view"
View toggle (carousel)  "Switch to list view"
Event marker            "{subtype} alert, {distance} away, severity {level}"
Route polyline          "{fromName} to {toName} route"
Alert card              Inherits from marker
```

## Design Token Usage

```
Spacing:
- Card padding: spacing[4] (16px)
- Card gap: spacing[3] (12px)
- Button padding: spacing[5] (20px)
- Section margins: spacing[6] (24px)

Border Radius:
- Buttons: borderRadius.full (9999px)
- Cards: borderRadius.xl (16px)
- Sheet: borderRadius['3xl'] (24px)
- Search bar: borderRadius['2xl'] (20px)

Typography:
- Titles: typography.size.xl (18px), weight.bold
- Body: typography.size.base (14px), weight.medium
- Labels: typography.size.sm (12px), weight.semibold
- Tiny: typography.size.xs (11px), weight.medium

Shadows:
- Cards: shadows.lg
- Buttons: shadows.md
- Sheet: shadows.xl
```

---

**Visual reference for the complete map integration**
**All measurements in density-independent pixels (dp)**
