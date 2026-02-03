import React, { useCallback, useMemo } from "react";
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
  type PurchasesOfferings,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";
import { useRevenueCat } from "@/providers/RevenueCatProvider";

// Entitlement identifier configured in RevenueCat dashboard
export const PRO_ENTITLEMENT_ID = "Outia Pro";

// Interface for RevenueCat error structure (PurchasesError from @revenuecat/purchases-typescript-internal)
interface RevenueCatError {
  code: PURCHASES_ERROR_CODE;
  message: string;
  underlyingErrorMessage?: string;
  readableErrorCode?: string;
  userInfo?: {
    readableErrorCode?: string;
  };
}

// Type guard to check if error is a RevenueCat error
function isRevenueCatError(error: unknown): error is RevenueCatError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof (error as RevenueCatError).message === "string"
  );
}

// Get user-friendly error message based on RevenueCat error code
export function getErrorMessage(error: unknown): string {
  if (isRevenueCatError(error)) {
    switch (error.code) {
      case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
        return "Please check your internet connection and try again.";
      case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
      case PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR:
      case PURCHASES_ERROR_CODE.RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR:
        return "You already have an active subscription.";
      case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
        return "Unable to connect to the App Store. Please try again later.";
      case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
        return "Purchases are not allowed on this device. Please check your device settings.";
      case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
        return "Your payment is pending. Please wait for it to complete.";
      case PURCHASES_ERROR_CODE.INELIGIBLE_ERROR:
        return "You are not eligible for this offer.";
      default:
        // Use the RevenueCat message if available, otherwise generic fallback
        return error.message || "Something went wrong. Please try again.";
    }
  }

  if (error instanceof Error) {
    return error.message || "Something went wrong. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

// Check if error is a user cancellation
export function isUserCancellation(error: unknown): boolean {
  if (isRevenueCatError(error)) {
    return error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("cancelled") ||
      message.includes("canceled") ||
      message.includes("user_cancelled")
    );
  }

  return false;
}

interface SubscriptionStatus {
  isPro: boolean;
  isLoading: boolean;
  expirationDate: string | null;
  willRenew: boolean;
  productIdentifier: string | null;
}

interface UseCustomerInfoReturn extends SubscriptionStatus {
  customerInfo: CustomerInfo | null;
}

export function useCustomerInfo(): UseCustomerInfoReturn {
  const { customerInfo, isLoading } = useRevenueCat();

  const subscriptionStatus = useMemo(() => {
    if (!customerInfo) {
      return {
        isPro: false,
        isLoading,
        expirationDate: null,
        willRenew: false,
        productIdentifier: null,
      };
    }

    const proEntitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
    const isPro = proEntitlement !== undefined;

    return {
      isPro,
      isLoading,
      expirationDate: proEntitlement?.expirationDate ?? null,
      willRenew: proEntitlement?.willRenew ?? false,
      productIdentifier: proEntitlement?.productIdentifier ?? null,
    };
  }, [customerInfo, isLoading]);

  return {
    customerInfo,
    ...subscriptionStatus,
  };
}

interface UseOfferingsReturn {
  offerings: PurchasesOfferings | null;
  currentOffering: PurchasesOfferings["current"];
  monthlyPackage: PurchasesPackage | null;
  yearlyPackage: PurchasesPackage | null;
  isLoading: boolean;
}

export function useOfferings(): UseOfferingsReturn {
  const { offerings, isLoading } = useRevenueCat();

  const packages = useMemo(() => {
    const currentOffering = offerings?.current;
    const availablePackages = currentOffering?.availablePackages ?? [];

    const monthlyPackage =
      availablePackages.find(
        (pkg) =>
          pkg.packageType === Purchases.PACKAGE_TYPE.MONTHLY ||
          pkg.identifier === "$rc_monthly"
      ) ?? null;

    const yearlyPackage =
      availablePackages.find(
        (pkg) =>
          pkg.packageType === Purchases.PACKAGE_TYPE.ANNUAL ||
          pkg.identifier === "$rc_annual"
      ) ?? null;

    return {
      monthlyPackage,
      yearlyPackage,
    };
  }, [offerings]);

  return {
    offerings,
    currentOffering: offerings?.current ?? null,
    ...packages,
    isLoading,
  };
}

interface PurchaseResult {
  success: boolean;
  customerInfo: CustomerInfo | null;
  errorMessage: string | null;
  cancelled: boolean;
}

interface UsePurchaseReturn {
  purchase: (pkg: PurchasesPackage) => Promise<PurchaseResult>;
  isPurchasing: boolean;
}

export function usePurchase(): UsePurchaseReturn {
  const [isPurchasing, setIsPurchasing] = React.useState(false);

  const purchase = useCallback(
    async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
      setIsPurchasing(true);
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        setIsPurchasing(false);
        return {
          success: true,
          customerInfo,
          errorMessage: null,
          cancelled: false,
        };
      } catch (err) {
        setIsPurchasing(false);

        // Check if user cancelled - don't treat as an error
        if (isUserCancellation(err)) {
          return {
            success: false,
            customerInfo: null,
            errorMessage: null,
            cancelled: true,
          };
        }

        // Extract user-friendly error message
        const errorMessage = getErrorMessage(err);
        console.error("Purchase failed:", err);

        return {
          success: false,
          customerInfo: null,
          errorMessage,
          cancelled: false,
        };
      }
    },
    []
  );

  return {
    purchase,
    isPurchasing,
  };
}

