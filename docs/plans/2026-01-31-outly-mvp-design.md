# Outly MVP Design - Weather & Traffic Risk Alerts

## Overview

Mobile-first app (Expo) that provides intelligent risk alerts combining weather + traffic + community signals to help users decide when and how to move safely.

**Core Value:** A dynamic Risk Score (0-100) that answers "Is it safe to leave now?"

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | Mobile-first (Expo) | Core use case is mobile - checking before leaving |
| Weather API | OpenWeatherMap + Tomorrow.io | OWM for general conditions, Tomorrow.io for minute-by-minute nowcasting |
| Traffic API | HERE Traffic | 250K free calls/month, good LATAM coverage, incident detection |
| Community voting | Simple equal-weight | MVP simplicity, no reputation tracking yet |
| Location handling | Saved + current on-demand | Saved for alerts, current when app is open, no background tracking |
| Risk Score | Weighted average | 40% weather + 40% traffic + 20% events |
| Notifications | Threshold + time-based | Free: score spikes, Pro: smart departure |
| Data fetching | Convex scheduled functions | 10 min intervals with regional batching |

---

## Data Model (Convex Schema)

```typescript
// events - weather and traffic incidents
events: defineTable({
  type: v.union(v.literal("weather"), v.literal("traffic")),
  subtype: v.string(),                    // "storm", "accident", "flood", etc.
  location: v.object({
    lat: v.number(),
    lng: v.number(),
  }),
  radius: v.number(),                     // affected area in meters
  severity: v.number(),                   // 1-5
  source: v.union(
    v.literal("openweathermap"),
    v.literal("tomorrow"),
    v.literal("here"),
    v.literal("user")
  ),
  confidenceScore: v.number(),            // 0-100
  ttl: v.number(),                        // expires at timestamp
  rawData: v.optional(v.any()),           // original API response
})

// userLocations - saved places (home, work, etc.)
userLocations: defineTable({
  userId: v.string(),                     // Clerk user ID
  name: v.string(),                       // "Home", "Work", "Gym"
  location: v.object({
    lat: v.number(),
    lng: v.number(),
  }),
  address: v.optional(v.string()),        // Display address
  isDefault: v.boolean(),                 // Primary location for alerts
  pushToken: v.optional(v.string()),      // Expo push token
})
  .index("by_user", ["userId"])

// confirmations - community votes on events
confirmations: defineTable({
  eventId: v.id("events"),
  userId: v.string(),
  vote: v.union(
    v.literal("still_active"),
    v.literal("cleared"),
    v.literal("not_exists")
  ),
})
  .index("by_event", ["eventId"])
  .index("by_user_event", ["userId", "eventId"])

// riskSnapshots - calculated risk per location
riskSnapshots: defineTable({
  locationId: v.id("userLocations"),
  userId: v.string(),
  score: v.number(),                      // 0-100
  classification: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high")
  ),
  breakdown: v.object({
    weatherScore: v.number(),
    trafficScore: v.number(),
    eventScore: v.number(),
  }),
  weatherData: v.optional(v.any()),       // cached API data
  trafficData: v.optional(v.any()),       // cached API data
})
  .index("by_location", ["locationId"])
  .index("by_user", ["userId"])
```

---

## External API Integration

### Weather APIs

**OpenWeatherMap (One Call API 3.0)**
- Endpoint: `https://api.openweathermap.org/data/3.0/onecall`
- Data: Current conditions, 48h forecast, severe alerts
- Free tier: 1,000 calls/day
- Used for: General conditions, severe weather alerts

**Tomorrow.io**
- Endpoint: `https://api.tomorrow.io/v4/timelines`
- Data: Minute-by-minute precipitation (60 min)
- Free tier: 500 calls/day
- Used for: Nowcasting ("should I wait 10 minutes?")

### Traffic API

**HERE Traffic API**
- Endpoint: `https://data.traffic.hereapi.com/v7/flow`
- Data: Incidents, flow data, congestion level (jamFactor 0-10)
- Free tier: 250,000 calls/month
- Used for: Traffic score, incident detection

### Regional Batching

Locations grouped into ~50km grid cells:
- 1 API call per cell (not per user)
- Significantly reduces API usage
- Users in same city share weather data

---

## Risk Score Calculation

### Formula

```
riskScore = (weatherScore × 0.4) + (trafficScore × 0.4) + (eventScore × 0.2)
```

### Classification

| Score | Classification | Color |
|-------|---------------|-------|
| 0-33 | Low | Green |
| 34-66 | Medium | Yellow |
| 67-100 | High | Red |

### Weather Score Thresholds

| Condition | Points |
|-----------|--------|
| Rain > 10mm/h | +30 |
| Wind > 60km/h | +25 |
| Visibility < 200m | +40 |
| Severe alert (tornado, flash flood) | +50 |
| Temperature extreme (>40°C or <-10°C) | +15 |

### Traffic Score Thresholds

| Condition | Points |
|-----------|--------|
| Jam factor > 7 | +40 |
| Jam factor > 5 | +20 |
| Accident nearby (<5km) | +30 |
| Road closure | +50 |
| Construction | +10 |

### Event Score (Community)

| Condition | Points |
|-----------|--------|
| 3+ "still_active" confirmations | +20 |
| High-severity event nearby | +30 |
| Recent confirmation (<30min) | +10 bonus |

