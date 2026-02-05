# Outia UX Overhaul Plan - From Data Dashboard to Decision Assistant

**Date:** February 5, 2026
**Goal:** Transform Outia from a 4/10 data dashboard into an 8/10 decision assistant that justifies $2.99/month.
**Principle:** Show WHAT to do, not just WHAT the data says.

---

## Phase 1: Copy & Information Architecture Rewrite (Foundation)

The biggest problem isn't visual — it's language. The app speaks in "risk scores" when users think in "minutes late." This phase rewrites every user-facing string without touching layout.

### TODO 1.1: Rewrite DepartureHero messaging
**File:** `apps/native/components/departure-hero.tsx`
**What:** Replace ambiguous "LEAVE IN 1H 45M" with clear, contextual messaging:
- When optimal is NOW: "LEAVE NOW" + "Conditions are optimal right now"
- When optimal is soon (<30 min): "BEST WINDOW: 7:45 AM" + "Rain clears in 25 min"
- When optimal is later (>30 min): "WAIT UNTIL 8:30 AM" + "Traffic easing + storm passing"
- Always show: "If you leave now: +18 min delay" (trade-off clarity)
**Acceptance:** No user should be confused about whether to leave or wait.

### TODO 1.2: Rewrite condition cards to show impact, not labels
**File:** `apps/native/components/condition-cards.tsx`
**What:** Replace "Storm / Gridlock" with actionable impact:
- Weather: "Heavy rain" → "+12 min drive time, low visibility"
- Traffic: "Gridlock" → "+25 min on Main St, 3 incidents"
- Show trend arrow: improving/worsening/stable
**Acceptance:** Each card answers "how does this affect MY commute?"

### TODO 1.3: Fix alerts deduplication and add meaningful context
**File:** `apps/native/components/alerts-section.tsx` + `packages/backend/convex/dashboard.ts`
**What:**
- Deduplicate alerts by subtype+location (no more 3x "RoadClosure")
- Show distance: "0.3 mi away" or "On your route"
- Show community validation: "Confirmed by 12 drivers"
- Prioritize by route relevance, not just proximity
**Acceptance:** No duplicate alerts. Each alert shows distance + validation.

### TODO 1.4: Fix route naming — show real place names
**Files:** `apps/native/components/routes-preview.tsx`, `apps/native/app/(tabs)/saved.tsx`
**What:** Replace "124 to 1440" with actual fromName/toName from route data. The backend already stores `fromName` and `toName` — the frontend just needs to use them properly.
**Acceptance:** Every route shows human-readable names (e.g., "Home → Office").

### TODO 1.5: Rewrite paywall — remove fake social proof, clarify PRO value
**File:** `apps/native/app/paywall.tsx`
**What:**
- REMOVE "Join 2,400+ commuters" and fake 4.9 rating (Apple rejection risk)
- Rewrite PRO features with concrete value:
  - "Smart Departure Alerts: Morning push notifications at the perfect time"
  - "ETA Impact: See exact delay in minutes, not just risk scores"
  - "Unlimited Routes: Monitor all your daily commutes"
- Add: "Try free for 7 days, cancel anytime"
**Acceptance:** Zero fabricated metrics. Each PRO feature has a clear, concrete description.

### TODO 1.6: Add "reason why" to timeline slots
**File:** `apps/native/components/risk-timeline.tsx`
**What:** Each timeline slot should show WHY the score changes:
- "7:10 (85) — Rush hour peak"
- "7:25 (82) — Rain lightening"
- "7:40 (78) — Traffic clearing"
Add a `reason` field to forecast slots in dashboard.ts
**Acceptance:** Every timeline slot has a brief reason for its score.

---

## Phase 2: Home Screen UX Redesign (Core Experience)

Restructure the home screen to lead with decisions, not data. The risk score becomes secondary to departure guidance.

### TODO 2.1: Redesign DepartureHero — departure time is hero, score is secondary
**File:** `apps/native/components/departure-hero.tsx`
**What:** Complete visual redesign:
- Primary: Large departure time "7:45 AM" with "Best time to leave" label
- Secondary: Risk score as a small pill badge (not the giant semi-ring)
- Add: "If you leave now" vs "If you wait" comparison (2 rows)
- Add: Pulsing CTA button "Set Smart Alarm" or "Navigate Now"
- Replace 200px semi-ring with a cleaner, compact risk indicator
**Acceptance:** First thing user sees is WHEN to leave, not a number.

### TODO 2.2: Redesign home header — contextual insight, not greeting
**File:** `apps/native/app/(tabs)/index.tsx` (HomeHeader component)
**What:** Replace generic "Good afternoon, Lucas" with:
- "Your commute looks rough today" (when risk > 60)
- "Great conditions for your drive" (when risk < 30)
- "Storm passing — improving by 7:45 AM" (when improving)
Keep name smaller as subtitle, use location as context
**Acceptance:** Header communicates the #1 thing the user needs to know.

