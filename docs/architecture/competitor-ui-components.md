# Competitor UI Components Architecture

React Native component architecture for advanced weather/traffic risk features inspired by Wayther and Weather on the Way.

## Tech Stack Constraints

- React Native 19.1.0 (pinned)
- Reanimated 3.x
- react-native-maps
- react-native-svg
- react-native-gesture-handler
- HeroUI Native + HugeIcons
- Convex real-time subscriptions

---

## 1. WeatherWaypointMarker

### Purpose
Custom map marker showing temperature + weather icon at points along route. Appears on map as a floating bubble with real-time weather data.

### TypeScript Interface

```typescript
// Component Props
interface WeatherWaypointMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  weatherData: WaypointWeather;
  isActive: boolean;
  onPress: (waypointId: string) => void;
  animationDelay: number; // stagger entrance animation
}

// Data Contract
interface WaypointWeather {
  id: string;
  timestamp: number;
  temperature: number; // Celsius
  weatherCode: number; // OpenWeatherMap code
  icon: WeatherIconType; // "01d", "10n", etc.
  estimatedArrivalTime: string; // "2:45 PM"
  distanceFromOrigin: number; // meters
}

// Return from Convex query
type ConvexWaypointWeatherQuery = {
  waypoints: WaypointWeather[];
  routeId: string;
  updateTimestamp: number;
};
```

### State Management

**Local State:**
- `isPressed: SharedValue<boolean>` - for press animation
- `scale: SharedValue<number>` - entrance animation
- `opacity: SharedValue<number>` - fade in/out

**No prop drilling** - each marker is self-contained.

### Animation Strategy (Reanimated 3)

```typescript
// Entrance: staggered fade + scale
useEffect(() => {
  scale.value = withDelay(
    animationDelay,
    withSpring(1, { damping: 15, stiffness: 120 })
  );
  opacity.value = withDelay(
    animationDelay,
    withTiming(1, { duration: 300 })
  );
}, []);

// Press feedback: scale down
const onPressIn = () => {
  isPressed.value = withTiming(1, { duration: 100 });
  scale.value = withSpring(0.9, { damping: 10 });
};

// Selection glow: pulsing border
const glowOpacity = useDerivedValue(() => {
  if (isActive) {
    return withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }
  return 0;
});
```

### Data Flow

**Convex Query** → `useQuery(api.routes.getRouteWaypoints, { routeId })`
- Fetches waypoint coordinates + weather data every 10 minutes
- Real-time subscription updates waypoints when conditions change

**API Source:**
- OpenWeatherMap 5-day/3-hour forecast
- Interpolate between forecast points for exact waypoint times

### Interaction Patterns

1. **Tap** → Expand to show detailed weather card (wind, precipitation, visibility)
2. **Long press** → Copy conditions to clipboard
3. **Drag map** → Markers stay pinned to geographic coordinates

### Performance Considerations

- **Memoize markers:** Use `React.memo()` to prevent re-renders when parent map moves
- **Lazy load icons:** Dynamically import weather icons only for visible codes
- **Limit markers:** Max 8 waypoints per route (spaced evenly by distance)
- **Debounce updates:** Batch weather updates to avoid jank during panning

---

## 2. RoutePolylineOverlay

### Purpose
Renders road-following polyline on map. Supports multiple alternatives with different colors. Animated drawing effect. Traffic-colored segments.

### TypeScript Interface

```typescript
interface RoutePolylineOverlayProps {
  routes: RouteAlternative[];
  selectedRouteId: string | null;
  trafficEnabled: boolean;
  onRoutePress: (routeId: string) => void;
  animateDrawing: boolean; // initial draw animation
}

interface RouteAlternative {
  id: string;
  coordinates: LatLng[]; // road-following points
  trafficSegments?: TrafficSegment[]; // color-coded sections
  metadata: {
    duration: number; // seconds
    distance: number; // meters
    tollsRequired: boolean;
    riskScore: number; // 0-100
  };
  color: string; // base color (green/yellow/red by risk)
  zIndex: number; // selected route on top
}

interface TrafficSegment {
  coordinates: LatLng[];
  jamFactor: number; // 0-10
  color: string; // green (#22c55e), yellow (#eab308), red (#ef4444)
}

interface LatLng {
  latitude: number;
  longitude: number;
}
```

