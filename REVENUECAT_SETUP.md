# RevenueCat Integration - Setup Complete

Complete RevenueCat SDK v9 integration for Expo 54 with TypeScript, optimized for the Outia mobile app.

## Files Created/Modified

### Core Integration Files

1. **`packages/env/src/native.ts`** - Environment configuration
   - Added `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY`
   - Added `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY`

2. **`apps/native/providers/RevenueCatProvider.tsx`** - Provider component
   - Initializes RevenueCat SDK with platform-specific API keys
   - Identifies users with Clerk user ID when authenticated
   - Provides global customer info and offerings via React Context
   - Listens to real-time subscription updates
   - Handles anonymous users gracefully

3. **`apps/native/hooks/useSubscription.ts`** - Subscription hooks
   - `useCustomerInfo()` - Get subscription status with Pro entitlement check
   - `useOfferings()` - Get monthly/yearly packages
   - `usePurchase()` - Handle purchases with proper error handling
   - `useRestorePurchases()` - Restore previous purchases
   - `useEntitlement(id)` - Check specific entitlement

4. **`apps/native/app/_layout.tsx`** - Root layout (modified)
   - Added `RevenueCatProvider` wrapper around app tree
   - Provider order: Clerk → Convex → RevenueCat → Theme → UI

5. **`apps/native/app/paywall.tsx`** - Paywall screen (updated)
   - Updated to use new hook APIs with proper result handling
   - Added missing styles for all UI components
   - Improved error handling for purchase/restore flows

### Example Components

6. **`apps/native/components/ProBadge.tsx`** - Pro badge component
   - Shows golden "PRO" badge for subscribed users
   - Example of checking subscription status

7. **`apps/native/components/ProGuard.tsx`** - Feature gate component
   - Protects Pro-only features with subscription check
   - Shows upgrade prompt if user is not Pro
   - Customizable fallback UI

### Documentation

8. **`apps/native/REVENUECAT_INTEGRATION.md`** - Complete integration guide
   - Setup instructions
   - Hook usage examples
   - User flow documentation
   - Best practices
   - Troubleshooting guide

9. **`apps/native/.env.example`** - Environment template
   - All required environment variables
   - Example values and descriptions

## Quick Start

### 1. Add Environment Variables

Copy `.env.example` to `.env` and add your RevenueCat API keys:

```bash
cd apps/native
cp .env.example .env
# Edit .env with your RevenueCat keys
```

### 2. Configure RevenueCat Dashboard

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Create a project for Outia
3. Add iOS and Android app configurations
4. Create products:
   - Monthly subscription
   - Annual subscription
5. Create an entitlement called "pro"
6. Attach both products to the "pro" entitlement

### 3. Test the Integration

Run the app and navigate to the paywall:

```bash
npm run dev:native
```

## Usage Examples

### Check if User is Pro

```typescript
import { useCustomerInfo } from '@/hooks/useSubscription';

function MyComponent() {
  const { isPro, isLoading } = useCustomerInfo();

  if (isLoading) return <Spinner />;

  return isPro ? <ProFeature /> : <FreeFeature />;
}
```

### Protect Pro Features

```typescript
import { ProGuard } from '@/components/ProGuard';

function SmartDepartureScreen() {
  return (
    <ProGuard>
      <SmartDepartureContent />
    </ProGuard>
  );
}
```

### Show Subscription Offerings

```typescript
import { useOfferings } from '@/hooks/useSubscription';

function PricingScreen() {
  const { monthlyPackage, yearlyPackage, isLoading } = useOfferings();

  if (isLoading) return <Spinner />;

  return (
    <View>
      <Text>Monthly: {monthlyPackage?.product.priceString}</Text>
      <Text>Yearly: {yearlyPackage?.product.priceString}</Text>
    </View>
  );
}
```

### Handle Purchase

