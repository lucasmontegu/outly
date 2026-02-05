import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useState, useCallback } from "react";
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCustomerInfo, useCustomerCenter } from "@/hooks/useSubscription";
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";

// ============================================================================
// Profile Header Card Component
// ============================================================================
function ProfileCard({ user, isPro }: { user: any; isPro: boolean }) {
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileAvatar}>
        {user?.imageUrl ? (
          <Image
            source={{ uri: user.imageUrl }}
            style={styles.avatarImage}
          />
        ) : (
          <HugeiconsIcon icon={UserIcon} size={32} color={colors.brand.primary} />
        )}
      </View>
      <View style={styles.profileInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.profileName}>
            {user?.fullName || "User"}
          </Text>
          {isPro && (
            <View style={styles.proBadge}>
              <HugeiconsIcon icon={CrownIcon} size={12} color={colors.text.inverse} />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={styles.profileEmail}>
          {user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress}
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// Settings Section Component
// ============================================================================
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {children}
      </View>
    </View>
  );
}

// ============================================================================
// Settings Item Component
// ============================================================================
function SettingsItem({
  icon,
  iconColor,
  label,
  sublabel,
  onPress,
  showArrow = true,
  isLast = false,
}: {
  icon: any;
  iconColor: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  showArrow?: boolean;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, !isLast && styles.settingsItemBorder]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.settingsIcon, { backgroundColor: `${iconColor}15` }]}>
        <HugeiconsIcon icon={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {sublabel && <Text style={styles.settingsSublabel}>{sublabel}</Text>}
      </View>
      {showArrow && (
        <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.text.tertiary} />
      )}
    </TouchableOpacity>
  );
}

// ============================================================================
// Main Settings Screen
// ============================================================================
export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { isPro } = useCustomerInfo();

  // ============================================================================
  // OPTIMIZED: Conditional subscription - pauses when screen is not focused
  // Settings data is mostly static, no need to keep subscription active
  // ============================================================================
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => setIsScreenFocused(false);
    }, [])
  );

  const currentUser = useQuery(
    api.users.getCurrentUser,
    isScreenFocused ? {} : "skip"
  );
  const { presentCustomerCenter } = useCustomerCenter();

  const handleSubscriptionPress = async () => {
    if (isPro) {
      await presentCustomerCenter({
        onRestoreCompleted: (customerInfo) => {
          console.log("Purchases restored:", customerInfo);
        },
      });
    } else {
      router.push("/paywall");
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => signOut() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Profile Card */}
        <ProfileCard user={user} isPro={isPro} />

        {/* Account Section */}
        <SettingsSection title="ACCOUNT">
          <SettingsItem
            icon={Award02Icon}
            iconColor={colors.gamification.gold}
            label="My Impact"
            sublabel="Badges, levels & contributions"
            onPress={() => router.push("/my-impact")}
          />
          <SettingsItem
            icon={CrownIcon}
            iconColor="#8B5CF6"
            label={isPro ? "Manage Subscription" : "Upgrade to Pro"}
            sublabel={isPro ? "Pro Member" : "Unlock all features"}
            onPress={handleSubscriptionPress}
            isLast
          />
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection title="PREFERENCES">
          <SettingsItem
            icon={Notification01Icon}
            iconColor={colors.state.info}
            label="Notifications"
            sublabel="Alerts, timing & preferences"
            onPress={() => router.push("/notifications")}
          />
          <SettingsItem
            icon={Location01Icon}
            iconColor={colors.risk.low.primary}
            label="Saved Locations"
            sublabel="Home, Work, and more"
            onPress={() => router.push("/saved-locations")}
            isLast
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title="SUPPORT">
          <SettingsItem
            icon={ShieldKeyIcon}
            iconColor={colors.text.secondary}
            label="Privacy Policy"
            onPress={() => {}}
          />
          <SettingsItem
            icon={HelpCircleIcon}
            iconColor={colors.text.secondary}
            label="Help & Support"
            onPress={() => {}}
            isLast
          />
        </SettingsSection>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <HugeiconsIcon icon={Logout01Icon} size={20} color={colors.state.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Outia v1.0.0</Text>

        {/* Bottom spacing for floating tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for floating tab bar
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  headerTitle: {
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  // Profile Card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: spacing[4],
    marginBottom: spacing[6],
    padding: spacing[4],
    borderRadius: 20,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.brand.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  profileName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  profileEmail: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.state.warning,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] - 1,
    borderRadius: borderRadius.sm,
    gap: 3,
  },
  proBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  // Sections
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    marginLeft: spacing[6],
    marginBottom: spacing[2],
    letterSpacing: 0.8,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: spacing[4],
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  // Settings Items
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    gap: spacing[3],
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsContent: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  settingsSublabel: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 1,
  },
  // Sign Out
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.state.error}10`,
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: 16,
    gap: spacing[2],
  },
  signOutText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.state.error,
  },
  // Version
  versionText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    textAlign: "center",
    marginTop: spacing[6],
  },
});
