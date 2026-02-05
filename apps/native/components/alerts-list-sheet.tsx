import React, { useCallback, useMemo, useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import BottomSheet, { BottomSheetFlatList, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  CloudIcon,
  Car01Icon,
  Location01Icon,
  Navigation03Icon,
  FilterIcon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import MapView from "react-native-maps";

import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";
import { mediumHaptic, lightHaptic } from "@/lib/haptics";
import { calculateDistance, formatDistance, isPointNearRoute } from "@/lib/geo-utils";

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

type AlertsListSheetProps = {
  alerts: AlertItem[];
  userLocation: { lat: number; lng: number } | null;
  userRoutes?: UserRoute[];
  mapRef?: React.RefObject<MapView | null>;
  onAlertSelect: (alert: AlertItem) => void;
  bottomInset?: number; // Distance from screen bottom (to clear tab bar)
};

type SortOption = "distance" | "severity" | "type";
type FilterOption = "all" | "weather" | "traffic";

// Enriched alert with computed metadata
type EnrichedAlert = AlertItem & {
  distance: number;
  distanceLabel: string;
  onRoute: boolean;
  routeName?: string;
  formattedSubtype: string;
};

export function AlertsListSheet({
  alerts,
  userLocation,
  userRoutes = [],
  mapRef,
  onAlertSelect,
  bottomInset = 0,
}: AlertsListSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  // Define snap points: minimized (15% screen), half (50%), full (90%)
  const snapPoints = useMemo(() => ["15%", "50%", "90%"], []);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(0);

  // Enrich alerts with computed metadata
  const enrichedAlerts = useMemo((): EnrichedAlert[] => {
    if (!userLocation) return [];

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

      return {
        ...alert,
        distance,
        distanceLabel,
        onRoute,
        routeName,
        formattedSubtype,
      };
    });
  }, [alerts, userLocation, userRoutes]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    if (filterBy === "all") return enrichedAlerts;
    return enrichedAlerts.filter((alert) => alert.type === filterBy);
  }, [enrichedAlerts, filterBy]);

  // Sort alerts
  const sortedAlerts = useMemo(() => {
    const sorted = [...filteredAlerts];

    switch (sortBy) {
      case "distance":
        sorted.sort((a, b) => a.distance - b.distance);
        break;
      case "severity":
        sorted.sort((a, b) => b.severity - a.severity);
        break;
      case "type":
        sorted.sort((a, b) => {
          if (a.type === b.type) return a.distance - b.distance;
          return a.type.localeCompare(b.type);
        });
        break;
    }

    // Always prioritize alerts on route
    return sorted.sort((a, b) => {
      if (a.onRoute && !b.onRoute) return -1;
      if (!a.onRoute && b.onRoute) return 1;
      return 0;
    });
  }, [filteredAlerts, sortBy]);

  // Get severity color
  const getSeverityColor = (severity: number): string => {
    if (severity >= 4) return colors.risk.high.primary;
    if (severity >= 3) return colors.risk.medium.primary;
    return colors.state.info;
  };

  const getSeverityBg = (severity: number): string => {
    if (severity >= 4) return colors.risk.high.light;
    if (severity >= 3) return colors.risk.medium.light;
    return `${colors.state.info}15`;
  };

  // Get severity distribution for minimized view
  const severityDistribution = useMemo(() => {
    const distribution = { high: 0, medium: 0, low: 0 };
    sortedAlerts.forEach((alert) => {
      if (alert.severity >= 4) distribution.high++;
      else if (alert.severity >= 3) distribution.medium++;
      else distribution.low++;
    });
    return distribution;
  }, [sortedAlerts]);

  // Handle alert tap
  const handleAlertPress = useCallback(
    (alert: EnrichedAlert) => {
      mediumHaptic();

      // Center map on alert location
      if (mapRef?.current) {
        mapRef.current.animateToRegion(
          {
            latitude: alert.location.lat,
            longitude: alert.location.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          300
        );
      }

      // Collapse sheet to minimized state (15%) for better map view
      bottomSheetRef.current?.snapToIndex(0);

      // Notify parent
      onAlertSelect(alert);
    },
    [mapRef, onAlertSelect]
  );

  // Render individual alert item
  const renderAlertItem = useCallback(
    ({ item }: { item: EnrichedAlert }) => {
      const Icon = item.type === "weather" ? CloudIcon : Car01Icon;
      const severityColor = getSeverityColor(item.severity);
      const severityBg = getSeverityBg(item.severity);

      return (
        <TouchableOpacity
          style={styles.alertItem}
          onPress={() => handleAlertPress(item)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${item.formattedSubtype} alert, ${item.distanceLabel} away, severity ${item.severity}`}
        >
          {/* Left indicator */}
          <View
            style={[styles.alertIndicator, { backgroundColor: severityColor }]}
          />

          {/* Alert icon */}
          <View style={[styles.alertIcon, { backgroundColor: severityBg }]}>
            <HugeiconsIcon icon={Icon} size={20} color={severityColor} />
          </View>

          {/* Alert content */}
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle} numberOfLines={1}>
              {item.formattedSubtype}
            </Text>
            <View style={styles.alertMeta}>
              <View style={styles.metaBadge}>
                <HugeiconsIcon
                  icon={Navigation03Icon}
                  size={12}
                  color={colors.text.tertiary}
                />
                <Text style={styles.metaText}>{item.distanceLabel}</Text>
              </View>
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: severityBg },
                ]}
              >
                <Text
                  style={[styles.severityText, { color: severityColor }]}
                >
                  Lv {item.severity}
                </Text>
              </View>
            </View>
          </View>

          {/* On route indicator */}
          {item.onRoute && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.onRouteBadge}
            >
              <HugeiconsIcon
                icon={Location01Icon}
                size={14}
                color={colors.brand.secondary}
              />
              <Text style={styles.onRouteText}>On route</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      );
    },
    [handleAlertPress]
  );

  // Render backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={0}
        appearsOnIndex={1}
        opacity={0.3}
      />
    ),
    []
  );

  // Handle sort change
  const cycleSortOption = () => {
    lightHaptic();
    setSortBy((prev) => {
      if (prev === "distance") return "severity";
      if (prev === "severity") return "type";
      return "distance";
    });
  };

  // Handle filter change
  const cycleFilterOption = () => {
    lightHaptic();
    setFilterBy((prev) => {
      if (prev === "all") return "weather";
      if (prev === "weather") return "traffic";
      return "all";
    });
  };

  // Get sort label
  const getSortLabel = () => {
    switch (sortBy) {
      case "distance":
        return "Distance";
      case "severity":
        return "Severity";
      case "type":
        return "Type";
    }
  };

  // Get filter label
  const getFilterLabel = () => {
    switch (filterBy) {
      case "all":
        return "All";
      case "weather":
        return "Weather";
      case "traffic":
        return "Traffic";
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose={false}
      bottomInset={bottomInset}
      detached={false}
      onChange={(index) => {
        setCurrentSnapIndex(index);
        if (index > 0) lightHaptic();
      }}
    >
      {/* Minimized State (15%) - Summary view */}
      {currentSnapIndex === 0 ? (
        <View style={styles.minimizedContainer}>
          <TouchableOpacity
            style={styles.minimizedContent}
            onPress={() => bottomSheetRef.current?.snapToIndex(1)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${sortedAlerts.length} alerts. Tap to expand.`}
          >
            <View style={styles.minimizedTextContainer}>
              <Text style={styles.minimizedCount}>
                {sortedAlerts.length} alert{sortedAlerts.length !== 1 ? "s" : ""}
              </Text>
              <Text style={styles.minimizedLabel}>
                {sortedAlerts.some((a) => a.onRoute) ? "on your route" : "nearby"}
              </Text>
            </View>

            {/* Severity distribution dots */}
            <View style={styles.severityDots}>
              {severityDistribution.high > 0 &&
                Array.from({ length: Math.min(severityDistribution.high, 5) }).map((_, i) => (
                  <View
                    key={`high-${i}`}
                    style={[styles.severityDot, { backgroundColor: colors.risk.high.primary }]}
                  />
                ))}
              {severityDistribution.medium > 0 &&
                Array.from({ length: Math.min(severityDistribution.medium, 5) }).map((_, i) => (
                  <View
                    key={`medium-${i}`}
                    style={[styles.severityDot, { backgroundColor: colors.risk.medium.primary }]}
                  />
                ))}
              {severityDistribution.low > 0 &&
                Array.from({ length: Math.min(severityDistribution.low, 5) }).map((_, i) => (
                  <View
                    key={`low-${i}`}
                    style={[styles.severityDot, { backgroundColor: colors.state.info }]}
                  />
                ))}
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Expanded Header (50% and 90%) */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>
                {sortedAlerts.length} Alert{sortedAlerts.length !== 1 ? "s" : ""}
              </Text>
              {sortedAlerts.some((a) => a.onRoute) && (
                <View style={styles.routeBadge}>
                  <View style={styles.routeDot} />
                  <Text style={styles.routeBadgeText}>
                    {sortedAlerts.filter((a) => a.onRoute).length} on route
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={cycleFilterOption}
                accessibilityLabel={`Filter by ${getFilterLabel()}`}
                accessibilityRole="button"
              >
                <HugeiconsIcon
                  icon={FilterIcon}
                  size={16}
                  color={colors.brand.secondary}
                />
                <Text style={styles.controlText}>{getFilterLabel()}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={cycleSortOption}
                accessibilityLabel={`Sort by ${getSortLabel()}`}
                accessibilityRole="button"
              >
                <Text style={styles.controlText}>Sort: {getSortLabel()}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Alerts list */}
          <BottomSheetFlatList
            data={sortedAlerts}
            renderItem={renderAlertItem}
            keyExtractor={(item: EnrichedAlert) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={Platform.OS === "android"}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {filterBy === "all"
                    ? "No alerts in this area"
                    : `No ${filterBy} alerts nearby`}
                </Text>
              </View>
            }
          />
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius["3xl"],
    borderTopRightRadius: borderRadius["3xl"],
    ...shadows.xl,
  },
  handleIndicator: {
    backgroundColor: colors.slate[300],
    width: 36,
    height: 4,
  },

  // Minimized State (15%)
  minimizedContainer: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  minimizedContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  minimizedTextContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing[2],
  },
  minimizedCount: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  minimizedLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
  },
  severityDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },

  // Header
  header: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing[3],
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  routeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    backgroundColor: `${colors.brand.secondary}15`,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  routeDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.secondary,
  },
  routeBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.brand.secondary,
  },
  headerControls: {
    flexDirection: "row",
    gap: spacing[2],
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    backgroundColor: colors.slate[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  controlText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.brand.secondary,
  },

  // List
  listContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    paddingBottom: spacing[10],
  },

  // Alert item
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing[3],
    marginVertical: spacing[1],
    gap: spacing[3],
    ...shadows.sm,
  },
  alertIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.xl,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing[2],
  },
  alertContent: {
    flex: 1,
    gap: spacing[1],
  },
  alertTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  alertMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  metaText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    fontWeight: typography.weight.medium,
  },
  severityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  severityText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },

  // On route badge
  onRouteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    backgroundColor: `${colors.brand.secondary}15`,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  onRouteText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.brand.secondary,
  },

  // Empty state
  emptyState: {
    paddingVertical: spacing[10],
    alignItems: "center",
  },
  emptyText: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
    textAlign: "center",
  },
});
