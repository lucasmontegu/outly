import { useState } from "react";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ScreenHeader } from "@/components/screen-header";
import { colors, spacing, typography, shadows } from "@/lib/design-tokens";

// Badge emoji mapping
const BADGE_EMOJIS: Record<string, string> = {
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

// Category colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  milestone: { label: "Milestones", color: "#F59E0B", bg: "#FEF3C7" },
  accuracy: { label: "Accuracy", color: "#3B82F6", bg: "#DBEAFE" },
  streak: { label: "Streaks", color: "#EF4444", bg: "#FEE2E2" },
  special: { label: "Special", color: "#8B5CF6", bg: "#EDE9FE" },
};

type Badge = {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  earned: boolean;
  earnedAt?: number;
};

type CategoryFilter = "all" | "milestone" | "accuracy" | "streak" | "special";

export default function BadgesScreen() {
  const router = useRouter();
  const allBadges = useQuery(api.gamification.getAllBadges);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  if (allBadges === undefined) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Badge Collection" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.secondary} />
          <Text style={styles.loadingText}>Loading badges...</Text>
        </View>
      </View>
    );
  }

  const earnedCount = allBadges.filter((b) => b.earned).length;
  const totalCount = allBadges.length;

  // Filter badges by category
  const filteredBadges = selectedCategory === "all"
    ? allBadges
    : allBadges.filter((b) => b.category === selectedCategory);

  // Group badges by category for display
  const categoryOrder: CategoryFilter[] = ["all", "milestone", "accuracy", "streak", "special"];

  const handleBadgePress = (badge: Badge) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBadge(badge);
  };

  const handleCategoryPress = (category: CategoryFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Badge Collection" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Summary Card */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Text style={styles.summaryEmoji}>trophy</Text>
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>
              {earnedCount} of {totalCount} Badges
            </Text>
            <Text style={styles.summarySubtitle}>
              {earnedCount === totalCount
                ? "Collection complete!"
                : `${totalCount - earnedCount} more to collect`}
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
        </Animated.View>

        {/* Category Filter */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilterContainer}
          >
            {categoryOrder.map((category) => {
              const isActive = selectedCategory === category;
              const config = category === "all"
                ? { label: "All", color: colors.brand.secondary, bg: colors.brand.secondary + "15" }
                : CATEGORY_CONFIG[category];

              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryPill,
                    isActive && { backgroundColor: config.color },
                  ]}
                  onPress={() => handleCategoryPress(category)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isActive && styles.categoryPillTextActive,
                      !isActive && { color: config.color },
                    ]}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Badges Grid */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.badgesGrid}>
          {filteredBadges.map((badge, index) => {
            const config = CATEGORY_CONFIG[badge.category];
            return (
              <TouchableOpacity
                key={badge.badgeId}
                style={[
                  styles.badgeCard,
                  !badge.earned && styles.badgeCardLocked,
                ]}
                onPress={() => handleBadgePress(badge)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.badgeIconContainer,
                    { backgroundColor: badge.earned ? config.bg : colors.slate[100] },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeEmoji,
                      !badge.earned && styles.badgeEmojiLocked,
                    ]}
                  >
                    {BADGE_EMOJIS[badge.icon] || "medal"}
                  </Text>
                  {!badge.earned && (
                    <View style={styles.lockOverlay}>
                      <Text style={styles.lockIcon}>lock</Text>
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
                <View
                  style={[
                    styles.badgePointsBadge,
                    { backgroundColor: badge.earned ? config.bg : colors.slate[100] },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgePointsText,
                      { color: badge.earned ? config.color : colors.text.tertiary },
                    ]}
                  >
                    +{badge.points} pts
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Legend */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.legendCard}>
          <Text style={styles.legendTitle}>Badge Categories</Text>
          <View style={styles.legendItems}>
            {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
              <View key={category} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: config.color }]} />
                <Text style={styles.legendText}>
                  {config.label}
                  {category === "streak" && " (can be lost)"}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: spacing[10] }} />
      </ScrollView>

      {/* Badge Detail Modal */}
      <Modal
        visible={selectedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedBadge(null)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedBadge && (
              <Animated.View entering={FadeIn.duration(200)}>
                <View
                  style={[
                    styles.modalBadgeIcon,
                    {
                      backgroundColor: selectedBadge.earned
                        ? CATEGORY_CONFIG[selectedBadge.category].bg
                        : colors.slate[100],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalBadgeEmoji,
                      !selectedBadge.earned && styles.badgeEmojiLocked,
                    ]}
                  >
                    {BADGE_EMOJIS[selectedBadge.icon] || "medal"}
                  </Text>
                </View>

                <Text style={styles.modalBadgeName}>{selectedBadge.name}</Text>

                <View
                  style={[
                    styles.modalCategoryBadge,
                    { backgroundColor: CATEGORY_CONFIG[selectedBadge.category].bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalCategoryText,
                      { color: CATEGORY_CONFIG[selectedBadge.category].color },
                    ]}
                  >
                    {CATEGORY_CONFIG[selectedBadge.category].label}
                  </Text>
                </View>

                <Text style={styles.modalDescription}>{selectedBadge.description}</Text>

                <View style={styles.modalPointsRow}>
                  <Text style={styles.modalPointsLabel}>Points</Text>
                  <Text style={styles.modalPointsValue}>+{selectedBadge.points}</Text>
                </View>

                {selectedBadge.earned && selectedBadge.earnedAt && (
                  <View style={styles.modalEarnedBadge}>
                    <Text style={styles.modalEarnedText}>
                      Earned on {new Date(selectedBadge.earnedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {!selectedBadge.earned && (
                  <View style={styles.modalLockedBadge}>
                    <Text style={styles.modalLockedText}>
                      Keep contributing to unlock this badge!
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedBadge(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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

  // Summary Card
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing[5],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    marginBottom: spacing[4],
    ...shadows.md,
  },
  summaryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryEmoji: {
    fontSize: 32,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  summarySubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  summaryProgress: {
    height: 8,
    backgroundColor: colors.slate[200],
    borderRadius: 4,
    overflow: "hidden",
  },
  summaryProgressFill: {
    height: "100%",
    backgroundColor: colors.state.success,
    borderRadius: 4,
  },

  // Category Filter
  categoryFilterContainer: {
    paddingHorizontal: spacing[1],
    paddingBottom: spacing[4],
    gap: spacing[2],
  },
  categoryPill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    borderRadius: 20,
    backgroundColor: colors.slate[100],
    marginRight: spacing[2],
  },
  categoryPillText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  categoryPillTextActive: {
    color: colors.text.inverse,
  },

  // Badges Grid
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  badgeCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing[4],
    alignItems: "center",
    ...shadows.sm,
  },
  badgeCardLocked: {
    opacity: 0.75,
  },
  badgeIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
    position: "relative",
  },
  badgeEmoji: {
    fontSize: 36,
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
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing[2],
    minHeight: 40,
  },
  badgeNameLocked: {
    color: colors.text.tertiary,
  },
  badgePointsBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePointsText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },

  // Legend
  legendCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing[5],
    marginTop: spacing[4],
    ...shadows.sm,
  },
  legendTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  legendItems: {
    gap: spacing[2],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: spacing[6],
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    ...shadows.xl,
  },
  modalBadgeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
  },
  modalBadgeEmoji: {
    fontSize: 48,
  },
  modalBadgeName: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing[2],
  },
  modalCategoryBadge: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  modalCategoryText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  modalDescription: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  modalPointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  modalPointsLabel: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
  modalPointsValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gamification.gold,
  },
  modalEarnedBadge: {
    backgroundColor: colors.risk.low.light,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  modalEarnedText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.risk.low.dark,
  },
  modalLockedBadge: {
    backgroundColor: colors.slate[100],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  modalLockedText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    textAlign: "center",
  },
  modalCloseButton: {
    backgroundColor: colors.brand.secondary,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[3],
    borderRadius: 12,
  },
  modalCloseText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
});
