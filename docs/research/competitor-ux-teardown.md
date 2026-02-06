# Competitor UX Teardown: Wayther vs Weather on the Way vs Outia

**Date:** 2026-02-05
**Analyst:** UX Research Agent
**Purpose:** Brutal comparison of weather-route competitors to identify critical gaps in Outia

---

## Executive Summary

After analyzing Wayther and Weather on the Way against Outia's current implementation, the verdict is clear: **Outia would be deleted within 5 minutes by most users**. The primary dealbreakers:

1. **Routes display as straight lines** (not following roads) — immediately breaks trust
2. **No weather-along-route visualization** — users can't see WHAT they're driving into
3. **No departure time optimization** — just a risk score without actionable guidance
4. **Poor address search UX** — OpenStreetMap Nominatim is notoriously inaccurate
5. **No route alternatives** — competitors show 3+ options with time/toll comparison

The competitors have solved the core user need: **"Should I leave now, and which route should I take?"** Outia only answers: **"Here's a number and some dots on a map."**

---

## 1. What Competitors Do RIGHT (Ranked by User Impact)

### 🥇 #1: Weather-Along-Route Visualization (CRITICAL MISSING)

**Wayther:**
- Temperature bubbles at waypoints along actual road geometry
- Weather icons (rain/cloud/sun) overlaid on map at specific route segments
- Summary/Waypoints tab toggle showing detailed metrics per location
- Line chart showing temperature progression along route
- Bar charts for precipitation intensity at different times

**Weather on the Way:**
- Temperature + time labels at waypoints
- Precipitation radar overlay showing storm movement direction
- "Wet Road" markers on actual route segments
- NOAA alert badges integrated into route view
- Arrow indicators showing storm direction (visual storytelling)

**Impact:** HIGH — This is THE killer feature. Users need to see "at mile 23 you'll hit heavy rain" not "your route has a 67 risk score."

**Outia Gap:** Routes show as STRAIGHT LINES with no waypoints, no weather progression, no context. User has no idea WHERE on their route the risk is.

---

### 🥈 #2: Apple Maps Integration with Route Polylines

**Both Competitors:**
- Routes follow actual road geometry (not straight line crow-flies)
- Multiple route alternatives shown as colored cards (green/purple/pink)
- Each route card shows: time, distance, tolls required
- Routes calculated using Apple Maps routing engine
- Polylines rendered with proper road curvature

**Wayther Specific:**
- "Avoid Tolls" and "Avoid Highways" toggles in New Trip screen
- Routes color-coded by some classification (time? weather?)
- Map zooms to fit entire route automatically

**Impact:** HIGH — Seeing routes as straight lines is an instant trust-killer. Users think "this app doesn't understand roads."

**Outia Gap:** Uses HERE Traffic API but renders routes as straight lines between from/to. No alternatives shown. Single route only.

---

### 🥉 #3: Departure Time Optimization with Time Picker

**Wayther:**
- Floating "Go now" button with dropdown
- Date & Time picker with three modes:
  - "Go now" (default)
  - "Leave at" (scroll picker for future time)
  - "Arrive by" (reverse-calculates departure time)
- Time displayed in route header ("Night Only" label for overnight trips)
- Weather forecast adjusts based on selected departure time

**Weather on the Way:**
- "Adjust departure time" tooltip with lightbulb icon
- Shows optimal departure window visually
- PRO feature: "Navigate around the storm" with alternative routes

**Impact:** HIGH — Users need to plan WHEN to leave, not just see current conditions.

**Outia Gap:** Has optimal departure calculation in backend (`optimalDepartureMinutes`) but NO time picker UI. Users can't explore "what if I leave at 3pm instead?"

---

### #4: PRO Feature Comparison Table (Monetization UX)

**Weather on the Way:**
- Clean comparison table: "What's included" header
- Two columns: Free vs PRO with checkmarks
- Features listed with benefit-focused copy:
  - "The best route and time to leave — Up to 7 days in advance"
  - "Live rain & snow radar — Don't get caught in a bad storm"
  - "Road surface conditions — Snow and ice on the road ahead"
  - "Visibility, wind and more — Detailed forecast along your route"
