import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { Location01Icon, UserIcon } from "@hugeicons/core-free-icons";
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
import { useState, useCallback, useMemo } from "react";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { useLocation } from "@/hooks/use-location";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { AnimatedIconButton } from "@/components/ui/animated-pressable";
import { DepartureHero } from "@/components/departure-hero";
import { RiskTimeline } from "@/components/risk-timeline";
import { ConditionCards } from "@/components/condition-cards";
import { AlertsSection } from "@/components/alerts-section";
import { RoutesPreview } from "@/components/routes-preview";
import {
  Skeleton,
  RiskCircleSkeleton,
  DataCardSkeleton,
} from "@/components/ui/skeleton";
import { lightHaptic } from "@/lib/haptics";
import {
  colors,
  getRiskClassification,
  spacing,
  borderRadius,
  typography,
} from "@/lib/design-tokens";

type Classification = "low" | "medium" | "high";

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

  // Query forecast data for timeline
  const forecastData = useQuery(
    api.riskScore.getForecast,
    location ? { lat: location.lat, lng: location.lng } : "skip"
  );

  // Query saved routes with forecasts
  const routesWithForecast = useQuery(api.routes.getRoutesWithForecast);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lightHaptic();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const isLoading = locationLoading || riskData === undefined || forecastData === undefined;

  // Calculate derived data
  const derivedData = useMemo(() => {
    if (!riskData || !forecastData) {
      return {
        currentScore: 0,
        classification: "low" as Classification,
        weatherScore: 0,
        trafficScore: 0,
        optimalDepartureMinutes: 0,
        optimalTime: "",
        isOptimalNow: true,
        reason: "Loading…",
        timelineSlots: [],
        alerts: [],
        weatherStatus: { status: "Clear", detail: "Loading…" },
        trafficStatus: { status: "Flowing", detail: "Loading…" },
      };
    }

    const currentScore = riskData.score;
    const classification = getRiskClassification(currentScore);
    const weatherScore = riskData.breakdown.weatherScore;
    const trafficScore = riskData.breakdown.trafficScore;

    // Use real forecast data from backend
    const timelineSlots = forecastData.slots;
    const optimalDepartureMinutes = forecastData.optimalDepartureMinutes;
    const optimalSlot = timelineSlots[forecastData.optimalSlotIndex];
    const isOptimalNow = forecastData.optimalSlotIndex === 0;

    // Generate reason based on conditions
    const reason = generateReason(weatherScore, trafficScore, isOptimalNow, optimalDepartureMinutes);

    // Weather and traffic details
    const weatherStatus = getWeatherDetails(weatherScore);
    const trafficStatus = getTrafficDetails(trafficScore);

    // Format alerts
    const alerts = (riskData.nearbyEvents || []).map((event) => ({
      id: event._id,
      type: event.type,
      subtype: event.subtype,
      severity: event.severity,
      title: formatEventSubtype(event.subtype),
      timeAgo: formatTimeAgo(event._creationTime),
    }));

    return {
      currentScore,
      classification,
      weatherScore,
      trafficScore,
      optimalDepartureMinutes,
      optimalTime: optimalSlot.label,
      isOptimalNow,
      reason,
      timelineSlots,
      alerts,
      weatherStatus,
      trafficStatus,
    };
  }, [riskData, forecastData]);

  const handleAlertPress = (alert: { id: string }) => {
    lightHaptic();
    router.push({
      pathname: "/(tabs)/map",
      params: { eventId: alert.id },
    });
  };

  const handleViewMapPress = () => {
    lightHaptic();
    router.push("/(tabs)/map");
  };

  const handleRoutePress = (route: { _id: string }) => {
    lightHaptic();
    router.push("/(tabs)/saved");
  };

  const handleViewAllRoutes = () => {
    lightHaptic();
    router.push("/(tabs)/saved");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.header}
        >
          <View style={styles.locationInfo}>
            <View style={styles.locationLabel}>
              <HugeiconsIcon
                icon={Location01Icon}
                size={14}
                color={colors.text.secondary}
              />
              <Text style={styles.locationLabelText}>CURRENT LOCATION</Text>
            </View>
            {address ? (
              <Animated.Text
                entering={FadeIn.duration(300)}
                style={styles.locationName}
                numberOfLines={1}
              >
                {address}
              </Animated.Text>
            ) : (
              <Skeleton
                width={180}
                height={24}
                borderRadius={6}
                style={{ marginTop: 4 }}
              />
            )}
          </View>
          <AnimatedIconButton
            style={styles.profileButton}
            onPress={() => router.push("/(tabs)/settings")}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
          >
            <HugeiconsIcon
              icon={UserIcon}
              size={24}
              color={colors.text.secondary}
            />
          </AnimatedIconButton>
        </Animated.View>

        {/* Departure Hero - Main CTA */}
        <Animated.View entering={FadeIn.duration(500).delay(200)}>
          {isLoading ? (
            <View style={styles.heroSkeleton}>
              <RiskCircleSkeleton />
            </View>
          ) : (
            <DepartureHero
              optimalDepartureMinutes={derivedData.optimalDepartureMinutes}
              optimalTime={derivedData.optimalTime}
              classification={derivedData.classification}
              currentScore={derivedData.currentScore}
              reason={derivedData.reason}
              isOptimalNow={derivedData.isOptimalNow}
            />
          )}
        </Animated.View>

        {/* Risk Timeline - Next 2 Hours */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          {isLoading ? (
            <View style={styles.timelineSkeleton}>
              <View style={styles.timelineHeader}>
                <Skeleton width={100} height={20} borderRadius={4} />
              </View>
              <View style={styles.timelineSlotsSkeleton}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton
                    key={i}
                    width={64}
                    height={100}
                    borderRadius={12}
                  />
                ))}
              </View>
            </View>
          ) : (
            <RiskTimeline
              slots={derivedData.timelineSlots}
              onSlotPress={(slot) => {
                lightHaptic();
                // Could show more details about that time slot
              }}
            />
          )}
        </Animated.View>

        {/* Condition Cards - Weather & Traffic Details */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          {isLoading ? (
            <View style={styles.conditionsSkeleton}>
              <DataCardSkeleton />
              <DataCardSkeleton />
            </View>
          ) : (
            <ConditionCards
              weather={{
                status: derivedData.weatherStatus.status,
                detail: derivedData.weatherStatus.detail,
                score: derivedData.weatherScore,
              }}
              traffic={{
                status: derivedData.trafficStatus.status,
                detail: derivedData.trafficStatus.detail,
                score: derivedData.trafficScore,
              }}
            />
          )}
        </Animated.View>

        {/* Saved Routes Preview */}
        <Animated.View entering={FadeInDown.duration(400).delay(450)}>
          {routesWithForecast && routesWithForecast.length > 0 && (
            <RoutesPreview
              routes={routesWithForecast}
              onRoutePress={handleRoutePress}
              onViewAllPress={handleViewAllRoutes}
            />
          )}
        </Animated.View>

        {/* Alerts Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)}>
          {!isLoading && (
            <AlertsSection
              alerts={derivedData.alerts}
              onAlertPress={handleAlertPress}
              onViewAllPress={handleViewMapPress}
            />
          )}
        </Animated.View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Notification permission prompt */}
      <NotificationPrompt />
    </SafeAreaView>
  );
}

