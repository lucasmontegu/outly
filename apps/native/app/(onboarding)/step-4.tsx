import { useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import {
  Location01Icon,
  Notification03Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Location from "expo-location";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

export default function OnboardingStep4() {
  const router = useRouter();
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  const requestPermissions = async () => {
    // Request location permission
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus === "granted") {
      setLocationGranted(true);
    }

    // Request notification permission (using expo-notifications if available)
    try {
      const Notifications = await import("expo-notifications");
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      if (notifStatus === "granted") {
        setNotificationsGranted(true);
      }
    } catch {
      // expo-notifications not installed, skip
      setNotificationsGranted(true);
    }

    // Navigate to auth after requesting
    router.push("/(auth)/sign-in");
  };

  const skipPermissions = () => {
    router.push("/(auth)/sign-in");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Bell Icon with glow effect */}
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={["#DBEAFE", "#EFF6FF", "#FFFFFF"]}
          style={styles.glowCircle}
        />
        <View style={styles.bellWrapper}>
          <HugeiconsIcon icon={Notification01Icon} size={80} color="#1D4ED8" />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>To Keep You Safe</Text>
        <Text style={styles.description}>
          Outly needs two permissions to work its magic. We respect your privacy
          and only use data to calculate local risk.
        </Text>

        {/* Permission Cards */}
        <View style={styles.permissionCards}>
          <View style={styles.permissionCard}>
            <View style={[styles.permissionIcon, styles.locationIcon]}>
              <HugeiconsIcon icon={Location01Icon} size={24} color="#3B82F6" />
            </View>
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Location Access</Text>
              <Text style={styles.permissionDesc}>
                To detect local weather & traffic risks.
              </Text>
            </View>
            <View style={[styles.checkbox, locationGranted && styles.checkboxActive]}>
              {locationGranted && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>

          <View style={styles.permissionCard}>
            <View style={[styles.permissionIcon, styles.notificationIcon]}>
              <HugeiconsIcon icon={Notification03Icon} size={24} color="#EF4444" />
            </View>
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Notifications</Text>
              <Text style={styles.permissionDesc}>
                To alert you before you start driving.
              </Text>
            </View>
            <View style={[styles.checkbox, notificationsGranted && styles.checkboxActive]}>
              {notificationsGranted && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          style={styles.button}
          onPress={requestPermissions}
        >
          Enable Permissions
        </Button>

        <TouchableOpacity onPress={skipPermissions} style={styles.skipButton}>
          <Text style={styles.skipText}>Maybe Later</Text>
        </TouchableOpacity>

        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
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
    height: 260,
    position: "relative",
  },
  glowCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#EBF5FF",
    opacity: 0.6,
  },
  bellWrapper: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
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
  permissionCards: {
    marginTop: 32,
    gap: 16,
  },
  permissionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  locationIcon: {
    backgroundColor: "#DBEAFE",
  },
  notificationIcon: {
    backgroundColor: "#FEE2E2",
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  permissionDesc: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    backgroundColor: "#111827",
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
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
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
