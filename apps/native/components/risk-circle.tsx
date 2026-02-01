import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  interpolateColor,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { riskLevelHaptic } from "@/lib/haptics";

type Classification = "low" | "medium" | "high";

type RiskCircleProps = {
  score: number;
  classification: Classification;
  size?: number;
  /**
   * Whether to animate the score counting. Default: true
   */
  animateScore?: boolean;
  /**
   * Whether to trigger haptic on classification change. Default: true
   */
  enableHaptic?: boolean;
};

const COLORS = {
  low: "#22c55e",      // green-500
  medium: "#eab308",   // yellow-500
  high: "#ef4444",     // red-500
};

const LABELS = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
};

export function RiskCircle({
  score,
  classification,
  size = 200,
  animateScore = true,
  enableHaptic = true,
}: RiskCircleProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const prevClassification = useRef(classification);

  // Shared values for animations
  const colorProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const scoreScale = useSharedValue(1);

  // Map classification to numeric value for color interpolation
  const classificationToValue = (c: Classification) => {
    switch (c) {
      case "low": return 0;
      case "medium": return 0.5;
      case "high": return 1;
    }
  };

  // Animate score counting
  useEffect(() => {
    if (!animateScore) {
      setDisplayScore(score);
      return;
    }

    const startValue = displayScore;
    const duration = 800;
    const startTime = Date.now();

    const updateScore = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (score - startValue) * eased);

      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(updateScore);
      }
    };

    requestAnimationFrame(updateScore);

    // Score pop animation
    scoreScale.value = withSequence(
      withSpring(1.1, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );
  }, [score]);

  // Animate color and pulse on classification change
  useEffect(() => {
    const targetValue = classificationToValue(classification);
    colorProgress.value = withTiming(targetValue, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    // Only pulse and haptic if classification actually changed
    if (prevClassification.current !== classification) {
      // Pulse animation
      pulseScale.value = withSequence(
        withSpring(1.05, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );

      // Glow animation
      glowOpacity.value = withSequence(
        withTiming(0.6, { duration: 200 }),
        withTiming(0.3, { duration: 400 })
      );

      // Haptic feedback
      if (enableHaptic) {
        riskLevelHaptic(classification);
      }

      prevClassification.current = classification;
    }
  }, [classification, enableHaptic]);

  // Animated styles
  const outerCircleStyle = useAnimatedStyle(() => {
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

  const glowStyle = useAnimatedStyle(() => {
    const shadowColor = interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      [COLORS.low, COLORS.medium, COLORS.high]
    );

    return {
      shadowColor,
      shadowOpacity: glowOpacity.value,
    };
  });

  const scoreTextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      [COLORS.low, COLORS.medium, COLORS.high]
    );

    return { color };
  });

  const innerSize = size * 0.85;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.outerCircle,
          styles.glowEffect,
          { width: size, height: size, borderRadius: size / 2 },
          outerCircleStyle,
          glowStyle,
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          <Animated.Text style={[styles.score, scoreTextStyle]}>
            {displayScore}
          </Animated.Text>
          <Animated.Text style={[styles.label, labelStyle]}>
            {LABELS[classification]}
          </Animated.Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowEffect: {
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 8,
  },
  innerCircle: {
    backgroundColor: "#0f172a", // slate-900
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#fff",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
});
