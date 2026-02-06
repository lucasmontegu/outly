import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Clock01Icon,
  Analytics01Icon,
  Route01Icon,
} from "@hugeicons/core-free-icons";
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";

type TimeSavedBannerProps = {
  minutesSavedThisWeek: number;
  hasRoutes: boolean;
  onSetupRoute?: () => void;
};

export function TimeSavedBanner({
  minutesSavedThisWeek,
  hasRoutes,
  onSetupRoute,
}: TimeSavedBannerProps) {
  // State 1: User has saved time
  if (minutesSavedThisWeek > 0) {
    return (
      <Animated.View entering={FadeIn} style={styles.bannerHasSavings}>
        <HugeiconsIcon icon={Clock01Icon} size={20} color={colors.risk.low.primary} />
        <Text style={styles.textHasSavings}>
          Outia saved you{" "}
          <Text style={styles.minutesBold}>{minutesSavedThisWeek} min</Text> this week
        </Text>
      </Animated.View>
    );
  }

  // State 2: User has routes but no savings yet
  if (hasRoutes) {
    return (
      <Animated.View entering={FadeIn} style={styles.bannerHasRoutes}>
        <HugeiconsIcon icon={Analytics01Icon} size={20} color={colors.text.secondary} />
        <Text style={styles.textMuted}>
          Follow departure times to save time on your commute
        </Text>
      </Animated.View>
    );
  }

  // State 3: New user, no routes
  return (
    <Animated.View entering={FadeIn}>
      <TouchableOpacity
        style={styles.bannerNoRoutes}
        onPress={onSetupRoute}
        activeOpacity={0.7}
      >
        <View style={styles.noRoutesContent}>
          <HugeiconsIcon icon={Route01Icon} size={20} color={colors.brand.primary} />
          <Text style={styles.textNoRoutes}>
            Set up your first route to start optimizing
          </Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerHasSavings: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: `${colors.risk.low.primary}10`,
    borderRadius: borderRadius.lg,
  },
  textHasSavings: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    flex: 1,
  },
  minutesBold: {
    fontWeight: typography.weight.bold,
    color: colors.risk.low.primary,
  },
  bannerHasRoutes: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: `${colors.brand.primary}08`,
    borderRadius: borderRadius.lg,
  },
  textMuted: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
    color: colors.text.secondary,
    flex: 1,
  },
  bannerNoRoutes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: `${colors.brand.secondary}15`,
    borderRadius: borderRadius.lg,
  },
  noRoutesContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
  },
  textNoRoutes: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.brand.primary,
    flex: 1,
  },
  arrow: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.brand.primary,
    marginLeft: spacing[1],
  },
});
