import React from "react";
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  Easing,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  GridViewIcon,
  MapsIcon,
  BookmarkIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { colors } from "@/lib/design-tokens";
import { lightHaptic } from "@/lib/haptics";

const { width } = Dimensions.get("window");
const TAB_BAR_WIDTH = width - 48; // 24px margin on each side
const TAB_COUNT = 4;
const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;
const INDICATOR_WIDTH = TAB_WIDTH - 16;

interface CustomTabBarProps {
  state: any;
  navigation: any;
}

const TABS = [
  { name: "index", label: "Overview", icon: GridViewIcon },
  { name: "map", label: "Map", icon: MapsIcon },
  { name: "saved", label: "Saved", icon: BookmarkIcon },
  { name: "settings", label: "Settings", icon: Settings02Icon },
];

export function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const indicatorPosition = useSharedValue(0);
  const isMapTab = state.index === 1; // Map tab is at index 1

  // Create scale shared values for each tab's bounce animation
  const scales = [
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
  ];

  React.useEffect(() => {
    indicatorPosition.value = withTiming(
      state.index * TAB_WIDTH + 8,
      { duration: 200, easing: Easing.out(Easing.cubic) }
    );
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
  }));

  return (
    <View style={[
      styles.container,
      { paddingBottom: isMapTab ? insets.bottom : insets.bottom - 18 },
      isMapTab && styles.containerGrounded,
    ]}>
      <View style={[styles.blurContainer, isMapTab && styles.blurContainerGrounded]}>
        {/* Background overlay for Android */}
        {Platform.OS === 'android' && (
          <View style={styles.androidBackground} />
        )}

        {/* Animated Pill Indicator */}
        <Animated.View style={[styles.indicator, indicatorStyle]} />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab, index) => {
            const isFocused = state.index === index;
            const route = state.routes[index];

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                // Trigger haptic feedback
                lightHaptic();

                // Trigger bounce animation
                scales[index].value = withSequence(
                  withSpring(1.15, { damping: 12, stiffness: 500 }),
                  withSpring(1, { damping: 15, stiffness: 400 })
                );

                navigation.navigate(route.name);
              }
            };

            // Animated style for icon bounce
            const iconStyle = useAnimatedStyle(() => ({
              transform: [{ scale: scales[index].value }],
            }));

            return (
              <TouchableOpacity
                key={tab.name}
                onPress={onPress}
                style={styles.tab}
                accessibilityRole="button"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={tab.label}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <Animated.View style={iconStyle}>
                    <HugeiconsIcon
                      icon={tab.icon}
                      size={24}
                      color={isFocused ? colors.brand.secondary : colors.slate[400]}
                    />
                  </Animated.View>
                  <Animated.Text
                    style={[
                      styles.label,
                      isFocused && styles.labelActive,
                    ]}
                  >
                    {tab.label}
                  </Animated.Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 8,
    left: 16,
    right: 16,
  },
  containerGrounded: {
    bottom: 0,
    left: 0,
    right: 0,
  },
  blurContainer: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  blurContainerGrounded: {
    borderRadius: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  androidBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  indicator: {
    position: "absolute",
    top: 8,
    width: INDICATOR_WIDTH,
    height: 56,
    backgroundColor: colors.brand.secondary,
    opacity: 0.08,
    borderRadius: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 56,
  },
  tabContent: {
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.slate[400],
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.brand.secondary,
    fontWeight: "600",
  },
});
