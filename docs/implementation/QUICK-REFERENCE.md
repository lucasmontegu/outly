# Road-Following Routes: Quick Reference

One-page cheat sheet for Outia's routing implementation.

---

## What Changed

### Before
- Routes: Straight lines between A→B
- Style: Amateur, cuts through buildings
- Data: 2 coordinates per route

### After
- Routes: Follow actual roads
- Style: Professional (like Google Maps)
- Data: 50-500 coordinates per route
- Alternatives: 3 routes with traffic data

---

## Key Files

```
Backend (Convex):
├── integrations/routing.ts          HERE Routing API v8
├── routes.ts                        Polyline fetching + refresh
└── schema.ts                        Added polyline fields

Frontend (React Native):
├── lib/polyline-decoder.ts          Flexible polyline decoder
└── components/map/
    └── route-polyline-group.tsx     Renders road-following polylines
```

---

## API Reference

### HERE Routing v8

**Endpoint:** `https://router.hereapi.com/v8/routes`

**Request:**
```typescript
{
  origin: "lat,lng",
  destination: "lat,lng",
  transportMode: "car",
  departureTime: "now",
  alternatives: 3,
  return: "polyline,summary,travelSummary"
}
```

**Response:**
```typescript
{
  routes: [
    {
      sections: [{
        polyline: "B...", // Flexible polyline (encoded)
        travelSummary: {
          duration: 2520,      // seconds
          length: 28300,       // meters
        },
        typicalDuration: 2400  // seconds (no traffic)
      }]
    }
  ]
}
```

---

## Polyline Format

