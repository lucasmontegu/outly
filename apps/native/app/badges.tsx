import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
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

// Category colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  milestone: { label: "Milestones", color: "#F59E0B", bg: "#FEF3C7" },
  accuracy: { label: "Accuracy", color: "#3B82F6", bg: "#DBEAFE" },
  streak: { label: "Streaks", color: "#EF4444", bg: "#FEE2E2" },
  special: { label: "Special", color: "#8B5CF6", bg: "#EDE9FE" },
};

export default function BadgesScreen() {
  const router = useRouter();
  const allBadges = useQuery(api.gamification.getAllBadges);

  if (allBadges === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading badges...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Group badges by category
  const badgesByCategory: Record<string, typeof allBadges> = {};
  for (const badge of allBadges) {
    if (!badgesByCategory[badge.category]) {
      badgesByCategory[badge.category] = [];
    }
    badgesByCategory[badge.category].push(badge);
  }

  const earnedCount = allBadges.filter((b) => b.earned).length;
  const totalCount = allBadges.length;

  const categoryOrder = ["milestone", "accuracy", "streak", "special"];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Badge Collection</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Progress Summary */}
        <Card style={styles.summaryCard}>
          <Card.Body style={styles.summaryCardBody}>
            <Text style={styles.summaryEmoji}>🏆</Text>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>
                {earnedCount} of {totalCount} Badges Earned
              </Text>
              <View style={styles.summaryProgress}>
                <View
                  style={[
                    styles.summaryProgressFill,
                    { width: `${(earnedCount / totalCount) * 100}%` },
                  ]}
                />
              </View>
            </View>
          </Card.Body>
        </Card>

        {/* Badge Categories */}
        {categoryOrder.map((category) => {
          const badges = badgesByCategory[category];
          if (!badges || badges.length === 0) return null;

          const config = CATEGORY_CONFIG[category];

          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryDot, { backgroundColor: config.color }]} />
                <Text style={styles.categoryTitle}>{config.label}</Text>
                <Text style={styles.categoryCount}>
                  {badges.filter((b) => b.earned).length}/{badges.length}
                </Text>
              </View>

              <View style={styles.badgesGrid}>
                {badges.map((badge) => (
                  <View
                    key={badge.badgeId}
                    style={[
                      styles.badgeCard,
                      !badge.earned && styles.badgeCardLocked,
                    ]}
                  >
                    <View
                      style={[
                        styles.badgeIconContainer,
                        { backgroundColor: badge.earned ? config.bg : "#F3F4F6" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeEmoji,
                          !badge.earned && styles.badgeEmojiLocked,
                        ]}
                      >
                        {BADGE_ICONS[badge.icon] || "🏅"}
                      </Text>
                      {!badge.earned && (
                        <View style={styles.lockOverlay}>
                          <Text style={styles.lockIcon}>🔒</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.badgeName,
                        !badge.earned && styles.badgeNameLocked,
                      ]}
                      numberOfLines={2}
                    >
                      {badge.name}
                    </Text>
                    <Text
                      style={[
                        styles.badgeDescription,
                        !badge.earned && styles.badgeDescriptionLocked,
                      ]}
                      numberOfLines={2}
                    >
                      {badge.description}
                    </Text>
                    <View
                      style={[
                        styles.badgePoints,
                        { backgroundColor: badge.earned ? config.bg : "#F3F4F6" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgePointsText,
                          { color: badge.earned ? config.color : "#9CA3AF" },
                        ]}
                      >
                        +{badge.points} pts
                      </Text>
                    </View>
                    {badge.earned && badge.earnedAt && (
                      <Text style={styles.earnedDate}>
                        Earned {new Date(badge.earnedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {/* Legend */}
        <Card style={styles.legendCard}>
          <Card.Body style={styles.legendCardBody}>
            <Text style={styles.legendTitle}>Badge Types</Text>
            <View style={styles.legendItems}>
              {categoryOrder.map((category) => {
                const config = CATEGORY_CONFIG[category];
                return (
                  <View key={category} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: config.color }]} />
                    <Text style={styles.legendText}>
                      {config.label}
                      {category === "streak" && " (can be lost)"}
                    </Text>
                  </View>
                );
              })}
            </View>
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
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 24,
  },
  summaryCardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  summaryEmoji: {
    fontSize: 40,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  summaryProgress: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  summaryProgressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 4,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  categoryCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  badgeCardLocked: {
    opacity: 0.7,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
  },
  badgeEmoji: {
    fontSize: 32,
  },
  badgeEmojiLocked: {
    opacity: 0.3,
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: {
    fontSize: 20,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: "#9CA3AF",
  },
  badgeDescription: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 14,
  },
  badgeDescriptionLocked: {
    color: "#9CA3AF",
  },
  badgePoints: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePointsText: {
    fontSize: 11,
    fontWeight: "600",
  },
  earnedDate: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 8,
  },
  legendCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  legendCardBody: {
    padding: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  legendItems: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: "#6B7280",
  },
});