// Helper functions

function generateReason(
  weatherScore: number,
  trafficScore: number,
  isOptimalNow: boolean,
  optimalMinutes: number
): string {
  const weatherIssue = weatherScore > 30;
  const trafficIssue = trafficScore > 30;

  if (isOptimalNow) {
    if (!weatherIssue && !trafficIssue) {
      return "Perfect conditions right now. Clear skies and light traffic.";
    }
    return "Current conditions are the best for the next 2 hours.";
  }

  const parts: string[] = [];

  if (weatherIssue && weatherScore > 50) {
    parts.push("Rain expected to clear");
  } else if (weatherIssue) {
    parts.push("Weather improving");
  }

  if (trafficIssue && trafficScore > 50) {
    parts.push("rush hour traffic easing");
  } else if (trafficIssue) {
    parts.push("traffic lightening");
  }

  if (parts.length === 0) {
    return `Conditions improve in ${optimalMinutes} minutes.`;
  }

  return `${parts.join(" and ")} soon.`;
}

function getWeatherDetails(score: number): { status: string; detail: string } {
  if (score <= 15) {
    return { status: "Clear", detail: "Perfect conditions" };
  }
  if (score <= 30) {
    return { status: "Good", detail: "Mostly clear skies" };
  }
  if (score <= 50) {
    return { status: "Cloudy", detail: "Light rain possible" };
  }
  if (score <= 70) {
    return { status: "Rain", detail: "Moderate precipitation" };
  }
  return { status: "Storm", detail: "Severe weather alert" };
}

function getTrafficDetails(score: number): { status: string; detail: string } {
  if (score <= 15) {
    return { status: "Clear", detail: "Roads are empty" };
  }
  if (score <= 30) {
    return { status: "Flowing", detail: "No delays expected" };
  }
  if (score <= 50) {
    return { status: "Moderate", detail: "+5-10 min delays" };
  }
  if (score <= 70) {
    return { status: "Congested", detail: "+15-25 min delays" };
  }
  return { status: "Gridlock", detail: "Major delays expected" };
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
    fontSize: typography.size["2xl"],
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
  heroSkeleton: {
    alignItems: "center",
    paddingVertical: spacing[6],
  },
  timelineSkeleton: {
    marginTop: spacing[6],
  },
  timelineHeader: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[3],
  },
  timelineSlotsSkeleton: {
    flexDirection: "row",
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  conditionsSkeleton: {
    flexDirection: "row",
    paddingHorizontal: spacing[6],
    marginTop: spacing[6],
    gap: spacing[3],
  },
  bottomPadding: {
    height: spacing[8],
  },
});
