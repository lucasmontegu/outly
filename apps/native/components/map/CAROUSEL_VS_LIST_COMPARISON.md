# Alert Carousel vs List Sheet Comparison

## Side-by-Side Feature Comparison

| Feature | AlertCarousel | AlertsListSheet |
|---------|--------------|-----------------|
| **Layout** | Horizontal | Vertical |
| **Visibility** | Always visible | Collapsed by default |
| **Screen Space** | ~150px height | 20%-90% of screen |
| **Browsing** | Swipe left/right | Scroll up/down |
| **Snap Behavior** | Yes (card-by-card) | No (free scroll) |
| **Map Visibility** | High (cards at bottom) | Low (sheet covers map) |
| **Filtering** | No (sorted only) | Yes (weather/traffic) |
| **Sorting** | Automatic (route → distance) | Manual (distance/severity/type) |
| **Card Size** | 280×120px | Full width × 80px |
| **Pagination** | Dots below | None (scroll indicator) |
| **Selection** | Border + scale | Blue highlight |
| **Haptics** | Yes | Yes |

## Visual Layouts

### AlertCarousel
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                   MAP VIEW                      │
│              (Maximum Visibility)               │
│                                                 │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Card 1  │  │  Card 2  │  │  Card 3  │  ← Swipe
└──────────┘  └──────────┘  └──────────┘
       ● ● ○ ○  ← Dots
```

### AlertsListSheet
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                   MAP VIEW                      │
│              (Partial Visibility)               │
├─────────────────────────────────────────────────┤
│  ─                                              │ ← Handle
│  📊 5 Alerts      [Filter] [Sort]              │ ← Header
├─────────────────────────────────────────────────┤
│  ☁️ Heavy Rain                    2.3km  Lv 4  │
│  🚗 Traffic Jam                   On route      │
│  ☁️ Fog                           4.1km  Lv 2  │
└─────────────────────────────────────────────────┘
                                             ↑ Scroll
```

## Use Case Recommendations

### Use AlertCarousel When:
- ✅ Map visibility is priority
- ✅ Quick browsing of 1-10 alerts
- ✅ Users need to see map + alerts simultaneously
- ✅ Modern, app-like feel desired
- ✅ Minimal UI preferred
- ✅ Focus on closest/most relevant alerts

### Use AlertsListSheet When:
- ✅ Many alerts (10+) need to be shown
- ✅ Users need detailed filtering/sorting
- ✅ Full alert context needed upfront
- ✅ Traditional map UX preferred
- ✅ Power users who want control
- ✅ Alert management is primary task

## User Experience Comparison

### Discoverability
- **Carousel**: High - Always visible, cards catch attention
- **List**: Medium - Requires user to expand sheet

### Efficiency
- **Carousel**: Best for 1-5 alerts (quick scan)
- **List**: Best for 5+ alerts (filtering, sorting)

### Map Interaction
- **Carousel**: Easy - Cards don't block map
- **List**: Moderate - Must collapse sheet to see map

### Learning Curve
- **Carousel**: Low - Familiar pattern from many apps
- **List**: Low - Standard bottom sheet behavior

### One-Handed Use
- **Carousel**: Excellent - Thumb swipe natural
- **List**: Good - Thumb scroll works, but sheet harder to expand

## Technical Comparison

### Performance
| Metric | Carousel | List |
|--------|----------|------|
| Initial render | Fast (3 cards) | Fast (10 items) |
| Memory usage | Low (windowed) | Medium (all items) |
| Scroll performance | Excellent (FlatList) | Excellent (BottomSheetFlatList) |
| Animation smoothness | 60fps (Reanimated) | 60fps (BottomSheet) |

### Complexity
- **Carousel**: Simple - Just render + scroll
- **List**: Complex - Sheet states, filtering, sorting

### Maintainability
- **Carousel**: Easy - Self-contained component
- **List**: Moderate - Multiple features to maintain

## Integration Complexity

