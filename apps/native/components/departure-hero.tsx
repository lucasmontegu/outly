import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { riskLevelHaptic } from "@/lib/haptics";
import { colors, spacing, typography } from "@/lib/design-tokens";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Classification = "low" | "medium" | "high";

type DepartureHeroProps = {
  optimalDepartureMinutes: number;
  optimalTime: string;
  classification: Classification;
  currentScore: number;
  reason: string;
  isOptimalNow: boolean;
};

const COLORS = {
  low: colors.risk.low.primary,
  medium: colors.risk.medium.primary,
  high: colors.risk.high.primary,
};

// Gauge dimensions
const GAUGE_SIZE = 200;
const STROKE_WIDTH = 10;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CENTER = GAUGE_SIZE / 2;

// Semi-ring gauge with indicator dot
type GaugeProps = {
  score: number;
  classification: Classification;
};

function AnimatedGauge({ score, classification }: GaugeProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  // Arc from 135° to 405° (225° sweep = 62.5% of circle, leaving bottom open)
  // This creates a gauge that opens at the bottom
  const startAngle = 135;
  const endAngle = 405;
  const sweepAngle = endAngle - startAngle; // 270 degrees

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: CENTER + RADIUS * Math.cos(rad),
      y: CENTER + RADIUS * Math.sin(rad),
    };
  };

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);

  // Track path (full arc)
  const trackPath = `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 1 1 ${end.x} ${end.y}`;

  // Animated progress arc
  const animatedPathProps = useAnimatedProps(() => {
    const currentAngle = startAngle + sweepAngle * progress.value;
    const rad = (currentAngle * Math.PI) / 180;
    const endX = CENTER + RADIUS * Math.cos(rad);
    const endY = CENTER + RADIUS * Math.sin(rad);

    const largeArc = progress.value > 0.5 ? 1 : 0;

    return {
      d: progress.value > 0.01
        ? `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endX} ${endY}`
        : "",
    };
  });

  // Animated indicator dot position
  const animatedDotProps = useAnimatedProps(() => {
    const currentAngle = startAngle + sweepAngle * progress.value;
    const rad = (currentAngle * Math.PI) / 180;
    return {
      cx: CENTER + RADIUS * Math.cos(rad),
      cy: CENTER + RADIUS * Math.sin(rad),
    };
  });

  return (
    <Svg width={GAUGE_SIZE} height={GAUGE_SIZE * 0.65} viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE * 0.75}`}>
      {/* Track */}
      <Path
        d={trackPath}
        stroke={colors.slate[200]}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        fill="none"
      />
      {/* Progress */}
      <AnimatedPath
        animatedProps={animatedPathProps}
        stroke={COLORS[classification]}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        fill="none"
      />
      {/* Indicator dot */}
      <AnimatedCircle
        animatedProps={animatedDotProps}
        r={7}
        fill={COLORS[classification]}
        stroke="#FFFFFF"
        strokeWidth={3}
      />
    </Svg>
  );
}

export function DepartureHero({
  optimalDepartureMinutes,
  optimalTime,
  classification,
  currentScore,
  reason,
  isOptimalNow,
}: DepartureHeroProps) {
  const pulseScale = useSharedValue(1);

  // Pulse animation for "Leave Now"
  useEffect(() => {
    if (isOptimalNow) {
      pulseScale.value = withSequence(
        withSpring(1.02, { damping: 10 }),
        withSpring(1, { damping: 15 })
      );
    }
    riskLevelHaptic(classification);
  }, [isOptimalNow, classification]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

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
      <Animated.View style={[styles.heroContainer, containerStyle]}>
        {/* Gauge arc behind content */}
        <View style={styles.gaugeWrapper}>
          <AnimatedGauge score={currentScore} classification={classification} />
        </View>

        {/* Content centered inside gauge */}
        <View style={styles.contentArea}>
          <Text style={styles.topText}>{message.top}</Text>
          <Text style={[styles.mainText, { color: COLORS[classification] }]}>
            {message.bottom}
          </Text>
          <Text style={styles.scoreNumber}>{currentScore}</Text>
          <Text style={styles.timeText}>
            {isOptimalNow ? "Conditions are optimal" : `Best at ${optimalTime}`}
          </Text>
        </View>
      </Animated.View>

      {/* Reason */}
      <Text style={styles.reasonText}>{reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  heroContainer: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE * 0.65,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  gaugeWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  contentArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing[6],
  },
  topText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.tertiary,
    letterSpacing: typography.tracking.wider,
  },
  mainText: {
    fontSize: 36,
    fontWeight: typography.weight.extrabold,
    letterSpacing: typography.tracking.tight,
    marginTop: spacing[1],
  },
  scoreNumber: {
    fontSize: typography.size["5xl"],
    fontWeight: typography.weight.bold,
    fontFamily: "JetBrainsMono_700Bold",
    color: colors.text.primary,
    marginTop: spacing[1],
  },
  timeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginTop: spacing[2],
  },
  reasonText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing[8],
    marginTop: spacing[4],
  },
});
