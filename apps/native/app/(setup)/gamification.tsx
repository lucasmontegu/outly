import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import {
  UserGroupIcon,
  Award01Icon,
  FlashIcon,
  Target02Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

// Badge previews to show what users can earn
const PREVIEW_BADGES = [
  { id: "first_steps", emoji: "🎯", name: "First Steps", desc: "Your first 5 votes" },
  { id: "sharp_eye", emoji: "👁️", name: "Sharp Eye", desc: "85% accuracy" },
  { id: "weekly_warrior", emoji: "🔥", name: "Weekly Warrior", desc: "7-day streak" },
  { id: "storm_chaser", emoji: "⛈️", name: "Storm Chaser", desc: "50 weather votes" },
];

// Level tiers preview
const LEVEL_PREVIEW = [
  { level: 1, title: "Newcomer", color: "#9CA3AF" },
  { level: 3, title: "Route Guardian", color: "#3B82F6" },
  { level: 5, title: "Traffic Sentinel", color: "#8B5CF6" },
  { level: 7, title: "Community Legend", color: "#F59E0B" },
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
      // Still navigate even if error
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <LinearGradient
              colors={["#FEF3C7", "#FDE68A"]}
              style={styles.iconGlow}
            />
            <HugeiconsIcon icon={Award01Icon} size={48} color="#F59E0B" />
          </View>
          <Text style={styles.title}>You're Part of Something Bigger</Text>
          <Text style={styles.description}>
            Your reports help other drivers stay safe. The more you participate, the more you earn.
          </Text>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it works</Text>

          <View style={styles.stepCard}>
            <View style={[styles.stepIcon, { backgroundColor: "#DBEAFE" }]}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} color="#3B82F6" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Vote on Events</Text>
              <Text style={styles.stepDesc}>
                Confirm or dismiss weather and traffic events you see
              </Text>
            </View>
            <View style={styles.stepPoints}>
              <Text style={styles.pointsValue}>+5</Text>
              <Text style={styles.pointsLabel}>pts</Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={[styles.stepIcon, { backgroundColor: "#D1FAE5" }]}>
              <HugeiconsIcon icon={FlashIcon} size={24} color="#10B981" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Be First</Text>
              <Text style={styles.stepDesc}>
                First to report? Earn bonus points as a First Responder
              </Text>
            </View>
            <View style={styles.stepPoints}>
              <Text style={styles.pointsValue}>+10</Text>
              <Text style={styles.pointsLabel}>bonus</Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={[styles.stepIcon, { backgroundColor: "#E9D5FF" }]}>
              <HugeiconsIcon icon={Target02Icon} size={24} color="#8B5CF6" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Be Accurate</Text>
              <Text style={styles.stepDesc}>
                Match community consensus for extra accuracy points
              </Text>
            </View>
            <View style={styles.stepPoints}>
              <Text style={styles.pointsValue}>+15</Text>
              <Text style={styles.pointsLabel}>bonus</Text>
            </View>
          </View>
        </View>

        {/* Levels Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Climb the ranks</Text>
          <View style={styles.levelsRow}>
            {LEVEL_PREVIEW.map((level, index) => (
              <View key={level.level} style={styles.levelItem}>
                <View style={[styles.levelCircle, { borderColor: level.color }]}>
                  <Text style={[styles.levelNumber, { color: level.color }]}>
                    {level.level}
                  </Text>
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
        </View>

        {/* Badges Preview */}
        <View style={styles.section}>
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
        </View>

        {/* Community Impact */}
        <View style={styles.impactCard}>
          <HugeiconsIcon icon={UserGroupIcon} size={28} color="#10B981" />
          <View style={styles.impactContent}>
            <Text style={styles.impactTitle}>Your Impact Matters</Text>
            <Text style={styles.impactDesc}>
              Every vote improves risk scores for thousands of drivers in your area.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          style={styles.button}
          onPress={handleStart}
          isDisabled={isLoading}
        >
          {isLoading ? "Starting..." : "Start Using Outly"}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  headerIcon: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    lineHeight: 32,
  },
  description: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginTop: 12,
    textAlign: "center",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  stepDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  stepPoints: {
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
  },
  pointsLabel: {
    fontSize: 10,
    color: "#9CA3AF",
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
    backgroundColor: "#fff",
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  levelTitle: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },
  youAreBadge: {
    position: "absolute",
    top: -8,
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youAreText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeCard: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  badgeDesc: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
    textAlign: "center",
  },
  moreBadges: {
    fontSize: 12,
    color: "#8B5CF6",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 12,
  },
  impactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  impactContent: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#065F46",
  },
  impactDesc: {
    fontSize: 13,
    color: "#047857",
    marginTop: 2,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    backgroundColor: "#111827",
  },
});
