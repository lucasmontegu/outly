import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
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
};

type RiskTimelineProps = {
  slots: TimeSlot[];
  onSlotPress?: (slot: TimeSlot) => void;
};

const COLORS = {
  low: colors.risk.low.primary,
  medium: colors.risk.medium.primary,
  high: colors.risk.high.primary,
};

const BG_COLORS = {
  low: colors.risk.low.light,
  medium: colors.risk.medium.light,
  high: colors.risk.high.light,
};

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
          <Animated.View
            key={slot.time}
            entering={FadeInRight.duration(300).delay(index * 50)}
          >
            <TouchableOpacity
              style={[
                styles.slot,
                slot.isNow && styles.slotNow,
                slot.isOptimal && styles.slotOptimal,
              ]}
              onPress={() => {
                lightHaptic();
                onSlotPress?.(slot);
              }}
              activeOpacity={0.7}
              accessibilityLabel={`${slot.label}: Risk score ${slot.score}, ${slot.classification} risk`}
            >
              {/* Time Label */}
              <Text style={[styles.timeLabel, slot.isNow && styles.timeLabelNow]}>
                {slot.isNow ? "NOW" : slot.label}
              </Text>

              {/* Risk Indicator */}
              <View
                style={[
                  styles.riskIndicator,
                  { backgroundColor: BG_COLORS[slot.classification] },
                ]}
              >
                <View
                  style={[
                    styles.riskDot,
                    { backgroundColor: COLORS[slot.classification] },
                  ]}
                />
              </View>

              {/* Score */}
              <Text
                style={[
                  styles.scoreText,
                  { color: COLORS[slot.classification] },
                ]}
              >
                {slot.score}
              </Text>

              {/* Optimal Badge */}
              {slot.isOptimal && (
                <View style={styles.optimalBadge}>
                  <Text style={styles.optimalText}>BEST</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.low }]} />
          <Text style={styles.legendText}>Low</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.medium }]} />
          <Text style={styles.legendText}>Medium</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.high }]} />
          <Text style={styles.legendText}>High</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[6],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[6],
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
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  slot: {
    width: 64,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.slate[50],
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  slotNow: {
    backgroundColor: colors.slate[100],
    borderColor: colors.slate[300],
  },
  slotOptimal: {
    borderColor: colors.risk.low.primary,
    backgroundColor: colors.risk.low.light,
  },
  timeLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  timeLabelNow: {
    color: colors.text.primary,
    fontWeight: typography.weight.bold,
  },
  riskIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  optimalBadge: {
    position: "absolute",
    top: -8,
    backgroundColor: colors.risk.low.primary,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  optimalText: {
    fontSize: 9,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing[4],
    gap: spacing[6],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
});
