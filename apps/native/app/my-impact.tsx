import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import {
  CheckmarkCircle02Icon,
  Target02Icon,
  ArrowRight01Icon,
  Notification01Icon,
  Award02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { ScreenHeader } from "@/components/screen-header";
import { colors, spacing, typography, shadows } from "@/lib/design-tokens";

// Level badge colors
const LEVEL_CONFIG: Record<number, { color: string; gradient: [string, string]; glow: string }> = {
  1: { color: "#9CA3AF", gradient: ["#F3F4F6", "#E5E7EB"], glow: "#9CA3AF" },
  2: { color: "#10B981", gradient: ["#D1FAE5", "#A7F3D0"], glow: "#10B981" },
  3: { color: "#3B82F6", gradient: ["#DBEAFE", "#BFDBFE"], glow: "#3B82F6" },
  4: { color: "#8B5CF6", gradient: ["#EDE9FE", "#DDD6FE"], glow: "#8B5CF6" },
  5: { color: "#F59E0B", gradient: ["#FEF3C7", "#FDE68A"], glow: "#F59E0B" },
  6: { color: "#EF4444", gradient: ["#FEE2E2", "#FECACA"], glow: "#EF4444" },
  7: { color: "#EC4899", gradient: ["#FCE7F3", "#FBCFE8"], glow: "#EC4899" },
};

// Badge icons mapping
const BADGE_ICONS: Record<string, string> = {
  footprints: "footprints",
  star: "star",
  medal: "medal",
  trophy: "trophy",
  target: "target",
  crosshair: "crosshair",
  shield: "shield",
  flame: "flame",
  calendar: "calendar",
  crown: "crown",
  "cloud-lightning": "cloud-lightning",
  car: "car",
  zap: "zap",
  "arrow-up": "arrow-up",
};

export default function MyImpactScreen() {
  const router = useRouter();
  const stats = useQuery(api.gamification.getMyStats);
  const badges = useQuery(api.gamification.getMyBadges);

  if (stats === undefined || badges === undefined) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="My Impact" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.secondary} />
          <Text style={styles.loadingText}>Loading your impact...</Text>
        </View>
      </View>
    );
  }

  // Handle case where user has no stats yet
  const userStats = stats || {
    totalPoints: 0,
    level: 1,
    levelTitle: "Newcomer",
    totalVotes: 0,
    correctVotes: 0,
    accuracyPercent: 0,
    currentStreak: 0,
    longestStreak: 0,
    votesThisWeek: 0,
    weatherVotes: 0,
    trafficVotes: 0,
    firstResponderCount: 0,
    percentileRank: 100,
    pointsToNextLevel: 500,
    nextLevelPoints: 500,
    weeklyMinVotes: 0,
  };

  const levelConfig = LEVEL_CONFIG[userStats.level] || LEVEL_CONFIG[1];
  const progressPercent = userStats.nextLevelPoints > 0
    ? ((userStats.nextLevelPoints - userStats.pointsToNextLevel) / userStats.nextLevelPoints) * 100
    : 100;

  const activeBadges = (badges || []).filter((b) => b.isActive).slice(0, 4);

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Impact" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Level Hero Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.levelHeroCard}>
          <LinearGradient
            colors={levelConfig.gradient}
            style={styles.levelGradient}
          />

          {/* Shield Badge */}
          <View style={styles.shieldContainer}>
            <View style={[styles.shieldOuter, { borderColor: levelConfig.color }]}>
              <LinearGradient
                colors={levelConfig.gradient}
                style={styles.shieldInner}
              >
                <Text style={styles.shieldEmoji}>🛡️</Text>
              </LinearGradient>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: levelConfig.color }]}>
              <Text style={styles.levelBadgeText}>Lv {userStats.level}</Text>
            </View>
          </View>

          {/* Level Info */}
          <Text style={styles.levelTitle}>{userStats.levelTitle}</Text>
          <Text style={styles.percentileText}>
            Top {userStats.percentileRank}% of contributors
          </Text>

          {/* Points Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.currentPoints}>
                {userStats.totalPoints.toLocaleString()} pts
              </Text>
              <Text style={styles.nextLevelPoints}>
                {userStats.nextLevelPoints.toLocaleString()} pts
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, progressPercent)}%`,
                    backgroundColor: levelConfig.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressHint}>
              {userStats.pointsToNextLevel > 0
                ? `${userStats.pointsToNextLevel.toLocaleString()} points to next level`
                : "Max level reached!"}
            </Text>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#ECFDF5" }]}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} color={colors.state.success} />
            </View>
            <Text style={styles.statValue}>{userStats.totalVotes}</Text>
            <Text style={styles.statLabel}>Confirmations</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#EFF6FF" }]}>
              <HugeiconsIcon icon={Target02Icon} size={24} color={colors.state.info} />
            </View>
            <Text style={styles.statValue}>{userStats.accuracyPercent}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#FEF3C7" }]}>
              <HugeiconsIcon icon={Notification01Icon} size={24} color={colors.state.warning} />
            </View>
            <Text style={styles.statValue}>{userStats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </Animated.View>

        {/* How Trust Points Work */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Trust Points Work</Text>

          <View style={styles.infoStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Validate Hazards</Text>
              <Text style={styles.stepDescription}>
                Tap "Yes" or "Cleared" on active alerts to keep maps accurate.
              </Text>
            </View>
          </View>

          <View style={styles.infoStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Earn Trust</Text>
              <Text style={styles.stepDescription}>
                Consistent accuracy increases your Trust Score, making your future reports more influential.
              </Text>
            </View>
          </View>

          <View style={styles.infoStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Level Up</Text>
              <Text style={styles.stepDescription}>
                Earn points to unlock new levels, badges, and increased voting influence.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* My Badges Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <HugeiconsIcon icon={Award02Icon} size={20} color={colors.gamification.gold} />
              <Text style={styles.sectionTitle}>My Badges</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push("/badges")}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={colors.brand.secondary} />
            </TouchableOpacity>
          </View>

          {activeBadges.length > 0 ? (
            <View style={styles.badgesRow}>
              {activeBadges.map((badge, index) => (
                <TouchableOpacity
                  key={badge.badgeId}
                  style={styles.badgeItem}
                  onPress={() => router.push("/badges")}
                  activeOpacity={0.7}
                >
                  <View style={styles.badgeIconContainer}>
                    <Text style={styles.badgeEmoji}>{getBadgeEmoji(badge.icon)}</Text>
                  </View>
                  <Text style={styles.badgeName} numberOfLines={1}>
                    {badge.name.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noBadgesCard}>
              <Text style={styles.noBadgesEmoji}>🏅</Text>
              <Text style={styles.noBadgesTitle}>No badges yet</Text>
              <Text style={styles.noBadgesText}>
                Start validating hazards to earn your first badge!
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Weekly Activity Card */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.weeklyCard}>
          <Text style={styles.weeklyTitle}>This Week</Text>

          <View style={styles.weeklyStats}>
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyValue}>{userStats.votesThisWeek}</Text>
              <Text style={styles.weeklyLabel}>Votes</Text>
            </View>
            <View style={styles.weeklyDivider} />
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyValue}>{userStats.currentStreak}</Text>
              <Text style={styles.weeklyLabel}>Day Streak</Text>
            </View>
            <View style={styles.weeklyDivider} />
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyValue}>{userStats.weeklyMinVotes}</Text>
              <Text style={styles.weeklyLabel}>Min Required</Text>
            </View>
          </View>

          {userStats.weeklyMinVotes > 0 && (
            <View style={[
              styles.weeklyStatusBadge,
              userStats.votesThisWeek >= userStats.weeklyMinVotes
                ? styles.weeklyStatusSuccess
                : styles.weeklyStatusWarning
            ]}>
              <Text style={[
                styles.weeklyStatusText,
                userStats.votesThisWeek >= userStats.weeklyMinVotes
                  ? styles.weeklyStatusTextSuccess
                  : styles.weeklyStatusTextWarning
              ]}>
                {userStats.votesThisWeek >= userStats.weeklyMinVotes
                  ? "Weekly minimum met!"
                  : `${userStats.weeklyMinVotes - userStats.votesThisWeek} more votes needed to maintain your level`}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </View>
  );
}

function getBadgeEmoji(icon: string): string {
  const emojiMap: Record<string, string> = {
    footprints: "👣",
    star: "⭐",
    medal: "🏅",
    trophy: "🏆",
    target: "🎯",
    crosshair: "🎯",
    shield: "🛡️",
    flame: "🔥",
    calendar: "📅",
    crown: "👑",
    "cloud-lightning": "⛈️",
    car: "🚗",
    zap: "⚡",
    "arrow-up": "⬆️",
  };
  return emojiMap[icon] || "🏅";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
  },
  loadingText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },

  // Level Hero Card
  levelHeroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: spacing[6],
    alignItems: "center",
    marginBottom: spacing[4],
    overflow: "hidden",
    ...shadows.md,
  },
  levelGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    opacity: 0.5,
  },
  shieldContainer: {
    position: "relative",
    marginBottom: spacing[4],
  },
  shieldOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  shieldInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  shieldEmoji: {
    fontSize: 40,
  },
  levelBadge: {
    position: "absolute",
    bottom: -4,
    alignSelf: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  levelBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  levelTitle: {
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  percentileText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    marginBottom: spacing[5],
  },
  progressSection: {
    width: "100%",
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  currentPoints: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  nextLevelPoints: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.slate[200],
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressHint: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing[2],
    textAlign: "center",
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing[4],
    alignItems: "center",
    ...shadows.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  statValue: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // Info Card
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing[5],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  infoTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  infoStep: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },

  // Badges Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.brand.secondary,
  },
  badgesRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  badgeItem: {
    flex: 1,
    alignItems: "center",
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
    ...shadows.md,
  },
  badgeEmoji: {
    fontSize: 32,
  },
  badgeName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    textAlign: "center",
  },
  noBadgesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing[6],
    alignItems: "center",
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  noBadgesEmoji: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  noBadgesTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  noBadgesText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
  },

  // Weekly Card
  weeklyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing[5],
    ...shadows.sm,
  },
  weeklyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  weeklyStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing[3],
  },
  weeklyStat: {
    alignItems: "center",
    flex: 1,
  },
  weeklyValue: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  weeklyLabel: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  weeklyDivider: {
    width: 1,
    backgroundColor: colors.slate[200],
  },
  weeklyStatusBadge: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 12,
    alignItems: "center",
  },
  weeklyStatusSuccess: {
    backgroundColor: colors.risk.low.light,
  },
  weeklyStatusWarning: {
    backgroundColor: colors.risk.medium.light,
  },
  weeklyStatusText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    textAlign: "center",
  },
  weeklyStatusTextSuccess: {
    color: colors.risk.low.dark,
  },
  weeklyStatusTextWarning: {
    color: colors.risk.medium.dark,
  },
});