### TODO 2.3: Add "Set Departure Alert" CTA to home screen
**Files:** `apps/native/app/(tabs)/index.tsx`, new component `apps/native/components/departure-alert-cta.tsx`
**What:** Below the hero, add a prominent CTA:
- "Notify me at the best time" → Sets a push notification for optimal departure
- Show current setting: "Alert set for 7:45 AM" with edit option
- This is the KEY premium differentiator — make it visible
**Acceptance:** One-tap to set departure notification from home screen.

### TODO 2.4: Redesign routes preview with risk per route
**File:** `apps/native/components/routes-preview.tsx`
**What:** Each route card should show:
- Route name with from→to
- Current risk as colored dot (not number)
- ETA: "32 min" (normal) or "47 min (+15)" (delayed)
- Optimal time: "Best at 7:45 AM"
- "Go Now" only when risk is low, otherwise "View Details"
**Acceptance:** Route cards are self-contained decision aids.

### TODO 2.5: Add "time saved" counter to home screen
**File:** New component `apps/native/components/time-saved-banner.tsx`
**What:** Small banner below hero: "Outia saved you 47 min this week" or for new users: "Set up your first route to start optimizing"
**Acceptance:** Users see ROI of using the app.

---

## Phase 3: Visual Design Elevation (Premium Feel)

Make the app LOOK worth paying for. Focus on brand presence, component polish, and micro-interactions.

