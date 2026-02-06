import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import {
  Notification01Icon,
  Clock01Icon,
  Alert02Icon,
  CloudIcon,
  Car01Icon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ScreenHeader } from "@/components/screen-header";
import { colors, spacing, typography, shadows } from "@/lib/design-tokens";

type PrimaryConcern = "weather" | "traffic" | "both";
type AlertAdvance = 15 | 30 | 60;

const COMMUTE_TIMES = [
  { label: "Early", sublabel: "6-7 AM", value: "06:30" },
  { label: "Morning", sublabel: "7-9 AM", value: "08:00" },
  { label: "Midday", sublabel: "11-1 PM", value: "12:00" },
  { label: "Evening", sublabel: "5-7 PM", value: "18:00" },
  { label: "Flexible", sublabel: "Varies", value: undefined },
];

const ALERT_ADVANCE_OPTIONS: { label: string; value: AlertAdvance }[] = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const savePreferences = useMutation(api.users.savePreferences);

  // Priority preferences (from Convex)
  const [primaryConcern, setPrimaryConcern] = useState<PrimaryConcern>("both");
  const [commuteTime, setCommuteTime] = useState<string | undefined>("08:00");
  const [alertAdvance, setAlertAdvance] = useState<AlertAdvance>(30);

  // Alert type toggles (local state - could be moved to Convex later)
  const [pushEnabled, setPushEnabled] = useState(true);
  const [weatherAlertsEnabled, setWeatherAlertsEnabled] = useState(true);
  const [trafficAlertsEnabled, setTrafficAlertsEnabled] = useState(true);
  const [incidentAlertsEnabled, setIncidentAlertsEnabled] = useState(true);

  // Quiet hours
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState("10:00 PM");
  const [quietEnd, setQuietEnd] = useState("7:00 AM");

  // Smart delivery
  const [smartDelivery, setSmartDelivery] = useState(true);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from Convex
  useEffect(() => {
    if (currentUser?.preferences) {
      setPrimaryConcern(currentUser.preferences.primaryConcern || "both");
      setCommuteTime(currentUser.preferences.commuteTime);
      setAlertAdvance((currentUser.preferences.alertAdvanceMinutes as AlertAdvance) || 30);
    }
  }, [currentUser]);

  // Auto-save preferences when they change
  const handlePreferenceChange = async (
    newConcern: PrimaryConcern,
    newCommuteTime: string | undefined,
    newAlertAdvance: AlertAdvance
  ) => {
    setIsSaving(true);
    try {
      await savePreferences({
        primaryConcern: newConcern,
        commuteTime: newCommuteTime,
        alertAdvanceMinutes: newAlertAdvance,
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePrimaryConcern = (value: PrimaryConcern) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPrimaryConcern(value);
    handlePreferenceChange(value, commuteTime, alertAdvance);
  };

  const updateCommuteTime = (value: string | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCommuteTime(value);
    handlePreferenceChange(primaryConcern, value, alertAdvance);
  };

  const updateAlertAdvance = (value: AlertAdvance) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAlertAdvance(value);
    handlePreferenceChange(primaryConcern, commuteTime, value);
  };

  const quietTimeOptions = {
    pm: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM"],
    am: ["5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM"],
  };

  if (currentUser === undefined) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Notifications" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notifications"
        rightAction={isSaving ? { label: "Saving...", onPress: () => {}, disabled: true } : undefined}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Priority Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PRIORITY</Text>
            <Text style={styles.sectionSubtitle}>What matters most to you?</Text>
          </View>
          <View style={styles.formCard}>
            <View style={styles.priorityOptions}>
              <PriorityOption
                icon={CloudIcon}
                color="#3B82F6"
                label="Weather"
                isSelected={primaryConcern === "weather"}
                onPress={() => updatePrimaryConcern("weather")}
              />
              <PriorityOption
                icon={Car01Icon}
                color="#10B981"
                label="Traffic"
                isSelected={primaryConcern === "traffic"}
                onPress={() => updatePrimaryConcern("traffic")}
              />
              <PriorityOption
                icon={CheckmarkCircle02Icon}
                color="#8B5CF6"
                label="Both"
                isSelected={primaryConcern === "both"}
                onPress={() => updatePrimaryConcern("both")}
              />
            </View>
          </View>
        </Animated.View>

        {/* Alert Types Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ALERT TYPES</Text>
          </View>
          <View style={styles.formCard}>
            <ToggleItem
              icon={Notification01Icon}
              iconColor="#8B5CF6"
              iconBg="#EDE9FE"
              title="Push Notifications"
              description="Receive alerts on your device"
              enabled={pushEnabled}
              onToggle={setPushEnabled}
              showBorder
            />
            <ToggleItem
              icon={CloudIcon}
              iconColor="#3B82F6"
              iconBg="#DBEAFE"
              title="Weather Alerts"
              description="Severe weather notifications"
              enabled={weatherAlertsEnabled}
              onToggle={setWeatherAlertsEnabled}
              showBorder
            />
            <ToggleItem
              icon={Car01Icon}
              iconColor="#10B981"
              iconBg="#D1FAE5"
              title="Traffic Alerts"
              description="Traffic conditions updates"
              enabled={trafficAlertsEnabled}
              onToggle={setTrafficAlertsEnabled}
              showBorder
            />
            <ToggleItem
              icon={Alert02Icon}
              iconColor="#EF4444"
              iconBg="#FEE2E2"
              title="Incident Alerts"
              description="Accidents, road closures"
              enabled={incidentAlertsEnabled}
              onToggle={setIncidentAlertsEnabled}
            />
          </View>
        </Animated.View>

        {/* Timing Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TIMING</Text>
            <Text style={styles.sectionSubtitle}>When do you usually leave?</Text>
          </View>
          <View style={styles.formCard}>
            <View style={styles.commuteTimeGrid}>
              {COMMUTE_TIMES.map((time) => (
                <TouchableOpacity
                  key={time.label}
                  style={[
                    styles.commuteTimeOption,
                    commuteTime === time.value && styles.commuteTimeOptionSelected,
                  ]}
                  onPress={() => updateCommuteTime(time.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.commuteTimeLabel,
                      commuteTime === time.value && styles.commuteTimeLabelSelected,
                    ]}
                  >
                    {time.label}
                  </Text>
                  <Text style={styles.commuteTimeSublabel}>{time.sublabel}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.alertAdvanceSection}>
              <Text style={styles.alertAdvanceLabel}>Alert me this early:</Text>
              <View style={styles.alertAdvanceOptions}>
                {ALERT_ADVANCE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.alertAdvanceOption,
                      alertAdvance === option.value && styles.alertAdvanceOptionSelected,
                    ]}
                    onPress={() => updateAlertAdvance(option.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.alertAdvanceText,
                        alertAdvance === option.value && styles.alertAdvanceTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quiet Hours Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>QUIET HOURS</Text>
          </View>
          <View style={styles.formCard}>
            <ToggleItem
              icon={Clock01Icon}
              iconColor="#6B7280"
              iconBg="#F3F4F6"
              title="Enable Quiet Hours"
              description="Mute notifications during set hours"
              enabled={quietHoursEnabled}
              onToggle={setQuietHoursEnabled}
            />

            {quietHoursEnabled && (
              <>
                <View style={styles.divider} />
                <View style={styles.quietTimeSection}>
                  <Text style={styles.quietTimeLabel}>Start</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quietTimeOptions}
                  >
                    {quietTimeOptions.pm.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.quietTimeButton,
                          quietStart === time && styles.quietTimeButtonActive,
                        ]}
                        onPress={() => setQuietStart(time)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.quietTimeButtonText,
                            quietStart === time && styles.quietTimeButtonTextActive,
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.quietTimeSection}>
                  <Text style={styles.quietTimeLabel}>End</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quietTimeOptions}
                  >
                    {quietTimeOptions.am.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.quietTimeButton,
                          quietEnd === time && styles.quietTimeButtonActive,
                        ]}
                        onPress={() => setQuietEnd(time)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.quietTimeButtonText,
                            quietEnd === time && styles.quietTimeButtonTextActive,
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        </Animated.View>

        {/* Smart Delivery Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SMART DELIVERY</Text>
          </View>
          <View style={styles.formCard}>
            <ToggleItem
              emoji="sparkles"
              iconColor="#F59E0B"
              iconBg="#FEF3C7"
              title="Smart Delivery"
              description="Only alert when you're likely to travel"
              enabled={smartDelivery}
              onToggle={setSmartDelivery}
            />
          </View>
          <Text style={styles.infoText}>
            Uses your route schedules to send alerts before planned departures.
          </Text>
        </Animated.View>

        {/* Pro Feature Banner */}
        {currentUser?.tier !== "pro" && (
          <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.proBanner}>
            <View style={styles.proBannerContent}>
              <Text style={styles.proBannerEmoji}>crown</Text>
              <View style={styles.proBannerText}>
                <Text style={styles.proBannerTitle}>Unlock More Controls</Text>
                <Text style={styles.proBannerDescription}>
                  Custom alert thresholds & priority notifications
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.proBannerButton}
              onPress={() => router.push("/paywall")}
              activeOpacity={0.7}
            >
              <Text style={styles.proBannerButtonText}>Upgrade</Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={colors.text.inverse} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </View>
  );
}

