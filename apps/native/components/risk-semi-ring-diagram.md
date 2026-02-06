# Risk Semi-Ring Visual Diagrams

Visual explanations of the SVG arc mathematics and animation techniques.

## 1. Semi-Circle Geometry

```
Coordinate System:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      ↑ Y
                      │
                      │
        ──────────────┼──────────────→ X
                      │ (0,0)
                      │
                      ↓

Semi-Ring Structure:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

             ViewBox (size × size)
    ┌────────────────────────────────────┐
    │                                    │
    │          Center (centerX, centerY) │
    │                 ●                  │
    │                 │                  │
    │    ╭────────────┼────────────╮    │
    │  ●─┘            │            └─●  │
    │ startPoint    radius       endPoint│
    │ (-180°)         │            (0°)  │
    └─────────────────┴──────────────────┘

    startPoint:
      x = centerX - radius
      y = centerY

    endPoint:
      x = centerX + radius
      y = centerY

    Arc goes clockwise (sweep = 1) from left to right
```

## 2. SVG Arc Command Breakdown

```
SVG Path Syntax:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

M startX startY A rx ry rotation largeArc sweep endX endY
│       │       │ │  │     │         │       │     │    │
│       │       │ │  │     │         │       │     │    └─ End Y coordinate
│       │       │ │  │     │         │       │     └────── End X coordinate
│       │       │ │  │     │         │       └──────────── Sweep direction (0=CCW, 1=CW)
│       │       │ │  │     │         └──────────────────── Large arc flag (0=<180°, 1=>180°)
│       │       │ │  │     └────────────────────────────── X-axis rotation
│       │       │ │  └──────────────────────────────────── Y radius
│       │       │ └─────────────────────────────────────── X radius
│       │       └───────────────────────────────────────── Arc command
│       └───────────────────────────────────────────────── Start Y coordinate
└───────────────────────────────────────────────────────── Move command


For 180° Semi-Circle:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Given:
  center = (100, 100)
  radius = 80

Calculate:
  startX = 100 - 80 = 20
  startY = 100
  endX = 100 + 80 = 180
  endY = 100

Result:
  M 20 100 A 80 80 0 0 1 180 100

Parameters explained:
  M 20 100      → Move to left point (start)
  A             → Draw arc
  80 80         → Circular (rx = ry = radius)
  0             → No rotation needed
  0             → Small arc flag (our 180° is not >180°)
  1             → Sweep clockwise
  180 100       → End at right point
```

## 3. Stroke Dash Animation

```
Concept: Stroke Dasharray & Dashoffset
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Arc Length = π × radius = 251.3 (for radius=80)

strokeDasharray = "251.3 251.3"
                   ─┬─── ─┬────
                    │     └─ Gap length
                    └─ Dash length


Initial State (Score = 0):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
strokeDashoffset = 251.3 (full length)

    [Dash: 251.3]────────[Gap: 251.3]
     Hidden here          Would be visible
         │                     │
         ▼                     ▼
    ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
         (Arc track, offset pushed entire dash out of view)
    └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘


Mid State (Score = 50):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
strokeDashoffset = 125.65 (half length)

    [Dash: 251.3]────────
     Visible half  Hidden
         │           │
         ▼           ▼
    ┌───────────── ─ ─ ─ ─ ─ ─ ─┐
     ████████████░                (Half arc filled)
    └───────────── ─ ─ ─ ─ ─ ─ ─┘


Final State (Score = 100):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
strokeDashoffset = 0

    [Dash: 251.3]────────
     Fully visible
         │
         ▼
    ┌─────────────────────────────┐
     █████████████████████████████  (Full arc filled)
    └─────────────────────────────┘
```

## 4. Score to Offset Formula

```
Mathematical Progression:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Given:
  score = 0 to 100
  arcLength = π × radius

Progress = score / 100
         = 0.0 to 1.0

Offset = arcLength × (1 - progress)
       = arcLength × (1 - score/100)

Examples:

  Score |  Progress  |   Calculation      | Offset  | Visual
  ──────┼────────────┼────────────────────┼─────────┼─────────────
    0   |    0.0     | 251.3 × (1 - 0.0)  |  251.3  | Empty ░░░░░
   25   |    0.25    | 251.3 × (1 - 0.25) |  188.5  | ██░░░ 25%
   50   |    0.5     | 251.3 × (1 - 0.5)  |  125.7  | ████░ 50%
   75   |    0.75    | 251.3 × (1 - 0.75) |   62.8  | ██████ 75%
  100   |    1.0     | 251.3 × (1 - 1.0)  |    0.0  | ████████ 100%
```

