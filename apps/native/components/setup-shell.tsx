import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { colors, spacing, typography, borderRadius } from "@/lib/design-tokens";

interface SetupShellProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  primaryAction: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export function SetupShell({
  currentStep,
  totalSteps,
  title,
  subtitle,
  children,
  primaryAction,
  secondaryAction,
}: SetupShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            entering={FadeIn.delay(100)}
            style={[
              styles.progressFill,
              { width: `${(currentStep / totalSteps) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.stepText}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeIn.delay(200)}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300)} style={styles.content}>
            {children}
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + spacing[4] },
          ]}
        >
          <Button
            size="lg"
            color="accent"
            className="w-full h-14 rounded-xl"
            onPress={primaryAction.onPress}
            isDisabled={primaryAction.disabled}
            isLoading={primaryAction.loading}
          >
            {primaryAction.label}
          </Button>
          {secondaryAction && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={secondaryAction.onPress}
            >
              <Text style={styles.secondaryText}>{secondaryAction.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  progressContainer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.slate[100],
    borderRadius: borderRadius.full,
    overflow: "hidden",
    marginBottom: spacing[2],
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.brand.secondary,
    borderRadius: borderRadius.full,
  },
  stepText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
    textAlign: "center",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  title: {
    fontSize: typography.size["4xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: "center",
    lineHeight: 36,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing[3],
    lineHeight: 22,
    paddingHorizontal: spacing[2],
  },
  content: {
    marginTop: spacing[8],
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
    backgroundColor: colors.background.primary,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: spacing[3],
    marginTop: spacing[2],
  },
  secondaryText: {
    fontSize: typography.size.md,
    color: colors.text.tertiary,
    fontWeight: typography.weight.medium,
  },
});
