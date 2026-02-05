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
  TouchableOpacity,
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
import { DepartureAlertCta } from "@/components/departure-alert-cta";
import { TimeSavedBanner } from "@/components/time-saved-banner";
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

// Round timestamp to nearest minute for better Convex cache hits
// This prevents cache invalidation from millisecond differences
function getRoundedTimestamp(): number {
  return Math.floor(Date.now() / 60000) * 60000;
}

// Header component with contextual insight based on risk score
function HomeHeader({
  userName,
  location,
  score,
  classification,
  isImproving,
  optimalTime
}: {
  userName: string;
  location?: string;
  score: number;
  classification: "low" | "medium" | "high";
  isImproving: boolean;
  optimalTime: string;
}) {
  const router = useRouter();

  // Generate contextual insight based on risk conditions
  const getInsight = () => {
    if (isImproving && optimalTime) {
      return `Clearing up — best by ${optimalTime}`;
    }

    if (score > 60) {
      return "Your commute looks rough today";
    }

    if (score >= 30) {
      return "Some delays expected";
    }

    return "Great conditions for your drive";
  };

  // Get color based on classification
  const insightColor =
    classification === "high" ? colors.risk.high.primary :
    classification === "medium" ? colors.risk.medium.primary :
    colors.risk.low.primary;

  return (
    <View style={styles.homeHeader}>
      <View style={styles.headerLeft}>
        <Text style={[styles.insight, { color: insightColor }]}>
          {getInsight()}
        </Text>
        <Text style={styles.greeting}>Hi {userName}</Text>
        {location && (
          <View style={styles.locationRow}>
            <HugeiconsIcon icon={Location01Icon} size={14} color={colors.text.tertiary} />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => {
          lightHaptic();
          router.push("/(tabs)/settings");
        }}
        accessibilityLabel="Open settings"
        accessibilityRole="button"
      >
        <View style={styles.avatar}>
          <HugeiconsIcon icon={UserIcon} size={24} color={colors.brand.primary} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// Section card wrapper component
function SectionCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100)}
      style={[styles.sectionCard, style]}
    >
      {children}
    </Animated.View>
  );
}