- Orange "Compare all PRO features" link
- Consistent orange CTA button

**Wayther:**
- Paywall before any usage (3-day free trial)
- Feature list with icons:
  - Unlimited trips
  - Full weather forecasts
  - Priority support
  - No ads, no interruptions
  - Remove annoying paywalls
- Social proof: "Join Thousands of Happy Users" + 4.7 rating + 150K+ trips
- Pricing comparison: Weekly ($7.99) vs Yearly ($24.99, "SAVE 94%" label)

**Impact:** MEDIUM — Good monetization UX reduces churn and improves conversion.

**Outia Gap:** Has PRO tier in backend but no clear feature comparison. Users don't know what they're paying for.

---

### #5: Onboarding with Urgency Segmentation

**Weather on the Way:**
- First screen: "When is your next trip?"
- Three urgency options with icons:
  - "I'm on a trip right now" (alert icon)
  - "In the next few hours or days" (calendar icon)
  - "I don't have immediate plans" (paper plane icon)
- Blue gradient background with subtle animation
- Skippable ("Skip" link top-left)

**Impact:** MEDIUM — Segments users by urgency to show relevant features first.

**Outia Gap:** Generic onboarding asking for location permission, no urgency context.

---

### #6: Data Visualization Consistency

**Wayther (Weather Details):**
- Wind: Line chart showing speed + gusts range
- Precipitation: Bar chart with hourly breakdown
- Visibility: Range display (10-27 km) with line chart
- Temperature: Line chart with "Feels like" annotation
- All charts use consistent blue accent color
- Charts show X-axis time labels

**Impact:** MEDIUM — Users trust apps that show data clearly.

**Outia Gap:** Risk timeline shows colored bars but no detailed charts. Weather/traffic scores are just numbers with trend arrows.

---

### #7: Contextual Route Alerts

**Weather on the Way:**
- "Affects: [Route Name]" pill badge in event detail sheet
- Route-specific alert filtering
- PRO upsell modal shows alternative routes visually

**Wayther:**
- Route view shows events inline on route polyline
- Events don't exist outside of route context

**Impact:** MEDIUM — Users care about events that affect THEIR route, not all events nearby.

**Outia Gap:** Map shows all events within 5km radius. No "this affects your Home → Work route" labeling.

---

### #8: Integrated Navigation CTA

**Outia (Current):**
- "Navigate Around" button opens Apple Maps with lat/lng

**Competitors:**
- Seamless Apple Maps deep linking
- Route alternatives shown in-app before handing off to Maps

**Impact:** LOW — Navigation handoff works in all three apps.

---

### #9: Settings Screen Organization

**Wayther:**
- Grouped list with icons:
  - PRO upsell card at top (teal gradient)
  - Community actions (Rate, Share, Request Feature)
  - Support (Contact Support, Newsletter)
  - Legal (Terms, Privacy)
- "Learn more about Weather" link at bottom
- Clean visual hierarchy with consistent spacing

**Impact:** LOW — Standard settings screen, nothing groundbreaking.

**Outia Gap:** Settings screen exists but less polished (no grouped sections).

---

### #10: "View Random Trip" Demo Feature

**Wayther:**
- "View Random Trip" button on New Trip screen
- "Try Wayther+ features for free" subtitle
- Lets users explore app without entering addresses

**Impact:** LOW — Nice-to-have for discovery, but most users skip.

**Outia Gap:** No demo mode. Users must set up real routes to see value.

---

## 2. UX Patterns That Make Competitors Feel Polished

### Micro-Interactions

**Weather on the Way:**
- Smooth modal slide-ups with backdrop blur
- Orange CTA button has subtle scale on press
- "See all plans" expands inline (no new screen)
- Skip button fades out when scrolling

