import { useRouter } from "expo-router";
import {
  Cancel01Icon,
  SparklesIcon,
  Calendar02Icon,
  Car01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";

const { width } = Dimensions.get("window");

type PricingPlan = "monthly" | "yearly";

const features = [
  {
    icon: SparklesIcon,
    title: "Smart Departure Advisor",
    description: "Know the exact minute to leave to avoid 30%+ risk.",
  },
  {
    icon: Calendar02Icon,
    title: "7-Day Risk Forecast",
    description: "Plan your week with long-range weather/traffic probability.",
  },
  {
    icon: Car01Icon,
    title: "CarPlay Integration",
    description: "Risk alerts directly on your dashboard.",
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>("yearly");

  const handleStartTrial = () => {
    // Handle subscription
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#334155"]}
        style={styles.backgroundGradient}
      />

      {/* Close Button */}
      <SafeAreaView style={styles.closeContainer} edges={["top"]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={24} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Content */}
      <View style={styles.content}>
        {/* Pro Badge */}
        <View style={styles.proBadge}>
          <Text style={styles.proIcon}>👑</Text>
          <Text style={styles.proBadgeText}>OUTLY PRO</Text>
        </View>

        {/* Headline */}
        <Text style={styles.headline}>Predict the Unexpected.</Text>
        <Text style={styles.subheadline}>
          Unlock predictive risk analysis and smart scheduling to never get stuck again.
        </Text>

        {/* Features */}
        <View style={styles.features}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color="#10B981" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Options */}
        <View style={styles.pricingContainer}>
          {/* Monthly */}
          <TouchableOpacity
            style={[
              styles.pricingOption,
              selectedPlan === "monthly" && styles.pricingOptionSelected,
            ]}
            onPress={() => setSelectedPlan("monthly")}
          >
            <Text style={styles.pricingLabel}>Monthly</Text>
            <Text style={styles.pricingValue}>$4.99</Text>
          </TouchableOpacity>

          {/* Yearly */}
          <TouchableOpacity
            style={[
              styles.pricingOption,
              styles.pricingOptionYearly,
              selectedPlan === "yearly" && styles.pricingOptionSelected,
            ]}
            onPress={() => setSelectedPlan("yearly")}
          >
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE 50%</Text>
            </View>
            <Text style={styles.pricingLabel}>Yearly</Text>
            <Text style={styles.pricingValue}>$29.99</Text>
            <Text style={styles.pricingSubtext}>$2.49 / month</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom CTA */}
      <SafeAreaView style={styles.bottomCta} edges={["bottom"]}>
        <Button
          variant="primary"
          size="lg"
          style={styles.ctaButton}
          onPress={handleStartTrial}
        >
          Start 7-Day Free Trial
        </Button>
        <Text style={styles.disclaimerText}>
          Recurring billing. Cancel anytime in settings.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  closeContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginRight: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 24,
  },
  proIcon: {
    fontSize: 16,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 40,
  },
  subheadline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 24,
    marginTop: 12,
  },
  features: {
    marginTop: 32,
    gap: 20,
  },
  featureItem: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  featureDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
    lineHeight: 18,
  },
  pricingContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
  },
  pricingOption: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  pricingOptionYearly: {
    position: "relative",
  },
  pricingOptionSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderColor: "#3B82F6",
  },
  saveBadge: {
    position: "absolute",
    top: -10,
    right: 10,
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  pricingLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  pricingValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  pricingSubtext: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  bottomCta: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  ctaButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  disclaimerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 12,
  },
});