```typescript
import { usePurchase } from '@/hooks/useSubscription';

function SubscribeButton({ package: pkg }) {
  const { purchase, isPurchasing } = usePurchase();

  const handlePurchase = async () => {
    const result = await purchase(pkg);

    if (result.success) {
      Alert.alert('Success', 'Welcome to Pro!');
      router.push('/dashboard');
    } else if (result.error) {
      Alert.alert('Error', result.error.message);
    }
    // User cancelled - result.error is null, just do nothing
  };

  return (
    <Button onPress={handlePurchase} disabled={isPurchasing}>
      {isPurchasing ? 'Processing...' : 'Subscribe Now'}
    </Button>
  );
}
```

## Architecture

### Provider Hierarchy

```
ClerkProvider (Authentication)
└── ConvexProviderWithClerk (Backend)
    └── RevenueCatProvider (Subscriptions) ← NEW
        └── ThemeProvider (UI Theme)
            └── GestureHandlerRootView
                └── HeroUINativeProvider
                    └── App Content
```

### Data Flow

1. **App Start**: RevenueCat SDK initializes with anonymous user
2. **User Sign In**: Provider identifies user with Clerk ID via `Purchases.logIn()`
3. **Purchase**: User purchases through paywall → RevenueCat processes → Provider updates
4. **Check Status**: Components use hooks to check Pro status
5. **Real-time Updates**: Provider listens to subscription changes and updates context

## Integration with Backend

To sync subscription status with your Convex backend, configure RevenueCat webhooks:

1. In RevenueCat Dashboard, go to Integrations → Webhooks
2. Add webhook URL: `https://your-convex-url.convex.site/revenuecatWebhook`
3. Select events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`
4. Implement webhook handler in `packages/backend/convex/webhooks.ts`

Example webhook handler:

```typescript
// packages/backend/convex/webhooks.ts
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

export const revenuecatWebhook = httpAction(async (ctx, request) => {
  const event = await request.json();

  if (event.type === "INITIAL_PURCHASE" || event.type === "RENEWAL") {
    await ctx.runMutation(api.users.updateSubscription, {
      clerkId: event.app_user_id,
      tier: "pro",
      expiresAt: event.expiration_at_ms,
    });
  } else if (event.type === "CANCELLATION" || event.type === "EXPIRATION") {
    await ctx.runMutation(api.users.updateSubscription, {
      clerkId: event.app_user_id,
      tier: "free",
      expiresAt: null,
    });
  }

  return new Response("OK", { status: 200 });
});
```

## Testing

### iOS Sandbox Testing

1. Sign out of App Store in iOS Settings
2. Run app on device/simulator
3. When prompted for Apple ID, use sandbox test account
4. Complete purchase (no real charge)

### Android Testing

1. Add test account in Google Play Console
2. Upload APK to internal testing track
3. Install from Play Store
4. Complete purchase with test account

### Verify Integration

```typescript
// Add to any screen for debugging
import { useCustomerInfo } from '@/hooks/useSubscription';

function DebugScreen() {
  const { customerInfo, isPro } = useCustomerInfo();

  return (
    <ScrollView>
      <Text>Is Pro: {isPro ? 'Yes' : 'No'}</Text>
      <Text>Customer Info:</Text>
      <Text>{JSON.stringify(customerInfo, null, 2)}</Text>
    </ScrollView>
  );
}
```

## Next Steps

1. **Add API Keys**: Configure environment variables with your RevenueCat keys
2. **Configure Products**: Set up monthly/annual subscriptions in RevenueCat Dashboard
3. **Test Purchase Flow**: Run app and test purchasing from paywall
4. **Add Pro Features**: Use `ProGuard` to protect premium features
5. **Configure Webhooks**: Sync subscription status to Convex backend
6. **Test on Devices**: Verify purchases work on real iOS/Android devices

## Resources

- [Complete Integration Guide](/apps/native/REVENUECAT_INTEGRATION.md)
- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [React Native SDK Reference](https://sdk-reference.revenuecat.com/react-native/)
- [Expo Integration Guide](https://docs.revenuecat.com/docs/reactnative#expo)

## Support

For issues or questions:
1. Check the troubleshooting section in `REVENUECAT_INTEGRATION.md`
2. Review RevenueCat SDK logs (set to DEBUG in development)
3. Verify products are properly configured in RevenueCat Dashboard
4. Ensure Clerk user ID is being used for `Purchases.logIn()`