## 5. Color Interpolation

```
Risk Classification Color Mapping:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Score Range    Classification   Color Progress   RGB Color
───────────────────────────────────────────────────────────
  0 - 33       Low              0.0             #00C896 (Jade Green)
                                │
                                │  Gradient
                                │  Transition
                                ▼
 34 - 66       Medium           0.5             #F4A261 (Warm Amber)
                                │
                                │  Gradient
                                │  Transition
                                ▼
 67 - 100      High             1.0             #E63946 (Coral Red)


Interpolation Function:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interpolateColor(
  colorProgress,           // Input: 0.0 to 1.0
  [0,   0.5,   1],        // Breakpoints
  [LOW, MEDIUM, HIGH]     // Output colors
)

Visual Gradient:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  0%                 50%                100%
  │                   │                   │
  ▼                   ▼                   ▼
████████████████████████████████████████████
░░░░Jade Green░░░░░Amber░░░░░░Coral Red░░░░
░░░░#00C896░░░░░░#F4A261░░░░░░#E63946░░░░░░
```

## 6. Layering & Composition

```
Visual Layer Stack (Bottom to Top):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────┐
│                                         │  ← Container View
│  ┌───────────────────────────────────┐ │     (Handles pulse scale)
│  │                                   │ │
│  │     SVG Canvas (size × size)      │ │
│  │                                   │ │
│  │   Layer 1: Background Track      │ │  ← Gray (#E2E8F0)
│  │   ┌─────────────────────────┐    │ │     stroke-width: 16
│  │   │░░░░░░░░░░░░░░░░░░░░░░░░░│    │ │     Always visible
│  │   └─────────────────────────┘    │ │
│  │                                   │ │
│  │   Layer 2: Glow Effect           │ │  ← Same color as progress
│  │   ┌─────────────────────────┐    │ │     stroke-width: 24
│  │   │▒▒▒▒▒▒▒▒▒▒▒▒▒            │    │ │     opacity: 0.4-0.7
│  │   └─────────────────────────┘    │ │     Animated offset
│  │                                   │ │
│  │   Layer 3: Progress Arc          │ │  ← Risk color (animated)
│  │   ┌─────────────────────────┐    │ │     stroke-width: 16
│  │   │███████████████          │    │ │     Animated offset
│  │   └─────────────────────────┘    │ │     strokeLinecap: round
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Content (Absolute Position)   │ │
│  │                                   │ │
│  │            ┌──────┐              │ │
│  │            │  65  │              │ │  ← Score (large text)
│  │            └──────┘              │ │
│  │         ┌──────────┐             │ │
│  │         │Medium Risk│            │ │  ← Label (colored)
│  │         └──────────┘             │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘

Z-Index Order:
  1. Background track (bottom)
  2. Glow effect (middle)
  3. Progress arc (middle-top)
  4. Score text (top)
  5. Label text (top)
```

## 7. Animation Timeline

```
Score Change Animation (0 → 100):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Time:  0ms     200ms    400ms    600ms    800ms   1000ms  1200ms
       │       │        │        │        │       │       │
Arc:   ░░░░░   ██░░░░   ████░░   ██████░  ███████ ████████████
       0%      17%      33%      50%      67%     83%     100%

Easing: Cubic-bezier ease-out (fast start, slow end)
        │
        ▼
Speed:  ━━━━━━━━━━━━╲╲╲╲╲╲_____
        Fast    →    Slow


Classification Change Animation (Low → High):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Timeline:
  ├─ 0ms:    Classification changes (low → high)
  │
  ├─ 0-200ms:  Pulse scale: 1.0 → 1.08 (spring)
  │            Glow opacity: 0.4 → 0.7
  │            Haptic feedback triggered
  │
  ├─ 200-600ms: Color transition: Green → Red
  │             (interpolateColor with cubic ease-out)
  │
  └─ 600-800ms: Pulse scale: 1.08 → 1.0 (spring)
               Glow opacity: 0.7 → 0.4

Visual:
  Time:  0ms          200ms        400ms        600ms        800ms
         │            │            │            │            │
  Scale: ╭────╮       ╱‾‾‾‾╲      ╱────╲      ╱────╲      ╭────╮
         │    │──────╱      ╲────╱      ╲────╱      ╲────│    │
         1.0  1.02  1.06    1.08  1.06   1.04  1.02   1.0  1.0

  Color: Green        Green/       Amber/       Orange       Red
                      Amber        Red


Score Pop Animation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Duration: ~600ms (spring animation)

Scale:     1.0 → 1.15 → 1.0
           │     │      │
           │     │      └─ Settle back (300ms, damping: 15)
           │     └──────── Peak (150ms, damping: 10)
           └────────────── Start

Visual:
           ╱╲
          ╱  ╲
    ─────╱    ╲────────
    1.0   1.15  1.0

Effect: Number "pops" larger then settles
```

