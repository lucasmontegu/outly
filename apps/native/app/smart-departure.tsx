import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft01Icon,
  MoreHorizontalIcon,
  SparklesIcon,
  CloudIcon,
  CheckmarkCircle02Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

type ForecastItem = {
  time: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  weather: string;
  traffic: string;
  isRecommended?: boolean;
  insight?: string;
};

const mockForecast: ForecastItem[] = [
  {
    time: "Now (7:45 AM)",
    riskScore: 78,
    riskLevel: "high",
    weather: "Storming",
    traffic: "Congested",
  },
  {
    time: "08:15 AM",
    riskScore: 12,
    riskLevel: "low",
    weather: "Clearing Up",
    traffic: "Traffic Flowing",
    isRecommended: true,
    insight: "Traffic clears up after the school run and the storm cell passes East.",
  },
  {
    time: "09:00 AM",
    riskScore: 45,
    riskLevel: "medium",
    weather: "Overcast",
    traffic: "Road Work Starts",
  },
];

export default function SmartDepartureScreen() {
  const router = useRouter();
  const recommendedTime = "08:15";
  const estimatedDuration = "32 min";
  const timeSaved = "14 minutes";

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return colors.state.success;
      case "medium":
        return colors.state.warning;
      case "high":
        return colors.state.error;
      default:
        return colors.text.secondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Smart Departure</Text>
          <Text style={styles.headerSubtitle}>TO DOWNTOWN OFFICE</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <HugeiconsIcon icon={MoreHorizontalIcon} size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Best Window Card */}
        <View style={styles.bestWindowCard}>
          <View style={styles.bestWindowHeader}>
            <View style={styles.bestWindowBadge}>
              <HugeiconsIcon icon={SparklesIcon} size={14} color={colors.risk.low.dark} />
              <Text style={styles.bestWindowBadgeText}>BEST WINDOW</Text>
            </View>
            <View style={styles.durationContainer}>
              <Text style={styles.durationLabel}>Estimated Duration</Text>
              <Text style={styles.durationValue}>{estimatedDuration}</Text>
            </View>
          </View>

          <Text style={styles.recommendedTime}>{recommendedTime}</Text>
          <Text style={styles.recommendedPeriod}>AM</Text>

          <Text style={styles.savingsText}>
            Leaving at {recommendedTime} AM saves you approx.{" "}
            <Text style={styles.savingsHighlight}>{timeSaved}</Text> and avoids
            the approaching storm front.
          </Text>
        </View>

        {/* Forecast Section */}
        <View style={styles.forecastSection}>
          <Text style={styles.forecastTitle}>NEXT 6 HOURS FORECAST</Text>

          <View style={styles.timeline}>
            {mockForecast.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                {/* Timeline dot and line */}
                <View style={styles.timelineDotContainer}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: getRiskColor(item.riskLevel),
                        width: item.isRecommended ? 16 : 12,
                        height: item.isRecommended ? 16 : 12,
                      },
                    ]}
                  />
                  {index < mockForecast.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>

                {/* Content Card */}
                <View
                  style={[
                    styles.forecastCard,
                    item.isRecommended && styles.forecastCardRecommended,
                  ]}
                >
                  <View style={styles.forecastHeader}>
                    <Text
                      style={[
                        styles.forecastTime,
                        item.riskLevel === "high" && styles.forecastTimeGray,
                      ]}
                    >
                      {item.time}
                    </Text>
                    <View
                      style={[
                        styles.riskBadge,
                        { backgroundColor: `${getRiskColor(item.riskLevel)}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.riskLabel,
                          { color: getRiskColor(item.riskLevel) },
                        ]}
                      >
                        {item.riskLevel === "low"
                          ? "Lowest Risk"
                          : item.riskLevel === "medium"
                          ? "Med Risk"
                          : "High Risk"}{" "}
                        ({item.riskScore})
                      </Text>
                    </View>
                  </View>

                  <View style={styles.forecastDetails}>
                    <View style={styles.detailItem}>
                      <HugeiconsIcon
                        icon={CloudIcon}
                        size={14}
                        color={item.riskLevel === "high" ? colors.text.tertiary : colors.text.secondary}
                      />
                      <Text
                        style={[
                          styles.detailText,
                          item.riskLevel === "high" && styles.detailTextGray,
                        ]}
                      >
                        {item.weather}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <HugeiconsIcon
                        icon={
                          item.riskLevel === "low"
                            ? CheckmarkCircle02Icon
                            : Alert02Icon
                        }
                        size={14}
                        color={
                          item.riskLevel === "low"
                            ? colors.state.success
                            : item.riskLevel === "high"
                            ? colors.text.tertiary
                            : colors.state.warning
                        }
                      />
                      <Text
                        style={[
                          styles.detailText,
                          item.riskLevel === "high" && styles.detailTextGray,
                        ]}
                      >
                        {item.traffic}
                      </Text>
                    </View>
                  </View>

                  {item.insight && (
                    <View style={styles.insightBox}>
                      <Text style={styles.insightIcon}>✨</Text>
                      <Text style={styles.insightText}>{item.insight}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <Button
          color="accent"
          size="lg"
          className="w-full h-14 rounded-xl"
          onPress={() => {}}
        >
          <View style={styles.ctaContent}>
            <Text style={styles.ctaIcon}>🔔</Text>
            <Text style={styles.ctaText}>Set Alert for {recommendedTime} AM</Text>
          </View>
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  bestWindowCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["2xl"],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  bestWindowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[4],
  },
  bestWindowBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.risk.low.light,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  bestWindowBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.risk.low.dark,
    letterSpacing: 0.5,
  },
  durationContainer: {
    alignItems: "flex-end",
  },
  durationLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  durationValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  recommendedTime: {
    fontSize: 72,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    lineHeight: 80,
  },
  recommendedPeriod: {
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
    marginTop: -8,
    marginLeft: 4,
  },
  savingsText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: spacing[4],
  },
  savingsHighlight: {
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  forecastSection: {
    marginTop: spacing[8],
  },
  forecastTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    marginBottom: spacing[4],
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
    gap: spacing[4],
  },
  timelineDotContainer: {
    width: 24,
    alignItems: "center",
  },
  timelineDot: {
    borderRadius: borderRadius.md,
    marginTop: spacing[5],
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.light,
    marginTop: spacing[2],
    marginBottom: -16,
  },
  forecastCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  forecastCardRecommended: {
    backgroundColor: colors.risk.low.light,
    borderWidth: 2,
    borderColor: colors.state.success,
  },
  forecastHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  forecastTime: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  forecastTimeGray: {
    color: colors.text.tertiary,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  forecastDetails: {
    flexDirection: "row",
    gap: spacing[4],
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  detailTextGray: {
    color: colors.text.tertiary,
  },
  insightBox: {
    flexDirection: "row",
    backgroundColor: "#FEF9C3",
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginTop: spacing[3],
    gap: spacing[2],
  },
  insightIcon: {
    fontSize: typography.size.base,
  },
  insightText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: "#92400E",
    lineHeight: 18,
  },
  bottomCta: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  ctaIcon: {
    fontSize: typography.size.xl,
  },
  ctaText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
});
