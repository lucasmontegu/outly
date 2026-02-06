# Route Improvements Implementation Checklist

Use this checklist to track progress on transforming Outia's routes from amateur straight lines to professional road-following polylines.

---

## Phase 1: Core Road-Following Polylines ✅ COMPLETE

### Backend
- [x] Create `/packages/backend/convex/integrations/routing.ts`
  - [x] HERE Routing API v8 wrapper
  - [x] `getRouteAlternatives` action (returns 3 routes)
  - [x] Flexible polyline decoder function
- [x] Update `/packages/backend/convex/schema.ts`
  - [x] Add `polyline` field (array of lat/lng)
  - [x] Add `alternatives` field (3 routes with traffic data)
  - [x] Add `polylineFetchedAt` timestamp
- [x] Update `/packages/backend/convex/routes.ts`
  - [x] Import routing API
  - [x] Add `fetchRoutePolylines` action
  - [x] Add `updatePolylines` mutation
  - [x] Add `refreshAllPolylines` cron action
  - [x] Trigger polyline fetch on route creation
  - [x] Update `routeDoc` validator with new fields

### Frontend
- [x] Create `/apps/native/lib/polyline-decoder.ts`
  - [x] `decodeFlexiblePolyline` function
  - [x] `samplePolylineByDistance` utility
  - [x] `calculateRouteDistance` utility
  - [x] `simplifyPolyline` utility (Douglas-Peucker)
- [x] Update `/apps/native/components/map/route-polyline-group.tsx`
  - [x] Add polyline type to RouteData
  - [x] Use polyline if available, fallback to straight line
  - [x] Render alternative routes (dashed gray) when selected
  - [x] Proper z-index ordering

### Testing
- [ ] Deploy backend: `npx convex deploy`
- [ ] Set `HERE_API_KEY` in Convex production env
- [ ] Start native app: `npm run dev:native`
- [ ] Create new route in app
- [ ] Verify polyline loads within 2 seconds
- [ ] Check Convex dashboard for routing API logs
- [ ] Confirm route follows roads on map
- [ ] Test with short route (<10km)
- [ ] Test with medium route (10-50km)
- [ ] Test with long route (>50km)
- [ ] Verify alternative routes show when tapped
- [ ] Test on iOS device
- [ ] Test on Android device

### Known Issues
- [ ] None yet - add as discovered

---

## Phase 2: Enhanced Search & Weather (2-3 hours)

### Better Address Search

#### Backend
- [ ] Create `/packages/backend/convex/integrations/search.ts`
  - [ ] `searchLocations` action (HERE Autosuggest)
  - [ ] `getPlaceDetails` action (HERE Lookup)
  - [ ] Spanish language support
  - [ ] User location proximity sorting

#### Frontend
- [ ] Create `/apps/native/hooks/use-location-search.ts`
  - [ ] Debounced search (300ms)
  - [ ] Loading state
  - [ ] Error handling
  - [ ] Clear function
- [ ] Update `/apps/native/app/(tabs)/map.tsx`
  - [ ] Replace Nominatim with HERE Autosuggest (lines 733-792)
  - [ ] Update search result type
  - [ ] Update handleSearchSelect
  - [ ] Remove old searchLocations function
- [ ] Update `/apps/native/app/(setup)/saved-locations.tsx`
  - [ ] Use new search hook
  - [ ] Better Argentina address handling

#### Testing
- [ ] Search for "Calle Florida, Buenos Aires"
- [ ] Search for "Obelisco"
- [ ] Search for business/POI
- [ ] Verify results are accurate
- [ ] Test autocomplete speed (<500ms)
- [ ] Test with 2-char query (should show nothing)
- [ ] Test with 3+ char query (should show results)

### Weather Waypoints Along Route

#### Backend
- [ ] Create `/packages/backend/convex/lib/polyline-utils.ts`
  - [ ] `samplePolylineByDistance` function
  - [ ] `haversineDistance` helper
  - [ ] `getGridCell` helper
