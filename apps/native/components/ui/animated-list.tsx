import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  FadeOutUp,
  SlideInRight,
  SlideOutRight,
  SlideInLeft,
  SlideOutLeft,
  ZoomIn,
  ZoomOut,
  Layout,
  LinearTransition,
  SequencedTransition,
  withDelay,
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

// ============================================================
// Entering/Exiting Animations
// ============================================================

/**
 * Pre-configured entering animations for list items
 * Use with Reanimated's entering prop
 */
export const entering = {
  // Fade animations
  fade: FadeIn.duration(300),
  fadeDown: FadeInDown.duration(300).springify().damping(20),
  fadeUp: FadeInUp.duration(300).springify().damping(20),

  // Slide animations
  slideRight: SlideInRight.duration(300).springify().damping(20),
  slideLeft: SlideInLeft.duration(300).springify().damping(20),

  // Zoom
  zoom: ZoomIn.duration(250).springify().damping(15),

  // Staggered fade (for lists)
  staggeredFade: (index: number) =>
    FadeInDown.delay(index * 50).duration(300).springify().damping(20),

  // Staggered slide (for lists)
  staggeredSlide: (index: number) =>
    SlideInRight.delay(index * 50).duration(300).springify().damping(20),
};

/**
 * Pre-configured exiting animations
 * Use with Reanimated's exiting prop
 */
export const exiting = {
  fade: FadeOut.duration(200),
  fadeDown: FadeOutDown.duration(200),
  fadeUp: FadeOutUp.duration(200),
  slideRight: SlideOutRight.duration(200),
  slideLeft: SlideOutLeft.duration(200),
  zoom: ZoomOut.duration(150),
};

/**
 * Pre-configured layout animations
 * Use with Reanimated's layout prop
 */
export const layout = {
  spring: Layout.springify().damping(20).stiffness(200),
  linear: LinearTransition.duration(200),
  sequenced: SequencedTransition.duration(300),
};

// ============================================================
// Animated List Item Component
// ============================================================

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  style?: StyleProp<ViewStyle>;
  /**
   * Animation type for entering
   */
  animationType?: "fade" | "slide" | "zoom";
  /**
   * Delay multiplier between items in ms. Default: 50
   */
  staggerDelay?: number;
  /**
   * Whether to animate layout changes. Default: true
   */
  animateLayout?: boolean;
}

/**
 * AnimatedListItem - Wraps list items with staggered enter/exit animations
 *
 * Usage:
 * ```tsx
 * {items.map((item, index) => (
 *   <AnimatedListItem key={item.id} index={index}>
 *     <YourItemComponent {...item} />
 *   </AnimatedListItem>
 * ))}
 * ```
 */
export function AnimatedListItem({
  children,
  index,
  style,
  animationType = "fade",
  staggerDelay = 50,
  animateLayout = true,
}: AnimatedListItemProps) {
  const getEntering = () => {
    const delay = index * staggerDelay;
    switch (animationType) {
      case "slide":
        return SlideInRight.delay(delay).duration(300).springify().damping(20);
      case "zoom":
        return ZoomIn.delay(delay).duration(250).springify().damping(15);
      case "fade":
      default:
        return FadeInDown.delay(delay).duration(300).springify().damping(20);
    }
  };

  const getExiting = () => {
    switch (animationType) {
      case "slide":
        return SlideOutRight.duration(200);
      case "zoom":
        return ZoomOut.duration(150);
      case "fade":
      default:
        return FadeOut.duration(200);
    }
  };

  return (
    <Animated.View
      entering={getEntering()}
      exiting={getExiting()}
      layout={animateLayout ? Layout.springify().damping(20) : undefined}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

// ============================================================
// Animated Section Component
// ============================================================

interface AnimatedSectionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Delay before animation starts in ms. Default: 0
   */
  delay?: number;
}

/**
 * AnimatedSection - Animates entire sections with fade-in effect
 *
 * Useful for header sections, action areas, etc.
 */
export function AnimatedSection({
  children,
  style,
  delay = 0,
}: AnimatedSectionProps) {
  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(400)}
      exiting={FadeOut.duration(200)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

// ============================================================
// Pull to Refresh Animation Hook
// ============================================================

interface UsePullAnimationReturn {
  animatedStyle: ViewStyle;
  onScroll: (offset: number) => void;
}

/**
 * usePullAnimation - Creates a pull-down animation effect
 *
 * Use for custom pull-to-refresh indicators
 */
export function usePullAnimation(): UsePullAnimationReturn {
  const pullOffset = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pullOffset.value,
      [0, 100],
      [0.5, 1],
      Extrapolation.CLAMP
    );
    const rotate = interpolate(
      pullOffset.value,
      [0, 100],
      [0, 360],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { scale },
        { rotate: `${rotate}deg` },
      ],
      opacity: interpolate(
        pullOffset.value,
        [0, 50, 100],
        [0, 0.5, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  const onScroll = (offset: number) => {
    pullOffset.value = Math.max(0, -offset);
  };

  return { animatedStyle, onScroll };
}

// ============================================================
// Expandable Animation Hook
// ============================================================

interface UseExpandAnimationReturn {
  animatedStyle: ViewStyle;
  toggle: () => void;
  isExpanded: boolean;
}

/**
 * useExpandAnimation - Creates expand/collapse animation
 *
 * Use for accordion-style components
 */
export function useExpandAnimation(
  initialExpanded = false
): UseExpandAnimationReturn {
  const expanded = useSharedValue(initialExpanded ? 1 : 0);
  const [isExpanded, setIsExpanded] = React.useState(initialExpanded);

  const toggle = () => {
    const newValue = expanded.value === 0 ? 1 : 0;
    expanded.value = withSpring(newValue, { damping: 20, stiffness: 200 });
    setIsExpanded(!isExpanded);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: expanded.value,
    transform: [
      { scaleY: expanded.value },
    ],
  }));

  return { animatedStyle, toggle, isExpanded };
}

// ============================================================
// Number Counting Animation
// ============================================================

/**
 * useCountAnimation - Animates number changes
 *
 * Use for scores, counts, statistics
 */
export function useCountAnimation(
  targetValue: number,
  duration = 500
): number {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    animatedValue.value = withTiming(targetValue, { duration }, () => {
      // This callback runs on UI thread, need to use runOnJS for state updates
    });

    // Update display value through regular timing
    const startValue = displayValue;
    const startTime = Date.now();

    const updateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(startValue + (targetValue - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };

    requestAnimationFrame(updateValue);
  }, [targetValue, duration]);

  return displayValue;
}
