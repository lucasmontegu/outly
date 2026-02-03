import React, { useCallback } from "react";
import { Pressable, PressableProps, ViewStyle, StyleProp, AccessibilityInfo } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  useReducedMotion,
} from "react-native-reanimated";
import { lightHaptic, mediumHaptic } from "@/lib/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HapticType = "none" | "light" | "medium";

interface AnimatedPressableButtonProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Scale when pressed (0.95 = 5% smaller). Default: 0.97
   */
  pressScale?: number;
  /**
   * Whether to animate opacity on press. Default: true
   */
  animateOpacity?: boolean;
  /**
   * Haptic feedback type. Default: "light"
   */
  haptic?: HapticType;
  /**
   * Spring stiffness. Higher = snappier. Default: 400
   */
  springStiffness?: number;
  /**
   * Spring damping. Lower = more bounce. Default: 20
   */
  springDamping?: number;
  /**
   * Disable all animations (for reduced motion preference)
   */
  disableAnimations?: boolean;
}

/**
 * AnimatedPressable - A pressable component with spring animations and haptic feedback.
 *
 * Use this instead of TouchableOpacity/Pressable for a more polished feel.
 * The spring animation provides natural physics-based feedback.
 */
export function AnimatedPressableButton({
  children,
  style,
  pressScale = 0.97,
  animateOpacity = true,
  haptic = "light",
  springStiffness = 400,
  springDamping = 20,
  disableAnimations = false,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: AnimatedPressableButtonProps) {
  const pressed = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const shouldDisableAnimations = disableAnimations || reducedMotion;

  const triggerHaptic = useCallback(() => {
    if (haptic === "light") {
      lightHaptic();
    } else if (haptic === "medium") {
      mediumHaptic();
    }
  }, [haptic]);

  const handlePressIn = useCallback(
    (e: any) => {
      if (shouldDisableAnimations) {
        onPressIn?.(e);
        return;
      }
      pressed.value = withSpring(1, {
        stiffness: springStiffness,
        damping: springDamping,
      });
      if (haptic !== "none") {
        runOnJS(triggerHaptic)();
      }
      onPressIn?.(e);
    },
    [shouldDisableAnimations, springStiffness, springDamping, haptic, onPressIn, triggerHaptic]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      if (shouldDisableAnimations) {
        onPressOut?.(e);
        return;
      }
      pressed.value = withSpring(0, {
        stiffness: springStiffness,
        damping: springDamping,
      });
      onPressOut?.(e);
    },
    [shouldDisableAnimations, springStiffness, springDamping, onPressOut]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (shouldDisableAnimations) {
      return {};
    }

    const scale = interpolate(pressed.value, [0, 1], [1, pressScale]);
    const opacity = animateOpacity
      ? interpolate(pressed.value, [0, 1], [1, 0.9])
      : 1;

    return {
      transform: [{ scale }],
      opacity,
    };
  }, [shouldDisableAnimations, pressScale, animateOpacity]);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      style={[style, animatedStyle, disabled && { opacity: 0.5 }]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

/**
 * AnimatedIconButton - Specialized for icon buttons (like header actions)
 * Uses subtle scale + rotation for a polished micro-interaction
 */
interface AnimatedIconButtonProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: HapticType;
}

export function AnimatedIconButton({
  children,
  style,
  haptic = "light",
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedIconButtonProps) {
  const pressed = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (haptic === "light") {
      lightHaptic();
    } else if (haptic === "medium") {
      mediumHaptic();
    }
  }, [haptic]);

  const handlePressIn = useCallback(
    (e: any) => {
      pressed.value = withSpring(1, { stiffness: 500, damping: 15 });
      if (haptic !== "none") {
        runOnJS(triggerHaptic)();
      }
      onPressIn?.(e);
    },
    [haptic, onPressIn, triggerHaptic]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      pressed.value = withSpring(0, { stiffness: 500, damping: 15 });
      onPressOut?.(e);
    },
    [onPressOut]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.85]);
    const rotate = interpolate(pressed.value, [0, 1], [0, -5]);

    return {
      transform: [{ scale }, { rotate: `${rotate}deg` }],
    };
  });

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

/**
 * AnimatedCard - For card components that lift on press
 * Adds subtle elevation change and scale for depth effect
 */
interface AnimatedCardProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: HapticType;
}

export function AnimatedCard({
  children,
  style,
  haptic = "light",
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedCardProps) {
  const pressed = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (haptic === "light") {
      lightHaptic();
    } else if (haptic === "medium") {
      mediumHaptic();
    }
  }, [haptic]);

  const handlePressIn = useCallback(
    (e: any) => {
      pressed.value = withSpring(1, { stiffness: 300, damping: 20 });
      if (haptic !== "none") {
        runOnJS(triggerHaptic)();
      }
      onPressIn?.(e);
    },
    [haptic, onPressIn, triggerHaptic]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      pressed.value = withSpring(0, { stiffness: 300, damping: 20 });
      onPressOut?.(e);
    },
    [onPressOut]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.98]);
    const translateY = interpolate(pressed.value, [0, 1], [0, 2]);

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