### State Management

**Local State:**
- `drawProgress: SharedValue<number>` - 0 to 1 for animated drawing
- `pressedRouteId: SharedValue<string | null>` - for tap feedback

**Parent State (map screen):**
- `selectedRouteId` - which route is active
- `alternativeRoutes` - array of route options

### Animation Strategy

```typescript
// Initial drawing animation: 0 to 1 over 1 second
useEffect(() => {
  if (animateDrawing) {
    drawProgress.value = withTiming(1, {
      duration: 1000,
      easing: Easing.inOut(Easing.ease)
    });
  }
}, [animateDrawing]);

// Render polyline with trimmed path
const visibleCoordinates = useDerivedValue(() => {
  const count = Math.floor(coordinates.length * drawProgress.value);
  return coordinates.slice(0, count);
});

// Selection highlight: pulse stroke width
const strokeWidth = useDerivedValue(() => {
  if (selectedRouteId === route.id) {
    return withRepeat(
      withSequence(
        withTiming(8, { duration: 600 }),
        withTiming(6, { duration: 600 })
      ),
      2, // pulse twice
      false
    );
  }
  return 5;
});
```

### Data Flow

**Convex Query** → `useQuery(api.routes.getRouteAlternatives, { from, to })`
- Returns 1-3 route alternatives with HERE Traffic API polylines
- Each route has traffic segments pre-computed

**API Source:**
- HERE Routing API v8 (calculateroute.json with alternatives=2)
- HERE Traffic Flow API (flow.json) for jam factors
- Backend stitches polyline + traffic data

**Update Frequency:**
- Route geometry: cached for 1 hour
- Traffic segments: refresh every 5 minutes

### Interaction Patterns

1. **Tap polyline** → Select route (zoom to fit bounds)
2. **Tap again** → Show route details sheet
3. **Pan map** → Polylines stay anchored
4. **Toggle traffic** → Crossfade between solid and traffic-colored segments

### Performance Considerations

- **Simplify coordinates:** Use Douglas-Peucker algorithm to reduce points (tolerance: 10m)
- **Render layers separately:** Unselected routes at lower zIndex with lower opacity
- **Avoid re-rendering all routes:** Memoize each `<Polyline>` component
- **Cap alternatives:** Max 3 routes to prevent clutter
- **Use `react-native-maps` `Polyline`** not SVG for better performance

---

## 3. TripSummarySheet

### Purpose
Bottom sheet with weather summary for trip. Tabs for "Summary" and "Waypoints". Mini-charts for wind, precipitation, visibility, temperature. Expandable sections.

### TypeScript Interface

```typescript
interface TripSummarySheetProps {
  routeId: string;
  isVisible: boolean;
  onClose: () => void;
  initialSnapPoint: 'peek' | 'half' | 'full';
}

interface TripWeatherSummary {
  departureTime: Date;
  arrivalTime: Date;
  overallRiskScore: number;
  alerts: WeatherAlert[];
  charts: {
    wind: WindChartData;
    precipitation: PrecipitationChartData;
    visibility: VisibilityChartData;
    temperature: TemperatureChartData;
  };
  waypoints: WaypointWeather[]; // from component 1
}

interface WindChartData {
  timestamps: number[];
  speeds: number[]; // km/h
  gusts: number[]; // km/h
  directions: number[]; // degrees (0-360)
}

interface PrecipitationChartData {
  timestamps: number[];
  amounts: number[]; // mm
  probabilities: number[]; // 0-100%
  types: ('rain' | 'snow' | 'sleet')[]; // icon type
}

// Similar interfaces for visibility and temperature
```

### State Management

**Sheet State (local):**
- `snapPoint: SharedValue<number>` - current sheet height
- `activeTab: 'summary' | 'waypoints'` - tab state
- `expandedSections: Set<string>` - which accordion sections are open

**Data State (Convex):**
- `useQuery(api.routes.getTripWeatherSummary, { routeId })`
- Real-time updates push new data every 10 minutes

### Animation Strategy

