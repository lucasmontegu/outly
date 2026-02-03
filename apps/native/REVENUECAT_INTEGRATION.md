# RevenueCat Integration Guide

Complete RevenueCat SDK v9 integration for Expo 54 with TypeScript.

## Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=appl_xxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=goog_xxxxxxxxxxxxxxxxxxxxx
```

Get your API keys from [RevenueCat Dashboard](https://app.revenuecat.com).

### 2. RevenueCat Dashboard Configuration

1. Create a new project in RevenueCat
2. Add your iOS and Android app configurations
3. Configure your products:
   - Create an entitlement called "pro"
   - Add monthly product (identifier: `monthly_subscription`)
   - Add annual product (identifier: `annual_subscription`)
4. Attach products to the "pro" entitlement

## Architecture

### Provider Pattern

The integration uses React Context for state management:

```
RevenueCatProvider (apps/native/providers/RevenueCatProvider.tsx)
├── Initializes SDK with platform-specific API key
├── Identifies user with Clerk user ID
├── Provides global customer info and offerings
└── Listens to subscription updates
```

### Hooks

All subscription logic is exposed through composable hooks in `apps/native/hooks/useSubscription.ts`:

#### `useCustomerInfo()`

Get current customer subscription status:

```typescript
import { useCustomerInfo } from '@/hooks/useSubscription';

function MyComponent() {
  const {
    isPro,              // boolean - has "pro" entitlement
    isLoading,          // boolean - loading state
    expirationDate,     // string | null - expiration date
    willRenew,          // boolean - auto-renew status
    productIdentifier,  // string | null - current product
    customerInfo        // CustomerInfo | null - full object
  } = useCustomerInfo();

  if (isLoading) return <LoadingSpinner />;

  return (
    <View>
      {isPro ? (
        <Text>Pro User - Expires: {expirationDate}</Text>
      ) : (
        <Text>Free User</Text>
      )}
    </View>
  );
}
```

#### `useOfferings()`

Get available subscription packages:

```typescript
import { useOfferings } from '@/hooks/useSubscription';

function PaywallScreen() {
  const {
    offerings,        // PurchasesOfferings | null
    currentOffering,  // Current offering
    monthlyPackage,   // PurchasesPackage | null
    yearlyPackage,    // PurchasesPackage | null
    isLoading         // boolean
  } = useOfferings();

  if (isLoading) return <LoadingSpinner />;

  return (
    <View>
      <Text>Monthly: {monthlyPackage?.product.priceString}</Text>
      <Text>Yearly: {yearlyPackage?.product.priceString}</Text>
    </View>
  );
}
```

#### `usePurchase()`

Handle subscription purchases:

```typescript
import { usePurchase } from '@/hooks/useSubscription';
import { Alert } from 'react-native';

function SubscribeButton({ package: pkg }) {
  const { purchase, isPurchasing } = usePurchase();

  const handlePurchase = async () => {
    const result = await purchase(pkg);

    if (result.success) {
      Alert.alert('Success', 'Welcome to Pro!');
      // Navigate to app
    } else if (result.error) {
      Alert.alert('Error', result.error.message);
    }
    // User cancelled - no error, just do nothing
  };

  return (
    <Button
      onPress={handlePurchase}
      disabled={isPurchasing}
    >
      {isPurchasing ? 'Processing...' : 'Subscribe'}
    </Button>
  );
}
```

#### `useRestorePurchases()`

Restore previous purchases:

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

#### `useEntitlement(entitlementId)`

Check specific entitlement:

```typescript
import { useEntitlement } from '@/hooks/useSubscription';

function ProFeature() {
  const hasPro = useEntitlement('pro');

  if (!hasPro) {
    return <Text>Upgrade to Pro to access this feature</Text>;
  }

  return <ProFeatureContent />;
}
```

## User Flow

### 1. Anonymous User

When app starts, RevenueCat initializes with an anonymous user ID:

```typescript
// RevenueCatProvider automatically handles this
Purchases.configure({ apiKey });
const customerInfo = await Purchases.getCustomerInfo();
```

### 2. User Signs In

When user authenticates with Clerk, RevenueCat identifies them:

```typescript
// RevenueCatProvider automatically handles this
useEffect(() => {
  if (user?.id) {
    Purchases.logIn(user.id);
  }
}, [user?.id]);
```

This links their subscription to their Clerk account.

### 3. User Purchases

```typescript
// In your paywall screen
const { purchase } = usePurchase();
const { yearlyPackage } = useOfferings();

