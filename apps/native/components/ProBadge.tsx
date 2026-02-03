import { View, Text, StyleSheet } from "react-native";
import { useCustomerInfo } from "@/hooks/useSubscription";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Example component showing how to use subscription status
 * Displays a Pro badge if user has an active subscription
 */
export function ProBadge() {
  const { isPro, isLoading } = useCustomerInfo();

  if (isLoading || !isPro) {
    return null;
  }

  return (
    <LinearGradient
      colors={["#FBBF24", "#F59E0B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.badge}
    >
      <Text style={styles.icon}>👑</Text>
      <Text style={styles.text}>PRO</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  icon: {
    fontSize: 10,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
});
