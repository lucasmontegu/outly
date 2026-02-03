import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Alert02Icon,
  ArrowRight01Icon,
  CloudIcon,
  Car01Icon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { Card } from "heroui-native";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";
import { lightHaptic } from "@/lib/haptics";

type Alert = {
  id: string;
  type: "weather" | "traffic";
  subtype: string;
  severity: number;
  title: string;
  timeAgo: string;
};

type AlertsSectionProps = {
  alerts: Alert[];
  onAlertPress: (alert: Alert) => void;
  onViewAllPress: () => void;
};

function getSeverityColor(severity: number): string {
  if (severity >= 4) return colors.risk.high.primary;
  if (severity >= 3) return colors.risk.medium.primary;
  return colors.brand.secondary;
}

function getSeverityBg(severity: number): string {
  if (severity >= 4) return colors.risk.high.light;
  if (severity >= 3) return colors.risk.medium.light;
  return `${colors.brand.secondary}15`;
}

export function AlertsSection({
  alerts,
  onAlertPress,
  onViewAllPress,
}: AlertsSectionProps) {
  const hasAlerts = alerts.length > 0;
  const alertCount = alerts.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={onViewAllPress}
        activeOpacity={0.7}
        accessibilityLabel={`${alertCount} alerts nearby. Tap to view map.`}
        accessibilityRole="button"
      >
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.alertBadge,
              hasAlerts ? styles.alertBadgeActive : styles.alertBadgeInactive,
            ]}
          >
            <HugeiconsIcon
              icon={Alert02Icon}
              size={16}
              color={hasAlerts ? colors.risk.high.primary : colors.text.tertiary}
            />
            {hasAlerts && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{alertCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>
            {hasAlerts ? `${alertCount} Alert${alertCount > 1 ? "s" : ""} Nearby` : "No Alerts"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.viewAllText}>View Map</Text>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            color={colors.brand.secondary}
          />
        </View>
      </TouchableOpacity>

      {/* Alert Cards */}
      {hasAlerts ? (
        <View style={styles.alertsList}>
          {alerts.slice(0, 3).map((alert, index) => (
            <Animated.View
              key={alert.id}
              entering={FadeInDown.duration(300).delay(index * 50)}
              layout={Layout.springify().damping(20)}
            >
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => {
                  lightHaptic();
                  onAlertPress(alert);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.alertIndicator,
                    { backgroundColor: getSeverityColor(alert.severity) },
                  ]}
                />
                <View
                  style={[
                    styles.alertIcon,
                    { backgroundColor: getSeverityBg(alert.severity) },
                  ]}
                >
                  <HugeiconsIcon
                    icon={alert.type === "weather" ? CloudIcon : Car01Icon}
                    size={18}
                    color={getSeverityColor(alert.severity)}
                  />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertMeta}>
                    {alert.type === "weather" ? "Weather" : "Traffic"} · {alert.timeAgo}
                  </Text>
                </View>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      ) : (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={styles.emptyCard}>
            <Card.Body style={styles.emptyBody}>
              <Text style={styles.emptyText}>
                All clear! No incidents reported in your area.
              </Text>
            </Card.Body>
          </Card>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[6],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  alertBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  alertBadgeActive: {
    backgroundColor: colors.risk.high.light,
  },
  alertBadgeInactive: {
    backgroundColor: colors.slate[100],
  },
  countBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.risk.high.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  countText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  viewAllText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.brand.secondary,
  },
  alertsList: {
    gap: spacing[2],
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing[3],
    gap: spacing[3],
    ...shadows.sm,
  },
  alertIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    position: "absolute",
    left: 0,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing[2],
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  alertMeta: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: colors.slate[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  emptyBody: {
    padding: spacing[5],
    alignItems: "center",
  },
  emptyText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
