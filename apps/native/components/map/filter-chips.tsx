import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";
import { lightHaptic } from "@/lib/haptics";

export type FilterMode = "on_route" | "nearby" | "all";

type FilterChipsProps = {
  activeFilter: FilterMode;
  onFilterChange: (filter: FilterMode) => void;
  onRouteCount?: number;
  nearbyCount?: number;
  totalCount?: number;
};

type ChipConfig = {
  id: FilterMode;
  label: string;
  count?: number;
};

export function FilterChips({
  activeFilter,
  onFilterChange,
  onRouteCount = 0,
  nearbyCount = 0,
  totalCount = 0,
}: FilterChipsProps) {
  const chips: ChipConfig[] = [
    { id: "on_route", label: "On My Route", count: onRouteCount },
    { id: "nearby", label: "Nearby", count: nearbyCount },
    { id: "all", label: "All", count: totalCount },
  ];

  return (
    <BlurView
      intensity={Platform.OS === "ios" ? 80 : 100}
      tint="light"
      style={styles.container}
    >
      <View style={styles.chipsRow}>
        {chips.map((chip) => (
          <FilterChip
            key={chip.id}
            {...chip}
            isActive={activeFilter === chip.id}
            onPress={() => {
              lightHaptic();
              onFilterChange(chip.id);
            }}
          />
        ))}
      </View>
    </BlurView>
  );
}

type FilterChipProps = {
  label: string;
  count?: number;
  isActive: boolean;
  onPress: () => void;
};

function FilterChip({ label, count, isActive, onPress }: FilterChipProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.chip, isActive && styles.chipActive]}
      >
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View
            style={[styles.badge, isActive && styles.badgeActive]}
          >
            <Text
              style={[styles.badgeText, isActive && styles.badgeTextActive]}
            >
              {count}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  chipActive: {
    backgroundColor: colors.brand.secondary,
    borderColor: colors.brand.secondary,
  },
  chipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.text.inverse,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border.light,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[2],
  },
  badgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
  },
  badgeTextActive: {
    color: colors.text.inverse,
  },
});
