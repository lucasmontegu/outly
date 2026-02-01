import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import {
  Location01Icon,
  UserIcon,
  CloudIcon,
  Car01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "heroui-native";
import { useState, useCallback } from "react";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  withSpring,
  useSharedValue,
  useAnimatedStyle,
  Layout,
} from "react-native-reanimated";

import { useLocation } from "@/hooks/use-location";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { AnimatedIconButton } from "@/components/ui/animated-pressable";
import {
  RiskCircleSkeleton,
  DataCardSkeleton,
  EventCardSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";
import { lightHaptic } from "@/lib/haptics";

export default function OverviewScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { location, address, isLoading: locationLoading } = useLocation();
  const [refreshing, setRefreshing] = useState(false);

  // Query current user
  const currentUser = useQuery(api.users.getCurrentUser);

  // Query risk data for current location
  const riskData = useQuery(
    api.riskScore.getCurrentRisk,
    location ? { lat: location.lat, lng: location.lng } : "skip"
  );

  const riskScore = riskData?.score ?? 0;
  const riskLevel = getRiskLevel(riskScore);
  const riskDescription = riskData?.description ?? "Loading risk data...";

  // Calculate weather and traffic status from breakdown
  const weatherScore = riskData?.breakdown.weatherScore ?? 0;
  const trafficScore = riskData?.breakdown.trafficScore ?? 0;

  const weatherStatus = getWeatherStatus(weatherScore);
  const trafficStatus = getTrafficStatus(trafficScore);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lightHaptic();
    // The query will automatically refetch when we reset
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const isLoading = locationLoading || riskData === undefined;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.header}>
          <View style={styles.locationInfo}>
            <View style={styles.locationLabel}>
              <HugeiconsIcon icon={Location01Icon} size={14} color="#6B7280" />
              <Text style={styles.locationLabelText}>CURRENT LOCATION</Text>
            </View>
            {address ? (
              <Animated.Text entering={FadeIn.duration(300)} style={styles.locationName}>
                {address}
              </Animated.Text>
            ) : (
              <Skeleton width={180} height={24} borderRadius={6} style={{ marginTop: 4 }} />
            )}
          </View>
          <AnimatedIconButton
            style={styles.profileButton}
            onPress={() => router.push("/(tabs)/settings")}
          >
            <HugeiconsIcon icon={UserIcon} size={24} color="#6B7280" />
          </AnimatedIconButton>
        </Animated.View>

        {/* Risk Score Circle */}
        <Animated.View
          entering={FadeIn.duration(500).delay(200)}
          style={styles.riskCircleContainer}
        >
          {isLoading ? (
            <RiskCircleSkeleton />
          ) : (
            <>
              <RiskCircle score={riskScore} level={riskLevel} />
              <Animated.View
                entering={FadeInUp.duration(300).delay(400)}
                style={[styles.riskBadge, { backgroundColor: `${riskLevel.color}20` }]}
              >
                <View style={[styles.riskDot, { backgroundColor: riskLevel.color }]} />
                <Text style={[styles.riskBadgeText, { color: riskLevel.color }]}>
                  {riskLevel.label}
                </Text>
              </Animated.View>
            </>
          )}
        </Animated.View>

        {/* Risk Description */}
        <Animated.Text
          entering={FadeIn.duration(400).delay(300)}
          style={styles.riskDescription}
        >
          {riskDescription}
        </Animated.Text>

        {/* Weather & Traffic Cards */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          style={styles.dataCards}
        >
          {isLoading ? (
            <>
              <DataCardSkeleton />
              <View style={{ width: 12 }} />
              <DataCardSkeleton />
            </>
          ) : (
            <>
              <Animated.View
                entering={FadeInDown.duration(300).delay(450)}
                style={styles.dataCard}
              >
                <Card style={styles.dataCardInner}>
                  <Card.Body style={styles.dataCardBody}>
                    <View style={styles.dataCardIcon}>
                      <HugeiconsIcon icon={CloudIcon} size={24} color="#3B82F6" />
                    </View>
                    <Text style={styles.dataCardLabel}>WEATHER</Text>
                    <Text style={styles.dataCardValue}>{weatherStatus.label}</Text>
                    <Text style={styles.dataCardSubtext}>{weatherStatus.subtext}</Text>
                  </Card.Body>
                </Card>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(300).delay(500)}
                style={styles.dataCard}
              >
                <Card style={styles.dataCardInner}>
                  <Card.Body style={styles.dataCardBody}>
                    <View style={[styles.dataCardIcon, styles.trafficIcon]}>
                      <HugeiconsIcon icon={Car01Icon} size={24} color="#10B981" />
                    </View>
                    <Text style={styles.dataCardLabel}>TRAFFIC</Text>
                    <Text style={styles.dataCardValue}>{trafficStatus.label}</Text>
                    <Text style={styles.dataCardSubtext}>{trafficStatus.subtext}</Text>
                  </Card.Body>
                </Card>
              </Animated.View>
            </>
          )}
        </Animated.View>

        {/* Nearby Signals Section */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(500)}
          style={styles.signalsSection}
        >
          <View style={styles.signalsHeader}>
            <Text style={styles.signalsTitle}>Nearby Signals</Text>
            <AnimatedIconButton
              onPress={() => router.push("/(tabs)/map")}
              style={styles.viewMapButton}
            >
              <Text style={styles.viewMapLink}>View Map</Text>
            </AnimatedIconButton>
          </View>

          {isLoading ? (
            <>
              <EventCardSkeleton />
              <EventCardSkeleton />
            </>
          ) : riskData?.nearbyEvents && riskData.nearbyEvents.length > 0 ? (
            riskData.nearbyEvents.slice(0, 3).map((event, index) => (
              <Animated.View
                key={event._id}
                entering={FadeInDown.duration(300).delay(550 + index * 50)}
                layout={Layout.springify().damping(20)}
              >
                <Card style={styles.signalCard}>
                  <Card.Body style={styles.signalCardBody}>
                    <View
                      style={[
                        styles.signalIndicator,
                        { backgroundColor: getEventColor(event.type, event.severity) },
                      ]}
                    />
                    <View
                      style={[
                        styles.signalIcon,
                        { backgroundColor: `${getEventColor(event.type, event.severity)}20` },
                      ]}
                    >
                      <HugeiconsIcon
                        icon={Alert02Icon}
                        size={20}
                        color={getEventColor(event.type, event.severity)}
                      />
                    </View>
                    <View style={styles.signalContent}>
                      <Text style={styles.signalTitle}>{formatEventSubtype(event.subtype)}</Text>
                    </View>
                    <Text style={styles.signalTime}>{formatTimeAgo(event._creationTime)}</Text>
                  </Card.Body>
                </Card>
              </Animated.View>
            ))
          ) : (
            <Animated.View entering={FadeIn.duration(300).delay(550)}>
              <Card style={styles.signalCard}>
                <Card.Body style={styles.emptySignalBody}>
                  <Text style={styles.emptySignalText}>No nearby signals reported</Text>
                </Card.Body>
              </Card>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Notification permission prompt - shown after user sees value */}
      <NotificationPrompt />
    </SafeAreaView>
  );
}

