import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { View, Text, StyleSheet } from "react-native";
import {
  Award01Icon,
  FlashIcon,
  Target02Icon,
  CheckmarkCircle02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { SetupShell } from "@/components/setup-shell";
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";

// Badge previews to show what users can earn
const PREVIEW_BADGES = [
  { id: "first_steps", emoji: "🎯", name: "First Steps", desc: "Your first 5 votes" },
  { id: "sharp_eye", emoji: "👁️", name: "Sharp Eye", desc: "85% accuracy" },
  { id: "weekly_warrior", emoji: "🔥", name: "Weekly Warrior", desc: "7-day streak" },
  { id: "storm_chaser", emoji: "⛈️", name: "Storm Chaser", desc: "50 weather votes" },
];

// Level tiers preview
const LEVEL_PREVIEW = [
  { level: 1, title: "Newcomer", color: colors.slate[400] },
  { level: 3, title: "Route Guardian", color: colors.state.info },
  { level: 5, title: "Traffic Sentinel", color: colors.gamification.xp },
  { level: 7, title: "Community Legend", color: colors.state.warning },
];

export default function GamificationIntroScreen() {
  const router = useRouter();
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await completeOnboarding();
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      router.replace("/(tabs)");
    }
  };

  return (
    <SetupShell
      currentStep={4}
      totalSteps={4}
      title="You're almost there!"
      subtitle="Join thousands of drivers making roads safer for everyone."
      primaryAction={{
        label: "Start Using Outia",
        onPress: handleStart,
        loading: isLoading,
      }}
    >
      {/* Hero Icon */}
      <Animated.View entering={FadeIn.delay(400)} style={styles.heroIcon}>
        <LinearGradient colors={["#FEF3C7", "#FDE68A"]} style={styles.iconGlow} />
        <HugeiconsIcon icon={Award01Icon} size={48} color={colors.state.warning} />
      </Animated.View>

      {/* How It Works */}
      <Animated.View entering={FadeInUp.delay(500)} style={styles.section}>
        <Text style={styles.sectionTitle}>How it works</Text>

        <View style={styles.stepCard}>
          <View style={[styles.stepIcon, { backgroundColor: colors.risk.low.light }]}>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} color={colors.state.info} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Vote on Events</Text>
            <Text style={styles.stepDesc}>Confirm or dismiss events you see</Text>
          </View>
          <View style={styles.stepPoints}>
            <Text style={styles.pointsValue}>+5</Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={[styles.stepIcon, { backgroundColor: colors.risk.low.light }]}>
            <HugeiconsIcon icon={FlashIcon} size={24} color={colors.state.success} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Be First</Text>
            <Text style={styles.stepDesc}>First responder bonus points</Text>
          </View>
          <View style={styles.stepPoints}>
            <Text style={styles.pointsValue}>+10</Text>
            <Text style={styles.pointsLabel}>bonus</Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={[styles.stepIcon, { backgroundColor: `${colors.gamification.xp}15` }]}>
            <HugeiconsIcon icon={Target02Icon} size={24} color={colors.gamification.xp} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Be Accurate</Text>
            <Text style={styles.stepDesc}>Match community consensus</Text>
          </View>
          <View style={styles.stepPoints}>
            <Text style={styles.pointsValue}>+15</Text>
            <Text style={styles.pointsLabel}>bonus</Text>
          </View>
        </View>
      </Animated.View>

      {/* Levels Preview */}
      <Animated.View entering={FadeInUp.delay(600)} style={styles.section}>
        <Text style={styles.sectionTitle}>Climb the ranks</Text>
        <View style={styles.levelsRow}>
          {LEVEL_PREVIEW.map((level, index) => (
            <View key={level.level} style={styles.levelItem}>
              <View style={[styles.levelCircle, { borderColor: level.color }]}>
                <Text style={[styles.levelNumber, { color: level.color }]}>{level.level}</Text>
              </View>
              <Text style={styles.levelTitle}>{level.title}</Text>
              {index === 0 && (
                <View style={styles.youAreBadge}>
                  <Text style={styles.youAreText}>YOU</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Badges Preview */}
      <Animated.View entering={FadeInUp.delay(700)} style={styles.section}>
        <Text style={styles.sectionTitle}>Unlock badges</Text>
        <View style={styles.badgesGrid}>
          {PREVIEW_BADGES.map((badge) => (
            <View key={badge.id} style={styles.badgeCard}>
              <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDesc}>{badge.desc}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.moreBadges}>+ 10 more badges to discover</Text>
      </Animated.View>

      {/* Community Impact */}
      <Animated.View entering={FadeInUp.delay(800)} style={styles.impactCard}>
        <HugeiconsIcon icon={UserGroupIcon} size={28} color={colors.state.success} />
        <View style={styles.impactContent}>
          <Text style={styles.impactTitle}>Your Impact Matters</Text>
          <Text style={styles.impactDesc}>
            Every vote improves risk scores for thousands of drivers.
          </Text>
        </View>
      </Animated.View>
    </SetupShell>
  );
}

const styles = StyleSheet.create({
  heroIcon: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing[6],
  },
  iconGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.5,
  },
  section: {
    marginBottom: spacing[7],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[2],
    gap: spacing[3],
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius["3xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  stepDesc: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  stepPoints: {
    alignItems: "center",
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  pointsValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.state.success,
  },
  pointsLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  levelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  levelItem: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  levelCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.primary,
  },
  levelNumber: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  levelTitle: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    marginTop: spacing[1],
    textAlign: "center",
  },
  youAreBadge: {
    position: "absolute",
    top: -8,
    backgroundColor: colors.state.success,
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  youAreText: {
    fontSize: 8,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  badgeCard: {
    width: "48%",
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    alignItems: "center",
  },
  badgeEmoji: {
    fontSize: typography.size["4xl"],
    marginBottom: spacing[1],
  },
  badgeName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  badgeDesc: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginTop: 2,
    textAlign: "center",
  },
  moreBadges: {
    fontSize: typography.size.sm,
    color: colors.gamification.xp,
    fontWeight: typography.weight.medium,
    textAlign: "center",
    marginTop: spacing[3],
  },
  impactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.risk.low.light,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  impactContent: {
    flex: 1,
  },
  impactTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: "#065F46",
  },
  impactDesc: {
    fontSize: typography.size.sm,
    color: "#047857",
    marginTop: 2,
    lineHeight: 18,
  },
});