```typescript
// Bottom sheet snap points
const snapPoints = {
  peek: screenHeight * 0.25,   // show risk score + quick summary
  half: screenHeight * 0.5,    // show charts
  full: screenHeight * 0.9     // show all waypoints
};

// Snap with spring physics
const snapTo = (point: keyof typeof snapPoints) => {
  snapPoint.value = withSpring(snapPoints[point], {
    damping: 20,
    stiffness: 200
  });
};

// Pan gesture handler
const panGesture = Gesture.Pan()
  .onUpdate((event) => {
    snapPoint.value = Math.max(
      snapPoints.peek,
      snapPoint.value - event.translationY
    );
  })
  .onEnd((event) => {
    // Snap to nearest point based on velocity
    if (event.velocityY > 500) {
      snapTo('peek');
    } else if (snapPoint.value > snapPoints.half * 1.2) {
      snapTo('full');
    } else {
      snapTo('half');
    }
  });

// Chart entrance: stagger each chart
const chartOpacity = useSharedValue(0);
useEffect(() => {
  chartOpacity.value = withDelay(
    chartIndex * 150,
    withTiming(1, { duration: 300 })
  );
}, []);
```

### Data Flow

**Convex Query** → `api.routes.getTripWeatherSummary`
- Aggregates weather forecast for all waypoints
- Computes min/max/avg for each metric
- Returns chart data pre-formatted for react-native-svg

**Chart Library:** react-native-svg + custom components
- Line chart for wind/temperature
- Bar chart for precipitation
- Area chart for visibility

**Update Pattern:**
- Subscribe to route changes
- Refetch summary when route/departure time changes
- Cache charts for 10 minutes

### Interaction Patterns

1. **Swipe up/down** → Snap to peek/half/full
2. **Tap tab** → Switch between Summary/Waypoints
3. **Tap chart** → Expand to full-screen interactive chart
4. **Tap waypoint** → Zoom map to that location
5. **Pull down from top** → Close sheet

### Performance Considerations

- **Lazy render charts:** Only render visible tab's charts
- **Memoize chart components:** Prevent re-renders on parent snap changes
- **Virtualize waypoint list:** Use `FlashList` for long trips
- **Debounce gestures:** Throttle pan updates to 60fps
- **Use bottom-sheet library:** `@gorhom/bottom-sheet` for optimized gestures

---

## 4. DepartureTimeOptimizer

### Purpose
"Smart departure" component. Shows 24-hour timeline with color-coded risk levels. Recommends best departure time. "Go now" / "Leave at" / "Arrive by" mode switcher.

### TypeScript Interface

```typescript
interface DepartureTimeOptimizerProps {
  routeId: string;
  currentLocation: LatLng;
  destination: LatLng;
  onDepartureSelected: (time: Date, mode: DepartureMode) => void;
}

type DepartureMode = 'now' | 'leave_at' | 'arrive_by';

interface DepartureTimeData {
  mode: DepartureMode;
  selectedTime: Date;
  timeline: TimelineSlot[];
  recommendation: RecommendedDeparture;
}

interface TimelineSlot {
  departureTime: Date;
  arrivalTime: Date;
  riskScore: number; // 0-100
  color: string; // green/yellow/red
  breakdown: {
    weatherRisk: number;
    trafficRisk: number;
    eventRisk: number;
  };
  travelDuration: number; // seconds
}

interface RecommendedDeparture {
  time: Date;
  reason: string; // "Lowest risk" | "Avoid morning rush" | etc.
  riskScore: number;
  alternativeTimes: Date[]; // 2-3 alternatives
}
```

### State Management

**Local State:**
- `selectedMode: DepartureMode` - controlled by mode switcher
- `selectedTime: Date` - currently selected departure time
- `scrollPosition: SharedValue<number>` - horizontal scroll offset

**Convex Query:**
- `useQuery(api.routes.getDepartureTimeline, { routeId, date })`
- Generates 48 half-hour slots (24 hours)

### Animation Strategy

```typescript
// Timeline scroll with haptic feedback at hour boundaries
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollPosition.value = event.contentOffset.x;

    // Haptic at each hour mark
    const hourIndex = Math.floor(scrollPosition.value / slotWidth);
    if (hourIndex !== lastHapticIndex.current) {
      runOnJS(triggerHaptic)('impactLight');
      lastHapticIndex.current = hourIndex;
    }
  }
});

// Selected slot: scale + glow
const slotScale = useDerivedValue(() => {
  if (isSelected) {
    return withSpring(1.1, { damping: 12 });
  }
  return 1;
});

const glowOpacity = useDerivedValue(() => {
  if (isSelected) {
    return withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }
  return 0;
});

// Mode switcher: slide underline
const underlineX = useSharedValue(0);
const switchMode = (mode: DepartureMode, index: number) => {
  underlineX.value = withSpring(index * buttonWidth, {
    damping: 15,
    stiffness: 180
  });
};
```

