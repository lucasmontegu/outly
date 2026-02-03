import { useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import {
  CloudIcon,
  Car01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { RiskCircle } from "@/components/risk-circle";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "@/lib/design-tokens";

// Demo Risk Score to show immediate value
const DEMO_SCORE = 42;

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        style={styles.header}
      >
        <Text style={styles.logo}>outia</Text>
      </Animated.View>

      {/* Demo Risk Score - Show value immediately */}
      <Animated.View
        entering={FadeIn.duration(600).delay(200)}
        style={styles.scoreSection}
      >
        <View style={styles.demoLabel}>
          <Text style={styles.demoLabelText}>LIVE DEMO</Text>
        </View>
        <RiskCircle
          score={DEMO_SCORE}
          classification="medium"
          size={180}
          animateScore={true}
          enableHaptic={false}
        />
        <Animated.View
          entering={FadeInUp.duration(400).delay(600)}
          style={styles.riskBadge}
        >
          <View style={styles.riskDot} />
          <Text style={styles.riskBadgeText}>MEDIUM RISK</Text>
        </Animated.View>
        <Animated.Text
          entering={FadeIn.duration(400).delay(700)}
          style={styles.scoreDescription}
        >
          Light rain expected. Leave 10 min earlier for a safer commute.
        </Animated.Text>
      </Animated.View>

      {/* Value Props - What makes this score */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(400)}
        style={styles.valuePropSection}
      >
        <Text style={styles.valuePropTitle}>One number. Three data sources.</Text>
        <View style={styles.valueProps}>
          <ValueProp
            icon={CloudIcon}
            color={colors.brand.secondary}
            label="Weather"
            desc="Precipitation & alerts"
          />
          <ValueProp
            icon={Car01Icon}
            color={colors.risk.low.primary}
            label="Traffic"
            desc="Incidents & delays"
          />
          <ValueProp
            icon={UserGroupIcon}
            color={colors.risk.medium.primary}
            label="Community"
            desc="Real-time reports"
          />
        </View>
      </Animated.View>

      {/* Main Value Prop - Updated with marketing copy */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(500)}
        style={styles.mainValue}
      >
        <Text style={styles.title}>Know exactly when to leave.</Text>
        <Text style={styles.subtitle}>
          Stop guessing. Get a single score that tells you the best time to depart.
        </Text>
      </Animated.View>

      {/* CTA - Updated copy based on marketing analysis */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(600)}
        style={styles.footer}
      >
        <Button
          size="lg"
          className="w-full h-14 rounded-xl"
          onPress={() => router.push("/(auth)/sign-up")}
        >
          See My Risk Score
        </Button>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/(auth)/sign-in")}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// Value Prop Component
function ValueProp({
  icon,
  color,
  label,
  desc,
}: {
  icon: typeof CloudIcon;
  color: string;
  label: string;
  desc: string;
}) {
  return (
    <View style={styles.valueProp}>
      <View style={[styles.valuePropIcon, { backgroundColor: `${color}15` }]}>
        <HugeiconsIcon icon={icon} size={20} color={color} />
      </View>
      <Text style={styles.valuePropLabel}>{label}</Text>
      <Text style={styles.valuePropDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
  },
  logo: {
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.bold,
    color: colors.brand.primary,
    letterSpacing: typography.tracking.tight,
  },
  scoreSection: {
    alignItems: "center",
    paddingTop: spacing[6],
  },
  demoLabel: {
    backgroundColor: `${colors.brand.secondary}15`,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    marginBottom: spacing[4],
  },
  demoLabelText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.brand.secondary,
    letterSpacing: typography.tracking.wider,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.risk.medium.light,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    marginTop: spacing[4],
    gap: spacing[2],
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.risk.medium.primary,
  },
  riskBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.risk.medium.dark,
    letterSpacing: typography.tracking.wide,
  },
  scoreDescription: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing[3],
    paddingHorizontal: spacing[10],
    lineHeight: 22,
  },
  valuePropSection: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
  },
  valuePropTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing[4],
    letterSpacing: typography.tracking.wide,
  },
  valueProps: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  valueProp: {
    alignItems: "center",
    flex: 1,
  },
  valuePropIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  valuePropLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  valuePropDesc: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  mainValue: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  title: {
    fontSize: typography.size["4xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: "center",
    letterSpacing: typography.tracking.tight,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginTop: spacing[2],
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    gap: spacing[3],
  },
  secondaryButton: {
    width: "100%",
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
});
