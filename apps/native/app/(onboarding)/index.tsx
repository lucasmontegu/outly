import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import {
  CloudIcon,
  Car01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from '@hugeicons/react-native'
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function OnboardingStep1() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Hero Image Placeholder */}
      <View style={styles.imageContainer}>
        <LinearGradient
          colors={["#94A3B8", "#64748B"]}
          style={styles.heroImage}
        >
          <View style={styles.heroOverlay}>
            <HugeiconsIcon icon={CloudIcon} size={64} color="rgba(255,255,255,0.3)" />
          </View>
        </LinearGradient>
      </View>

      {/* Problem Badge */}
      <View style={styles.problemBadge}>
        <View style={styles.warningIcon}>
          <Text style={styles.warningEmoji}>⚠️</Text>
        </View>
        <View>
          <Text style={styles.problemLabel}>THE PROBLEM</Text>
          <Text style={styles.problemText}>Navigation apps ignore weather.</Text>
        </View>
      </View>

      {/* Weather/Traffic Icons */}
      <View style={styles.iconRow}>
        <View style={styles.iconItem}>
          <HugeiconsIcon icon={CloudIcon} size={24} color="#6B7280" />
          <Text style={styles.iconLabel}>Weather</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.iconItem}>
          <HugeiconsIcon icon={Car01Icon} size={24} color="#6B7280" />
          <Text style={styles.iconLabel}>Traffic</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Stop guessing.{"\n"}Start knowing.</Text>
        <Text style={styles.description}>
          Outly combines weather, traffic, and community signals into a single{" "}
          <Text style={styles.highlight}>Risk Score</Text> so you decide{" "}
          <Text style={styles.italic}>when</Text> to move.
        </Text>
      </View>

      {/* CTA Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          style={styles.button}
          onPress={() => router.push("/(onboarding)/step-2")}
        >
          See How It Works
        </Button>
        <View style={styles.pagination}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
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
    height: 280,
    width: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  heroOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  problemBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    marginHorizontal: 24,
    marginTop: -40,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  warningIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  warningEmoji: {
    fontSize: 20,
  },
  problemLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#EF4444",
    letterSpacing: 0.5,
  },
  problemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginTop: 2,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    gap: 32,
  },
  iconItem: {
    alignItems: "center",
    gap: 4,
  },
  iconLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginTop: 16,
  },
  highlight: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  italic: {
    fontStyle: "italic",
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
