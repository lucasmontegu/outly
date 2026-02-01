import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import {
  CloudIcon,
  Car01Icon,
  UserGroupIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Svg, { Circle } from "react-native-svg";

const { width } = Dimensions.get("window");

// Demo Risk Score to show immediate value
const DEMO_SCORE = 42;

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>outly</Text>
      </View>

      {/* Demo Risk Score - Show value immediately */}
      <View style={styles.scoreSection}>
        <View style={styles.demoLabel}>
          <Text style={styles.demoLabelText}>DEMO</Text>
        </View>
        <DemoRiskCircle score={DEMO_SCORE} />
        <View style={styles.riskBadge}>
          <View style={styles.riskDot} />
          <Text style={styles.riskBadgeText}>MEDIUM RISK</Text>
        </View>
        <Text style={styles.scoreDescription}>
          Light rain expected. Consider leaving 10 min earlier.
        </Text>
      </View>

      {/* Value Props - What makes this score */}
      <View style={styles.valuePropSection}>
        <Text style={styles.valuePropTitle}>Your Risk Score combines:</Text>
        <View style={styles.valueProps}>
          <ValueProp
            icon={CloudIcon}
            color="#3B82F6"
            label="Weather"
            desc="Real-time conditions"
          />
          <ValueProp
            icon={Car01Icon}
            color="#10B981"
            label="Traffic"
            desc="Live incidents"
          />
          <ValueProp
            icon={UserGroupIcon}
            color="#F97316"
            label="Community"
            desc="Driver reports"
          />
        </View>
      </View>

      {/* Main Value Prop */}
      <View style={styles.mainValue}>
        <Text style={styles.title}>Know when to leave.</Text>
        <Text style={styles.subtitle}>
          Stop guessing. Get a single score that tells you if it's safe to go.
        </Text>
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          style={styles.button}
          onPress={() => router.push("/(auth)/sign-up")}
        >
          Get Started — It's Free
        </Button>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/(auth)/sign-in")}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Demo Risk Circle Component
function DemoRiskCircle({ score }: { score: number }) {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 100) * circumference;
  const color = "#F59E0B"; // Medium risk = amber

  return (
    <View style={styles.circleWrapper}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.circleContent}>
        <Text style={styles.scoreText}>{score}</Text>
        <Text style={styles.scoreLabel}>Risk Score</Text>
      </View>
    </View>
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
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  logo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  scoreSection: {
    alignItems: "center",
    paddingTop: 24,
  },
  demoLabel: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  demoLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  circleWrapper: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  circleContent: {
    position: "absolute",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#111827",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: -4,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F59E0B",
    letterSpacing: 0.5,
  },
  scoreDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 40,
  },
  valuePropSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  valuePropTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  valuePropLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  valuePropDesc: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  mainValue: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    
  },
  secondaryButton: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
});

