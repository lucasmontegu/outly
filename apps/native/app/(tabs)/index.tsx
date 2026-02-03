import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
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
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "heroui-native";
import { useState, useCallback } from "react";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
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
import { RiskCircle } from "@/components/risk-circle";
import {
  colors,
  getRiskClassification,
  getRiskLabel,
  shadows,
  spacing,
  borderRadius,
  typography,
} from "@/lib/design-tokens";

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
  const riskClassification = getRiskClassification(riskScore);
  const riskLevelLabel = getRiskLabel(riskClassification);
  const riskDescription = riskData?.description ?? "Loading risk data…";

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
              <HugeiconsIcon icon={Location01Icon} size={14} color={colors.text.secondary} />
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
            accessibilityLabel="Open settings"
            accessibilityRole="button"
          >
            <HugeiconsIcon icon={UserIcon} size={24} color={colors.text.secondary} />
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
              <RiskCircle
                score={riskScore}
                classification={riskClassification}
                size={220}
                animateScore={true}
                enableHaptic={true}
              />
              <Animated.View
                entering={FadeInUp.duration(300).delay(400)}
                style={[
                  styles.riskBadge,
                  { backgroundColor: `${colors.risk[riskClassification].primary}15` },
                ]}
              >
                <View
                  style={[
                    styles.riskDot,
                    { backgroundColor: colors.risk[riskClassification].primary },
                  ]}
                />
                <Text
                  style={[
                    styles.riskBadgeText,
                    { color: colors.risk[riskClassification].primary },
                  ]}
                >
                  {riskLevelLabel.toUpperCase()}
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
                      <HugeiconsIcon icon={CloudIcon} size={24} color={colors.brand.secondary} />
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
                      <HugeiconsIcon icon={Car01Icon} size={24} color={colors.risk.low.primary} />
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
              accessibilityLabel="View map"
              accessibilityRole="link"
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
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    lightHaptic();
                    router.push({
                      pathname: "/(tabs)/map",
                      params: { eventId: event._id },
                    });
                  }}
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
                </TouchableOpacity>
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

// Helper functions

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
  if (severity >= 4) return colors.risk.high.primary;
  if (severity >= 3) return colors.risk.medium.primary;
  return colors.brand.secondary;
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
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[6],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  locationLabelText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    letterSpacing: typography.tracking.wide,
  },
  locationName: {
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginTop: spacing[1],
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
  },
  riskCircleContainer: {
    alignItems: "center",
    marginTop: spacing[6],
    minHeight: 280,
    justifyContent: "center",
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    marginTop: spacing[4],
    gap: spacing[2],
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  riskBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.wider,
  },
  riskDescription: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing[10],
    marginTop: spacing[4],
  },
  dataCards: {
    flexDirection: "row",
    paddingHorizontal: spacing[6],
    marginTop: spacing[6],
    gap: spacing[3],
  },
  dataCard: {
    flex: 1,
  },
  dataCardInner: {
    backgroundColor: colors.slate[50],
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.sm,
  },
  dataCardBody: {
    padding: spacing[4],
  },
  dataCardIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.brand.secondary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  trafficIcon: {
    backgroundColor: `${colors.risk.low.primary}15`,
  },
  dataCardLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    letterSpacing: typography.tracking.wide,
  },
  dataCardValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginTop: spacing[1],
  },
  dataCardSubtext: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  signalsSection: {
    paddingHorizontal: spacing[6],
    marginTop: spacing[8],
  },
  signalsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  signalsTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  viewMapButton: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  viewMapLink: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.brand.secondary,
  },
  signalCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: "hidden",
    marginBottom: spacing[2],
    ...shadows.sm,
  },
  signalCardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    gap: spacing[3],
  },
  emptySignalBody: {
    padding: spacing[6],
    alignItems: "center",
  },
  emptySignalText: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
  },
  signalIndicator: {
    width: 4,
    height: 40,
    borderRadius: borderRadius.sm,
    position: "absolute",
    left: 0,
  },
  signalIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing[2],
  },
  signalContent: {
    flex: 1,
  },
  signalTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  signalTime: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
});