**Wayther:**
- Search bar blur effect on iOS
- Route cards have subtle shadows
- Map animates to route bounds on selection
- Date picker uses native iOS scroll wheels

**Outia Comparison:**
- Has good haptics (light/medium)
- Has Reanimated FadeInDown animations
- Missing: button press feedback, loading states during route calculation

---

### Information Hierarchy

**Wayther Route View:**
1. Route polylines (PRIMARY — largest visual element)
2. Weather waypoints (SECONDARY — overlaid on route)
3. Time/distance cards (TERTIARY — bottom sheet)
4. Summary tabs (QUATERNARY — collapsed by default)

**Weather on the Way Route View:**
1. Radar overlay (PRIMARY — shows storm context)
2. Route polyline (SECONDARY — orange line)
3. Waypoint labels (TERTIARY — temp + time)
4. Timeline button (QUATERNARY — bottom CTA)

**Outia Current:**
1. Risk score circle (PRIMARY — but disconnected from route)
2. Event markers (SECONDARY — but not tied to routes)
3. Route straight lines (TERTIARY — untrustworthy)
4. Bottom sheet (QUATERNARY — generic event list)

**Problem:** Outia prioritizes abstract risk score over concrete route visualization.

---

### Data Visualization Patterns

**Wayther:**
- Line charts for continuous data (temp, wind, visibility)
- Bar charts for discrete time periods (hourly precipitation)
- Range displays for min/max values
- Consistent blue accent color across all charts

**Weather on the Way:**
- Radar heatmap for precipitation intensity
- Arrow vectors for storm movement
- Colored route segments for conditions
- Minimal text, maximum visual encoding

**Outia:**
- Timeline uses colored circles (good)
- Condition cards show trends with arrows (good)
- Missing: detailed charts, heatmaps, visual progression

---

### Progressive Disclosure

**Both Competitors:**
- Start with simple route input (from/to)
- Reveal detailed weather after route selected
- Collapse non-critical data into tabs
- PRO features shown contextually (not upfront paywall)

**Outia:**
- Shows everything at once (risk score, timeline, conditions, alerts, routes)
- No drilling down into details
- Information overload on home screen

---

## 3. Where Competitors Are WEAK (Outia Opportunities)

### ❌ #1: No Community Voting / Gamification

**Competitors:** Zero community features. All data from official sources.

**Outia Advantage:** Community voting system with gamification (points, levels, badges). Users can report/confirm events in real-time.

**Opportunity:** Double down on community as differentiation. Make voting MORE prominent, not less. Add social features (leaderboards, achievements, reputation).

---

### ❌ #2: No Traffic Integration

**Wayther:** Weather-only app. No traffic data.

**Weather on the Way:** Weather-only app. No traffic data.

**Outia Advantage:** Combines weather + traffic + community events into single risk score.

**Opportunity:** This is HUGE differentiation. But need to visualize it better. Show traffic polylines in different colors (like Google Maps red/yellow/green). Overlay traffic on route.

---

### ❌ #3: No Saved Routes / Recurring Monitoring

**Competitors:** One-off trip planning. No "monitor my commute every weekday" feature.

**Outia Advantage:** Routes can be saved with recurring schedules (monitor Monday-Friday 8am). Smart departure notifications.

**Opportunity:** Promote this feature HARD. Most commuters have predictable schedules. Auto-suggest "Home → Work" routes during onboarding.

---

### ❌ #4: No Historical Data / Learning

**Competitors:** Show current + forecast only. No "last week you saved 15 minutes by leaving early" insights.

**Outia Advantage:** Has `riskSnapshots` table storing historical risk data. Can show trends, patterns, accuracy.

**Opportunity:** Add "Your Insights" section showing:
- Time saved this month
- Accuracy of predictions
- Best/worst departure times historically
- Seasonal patterns

---

### ❌ #5: No Multi-Stop Routes

**Competitors:** Simple A→B routing only.

**Outia Opportunity:** Add support for multi-stop routes (Home → Daycare → Work). Many users have complex commutes.

---