// Priority Option Component
function PriorityOption({
  icon,
  color,
  label,
  isSelected,
  onPress,
}: {
  icon: typeof CloudIcon;
  color: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.priorityOption, isSelected && styles.priorityOptionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.priorityIconWrapper,
          { backgroundColor: `${color}15` },
          isSelected && { backgroundColor: `${color}25` },
        ]}
      >
        <HugeiconsIcon icon={icon} size={24} color={color} />
      </View>
      <Text style={[styles.priorityLabel, isSelected && styles.priorityLabelSelected]}>
        {label}
      </Text>
      {isSelected && (
        <View style={[styles.priorityCheck, { backgroundColor: color }]}>
          <Text style={styles.priorityCheckText}>check</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Toggle Item Component
function ToggleItem({
  icon,
  emoji,
  iconColor,
  iconBg,
  title,
  description,
  enabled,
  onToggle,
  showBorder,
}: {
  icon?: typeof CloudIcon;
  emoji?: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  showBorder?: boolean;
}) {
  const handleToggle = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(value);
  };

  return (
    <View style={[styles.toggleItem, showBorder && styles.toggleItemBorder]}>
      <View style={[styles.toggleIcon, { backgroundColor: iconBg }]}>
        {emoji ? (
          <Text style={styles.toggleEmoji}>{emoji}</Text>
        ) : (
          icon && <HugeiconsIcon icon={icon} size={22} color={iconColor} />
        )}
      </View>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        trackColor={{ false: colors.slate[200], true: colors.state.success }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={colors.slate[200]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  sectionHeader: {
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  priorityOptions: {
    flexDirection: "row",
    gap: spacing[3],
  },
  priorityOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[2],
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  priorityOptionSelected: {
    borderColor: colors.state.success,
    backgroundColor: "#F0FDF4",
  },
  priorityIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  priorityLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  priorityLabelSelected: {
    color: colors.state.success,
  },
  priorityCheck: {
    position: "absolute",
    top: spacing[2],
    right: spacing[2],
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityCheckText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  toggleItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleEmoji: {
    fontSize: 22,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.slate[100],
    marginVertical: spacing[3],
  },
  commuteTimeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  commuteTimeOption: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    minWidth: 80,
  },
  commuteTimeOptionSelected: {
    borderColor: colors.brand.secondary,
    backgroundColor: "#EFF6FF",
  },
  commuteTimeLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  commuteTimeLabelSelected: {
    color: colors.brand.secondary,
  },
  commuteTimeSublabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  alertAdvanceSection: {
    paddingTop: spacing[2],
  },
  alertAdvanceLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  alertAdvanceOptions: {
    flexDirection: "row",
    gap: spacing[3],
  },
  alertAdvanceOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[3],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: "#FFFFFF",
  },
  alertAdvanceOptionSelected: {
    borderColor: colors.brand.secondary,
    backgroundColor: "#EFF6FF",
  },
  alertAdvanceText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  alertAdvanceTextSelected: {
    color: colors.brand.secondary,
  },
  quietTimeSection: {
    paddingTop: spacing[2],
  },
  quietTimeLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  quietTimeOptions: {
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  quietTimeButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    borderRadius: 10,
    backgroundColor: colors.slate[100],
  },
  quietTimeButtonActive: {
    backgroundColor: colors.brand.primary,
  },
  quietTimeButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  quietTimeButtonTextActive: {
    color: colors.text.inverse,
  },
  infoText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: -spacing[2],
    marginBottom: spacing[4],
    paddingHorizontal: spacing[1],
    lineHeight: 18,
  },
  proBanner: {
    backgroundColor: "#FEF3C7",
    borderRadius: 20,
    padding: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    ...shadows.sm,
  },
  proBannerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  proBannerEmoji: {
    fontSize: 28,
  },
  proBannerText: {
    flex: 1,
  },
  proBannerTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: "#92400E",
  },
  proBannerDescription: {
    fontSize: typography.size.sm,
    color: "#B45309",
    marginTop: 2,
  },
  proBannerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.state.warning,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    borderRadius: 10,
  },
  proBannerButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
});
