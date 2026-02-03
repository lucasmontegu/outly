import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
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
import { useCustomerInfo, useCustomerCenter } from "@/hooks/useSubscription";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

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
  const { isPro } = useCustomerInfo();
  const { presentCustomerCenter } = useCustomerCenter();

  const handleSubscriptionPress = async () => {
    if (isPro) {
      // Show Customer Center for subscription management
      await presentCustomerCenter({
        onRestoreCompleted: (customerInfo) => {
          console.log("Purchases restored:", customerInfo);
        },
      });
    } else {
      // Show paywall for non-pro users
      router.push("/paywall");
    }
  };

  const accountItems: SettingsItem[] = [
    {
      icon: UserIcon,
      iconColor: colors.state.info,
      iconBg: colors.slate[100],
      label: "Edit Profile",
      sublabel: user?.fullName || user?.emailAddresses[0]?.emailAddress,
      action: () => router.push("/edit-profile"),
      showArrow: true,
    },
    {
      icon: Award02Icon,
      iconColor: colors.state.success,
      iconBg: colors.risk.low.light,
      label: "My Impact",
      sublabel: "Badges, levels & contributions",
      action: () => router.push("/my-impact"),
      showArrow: true,
    },
    {
      icon: CrownIcon,
      iconColor: colors.state.warning,
      iconBg: colors.risk.medium.light,
      label: isPro ? "Manage Subscription" : "Upgrade to Pro",
      sublabel: isPro ? "Pro Member" : "Unlock all features",
      action: handleSubscriptionPress,
      showArrow: true,
    },
  ];

  const preferencesItems: SettingsItem[] = [
    {
      icon: Notification01Icon,
      iconColor: colors.gamification.xp,
      iconBg: colors.slate[100],
      label: "Notifications",
      sublabel: "Alerts, timing & preferences",
      action: () => router.push("/notifications"),
      showArrow: true,
    },
    {
      icon: Location01Icon,
      iconColor: colors.state.success,
      iconBg: colors.risk.low.light,
      label: "Saved Locations",
      sublabel: "Home, Work, and more",
      action: () => router.push("/saved-locations"),
      showArrow: true,
    },
  ];

  const supportItems: SettingsItem[] = [
    {
      icon: ShieldKeyIcon,
      iconColor: colors.text.secondary,
      iconBg: colors.slate[100],
      label: "Privacy Policy",
      action: () => {},
      showArrow: true,
    },
    {
      icon: HelpCircleIcon,
      iconColor: colors.text.secondary,
      iconBg: colors.slate[100],
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
        <Text style={styles.versionText}>Outia v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[10],
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  headerTitle: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  profileCard: {
    marginHorizontal: spacing[4],
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
  },
  profileCardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    gap: spacing[4],
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  profileEmail: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: colors.state.warning,
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  proBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  section: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.size.sm + 1,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  settingsCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
  },
  settingsCardBody: {
    padding: spacing[1],
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    gap: spacing[3],
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsContent: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  settingsSublabel: {
    fontSize: typography.size.sm + 1,
    color: colors.text.secondary,
    marginTop: 1,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    marginTop: spacing[8],
    marginHorizontal: spacing[4],
    paddingVertical: spacing[3] + 2,
    backgroundColor: colors.risk.high.light,
    borderRadius: borderRadius.lg,
  },
  signOutText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.state.error,
  },
  versionText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    textAlign: "center",
    marginTop: spacing[6],
  },
});
