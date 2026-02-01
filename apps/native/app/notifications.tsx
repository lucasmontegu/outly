import { useState } from "react";
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
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "heroui-native";

type NotificationSetting = {
  id: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  enabled: boolean;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Local state for notification preferences (would typically be stored in Convex)
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "push_alerts",
      icon: Notification01Icon,
      iconColor: "#8B5CF6",
      iconBg: "#EDE9FE",
      title: "Push Notifications",
      description: "Receive alerts on your device",
      enabled: true,
    },
    {
      id: "weather_alerts",
      icon: CloudIcon,
      iconColor: "#3B82F6",
      iconBg: "#DBEAFE",
      title: "Weather Alerts",
      description: "Get notified about severe weather",
      enabled: true,
    },
    {
      id: "traffic_alerts",
      icon: Car01Icon,
      iconColor: "#10B981",
      iconBg: "#D1FAE5",
      title: "Traffic Alerts",
      description: "Updates on traffic conditions",
      enabled: true,
    },
    {
      id: "incident_alerts",
      icon: Alert02Icon,
      iconColor: "#EF4444",
      iconBg: "#FEE2E2",
      title: "Incident Alerts",
      description: "Accidents, road closures, etc.",
      enabled: true,
    },
  ]);

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState("10:00 PM");
  const [quietEnd, setQuietEnd] = useState("7:00 AM");
  const [smartDelivery, setSmartDelivery] = useState(true);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const quietTimeOptions = [
    "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM",
    "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM",
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Alert Types Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Types</Text>
          <Card style={styles.settingsCard}>
            <Card.Body style={styles.settingsCardBody}>
              {settings.map((setting, index) => (
                <View
                  key={setting.id}
                  style={[
                    styles.settingItem,
                    index < settings.length - 1 && styles.settingItemBorder,
                  ]}
                >
                  <View style={[styles.settingIcon, { backgroundColor: setting.iconBg }]}>
                    <HugeiconsIcon icon={setting.icon} size={20} color={setting.iconColor} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{setting.title}</Text>
                    <Text style={styles.settingDescription}>{setting.description}</Text>
                  </View>
                  <Switch
                    value={setting.enabled}
                    onValueChange={() => toggleSetting(setting.id)}
                    trackColor={{ false: "#E5E7EB", true: "#10B981" }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </Card.Body>
          </Card>
        </View>

        {/* Quiet Hours Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <Card style={styles.settingsCard}>
            <Card.Body style={styles.settingsCardBody}>
              <View style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: "#F3F4F6" }]}>
                  <HugeiconsIcon icon={Clock01Icon} size={20} color="#6B7280" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Enable Quiet Hours</Text>
                  <Text style={styles.settingDescription}>
                    Mute notifications during set hours
                  </Text>
                </View>
                <Switch
                  value={quietHoursEnabled}
                  onValueChange={setQuietHoursEnabled}
                  trackColor={{ false: "#E5E7EB", true: "#10B981" }}
                  thumbColor="#fff"
                />
              </View>

              {quietHoursEnabled && (
                <>
                  <View style={styles.divider} />

                  <View style={styles.timeSection}>
                    <Text style={styles.timeLabel}>Start Time</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.timeOptions}
                    >
                      {quietTimeOptions
                        .filter((t) => t.includes("PM"))
                        .map((time) => (
                          <TouchableOpacity
                            key={time}
                            style={[
                              styles.timeButton,
                              quietStart === time && styles.timeButtonActive,
                            ]}
                            onPress={() => setQuietStart(time)}
                          >
                            <Text
                              style={[
                                styles.timeButtonText,
                                quietStart === time && styles.timeButtonTextActive,
                              ]}
                            >
                              {time}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  </View>

                  <View style={styles.timeSection}>
                    <Text style={styles.timeLabel}>End Time</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.timeOptions}
                    >
                      {quietTimeOptions
                        .filter((t) => t.includes("AM"))
                        .map((time) => (
                          <TouchableOpacity
                            key={time}
                            style={[
                              styles.timeButton,
                              quietEnd === time && styles.timeButtonActive,
                            ]}
                            onPress={() => setQuietEnd(time)}
                          >
                            <Text
                              style={[
                                styles.timeButtonText,
                                quietEnd === time && styles.timeButtonTextActive,
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
          <Text style={styles.sectionTitle}>Delivery</Text>
          <Card style={styles.settingsCard}>
            <Card.Body style={styles.settingsCardBody}>
              <View style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: "#FEF3C7" }]}>
                  <Text style={styles.settingEmoji}>✨</Text>
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Smart Delivery</Text>
                  <Text style={styles.settingDescription}>
                    Only alert when you're likely to travel
                  </Text>
                </View>
                <Switch
                  value={smartDelivery}
                  onValueChange={setSmartDelivery}
                  trackColor={{ false: "#E5E7EB", true: "#10B981" }}
                  thumbColor="#fff"
                />
              </View>
            </Card.Body>
          </Card>
          <Text style={styles.infoText}>
            Smart Delivery uses your route schedules to only send relevant alerts
            before your planned departures.
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
                  Get custom alert thresholds and priority notifications with Pro
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerSpacer: {
    width: 40,
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
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  settingsCardBody: {
    padding: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingEmoji: {
    fontSize: 20,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  settingDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 12,
  },
  timeSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  timeOptions: {
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  timeButtonActive: {
    backgroundColor: "#111827",
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  timeButtonTextActive: {
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