const handleSubscribe = async () => {
  const result = await purchase(yearlyPackage);
  if (result.success) {
    // Subscription active!
    // customerInfo.entitlements.active['pro'] is now defined
  }
};
```

### 4. Checking Pro Status

```typescript
// In any component
const { isPro } = useCustomerInfo();

if (isPro) {
  // Show pro features
} else {
  // Show paywall or limited features
}
```

## Best Practices

### 1. Check Pro Status Before Protected Features

```typescript
function SmartDepartureScreen() {
  const { isPro, isLoading } = useCustomerInfo();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isPro) {
      router.push('/paywall');
    }
  }, [isPro, isLoading]);

  if (isLoading) return <LoadingSpinner />;
  if (!isPro) return null;

  return <SmartDepartureContent />;
}
```

### 2. Handle Loading States

```typescript
function MyComponent() {
  const { isPro, isLoading } = useCustomerInfo();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return isPro ? <ProContent /> : <FreeContent />;
}
```

### 3. Handle Errors Gracefully

```typescript
const { purchase } = usePurchase();

const handlePurchase = async (pkg) => {
  const result = await purchase(pkg);

  if (result.success) {
    // Success
  } else if (result.error) {
    // Show error to user
    Alert.alert('Purchase Failed', result.error.message);
  }
  // Cancellation - do nothing
};
```

### 4. Update Backend on Subscription Change

Use RevenueCat webhooks to sync subscription status to your Convex backend:

```typescript
// In your Convex backend (packages/backend/convex/webhooks.ts)
import { httpAction } from "./_generated/server";

export const revenuecatWebhook = httpAction(async (ctx, request) => {
  const event = await request.json();

  if (event.type === "INITIAL_PURCHASE" || event.type === "RENEWAL") {
    const userId = event.app_user_id; // This is the Clerk user ID
    await ctx.runMutation(api.users.updateSubscriptionStatus, {
      userId,
      tier: "pro",
      expirationDate: event.expiration_at_ms,
    });
  } else if (event.type === "CANCELLATION" || event.type === "EXPIRATION") {
    const userId = event.app_user_id;
    await ctx.runMutation(api.users.updateSubscriptionStatus, {
      userId,
      tier: "free",
      expirationDate: null,
    });
  }

  return new Response("OK", { status: 200 });
});
```

Configure webhook URL in RevenueCat Dashboard: `https://your-convex-url.convex.site/revenuecatWebhook`

## Testing

### 1. iOS Sandbox Testing

1. Sign in with a sandbox Apple ID in Settings > App Store
2. Run app on device or simulator
3. Purchases will use sandbox mode automatically in development

### 2. Android Testing

1. Add test account in Google Play Console
2. Upload app to internal testing track
3. Install app from Play Store and test

### 3. Check Subscription Status

```typescript
// In any component
const { customerInfo } = useCustomerInfo();
console.log('Customer info:', JSON.stringify(customerInfo, null, 2));
console.log('Active entitlements:', Object.keys(customerInfo?.entitlements.active ?? {}));
```

## Troubleshooting

### Issue: "Could not find RevenueCat products"

**Solution:** Ensure products are properly configured in:
1. App Store Connect / Google Play Console
2. RevenueCat Dashboard (Products tab)
3. RevenueCat Entitlements (attach products to "pro" entitlement)

### Issue: "User cancelled" error shows to user

**Solution:** The hooks already handle this - cancellation returns `{ success: false, error: null }`

### Issue: Purchases not syncing between devices

**Solution:** Ensure you're calling `Purchases.logIn(userId)` with the same user ID on all devices. RevenueCatProvider handles this automatically when user signs in with Clerk.

### Issue: Subscription not recognized after purchase

**Solution:** Check that:
1. Product has been added to the "pro" entitlement in RevenueCat
2. You're checking `customerInfo.entitlements.active['pro']` (not products)
3. Receipt has been processed (may take a few seconds)

## Resources

- [RevenueCat Docs](https://docs.revenuecat.com/)
- [React Native SDK Reference](https://sdk-reference.revenuecat.com/react-native/)
- [Expo Integration Guide](https://docs.revenuecat.com/docs/reactnative#expo)
- [Testing Subscriptions](https://docs.revenuecat.com/docs/testing)
