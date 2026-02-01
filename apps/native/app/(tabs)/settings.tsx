import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import { useRouter } from "expo-router";
import {
  UserIcon,
  CrownIcon,
  Notification01Icon,
  Location01Icon,
  ShieldKeyIcon,
  HelpCircleIcon,
  Logout01Icon,
  ArrowRight01Icon,
  Award02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "heroui-native";

type SettingsItem = {
  icon: any;
  iconColor: string;
  iconBg: string;
  label: string;
  sublabel?: string;
  action: () => void;
  showArrow?: boolean;
};

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  const isPro = currentUser?.tier === "pro";

  const accountItems: SettingsItem[] = [
    {
      icon: UserIcon,
      iconColor: "#3B82F6",
      iconBg: "#DBEAFE",
      label: "Edit Profile",
      sublabel: user?.fullName || user?.emailAddresses[0]?.emailAddress,
      action: () => router.push("/edit-profile"),
      showArrow: true,
    },
    {
      icon: Award02Icon,
      iconColor: "#10B981",
      iconBg: "#D1FAE5",
      label: "My Impact",
      sublabel: "Badges, levels & contributions",
      action: () => router.push("/my-impact"),
      showArrow: true,
    },
    {
      icon: CrownIcon,
      iconColor: "#F59E0B",
      iconBg: "#FEF3C7",
      label: isPro ? "Manage Subscription" : "Upgrade to Pro",
      sublabel: isPro ? "Pro Member" : "Unlock all features",
      action: () => router.push("/paywall"),
      showArrow: true,
    },
  ];

  const preferencesItems: SettingsItem[] = [
    {
      icon: Notification01Icon,
      iconColor: "#8B5CF6",
      iconBg: "#EDE9FE",
      label: "Notifications",
      sublabel: "Alerts, timing & preferences",
      action: () => router.push("/notifications"),
      showArrow: true,
    },
    {
      icon: Location01Icon,
      iconColor: "#10B981",
      iconBg: "#D1FAE5",
      label: "Saved Locations",
      sublabel: "Home, Work, and more",
      action: () => router.push("/saved-locations"),
      showArrow: true,
    },
  ];

  const supportItems: SettingsItem[] = [
    {
      icon: ShieldKeyIcon,
      iconColor: "#6B7280",
      iconBg: "#F3F4F6",
      label: "Privacy Policy",
      action: () => {},
      showArrow: true,
    },
    {
      icon: HelpCircleIcon,
      iconColor: "#6B7280",
      iconBg: "#F3F4F6",
      label: "Help & Support",
      action: () => {},
      showArrow: true,
    },
  ];

  const renderSettingsItem = (item: SettingsItem) => (
    <TouchableOpacity
      key={item.label}
      style={styles.settingsItem}
      onPress={item.action}
    >
      <View style={[styles.settingsIcon, { backgroundColor: item.iconBg }]}>
        <HugeiconsIcon icon={item.icon} size={20} color={item.iconColor} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsLabel}>{item.label}</Text>
        {item.sublabel && (
          <Text style={styles.settingsSublabel}>{item.sublabel}</Text>
        )}
      </View>
      {item.showArrow && (
        <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Body style={styles.profileCardBody}>
            <View style={styles.profileAvatar}>
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={styles.profileImage}
                />
              ) : (
                <HugeiconsIcon icon={UserIcon} size={32} color="#6B7280" />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.fullName || "User"}
              </Text>
              <Text style={styles.profileEmail}>
                {user?.emailAddresses[0]?.emailAddress}
              </Text>
            </View>
            {isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </Card.Body>
        </Card>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card style={styles.settingsCard}>
            <Card.Body style={styles.settingsCardBody}>
              {accountItems.map(renderSettingsItem)}
            </Card.Body>
          </Card>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Card style={styles.settingsCard}>
            <Card.Body style={styles.settingsCardBody}>
              {preferencesItems.map(renderSettingsItem)}
            </Card.Body>
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Card style={styles.settingsCard}>
            <Card.Body style={styles.settingsCardBody}>
              {supportItems.map(renderSettingsItem)}
            </Card.Body>
          </Card>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
          <HugeiconsIcon icon={Logout01Icon} size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Outly v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  profileCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  profileCardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  profileEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
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
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsContent: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  settingsSublabel: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 1,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    marginHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
  versionText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 24,
  },
});