### AlertCarousel
```typescript
// 3 lines of code
<AlertCarousel
  alerts={events}
  userLocation={location}
  onAlertSelect={handleSelect}
/>
```

### AlertsListSheet
```typescript
// 5 lines + state management
<AlertsListSheet
  alerts={events}
  userLocation={location}
  userRoutes={routes}
  mapRef={mapRef}
  onAlertSelect={handleSelect}
/>
// Plus: Sheet state, filter state, sort state
```

## When to Use Both

Provide toggle between views for best of both worlds:

```typescript
const [viewMode, setViewMode] = useState<"carousel" | "list">("carousel");

// Toggle button
<TouchableOpacity onPress={toggleView}>
  <HugeiconsIcon icon={viewMode === "carousel" ? ListIcon : CardsIcon} />
</TouchableOpacity>

// Conditional rendering
{viewMode === "carousel" ? (
  <AlertCarousel alerts={events} ... />
) : (
  <AlertsListSheet alerts={events} ... />
)}
```

**Benefits:**
- Users choose their preferred view
- Power users get filtering/sorting
- Casual users get quick carousel view
- Best of both patterns

## Design Philosophy

### AlertCarousel
**"Show me what matters, now"**
- Minimalist approach
- Focus on essential info
- Quick decisions
- Map-first experience

### AlertsListSheet
**"Give me all the details"**
- Comprehensive approach
- Full information display
- Thoughtful decisions
- List-first experience

## Mobile vs Tablet

### Mobile (< 600px)
**Recommend:** AlertCarousel
- Screen space is limited
- One-handed use important
- Quick glances common
- Map visibility crucial

### Tablet (≥ 600px)
**Recommend:** AlertsListSheet or Both
- More screen space available
- Two-handed use expected
- Longer engagement sessions
- Can show map + list comfortably

## Analytics Tracking

### Key Metrics for Carousel
- Swipe frequency
- Time to selection
- Cards viewed per session
- Selection rate

### Key Metrics for List
- Sheet expansion rate
- Filter usage
- Sort changes
- Items scrolled

## A/B Testing Suggestions

Test carousel vs list to determine user preference:

1. **Metric:** Time to first alert selection
   - Hypothesis: Carousel faster for 1-5 alerts
   - Hypothesis: List faster for 6+ alerts

2. **Metric:** Map engagement
   - Hypothesis: Carousel increases map panning/zooming
   - Hypothesis: List reduces map interaction

3. **Metric:** Alert voting rate
   - Hypothesis: Carousel's "Tap to vote" increases participation
   - Hypothesis: List's detail view increases accuracy

4. **Metric:** User satisfaction
   - Survey: Which view do you prefer?
   - Measure: Session duration, return rate

## Migration Strategy

### Phase 1: Soft Launch (Week 1)
- Deploy carousel as default
- Keep list as fallback
- Monitor error rates
- Gather initial feedback

### Phase 2: A/B Test (Week 2-4)
- 50% users get carousel
- 50% users get list
- Measure engagement metrics
- Survey both groups

### Phase 3: Decision (Week 5)
- Analyze results
- Choose default view
- Implement toggle if both popular
- Communicate changes to users

### Phase 4: Optimize (Week 6+)
- Refine winning pattern
- Add requested features
- Improve performance
- Iterate based on usage

## Recommendation

**For Outia's MVP:**

Use **AlertCarousel** as default because:
1. ✅ Matches modern map app patterns (Google Maps, Apple Maps)
2. ✅ Maximizes map visibility (core feature)
3. ✅ Simpler codebase (easier to maintain)
4. ✅ Better one-handed mobile UX
5. ✅ Faster for typical 1-5 alerts scenario
6. ✅ More engaging visual design

Keep **AlertsListSheet** as optional toggle for:
- Power users who want filtering
- High alert count scenarios (10+)
- Users who prefer traditional patterns

This provides best of both worlds with minimal complexity.
