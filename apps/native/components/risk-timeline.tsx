import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";
import { lightHaptic } from "@/lib/haptics";

type Classification = "low" | "medium" | "high";

type TimeSlot = {
  time: string; // e.g., "6:30"
  label: string; // e.g., "NOW" or "6:30 PM"
  score: number;
  classification: Classification;
  isNow?: boolean;
  isOptimal?: boolean;
  reason?: string; // NEW: brief explanation of why the score is what it is
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

  // Dynamic background tint based on classification
  const backgroundTint = `${RISK_COLORS[slot.classification]}08`;

  // Dynamic glow shadow for NOW chip
  const glowShadow = slot.isNow ? shadows.glow[slot.classification] : {};

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 80)}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[
          styles.slotCard,
          slot.isOptimal && styles.slotOptimal,
          { backgroundColor: backgroundTint },
          glowShadow,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1}
        accessibilityLabel={`${slot.label}: Risk score ${slot.score}, ${slot.classification} risk${slot.reason ? `, ${slot.reason}` : ""}`}
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

        {/* Reason Label - NEW */}
        {slot.reason && (
          <Text style={styles.reasonText} numberOfLines={2}>
            {slot.reason}
          </Text>
        )}

      </TouchableOpacity>
    </Animated.View>
  );
}

export function RiskTimeline({ slots, onSlotPress }: RiskTimelineProps) {
  // Find the optimal slot label for subtitle
  const optimalSlot = slots.find(slot => slot.isOptimal);
  const optimalLabel = optimalSlot ? optimalSlot.label : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Next 2 Hours</Text>
        {optimalLabel && (
          <Text style={styles.subtitle}>Best at {optimalLabel}</Text>
        )}
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
    width: 84,
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
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.bold,
    fontFamily: "JetBrainsMono_700Bold",
  },
  reasonText: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: spacing[1],
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 13,
  },
});
