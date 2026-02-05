import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CloudIcon, Car01Icon } from "@hugeicons/core-free-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Card } from "heroui-native";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

type ConditionCardsProps = {
  weather: {
    status: string; // "Clear", "Rain", "Storm"
    detail: string; // Actionable detail like "Heavy rain until 6:40 PM - reduce speed"
    score: number;
    trend?: 'improving' | 'worsening' | 'stable'; // NEW
  };
  traffic: {
    status: string; // "Flowing", "Moderate", "Congested"
    detail: string; // Actionable detail like "Accident cleared - delays easing"
    score: number;
    trend?: 'improving' | 'worsening' | 'stable'; // NEW
  };
};

function getStatusColor(score: number): string {
  if (score <= 30) return colors.risk.low.primary;
  if (score <= 60) return colors.risk.medium.primary;
  return colors.risk.high.primary;
}

function getStatusBg(score: number): string {
  if (score <= 30) return colors.risk.low.light;
  if (score <= 60) return colors.risk.medium.light;
  return colors.risk.high.light;
}

function getTrendIcon(trend?: 'improving' | 'worsening' | 'stable'): string {
  if (trend === 'improving') return '↓';
  if (trend === 'worsening') return '↑';
  if (trend === 'stable') return '→';
  return '';
}

function getTrendColor(trend?: 'improving' | 'worsening' | 'stable'): string {
  if (trend === 'improving') return colors.risk.low.primary;
  if (trend === 'worsening') return colors.risk.high.primary;
  if (trend === 'stable') return colors.text.tertiary;
  return colors.text.tertiary;
}

export function ConditionCards({ weather, traffic }: ConditionCardsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How It Affects You</Text>
      </View>

      <View style={styles.cardsRow}>
        {/* Weather Card */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(100)}
          style={styles.cardWrapper}
        >
          <Card style={[styles.card, { borderLeftWidth: 3, borderLeftColor: getStatusColor(weather.score) }]}>
            <Card.Body style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: getStatusBg(weather.score) },
                  ]}
                >
                  <HugeiconsIcon
                    icon={CloudIcon}
                    size={22}
                    color={getStatusColor(weather.score)}
                  />
                </View>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBg(weather.score) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: getStatusColor(weather.score) },
                      ]}
                    >
                      {weather.score}
                    </Text>
                  </View>
                  {weather.trend && (
                    <Text
                      style={[
                        styles.trendIndicator,
                        { color: getTrendColor(weather.trend) },
                      ]}
                    >
                      {getTrendIcon(weather.trend)}
                    </Text>
                  )}
                </View>
              </View>

              <Text style={styles.cardLabel}>DRIVE CONDITIONS</Text>
              <Text style={styles.cardStatus}>{weather.status}</Text>
              <Text style={styles.cardDetail} numberOfLines={2}>
                {weather.detail}
              </Text>
            </Card.Body>
          </Card>
        </Animated.View>

        {/* Traffic Card */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(200)}
          style={styles.cardWrapper}
        >
          <Card style={[styles.card, { borderLeftWidth: 3, borderLeftColor: getStatusColor(traffic.score) }]}>
            <Card.Body style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: getStatusBg(traffic.score) },
                  ]}
                >
                  <HugeiconsIcon
                    icon={Car01Icon}
                    size={22}
                    color={getStatusColor(traffic.score)}
                  />
                </View>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBg(traffic.score) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: getStatusColor(traffic.score) },
                      ]}
                    >
                      {traffic.score}
                    </Text>
                  </View>
                  {traffic.trend && (
                    <Text
                      style={[
                        styles.trendIndicator,
                        { color: getTrendColor(traffic.trend) },
                      ]}
                    >
                      {getTrendIcon(traffic.trend)}
                    </Text>
                  )}
                </View>
              </View>

              <Text style={styles.cardLabel}>ROAD STATUS</Text>
              <Text style={styles.cardStatus}>{traffic.status}</Text>
              <Text style={styles.cardDetail} numberOfLines={2}>
                {traffic.detail}
              </Text>
            </Card.Body>
          </Card>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    paddingHorizontal: 0,
  },
  header: {
    marginBottom: spacing[3],
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  cardsRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  cardBody: {
    padding: spacing[4],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[3],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
  statusBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  trendIndicator: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    lineHeight: 20,
  },
  cardLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    letterSpacing: typography.tracking.wide,
  },
  cardStatus: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginTop: spacing[1],
  },
  cardDetail: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing[1],
    lineHeight: 18,
  },
});
