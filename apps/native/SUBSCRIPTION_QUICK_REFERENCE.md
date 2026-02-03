# Subscription Quick Reference

Quick copy-paste examples for common subscription patterns in the Outia app.

## Check if User is Pro

```typescript
import { useCustomerInfo } from '@/hooks/useSubscription';

function MyComponent() {
  const { isPro, isLoading } = useCustomerInfo();

  if (isLoading) return <LoadingSpinner />;

  return isPro ? <ProFeature /> : <FreeFeature />;
}
```

## Protect Pro Features

```typescript
import { ProGuard } from '@/components/ProGuard';

function MyScreen() {
  return (
    <ProGuard>
      <ProOnlyContent />
    </ProGuard>
  );
}
```

## Show Subscription Pricing

```typescript
import { useOfferings } from '@/hooks/useSubscription';

function PricingCard() {
  const { monthlyPackage, yearlyPackage, isLoading } = useOfferings();

  if (isLoading) return <Skeleton />;

  return (
    <View>
      <Text>Monthly: {monthlyPackage?.product.priceString}</Text>
      <Text>Yearly: {yearlyPackage?.product.priceString}</Text>
    </View>
  );
}
```

## Handle Purchase

```typescript
import { usePurchase, useOfferings } from '@/hooks/useSubscription';
import { Alert } from 'react-native';

function SubscribeButton() {
  const { yearlyPackage } = useOfferings();
  const { purchase, isPurchasing } = usePurchase();

  const handleSubscribe = async () => {
    if (!yearlyPackage) return;

    const result = await purchase(yearlyPackage);

    if (result.success) {
      Alert.alert('Welcome to Pro!', 'You now have access to all Pro features.');
      // Navigate to pro features
    } else if (result.error) {
      Alert.alert('Purchase Failed', result.error.message);
    }
    // If cancelled, result.error is null - just do nothing
  };

  return (
    <Button onPress={handleSubscribe} disabled={isPurchasing}>
      {isPurchasing ? 'Processing...' : 'Subscribe Now'}
    </Button>
  );
}
```

## Restore Purchases

```typescript
import { useRestorePurchases } from '@/hooks/useSubscription';
import { Alert } from 'react-native';

function RestoreButton() {
  const { restore, isRestoring } = useRestorePurchases();

  const handleRestore = async () => {
    const result = await restore();

    if (result.success && result.hadActivePurchases) {
      Alert.alert('Success', 'Your subscription has been restored!');
    } else if (result.success && !result.hadActivePurchases) {
      Alert.alert('No Subscriptions', 'No active subscriptions found.');
    } else if (result.error) {
      Alert.alert('Error', result.error.message);
    }
  };

  return (
    <Button onPress={handleRestore} disabled={isRestoring}>
      {isRestoring ? 'Restoring...' : 'Restore Purchases'}
    </Button>
  );
}
```

## Show Pro Badge

```typescript
import { ProBadge } from '@/components/ProBadge';

function UserProfile() {
  return (
    <View>
      <Text>John Doe</Text>
      <ProBadge />  {/* Shows only for Pro users */}
    </View>
  );
}
```

## Get Full Customer Info

```typescript
import { useCustomerInfo } from '@/hooks/useSubscription';

function SubscriptionStatus() {
  const {
    isPro,
    expirationDate,
    willRenew,
    productIdentifier,
    customerInfo
  } = useCustomerInfo();

  if (!isPro) return <Text>Free Plan</Text>;

  return (
    <View>
      <Text>Pro Plan</Text>
      <Text>Expires: {expirationDate}</Text>
      <Text>Auto-renew: {willRenew ? 'Yes' : 'No'}</Text>
      <Text>Product: {productIdentifier}</Text>
    </View>
  );
}
```

## Check Specific Entitlement

```typescript
import { useEntitlement } from '@/hooks/useSubscription';

function AdvancedFeature() {
  const hasAdvancedFeatures = useEntitlement('advanced_features');

  if (!hasAdvancedFeatures) {
    return <UpgradePrompt />;
  }

  return <AdvancedContent />;
}
```