export default function OverviewScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { location, address, isLoading: locationLoading, error: locationError, refresh: refreshLocation } = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [timestamp, setTimestamp] = useState(getRoundedTimestamp);

  // ============================================================================
  // OPTIMIZED: Single consolidated query instead of 4 separate subscriptions
  // Reduces bandwidth by ~75% and improves cache efficiency
  // ============================================================================
  const dashboardData = useQuery(
    api.dashboard.getDashboardData,
    location
      ? {
          lat: location.lat,
          lng: location.lng,
          asOfTimestamp: timestamp,
        }
      : "skip"
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lightHaptic();
    // Refresh location if there was an error
    if (locationError) {
      await refreshLocation();
    }
    // Update timestamp to force fresh data
    setTimestamp(getRoundedTimestamp());
    setTimeout(() => setRefreshing(false), 1000);
  }, [locationError, refreshLocation]);

  const isLoading = locationLoading || (!locationError && dashboardData === undefined);

  // Calculate derived data from consolidated dashboard query
  const derivedData = useMemo(() => {
    if (!dashboardData) {
      return {
        currentScore: 0,
        classification: "low" as Classification,
        weatherScore: 0,
        trafficScore: 0,
        optimalDepartureMinutes: 0,
        optimalTime: "",
        isOptimalNow: true,
        reason: "Loading…",
        currentDelayMinutes: 0,
        weatherTrend: "stable" as const,
        trafficTrend: "stable" as const,
        timelineSlots: [],
        alerts: [],
        weatherStatus: { status: "Clear", detail: "Loading…" },
        trafficStatus: { status: "Flowing", detail: "Loading…" },
      };
    }

    // Extract data from consolidated response
    const { risk, forecast } = dashboardData;

    const currentScore = risk.score;
    const classification = getRiskClassification(currentScore);
    const weatherScore = risk.breakdown.weatherScore;
    const trafficScore = risk.breakdown.trafficScore;

    // Use real forecast data from backend
    const timelineSlots = forecast.slots;
    const optimalDepartureMinutes = forecast.optimalDepartureMinutes;
    const optimalSlot = timelineSlots[forecast.optimalSlotIndex];
    const isOptimalNow = forecast.optimalSlotIndex === 0;

    // Estimate delay if leaving now vs optimal time (rough: score difference → minutes)
    const optimalScore = optimalSlot?.score ?? currentScore;
    const scoreDiff = currentScore - optimalScore;
    const currentDelayMinutes = scoreDiff > 5 ? Math.round(scoreDiff * 0.4) : 0;

    // Derive weather/traffic trends by comparing current to 30-min-out slot
    const futureSlot = timelineSlots[2]; // ~30 min from now
    const weatherTrend = deriveTrend(weatherScore, futureSlot?.score ?? weatherScore);
    const trafficTrend = deriveTrend(trafficScore, futureSlot?.score ?? trafficScore);

    // Generate reason based on conditions
    const reason = generateReason(weatherScore, trafficScore, isOptimalNow, optimalDepartureMinutes);

    // Weather and traffic details
    const weatherStatus = getWeatherDetails(weatherScore);
    const trafficStatus = getTrafficDetails(trafficScore);

    // Format alerts from nearby events with count and distance
    const alerts = (risk.nearbyEvents || []).map((event) => ({
      id: event._id,
      type: event.type,
      subtype: event.subtype,
      severity: event.severity,
      title: formatEventSubtype(event.subtype),
      timeAgo: "Recent", // Simplified since we don't have _creationTime in slim events
      count: event.count,
      distanceKm: event.distanceKm,
    }));

    return {
      currentScore,
      classification,
      weatherScore,
      trafficScore,
      optimalDepartureMinutes,
      optimalTime: optimalSlot?.label ?? "",
      isOptimalNow,
      reason,
      currentDelayMinutes,
      weatherTrend,
      trafficTrend,
      timelineSlots,
      alerts,
      weatherStatus,
      trafficStatus,
    };
  }, [dashboardData]);

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

  // Get user's first name
  const firstName = user?.firstName || user?.username || "there";

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
        {/* Header with greeting */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <HomeHeader
            userName={firstName ?? ""}
            location={address ?? ""}
            score={derivedData.currentScore}
            classification={derivedData.classification}
            isImproving={derivedData.weatherTrend === 'improving' || derivedData.trafficTrend === 'improving'}
            optimalTime={derivedData.optimalTime}
          />
        </Animated.View>

        {/* Location Error State */}
        {locationError && (
          <View style={styles.locationErrorContainer}>
            <View style={styles.locationErrorCard}>
              <HugeiconsIcon icon={Location01Icon} size={32} color={colors.text.tertiary} />
              <Text style={styles.locationErrorTitle}>Location Unavailable</Text>
              <Text style={styles.locationErrorText}>
                {locationError === "Location permission denied"
                  ? "Please enable location access in your device settings to see local conditions."
                  : "Unable to get your location. Pull down to retry."}
              </Text>
              <TouchableOpacity
                style={styles.locationErrorButton}
                onPress={() => {
                  lightHaptic();
                  refreshLocation();
                }}
              >
                <Text style={styles.locationErrorButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Departure Hero - Main CTA */}
        {isLoading ? (
          <View style={styles.heroSkeleton}>
            <RiskCircleSkeleton />
          </View>
        ) : (
          <SectionCard style={{ marginTop: spacing[6] }}>
            <DepartureHero
              optimalDepartureMinutes={derivedData.optimalDepartureMinutes}
              optimalTime={derivedData.optimalTime}
              classification={derivedData.classification}
              currentScore={derivedData.currentScore}
              reason={derivedData.reason}
              isOptimalNow={derivedData.isOptimalNow}
              currentDelayMinutes={derivedData.currentDelayMinutes}
              onCtaPress={() => {
                router.push({
                  pathname: "/smart-departure",
                  params: {
                    optimalTime: derivedData.optimalTime,
                    optimalMinutes: String(derivedData.optimalDepartureMinutes),
                    score: String(derivedData.currentScore),
                    classification: derivedData.classification,
                    reason: derivedData.reason,
                    isOptimalNow: derivedData.isOptimalNow ? "1" : "0",
                  },
                });
              }}
            />
          </SectionCard>
        )}

        {/* Departure Alert CTA */}
        {!isLoading && (
          <SectionCard>
            <DepartureAlertCta
              optimalTime={derivedData.optimalTime}
              isOptimalNow={derivedData.isOptimalNow}
              classification={derivedData.classification}
              onSetAlert={() => {
                lightHaptic();
                router.push({
                  pathname: "/smart-departure",
                  params: {
                    optimalTime: derivedData.optimalTime,
                    optimalMinutes: String(derivedData.optimalDepartureMinutes),
                    score: String(derivedData.currentScore),
                    classification: derivedData.classification,
                    reason: derivedData.reason,
                    isOptimalNow: derivedData.isOptimalNow ? "1" : "0",
                  },
                });
              }}
            />
          </SectionCard>
        )}

        {/* Time Saved Banner */}
        {!isLoading && (
          <SectionCard>
            <TimeSavedBanner
              minutesSavedThisWeek={0}
              hasRoutes={(dashboardData?.routes?.length ?? 0) > 0}
              onSetupRoute={() => {
                lightHaptic();
                router.push("/add-route");
              }}
            />
          </SectionCard>
        )}

        {/* Risk Timeline - Next 2 Hours */}
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
          <SectionCard>
            <RiskTimeline
              slots={derivedData.timelineSlots}
              onSlotPress={(slot) => {
                lightHaptic();
                // Could show more details about that time slot
              }}
            />
          </SectionCard>
        )}

        {/* Condition Cards - Weather & Traffic Details */}
        {isLoading ? (
          <View style={styles.conditionsSkeleton}>
            <DataCardSkeleton />
            <DataCardSkeleton />
          </View>
        ) : (
          <SectionCard>
            <ConditionCards
              weather={{
                status: derivedData.weatherStatus.status,
                detail: derivedData.weatherStatus.detail,
                score: derivedData.weatherScore,
                trend: derivedData.weatherTrend,
              }}
              traffic={{
                status: derivedData.trafficStatus.status,
                detail: derivedData.trafficStatus.detail,
                score: derivedData.trafficScore,
                trend: derivedData.trafficTrend,
              }}
            />
          </SectionCard>
        )}

        {/* Saved Routes Preview */}
        {dashboardData?.routes && dashboardData.routes.length > 0 && (
          <SectionCard>
            <RoutesPreview
              routes={dashboardData.routes}
              onRoutePress={handleRoutePress}
              onViewAllPress={handleViewAllRoutes}
            />
          </SectionCard>
        )}

        {/* Alerts Section */}
        {!isLoading && (
          <SectionCard>
            <AlertsSection
              alerts={derivedData.alerts}
              onAlertPress={handleAlertPress}
              onViewAllPress={handleViewMapPress}
            />
          </SectionCard>
        )}

        {/* Bottom padding for floating tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Notification permission prompt */}
      <NotificationPrompt />
    </SafeAreaView>
  );
}

// Helper functions

function deriveTrend(currentScore: number, futureScore: number): 'improving' | 'worsening' | 'stable' {
  const diff = futureScore - currentScore;
  if (diff <= -10) return 'improving';
  if (diff >= 10) return 'worsening';
  return 'stable';
}

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
    backgroundColor: colors.slate[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  // Header with greeting
  homeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    backgroundColor: `${colors.brand.primary}06`,
  },
  headerLeft: {
    flex: 1,
  },
  insight: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  greeting: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing[2],
  },
  locationText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  avatarButton: {
    marginLeft: spacing[4],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.brand.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  // Section card wrapper
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    padding: spacing[5],
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  heroSkeleton: {
    alignItems: "center",
    paddingVertical: spacing[6],
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  timelineSkeleton: {
    marginTop: spacing[6],
    marginHorizontal: spacing[4],
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
    height: spacing[12],
  },
  // Location error
  locationErrorContainer: {
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  locationErrorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing[6],
    alignItems: "center",
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  locationErrorTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginTop: spacing[3],
  },
  locationErrorText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing[2],
    lineHeight: 22,
  },
  locationErrorButton: {
    marginTop: spacing[4],
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
  },
  locationErrorButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
});