### Data Flow

**Convex Action** → `api.routes.calculateDepartureTimeline`
- Input: route, date range (next 24 hours)
- Process:
  1. Query weather forecast for each half-hour slot
  2. Query traffic predictions (HERE API historical patterns)
  3. Compute risk score for each slot
  4. Identify optimal departure windows
- Output: `TimelineSlot[]` + recommendation

**Caching:**
- Cache timeline for 30 minutes
- Invalidate when route changes

### Interaction Patterns

1. **Tap mode button** → Switch between now/leave_at/arrive_by
2. **Scroll timeline** → Scrub through 24-hour period with haptics
3. **Tap slot** → Select departure time (update route preview)
4. **Tap "Go"** → Commit to selected time, start navigation
5. **Long press slot** → Show detailed breakdown tooltip

**Mode Behavior:**
- **Now:** Show current conditions, disable timeline
- **Leave at:** Scroll from current time to +24h
- **Arrive by:** Reverse calculation (work backward from arrival time)

### Performance Considerations

- **Virtualize timeline:** Use `FlatList` with `getItemLayout`
- **Memoize slots:** Each `TimelineSlot` component memoized
- **Precompute colors:** Map risk scores to colors in query
- **Limit forecast calls:** Backend caches 3-hour forecasts
- **Debounce selection:** Wait 300ms after scroll stops before updating

---

## 5. RouteComparisonCards

### Purpose
Horizontal scroll of route alternative cards. Each shows duration, distance, risk level, traffic status. Color-coded by risk. Tap to select and preview on map.

### TypeScript Interface

```typescript
interface RouteComparisonCardsProps {
  routes: RouteAlternative[]; // from component 2
  selectedRouteId: string | null;
  onRouteSelect: (routeId: string) => void;
  departureTime?: Date; // optional for time-specific predictions
}

interface RouteCardData {
  id: string;
  name: string; // "Via I-90 East" | "Via Local Roads"
  duration: {
    baseline: number; // seconds in no traffic
    current: number; // seconds with current traffic
    predicted: number; // seconds at departure time
  };
  distance: number; // meters
  riskScore: number; // 0-100
  riskCategory: 'low' | 'medium' | 'high';
  trafficStatus: 'clear' | 'moderate' | 'heavy' | 'stopped';
  highlights: RouteHighlight[];
  tollsRequired: boolean;
  tollCost?: number; // dollars
}

interface RouteHighlight {
  type: 'weather_alert' | 'accident' | 'construction' | 'toll';
  icon: string;
  label: string; // "Snow advisory" | "Accident ahead"
  severity: 'info' | 'warning' | 'critical';
}
```

### State Management

**Parent State (map screen):**
- `selectedRouteId` - controlled state
- `routes: RouteAlternative[]` - from Convex query

**Local State (per card):**
- `isPressed: SharedValue<boolean>` - press animation
- `cardHeight: SharedValue<number>` - expand on select

### Animation Strategy

```typescript
// Entrance: stagger from left
useEffect(() => {
  translateX.value = withDelay(
    cardIndex * 100,
    withSpring(0, { damping: 18, stiffness: 150 })
  );
  opacity.value = withDelay(
    cardIndex * 100,
    withTiming(1, { duration: 300 })
  );
}, []);

// Selection: expand card height + glow border
const cardHeight = useDerivedValue(() => {
  if (isSelected) {
    return withSpring(200, { damping: 15 }); // show more details
  }
  return 160; // collapsed
});

const borderColor = useDerivedValue(() => {
  if (isSelected) {
    return withTiming(colors.primary, { duration: 200 });
  }
  return withTiming(colors.border, { duration: 200 });
});

// Press feedback: scale down
const onPressIn = () => {
  scale.value = withSpring(0.95, { damping: 10 });
};
```

### Data Flow

**Convex Query** → `api.routes.getRouteAlternatives`
- Same as component 2 (RoutePolylineOverlay)
- Returns 1-3 alternatives sorted by recommended (risk + duration)

