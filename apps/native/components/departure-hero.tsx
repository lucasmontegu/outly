import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { riskLevelHaptic } from "@/lib/haptics";
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";

type Classification = "low" | "medium" | "high";

type DepartureHeroProps = {
  optimalDepartureMinutes: number; // Minutes from now (0 = leave now, 15 = leave in 15 min)
  optimalTime: string; // e.g., "6:45 PM"
  classification: Classification;
  currentScore: number;
  reason: string; // e.g., "Rain clears soon. Traffic easing."
  isOptimalNow: boolean;
};

const COLORS = {
  low: colors.risk.low.primary,
  medium: colors.risk.medium.primary,
  high: colors.risk.high.primary,
};

export function DepartureHero({
  optimalDepartureMinutes,
  optimalTime,
  classification,
  currentScore,
  reason,
  isOptimalNow,
}: DepartureHeroProps) {
  const pulseScale = useSharedValue(1);
  const colorProgress = useSharedValue(0);

  // Pulse animation for "Leave Now"
  useEffect(() => {
    if (isOptimalNow) {
      pulseScale.value = withSequence(
        withSpring(1.02, { damping: 10 }),
        withSpring(1, { damping: 15 })
      );
    }
  }, [isOptimalNow]);

  // Color animation
  useEffect(() => {
    const targetValue = classification === "low" ? 0 : classification === "medium" ? 0.5 : 1;
    colorProgress.value = withTiming(targetValue, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    riskLevelHaptic(classification);
  }, [classification]);

  const heroStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      [COLORS.low, COLORS.medium, COLORS.high]
    );
    return {
      backgroundColor,
      transform: [{ scale: pulseScale.value }],
    };
  });

  const getMainMessage = () => {
    if (isOptimalNow) {
      return { top: "LEAVE", bottom: "NOW" };
    }
    if (optimalDepartureMinutes <= 5) {
      return { top: "LEAVE IN", bottom: `${optimalDepartureMinutes} MIN` };
    }
    if (optimalDepartureMinutes <= 60) {
      return { top: "LEAVE IN", bottom: `${optimalDepartureMinutes} MIN` };
    }
    // More than 1 hour
    const hours = Math.floor(optimalDepartureMinutes / 60);
    const mins = optimalDepartureMinutes % 60;
    return { top: "LEAVE IN", bottom: mins > 0 ? `${hours}H ${mins}M` : `${hours} HOUR${hours > 1 ? "S" : ""}` };
  };

  const message = getMainMessage();

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.heroCircle, heroStyle]}>
        <View style={styles.innerCircle}>
          <Text style={styles.topText}>{message.top}</Text>
          <Text style={styles.mainText}>{message.bottom}</Text>
          <Text style={styles.timeText}>
            {isOptimalNow ? "Conditions are optimal" : `Best at ${optimalTime}`}
          </Text>
        </View>
      </Animated.View>

      {/* Risk Score Badge - Secondary info */}
      <View style={[styles.scoreBadge, { backgroundColor: `${COLORS[classification]}15` }]}>
        <View style={[styles.scoreDot, { backgroundColor: COLORS[classification] }]} />
        <Text style={[styles.scoreText, { color: COLORS[classification] }]}>
          Score: {currentScore}
        </Text>
      </View>

      {/* Reason */}
      <Text style={styles.reasonText}>{reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing[4],
  },
  heroCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  innerCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: colors.slate[900],
    alignItems: "center",
    justifyContent: "center",
  },
  topText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.slate[400],
    letterSpacing: typography.tracking.wider,
  },
  mainText: {
    fontSize: 42,
    fontWeight: typography.weight.extrabold,
    color: colors.text.inverse,
    letterSpacing: typography.tracking.tight,
    marginTop: spacing[1],
  },
  timeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.slate[400],
    marginTop: spacing[2],
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    marginTop: spacing[4],
    gap: spacing[2],
  },
  scoreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.wide,
  },
  reasonText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing[8],
    marginTop: spacing[3],
  },
});
