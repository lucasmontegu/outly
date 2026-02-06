import React, { useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ViewToken,
} from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  CloudIcon,
  Car01Icon,
  Navigation03Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";
import { calculateDistance, formatDistance, isPointNearRoute } from "@/lib/geo-utils";
import { lightHaptic, mediumHaptic } from "@/lib/haptics";

export type AlertItem = {
  _id: string;
  type: "weather" | "traffic";
  subtype: string;
  severity: number;
  confidenceScore: number;
  location: {
    lat: number;
    lng: number;
  };
  _creationTime: number;
};

export type UserRoute = {
  _id: string;
  name: string;
  fromLocation: { lat: number; lng: number };
  toLocation: { lat: number; lng: number };
};

type AlertCarouselProps = {
  alerts: AlertItem[];
  userLocation: { lat: number; lng: number };
  userRoutes?: UserRoute[];
  onAlertSelect: (alert: AlertItem) => void;
  selectedAlertId?: string;
  userVotes?: Record<string, boolean>; // eventId -> hasVoted
  bottomInset?: number; // Distance from screen bottom (to clear tab bar)
};

// Enriched alert with computed metadata
type EnrichedAlert = AlertItem & {
  distance: number;
  distanceLabel: string;
  onRoute: boolean;
  routeName?: string;
  formattedSubtype: string;
  hasVoted: boolean;
};

// Card dimensions
const CARD_WIDTH = 280;
const CARD_HEIGHT = 120;
const CARD_GAP = 12;
const CAROUSEL_PADDING = 16;

