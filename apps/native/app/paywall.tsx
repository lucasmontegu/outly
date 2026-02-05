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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
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
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";

type PricingPlan = "monthly" | "yearly";

const features = [
  {
    icon: SparklesIcon,
    title: "Smart Departure Alerts",
    description: "Get notified at the perfect time to leave",
  },
  {
    icon: Calendar02Icon,
    title: "Unlimited Routes",
    description: "Monitor all your daily commutes at once",
  },
  {
    icon: ShieldKeyIcon,
    title: "ETA Impact & History",
    description: "See delay in minutes + time saved weekly",
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>("yearly");

  const { monthlyPackage, yearlyPackage, isLoading } = useOfferings();
  const { purchase, isPurchasing } = usePurchase();
  const { restore, isRestoring } = useRestorePurchases();

  const ctaScale = useSharedValue(1);

  const monthlyPrice = monthlyPackage?.product.priceString || "$4.99";
  const yearlyPrice = yearlyPackage?.product.priceString || "$29.99";
  const yearlyMonthlyPrice = yearlyPackage
    ? `$${(parseFloat(String(yearlyPackage.product.price)) / 12).toFixed(2)}`
    : "$2.49";

  const savingsPercentage =
    monthlyPackage && yearlyPackage
      ? Math.round(
          (1 -
            parseFloat(String(yearlyPackage.product.price)) /
              (parseFloat(String(monthlyPackage.product.price)) * 12)) *
            100
        )
      : 50;

  const handlePlanSelect = (plan: PricingPlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(plan);
  };

  const handleStartTrial = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ctaScale.value = withSequence(
      withSpring(0.97, { damping: 15 }),
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
    <View style={[styles.container]}>
      {/* Header with Close Button */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          disabled={isDisabled}
          activeOpacity={0.7}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={24}
            color={colors.text.tertiary}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Pro Badge */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.proBadge}>
          <Text style={styles.proIcon}>👑</Text>
          <Text style={styles.proBadgeText}>OUTIA PRO</Text>
        </Animated.View>

        {/* Hero Text */}
        <Animated.View entering={FadeInUp.delay(150)}>
          <Text style={styles.headline}>Never Miss the{"\n"}Perfect Window</Text>
          <Text style={styles.subheadline}>
            Save 30+ minutes per week by leaving at the right time
          </Text>
        </Animated.View>

        {/* Value Proposition */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.valueProposition}>
          <Text style={styles.valuePropositionText}>Try free for 7 days. Cancel anytime.</Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInUp.delay(250)} style={styles.featuresSection}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <HugeiconsIcon
                  icon={feature.icon}
                  size={20}
                  color={colors.brand.secondary}
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
        <Animated.View entering={FadeInUp.delay(300)}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brand.secondary} />
              <Text style={styles.loadingText}>Loading plans…</Text>
            </View>
          ) : (
            <View style={styles.pricingCards}>
              {/* Yearly Plan */}
              <Pressable
                onPress={() => handlePlanSelect("yearly")}
                disabled={isDisabled}
                style={({ pressed }) => [
                  styles.pricingCard,
                  selectedPlan === "yearly" && styles.pricingCardSelected,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>
                    SAVE {savingsPercentage}%
                  </Text>
                </View>

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
                  <View style={styles.pricingInfo}>
                    <Text style={styles.pricingLabel}>Yearly</Text>
                    <Text style={styles.pricingSubtext}>
                      {yearlyMonthlyPrice}/month
                    </Text>
                  </View>
                  <Text style={styles.pricingValue}>{yearlyPrice}</Text>
                </View>
              </Pressable>

              {/* Monthly Plan */}
              <Pressable
                onPress={() => handlePlanSelect("monthly")}
                disabled={isDisabled}
                style={({ pressed }) => [
                  styles.pricingCard,
                  selectedPlan === "monthly" && styles.pricingCardSelected,
                  pressed && { opacity: 0.9 },
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
                  <View style={styles.pricingInfo}>
                    <Text style={styles.pricingLabel}>Monthly</Text>
                    <Text style={styles.pricingSubtext}>Flexible billing</Text>
                  </View>
                  <Text style={styles.pricingValue}>{monthlyPrice}</Text>
                </View>
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Trial Info */}
        <Animated.View entering={FadeInUp.delay(350)} style={styles.trialInfo}>
          <View style={styles.trialBullet}>
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={18}
              color={colors.state.success}
            />
            <Text style={styles.trialText}>7-day free trial included</Text>
          </View>
          <View style={styles.trialBullet}>
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={18}
              color={colors.state.success}
            />
            <Text style={styles.trialText}>Cancel anytime before trial ends</Text>
          </View>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View
          entering={FadeInUp.delay(400)}
          style={[styles.ctaContainer, ctaAnimatedStyle]}
        >
          <Button
            size="lg"
            className="w-full h-14 rounded-xl"
            onPress={handleStartTrial}
            isDisabled={isDisabled}
          >
            {isPurchasing ? "Processing…" : "Start 7-Day Free Trial"}
          </Button>
        </Animated.View>

        {/* Disclaimer */}
        <Animated.View entering={FadeInUp.delay(450)}>
          <Text style={styles.disclaimerText}>
            Recurring billing. Cancel anytime in settings.
          </Text>

          {/* Trust Signals */}
          <View style={styles.trustSignals}>
            <View style={styles.trustSignal}>
              <Text style={styles.trustEmoji}>🔒</Text>
              <Text style={styles.trustText}>Secure</Text>
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
              {isRestoring ? "Restoring…" : "Already subscribed? Restore"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  headerSpacer: {
    width: 44,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
  },

  // Pro Badge
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.brand.secondary + "15",
    borderWidth: 1,
    borderColor: colors.brand.secondary + "30",
    paddingHorizontal: 14,
    paddingVertical: spacing[2],
    borderRadius: borderRadius["2xl"],
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  proIcon: {
    fontSize: typography.size.md,
  },
  proBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.brand.secondary,
    letterSpacing: 1,
  },

  // Hero Text
  headline: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: "center",
    letterSpacing: typography.tracking.tight,
    lineHeight: 34,
  },
  subheadline: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing[2],
    lineHeight: 22,
  },

  // Value Proposition
  valueProposition: {
    alignItems: "center",
    marginTop: spacing[3],
    marginBottom: spacing[5],
  },
  valuePropositionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
  },

  // Features
  featuresSection: {
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.secondary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  featureDescription: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: 1,
  },

  // Pricing Cards
  pricingCards: {
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  pricingCard: {
    backgroundColor: colors.slate[50],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 2,
    borderColor: colors.slate[100],
    position: "relative",
  },
  pricingCardSelected: {
    backgroundColor: colors.brand.secondary + "08",
    borderColor: colors.brand.secondary,
  },
  saveBadge: {
    position: "absolute",
    top: -10,
    right: spacing[3],
    backgroundColor: colors.state.warning,
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: typography.weight.extrabold,
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  pricingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.slate[300],
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: colors.brand.secondary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brand.secondary,
  },
  pricingInfo: {
    flex: 1,
  },
  pricingLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  pricingSubtext: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: 1,
  },
  pricingValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },

  // Trial Info
  trialInfo: {
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  trialBullet: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  trialText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },

  // CTA
  ctaContainer: {
    width: "100%",
    marginBottom: spacing[3],
  },
  disclaimerText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    textAlign: "center",
    lineHeight: 16,
  },

  // Trust Signals
  trustSignals: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[4],
  },
  trustSignal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trustEmoji: {
    fontSize: 14,
  },
  trustText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
  },
  trustDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.slate[200],
    marginHorizontal: spacing[3],
  },
  restoreButton: {
    paddingVertical: spacing[3],
    alignItems: "center",
    marginTop: spacing[1],
  },
  restoreButtonText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    textDecorationLine: "underline",
  },

  // Loading State
  loadingContainer: {
    paddingVertical: spacing[8],
    alignItems: "center",
    gap: spacing[3],
  },
  loadingText: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
    fontWeight: typography.weight.medium,
  },
});