**Enrichment:**
- HERE Routing API provides duration/distance
- Backend computes risk score
- Weather alerts fetched from OpenWeatherMap
- Traffic incidents from HERE Traffic

**Update Frequency:**
- Refetch on route change
- Real-time traffic updates every 5 minutes

### Interaction Patterns

1. **Tap card** → Select route (highlight on map, expand card)
2. **Tap selected card again** → Show detailed route sheet
3. **Swipe horizontally** → Scroll through alternatives
4. **Long press** → Share route via system share sheet

### Performance Considerations

- **Limit alternatives:** Max 3 cards to prevent choice paralysis
- **Memoize cards:** Each card memoized to avoid re-renders
- **Lazy load icons:** Dynamic import for highlight icons
- **Optimize layout:** Fixed card width (280px) for smooth scroll
- **Use FlatList:** Horizontal scroll with `snapToInterval`

---

## 6. LiveRadarLayer

### Purpose
Animated precipitation radar overlay on map. Toggle button to show/hide. Timestamp slider to scrub through last hour + forecast.

### TypeScript Interface

```typescript
interface LiveRadarLayerProps {
  mapRef: React.RefObject<MapView>;
  isVisible: boolean;
  onToggle: () => void;
  bounds: MapBounds; // current visible map region
}

interface MapBounds {
  northEast: LatLng;
  southWest: LatLng;
}

interface RadarFrame {
  timestamp: number;
  imageUrl: string; // tile layer URL with {z}/{x}/{y}
  opacity: number; // 0.5-0.8 for overlay
  legend: RadarLegend;
}

interface RadarLegend {
  colors: string[]; // precipitation intensity colors
  labels: string[]; // "Light" | "Moderate" | "Heavy"
  units: 'mm/h' | 'in/h';
}

interface RadarTimeline {
  frames: RadarFrame[];
  currentIndex: number;
  isPast: boolean; // historical vs forecast
  resolution: number; // minutes between frames
}
```

### State Management

**Local State:**
- `isPlaying: boolean` - auto-play animation
- `currentFrameIndex: SharedValue<number>` - animated scrubber
- `radarOpacity: SharedValue<number>` - fade in/out

**Convex Query:**
- `useQuery(api.weather.getRadarTimeline, { bounds, hours: 2 })`
- Returns 12 past frames + 12 forecast frames (10-minute intervals)

### Animation Strategy

```typescript
// Auto-play: loop through frames
useEffect(() => {
  if (isPlaying) {
    currentFrameIndex.value = withRepeat(
      withTiming(frames.length - 1, {
        duration: frames.length * 500, // 0.5s per frame
        easing: Easing.linear
      }),
      -1, // infinite loop
      false
    );
  } else {
    // Stop at current frame
    cancelAnimation(currentFrameIndex);
  }
}, [isPlaying]);

// Toggle visibility: fade in/out
const toggleRadar = () => {
  if (isVisible) {
    radarOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setIsVisible)(false);
    });
  } else {
    runOnJS(setIsVisible)(true);
    radarOpacity.value = withTiming(0.7, { duration: 300 });
  }
};

// Scrubber gesture: pan to seek
const scrubberGesture = Gesture.Pan()
  .onUpdate((event) => {
    const newIndex = Math.floor(
      (event.translationX / scrubberWidth) * frames.length
    );
    currentFrameIndex.value = Math.max(0, Math.min(frames.length - 1, newIndex));
  })
  .onEnd(() => {
    runOnJS(triggerHaptic)('impactLight');
  });
```

### Data Flow

**API Source:**
- **RainViewer API** (free, real-time radar tiles)
  - Past: 2 hours of historical radar (10-min intervals)
  - Forecast: 30 minutes ahead (10-min intervals)
- **Tomorrow.io Nowcast** (alternative, minute-by-minute)

**Convex Backend:**
- `integrations/radar.ts` fetches tile URLs
- Caches frame URLs for 10 minutes
- Returns tile layer URLs in `{z}/{x}/{y}` format

**Tile Overlay:**
- Use `react-native-maps` `UrlTile` component
- Load tiles for current map bounds only
- Preload next 3 frames for smooth playback

### Interaction Patterns

