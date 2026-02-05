import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  CloudIcon,
  Car01Icon,
  CheckmarkCircle02Icon,
  Time01Icon,
  Notification03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useState } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { SetupShell } from "@/components/setup-shell";
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";

type PrimaryConcern = "weather" | "traffic" | "both";
type AlertAdvance = 15 | 30 | 60;

const COMMUTE_TIMES = [
  { label: "Early (6-7 AM)", value: "06:30" },
  { label: "Morning (7-9 AM)", value: "08:00" },
  { label: "Midday (11-1 PM)", value: "12:00" },
  { label: "Evening (5-7 PM)", value: "18:00" },
  { label: "Flexible", value: undefined },
];

const ALERT_OPTIONS: { label: string; value: AlertAdvance; desc: string }[] = [
  { label: "15 min", value: 15, desc: "Quick heads up" },
  { label: "30 min", value: 30, desc: "Time to adjust" },
  { label: "1 hour", value: 60, desc: "Plan ahead" },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const savePreferences = useMutation(api.users.savePreferences);

  const [primaryConcern, setPrimaryConcern] = useState<PrimaryConcern>("both");
  const [commuteTime, setCommuteTime] = useState<string | undefined>("08:00");
  const [alertAdvance, setAlertAdvance] = useState<AlertAdvance>(30);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      await savePreferences({
        primaryConcern,
        commuteTime,
        alertAdvanceMinutes: alertAdvance,
      });
      router.push("/(setup)/gamification");
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const skipPreferences = () => {
    router.push("/(setup)/gamification");
  };

  return (
    <SetupShell
      currentStep={3}
      totalSteps={4}
      title="What matters most to you?"
      subtitle="We'll prioritize alerts based on your preferences."
      primaryAction={{
        label: "Continue",
        onPress: handleContinue,
        loading: isLoading,
      }}
      secondaryAction={{
        label: "Skip for now",
        onPress: skipPreferences,
      }}
    >
      {/* Question 1: Primary Concern */}
      <Animated.View entering={FadeIn.delay(400)} style={styles.section}>
        <Text style={styles.questionLabel}>Choose your focus</Text>
        <View style={styles.concernGrid}>
          <ConcernCard
            icon={CloudIcon}
            label="Weather"
            desc="Rain, storms & visibility"
            isSelected={primaryConcern === "weather"}
            onPress={() => setPrimaryConcern("weather")}
          />
          <ConcernCard
            icon={Car01Icon}
            label="Traffic"
            desc="Accidents & delays"
            isSelected={primaryConcern === "traffic"}
            onPress={() => setPrimaryConcern("traffic")}
          />
          <ConcernCard
            icon={CheckmarkCircle02Icon}
            label="Both"
            desc="Complete coverage"
            isSelected={primaryConcern === "both"}
            onPress={() => setPrimaryConcern("both")}
            recommended
          />
        </View>
      </Animated.View>

      {/* Question 2: Commute Time */}
      <Animated.View entering={FadeIn.delay(500)} style={styles.section}>
        <View style={styles.questionHeader}>
          <HugeiconsIcon icon={Time01Icon} size={18} color={colors.text.secondary} />
          <Text style={styles.questionLabel}>When do you usually leave?</Text>
        </View>
        <View style={styles.timeOptions}>
          {COMMUTE_TIMES.map((time) => (
            <TouchableOpacity
              key={time.label}
              style={[
                styles.timeOption,
                commuteTime === time.value && styles.timeOptionSelected,
              ]}
              onPress={() => setCommuteTime(time.value)}
            >
              <Text
                style={[
                  styles.timeOptionText,
                  commuteTime === time.value && styles.timeOptionTextSelected,
                ]}
              >
                {time.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Question 3: Alert Timing */}
      <Animated.View entering={FadeIn.delay(600)} style={styles.section}>
        <View style={styles.questionHeader}>
          <HugeiconsIcon icon={Notification03Icon} size={18} color={colors.text.secondary} />
          <Text style={styles.questionLabel}>How early should we alert you?</Text>
        </View>
        <View style={styles.alertOptions}>
          {ALERT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.alertOption,
                alertAdvance === option.value && styles.alertOptionSelected,
              ]}
              onPress={() => setAlertAdvance(option.value)}
            >
              <Text
                style={[
                  styles.alertOptionLabel,
                  alertAdvance === option.value && styles.alertOptionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.alertOptionDesc}>{option.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </SetupShell>
  );
}

// Concern Card Component
function ConcernCard({
  icon,
  label,
  desc,
  isSelected,
  onPress,
  recommended,
}: {
  icon: typeof CloudIcon;
  label: string;
  desc: string;
  isSelected: boolean;
  onPress: () => void;
  recommended?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.concernCard, isSelected && styles.concernCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>RECOMMENDED</Text>
        </View>
      )}
      <View style={[styles.concernIconWrapper, isSelected && styles.concernIconWrapperSelected]}>
        <HugeiconsIcon
          icon={icon}
          size={28}
          color={isSelected ? colors.brand.secondary : colors.text.secondary}
        />
      </View>
      <Text style={[styles.concernLabel, isSelected && styles.concernLabelSelected]}>
        {label}
      </Text>
      <Text style={styles.concernDesc}>{desc}</Text>
      {isSelected && <View style={styles.selectedIndicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing[7],
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  questionLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.slate[700],
  },
  concernGrid: {
    flexDirection: "row",
    gap: spacing[3],
  },
  concernCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
    position: "relative",
  },
  concernCardSelected: {
    borderColor: colors.brand.secondary,
    backgroundColor: "#EFF6FF",
  },
  recommendedBadge: {
    position: "absolute",
    top: -10,
    backgroundColor: colors.brand.secondary,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: borderRadius.md,
  },
  recommendedText: {
    fontSize: 8,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    letterSpacing: typography.tracking.wide,
  },
  concernIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: borderRadius["4xl"],
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  concernIconWrapperSelected: {
    backgroundColor: "#DBEAFE",
  },
  concernLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.slate[700],
  },
  concernLabelSelected: {
    color: colors.brand.secondary,
  },
  concernDesc: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginTop: 2,
    textAlign: "center",
  },
  selectedIndicator: {
    position: "absolute",
    bottom: spacing[2],
    width: spacing[6],
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.brand.secondary,
  },
  timeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  timeOption: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius["2xl"],
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  timeOptionSelected: {
    borderColor: colors.brand.secondary,
    backgroundColor: "#EFF6FF",
  },
  timeOptionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
  timeOptionTextSelected: {
    color: colors.brand.secondary,
    fontWeight: typography.weight.semibold,
  },
  alertOptions: {
    flexDirection: "row",
    gap: spacing[3],
  },
  alertOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  alertOptionSelected: {
    borderColor: colors.brand.secondary,
    backgroundColor: "#EFF6FF",
  },
  alertOptionLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.slate[700],
  },
  alertOptionLabelSelected: {
    color: colors.brand.secondary,
  },
  alertOptionDesc: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});