### TODO 3.1: Apply brand colors to surfaces, not just buttons
**File:** `apps/native/lib/design-tokens.ts`, all screen files
**What:**
- Home screen top area: Subtle Deep Indigo → White gradient background
- Section headers: Deep Indigo color (#1A1464)
- Active tab: Indigo Blue (#4B3BF5) instead of generic blue
- Cards: Increase shadow to 0.10-0.12 opacity
**Acceptance:** Brand colors are visible on every screen without overwhelming.

### TODO 3.2: Redesign timeline chips — bigger, with icons and gradients
**File:** `apps/native/components/risk-timeline.tsx`
**What:**
- Increase chip size: 64px → 80px wide, 80px → 110px tall
- Add weather/traffic mini-icon at top of chip
- Background gradient based on risk color (subtle, 10% opacity)
- Active/NOW chip gets glow effect using risk shadow tokens
- Score font: larger (20px → 28px), JetBrains Mono
**Acceptance:** Timeline is visually the 2nd most prominent element after hero.

### TODO 3.3: Redesign condition cards with visual impact
**File:** `apps/native/components/condition-cards.tsx`
**What:**
- Add colored left accent border (4px) matching severity
- Weather card: Blue-tinted background when active
- Traffic card: Amber-tinted background when active
- Larger status text (16px → 20px)
- Add trend arrow icon (improving ↓ / worsening ↑ / stable →)
**Acceptance:** Cards visually communicate severity at a glance.

### TODO 3.4: Alert cards with visual priority differentiation
**File:** `apps/native/components/alerts-section.tsx`
**What:**
- High severity (4-5): Red left accent + light red background
- Medium severity (3): Amber left accent
- Low severity (1-2): Default styling
- Add distance badge in top-right corner
- First alert (most relevant) gets elevated shadow
**Acceptance:** User can see priority without reading text.

### TODO 3.5: Polish micro-interactions and animations
**Files:** Multiple component files
**What:**
- Cards: Subtle press-in animation (scale 0.98) on touch
- Vote buttons: Animated fill on press (like Instagram heart)
- Tab bar: Active icon bounces on selection
- Pull-to-refresh: Custom animation matching brand
- Skeleton loading: Shimmer effect instead of grey boxes
**Acceptance:** Every interaction has tactile + visual feedback.

---

## Phase 4: Map Screen UX Improvements

Make the map screen useful for route-based decisions, not just event viewing.

### TODO 4.1: Add route-aware event filtering
**File:** `apps/native/app/(tabs)/map.tsx`
**What:** Add filter chips above the map:
- "On my route" (default) — Shows only events affecting saved routes
- "Nearby" — Current behavior (all events within radius)
- "All" — Everything
This reduces noise dramatically for daily commuters.
**Acceptance:** Default map view shows only route-relevant events.

### TODO 4.2: Show vote count on event detail sheet
**File:** `apps/native/app/(tabs)/map.tsx` (EventDetailSheet)
**What:**
- Add vote tally: "15 confirm active · 3 say cleared"
- Show confidence bar based on votes
- Add "X drivers nearby" for community context
- After voting: "Thanks! 89% agreed with you"
**Acceptance:** Users see social proof before voting.

### TODO 4.3: Add "Navigate" deep link button
**File:** `apps/native/app/(tabs)/map.tsx` (EventDetailSheet)
**What:** Add button to open event location in Apple Maps/Google Maps/Waze:
- "Avoid this area" → Opens navigation app with event location as waypoint to avoid
- Uses `Linking.openURL` with apple/google maps URL schemes
**Acceptance:** One-tap to navigate around reported events.

### TODO 4.4: Improve event detail sheet with community info
**File:** `apps/native/app/(tabs)/map.tsx` (EventDetailSheet), backend changes
**What:**
- Show who reported: "Reported by community" or "Official source"
- Show vote breakdown: progress bar of still_active vs cleared
- Add "Affects your route: Home → Office" if event is on a saved route
**Acceptance:** Event sheet provides full context for decision-making.

---

## Phase 5: Saved Routes & Settings Polish

### TODO 5.1: Fix "No Changes" button label and add current risk
**File:** `apps/native/app/(tabs)/saved.tsx`
**What:**
- Rename "No Changes" → "Save Changes" (only visible when dirty)
- Show current risk score per route: colored badge
- Show last checked time: "Updated 2 min ago"
- Add route map thumbnail preview
**Acceptance:** Route management screen is clear and informative.

### TODO 5.2: Settings — surface "My Impact" and subscription value
**File:** `apps/native/app/(tabs)/settings.tsx`
**What:**
- Move "My Impact" to top of settings with inline stats: "Level 3 · 1,500 pts · 87% accuracy"
- For free users: Add upgrade banner with concrete benefit
- Show notification status inline (not just a link)
**Acceptance:** Settings screen communicates user's engagement and PRO value.

### TODO 5.3: Add "time saved" tracking to backend
**File:** New `packages/backend/convex/analytics.ts`
**What:**
- Track when user follows departure recommendation (opened app → left at recommended time)
- Calculate estimated time saved vs. leaving at typical time
- Store weekly/monthly aggregates
- Expose via query for home screen banner and settings
**Acceptance:** Backend tracks and surfaces ROI metrics.

---

## Phase 6: Smart Departure Notifications (P0 Revenue Feature)

The #1 feature that justifies charging money. Users get push notifications at the optimal departure time.

### TODO 6.1: Build notification scheduler in backend
**File:** New `packages/backend/convex/scheduled/departureAlerts.ts`
**What:**
- Cron job: Check all active routes 30 min before each user's alert time
- For each route: Calculate current forecast, find optimal window
- Send push notification: "Leave for work in 15 min — conditions optimal until 8:15 AM"
- Respect user preferences: quiet hours, frequency limits
**Acceptance:** Users receive one push notification per route per day at the right time.

### TODO 6.2: Build push notification infrastructure
**Files:** New `apps/native/lib/notifications.ts`, updates to `apps/native/app/_layout.tsx`
**What:**
- Register for push notifications via expo-notifications
- Store push token in Convex users table
- Handle notification tap → Open app to relevant route
- Permission request flow during onboarding
**Acceptance:** Push notifications work end-to-end on iOS and Android.

### TODO 6.3: Build "Set Alert" UI flow
**Files:** New `apps/native/components/departure-alert-setup.tsx`
**What:**
- Bottom sheet from home screen CTA
- Pick route, set target arrival time, confirm
- "We'll notify you at the perfect time"
- Show confirmation: "Alert set for Home → Office, target arrival 9:00 AM"
**Acceptance:** Users can set departure alerts in under 10 seconds.

### TODO 6.4: Gate unlimited alerts behind PRO
**Files:** `apps/native/app/paywall.tsx`, notification logic
**What:**
- Free: 1 departure alert per day
- PRO: Unlimited alerts, all routes, priority notifications
- Show upgrade prompt when free user tries to add 2nd alert
**Acceptance:** Clear PRO value tied to daily usage.

---

## Execution Strategy

| Phase | Focus | Duration | Commits |
|-------|-------|----------|---------|
| 1 | Copy & IA Rewrite | 1 session | Fix language, dedup alerts, fix paywall |
| 2 | Home Screen Redesign | 1 session | Hero, header, routes, CTA |
| 3 | Visual Design | 1 session | Colors, timeline, cards, animations |
| 4 | Map UX | 1 session | Filters, votes, navigation |
| 5 | Routes & Settings | 1 session | Polish, analytics backend |
| 6 | Smart Notifications | 1-2 sessions | Backend scheduler, push infra, UI flow |

**Each phase is self-contained and shippable.**
**We execute 1 phase at a time, with 1 subagent per TODO.**