### ❌ #6: Generic UI (No Brand Personality)

**Wayther:** Clean but generic. Could be any weather app.

**Weather on the Way:** Blue gradient is nice but forgettable.

**Outia Opportunity:** Teal/blue brand colors are distinctive. Add more personality through:
- Custom illustrations for empty states
- Playful loading messages ("Checking the radar...", "Avoiding puddles...")
- Celebration animations when users save time

---

### ❌ #7: No Integrations

**Competitors:** Standalone apps only. Weather on the Way mentions Siri but unclear implementation.

**Outia Opportunity:** Build integrations:
- Siri Shortcuts ("Hey Siri, check my commute risk")
- Calendar integration (pull meeting locations)
- Waze/Google Maps deep links
- CarPlay support for hands-free alerts

---

## 4. Critical UX Gaps in Outia (Delete-Worthy Issues)

### 🚨 CRITICAL: Straight-Line Routes

**Issue:** Routes render as straight lines between from/to locations, not following roads.

**User Reaction:** "This app thinks I can drive through buildings. Uninstalled."

**Fix Required:**
1. Use HERE Routing API to get polyline geometry (already available in API)
2. Render polylines on map using `<Polyline>` component
3. Match Wayther's route card UI (time, distance, tolls)

**Files to Change:**
- `apps/native/app/(tabs)/map.tsx` — Add polyline rendering
- `packages/backend/convex/routes.ts` — Store polyline geometry from HERE API
- `apps/native/components/map/route-polyline-group.tsx` — Already exists but unused

---

### 🚨 CRITICAL: No Weather-Along-Route

**Issue:** User selects a route but sees no weather visualization along the path.

**User Reaction:** "I see a 67 risk score but WHERE is the risk? Is it at the start, middle, or end?"

**Fix Required:**
1. Backend: Calculate weather conditions at waypoints along route (every 5km)
2. Frontend: Show weather icons + temp labels at waypoints
3. Add bottom sheet with "Weather Timeline" showing:
   - Current conditions at start
   - Conditions every 15 minutes along route
   - Conditions at destination

**Reference Implementation:** Wayther IMG_8015 (temperature bubbles on route)

---

### 🚨 CRITICAL: No Route Alternatives

**Issue:** Outia shows single route only. No alternatives.

**User Reaction:** "Other apps show me 3 routes with different times. This shows one straight line."

**Fix Required:**
1. HERE Routing API supports `alternatives=3` parameter
2. Store multiple route options in `routes` table
3. Show route cards like Wayther (colored, time/distance comparison)
4. Let user tap card to view that route on map

---

### 🔴 HIGH: No Departure Time Picker

**Issue:** User can't explore "what if I leave at different times?"

**User Reaction:** "It says leave in 45 minutes but I can't leave then. What about 6pm?"

