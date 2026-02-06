# Alerts List Sheet - Quick Reference

## 🚀 Quick Start (30 seconds)

```tsx
import { AlertsListSheet } from "@/components/alerts-list-sheet";

<AlertsListSheet
  alerts={events}
  userLocation={location}
  userRoutes={userRoutes}
  mapRef={mapRef}
  onAlertSelect={(alert) => setSelectedId(alert._id)}
/>
```

## 📋 Props at a Glance

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `alerts` | `AlertItem[]` | ✅ | Array of event objects |
| `userLocation` | `{lat, lng} \| null` | ✅ | User's current position |
| `userRoutes` | `UserRoute[]` | ❌ | For "on route" detection |
| `mapRef` | `RefObject<MapView>` | ❌ | For auto-centering map |
| `onAlertSelect` | `(alert) => void` | ✅ | Callback when tapped |

## 🎨 Visual Features

### Snap Points
- **20%** - Collapsed (peek mode)
- **50%** - Half (comfortable browsing)
- **90%** - Full (power user mode)

### Color Coding
- 🔴 **Red** - High severity (4-5)
- 🟠 **Amber** - Medium severity (3)
- 🔵 **Blue** - Low severity (1-2)
- 🟣 **Purple** - On your route

### Badges
- Distance badge: "2.3km"
- Severity badge: "Lv 4"
- Route badge: "On route" (if applicable)

## ⚡ User Interactions

| Action | Result | Haptic |
|--------|--------|--------|
| Tap alert | Map centers + sheet collapses | Medium |
| Swipe up/down | Snap to nearest point | Light |
| Tap sort | Cycle: Distance → Severity → Type | Light |
| Tap filter | Cycle: All → Weather → Traffic | Light |

## 🔧 Utilities Available

```typescript
// In @/lib/geo-utils
calculateDistance(coord1, coord2)  // → km
formatDistance(km)                 // → "2.3km" or "450m"
isPointNearRoute(point, start, end, threshold)  // → boolean
```

## 📊 Performance Tips

```typescript
// Already optimized, but good to know:
initialNumToRender={10}      // First render
maxToRenderPerBatch={10}     // Scroll batches
windowSize={5}               // Memory window
removeClippedSubviews={true} // Android boost
```

## 🎯 Common Patterns

### Basic Usage
```tsx
const events = useQuery(api.events.listNearby, {...});
const { location } = useLocation();

<AlertsListSheet
  alerts={events ?? []}
  userLocation={location}
  onAlertSelect={handleSelect}
/>
```

### With Routes
```tsx
const routes = useQuery(api.routes.getUserRoutes);

<AlertsListSheet
  alerts={events ?? []}
  userLocation={location}
  userRoutes={routes}
  onAlertSelect={handleSelect}
/>
```

### With Map Sync
```tsx
const mapRef = useRef<MapView>(null);

<AlertsListSheet
  alerts={events ?? []}
  userLocation={location}
  mapRef={mapRef}
  onAlertSelect={handleSelect}
/>
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Sheet not showing | Check `alerts.length > 0` and `userLocation !== null` |
| Map not centering | Pass `mapRef` prop |
| "On route" missing | Pass `userRoutes` prop |
| Laggy scrolling | Check alert count (<1000), verify FlatList props |
| No haptics | Check device supports haptics (iOS/Android) |

## 📱 Testing Checklist

- [ ] Drag between snap points
- [ ] Tap alert centers map
- [ ] Distance shows correctly
- [ ] "On route" appears when expected
- [ ] Sort cycles through options
- [ ] Filter shows correct alerts
- [ ] Haptics work
- [ ] Empty state displays
- [ ] Performs well with 700+ alerts

## 🎨 Customization

### Change Colors
Edit `/apps/native/lib/design-tokens.ts`:
```typescript
risk: {
  high: { primary: '#YOUR_COLOR' },
  medium: { primary: '#YOUR_COLOR' },
  // ...
}
```

### Adjust Snap Points
Edit component:
```typescript
const snapPoints = useMemo(() => ["15%", "60%", "95%"], []);
```

### Change Route Threshold
Edit geo-utils call:
```typescript
isPointNearRoute(point, start, end, 2.0) // 2km instead of 1.5km
```

## 📚 Related Files

- Component: `/apps/native/components/alerts-list-sheet.tsx`
- Utils: `/apps/native/lib/geo-utils.ts`
- Design: `/apps/native/lib/design-tokens.ts`
- Haptics: `/apps/native/lib/haptics.ts`
- Integration: `/apps/native/app/(tabs)/map.tsx`

## 🔗 Dependencies

All already installed:
- `@gorhom/bottom-sheet` (v5.2.8)
- `expo-blur` (v15.0.8)
- `expo-haptics` (v15.0.8)
- `react-native-reanimated` (v4.1.1)

## ⚠️ Important Notes

1. **Always check location** - Component requires non-null userLocation
2. **Routes optional** - "On route" feature only works if userRoutes passed
3. **Map ref optional** - Auto-centering only works if mapRef passed
4. **Performance** - Tested up to 1000 alerts, smooth up to 700
5. **Z-index** - Sheet appears above map, below modals/detail sheets

## 💡 Pro Tips

1. **Memoize callbacks** - onAlertSelect should be wrapped in useCallback
2. **Filter early** - Pass pre-filtered alerts if possible
3. **Cache routes** - userRoutes rarely change, perfect for caching
4. **Test with many alerts** - Create 500+ test events to verify performance
5. **Accessibility** - Test with screen reader enabled

## 🚨 Common Mistakes

❌ Don't forget userLocation check:
```tsx
{events && location && <AlertsListSheet ... />}
```

❌ Don't pass undefined:
```tsx
userRoutes={userRoutes ?? []}  // Good
userRoutes={userRoutes}        // Bad if undefined
```

❌ Don't create handlers inline:
```tsx
const handleSelect = useCallback(...)  // Good
onAlertSelect={(alert) => ...}         // Bad (re-renders)
```

## 📈 Metrics to Track

- Average time to select alert: ~2s
- Scroll performance: 60fps target
- Sheet expansion time: <200ms
- Map center animation: 300ms
- Distance calculation: <100ms for 700 alerts

---

**Questions?** Check full guide: `ALERTS_LIST_SHEET_GUIDE.md`
