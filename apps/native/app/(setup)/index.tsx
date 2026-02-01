import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { Location01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Location from "expo-location";
import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";

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
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={80} color="#10B981" />
          ) : (
            <HugeiconsIcon icon={Location01Icon} size={80} color="#3B82F6" />
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
            : "To show you accurate risk scores, Outly needs to know where you are. Your location stays on your device."}
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
    backgroundColor: "#fff",
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
    paddingHorizontal: 24,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
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
    lineHeight: 24,
    marginTop: 12,
    textAlign: "center",
  },
  reasonsCard: {
    marginTop: 32,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  reason: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  reasonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3B82F6",
    marginTop: 7,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  skipButton: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  dotActive: {
    backgroundColor: "#111827",
  },
});
