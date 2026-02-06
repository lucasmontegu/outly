/**
 * Risk Semi-Ring Usage Examples
 *
 * This file demonstrates various ways to use the RiskSemiRing component
 * in the Outia mobile app.
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { RiskSemiRing } from "./risk-semi-ring";
import { colors, spacing, getRiskClassification, typography } from "@/lib/design-tokens";

// ============================================================================
// Example 1: Basic Integration in Dashboard
// ============================================================================
export function DashboardRiskDisplay() {
  const score = 65;
  const classification = getRiskClassification(score);

  return (
    <View style={styles.dashboardContainer}>
      <Text style={styles.sectionTitle}>Current Risk Level</Text>
      <RiskSemiRing
        score={score}
        classification={classification}
        size={220}
        strokeWidth={18}
      />
      <Text style={styles.helpText}>
        Based on current weather and traffic conditions
      </Text>
    </View>
  );
}

// ============================================================================
// Example 2: Compact Widget (smaller size, no label)
// ============================================================================
export function CompactRiskWidget() {
  const score = 42;
  const classification = getRiskClassification(score);

  return (
    <View style={styles.widgetContainer}>
      <RiskSemiRing
        score={score}
        classification={classification}
        size={160}
        strokeWidth={12}
        showLabel={false}
      />
    </View>
  );
}

// ============================================================================
// Example 3: Replacing RiskCircle in DepartureHero
// ============================================================================
export function DepartureHeroWithSemiRing({
  currentScore,
  classification,
  isOptimalNow,
  optimalTime,
  reason,
}: {
  currentScore: number;
  classification: "low" | "medium" | "high";
  isOptimalNow: boolean;
  optimalTime: string;
  reason: string;
}) {
  return (
    <View style={styles.heroContainer}>
      {/* Header */}
      <Text style={styles.heroTitle}>
        {isOptimalNow ? "Ready to Go!" : "Wait a bit..."}
      </Text>

      {/* Semi-Ring Risk Indicator */}
      <View style={styles.riskDisplay}>
        <RiskSemiRing
          score={currentScore}
          classification={classification}
          size={240}
          strokeWidth={20}
        />
      </View>

      {/* Departure Info */}
      <View style={styles.departureInfo}>
        {isOptimalNow ? (
          <Text style={styles.departureText}>
            Best time to leave is now
          </Text>
        ) : (
          <>
            <Text style={styles.departureLabel}>Optimal departure</Text>
            <Text style={styles.departureTime}>{optimalTime}</Text>
          </>
        )}
      </View>

      {/* Reason */}
      <Text style={styles.reasonText}>{reason}</Text>
    </View>
  );
}

// ============================================================================
// Example 4: Interactive Demo with Controls
// ============================================================================
export function InteractiveSemiRingDemo() {
  const [score, setScore] = useState(50);
  const classification = getRiskClassification(score);

  const increaseScore = () => setScore(Math.min(100, score + 10));
  const decreaseScore = () => setScore(Math.max(0, score - 10));

  return (
    <ScrollView style={styles.demoContainer}>
      <Text style={styles.demoTitle}>Risk Semi-Ring Demo</Text>

      {/* Semi-Ring Display */}
      <View style={styles.demoRingContainer}>
        <RiskSemiRing
          score={score}
          classification={classification}
          size={260}
          strokeWidth={22}
        />
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.decreaseButton]}
          onPress={decreaseScore}
          disabled={score === 0}
        >
          <Text style={styles.buttonText}>- 10</Text>
        </TouchableOpacity>

        <View style={styles.scoreInfo}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.increaseButton]}
          onPress={increaseScore}
          disabled={score === 100}
        >
          <Text style={styles.buttonText}>+ 10</Text>
        </TouchableOpacity>
      </View>

      {/* Classification Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Classification</Text>
        <Text style={[styles.infoValue, { color: colors.risk[classification].primary }]}>
          {classification.toUpperCase()}
        </Text>
      </View>

      {/* Preset Buttons */}
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsLabel}>Quick Presets:</Text>
        <View style={styles.presetsRow}>
          <TouchableOpacity
            style={[styles.presetButton, { backgroundColor: colors.risk.low.light }]}
            onPress={() => setScore(20)}
          >
            <Text style={[styles.presetText, { color: colors.risk.low.primary }]}>
              Low (20)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presetButton, { backgroundColor: colors.risk.medium.light }]}
            onPress={() => setScore(50)}
          >
            <Text style={[styles.presetText, { color: colors.risk.medium.primary }]}>
              Medium (50)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presetButton, { backgroundColor: colors.risk.high.light }]}
            onPress={() => setScore(85)}
          >
            <Text style={[styles.presetText, { color: colors.risk.high.primary }]}>
              High (85)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// ============================================================================