**Fix Required:**
1. Add time picker modal (use Wayther's "Go now / Leave at / Arrive by" pattern)
2. Update risk calculation based on selected time
3. Show weather forecast for that specific time window
4. Persist preferred departure time per route

**Backend Ready:** `forecast.optimalDepartureMinutes` already calculated, just needs UI

---

### 🔴 HIGH: Address Search Inaccuracy

**Issue:** OpenStreetMap Nominatim has poor geocoding quality (especially for US addresses).

**User Reaction:** "I typed my home address and it showed a place 20 miles away."

**Fix Required:**
1. Switch to Apple Maps search on iOS (using `MKLocalSearch`)
2. Add recent searches / favorites
3. Show "Use Current Location" shortcut
4. Validate address with reverse geocoding before saving

**Alternative:** Use MapKit autocomplete for real-time suggestions

---

### 🟡 MEDIUM: No Multi-Stop Routes

**Issue:** Users can only save A→B routes, not A→B→C.

**User Reaction:** "I drop my kids at school then go to work. Can't set this up."

**Fix Required:**
1. Add "Add Stop" button in route creation flow
2. Store waypoints array in `routes` table
3. Calculate risk for each leg independently
4. Show total trip time + per-leg breakdown

---

### 🟡 MEDIUM: Generic Risk Score UI

**Issue:** Giant circle with "67" doesn't communicate actionable info.

**User Reaction:** "What does 67 mean? Is that good? Bad? What should I do?"

**Fix Required:**
1. Replace/supplement number with visual metaphor:
   - Traffic light (red/yellow/green)
   - Weather icon with intensity
   - Time delay estimate ("+15 min expected")
2. Add contextual message: "Heavy traffic on Main St, consider waiting"
3. Show primary contributing factor (weather vs traffic)

**Good Example:** Weather on the Way shows radar + "wet road" markers (concrete, not abstract)

---

### 🟡 MEDIUM: No Route Context in Alerts

**Issue:** Event list shows all nearby events, not filtered by impact on user's routes.

**User Reaction:** "Why do I care about an accident 5km away if it's not on my route?"

**Fix Required:**
1. Add "Affects: Home → Work" badge to alerts (like Weather on the Way)
2. Filter/sort events by route impact
3. Show route-specific alerts on home screen
4. Dim/hide irrelevant events

---

### 🟡 MEDIUM: No Radar/Precipitation Layer

**Issue:** Map shows event pins but no precipitation overlay.

**User Reaction:** "I can't see where the rain actually is. Just dots."

**Fix Required:**
1. Integrate radar tile layer (use RainViewer API — free)
2. Add map layer toggle (Events / Traffic / Radar)
3. Show radar animation (last hour + next hour forecast)
4. Overlay on route to show "you'll hit rain at mile 12"

**Reference:** Weather on the Way IMG_8020 (radar with storm direction arrows)

---

### 🟢 LOW: No Demo Mode

**Issue:** New users must create route to see value.

**User Reaction:** "Too much work to set up before I know if I like it."

**Fix Required:**
1. Add "Try Example Route" during onboarding
2. Pre-populate with popular route (e.g., "SF → LA" or "Local Commute")
3. Let user explore weather visualization without commitment

**Reference:** Wayther "View Random Trip" button

---

## 5. Specific UI Components Outia Needs to Build

### Component #1: Route Time Picker Modal

**Purpose:** Let users select departure time to see forecast conditions.

**UI Spec:**
- Full-screen modal with three tabs at top:
  - "Now" (default, shows current conditions)
  - "Leave at" (scroll picker for future time)
  - "Arrive by" (reverse-calculates optimal departure)
- Date picker below (Today / Tomorrow / Date selector)
- Time scroll picker (iOS native style)
- "Update Route" button at bottom
- Real-time preview of conditions for selected time

**References:**
- Wayther IMG_8016 (Date & Time picker)
- Wayther IMG_8015 (Go now dropdown)

**Files:**
- Create: `apps/native/components/route-time-picker-modal.tsx`
- Import in: `apps/native/app/(tabs)/saved.tsx`, `apps/native/app/add-route.tsx`

---

### Component #2: Weather Waypoint Markers

**Purpose:** Show temperature + weather icons along route polyline.

**UI Spec:**
- Small circular markers every 5-10km along route
- Display temperature in large text (e.g., "22°")
- Weather icon below temp (cloud/rain/sun)
- Optional: time offset label ("in 15m")
- Tappable to show detailed conditions popup

**References:**
- Wayther IMG_8015 (temperature bubbles on map)
- Wayther IMG_8018 (waypoints list view)

**Files:**
- Create: `apps/native/components/map/weather-waypoint-marker.tsx`
- Import in: `apps/native/app/(tabs)/map.tsx`
- Backend: Add `getWeatherAlongRoute()` query to `packages/backend/convex/routes.ts`

---

### Component #3: Route Alternatives Card Stack

**Purpose:** Show multiple route options with time/distance comparison.

**UI Spec:**
- Horizontal scrollable card stack at bottom of map
- Each card shows:
  - Route name (auto-generated: "Fastest" / "No Tolls" / "Scenic")
  - Travel time (large text: "1h 26min")
  - Distance ("109 kilometers")
  - Toll status ("Tolls required" pill)
  - Risk indicator (colored dot: green/yellow/red)
- Selected card expands slightly
- Card background color matches route polyline color

**References:**
- Wayther IMG_8014 (route cards with colored polylines)

**Files:**
- Create: `apps/native/components/route-alternatives-stack.tsx`
- Backend: Add `alternatives` field to `routes` table schema
- Backend: Call HERE Routing API with `alternatives=3`

---

### Component #4: Weather Detail Charts Sheet

**Purpose:** Show detailed weather metrics in chart form (like Wayther's summary view).

**UI Spec:**
- Bottom sheet with two tabs: "Summary" / "Waypoints"
- Summary tab shows:
  - Overview section (start/travel time/end with icons)
  - Wind chart (line graph showing speed + gusts)
  - Precipitation chart (bar graph, hourly breakdown)
  - Visibility chart (line graph with range)
  - Temperature chart (line graph with "feels like" annotation)
- Waypoints tab shows:
  - List of locations along route
  - Temperature, weather icon, time for each
  - Tappable to center map on waypoint

**References:**
- Wayther IMG_8015, IMG_8017 (Summary/Waypoints tabs)

**Files:**
- Create: `apps/native/components/weather-detail-charts-sheet.tsx`
- Use: `react-native-chart-kit` or `victory-native` for charts

---

### Component #5: PRO Feature Comparison Table

**Purpose:** Clear monetization UX showing Free vs PRO features.

**UI Spec:**
- Modal/screen with header: "What's in the PRO plan?"
- Two-column table:
  - Left: Feature description
  - Right-1: Free (checkmark or empty circle)
  - Right-2: PRO (checkmark)
- Features listed with benefit-focused copy:
  - "7-day weather forecast along routes"
  - "Unlimited saved routes"
  - "Smart departure notifications"
  - "Priority data updates"
  - "No ads"
- Orange CTA button at bottom: "Start Free Trial"
- Fine print: "Then $4.99/month or $29.99/year"

**References:**
- Weather on the Way IMG_8021 (PRO comparison table)

**Files:**
- Create: `apps/native/components/pro-comparison-modal.tsx`
- Import in: Settings, Smart Departure screen, Routes screen

---

### Component #6: Radar Precipitation Layer Toggle

**Purpose:** Overlay live radar on map to show precipitation.

**UI Spec:**
- Floating button on map (top-right, below search)
- Icon: Cloud with rain drops
- Tappable to toggle radar layer on/off
- When enabled:
  - Radar tiles overlay map (colored heatmap)
  - Animation shows last 1 hour + next 1 hour
  - Legend at bottom (light/moderate/heavy rain)
  - Timestamp label ("Radar: 23:45 UTC")

**References:**
- Weather on the Way IMG_8020 (radar with storm arrows)

**Files:**
- Create: `apps/native/components/map/radar-layer.tsx`
- Use: RainViewer API (free, tile-based)
- Import in: `apps/native/app/(tabs)/map.tsx`

---

### Component #7: Route Impact Badge

**Purpose:** Show which saved routes are affected by an event.

**UI Spec:**
- Small pill badge below event title
- Text: "Affects: [Route Name]"
- Background: Teal/blue with low opacity
- Icon: Route icon (optional)
- Tappable to view route on map

**References:**
- Weather on the Way IMG_8023 (route impact tooltip)

**Files:**
- Update: `apps/native/components/alerts-list-sheet.tsx`
- Update: `apps/native/app/(tabs)/map.tsx` (EventDetailSheet)
- Backend: Already has logic in `calculateEventTier()` but not exposed in UI

---

### Component #8: Onboarding Urgency Selector

**Purpose:** Segment users by urgency to show relevant features.

**UI Spec:**
- Full-screen with gradient background (blue)
- Heading: "When is your next trip?"
- Three large buttons:
  - "I'm on a trip right now" (alert icon, red accent)
  - "In the next few hours or days" (calendar icon, orange accent)
  - "I don't have immediate plans" (plane icon, blue accent)
- Buttons are tall, rounded, with subtle shadows
- Skip link at top-left
- Based on selection:
  - Immediate: Show quick route creator
  - Soon: Show route setup with scheduler
  - Later: Show app tour / demo route

**References:**
- Weather on the Way IMG_8019 (urgency buttons)

**Files:**
- Create: `apps/native/app/(onboarding)/urgency.tsx`
- Update: `apps/native/app/(onboarding)/_layout.tsx` to include new step

---

## 6. Prioritized Roadmap (Next 30 Days)

### Week 1: CRITICAL Fixes (Delete Prevention)

1. **Route Polylines** — Use HERE API geometry, render on map [4 days]
2. **Weather Waypoint Markers** — Show temp + icons along route [3 days]

**Success Metric:** Routes look trustworthy, users can see weather context.

---

### Week 2: Core UX Improvements

3. **Route Alternatives** — Show 3 route options with time/distance [5 days]
4. **Departure Time Picker** — Let users explore different departure times [2 days]

**Success Metric:** Users can make informed decisions about when/how to travel.

---

### Week 3: Differentiation Features

5. **Route Impact Badges** — Show "Affects: [Route]" on alerts [2 days]
6. **Radar Layer** — Add precipitation overlay on map [3 days]
7. **Weather Detail Charts** — Build Wayther-style summary view [2 days]

**Success Metric:** Outia feels more polished than competitors.

---

### Week 4: Monetization & Retention

8. **PRO Comparison Modal** — Clear feature table [1 day]
9. **Onboarding Urgency Selector** — Segment new users [2 days]
10. **Better Address Search** — Switch to Apple Maps search [2 days]

**Success Metric:** Improved conversion to PRO, better onboarding completion rate.

---

## Appendix: Screenshots Reference Map

| File | App | Content |
|------|-----|---------|
| IMG_8011 | Wayther | Paywall (3-day trial, pricing) |
| IMG_8012 | Wayther | New Trip screen (from/to, toggles) |
| IMG_8013 | Wayther | Settings screen (grouped list) |
| IMG_8014 | Wayther | Route view (colored polylines, route cards) |
| IMG_8015 | Wayther | Weather on route (temp bubbles, summary) |
| IMG_8016 | Wayther | Date & Time picker (go now / leave at / arrive by) |
| IMG_8017 | Wayther | Weather charts (wind, precipitation, visibility) |
| IMG_8018 | Wayther | Waypoints list view (temp at locations) |
| IMG_8019 | Weather on the Way | Onboarding (urgency selector) |
| IMG_8020 | Weather on the Way | Value prop (radar, wet road markers) |
| IMG_8021 | Weather on the Way | PRO comparison table |
| IMG_8022 | Weather on the Way | Destination picker (map tap) |
| IMG_8023 | Weather on the Way | Route view (adjust departure tooltip) |
| IMG_8024 | Weather on the Way | PRO upsell (navigate around storm) |
| IMG_8025 | Weather on the Way | More screen (PRO CTA, settings, Siri) |

---

## Final Verdict

**Outia has better data** (weather + traffic + community) but **worse UX** than competitors.

Users will tolerate mediocre data if the UX is great (see: Wayther's success with weather-only).
Users will NOT tolerate mediocre UX even if the data is great (see: Outia's current state).

**Priority:** Fix the CRITICAL gaps first (route polylines, weather visualization) before adding new features. A polished core experience beats a feature-rich janky app.

**Differentiation Strategy:**
1. Match competitors on route visualization (TABLE STAKES)
2. Beat them on data quality (weather + traffic + community)
3. Win on recurring route monitoring (competitors are trip-focused, Outia is commute-focused)

**Target User:** Daily commuters who drive the same route 5x/week and want proactive alerts.
**Anti-User:** Occasional road-trippers who plan one-off trips (competitors serve this better).

Focus on the commuter use case and dominate it.