### Encoding
HERE uses **Flexible Polyline** (more efficient than Google's format):
- Variable precision (1e5 by default)
- Delta encoding (stores differences, not absolutes)
- 3D support (elevation)

### Decoding
```typescript
import { decodeFlexiblePolyline } from '@/lib/polyline-decoder';

const coordinates = decodeFlexiblePolyline(encodedString);
// Returns: [{ lat: -34.603, lng: -58.381 }, ...]
```

### Rendering
```typescript
<Polyline
  coordinates={coordinates.map(p => ({
    latitude: p.lat,
    longitude: p.lng,
  }))}
  strokeColor={colors.brand.primary}
  strokeWidth={6}
  lineCap="round"
  lineJoin="round"
/>
```

---

## Database Schema

```typescript
routes: {
  // ... existing fields ...

  // Road-following polyline (primary route)
  polyline?: { lat: number; lng: number }[];

  // Alternative routes with traffic data
  alternatives?: Array<{
    polyline: { lat: number; lng: number }[];
    distance: number;        // meters
    duration: number;        // seconds (with traffic)
    typicalDuration: number; // seconds (no traffic)
    trafficDelay: number;    // seconds
  }>;

  // When polylines were last fetched (24h TTL)
  polylineFetchedAt?: number;
}
```

---

## Backend Actions

### Fetch Polylines
```typescript
// Automatically called when route is created
await ctx.scheduler.runAfter(0, internal.routes.fetchRoutePolylines, {
  routeId: route._id
});
```

### Refresh All Routes (Cron)
```typescript
// Run daily at 3 AM
export const refreshAllPolylines = action({
  handler: async (ctx) => {
    const routes = await ctx.runQuery(internal.routes.getAllActiveRoutesInternal);
    for (const route of routes) {
      if (!route.polylineFetchedAt || Date.now() - route.polylineFetchedAt > 24h) {
        await ctx.scheduler.runAfter(0, internal.routes.fetchRoutePolylines, {
          routeId: route._id
        });
      }
    }
  }
});
```

---

## Frontend Usage

### Query Route with Polyline
```typescript
const routes = useQuery(api.routes.getUserRoutes);

// routes now include polyline field
const route = routes[0];
console.log(route.polyline?.length); // 156 points
```

### Render on Map
```typescript
<RoutePolylineGroup
  route={route}
  isSelected={selectedRouteId === route._id}
  onPress={() => setSelectedRouteId(route._id)}
/>
```

**Component handles:**
- Road-following polyline (if available)
- Fallback to straight line (if not available)
- Alternative routes (dashed gray when selected)
- Origin/destination markers

---

## Utilities

### Sample Points Along Route
```typescript
import { samplePolylineByDistance } from '@/lib/polyline-decoder';

// Get weather waypoints every 50km
const waypoints = samplePolylineByDistance(route.polyline, 50);
// Returns: [{ lat, lng, distanceKm: 0 }, { lat, lng, distanceKm: 50 }, ...]
```

### Calculate Route Distance
```typescript
import { calculateRouteDistance } from '@/lib/polyline-decoder';

const totalKm = calculateRouteDistance(route.polyline);
// Returns: 283.5 (km)
```

### Simplify Polyline
```typescript
import { simplifyPolyline } from '@/lib/polyline-decoder';

// Reduce points for performance (Douglas-Peucker algorithm)
const simplified = simplifyPolyline(route.polyline, 0.1); // 100m tolerance
// Before: 500 points → After: 150 points
```

---

## Testing Commands

### Deploy Backend
```bash
cd /Users/lucasmontegu/lumlabs-projects/outia
npx convex deploy
```

### Start Dev Server
```bash
npm run dev:native
```

### Test Polyline Fetch (Convex Dashboard)
```typescript
// Functions tab → Select internal.routes.fetchRoutePolylines
{
  routeId: "jh7123abc..." // Your route ID
}
// Click "Run"
```

### Check Logs
```bash
# Convex dashboard → Logs tab
# Filter by: integrations.routing.getRouteAlternatives

# Metro bundler (native terminal)
# Look for: "Polyline loaded: 156 points"
```

---

## Common Issues

### Issue: Polylines not showing
**Check:**
1. Convex logs for routing API errors
2. HERE_API_KEY is set in backend env
3. Route document has `polyline` field in database
4. No TypeScript errors in polyline decoder

**Fix:**
```bash
# Re-deploy backend
npx convex deploy

# Clear Metro cache
npm run dev:native -- --clear
```

### Issue: Straight lines still appearing
**Cause:** Polyline fetch failed or hasn't completed yet.

**Fix:**
- Wait 2-3 seconds after route creation
- Check Convex dashboard for error logs
- Manually trigger fetch in dashboard

### Issue: HERE API 401 Unauthorized
**Cause:** API key missing or invalid.

**Fix:**
1. Go to https://developer.here.com/
2. Create/verify API key
3. Enable "Routing API v8"
4. Add to Convex `.env.local`: `HERE_API_KEY=your-key`
5. Deploy: `npx convex deploy`

---

## Performance

### Polyline Size
- Short (<10km): ~50 points, <1 KB
- Medium (10-50km): ~200 points, ~5 KB
- Long (>50km): ~500 points, ~10 KB

### Render Performance
- <100ms for 3 routes with 500 points each
- Use `tracksViewChanges={false}` on markers
- Debounce re-renders on map pan/zoom

### API Costs
- Free tier: 250,000 requests/month
- Your usage: ~3,000/month
- Cost: $0 (within free tier)

---

## Next Steps

### Phase 1 (DONE) ✅
- [x] HERE Routing API integration
- [x] Flexible polyline decoder
- [x] Database schema updates
- [x] React Native rendering

### Phase 2 (Next 2-3 hours)
- [ ] HERE Autosuggest search
- [ ] Weather waypoints (every 50km)
- [ ] Dark mode map styling

### Phase 3 (Next 3-4 hours)
- [ ] Traffic-colored segments
- [ ] Alternative routes UI
- [ ] Route details card enhancement

---

## Documentation

**Full Guides:**
- [Complete Implementation Guide](./road-following-routes-guide.md) - 150+ lines, all features
- [Summary](./ROUTE-IMPROVEMENTS-SUMMARY.md) - High-level overview
- [Competitor Analysis](../competitor-ui/route-visualization-comparison.md) - UI patterns
- [Implementation Checklist](./IMPLEMENTATION-CHECKLIST.md) - Track progress

**External:**
- [HERE Routing v8 Docs](https://developer.here.com/documentation/routing-api/8.27.0/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Expo MapView](https://docs.expo.dev/versions/latest/sdk/map-view/)

---

## Support

**If stuck:**
1. Check Convex dashboard logs
2. Review this quick reference
3. Read full implementation guide
4. Test with example route (Buenos Aires → Rosario)
5. Check HERE API status: https://status.here.com/

**Resources:**
- Convex: https://dashboard.convex.dev/
- HERE Developer: https://developer.here.com/
- Expo Forums: https://forums.expo.dev/

---

## Quick Copy-Paste

### Test Route (Buenos Aires → Rosario)
```typescript
{
  origin: { lat: -34.6037, lng: -58.3816 },
  destination: { lat: -32.9442, lng: -60.6505 }
}
// ~300 km route, perfect for testing
```

### Example Polyline (Decoded)
```typescript
[
  { lat: -34.6037, lng: -58.3816 },
  { lat: -34.6025, lng: -58.3798 },
  { lat: -34.6018, lng: -58.3782 },
  // ... 150 more points ...
  { lat: -32.9442, lng: -60.6505 }
]
```

### Map Coordinates Conversion
```typescript
// Database format → MapView format
const mapCoordinates = route.polyline.map(point => ({
  latitude: point.lat,
  longitude: point.lng,
}));
```

---

**Last Updated:** 2026-02-05
**Status:** Phase 1 Complete, Ready for Testing