interface RestoreResult {
  success: boolean;
  customerInfo: CustomerInfo | null;
  errorMessage: string | null;
  hadActivePurchases: boolean;
}

interface UseRestorePurchasesReturn {
  restore: () => Promise<RestoreResult>;
  isRestoring: boolean;
}

export function useRestorePurchases(): UseRestorePurchasesReturn {
  const [isRestoring, setIsRestoring] = React.useState(false);

  const restore = useCallback(async (): Promise<RestoreResult> => {
    setIsRestoring(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      setIsRestoring(false);

      const hadActivePurchases =
        Object.keys(customerInfo.entitlements.active).length > 0;

      return {
        success: true,
        customerInfo,
        errorMessage: null,
        hadActivePurchases,
      };
    } catch (err) {
      setIsRestoring(false);
      const errorMessage = getErrorMessage(err);
      console.error("Restore failed:", err);
      return {
        success: false,
        customerInfo: null,
        errorMessage,
        hadActivePurchases: false,
      };
    }
  }, []);

  return {
    restore,
    isRestoring,
  };
}

// Helper hook to check if a specific entitlement is active
export function useEntitlement(entitlementId: string): boolean {
  const { customerInfo } = useRevenueCat();

  return useMemo(() => {
    if (!customerInfo) {
      return false;
    }
    return customerInfo.entitlements.active[entitlementId] !== undefined;
  }, [customerInfo, entitlementId]);
}

// ============================================================================
// RevenueCat UI - Remote Paywalls & Customer Center
// ============================================================================

import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

export { PAYWALL_RESULT };

// Type for paywall presentation result
export type PaywallResult = typeof PAYWALL_RESULT[keyof typeof PAYWALL_RESULT];

interface PaywallOptions {
  /** Specific offering identifier to display. Uses default if not specified. */
  offeringIdentifier?: string;
}

interface UsePaywallReturn {
  /** Present the remote paywall configured in RevenueCat dashboard */
  presentPaywall: (options?: PaywallOptions) => Promise<PaywallResult>;
  /** Present paywall only if user doesn't have the Pro entitlement */
  presentPaywallIfNeeded: (options?: PaywallOptions) => Promise<PaywallResult>;
  isPresenting: boolean;
}

/**
 * Hook to present RevenueCat remote paywalls
 * Paywalls are configured in the RevenueCat dashboard - no code changes needed
 */
export function usePaywall(): UsePaywallReturn {
  const [isPresenting, setIsPresenting] = React.useState(false);

  const presentPaywall = useCallback(
    async (options?: PaywallOptions): Promise<PaywallResult> => {
      setIsPresenting(true);
      try {
        const result = await RevenueCatUI.presentPaywall({
          offering: options?.offeringIdentifier
            ? await Purchases.getOfferings().then(
                (o) => o.all[options.offeringIdentifier!]
              )
            : undefined,
        });
        return result;
      } finally {
        setIsPresenting(false);
      }
    },
    []
  );

  const presentPaywallIfNeeded = useCallback(
    async (options?: PaywallOptions): Promise<PaywallResult> => {
      setIsPresenting(true);
      try {
        const result = await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
          offering: options?.offeringIdentifier
            ? await Purchases.getOfferings().then(
                (o) => o.all[options.offeringIdentifier!]
              )
            : undefined,
        });
        return result;
      } finally {
        setIsPresenting(false);
      }
    },
    []
  );

  return {
    presentPaywall,
    presentPaywallIfNeeded,
    isPresenting,
  };
}

interface CustomerCenterCallbacks {
  onRestoreCompleted?: (customerInfo: CustomerInfo) => void;
  onRestoreFailed?: (error: unknown) => void;
  onManageSubscriptionsShown?: () => void;
  onFeedbackSurveyCompleted?: (optionId: string) => void;
}

interface UseCustomerCenterReturn {
  /** Present the Customer Center for subscription management */
  presentCustomerCenter: (callbacks?: CustomerCenterCallbacks) => Promise<void>;
  isPresenting: boolean;
}

/**
 * Hook to present RevenueCat Customer Center
 * Provides UI for users to manage subscriptions, request refunds, and get support
 */
export function useCustomerCenter(): UseCustomerCenterReturn {
  const [isPresenting, setIsPresenting] = React.useState(false);

  const presentCustomerCenter = useCallback(
    async (callbacks?: CustomerCenterCallbacks): Promise<void> => {
      setIsPresenting(true);
      try {
        await RevenueCatUI.presentCustomerCenter({
          callbacks: {
            onRestoreCompleted: (param) => {
              callbacks?.onRestoreCompleted?.(param.customerInfo);
            },
            onRestoreFailed: (param) => {
              callbacks?.onRestoreFailed?.(param.error);
            },
            onShowingManageSubscriptions: () => {
              callbacks?.onManageSubscriptionsShown?.();
            },
            onFeedbackSurveyCompleted: (param) => {
              callbacks?.onFeedbackSurveyCompleted?.(param.feedbackSurveyOptionId);
            },
          },
        });
      } finally {
        setIsPresenting(false);
      }
    },
    []
  );

  return {
    presentCustomerCenter,
    isPresenting,
  };
}
