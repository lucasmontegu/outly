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
        return "#10B981";
      case "medium":
        return "#F59E0B";
      case "high":
        return "#EF4444";
      default:
        return "#6B7280";
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
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Smart Departure</Text>
          <Text style={styles.headerSubtitle}>TO DOWNTOWN OFFICE</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <HugeiconsIcon icon={MoreHorizontalIcon} size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Best Window Card */}
        <View style={styles.bestWindowCard}>
          <View style={styles.bestWindowHeader}>
            <View style={styles.bestWindowBadge}>
              <HugeiconsIcon icon={SparklesIcon} size={14} color="#059669" />
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
                        color={item.riskLevel === "high" ? "#9CA3AF" : "#6B7280"}
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
                            ? "#10B981"
                            : item.riskLevel === "high"
                            ? "#9CA3AF"
                            : "#F59E0B"
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  bestWindowCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bestWindowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  bestWindowBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  bestWindowBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.5,
  },
  durationContainer: {
    alignItems: "flex-end",
  },
  durationLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  durationValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  recommendedTime: {
    fontSize: 72,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 80,
  },
  recommendedPeriod: {
    fontSize: 24,
    fontWeight: "500",
    color: "#9CA3AF",
    marginTop: -8,
    marginLeft: 4,
  },
  savingsText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    marginTop: 16,
  },
  savingsHighlight: {
    fontWeight: "700",
    color: "#111827",
  },
  forecastSection: {
    marginTop: 32,
  },
  forecastTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 16,
  },
  timelineDotContainer: {
    width: 24,
    alignItems: "center",
  },
  timelineDot: {
    borderRadius: 8,
    marginTop: 20,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginTop: 8,
    marginBottom: -16,
  },
  forecastCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  forecastCardRecommended: {
    backgroundColor: "#F0FDF4",
    borderWidth: 2,
    borderColor: "#10B981",
  },
  forecastHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  forecastTime: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  forecastTimeGray: {
    color: "#9CA3AF",
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  forecastDetails: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
  },
  detailTextGray: {
    color: "#9CA3AF",
  },
  insightBox: {
    flexDirection: "row",
    backgroundColor: "#FEF9C3",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  insightIcon: {
    fontSize: 14,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    lineHeight: 18,
  },
  bottomCta: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaIcon: {
    fontSize: 18,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
