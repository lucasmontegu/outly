import { useRouter } from "expo-router";
import {
  Cancel01Icon,
  SparklesIcon,
  Calendar02Icon,
  ShieldKeyIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
} from "react-native-reanimated";
import {
  useOfferings,
  usePurchase,
  useRestorePurchases,
} from "@/hooks/useSubscription";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

type PricingPlan = "monthly" | "yearly";

const features = [
  {
    icon: SparklesIcon,
    title: "Smart Departure Advisor",
    description: "Leave at the perfect time. Save 2.5 hours weekly.",
    gradient: [colors.state.info, colors.brand.secondary],
  },
  {
    icon: Calendar02Icon,
    title: "7-Day Risk Forecast",
    description: "Plan ahead with predictive weather and traffic intel.",
    gradient: [colors.state.success, colors.risk.low.dark],
  },
  {
    icon: ShieldKeyIcon,
    title: "Priority Safety Alerts",
    description: "Get instant notifications before conditions worsen.",
    gradient: [colors.state.warning, colors.risk.medium.dark],
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>("yearly");

  const { monthlyPackage, yearlyPackage, isLoading } = useOfferings();
  const { purchase, isPurchasing } = usePurchase();
  const { restore, isRestoring } = useRestorePurchases();

  // Animated values for interactions
  const ctaScale = useSharedValue(1);

  const monthlyPrice = monthlyPackage?.product.priceString || "$4.99";
  const yearlyPrice = yearlyPackage?.product.priceString || "$29.99";
  const yearlyMonthlyPrice = yearlyPackage
    ? `$${(parseFloat(String(yearlyPackage.product.price)) / 12).toFixed(2)}`
    : "$2.49";

  // Calculate savings percentage
  const savingsPercentage = monthlyPackage && yearlyPackage
    ? Math.round(
        (1 - parseFloat(String(yearlyPackage.product.price)) / (parseFloat(String(monthlyPackage.product.price)) * 12)) * 100
      )
    : 50;

  const handlePlanSelect = (plan: PricingPlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(plan);
  };

  const handleStartTrial = async () => {
    // Haptic feedback and button animation
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ctaScale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );

    const selectedPackage =
      selectedPlan === "yearly" ? yearlyPackage : monthlyPackage;

    if (!selectedPackage) {
      Alert.alert(
        "Unavailable",
        "Could not load subscription options. Please check your connection and try again.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    const result = await purchase(selectedPackage);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Welcome to Outia Pro!",
        "You now have access to all premium features.",
        [
          {
            text: "Get Started",
            style: "default",
            onPress: () => router.back(),
          },
        ]
      );
    } else if (result.cancelled) {
      // User cancelled - do nothing, just return silently
      return;
    } else if (result.errorMessage) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Purchase Failed", result.errorMessage, [
        { text: "OK", style: "default" },
      ]);
    }
  };

  const handleRestorePurchases = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await restore();
    if (result.success && result.hadActivePurchases) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Restored Successfully",
        "Your subscription has been restored.",
        [
          {
            text: "Continue",
            style: "default",
            onPress: () => router.back(),
          },
        ]
      );
    } else if (result.success && !result.hadActivePurchases) {
      Alert.alert(
        "No Subscriptions Found",
        "We couldn't find any active subscriptions for this account.",
        [{ text: "OK", style: "default" }]
      );
    } else if (result.errorMessage) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Restore Failed", result.errorMessage, [
        { text: "OK", style: "default" },
      ]);
    }
  };

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const isDisabled = isPurchasing || isRestoring || isLoading;

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[colors.slate[900], colors.background.darkSecondary, colors.background.darkTertiary]}
        style={styles.backgroundGradient}
      />

      {/* Close Button */}
      <SafeAreaView style={styles.closeContainer} edges={["top"]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={24}
            color="rgba(255,255,255,0.6)"
          />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Hero Section */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(100)}
          style={styles.heroSection}
        >
          {/* Pro Badge */}
          <View style={styles.proBadge}>
            <Text style={styles.proIcon}>👑</Text>
            <Text style={styles.proBadgeText}>OUTIA PRO</Text>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>Never Miss the Perfect Window</Text>
          <Text style={styles.subheadline}>
            Join 2,400+ commuters who save time and stress every single day.
          </Text>

          {/* Social Proof */}
          <View style={styles.socialProof}>
            <View style={styles.starsContainer}>
              <Text style={styles.stars}>⭐⭐⭐⭐⭐</Text>
            </View>
            <Text style={styles.socialProofText}>4.9 from 2,400+ users</Text>
          </View>
        </Animated.View>

        {/* Features Section */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(200)}
          style={styles.featuresSection}
        >
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <LinearGradient
                colors={[feature.gradient[0], feature.gradient[1], "transparent"] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureGradient}
              />
              <View style={styles.featureIconContainer}>
                <HugeiconsIcon
                  icon={feature.icon}
                  size={24}
                  color={colors.text.inverse}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Pricing Section */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(300)}
          style={styles.pricingSection}
        >
          <Text style={styles.pricingSectionTitle}>Choose Your Plan</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.state.info} />
              <Text style={styles.loadingText}>Loading plans...</Text>
            </View>
          ) : (
            <View style={styles.pricingCards}>
              {/* Yearly Plan - Highlighted */}
              <Pressable
                onPress={() => handlePlanSelect("yearly")}
                disabled={isDisabled}
                style={styles.pricingCardWrapper}
              >
                <Animated.View
                  style={[
                    styles.pricingCard,
                    styles.pricingCardYearly,
                    selectedPlan === "yearly" && styles.pricingCardSelected,
                  ]}
                >
                  {/* Save Badge */}
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>
                      SAVE {savingsPercentage}%
                    </Text>
                  </View>

                  {/* Selection Indicator */}
                  <View style={styles.pricingCardHeader}>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedPlan === "yearly" && styles.radioOuterSelected,
                      ]}
                    >
                      {selectedPlan === "yearly" && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.pricingLabel}>Yearly</Text>
                  </View>

                  <View style={styles.pricingPriceSection}>
                    <Text style={styles.pricingValue}>{yearlyPrice}</Text>
                    <Text style={styles.pricingSubtext}>
                      {yearlyMonthlyPrice} / month
                    </Text>
                  </View>

                  <View style={styles.pricingBenefits}>
                    <View style={styles.benefit}>
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={16}
                        color={colors.state.success}
                      />
                      <Text style={styles.benefitText}>Best value</Text>
                    </View>
                    <View style={styles.benefit}>
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={16}
                        color={colors.state.success}
                      />
                      <Text style={styles.benefitText}>
                        {savingsPercentage}% savings vs monthly
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              </Pressable>

              {/* Monthly Plan */}
              <Pressable
                onPress={() => handlePlanSelect("monthly")}
                disabled={isDisabled}
                style={styles.pricingCardWrapper}
              >
                <Animated.View
                  style={[
                    styles.pricingCard,
                    selectedPlan === "monthly" && styles.pricingCardSelected,
                  ]}
                >
                  <View style={styles.pricingCardHeader}>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedPlan === "monthly" && styles.radioOuterSelected,
                      ]}
                    >
                      {selectedPlan === "monthly" && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.pricingLabel}>Monthly</Text>
                  </View>

                  <View style={styles.pricingPriceSection}>
                    <Text style={styles.pricingValue}>{monthlyPrice}</Text>
                    <Text style={styles.pricingSubtext}>per month</Text>
                  </View>

                  <View style={styles.pricingBenefits}>
                    <View style={styles.benefit}>
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={16}
                        color={colors.state.success}
                      />
                      <Text style={styles.benefitText}>Flexible billing</Text>
                    </View>
                  </View>
                </Animated.View>
              </Pressable>
            </View>
          )}

          {/* Trial Info */}
          <View style={styles.trialInfo}>
            <View style={styles.trialBullet}>
              <Text style={styles.trialCheckmark}>✓</Text>
              <Text style={styles.trialText}>7-day free trial included</Text>
            </View>
            <View style={styles.trialBullet}>
              <Text style={styles.trialCheckmark}>✓</Text>
              <Text style={styles.trialText}>
                Cancel anytime before trial ends
              </Text>
            </View>
            <View style={styles.trialBullet}>
              <Text style={styles.trialCheckmark}>✓</Text>
              <Text style={styles.trialText}>
                Reminder 24 hours before billing
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Spacer for bottom CTA */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <SafeAreaView style={styles.bottomCta} edges={["bottom"]}>
        <LinearGradient
          colors={["transparent", "rgba(15, 23, 42, 0.95)", colors.slate[900]]}
          style={styles.bottomCtaGradient}
        />

        <Animated.View style={[styles.ctaContainer, ctaAnimatedStyle]}>
          <Button
            size="lg"
            className="w-full h-14 rounded-xl"
            onPress={handleStartTrial}
            isDisabled={isDisabled}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              "Start 7-Day Free Trial"
            )}
          </Button>
        </Animated.View>

        <Text style={styles.disclaimerText}>
          Recurring billing. Cancel anytime in settings.
        </Text>

        {/* Trust Signals */}
        <View style={styles.trustSignals}>
          <View style={styles.trustSignal}>
            <Text style={styles.trustEmoji}>🔒</Text>
            <Text style={styles.trustText}>Secure Payment</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustSignal}>
            <Text style={styles.trustEmoji}>⚡</Text>
            <Text style={styles.trustText}>Instant Access</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustSignal}>
            <Text style={styles.trustEmoji}>💯</Text>
            <Text style={styles.trustText}>Money Back</Text>
          </View>
        </View>

        {/* Restore Purchases Link */}
        <TouchableOpacity
          onPress={handleRestorePurchases}
          disabled={isDisabled}
          style={styles.restoreButton}
          activeOpacity={0.7}
        >
          <Text style={styles.restoreButtonText}>
            {isRestoring ? "Restoring..." : "Already subscribed? Restore purchases"}
          </Text>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },

  // Hero Section
  heroSection: {
    marginBottom: spacing[8],
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
    paddingHorizontal: 14,
    paddingVertical: spacing[2],
    borderRadius: borderRadius["2xl"],
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  proIcon: {
    fontSize: typography.size.lg,
  },
  proBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.state.info,
    letterSpacing: 1,
  },
  headline: {
    fontSize: 34,
    fontWeight: typography.weight.extrabold,
    color: colors.text.inverse,
    lineHeight: 42,
    marginBottom: spacing[3],
  },
  subheadline: {
    fontSize: 17,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 26,
  },
  socialProof: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: spacing[5],
  },
  starsContainer: {
    flexDirection: "row",
  },
  stars: {
    fontSize: typography.size.base,
    letterSpacing: 2,
  },
  socialProofText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: "rgba(255,255,255,0.7)",
  },

  // Features Section
  featuresSection: {
    gap: spacing[4],
    marginBottom: spacing[10],
  },
  featureCard: {
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  featureGradient: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "40%",
    opacity: 0.15,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  featureContent: {
    gap: 4,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: typography.size.base,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 20,
  },

  // Pricing Section
  pricingSection: {
    marginBottom: spacing[6],
  },
  pricingSectionTitle: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    textAlign: "center",
    marginBottom: spacing[5],
  },
  pricingCards: {
    gap: spacing[3],
  },
  pricingCardWrapper: {
    width: "100%",
  },
  pricingCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    position: "relative",
  },
  pricingCardYearly: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  pricingCardSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderColor: colors.state.info,
    shadowColor: colors.state.info,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBadge: {
    position: "absolute",
    top: -8,
    right: spacing[4],
    backgroundColor: colors.state.warning,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    shadowColor: colors.state.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  saveBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.extrabold,
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  pricingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: colors.state.info,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.state.info,
  },
  pricingLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  pricingPriceSection: {
    marginBottom: spacing[3],
  },
  pricingValue: {
    fontSize: 36,
    fontWeight: typography.weight.extrabold,
    color: colors.text.inverse,
    lineHeight: 40,
  },
  pricingSubtext: {
    fontSize: typography.size.base,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  pricingBenefits: {
    gap: spacing[2],
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  benefitText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: typography.weight.medium,
  },

  // Trial Info
  trialInfo: {
    marginTop: spacing[6],
    gap: 10,
    paddingHorizontal: spacing[2],
  },
  trialBullet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  trialCheckmark: {
    fontSize: typography.size.lg,
    color: colors.state.success,
    fontWeight: typography.weight.bold,
  },
  trialText: {
    fontSize: typography.size.base,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 20,
  },

  // Bottom CTA
  bottomSpacer: {
    height: 220,
  },
  bottomCta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
  },
  bottomCtaGradient: {
    position: "absolute",
    top: -60,
    left: 0,
    right: 0,
    height: 60,
  },
  ctaContainer: {
    width: "100%",
  },
  disclaimerText: {
    fontSize: typography.size.sm,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: spacing[3],
    lineHeight: 16,
  },
  trustSignals: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
  },
  trustSignal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trustEmoji: {
    fontSize: typography.size.sm,
  },
  trustText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: "rgba(255,255,255,0.6)",
  },
  trustDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: spacing[3],
  },
  restoreButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginTop: spacing[2],
    alignItems: "center",
  },
  restoreButtonText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    textDecorationLine: "underline",
  },

  // Loading State
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: spacing[4],
  },
  loadingText: {
    fontSize: typography.size.base,
    color: "rgba(255,255,255,0.6)",
    fontWeight: typography.weight.medium,
  },
});