## 8. Responsive Sizing

```
Size Variants:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extra Large (280px):          Large (220px):
┌──────────────────────┐      ┌─────────────────┐
│                      │      │                 │
│   ╭──────────────╮   │      │  ╭──────────╮  │
│   │              │   │      │  │          │  │
│   │      85      │   │      │  │    65    │  │
│   │   High Risk  │   │      │  │ Med Risk │  │
│   └──────────────┘   │      │  └──────────┘  │
└──────────────────────┘      └─────────────────┘
  stroke: 24px                  stroke: 18px


Medium (180px):               Small (140px):
┌───────────────┐             ┌──────────┐
│               │             │          │
│ ╭─────────╮  │             │ ╭──────╮ │
│ │         │  │             │ │      │ │
│ │   50    │  │             │ │  30  │ │
│ │  Medium │  │             │ │      │ │
│ └─────────┘  │             │ └──────┘ │
└───────────────┘             └──────────┘
  stroke: 14px                  stroke: 10px
                                no label


Stroke Width Formula:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

strokeWidth = size × 0.08

Examples:
  size: 140 → stroke: 11.2 ≈ 10-12px
  size: 180 → stroke: 14.4 ≈ 14-16px
  size: 220 → stroke: 17.6 ≈ 16-18px
  size: 280 → stroke: 22.4 ≈ 20-24px
```

## 9. Coordinate System Reference

```
SVG ViewBox Coordinate System:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For size = 200, viewBox = "0 0 200 200"

        0         50        100       150       200
    0   ┌─────────┼─────────┼─────────┼─────────┐
        │                                        │
   50   ├                    ●                   ┤
        │                 (100,100)              │
        │                  Center                │
  100   ├────●─────────────●─────────────●──────┤
        │   (20,100)    (100,100)    (180,100)  │
        │   Start         Center        End      │
  150   ├                                        ┤
        │                                        │
  200   └────────────────────────────────────────┘

Radius Calculation:
  padding = strokeWidth/2 + 4
  radius = (size/2) - padding

Example (size=200, stroke=16):
  padding = 16/2 + 4 = 12
  radius = 200/2 - 12 = 88

Center always at: (size/2, size/2) = (100, 100)
```

## 10. Performance Optimization Diagram

```
Animation Performance:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Traditional (JS Thread):               Reanimated (UI Thread):
┌──────────────────┐                   ┌──────────────────┐
│   JavaScript     │                   │  UI Thread       │
│   Thread         │                   │  (Native)        │
│                  │                   │                  │
│  State Update    │◀──Bridge──────▶  │  Native View     │
│  ▼               │   (Slow!)         │  ▼               │
│  Interpolation   │                   │  GPU Rendering   │
│  ▼               │                   │                  │
│  Send to Native  │                   │  [Animation runs │
│  ▼               │                   │   entirely here] │
│  Render          │                   │                  │
└──────────────────┘                   └──────────────────┘
     ~30 FPS                                ~60 FPS
     Frame drops                            Smooth


Worklet Execution:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  JS Thread                    UI Thread
  ─────────                    ─────────
     │                             │
     │  useSharedValue(0)          │
     │  ──────────────────────▶    │
     │                             │
     │  withTiming(1, {...})       │
     │  ──────────────────────▶    │
     │                             │
     │                             │  [Runs entirely on UI]
     │                             │  ├─ interpolateColor()
     │                             │  ├─ interpolate()
     │                             │  ├─ Calculate offset
     │                             │  └─ Update SVG props
     │                             │     ▼
     │                             │  [Render at 60 FPS]
     │                             │
     │  ◀──[Only notify when]──────│
     │     animation completes]    │
```

This visual documentation helps understand the mathematical concepts and implementation details of the semi-ring component.