function AlertCard({
  alert,
  isSelected,
  onPress,
}: {
  alert: EnrichedAlert;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(isSelected ? 1.02 : 1);

  React.useEffect(() => {
    scale.value = withSpring(isSelected ? 1.02 : 1, {
      damping: 15,
      stiffness: 200,
    });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const Icon = alert.type === "weather" ? CloudIcon : Car01Icon;
  const severityColor = getSeverityColor(alert.severity);
  const severityBg = getSeverityBg(alert.severity);

  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(100)}
      style={[styles.cardContainer, animatedStyle]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && styles.cardSelected,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${alert.formattedSubtype} alert, ${alert.distanceLabel} away, severity ${alert.severity}`}
      >
        <View style={styles.cardContent}>
          <CardContent
            alert={alert}
            Icon={Icon}
            severityColor={severityColor}
            severityBg={severityBg}
            isSelected={isSelected}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function CardContent({
  alert,
  Icon,
  severityColor,
  severityBg,
  isSelected,
}: {
  alert: EnrichedAlert;
  Icon: any;
  severityColor: string;
  severityBg: string;
  isSelected: boolean;
}) {
  return (
    <>
      {/* Icon with severity-colored background */}
      <View style={[styles.iconContainer, { backgroundColor: severityBg }]}>
        <HugeiconsIcon icon={Icon} size={24} color={severityColor} />
      </View>

      {/* Alert details */}
      <View style={styles.alertDetails}>
        <Text style={styles.alertTitle} numberOfLines={1}>
          {alert.formattedSubtype}
        </Text>

        {/* Distance and severity badges */}
        <View style={styles.badgesRow}>
          {/* Distance badge */}
          <View
            style={[
              styles.distanceBadge,
              alert.onRoute && styles.onRouteBadge,
            ]}
          >
            <HugeiconsIcon
              icon={Navigation03Icon}
              size={12}
              color={
                alert.onRoute ? colors.brand.secondary : colors.text.tertiary
              }
            />
            <Text
              style={[
                styles.distanceText,
                alert.onRoute && styles.onRouteText,
              ]}
            >
              {alert.onRoute ? "On your route" : alert.distanceLabel}
            </Text>
          </View>

          {/* Severity indicator */}
          <View
            style={[styles.severityDot, { backgroundColor: severityColor }]}
          />
        </View>

        {/* Vote CTA if user hasn't voted */}
        {!alert.hasVoted && (
          <View style={styles.voteCta}>
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={12}
              color={colors.text.tertiary}
            />
            <Text style={styles.voteCtaText}>Tap to vote</Text>
          </View>
        )}
      </View>
    </>
  );
}

function getSeverityColor(severity: number): string {
  if (severity >= 4) return colors.risk.high.primary;
  if (severity >= 3) return colors.risk.medium.primary;
  return colors.state.info;
}

function getSeverityBg(severity: number): string {
  if (severity >= 4) return colors.risk.high.light;
  if (severity >= 3) return colors.risk.medium.light;
  return `${colors.state.info}15`;
}

export function AlertCarousel({
  alerts,
  userLocation,
  userRoutes = [],
  onAlertSelect,
  selectedAlertId,
  userVotes = {},
  bottomInset = 100,
}: AlertCarouselProps) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Enrich alerts with computed metadata
  const enrichedAlerts = useMemo((): EnrichedAlert[] => {
    return alerts.map((alert) => {
      // Calculate distance from user
      const distance = calculateDistance(userLocation, alert.location);
      const distanceLabel = formatDistance(distance);

      // Check if alert is on any saved route
      let onRoute = false;
      let routeName: string | undefined;

      for (const route of userRoutes) {
        if (
          isPointNearRoute(
            alert.location,
            route.fromLocation,
            route.toLocation,
            1.5 // 1.5km threshold
          )
        ) {
          onRoute = true;
          routeName = route.name;
          break;
        }
      }

      // Format subtype for display
      const formattedSubtype = alert.subtype
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Check if user has voted
      const hasVoted = userVotes[alert._id] || false;

      return {
        ...alert,
        distance,
        distanceLabel,
        onRoute,
        routeName,
        formattedSubtype,
        hasVoted,
      };
    });
  }, [alerts, userLocation, userRoutes, userVotes]);

  // Sort alerts: prioritize alerts on route, then by distance
  const sortedAlerts = useMemo(() => {
    const sorted = [...enrichedAlerts];
    return sorted.sort((a, b) => {
      if (a.onRoute && !b.onRoute) return -1;
      if (!a.onRoute && b.onRoute) return 1;
      return a.distance - b.distance;
    });
  }, [enrichedAlerts]);

  const handleAlertPress = useCallback(
    (alert: EnrichedAlert) => {
      mediumHaptic();
      onAlertSelect(alert);
    },
    [onAlertSelect]
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const index = viewableItems[0].index;
        if (index !== null && index !== currentIndex) {
          setCurrentIndex(index);
          lightHaptic();
        }
      }
    },
    [currentIndex]
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderAlert = useCallback(
    ({ item }: { item: EnrichedAlert }) => (
      <AlertCard
        alert={item}
        isSelected={selectedAlertId === item._id}
        onPress={() => handleAlertPress(item)}
      />
    ),
    [selectedAlertId, handleAlertPress]
  );

  const keyExtractor = useCallback((item: EnrichedAlert) => item._id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: CARD_WIDTH + CARD_GAP,
      offset: (CARD_WIDTH + CARD_GAP) * index,
      index,
    }),
    []
  );

  if (sortedAlerts.length === 0) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.container, { bottom: bottomInset }]}>
      <FlatList
        ref={flatListRef}
        data={sortedAlerts}
        renderItem={renderAlert}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
      />

      {/* Pagination dots */}
      {sortedAlerts.length > 1 && (
        <View style={styles.pagination}>
          {sortedAlerts.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  listContent: {
    paddingHorizontal: CAROUSEL_PADDING,
    gap: CARD_GAP,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.lg,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.brand.primary,
    ...shadows.xl,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    gap: spacing[3],
    backgroundColor: "#FFFFFF",
  },

  // Icon
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },

  // Alert details
  alertDetails: {
    flex: 1,
    gap: spacing[2],
  },
  alertTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    backgroundColor: colors.slate[100],
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  onRouteBadge: {
    backgroundColor: `${colors.brand.secondary}15`,
  },
  distanceText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
  },
  onRouteText: {
    color: colors.brand.secondary,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  voteCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  voteCtaText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    fontWeight: typography.weight.medium,
  },

  // Pagination
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing[3],
    gap: spacing[1],
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate[300],
  },
  paginationDotActive: {
    width: 8,
    height: 8,
    backgroundColor: colors.brand.primary,
  },
});
