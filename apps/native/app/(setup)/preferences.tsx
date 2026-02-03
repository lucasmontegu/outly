import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import {
  CloudIcon,
  Car01Icon,
  CheckmarkCircle02Icon,
  Time01Icon,
  Notification03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useState } from "react";

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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stepLabel}>PERSONALIZE</Text>
          <Text style={styles.title}>Make Outia yours</Text>
          <Text style={styles.description}>
            Help us tailor your experience. You can change these anytime.
          </Text>
        </View>

        {/* Question 1: Primary Concern */}
        <View style={styles.questionSection}>
          <Text style={styles.questionLabel}>What matters most to you?</Text>
          <View style={styles.concernOptions}>
            <ConcernOption
              icon={CloudIcon}
              color="#3B82F6"
              label="Weather"
              desc="Rain, storms, visibility"
              isSelected={primaryConcern === "weather"}
              onPress={() => setPrimaryConcern("weather")}
            />
            <ConcernOption
              icon={Car01Icon}
              color="#10B981"
              label="Traffic"
              desc="Accidents, delays"
              isSelected={primaryConcern === "traffic"}
              onPress={() => setPrimaryConcern("traffic")}
            />
            <ConcernOption
              icon={CheckmarkCircle02Icon}
              color="#8B5CF6"
              label="Both"
              desc="Complete picture"
              isSelected={primaryConcern === "both"}
              onPress={() => setPrimaryConcern("both")}
              recommended
            />
          </View>
        </View>

        {/* Question 2: Commute Time */}
        <View style={styles.questionSection}>
          <View style={styles.questionHeader}>
            <HugeiconsIcon icon={Time01Icon} size={18} color="#6B7280" />
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
        </View>

        {/* Question 3: Alert Timing */}
        <View style={styles.questionSection}>
          <View style={styles.questionHeader}>
            <HugeiconsIcon icon={Notification03Icon} size={18} color="#6B7280" />
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
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <Button
          color="accent"
          size="lg"
          className="w-full h-14 rounded-xl"
          onPress={handleContinue}
          isDisabled={isLoading}
        >
          {isLoading ? "Saving..." : "Continue"}
        </Button>
        <TouchableOpacity style={styles.skipButton} onPress={skipPreferences}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Concern Option Component
function ConcernOption({
  icon,
  color,
  label,
  desc,
  isSelected,
  onPress,
  recommended,
}: {
  icon: typeof CloudIcon;
  color: string;
  label: string;
  desc: string;
  isSelected: boolean;
  onPress: () => void;
  recommended?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.concernOption, isSelected && styles.concernOptionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>RECOMMENDED</Text>
        </View>
      )}
      <View
        style={[
          styles.concernIconWrapper,
          { backgroundColor: `${color}15` },
          isSelected && { backgroundColor: `${color}25` },
        ]}
      >
        <HugeiconsIcon icon={icon} size={28} color={color} />
      </View>
      <Text style={[styles.concernLabel, isSelected && styles.concernLabelSelected]}>
        {label}
      </Text>
      <Text style={styles.concernDesc}>{desc}</Text>
      {isSelected && (
        <View style={[styles.selectedIndicator, { backgroundColor: color }]} />
      )}
    </TouchableOpacity>
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
    marginBottom: 32,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B5CF6",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 8,
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
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  questionSection: {
    marginBottom: 28,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  questionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  concernOptions: {
    flexDirection: "row",
    gap: 12,
  },
  concernOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    position: "relative",
  },
  concernOptionSelected: {
    borderColor: "#8B5CF6",
    backgroundColor: "#FAF5FF",
  },
  recommendedBadge: {
    position: "absolute",
    top: -10,
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  recommendedText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  concernIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  concernLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  concernLabelSelected: {
    color: "#8B5CF6",
  },
  concernDesc: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
    textAlign: "center",
  },
  selectedIndicator: {
    position: "absolute",
    bottom: 8,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  timeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  timeOptionSelected: {
    borderColor: "#8B5CF6",
    backgroundColor: "#FAF5FF",
  },
  timeOptionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  timeOptionTextSelected: {
    color: "#8B5CF6",
    fontWeight: "600",
  },
  alertOptions: {
    flexDirection: "row",
    gap: 12,
  },
  alertOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  alertOptionSelected: {
    borderColor: "#8B5CF6",
    backgroundColor: "#FAF5FF",
  },
  alertOptionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  alertOptionLabelSelected: {
    color: "#8B5CF6",
  },
  alertOptionDesc: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  skipText: {
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});
