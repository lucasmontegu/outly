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
    detail: string; // "No rain expected" or "Clearing at 6:40 PM"
    score: number;
  };
  traffic: {
    status: string; // "Flowing", "Moderate", "Congested"
    detail: string; // "No delays" or "Easing at 6:35 PM"
    score: number;
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

export function ConditionCards({ weather, traffic }: ConditionCardsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Current Conditions</Text>
      </View>

      <View style={styles.cardsRow}>
        {/* Weather Card */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(100)}
          style={styles.cardWrapper}
        >
          <Card style={styles.card}>
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
              </View>

              <Text style={styles.cardLabel}>WEATHER</Text>
              <Text style={styles.cardStatus}>{weather.status}</Text>
              <Text style={styles.cardDetail}>{weather.detail}</Text>
            </Card.Body>
          </Card>
        </Animated.View>

        {/* Traffic Card */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(200)}
          style={styles.cardWrapper}
        >
          <Card style={styles.card}>
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
              </View>

              <Text style={styles.cardLabel}>TRAFFIC</Text>
              <Text style={styles.cardStatus}>{traffic.status}</Text>
              <Text style={styles.cardDetail}>{traffic.detail}</Text>
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
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
  statusBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
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