## Conditional Navigation

```typescript
import { useCustomerInfo } from '@/hooks/useSubscription';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

function ProFeatureScreen() {
  const { isPro, isLoading } = useCustomerInfo();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isPro) {
      router.replace('/paywall');
    }
  }, [isPro, isLoading, router]);

  if (isLoading) return <LoadingScreen />;
  if (!isPro) return null;

  return <ProFeatureContent />;
}
```

## Custom Upgrade Prompt

```typescript
import { useCustomerInfo } from '@/hooks/useSubscription';
import { useRouter } from 'expo-router';

function CustomUpgradePrompt() {
  const { isPro } = useCustomerInfo();
  const router = useRouter();

  if (isPro) return null;

  return (
    <View style={styles.banner}>
      <Text>Upgrade to Pro for unlimited access</Text>
      <Button onPress={() => router.push('/paywall')}>
        See Plans
      </Button>
    </View>
  );
}
```

## Feature List with Pro Indicators

```typescript
import { useCustomerInfo } from '@/hooks/useSubscription';

const features = [
  { name: 'Basic Features', isPro: false },
  { name: 'Smart Departure', isPro: true },
  { name: '7-Day Forecast', isPro: true },
  { name: 'CarPlay Integration', isPro: true },
];

function FeatureList() {
  const { isPro } = useCustomerInfo();

  return (
    <View>
      {features.map(feature => (
        <View key={feature.name}>
          <Text>{feature.name}</Text>
          {feature.isPro && !isPro && <Text>🔒 Pro</Text>}
        </View>
      ))}
    </View>
  );
}
```

## Paywall with Analytics

```typescript
import { usePurchase, useOfferings } from '@/hooks/useSubscription';
import { useEffect } from 'react';

function PaywallScreen() {
  const { monthlyPackage, yearlyPackage, isLoading } = useOfferings();
  const { purchase, isPurchasing } = usePurchase();

  // Track paywall view
  useEffect(() => {
    console.log('Paywall viewed');
    // Add your analytics here
  }, []);

  const handlePurchase = async (pkg) => {
    console.log('Purchase initiated:', pkg.identifier);
    const result = await purchase(pkg);

    if (result.success) {
      console.log('Purchase successful');
      // Track conversion
    }
  };

  // ... rest of component
}
```

## Debug Subscription Status

```typescript
import { useCustomerInfo } from '@/hooks/useSubscription';

function DebugScreen() {
  const { customerInfo } = useCustomerInfo();

  return (
    <ScrollView>
      <Text>Debug Info:</Text>
      <Text>{JSON.stringify(customerInfo, null, 2)}</Text>
    </ScrollView>
  );
}
```

## Environment Setup Reminder

```bash
# apps/native/.env
EXPO_PUBLIC_CONVEX_URL=https://your-convex-url.convex.cloud
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=appl_xxxxx
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=goog_xxxxx
```

## Common Patterns

### Loading State
```typescript
const { isPro, isLoading } = useCustomerInfo();
if (isLoading) return <Spinner />;
```

### Error Handling
```typescript
const result = await purchase(package);
if (result.error) {
  Alert.alert('Error', result.error.message);
}
```

### Cancellation
```typescript
const result = await purchase(package);
// If user cancels, result.error is null
// Just do nothing or show a gentle message
```

### Navigation After Purchase
```typescript
if (result.success) {
  router.replace('/(tabs)');
}
```

## Tips

1. Always check `isLoading` before using `isPro`
2. User cancellations are not errors (result.error will be null)
3. Use `ProGuard` for simple feature gates
4. Use `useCustomerInfo` directly for custom UI
5. Test with sandbox accounts (iOS) or test accounts (Android)
6. RevenueCat automatically syncs across devices
7. Clerk user ID is used as RevenueCat app user ID

## Need Help?

See full documentation in:
- `REVENUECAT_INTEGRATION.md` - Complete guide
- `REVENUECAT_SETUP.md` - Setup instructions
- `INTEGRATION_COMPLETE.md` - Implementation details
