import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import {
  ArrowLeft01Icon,
  HelpCircleIcon,
  CheckmarkCircle02Icon,
  Target02Icon,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";

// Level badge icons/colors
const LEVEL_CONFIG: Record<number, { color: string; gradient: [string, string] }> = {
  1: { color: "#9CA3AF", gradient: ["#E5E7EB", "#D1D5DB"] },
  2: { color: "#10B981", gradient: ["#D1FAE5", "#A7F3D0"] },
  3: { color: "#3B82F6", gradient: ["#DBEAFE", "#BFDBFE"] },
  4: { color: "#8B5CF6", gradient: ["#EDE9FE", "#DDD6FE"] },
  5: { color: "#F59E0B", gradient: ["#FEF3C7", "#FDE68A"] },
  6: { color: "#EF4444", gradient: ["#FEE2E2", "#FECACA"] },
  7: { color: "#EC4899", gradient: ["#FCE7F3", "#FBCFE8"] },
};

// Badge icons mapping
const BADGE_ICONS: Record<string, string> = {
  footprints: "👣",
  star: "⭐",
  medal: "🏅",
  trophy: "🏆",
  target: "🎯",
  crosshair: "🔬",
  shield: "🛡️",
  flame: "🔥",
  calendar: "📅",
  crown: "👑",
  "cloud-lightning": "⛈️",
  car: "🚗",
  zap: "⚡",
  "arrow-up": "📈",
};

export default function MyImpactScreen() {
  const router = useRouter();
  const stats = useQuery(api.gamification.getMyStats);
  const badges = useQuery(api.gamification.getMyBadges);

  if (stats === undefined || badges === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your impact...</Text>
        </View>
      </SafeAreaView>
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Impact</Text>
        <TouchableOpacity style={styles.headerButton}>
          <HugeiconsIcon icon={HelpCircleIcon} size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Level Badge Section */}
        <View style={styles.levelSection}>
          {/* Shield Badge */}
          <View style={styles.badgeContainer}>
            <LinearGradient
              colors={levelConfig.gradient}
              style={styles.shieldGradient}
            >
              <View style={[styles.shieldInner, { borderColor: levelConfig.color }]}>
                <Text style={styles.shieldIcon}>🛡️</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Level Pill */}
          <View style={[styles.levelPill, { backgroundColor: levelConfig.color }]}>
            <Text style={styles.levelPillText}>Lv {userStats.level}</Text>
          </View>

          {/* Title */}
          <Text style={styles.levelTitle}>{userStats.levelTitle}</Text>
          <Text style={styles.percentileText}>
            Top {userStats.percentileRank}% of contributors
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
              {userStats.totalPoints.toLocaleString()} pts
            </Text>
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
            <Text style={styles.progressLabel}>
              {userStats.nextLevelPoints.toLocaleString()} pts
            </Text>
          </View>
          <Text style={styles.progressHint}>
            {userStats.pointsToNextLevel > 0
              ? `${userStats.pointsToNextLevel.toLocaleString()} points to next tier`
              : "Max level reached!"}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Card.Body style={styles.statCardBody}>
              <View style={[styles.statIcon, { backgroundColor: "#D1FAE5" }]}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{userStats.totalVotes}</Text>
              <Text style={styles.statLabel}>CONFIRMATIONS</Text>
            </Card.Body>
          </Card>

          <Card style={styles.statCard}>
            <Card.Body style={styles.statCardBody}>
              <View style={[styles.statIcon, { backgroundColor: "#DBEAFE" }]}>
                <HugeiconsIcon icon={Target02Icon} size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{userStats.accuracyPercent}%</Text>
              <Text style={styles.statLabel}>ACCURACY SCORE</Text>
            </Card.Body>
          </Card>
        </View>

        {/* How Trust Points Work */}
        <Card style={styles.infoCard}>
          <Card.Body style={styles.infoCardBody}>
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
          </Card.Body>
        </Card>

        {/* My Badges */}
        <View style={styles.badgesSection}>
          <View style={styles.badgesHeader}>
            <Text style={styles.badgesTitle}>🏆 My Badges</Text>
            <TouchableOpacity onPress={() => router.push("/badges")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {activeBadges.length > 0 ? (
            <View style={styles.badgesRow}>
              {activeBadges.map((badge) => (
                <View key={badge.badgeId} style={styles.badgeItem}>
                  <View style={styles.badgeIcon}>
                    <Text style={styles.badgeEmoji}>
                      {BADGE_ICONS[badge.icon] || "🏅"}
                    </Text>
                  </View>
                  <Text style={styles.badgeName} numberOfLines={1}>
                    {badge.name.split(" ")[0]}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noBadges}>
              <Text style={styles.noBadgesText}>
                Start validating hazards to earn badges!
              </Text>
            </View>
          )}
        </View>

        {/* Weekly Activity */}
        <Card style={styles.weeklyCard}>
          <Card.Body style={styles.weeklyCardBody}>
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
              <Text style={styles.weeklyHint}>
                {userStats.votesThisWeek >= userStats.weeklyMinVotes
                  ? "✅ You've met your weekly minimum!"
                  : `⚠️ ${userStats.weeklyMinVotes - userStats.votesThisWeek} more votes needed to maintain your level`}
              </Text>
            )}
          </Card.Body>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
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
  headerButton: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  levelSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  badgeContainer: {
    marginBottom: 12,
  },
  shieldGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  shieldInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  shieldIcon: {
    fontSize: 36,
  },
  levelPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  levelPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  percentileText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: "#6B7280",
    minWidth: 60,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  statCardBody: {
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
  },
  infoCardBody: {
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  infoStep: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  badgesSection: {
    marginBottom: 16,
  },
  badgesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badgesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  badgesRow: {
    flexDirection: "row",
    gap: 12,
  },
  badgeItem: {
    alignItems: "center",
    width: 70,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },
  noBadges: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  noBadgesText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  weeklyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  weeklyCardBody: {
    padding: 16,
  },
  weeklyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  weeklyStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  weeklyStat: {
    alignItems: "center",
  },
  weeklyValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  weeklyLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  weeklyDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  weeklyHint: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
});
