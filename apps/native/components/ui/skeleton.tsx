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
  borderRadius = 8,
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
          borderRadius,
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
  borderRadius = 8,
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
        { width, height, borderRadius },
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
  spacing = 8,
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
          style={{ marginBottom: index < lines - 1 ? spacing : 0 }}
        />
      ))}
    </View>
  );
}

// ============================================================
// Composite Skeletons for Outly-specific components
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
          <Skeleton width={80} height={48} borderRadius={8} />
          <Skeleton width={60} height={20} borderRadius={4} style={{ marginTop: 8 }} />
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
      <Skeleton width={60} height={10} borderRadius={4} style={{ marginTop: 12 }} />
      <Skeleton width={80} height={18} borderRadius={4} style={{ marginTop: 4 }} />
      <Skeleton width={100} height={12} borderRadius={4} style={{ marginTop: 2 }} />
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
        <Skeleton width="70%" height={16} borderRadius={4} />
        <Skeleton width="50%" height={13} borderRadius={4} style={{ marginTop: 4 }} />
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
        <Skeleton width="60%" height={16} borderRadius={4} />
        <Skeleton width="80%" height={13} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
      <Skeleton width={60} height={24} borderRadius={6} />
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
        <Skeleton width="50%" height={16} borderRadius={4} />
        <Skeleton width="70%" height={14} borderRadius={4} style={{ marginTop: 2 }} />
      </View>
      <SkeletonCircle size={44} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E5E7EB",
  },
  shimmerContainer: {
    backgroundColor: "#E5E7EB",
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
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  riskCircleInner: {
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  // Data Card
  dataCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
  },
  // Event Card
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  eventCardContent: {
    flex: 1,
  },
  // Route Card
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    gap: 12,
  },
  routeCardContent: {
    flex: 1,
  },
  // Location Card
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  locationCardContent: {
    flex: 1,
  },
});
