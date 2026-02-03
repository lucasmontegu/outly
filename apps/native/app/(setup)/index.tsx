import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { Location01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Location from "expo-location";
import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

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
    // Still allow them to proceed, but they won't get full value
    router.replace("/(setup)/save-location");
  };

  const isGranted = permissionStatus === "granted";

  return (
    <SafeAreaView style={styles.container}>
      {/* Icon with glow */}
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={["#DBEAFE", "#EFF6FF", "#FFFFFF"]}
          style={styles.glowCircle}
        />
        <View style={styles.iconWrapper}>
          {isGranted ? (
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={80} color={colors.state.success} />
          ) : (
            <HugeiconsIcon icon={Location01Icon} size={80} color={colors.state.info} />
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.stepLabel}>STEP 1 OF 2</Text>
        <Text style={styles.title}>
          {isGranted ? "Location Enabled!" : "Enable Location"}
        </Text>
        <Text style={styles.description}>
          {isGranted
            ? "Great! We can now calculate accurate risk scores for your area."
            : "To show you accurate risk scores, Outia needs to know where you are. Your location stays on your device."}
        </Text>

        {/* Why we need it */}
        {!isGranted && (
          <View style={styles.reasonsCard}>
            <View style={styles.reason}>
              <View style={styles.reasonDot} />
              <Text style={styles.reasonText}>
                Calculate weather risks for your exact location
              </Text>
            </View>
            <View style={styles.reason}>
              <View style={styles.reasonDot} />
              <Text style={styles.reasonText}>
                Detect nearby traffic incidents
              </Text>
            </View>
            <View style={styles.reason}>
              <View style={styles.reasonDot} />
              <Text style={styles.reasonText}>
                Show community reports in your area
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        {isGranted ? (
          <Button
            color="accent"
            size="lg"
            className="w-full h-14 rounded-xl"
            onPress={() => router.replace("/(setup)/save-location")}
          >
            Continue
          </Button>
        ) : (
          <>
            <Button
              color="accent"
              size="lg"
              className="w-full h-14 rounded-xl"
              onPress={requestLocationPermission}
              isDisabled={isRequesting}
            >
              {isRequesting ? "Requesting..." : "Enable Location Access"}
            </Button>
            <TouchableOpacity style={styles.skipButton} onPress={skipForNow}>
              <Text style={styles.skipText}>Skip for Now</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Progress dots */}
        <View style={styles.pagination}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 220,
    position: "relative",
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
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
  },
  stepLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.state.info,
    letterSpacing: typography.tracking.wide,
    textAlign: "center",
    marginBottom: spacing[2],
  },
  title: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: "center",
  },
  description: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    lineHeight: 24,
    marginTop: spacing[3],
    textAlign: "center",
  },
  reasonsCard: {
    marginTop: spacing[8],
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    gap: spacing[4],
  },
  reason: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  reasonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.state.info,
    marginTop: 7,
  },
  reasonText: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.slate[700],
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  skipButton: {
    width: "100%",
    height: 48,
    borderRadius: borderRadius.lg,
    marginTop: spacing[3],
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing[5],
    gap: spacing[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.light,
  },
  dotActive: {
    backgroundColor: colors.text.primary,
  },
});