// Example 5: Side-by-Side Comparison (Old vs New)
// ============================================================================
export function ComparisonView() {
  const score = 72;
  const classification = getRiskClassification(score);

  return (
    <View style={styles.comparisonContainer}>
      <Text style={styles.comparisonTitle}>Design Comparison</Text>

      <View style={styles.comparisonRow}>
        {/* Old Design - Full Circle
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>Full Circle</Text>
          <RiskCircle
            score={score}
            classification={classification}
            size={200}
          />
        </View>
        */}

        {/* New Design - Semi Ring */}
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>Semi-Ring</Text>
          <RiskSemiRing
            score={score}
            classification={classification}
            size={200}
            strokeWidth={16}
          />
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Example 6: Multiple Sizes Showcase
// ============================================================================
export function SizeVariantsShowcase() {
  const score = 58;
  const classification = getRiskClassification(score);

  return (
    <View style={styles.showcaseContainer}>
      <Text style={styles.showcaseTitle}>Size Variants</Text>

      {/* Extra Large */}
      <View style={styles.showcaseItem}>
        <Text style={styles.showcaseLabel}>Extra Large (280px)</Text>
        <RiskSemiRing
          score={score}
          classification={classification}
          size={280}
          strokeWidth={24}
        />
      </View>

      {/* Large */}
      <View style={styles.showcaseItem}>
        <Text style={styles.showcaseLabel}>Large (220px)</Text>
        <RiskSemiRing
          score={score}
          classification={classification}
          size={220}
          strokeWidth={18}
        />
      </View>

      {/* Medium */}
      <View style={styles.showcaseItem}>
        <Text style={styles.showcaseLabel}>Medium (180px)</Text>
        <RiskSemiRing
          score={score}
          classification={classification}
          size={180}
          strokeWidth={14}
        />
      </View>

      {/* Small */}
      <View style={styles.showcaseItem}>
        <Text style={styles.showcaseLabel}>Small (140px)</Text>
        <RiskSemiRing
          score={score}
          classification={classification}
          size={140}
          strokeWidth={10}
          showLabel={false}
        />
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Dashboard Example
  dashboardContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 20,
    padding: spacing[6],
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  helpText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing[4],
    textAlign: "center",
  },

  // Widget Example
  widgetContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing[4],
    alignItems: "center",
  },

  // Hero Example
  heroContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 24,
    padding: spacing[6],
    alignItems: "center",
  },
  heroTitle: {
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  riskDisplay: {
    marginVertical: spacing[5],
  },
  departureInfo: {
    alignItems: "center",
    marginTop: spacing[4],
  },
  departureLabel: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  departureTime: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.brand.primary,
    marginTop: spacing[1],
  },
  departureText: {
    fontSize: typography.size.lg,
    color: colors.text.secondary,
  },
  reasonText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing[3],
  },

  // Interactive Demo
  demoContainer: {
    flex: 1,
    backgroundColor: colors.slate[50],
    padding: spacing[5],
  },
  demoTitle: {
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing[6],
  },
  demoRingContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 24,
    padding: spacing[6],
    alignItems: "center",
    marginBottom: spacing[5],
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background.card,
    borderRadius: 20,
    padding: spacing[5],
    marginBottom: spacing[4],
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  decreaseButton: {
    backgroundColor: colors.risk.low.primary,
  },
  increaseButton: {
    backgroundColor: colors.risk.high.primary,
  },
  buttonText: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  scoreInfo: {
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  },
  scoreValue: {
    fontSize: typography.size["4xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  infoCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing[5],
    alignItems: "center",
    marginBottom: spacing[4],
  },
  infoLabel: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginBottom: spacing[2],
  },
  infoValue: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
  },
  presetsContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing[5],
  },
  presetsLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  presetsRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  presetButton: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 12,
    alignItems: "center",
  },
  presetText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },

  // Comparison View
  comparisonContainer: {
    padding: spacing[5],
    backgroundColor: colors.slate[50],
  },
  comparisonTitle: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing[5],
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  comparisonItem: {
    alignItems: "center",
    backgroundColor: colors.background.card,
    borderRadius: 20,
    padding: spacing[5],
  },
  comparisonLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },

  // Size Showcase
  showcaseContainer: {
    padding: spacing[5],
    backgroundColor: colors.slate[50],
  },
  showcaseTitle: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing[5],
  },
  showcaseItem: {
    backgroundColor: colors.background.card,
    borderRadius: 20,
    padding: spacing[5],
    alignItems: "center",
    marginBottom: spacing[4],
  },
  showcaseLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
});
