# Quick Start: Risk Semi-Ring Component

Get up and running with the new semi-ring risk indicator in 5 minutes.

## TL;DR

```tsx
import { RiskSemiRing } from "@/components/risk-semi-ring";

<RiskSemiRing score={65} classification="medium" size={240} />
```

## Installation

✅ **No installation needed!** All dependencies are already in the project:
- `react-native-svg` v15.12.1
- `react-native-reanimated` v4.1.1
- `expo-haptics` v15.0.8

## Basic Usage

### 1. Import the Component

```tsx
import { RiskSemiRing } from "@/components/risk-semi-ring";
import { getRiskClassification } from "@/lib/design-tokens";
```

### 2. Use in Your Screen

```tsx
function MyScreen() {
  const score = 72;
  const classification = getRiskClassification(score); // 'low' | 'medium' | 'high'

  return (
    <View style={styles.container}>
      <RiskSemiRing
        score={score}
        classification={classification}
      />
    </View>
  );
}
```

That's it! You now have a working semi-ring indicator.

## Common Patterns

### Dashboard Hero
```tsx
<View style={styles.heroCard}>
  <Text style={styles.title}>Current Risk Level</Text>
  <RiskSemiRing
    score={currentScore}
    classification={getRiskClassification(currentScore)}
    size={240}
    strokeWidth={20}
  />
  <Text style={styles.subtitle}>Safe to depart now</Text>
</View>
```

### Compact Widget
```tsx
<View style={styles.compactWidget}>
  <RiskSemiRing
    score={score}
    classification={classification}
    size={160}
    strokeWidth={12}
    showLabel={false}
  />
</View>
```

### With Live Updates
```tsx
function LiveRiskDisplay() {
  const riskData = useQuery(api.riskScore.getCurrentRisk);

  if (!riskData) return <LoadingSkeleton />;

  return (
    <RiskSemiRing
      score={riskData.score}
      classification={getRiskClassification(riskData.score)}
      size={220}
    />
  );
}
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `score` | `number` | **Required** | Risk score 0-100 |
| `classification` | `'low' \| 'medium' \| 'high'` | **Required** | Risk level |
| `size` | `number` | `200` | Component size in pixels |
| `strokeWidth` | `number` | `16` | Arc thickness (typically size × 0.08) |
| `animateScore` | `boolean` | `true` | Enable score animation |
| `enableHaptic` | `boolean` | `true` | Haptic feedback on change |
| `showLabel` | `boolean` | `true` | Show "Low/Medium/High Risk" label |

## Sizing Guide

| Context | Size | Stroke | Show Label |
|---------|------|--------|------------|
| Dashboard Hero | 240 | 20 | Yes |
| Card/Widget | 200 | 16 | Yes |
| Compact | 160 | 12 | No |
| List Item | 120 | 10 | No |

**Stroke Width Formula:** `strokeWidth = size × 0.08`

## Styling Tips

### Container Height
The semi-ring is shorter than a full circle:

```tsx
// Height is 60% of size
const SEMI_RING_SIZE = 240;
const SEMI_RING_HEIGHT = SEMI_RING_SIZE * 0.6; // 144px

<View style={{ height: SEMI_RING_HEIGHT }}>
  <RiskSemiRing size={SEMI_RING_SIZE} {...props} />
</View>
```

### Centering
```tsx
<View style={{
  alignItems: 'center',
  justifyContent: 'flex-start', // NOT 'center'
  padding: 20,
}}>
  <RiskSemiRing {...props} />
</View>
```

### Card Layout
```tsx
<View style={{
  backgroundColor: colors.background.card,
  borderRadius: 24,
  padding: spacing[6],
  alignItems: 'center',
}}>
  <Text style={styles.cardTitle}>Current Risk</Text>
  <RiskSemiRing score={score} classification={classification} />
  <Text style={styles.cardSubtitle}>Last updated: 2 min ago</Text>
</View>
```

## Real-World Example

Complete implementation with error handling:

```tsx
import { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { RiskSemiRing } from "@/components/risk-semi-ring";
import { getRiskClassification, colors, spacing } from "@/lib/design-tokens";

function RiskDashboard() {
  const riskData = useQuery(api.riskScore.getCurrentRisk);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (riskData) setIsLoading(false);
  }, [riskData]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  // Error state
  if (!riskData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load risk data</Text>
      </View>
    );
  }

  const classification = getRiskClassification(riskData.score);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Risk Assessment</Text>

      <View style={styles.riskCard}>
        <RiskSemiRing
          score={riskData.score}
          classification={classification}
          size={240}
          strokeWidth={20}
        />
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailLabel}>Weather Conditions</Text>
        <Text style={styles.detailValue}>
          {riskData.breakdown.weather}
        </Text>

        <Text style={styles.detailLabel}>Traffic Status</Text>
        <Text style={styles.detailValue}>
          {riskData.breakdown.traffic}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate[50],
    padding: spacing[5],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  riskCard: {
    backgroundColor: colors.background.card,
    borderRadius: 24,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  detailsCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing[5],
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  errorText: {
    fontSize: 16,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default RiskDashboard;
```

## Troubleshooting

### Arc not showing?
```tsx
// Make sure size and strokeWidth are reasonable
<RiskSemiRing
  size={200}
  strokeWidth={16} // Not too thick (max ~size/8)
  {...props}
/>
```

### Animation choppy?
```bash
# Verify Reanimated plugin in babel.config.js
module.exports = {
  plugins: [
    'react-native-reanimated/plugin', // Must be last!
  ],
};
```

### Score not centered?
```tsx
// Use flex-start, not center
<View style={{ justifyContent: 'flex-start' }}>
  <RiskSemiRing {...props} />
</View>
```

## Next Steps

1. ✅ **Try it**: Add component to a test screen
2. 📖 **Learn more**: Read [risk-semi-ring.md](./risk-semi-ring.md)
3. 🔄 **Migrate**: Follow [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)
4. 🎨 **Customize**: Check [risk-semi-ring-example.tsx](./risk-semi-ring-example.tsx)
5. 🧮 **Deep dive**: See [risk-semi-ring-diagram.md](./risk-semi-ring-diagram.md)

## Resources

- **Main Component**: `risk-semi-ring.tsx`
- **Full Documentation**: `risk-semi-ring.md`
- **Usage Examples**: `risk-semi-ring-example.tsx`
- **Migration Guide**: `MIGRATION-GUIDE.md`
- **Visual Diagrams**: `risk-semi-ring-diagram.md`
- **Summary**: `SEMI-RING-SUMMARY.md`

## Need Help?

Common questions answered in documentation:
- How to adjust colors? → See `risk-semi-ring.md`
- How to add custom animations? → See `risk-semi-ring.md` (Advanced Customization)
- How to replace RiskCircle? → See `MIGRATION-GUIDE.md`
- What's the math behind it? → See `risk-semi-ring-diagram.md`

---

**Happy coding!** The semi-ring is ready to use in your Outia app.
