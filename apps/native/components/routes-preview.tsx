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
          const showSubtitle = route.name && route.name !== displayRouteName;

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
                accessibilityLabel={`${displayRouteName}: ${route.isOptimalNow ? "Leave now" : `Best time ${route.optimalTime}`}`}
              >
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

                <View style={styles.routeContent}>
                  <Text style={styles.routeName} numberOfLines={1}>
                    {displayRouteName}
                  </Text>
                  {showSubtitle && (
                    <Text style={styles.routeSubtitle} numberOfLines={1}>
                      {route.name}
                    </Text>
                  )}
                </View>

                <View style={styles.departureInfo}>
                  {route.isOptimalNow ? (
                    <View
                      style={[
                        styles.departureBadge,
                        { backgroundColor: CLASSIFICATION_BG[route.classification] },
                      ]}
                    >
                      <Text
                        style={[
                          styles.departureText,
                          { color: CLASSIFICATION_COLORS[route.classification] },
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
    alignItems: "center",
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
  },
  routeName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  routeSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  departureInfo: {
    alignItems: "flex-end",
  },
  departureBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  departureText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  departureTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  timeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
});
