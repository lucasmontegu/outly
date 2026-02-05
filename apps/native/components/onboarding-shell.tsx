import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import Animated, { FadeIn, FadeInUp, SlideInUp } from "react-native-reanimated";
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";

const { width, height } = Dimensions.get("window");

interface OnboardingShellProps {
  backgroundImage: ImageSourcePropType;
  currentStep: 1 | 2 | 3;
  title: string;
  subtitle: string;
  nextRoute: string;
  isLastStep?: boolean;
  children?: React.ReactNode; // For notification mock
}

export function OnboardingShell({
  backgroundImage,
  currentStep,
  title,
  subtitle,
  nextRoute,
  isLastStep = false,
  children,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleSkip = () => {
    router.replace("/(auth)/sign-up");
  };

  const handleContinue = () => {
    if (isLastStep) {
      router.replace("/(auth)/sign-up");
    } else {
      router.push(nextRoute as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <ImageBackground
        source={backgroundImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Top gradient for status bar visibility */}
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.3)", "transparent"]}
          style={[styles.topGradient, { paddingTop: insets.top }]}
        >
          {/* Step Indicators - 3 lines */}
          <Animated.View
            entering={FadeIn.delay(200)}
            style={styles.stepIndicators}
          >
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  styles.stepLine,
                  step <= currentStep && styles.stepLineActive,
                ]}
              />
            ))}
          </Animated.View>
        </LinearGradient>

        {/* Notification Mock (for steps 2 & 3) */}
        {children && (
          <Animated.View
            entering={SlideInUp.delay(400).springify()}
            style={styles.notificationContainer}
          >
            {children}
          </Animated.View>
        )}

        {/* Bottom Sheet */}
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={[styles.bottomSheet, { paddingBottom: insets.bottom + spacing[4] }]}
        >
          {/* Sheet Content */}
          <View style={styles.sheetContent}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* Buttons - Skip & Continue side by side */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <Button
              size="lg"
              className="flex-1 h-14"
              onPress={handleContinue}
            >
              {isLastStep ? "Get Started" : "Continue"}
            </Button>
          </View>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  topGradient: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
  },
  stepIndicators: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[4],
  },
  stepLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  stepLineActive: {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  notificationContainer: {
    position: "absolute",
    top: 140,
    left: spacing[4],
    right: spacing[4],
    zIndex: 10,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
  },
  sheetContent: {
    alignItems: "center",
    marginBottom: spacing[8],
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
    marginTop: spacing[3],
    lineHeight: 24,
    paddingHorizontal: spacing[4],
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing[3],
    alignItems: "center",
  },
  skipButton: {
    height: 56,
    paddingHorizontal: spacing[6],
    justifyContent: "center",
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
});
