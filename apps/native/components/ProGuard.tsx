import { ReactNode } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useCustomerInfo } from "@/hooks/useSubscription";
import { Button } from "heroui-native";

interface ProGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

/**
 * Component that protects Pro features
 * Only renders children if user has active Pro subscription
 *
 * @example
 * ```tsx
 * <ProGuard>
 *   <SmartDepartureFeature />
 * </ProGuard>
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * <ProGuard fallback={<CustomUpgradeMessage />}>
 *   <ProOnlyContent />
 * </ProGuard>
 * ```
 */
export function ProGuard({
  children,
  fallback,
  showUpgradePrompt = true
}: ProGuardProps) {
  const { isPro, isLoading } = useCustomerInfo();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!isPro) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      return (
        <View style={styles.upgradeContainer}>
          <Text style={styles.upgradeIcon}>👑</Text>
          <Text style={styles.upgradeTitle}>Pro Feature</Text>
          <Text style={styles.upgradeDescription}>
            Upgrade to Outia Pro to unlock this feature and get access to:
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>Smart Departure Advisor</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>7-Day Risk Forecast</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>CarPlay Integration</Text>
            </View>
          </View>

          <Button
            size="lg"
            className="w-full mt-6"
            onPress={() => router.push("/paywall")}
          >
            Upgrade to Pro
          </Button>
        </View>
      );
    }

    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  upgradeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#fff",
  },
  upgradeIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  upgradeDescription: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  featureList: {
    width: "100%",
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureBullet: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "700",
  },
  featureText: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
  },
});