1. **Tap radar button** → Toggle overlay on/off
2. **Tap play button** → Auto-play animation
3. **Drag scrubber** → Seek to specific timestamp
4. **Pinch/zoom map** → Reload tiles for new bounds
5. **Tap frame** → Pause at current frame

### Performance Considerations

- **Tile caching:** Browser/native caches tiles automatically
- **Limit frame count:** Max 24 frames (2 hours) to prevent memory issues
- **Lazy load tiles:** Only fetch tiles for visible map region
- **Debounce map moves:** Wait 500ms after pan/zoom before loading new tiles
- **Optimize opacity:** Keep overlay at 0.6-0.7 for visibility without obscuring map

---

## 7. RiskScoreRing (Enhanced)

### Purpose
Animated ring/gauge showing 0-100 risk score. Gradient color (green→yellow→red). Breakdown segments for weather/traffic/events. Pulse animation for high risk.

### TypeScript Interface

```typescript
interface RiskScoreRingProps {
  score: number; // 0-100
  breakdown: RiskBreakdown;
  size: number; // diameter in pixels
  strokeWidth: number;
  animated: boolean;
  showBreakdown: boolean; // show segment colors
  onPress?: () => void; // tap to expand details
}

interface RiskBreakdown {
  weather: number; // 0-100, contributes 40%
  traffic: number; // 0-100, contributes 40%
  events: number; // 0-100, contributes 20%
  total: number; // final 0-100 score
  category: 'low' | 'medium' | 'high';
}

interface RiskSegment {
  type: 'weather' | 'traffic' | 'events';
  percentage: number; // 0-1 (0.4 for weather)
  color: string;
  startAngle: number; // degrees
  endAngle: number; // degrees
}
```

### State Management

**Local State:**
- `animatedScore: SharedValue<number>` - animated from 0 to score
- `rotation: SharedValue<number>` - pulse rotation for high risk
- `glowOpacity: SharedValue<number>` - pulsing glow

**No external state** - purely presentational component.

### Animation Strategy

```typescript
// Initial draw: animate score from 0 to target
useEffect(() => {
  if (animated) {
    animatedScore.value = withTiming(score, {
      duration: 1500,
      easing: Easing.out(Easing.cubic)
    });
  } else {
    animatedScore.value = score;
  }
}, [score, animated]);

// High risk pulse: rotate + glow
const pulseAnimation = useDerivedValue(() => {
  if (breakdown.category === 'high') {
    return withRepeat(
      withSequence(
        withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }
  return 1;
});

glowOpacity.value = useDerivedValue(() => {
  if (breakdown.category === 'high') {
    return withRepeat(
      withTiming(0.6, { duration: 1000 }),
      -1,
      true
    );
  }
  return 0;
});

// Press feedback: scale down
const onPressIn = () => {
  scale.value = withSpring(0.95, { damping: 10 });
};
```

### Data Flow

**Convex Query** → `api.riskScore.getCurrentRisk`
- Returns `RiskBreakdown` with sub-scores
- Real-time updates every 5 minutes

**Color Mapping:**
```typescript
const getRiskColor = (score: number): string => {
  if (score < 34) return colors.success; // green
  if (score < 67) return colors.warning; // yellow
  return colors.danger; // red
};

// Gradient for ring: interpolate between colors
const gradientColors = [
  colors.success,      // 0
  colors.warning,      // 50
  colors.danger        // 100
];
```

### Interaction Patterns

1. **Tap ring** → Expand to show detailed breakdown sheet
2. **Long press** → Share risk score as image
3. **Auto-update** → Ring animates to new score when data changes

### Performance Considerations

- **Use react-native-svg:** `<Svg>` + `<Circle>` for ring
- **Memoize ring paths:** Recompute only when score changes
- **Optimize gradient:** Use `<Defs>` + `<LinearGradient>` for smooth colors
- **Limit glow layers:** Max 2 shadow layers to avoid overdraw
- **Cancel animations:** Clean up on unmount to prevent memory leaks

---

## Component Interaction Map

```
MapScreen (Parent)
├─ RoutePolylineOverlay (2) ────────┐
│  └─ renders on map                │
├─ WeatherWaypointMarker (1) ───────┤ Share selectedRouteId
│  └─ renders on map                │
├─ LiveRadarLayer (6) ──────────────┤
│  └─ overlay on map                │
├─ RouteComparisonCards (5) ────────┘
│  └─ controls selection
├─ TripSummarySheet (3)
│  └─ shows selected route details
├─ DepartureTimeOptimizer (4)
│  └─ updates route preview
└─ RiskScoreRing (7)
   └─ shows current/predicted risk
```

