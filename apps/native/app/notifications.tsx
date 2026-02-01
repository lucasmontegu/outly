import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import {
  ArrowLeft01Icon,
  Notification01Icon,
  Clock01Icon,
  Alert02Icon,
  CloudIcon,
  Car01Icon,
  CheckmarkCircle02Icon,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "heroui-native";

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
    setPrimaryConcern(value);
    handlePreferenceChange(value, commuteTime, alertAdvance);
  };

  const updateCommuteTime = (value: string | undefined) => {
    setCommuteTime(value);
    handlePreferenceChange(primaryConcern, value, alertAdvance);
  };

  const updateAlertAdvance = (value: AlertAdvance) => {
    setAlertAdvance(value);
    handlePreferenceChange(primaryConcern, commuteTime, value);
  };

  const quietTimeOptions = {
    pm: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM"],
    am: ["5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM"],
  };

  if (currentUser === undefined) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight}>
          {isSaving && <ActivityIndicator size="small" color="#3B82F6" />}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Priority Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <Text style={styles.sectionDesc}>What matters most to you?</Text>
          <Card style={styles.card}>
            <Card.Body style={styles.priorityCardBody}>
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
            </Card.Body>
          </Card>
        </View>

        {/* Alert Types Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Types</Text>
          <Card style={styles.card}>
            <Card.Body style={styles.cardBody}>
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
            </Card.Body>
          </Card>
        </View>

        {/* Timing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timing</Text>
          <Text style={styles.sectionDesc}>When do you usually leave?</Text>
          <Card style={styles.card}>
            <Card.Body style={styles.timingCardBody}>
              <View style={styles.commuteTimeGrid}>
                {COMMUTE_TIMES.map((time) => (
                  <TouchableOpacity
                    key={time.label}
                    style={[
                      styles.commuteTimeOption,
                      commuteTime === time.value && styles.commuteTimeOptionSelected,
                    ]}
                    onPress={() => updateCommuteTime(time.value)}
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
            </Card.Body>
          </Card>
        </View>

        {/* Quiet Hours Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <Card style={styles.card}>
            <Card.Body style={styles.cardBody}>
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
            </Card.Body>
          </Card>
        </View>

        {/* Smart Delivery Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Delivery</Text>
          <Card style={styles.card}>
            <Card.Body style={styles.cardBody}>
              <ToggleItem
                emoji="✨"
                iconColor="#F59E0B"
                iconBg="#FEF3C7"
                title="Smart Delivery"
                description="Only alert when you're likely to travel"
                enabled={smartDelivery}
                onToggle={setSmartDelivery}
              />
            </Card.Body>
          </Card>
          <Text style={styles.infoText}>
            Uses your route schedules to send alerts before planned departures.
          </Text>
        </View>

        {/* Pro Feature Banner */}
        {currentUser?.tier !== "pro" && (
          <View style={styles.proBanner}>
            <View style={styles.proBannerContent}>
              <Text style={styles.proBannerEmoji}>👑</Text>
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
            >
              <Text style={styles.proBannerButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
        <HugeiconsIcon icon={icon} size={22} color={color} />
      </View>
      <Text style={[styles.priorityLabel, isSelected && styles.priorityLabelSelected]}>
        {label}
      </Text>
      {isSelected && (
        <View style={[styles.priorityCheck, { backgroundColor: color }]}>
          <Text style={styles.priorityCheckText}>✓</Text>
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
  return (
    <View style={[styles.toggleItem, showBorder && styles.toggleItemBorder]}>
      <View style={[styles.toggleIcon, { backgroundColor: iconBg }]}>
        {emoji ? (
          <Text style={styles.toggleEmoji}>{emoji}</Text>
        ) : (
          icon && <HugeiconsIcon icon={icon} size={20} color={iconColor} />
        )}
      </View>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: "#E5E7EB", true: "#10B981" }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerRight: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionDesc: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  cardBody: {
    padding: 4,
  },
  priorityCardBody: {
    padding: 16,
  },
  priorityOptions: {
    flexDirection: "row",
    gap: 10,
  },
  priorityOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    position: "relative",
  },
  priorityOptionSelected: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  priorityIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  priorityLabelSelected: {
    color: "#059669",
  },
  priorityCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityCheckText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  toggleItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleEmoji: {
    fontSize: 20,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  toggleDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 1,
  },
  timingCardBody: {
    padding: 16,
  },
  commuteTimeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  commuteTimeOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    alignItems: "center",
    minWidth: 70,
  },
  commuteTimeOptionSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  commuteTimeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  commuteTimeLabelSelected: {
    color: "#3B82F6",
  },
  commuteTimeSublabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 1,
  },
  alertAdvanceSection: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 16,
  },
  alertAdvanceLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  alertAdvanceOptions: {
    flexDirection: "row",
    gap: 10,
  },
  alertAdvanceOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  alertAdvanceOptionSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  alertAdvanceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  alertAdvanceTextSelected: {
    color: "#3B82F6",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 12,
  },
  quietTimeSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  quietTimeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  quietTimeOptions: {
    gap: 8,
  },
  quietTimeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  quietTimeButtonActive: {
    backgroundColor: "#111827",
  },
  quietTimeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  quietTimeButtonTextActive: {
    color: "#fff",
  },
  infoText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 18,
  },
  proBanner: {
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  proBannerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  proBannerEmoji: {
    fontSize: 24,
  },
  proBannerText: {
    flex: 1,
  },
  proBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400E",
  },
  proBannerDescription: {
    fontSize: 12,
    color: "#B45309",
    marginTop: 2,
  },
  proBannerButton: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  proBannerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
