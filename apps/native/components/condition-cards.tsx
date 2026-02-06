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

function getCardBackgroundTint(score: number, type: 'weather' | 'traffic'): string | undefined {
  if (score <= 30) return undefined;

  if (type === 'weather') {
    return `${colors.state.info}06`; // Very subtle blue tint
  } else {
    return `${colors.risk.medium.primary}06`; // Very subtle amber tint
  }
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
          <Card style={[
            styles.card,
            {
              borderLeftWidth: 3,
              borderLeftColor: getStatusColor(weather.score),
              backgroundColor: getCardBackgroundTint(weather.score, 'weather') || colors.background.card
            }
          ]}>
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

              <Text style={styles.cardLabel}>DRIVE CONDITIONS</Text>
              <View style={styles.statusRow}>
                <Text style={styles.cardStatus}>{weather.status}</Text>
                <View
                  style={[
                    styles.scorePill,
                    { backgroundColor: getStatusColor(weather.score) },
                  ]}
                >
                  <Text style={styles.scorePillText}>{weather.score}</Text>
                </View>
              </View>
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
          <Card style={[
            styles.card,
            {
              borderLeftWidth: 3,
              borderLeftColor: getStatusColor(traffic.score),
              backgroundColor: getCardBackgroundTint(traffic.score, 'traffic') || colors.background.card
            }
          ]}>
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

              <Text style={styles.cardLabel}>ROAD STATUS</Text>
              <View style={styles.statusRow}>
                <Text style={styles.cardStatus}>{traffic.status}</Text>
                <View
                  style={[
                    styles.scorePill,
                    { backgroundColor: getStatusColor(traffic.score) },
                  ]}
                >
                  <Text style={styles.scorePillText}>{traffic.score}</Text>
                </View>
              </View>
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[1],
  },
  cardStatus: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  scorePill: {
    minWidth: 24,
    height: 20,
    paddingHorizontal: spacing[1],
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  scorePillText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
    color: "#FFFFFF",
  },
  cardDetail: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing[1],
    lineHeight: 18,
  },
});