// Risk Circle Component
function RiskCircle({ score, level }: { score: number; level: RiskLevel }) {
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 100) * circumference;

  return (
    <View style={styles.circleWrapper}>
      <Svg width={size} height={size} style={styles.circleSvg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={level.color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.circleContent}>
        <Text style={styles.scoreText}>{score}</Text>
      </View>
    </View>
  );
}

// Helper types and functions
type RiskLevel = {
  label: string;
  color: string;
};

function getRiskLevel(score: number): RiskLevel {
  if (score <= 33) return { label: "LOW RISK", color: "#10B981" };
  if (score <= 66) return { label: "MEDIUM RISK", color: "#F59E0B" };
  return { label: "HIGH RISK", color: "#EF4444" };
}

function getWeatherStatus(score: number): { label: string; subtext: string } {
  if (score <= 20) return { label: "Clear", subtext: "No rain expected" };
  if (score <= 50) return { label: "Cloudy", subtext: "Light precipitation possible" };
  if (score <= 75) return { label: "Rain", subtext: "Moderate precipitation" };
  return { label: "Storm", subtext: "Severe weather alert" };
}

function getTrafficStatus(score: number): { label: string; subtext: string } {
  if (score <= 20) return { label: "Flowing", subtext: "No delays expected" };
  if (score <= 50) return { label: "Moderate", subtext: "+5-10 min delay" };
  if (score <= 75) return { label: "Congested", subtext: "+15-30 min delay" };
  return { label: "Gridlock", subtext: "Major delays expected" };
}

function getEventColor(type: string, severity: number): string {
  if (severity >= 4) return "#EF4444";
  if (severity >= 3) return "#F59E0B";
  return "#3B82F6";
}

function formatEventSubtype(subtype: string): string {
  return subtype
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTimeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  locationName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  riskCircleContainer: {
    alignItems: "center",
    marginTop: 24,
    minHeight: 240,
    justifyContent: "center",
  },
  loadingContainer: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  circleWrapper: {
    position: "relative",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  circleSvg: {
    position: "absolute",
  },
  circleContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 64,
    fontWeight: "700",
    color: "#111827",
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  riskDescription: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 40,
    marginTop: 16,
  },
  dataCards: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 12,
  },
  dataCard: {
    flex: 1,
  },
  dataCardInner: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    overflow: "hidden",
  },
  dataCardBody: {
    padding: 16,
  },
  dataCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  trafficIcon: {
    backgroundColor: "#D1FAE5",
  },
  dataCardLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  dataCardValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  dataCardSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  signalsSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  signalsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  signalsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  viewMapButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewMapLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  signalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 8,
  },
  signalCardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  emptySignalBody: {
    padding: 24,
    alignItems: "center",
  },
  emptySignalText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  signalIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    position: "absolute",
    left: 0,
  },
  signalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  signalContent: {
    flex: 1,
  },
  signalTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  signalTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});