### Confirmation Impact

| Vote | Confidence Change |
|------|------------------|
| still_active | +10 |
| cleared | -20 |
| not_exists | -30 |

---

## Mobile App Structure

```
app/
├── (auth)/
│   ├── sign-in.tsx              # Clerk auth (existing)
│   └── sign-up.tsx
│
├── (tabs)/
│   ├── _layout.tsx              # Bottom tab navigator
│   ├── index.tsx                # HOME - Risk Dashboard
│   ├── events.tsx               # EVENTS - Community Feed
│   └── settings.tsx             # SETTINGS
│
├── event/
│   └── [id].tsx                 # Event detail + confirm
│
├── location/
│   ├── add.tsx                  # Add new location
│   └── [id].tsx                 # Edit location
│
├── report-event.tsx             # User-submitted event
└── _layout.tsx                  # Root layout with providers
```

### Key Screens

**Home (Risk Dashboard)**
- Large Risk Score circle (animated, color-coded)
- Current location conditions
- Saved locations list with mini scores
- Active alerts banner
- Pull-to-refresh

**Events (Community Feed)**
- List of active events (weather + traffic)
- Filter by type (all / weather / traffic)
- Filter by severity
- Confirmation buttons on each card
- FAB to report new event

**Settings**
- Manage saved locations
- Notification preferences
- Alert sensitivity threshold
- Pro upgrade CTA

### Key Components

| Component | Purpose |
|-----------|---------|
| `RiskCircle` | Animated score display with color gradient |
| `EventCard` | Event info + ✅ 🟢 ❌ confirmation buttons |
| `LocationCard` | Saved location with mini risk indicator |
| `AlertBanner` | Dismissible banner for active severe alerts |
| `LocationSearch` | Autocomplete for adding locations |

---

## Push Notifications

### Architecture

1. **Token Registration**
   - `expo-notifications` captures push token
   - Stored in `userLocations.pushToken`

2. **Alert Checker (Scheduled Function)**
   - Runs every 10 minutes
   - Compares current vs previous riskSnapshot
   - Triggers notification if threshold crossed

3. **Delivery**
   - Expo Push API (`exp.host/--/api/v2/push/send`)
   - Deep links to event/location on tap

### Notification Types

| Type | Trigger | Priority | Example |
|------|---------|----------|---------|
| Risk Spike | Score → High | High | "🔴 Riesgo alto en Casa" |
| Severe Weather | API alert | High | "🌪️ Alerta de tornado cerca" |
| Traffic Critical | Jam factor > 8 | High | "🚗 Accidente en tu ruta" |
| Departure (Pro) | 30min before usual | Normal | "⏰ Salí ahora, riesgo sube en 20min" |

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Convex schema (events, userLocations, confirmations, riskSnapshots)
- [ ] Environment variables for API keys
- [ ] OpenWeatherMap integration action
- [ ] Tomorrow.io integration action
- [ ] HERE Traffic integration action
- [ ] Risk Score calculation function
- [ ] Scheduled job for data fetching (10 min)

### Phase 2: Mobile Screens
- [ ] Home tab with RiskCircle component
- [ ] Saved locations list
- [ ] Add location screen with search
- [ ] Current location permission + fetching
- [ ] Pull-to-refresh functionality

### Phase 3: Events & Community
- [ ] Events feed screen
- [ ] Event detail screen
- [ ] Confirmation voting UI
- [ ] Confidence score adjustment mutations
- [ ] User event reporting form

### Phase 4: Push Notifications
- [ ] expo-notifications setup
- [ ] Push token registration mutation
- [ ] Alert checker scheduled function
- [ ] Notification deep linking

### Phase 5: Polish & Pro (Post-MVP)
- [ ] Onboarding flow
- [ ] Settings preferences
- [ ] Pro upgrade paywall
- [ ] Smart departure alerts

---

## MVP Scope

### In Scope
- ✅ Real weather + traffic data from APIs
- ✅ Risk Score calculation and display
- ✅ Saved locations management
- ✅ Community event confirmations
- ✅ Push notifications for high risk

### Out of Scope (Future)
- ❌ CarPlay integration
- ❌ iOS/Android widgets
- ❌ Smart departure time learning
- ❌ Web dashboard
- ❌ Gamification / user profiles
- ❌ Navigation / routing

---

## Environment Variables Required

```bash
# Weather APIs
OPENWEATHERMAP_API_KEY=
TOMORROW_IO_API_KEY=

# Traffic API
HERE_API_KEY=

# Existing (already configured)
CONVEX_DEPLOYMENT=
CLERK_SECRET_KEY=
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
EXPO_PUBLIC_CONVEX_URL=
```

---

## API Rate Limit Strategy

| API | Free Limit | Strategy |
|-----|-----------|----------|
| OpenWeatherMap | 1,000/day | Regional batching, 10min cache |
| Tomorrow.io | 500/day | Only for active users, on-demand |
| HERE Traffic | 250,000/month | Regional batching, shared per city |

With 100 active users across 5 cities:
- Weather: ~144 calls/day (6 calls/hour × 24h)
- Traffic: ~144 calls/day
- Total: ~288/day (well under limits)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Alert accuracy | >80% confirmed by users |
| Push open rate | >25% |
| DAU / MAU | >30% |
| Confirmations per event | >3 average |
| Time to first saved location | <2 min |
