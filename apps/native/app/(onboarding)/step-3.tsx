import { useRouter } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { TradeUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";

export default function OnboardingStep3() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Smart Departure Card */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.routeName}>Commute to Work</Text>
            <View style={styles.optimalBadge}>
              <Text style={styles.optimalText}>OPTIMAL</Text>
            </View>
          </View>

          <Text style={styles.bestTime}>08:05</Text>
          <Text style={styles.bestTimeLabel}>Best time to leave</Text>

          {/* Timeline */}
          <View style={styles.timeline}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, styles.timelineDotActive]} />
            <View style={styles.timelineLine} />
            <View style={styles.timelineDot} />
          </View>
          <View style={styles.timelineLabels}>
            <Text style={styles.timelineLabel}>7:45</Text>
            <Text style={[styles.timelineLabel, styles.timelineLabelActive]}>8:05</Text>
            <Text style={styles.timelineLabel}>8:30</Text>
          </View>

          {/* Risk Warning */}
          <View style={styles.riskWarning}>
            <HugeiconsIcon icon={TradeUpIcon} size={16} color="#EF4444" />
            <Text style={styles.riskText}>
              Risk increases by <Text style={styles.riskHighlight}>32%</Text> if you wait
              until 8:30.
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Master Your Timing</Text>
        <Text style={styles.description}>
          Don't just check the weather. Outly analyzes predictive patterns to tell
          you exactly when to leave for the safest, smoothest trip.
        </Text>
      </View>

      {/* CTA Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          style={styles.button}
          onPress={() => router.push("/(onboarding)/step-4")}
        >
          Continue
        </Button>
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  cardContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  routeName: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  optimalBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  optimalText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.5,
  },
  bestTime: {
    fontSize: 56,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  bestTimeLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: -4,
  },
  timeline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingHorizontal: 20,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  timelineDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#111827",
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
  },
  timelineLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  timelineLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  timelineLabelActive: {
    color: "#111827",
    fontWeight: "600",
  },
  riskWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 6,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  riskText: {
    fontSize: 13,
    color: "#6B7280",
  },
  riskHighlight: {
    color: "#EF4444",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  description: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 24,
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    backgroundColor: "#111827",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  dotActive: {
    backgroundColor: "#111827",
  },
});
