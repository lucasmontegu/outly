import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import { lightHaptic, riskLevelHaptic } from "@/lib/haptics";
import { colors, spacing, typography, borderRadius, shadows } from "@/lib/design-tokens";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { AlarmClockIcon, Navigation03Icon } from "@hugeicons/core-free-icons";

type Classification = "low" | "medium" | "high";

type DepartureHeroProps = {
  optimalDepartureMinutes: number;
  optimalTime: string;
  classification: Classification;
  currentScore: number;
  reason: string;
  isOptimalNow: boolean;
  currentDelayMinutes?: number;
  onCtaPress?: () => void;
};

const COLORS = {
  low: colors.risk.low.primary,
  medium: colors.risk.medium.primary,
  high: colors.risk.high.primary,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DepartureHero({
  optimalDepartureMinutes,
  optimalTime,
  classification,
  currentScore,
  reason,
  isOptimalNow,
  currentDelayMinutes,
  onCtaPress,
}: DepartureHeroProps) {
  const pulseScale = useSharedValue(1);
  const scoreOpacity = useSharedValue(0);

  // Pulse animation for CTA button
  useEffect(() => {
    if (isOptimalNow) {
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.03, { damping: 10 }),
          withSpring(1, { damping: 15 })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withSpring(1);
    }
  }, [isOptimalNow]);

  // Fade in score pill
  useEffect(() => {
    scoreOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    riskLevelHaptic(classification);
  }, [currentScore, classification]);

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const scoreStyle = useAnimatedStyle(() => ({
    opacity: scoreOpacity.value,
  }));

  const getHeaderText = () => {
    if (isOptimalNow) {
      return "Perfect time to go";
    }
    return "Best time to leave";
  };

  const getMainTime = () => {
    if (isOptimalNow) {
      return "NOW";
    }
    return optimalTime;
  };

  const getCtaText = () => {
    if (isOptimalNow) {
      return "Navigate Now";
    }
    return "Set Smart Alarm";
  };

  const getCtaIcon = () => {
    if (isOptimalNow) {
      return Navigation03Icon;
    }
    return AlarmClockIcon;
  };

  const handleCtaPress = () => {
    lightHaptic();
    onCtaPress?.();
  };

  const estimatedTravelTime = 25; // TODO: Replace with actual calculation
  const estimatedTravelTimeIfNow = currentDelayMinutes
    ? estimatedTravelTime + currentDelayMinutes
    : estimatedTravelTime;

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={styles.container}
    >
      {/* Header with label and score pill */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>{getHeaderText()}</Text>
        <Animated.View
          style={[
            styles.scorePill,
            { backgroundColor: COLORS[classification] },
            scoreStyle,
          ]}
        >
          <Text style={styles.scorePillText}>{currentScore}</Text>
        </Animated.View>
      </View>

      {/* Main time display */}
      <Text
        style={[
          styles.mainTime,
          { color: isOptimalNow ? COLORS[classification] : colors.text.primary }
        ]}
      >
        {getMainTime()}
      </Text>

      {/* Reason text */}
      <Text style={styles.reasonText}>{reason}</Text>

      {/* Comparison rows */}
      {!isOptimalNow && (
        <View style={styles.comparisonContainer}>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>Now</Text>
            <Text style={styles.comparisonArrow}>→</Text>
            <Text style={styles.comparisonValue}>
              {estimatedTravelTimeIfNow} min
            </Text>
            {currentDelayMinutes && currentDelayMinutes > 0 && (
              <Text style={styles.delayBadge}>
                +{currentDelayMinutes} delay
              </Text>
            )}
          </View>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>{optimalTime}</Text>
            <Text style={styles.comparisonArrow}>→</Text>
            <Text style={[styles.comparisonValue, styles.comparisonValueOptimal]}>
              {estimatedTravelTime} min
            </Text>
            <Text style={styles.optimalBadge}>optimal</Text>
          </View>
        </View>
      )}

      {/* CTA Button */}
      <AnimatedPressable
        onPress={handleCtaPress}
        style={[
          styles.ctaButton,
          ctaStyle,
          {
            backgroundColor: isOptimalNow
              ? COLORS.low
              : colors.brand.secondary
          },
          isOptimalNow ? shadows.glow.low : shadows.md,
        ]}
      >
        <HugeiconsIcon
          icon={getCtaIcon()}
          size={20}
          color={colors.text.inverse}
        />
        <Text style={styles.ctaText}>{getCtaText()}</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  headerLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    letterSpacing: typography.tracking.wide,
  },
  scorePill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    minWidth: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  scorePillText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    fontFamily: "JetBrainsMono_700Bold",
    color: colors.text.inverse,
  },
  mainTime: {
    fontSize: typography.size["8xl"],
    fontWeight: typography.weight.extrabold,
    letterSpacing: typography.tracking.tight,
    marginBottom: spacing[3],
  },
  reasonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing[5],
    paddingHorizontal: spacing[4],
  },
  comparisonContainer: {
    width: "100%",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  comparisonLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    minWidth: 50,
  },
  comparisonArrow: {
    fontSize: typography.size.lg,
    color: colors.text.tertiary,
  },
  comparisonValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    fontFamily: "JetBrainsMono_600SemiBold",
    color: colors.text.secondary,
    flex: 1,
  },
  comparisonValueOptimal: {
    color: colors.risk.low.primary,
  },
  delayBadge: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.risk.high.primary,
    backgroundColor: colors.risk.high.light,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  optimalBadge: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.risk.low.primary,
    backgroundColor: colors.risk.low.light,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.xl,
    minWidth: 200,
  },
  ctaText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
});