- [ ] Update `/packages/backend/convex/routes.ts`
  - [ ] Add `getRouteWeatherWaypoints` query
  - [ ] Sample route every 50km
  - [ ] Fetch cached weather for each waypoint
  - [ ] Return temperature, condition, icon, wind

#### Frontend
- [ ] Create `/apps/native/components/map/weather-waypoint-marker.tsx`
  - [ ] Bubble design (white bg, blue border)
  - [ ] Large temperature number
  - [ ] Small distance label
  - [ ] Weather icon (optional Phase 3)
  - [ ] Tap to show details (optional Phase 3)
- [ ] Update `/apps/native/app/(tabs)/map.tsx`
  - [ ] Query waypoints for selected route
  - [ ] Render WeatherWaypointMarker components
  - [ ] Only show for selected route
  - [ ] Hide when route deselected

#### Testing
- [ ] Select route on map
- [ ] Verify weather bubbles appear every ~50km
- [ ] Check temperature accuracy
- [ ] Test with short route (should show 2-3 waypoints)
- [ ] Test with long route (should show 5+ waypoints)
- [ ] Verify bubbles don't overlap
- [ ] Test tap behavior (if implemented)

### Dark Mode Map Styling

#### Android
- [ ] Create `/apps/native/assets/map-styles/dark.json`
  - [ ] Dark background (#1d2c4d)
  - [ ] Muted road colors (#38414e)
  - [ ] Dark water (#0e1626)
  - [ ] Visible labels (#8ec3b9)
- [ ] Update `/apps/native/app/(tabs)/map.tsx`
  - [ ] Import dark style JSON
  - [ ] Use `useColorScheme()` hook
  - [ ] Apply `customMapStyle` prop (Android only)

#### iOS
- [ ] No code needed - Apple Maps follows system automatically

#### Testing
- [ ] Enable dark mode on device
- [ ] Open map screen
- [ ] Verify map is dark (Android)
- [ ] Verify map is dark (iOS - should be automatic)
- [ ] Check polyline visibility (should contrast)
- [ ] Check marker visibility
- [ ] Switch to light mode
- [ ] Verify map is light

---

## Phase 3: Traffic Visualization & Route Alternatives (3-4 hours)

### Traffic-Colored Route Segments

#### Backend
- [ ] Update `/packages/backend/convex/routes.ts`
  - [ ] Add `getRouteTrafficSegments` query
  - [ ] Split polyline into segments
  - [ ] Query traffic events along route
  - [ ] Assign jam factor to each segment
  - [ ] Map jam factor to congestion level (free_flow/moderate/slow/jam)
  - [ ] Merge adjacent segments with same level

#### Frontend
- [ ] Create `/apps/native/components/map/traffic-colored-route.tsx`
  - [ ] Render multiple polylines (one per segment)
  - [ ] Map congestion to color (green/yellow/orange/red)
  - [ ] Handle selected/unselected states
  - [ ] Proper z-index
- [ ] Update `/apps/native/components/map/route-polyline-group.tsx`
  - [ ] Query traffic segments
  - [ ] Replace single polyline with TrafficColoredRoute
  - [ ] Keep fallback for no traffic data

#### Testing
- [ ] Select route with known traffic
- [ ] Verify segments are colored correctly
- [ ] Green = free flow
- [ ] Yellow = moderate
- [ ] Orange = slow
- [ ] Red = jam
- [ ] Test with no traffic data (should show gray)
- [ ] Test segment transitions (smooth color changes)

### Alternative Routes UI

#### Backend
- [ ] Already done - alternatives stored in route.alternatives field

#### Frontend
- [ ] Create `/apps/native/components/map/route-alternatives-sheet.tsx`
  - [ ] Bottom sheet with 3 route options
  - [ ] Show ETA, distance, traffic for each
  - [ ] Highlight selected route
  - [ ] Tap to switch route
- [ ] Update `/apps/native/app/(tabs)/map.tsx`
  - [ ] Add "Show Alternatives" button
  - [ ] Toggle alternatives sheet
  - [ ] Switch between routes
  - [ ] Update map polylines when switching

#### Design
- [ ] Primary route: Blue, solid, 6px
- [ ] Alt route 1: Gray, dashed, 3px
- [ ] Alt route 2: Gray, dashed, 3px
- [ ] Cards show: Name, ETA, Distance, Traffic, Diff from fastest

#### Testing
- [ ] Tap route on map
- [ ] Tap "Show Alternatives"
- [ ] Verify 3 routes shown
- [ ] Fastest is highlighted
- [ ] Tap alternative route
- [ ] Map updates to show new route
- [ ] Bottom card updates with new ETA
- [ ] Test with route that has no alternatives

### Route Details Card Enhancement

#### Frontend
- [ ] Update route details card (map event sheet)
  - [ ] Add ETA (large, bold)
  - [ ] Add distance
  - [ ] Add arrival time estimate
  - [ ] Add traffic indicator (light/moderate/heavy)
  - [ ] Add weather warning badges
  - [ ] Style like Google Maps bottom card
- [ ] Add departure optimization hint
  - [ ] "Leave now" vs "Leave in 15 min"
  - [ ] Show time savings
  - [ ] Link to smart departure screen

#### Testing
- [ ] Select route on map
- [ ] Verify card shows correct ETA
- [ ] Check distance is accurate
- [ ] Verify arrival time calculation
- [ ] Test traffic indicator
- [ ] Check weather warnings
- [ ] Tap optimization hint
- [ ] Should navigate to departure screen

---

## Phase 4: Polish & Optimization (2-3 hours)

### Performance Optimization

#### Polyline Simplification
- [ ] Add simplification for routes >500 points
- [ ] Use Douglas-Peucker with 100m tolerance
- [ ] Apply before rendering
- [ ] Test with very long routes (>200km)

#### Render Debouncing
- [ ] Debounce polyline re-renders on map pan
- [ ] Use 300ms delay
- [ ] Show loading placeholder
- [ ] Test smooth zoom/pan

#### Caching
- [ ] Verify 24h TTL on polylines
- [ ] Verify 15min TTL on weather waypoints
- [ ] Verify 5min TTL on traffic segments
- [ ] Monitor cache hit rates

### UX Polish

#### Loading States
- [ ] Show skeleton polyline while fetching
- [ ] Show loading indicator on waypoints
- [ ] Show "Updating traffic..." toast
- [ ] Smooth fade-in animations

#### Error Handling
- [ ] Fallback to straight line if routing fails
- [ ] Show toast: "Using straight line route"
- [ ] Log error to Convex
- [ ] Retry button

#### Accessibility
- [ ] VoiceOver labels for markers
- [ ] VoiceOver labels for route segments
- [ ] High contrast mode support
- [ ] Larger tap targets (48x48 minimum)

### Monitoring

#### Analytics
- [ ] Track polyline fetch success rate
- [ ] Track average fetch time
- [ ] Track route creation funnel
- [ ] Track alternative route switches
- [ ] Track waypoint taps

#### Error Logging
- [ ] Log routing API errors
- [ ] Log polyline decode failures
- [ ] Log map render errors
- [ ] Set up alerts for >5% error rate

---

## Optional: Advanced Features (Future)

### Turn-by-Turn Preview
- [ ] Parse HERE route steps
- [ ] Show maneuvers list
- [ ] Show lane guidance
- [ ] Show street names

### 3D Map View
- [ ] Enable 3D buildings (MapView prop)
- [ ] Tilt/rotate gestures
- [ ] Terrain elevation
- [ ] Camera animations

### Offline Routes
- [ ] Cache polylines locally (AsyncStorage)
- [ ] Cache weather data
- [ ] Offline map tiles (Mapbox)
- [ ] Sync when online

### Voice Guidance
- [ ] Text-to-speech for directions
- [ ] Background audio
- [ ] Distance callouts
- [ ] Warning callouts

### Route Sharing
- [ ] Generate shareable link
- [ ] Deep link to route view
- [ ] Social media preview image
- [ ] "Share my ETA" feature

---

## Deployment Checklist

### Pre-Deploy
- [ ] All Phase 1 tests passing
- [ ] TypeScript compiles without errors
- [ ] No console errors in Metro
- [ ] No warnings in Convex dashboard

### Backend Deploy
- [ ] `npx convex deploy`
- [ ] Verify routing API enabled in HERE dashboard
- [ ] Set `HERE_API_KEY` in Convex production
- [ ] Test routing action in Convex dashboard
- [ ] Verify cron job scheduled (daily at 3 AM)

### Frontend Deploy
- [ ] Build iOS: `eas build --platform ios`
- [ ] Build Android: `eas build --platform android`
- [ ] Test internal build on TestFlight
- [ ] Test internal build on Google Play Internal Testing
- [ ] Get 3-5 beta tester feedback
- [ ] Fix critical bugs

### App Store Update
- [ ] Update app screenshots (show new routes)
- [ ] Update description: "Professional routing with traffic"
- [ ] Bump version number
- [ ] Submit for review
- [ ] Monitor crash reports

---

## Success Criteria

### Quantitative
- [ ] 99%+ polyline fetch success rate
- [ ] <2 second polyline load time
- [ ] <100ms map render time
- [ ] 0 crashes related to routing
- [ ] <5% routing API error rate

### Qualitative
- [ ] Routes look professional (like Google Maps)
- [ ] Users say "Wow, this looks great!"
- [ ] No complaints about straight lines
- [ ] Positive app store reviews mentioning routing
- [ ] Beta testers prefer new routes

### Business
- [ ] +30% route creation after update
- [ ] +20% session time on map screen
- [ ] +50% route taps/interactions
- [ ] 4.5+ star average in app stores
- [ ] Featured in "New & Updated" section

---

## Timeline Estimate

### Week 1
- **Mon:** Phase 1 testing & fixes (2 hours)
- **Tue:** Phase 2 - Search implementation (3 hours)
- **Wed:** Phase 2 - Weather waypoints (2 hours)
- **Thu:** Phase 2 - Dark mode (1 hour)
- **Fri:** Phase 2 testing (2 hours)

### Week 2
- **Mon:** Phase 3 - Traffic segments (3 hours)
- **Tue:** Phase 3 - Alternative routes UI (2 hours)
- **Wed:** Phase 3 - Route details card (2 hours)
- **Thu:** Phase 4 - Optimization (3 hours)
- **Fri:** Beta testing & fixes (3 hours)

### Week 3
- **Mon:** Final polish & bug fixes (3 hours)
- **Tue:** Build & submit (2 hours)
- **Wed-Fri:** Review period (monitor)

**Total Effort:** ~25-30 hours over 3 weeks

---

## Resources

### Documentation
- [Full Implementation Guide](./road-following-routes-guide.md)
- [Summary](./ROUTE-IMPROVEMENTS-SUMMARY.md)
- [Competitor Comparison](../competitor-ui/route-visualization-comparison.md)

### APIs
- [HERE Routing v8](https://developer.here.com/documentation/routing-api/8.27.0/)
- [HERE Autosuggest](https://developer.here.com/documentation/geocoding-search-api/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Expo MapView](https://docs.expo.dev/versions/latest/sdk/map-view/)

### Support
- Convex Dashboard: https://dashboard.convex.dev/
- HERE Status: https://status.here.com/
- Expo Forums: https://forums.expo.dev/

---

## Notes & Discoveries

### 2026-02-05
- Created core routing implementation
- HERE Routing API v8 integrated
- Flexible polyline decoder implemented
- Schema updated with polyline fields
- React Native component renders road-following polylines
- Alternative routes stored but not yet displayed in UI

### Add your notes here as you implement
- ...