### Data Flow Summary

1. **User selects route** → Updates `selectedRouteId` in MapScreen state
2. **RoutePolylineOverlay** highlights selected route on map
3. **RouteComparisonCards** expands selected card
4. **TripSummarySheet** fetches weather summary for selected route
5. **WeatherWaypointMarker** shows waypoints along selected route
6. **DepartureTimeOptimizer** calculates timeline for selected route
7. **RiskScoreRing** displays risk for selected departure time

### Shared State Management

**Option 1: Zustand Store** (recommended for complex interactions)
```typescript
interface MapScreenState {
  selectedRouteId: string | null;
  routes: RouteAlternative[];
  departureTime: Date;
  radarVisible: boolean;
  setSelectedRoute: (id: string) => void;
  setDepartureTime: (time: Date) => void;
  toggleRadar: () => void;
}
```

**Option 2: React Context** (simpler, for smaller apps)
```typescript
const MapContext = createContext<MapScreenState | null>(null);
```

**Option 3: Prop Drilling** (avoid for 7+ components)

---

## Performance Optimization Checklist

### General
- [ ] Use `React.memo()` for all leaf components
- [ ] Memoize expensive calculations with `useMemo()`
- [ ] Debounce map interactions (pan, zoom, gestures)
- [ ] Use `FlashList` instead of `FlatList` for lists
- [ ] Limit re-renders with `useCallback()` for callbacks

### Map-Specific
- [ ] Cluster waypoint markers when zoomed out (>10 markers)
- [ ] Simplify polyline coordinates with Douglas-Peucker
- [ ] Lazy load radar tiles (only for visible bounds)
- [ ] Debounce route recalculations (500ms after input)
- [ ] Cache Convex query results for 5-10 minutes

### Animations
- [ ] Use `useSharedValue()` and `withTiming()`/`withSpring()`
- [ ] Run animations on UI thread (not JS thread)
- [ ] Cancel animations on unmount
- [ ] Limit simultaneous animations to 3-4 max
- [ ] Use `Easing` functions for smooth curves

### Charts
- [ ] Render charts with `react-native-svg` (not Canvas)
- [ ] Limit data points to 50-100 per chart
- [ ] Memoize chart paths (only recompute when data changes)
- [ ] Use `VictoryNative` or `react-native-chart-kit` for production

### Network
- [ ] Batch Convex queries where possible
- [ ] Cache API responses (weather: 10min, traffic: 5min)
- [ ] Use Convex subscriptions for real-time updates
- [ ] Preload next frame for radar animation
- [ ] Compress polyline coordinates with encoded polyline format

---

## Next Steps

1. **Prototype order:** Start with components in this sequence:
   - RiskScoreRing (7) - standalone, no dependencies
   - WeatherWaypointMarker (1) - map integration basics
   - RoutePolylineOverlay (2) - map polyline rendering
   - RouteComparisonCards (5) - selection UI
   - TripSummarySheet (3) - bottom sheet + charts
   - DepartureTimeOptimizer (4) - timeline + recommendations
   - LiveRadarLayer (6) - complex tile overlay

2. **Create component library:** `apps/native/components/map/`
   ```
   map/
   ├── weather-waypoint-marker.tsx
   ├── route-polyline-overlay.tsx
   ├── trip-summary-sheet.tsx
   ├── departure-time-optimizer.tsx
   ├── route-comparison-cards.tsx
   ├── live-radar-layer.tsx
   ├── risk-score-ring.tsx
   └── types.ts (shared interfaces)
   ```

3. **Backend endpoints:** Add Convex queries/actions:
   - `api.routes.getRouteWaypoints`
   - `api.routes.getRouteAlternatives`
   - `api.routes.getTripWeatherSummary`
   - `api.routes.calculateDepartureTimeline`
   - `api.weather.getRadarTimeline`
   - `api.riskScore.getCurrentRisk`

4. **Testing strategy:**
   - Unit tests for risk calculations
   - Snapshot tests for static charts
   - Integration tests for map interactions
   - Performance tests for animation FPS
   - Visual regression tests for UI components
