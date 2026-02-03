import { useUser } from "@clerk/clerk-expo";
import { env } from "@outia/env/native";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  LOG_LEVEL,
  type PurchasesOfferings,
  type LogInResult,
} from "react-native-purchases";

interface RevenueCatContextValue {
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  isLoading: boolean;
  error: Error | null;
}

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(
  undefined
);

interface RevenueCatProviderProps {
  children: React.ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize RevenueCat SDK
  useEffect(() => {
    const initializePurchases = async () => {
      try {
        // Configure SDK with platform-specific API key
        const apiKey =
          Platform.OS === "ios"
            ? env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY
            : env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;

        if (!apiKey) {
          console.warn("RevenueCat API key not configured for", Platform.OS);
          setIsLoading(false);
          return;
        }

        Purchases.setLogLevel(
          __DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO
        );

        Purchases.configure({
          apiKey,
        });

        // Get initial customer info
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);

        // Get available offerings
        const fetchedOfferings = await Purchases.getOfferings();
        setOfferings(fetchedOfferings);

        setIsLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsLoading(false);
        console.error("Failed to initialize RevenueCat:", error);
      }
    };

    initializePurchases();
  }, []);

  // Identify user with Clerk user ID when authenticated
  useEffect(() => {
    if (!isUserLoaded) {
      return;
    }

    const identifyUser = async () => {
      try {
        if (user?.id) {
          // Log in user with Clerk ID
          const loginResult: LogInResult = await Purchases.logIn(user.id);
          setCustomerInfo(loginResult.customerInfo);
          console.log("RevenueCat user identified:", user.id);
        } else {
          // Log out if user is not authenticated
          const info: CustomerInfo = await Purchases.logOut();
          setCustomerInfo(info);
          console.log("RevenueCat user logged out");
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Failed to identify user with RevenueCat:", error);
        // Don't set error state here to avoid blocking the app
      }
    };

    identifyUser();
  }, [user?.id, isUserLoaded]);

  // Listen to customer info updates
  useEffect(() => {
    Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
      console.log("Customer info updated:", info);
    });

    // Note: In SDK v9, the listener is automatically cleaned up
    // No need to manually remove it
  }, []);

  const value: RevenueCatContextValue = {
    customerInfo,
    offerings,
    isLoading,
    error,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error("useRevenueCat must be used within a RevenueCatProvider");
  }
  return context;
}
