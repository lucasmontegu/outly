import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft01Icon,
  AlarmClockIcon,
  CloudIcon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  Navigation03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";
import { lightHaptic, riskLevelHaptic } from "@/lib/haptics";
import { useCustomerInfo } from "@/hooks/useSubscription";

export default function SmartDepartureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    optimalTime?: string;
    optimalMinutes?: string;
    score?: string;
    classification?: string;
    reason?: string;
    isOptimalNow?: string;
  }>();

  const [alertScheduled, setAlertScheduled] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const { isPro } = useCustomerInfo();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Parse params with fallbacks
  const optimalTime = params.optimalTime || "7:45";
  const optimalMinutes = parseInt(params.optimalMinutes || "30", 10);
  const currentScore = parseInt(params.score || "50", 10);
  const classification = (params.classification || "medium") as "low" | "medium" | "high";
  const reason = params.reason || "Conditions improving";
  const isOptimalNow = params.isOptimalNow === "1";

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return colors.risk.low.primary;
      case "medium": return colors.risk.medium.primary;
      case "high": return colors.risk.high.primary;
      default: return colors.text.secondary;
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case "low": return colors.risk.low.light;
      case "medium": return colors.risk.medium.light;
      case "high": return colors.risk.high.light;
      default: return colors.slate[100];
    }
  };

  const scheduleAlert = async () => {
    setScheduling(true);
    lightHaptic();

    // Check if free user has already scheduled an alert today
    if (!isPro) {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const departureAlerts = scheduled.filter(
        (n) => n.content.data?.type === "departure_alert"
      );

      if (departureAlerts.length >= 1) {
        setScheduling(false);
        setShowUpgradePrompt(true);
        return;
      }
    }

    try {
      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Notifications Disabled",
          "Enable notifications in Settings to receive departure alerts.",
          [{ text: "OK" }]
        );
        setScheduling(false);
        return;
      }

      if (isOptimalNow) {
        // Optimal now — no need to schedule, just confirm
        riskLevelHaptic("low");
        setAlertScheduled(true);
        setScheduling(false);
        return;
      }

      // Schedule notification for optimal departure time
      const triggerSeconds = Math.max(60, optimalMinutes * 60);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to leave!",
          body: `Conditions are best now. ${reason}`,
          sound: true,
          data: { type: "departure_alert" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: triggerSeconds,
        },
      });

      riskLevelHaptic("low");
      setAlertScheduled(true);
    } catch (error) {
      console.error("Error scheduling notification:", error);
      Alert.alert("Error", "Could not schedule the alert. Please try again.");
    } finally {
      setScheduling(false);
    }
  };

  const cancelAlert = async () => {
    lightHaptic();
    await Notifications.cancelAllScheduledNotificationsAsync();
    setAlertScheduled(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Departure</Text>
        <View style={styles.headerButton}>
          {isPro && (
            <View style={styles.proPill}>
              <Text style={styles.proPillText}>PRO</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Best Window Card */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.bestWindowCard}>
            <View style={styles.bestWindowHeader}>
              <View style={[styles.bestWindowBadge, { backgroundColor: getRiskBg(classification) }]}>
                <Text style={[styles.bestWindowBadgeText, { color: getRiskColor(classification) }]}>
                  {isOptimalNow ? "GO NOW" : "BEST WINDOW"}
                </Text>
              </View>
              <View style={[styles.scorePill, { backgroundColor: getRiskColor(classification) }]}>
                <Text style={styles.scorePillText}>{currentScore}</Text>
              </View>
            </View>

            <Text style={styles.recommendedTime}>
              {isOptimalNow ? "NOW" : optimalTime}
            </Text>

            <Text style={styles.reasonText}>{reason}</Text>

            {!isOptimalNow && optimalMinutes > 0 && (
              <View style={styles.countdownRow}>
                <HugeiconsIcon icon={AlarmClockIcon} size={16} color={colors.text.tertiary} />
                <Text style={styles.countdownText}>
                  In {optimalMinutes} min
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* What happens section */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={styles.sectionTitle}>What happens</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: colors.brand.secondary }]} />
              <Text style={styles.stepText}>
                {isOptimalNow
                  ? "Conditions are optimal right now"
                  : `We'll notify you at ${optimalTime} when it's time to go`}
              </Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: colors.brand.secondary }]} />
              <Text style={styles.stepText}>
                If conditions change, we'll update you with a new best time
              </Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: colors.risk.low.primary }]} />
              <Text style={styles.stepText}>
                You leave at the best possible time and save minutes on your commute
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Alert confirmed state */}
        {alertScheduled && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.confirmedCard}>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} color={colors.risk.low.primary} />
            <View style={styles.confirmedContent}>
              <Text style={styles.confirmedTitle}>
                {isOptimalNow ? "You're all set!" : `Alert set for ${optimalTime}`}
              </Text>
              <Text style={styles.confirmedSubtitle}>
                {isOptimalNow
                  ? "Go now for the best conditions"
                  : "We'll send a push notification when it's time"}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* PRO Upgrade Prompt */}
        {showUpgradePrompt && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.upgradeCard}>
            <View style={styles.upgradeHeader}>
              <HugeiconsIcon icon={Alert02Icon} size={24} color={colors.state.warning} />
              <Text style={styles.upgradeTitle}>Free Plan Limit</Text>
            </View>
            <Text style={styles.upgradeText}>
              Free accounts can set 1 departure alert per day. Upgrade to Pro for unlimited alerts on all routes.
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => {
                lightHaptic();
                router.push("/paywall");
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => setShowUpgradePrompt(false)}
            >
              <Text style={styles.dismissButtonText}>Maybe later</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        {alertScheduled ? (
          <View style={styles.bottomCtaRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelAlert}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel Alert</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.setAlertButton,
              {
                backgroundColor: isOptimalNow
                  ? colors.risk.low.primary
                  : colors.brand.secondary,
              },
            ]}
            onPress={scheduleAlert}
            activeOpacity={0.8}
            disabled={scheduling}
          >
            <HugeiconsIcon
              icon={isOptimalNow ? Navigation03Icon : AlarmClockIcon}
              size={20}
              color={colors.text.inverse}
            />
            <Text style={styles.setAlertButtonText}>
              {scheduling
                ? "Setting up..."
                : isOptimalNow
                ? "Navigate Now"
                : `Set Alert for ${optimalTime}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[5],
  },
  bestWindowCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["2xl"],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
    marginBottom: spacing[6],
  },
  bestWindowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  bestWindowBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
  bestWindowBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.wide,
  },
  scorePill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    minWidth: 42,
    alignItems: "center",
  },
  scorePillText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    fontFamily: "JetBrainsMono_700Bold",
    color: colors.text.inverse,
  },
  recommendedTime: {
    fontSize: 64,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
    letterSpacing: typography.tracking.tight,
  },
  reasonText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    marginTop: spacing[2],
    lineHeight: 22,
  },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[3],
  },
  countdownText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    fontWeight: typography.weight.medium,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.tertiary,
    letterSpacing: typography.tracking.wide,
    textTransform: "uppercase",
    marginBottom: spacing[4],
  },
  stepsContainer: {
    marginBottom: spacing[6],
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.border.light,
    marginLeft: 4,
    marginVertical: spacing[1],
  },
  stepText: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  confirmedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.risk.low.light,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.risk.low.primary,
  },
  confirmedContent: {
    flex: 1,
  },
  confirmedTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.risk.low.dark,
  },
  confirmedSubtitle: {
    fontSize: typography.size.sm,
    color: colors.risk.low.dark,
    marginTop: 2,
    opacity: 0.8,
  },
  bottomCta: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  setAlertButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
  },
  setAlertButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  bottomCtaRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.medium,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  doneButton: {
    flex: 2,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.brand.secondary,
    alignItems: "center",
  },
  doneButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  proPill: {
    backgroundColor: colors.state.warning,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  proPillText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  upgradeCard: {
    backgroundColor: colors.state.warning + "10",
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.state.warning + "30",
    marginBottom: spacing[4],
  },
  upgradeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  upgradeTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  upgradeText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  upgradeButton: {
    backgroundColor: colors.brand.secondary,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    alignItems: "center",
    marginBottom: spacing[3],
  },
  upgradeButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  dismissButton: {
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  dismissButtonText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
});
