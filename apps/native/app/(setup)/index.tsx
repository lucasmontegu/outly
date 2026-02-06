import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { View, Text, StyleSheet } from "react-native";
import { Location01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Location from "expo-location";
import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { SetupShell } from "@/components/setup-shell";
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";

export default function SetupLocationPermission() {
  const router = useRouter();
  const ensureUser = useMutation(api.users.ensureUser);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  // Ensure user exists in DB when this screen loads
  useEffect(() => {
    ensureUser();
  }, [ensureUser]);

  // Check current permission status
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);

      // If already granted, skip to next step
      if (status === "granted") {
        router.replace("/(setup)/save-location");
      }
    })();
  }, [router]);

  const requestLocationPermission = async () => {
    setIsRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === "granted") {
        router.replace("/(setup)/save-location");
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const skipForNow = () => {
    router.replace("/(setup)/save-location");
  };

  const isGranted = permissionStatus === "granted";

  return (
    <SetupShell
      currentStep={1}
      totalSteps={4}
      title={isGranted ? "Perfect! You're all set" : "Let's find you"}
      subtitle={
        isGranted
          ? "We can now calculate accurate risk scores for your area."
          : "We'll show you personalized risk scores based on where you are."
      }
      primaryAction={{
        label: isGranted ? "Continue" : "Enable Location",
        onPress: isGranted ? () => router.replace("/(setup)/save-location") : requestLocationPermission,
        loading: isRequesting,
      }}
      secondaryAction={
        !isGranted
          ? {
              label: "Skip for now",
              onPress: skipForNow,
            }
          : undefined
      }
    >
      {/* Icon with animated glow */}
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={
            isGranted
              ? ["#D1FAE5", "#ECFDF5", "#FFFFFF"]
              : ["#DBEAFE", "#EFF6FF", "#FFFFFF"]
          }
          style={styles.glowCircle}
        />
        <Animated.View entering={FadeIn.delay(400)} style={styles.iconWrapper}>
          {isGranted ? (
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={80}
              color={colors.state.success}
            />
          ) : (
            <HugeiconsIcon
              icon={Location01Icon}
              size={80}
              color={colors.state.info}
            />
          )}
        </Animated.View>
      </View>

      {/* Privacy & Benefits */}
      {!isGranted && (
        <Animated.View entering={FadeIn.delay(500)} style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>
              Calculate weather risks for your exact location
            </Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>
              Detect nearby traffic incidents
            </Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>
              Show community reports in your area
            </Text>
          </View>

          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              🔒 Your location stays private and is never shared
            </Text>
          </View>
        </Animated.View>
      )}
    </SetupShell>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    position: "relative",
    marginBottom: spacing[6],
  },
  glowCircle: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.6,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  featuresCard: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    gap: spacing[3],
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.state.info,
    marginTop: 7,
  },
  featureText: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.slate[700],
    lineHeight: 22,
  },
  privacyNote: {
    marginTop: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.slate[200],
  },
  privacyText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
