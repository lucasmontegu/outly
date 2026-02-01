import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import {
  CheckmarkCircle02Icon,
  UserGroupIcon,
  MapsIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function OnboardingStep2() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Hero Image with floating badges */}
      <View style={styles.imageContainer}>
        <LinearGradient
          colors={["#E2E8F0", "#CBD5E1"]}
          style={styles.heroImage}
        >
          <HugeiconsIcon icon={MapsIcon} size={80} color="rgba(100,116,139,0.3)" />
        </LinearGradient>

        {/* Floating Badges */}
        <View style={[styles.badge, styles.badgeVerified]}>
          <View style={styles.badgeIcon}>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color="#10B981" />
          </View>
          <View>
            <Text style={styles.badgeLabel}>VERIFIED</Text>
            <Text style={styles.badgeText}>Road Cleared</Text>
          </View>
        </View>

        <View style={[styles.badge, styles.badgeNoaa]}>
          <View style={[styles.badgeIcon, styles.badgeIconBlue]}>
            <Text style={styles.badgeEmoji}>⛈️</Text>
          </View>
          <View>
            <Text style={[styles.badgeLabel, styles.badgeLabelBlue]}>NOAA DATA</Text>
            <Text style={styles.badgeText}>Storm Alert</Text>
          </View>
        </View>

        <View style={[styles.badge, styles.badgeCommunity]}>
          <View style={[styles.badgeIcon, styles.badgeIconOrange]}>
            <HugeiconsIcon icon={UserGroupIcon} size={16} color="#F97316" />
          </View>
          <View>
            <Text style={[styles.badgeLabel, styles.badgeLabelOrange]}>COMMUNITY</Text>
            <Text style={styles.badgeText}>Fog Reported</Text>
          </View>
        </View>
      </View>

      {/* Data Source Pills */}
      <View style={styles.pillRow}>
        <View style={styles.pill}>
          <View style={styles.pillDot} />
          <Text style={styles.pillText}>Official Data</Text>
        </View>
        <View style={styles.pill}>
          <HugeiconsIcon icon={UserGroupIcon} size={14} color="#6B7280" />
          <Text style={styles.pillText}>Real Drivers</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Powered by Everyone</Text>
        <Text style={styles.description}>
          Outly blends official meteorological data with real-time confirmations
          from drivers like you. Trustworthy signals, zero noise.
        </Text>
      </View>

      {/* CTA Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          style={styles.button}
          onPress={() => router.push("/(onboarding)/step-3")}
        >
          Next
        </Button>
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  imageContainer: {
    height: 320,
    width: "100%",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeVerified: {
    top: 60,
    left: 30,
  },
  badgeNoaa: {
    top: 110,
    right: 20,
  },
  badgeCommunity: {
    top: 200,
    left: 50,
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIconBlue: {
    backgroundColor: "#DBEAFE",
  },
  badgeIconOrange: {
    backgroundColor: "#FED7AA",
  },
  badgeEmoji: {
    fontSize: 16,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#10B981",
    letterSpacing: 0.5,
  },
  badgeLabelBlue: {
    color: "#3B82F6",
  },
  badgeLabelOrange: {
    color: "#F97316",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
  pillRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    gap: 16,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6B7280",
  },
  pillText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 24,
    marginTop: 12,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    backgroundColor: "#111827",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  dotActive: {
    backgroundColor: "#111827",
  },
});
