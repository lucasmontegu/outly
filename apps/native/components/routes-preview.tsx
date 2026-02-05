import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Home01Icon,
  Building01Icon,
  UserIcon,
  ArrowRight01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";
import { lightHaptic } from "@/lib/haptics";

type Classification = "low" | "medium" | "high";

type RoutePreview = {
  _id: string;
  name: string;
  fromName: string;
  toName: string;
  icon: "home" | "building" | "running";
  currentScore: number;
  classification: Classification;
  optimalDepartureMinutes: number;
  optimalTime: string;
  isOptimalNow: boolean;
};

type RoutesPreviewProps = {
  routes: RoutePreview[];
  onRoutePress: (route: RoutePreview) => void;
  onViewAllPress: () => void;
};

const ICONS = {
  home: Home01Icon,
  building: Building01Icon,
  running: UserIcon,
};

const CLASSIFICATION_COLORS = {
  low: colors.risk.low.primary,
  medium: colors.risk.medium.primary,
  high: colors.risk.high.primary,
};

const CLASSIFICATION_BG = {
  low: colors.risk.low.light,
  medium: colors.risk.medium.light,
  high: colors.risk.high.light,
};

function formatLocationName(name: string): string {
  // If it has a comma, take only the first part (e.g., "123 Main St, City" -> "123 Main St")
  if (name.includes(',')) {
    return name.split(',')[0].trim();
  }

  // If it looks like a full address with numbers, try to abbreviate
  // e.g., "124 Avenida Siempre Viva" -> keep as is (we'll truncate in UI if needed)
  return name;
}

function calculateETA(baseMinutes: number, score: number): { text: string; hasDelay: boolean } {
  const delayMinutes = Math.round(score * 0.3);
  const totalMinutes = baseMinutes + delayMinutes;
  const hasDelay = delayMinutes > 3;

  if (hasDelay) {
    return {
      text: `~${totalMinutes} min (+${delayMinutes})`,
      hasDelay: true,
    };
  }

  return {
    text: `~${totalMinutes} min`,
    hasDelay: false,
  };
}

export function RoutesPreview({
  routes,
  onRoutePress,
  onViewAllPress,
}: RoutesPreviewProps) {
  if (routes.length === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={onViewAllPress}
        activeOpacity={0.7}
        accessibilityLabel="View all saved routes"
        accessibilityRole="button"
      >
        <Text style={styles.title}>Your Routes</Text>
        <View style={styles.headerRight}>
          <Text style={styles.viewAllText}>View All</Text>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            color={colors.brand.secondary}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.routesList}>
        {routes.slice(0, 2).map((route, index) => {
          const formattedFrom = formatLocationName(route.fromName);
          const formattedTo = formatLocationName(route.toName);
          const displayRouteName = `${formattedFrom} → ${formattedTo}`;
          const eta = calculateETA(25, route.currentScore); // Base 25 min as default

          return (
            <Animated.View
              key={route._id}
              entering={FadeInDown.duration(300).delay(index * 100)}
            >
              <TouchableOpacity
                style={styles.routeCard}
                onPress={() => {
                  lightHaptic();
                  onRoutePress(route);
                }}
                activeOpacity={0.7}
                accessibilityLabel={`${displayRouteName}: Risk score ${route.currentScore}. ${route.isOptimalNow ? "Leave now" : `Best time ${route.optimalTime}`}. ${eta.text}`}
              >
                {/* Icon */}
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: CLASSIFICATION_BG[route.classification] },
                  ]}
                >
                  <HugeiconsIcon
                    icon={ICONS[route.icon]}
                    size={20}
                    color={CLASSIFICATION_COLORS[route.classification]}
                  />
                </View>

                {/* Route info */}
                <View style={styles.routeContent}>
                  {/* Top row: Route name + risk dot + score + departure */}
                  <View style={styles.topRow}>
                    <View style={styles.routeNameRow}>
                      <Text style={styles.routeName} numberOfLines={1}>
                        {displayRouteName}
                      </Text>
                      <View style={styles.riskIndicator}>
                        <View
                          style={[
                            styles.riskDot,
                            { backgroundColor: CLASSIFICATION_COLORS[route.classification] },
                          ]}
                        />
                        <Text style={styles.riskScore}>{route.currentScore}</Text>
                      </View>
                    </View>

                    {/* Departure info */}
                    <View style={styles.departureInfo}>
                      {route.isOptimalNow ? (
                        <View
                          style={[
                            styles.departureBadge,
                            {
                              backgroundColor: route.classification === "low"
                                ? CLASSIFICATION_BG.low
                                : CLASSIFICATION_BG.medium
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.departureText,
                              {
                                color: route.classification === "low"
                                  ? CLASSIFICATION_COLORS.low
                                  : CLASSIFICATION_COLORS.medium
                              },
                            ]}
                          >
                            {route.classification === "low" ? "Go Now" : "Best Now"}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.departureTime}>
                          <HugeiconsIcon
                            icon={Clock01Icon}
                            size={14}
                            color={colors.text.tertiary}
                          />
                          <Text style={styles.timeText}>{route.optimalTime}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Bottom row: ETA */}
                  <Text style={[styles.etaText, eta.hasDelay && styles.etaTextDelayed]}>
                    {eta.text}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  viewAllText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.brand.secondary,
  },
  routesList: {
    gap: spacing[2],
  },
  routeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing[3],
    gap: spacing[3],
    ...shadows.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  routeContent: {
    flex: 1,
    gap: spacing[1],
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  routeNameRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  routeName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    flexShrink: 1,
  },
  riskIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskScore: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  departureInfo: {
    alignItems: "flex-end",
  },
  departureBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  departureText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  departureTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  timeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  etaText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  etaTextDelayed: {
    color: colors.risk.medium.primary,
    fontWeight: typography.weight.medium,
  },
});
