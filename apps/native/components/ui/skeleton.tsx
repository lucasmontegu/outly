import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, borderRadius } from "@/lib/design-tokens";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Skeleton - A shimmer loading placeholder
 *
 * Uses a subtle pulse animation with opacity changes.
 * For a more performant alternative to full shimmer gradients.
 */
export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius: borderRadiusProp = borderRadius.md,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // infinite
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: borderRadiusProp,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/**
 * ShimmerSkeleton - A gradient shimmer effect skeleton
 *
 * More visually appealing but slightly more expensive.
 * Use for prominent loading states.
 */
export function ShimmerSkeleton({
  width = "100%",
  height = 20,
  borderRadius: borderRadiusProp = borderRadius.md,
  style,
}: SkeletonProps) {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(translateX.value, [-1, 1], [-200, 200]) }],
  }));

  return (
    <View
      style={[
        styles.shimmerContainer,
        { width, height, borderRadius: borderRadiusProp },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerGradient, animatedStyle]}>
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.3)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/**
 * SkeletonCircle - Circular skeleton for avatars/icons
 */
export function SkeletonCircle({ size = 48, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;
}

/**
 * SkeletonText - Multiple lines of text skeleton
 */
export function SkeletonText({
  lines = 3,
  lineHeight = 16,
  spacing: spacingValue = spacing[2],
  lastLineWidth = "60%" as const,
  style,
}: {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  lastLineWidth?: number | `${number}%`;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : "100%"}
          style={{ marginBottom: index < lines - 1 ? spacingValue : 0 }}
        />
      ))}
    </View>
  );
}

// ============================================================
// Composite Skeletons for Outia-specific components
// ============================================================

/**
 * RiskCircleSkeleton - Loading state for the main risk score circle
 */
export function RiskCircleSkeleton({ size = 200 }: { size?: number }) {
  const pulse = useSharedValue(0.6);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View style={[styles.riskCircleContainer, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.riskCircleOuter,
          { width: size, height: size, borderRadius: size / 2 },
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.riskCircleInner,
            {
              width: size * 0.85,
              height: size * 0.85,
              borderRadius: (size * 0.85) / 2,
            },
          ]}
        >
          <Skeleton width={80} height={48} borderRadius={borderRadius.md} />
          <Skeleton width={60} height={20} borderRadius={borderRadius.sm} style={{ marginTop: spacing[2] }} />
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * DataCardSkeleton - Loading state for weather/traffic cards
 */
export function DataCardSkeleton() {
  return (
    <View style={styles.dataCard}>
      <SkeletonCircle size={40} />
      <Skeleton width={60} height={10} borderRadius={borderRadius.sm} style={{ marginTop: spacing[3] }} />
      <Skeleton width={80} height={18} borderRadius={borderRadius.sm} style={{ marginTop: spacing[1] }} />
      <Skeleton width={100} height={12} borderRadius={borderRadius.sm} style={{ marginTop: spacing[1] / 2 }} />
    </View>
  );
}

/**
 * EventCardSkeleton - Loading state for event/signal cards
 */
export function EventCardSkeleton() {
  return (
    <View style={styles.eventCard}>
      <SkeletonCircle size={48} />
      <View style={styles.eventCardContent}>
        <Skeleton width="70%" height={16} borderRadius={borderRadius.sm} />
        <Skeleton width="50%" height={13} borderRadius={borderRadius.sm} style={{ marginTop: spacing[1] }} />
      </View>
      <SkeletonCircle size={32} />
    </View>
  );
}

/**
 * RouteCardSkeleton - Loading state for route cards
 */
export function RouteCardSkeleton() {
  return (
    <View style={styles.routeCard}>
      <SkeletonCircle size={44} />
      <View style={styles.routeCardContent}>
        <Skeleton width="60%" height={16} borderRadius={borderRadius.sm} />
        <Skeleton width="80%" height={13} borderRadius={borderRadius.sm} style={{ marginTop: spacing[1] }} />
      </View>
      <Skeleton width={60} height={24} borderRadius={borderRadius.sm} />
    </View>
  );
}

/**
 * LocationCardSkeleton - Loading state for location cards
 */
export function LocationCardSkeleton() {
  return (
    <View style={styles.locationCard}>
      <SkeletonCircle size={40} />
      <View style={styles.locationCardContent}>
        <Skeleton width="50%" height={16} borderRadius={borderRadius.sm} />
        <Skeleton width="70%" height={14} borderRadius={borderRadius.sm} style={{ marginTop: spacing[1] / 2 }} />
      </View>
      <SkeletonCircle size={44} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border.light,
  },
  shimmerContainer: {
    backgroundColor: colors.border.light,
    overflow: "hidden",
  },
  shimmerGradient: {
    ...StyleSheet.absoluteFillObject,
    width: 200,
  },
  textContainer: {
    width: "100%",
  },
  // Risk Circle
  riskCircleContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  riskCircleOuter: {
    backgroundColor: colors.border.light,
    alignItems: "center",
    justifyContent: "center",
  },
  riskCircleInner: {
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  // Data Card
  dataCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  // Event Card
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing[4],
    marginBottom: spacing[2],
    gap: spacing[3],
  },
  eventCardContent: {
    flex: 1,
  },
  // Route Card
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing[4],
    gap: spacing[3],
  },
  routeCardContent: {
    flex: 1,
  },
  // Location Card
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate[800],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  locationCardContent: {
    flex: 1,
  },
});
