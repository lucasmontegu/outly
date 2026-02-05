import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";
import { lightHaptic } from "@/lib/haptics";

type Classification = "low" | "medium" | "high";

type TimeSlot = {
  time: string; // e.g., "6:30"
  label: string; // e.g., "NOW" or "6:30 PM"
  score: number;
  classification: Classification;
  isNow?: boolean;
  isOptimal?: boolean;
};

type RiskTimelineProps = {
  slots: TimeSlot[];
  onSlotPress?: (slot: TimeSlot) => void;
};

// Use the brand's existing risk colors from design tokens
const RISK_COLORS = {
  low: colors.risk.low.primary,
  medium: colors.risk.medium.primary,
  high: colors.risk.high.primary,
};

type TimeSlotCardProps = {
  slot: TimeSlot;
  index: number;
  onPress?: (slot: TimeSlot) => void;
};

function TimeSlotCard({ slot, index, onPress }: TimeSlotCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 18,
      stiffness: 500,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePress = () => {
    lightHaptic();
    onPress?.(slot);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 80)}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[
          styles.slotCard,
          slot.isOptimal && styles.slotOptimal,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1}
        accessibilityLabel={`${slot.label}: Risk score ${slot.score}, ${slot.classification} risk`}
      >
        {/* Time Label */}
        <Text style={[styles.timeLabel, slot.isNow && styles.timeLabelNow]}>
          {slot.isNow ? "NOW" : slot.label}
        </Text>

        {/* Risk indicator dot */}
{/*         <View
          style={[
            styles.riskIndicator,
            { backgroundColor: RISK_COLORS[slot.classification] },
          ]}
        /> */}

        {/* Score Number */}
        <Text
          style={[
            styles.scoreText,
            { color: RISK_COLORS[slot.classification] },
          ]}
        >
          {slot.score}
        </Text>

      </TouchableOpacity>
    </Animated.View>
  );
}

export function RiskTimeline({ slots, onSlotPress }: RiskTimelineProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Next 2 Hours</Text>
        <Text style={styles.subtitle}>Tap for details</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {slots.map((slot, index) => (
          <TimeSlotCard
            key={slot.time}
            slot={slot}
            index={index}
            onPress={onSlotPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 0,
    marginBottom: spacing[3],
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: spacing[3],
  },
  slotCard: {
    width: 72,
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    // Subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  slotOptimal: {
    borderColor: colors.brand.secondary,
    borderWidth: 2,
    backgroundColor: "#F8F7FF", // Very subtle brand tint
  },
  timeLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[2],
    letterSpacing: typography.tracking.wide,
  },
  timeLabelNow: {
    color: colors.brand.secondary,
    fontWeight: typography.weight.bold,
  },
  riskIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: spacing[2],
  },
  scoreText: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    fontFamily: "JetBrainsMono_700Bold",
  },
});
