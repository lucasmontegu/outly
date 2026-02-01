import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Notification01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";

const NOTIFICATION_PROMPT_KEY = "notification_prompt_dismissed";
const NOTIFICATION_PROMPT_DELAY = 5000; // Show after 5 seconds of viewing home

interface NotificationPromptProps {
  onDismiss?: () => void;
}

export function NotificationPrompt({ onDismiss }: NotificationPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const slideAnim = useState(new Animated.Value(100))[0];

  useEffect(() => {
    checkAndShowPrompt();
  }, []);

  const checkAndShowPrompt = async () => {
    try {
      // Check if already dismissed
      const dismissed = await SecureStore.getItemAsync(NOTIFICATION_PROMPT_KEY);
      if (dismissed === "true") return;

      // Check current permission status
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);

      // Don't show if already granted
      if (status === "granted") return;

      // Show after delay (user has seen their risk score)
      setTimeout(() => {
        setIsVisible(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
      }, NOTIFICATION_PROMPT_DELAY);
    } catch (error) {
      console.error("Error checking notification prompt:", error);
    }
  };

  const requestPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      hidePrompt(true);
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const hidePrompt = async (permanently = false) => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      if (permanently) {
        SecureStore.setItemAsync(NOTIFICATION_PROMPT_KEY, "true");
      }
      onDismiss?.();
    });
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <HugeiconsIcon icon={Notification01Icon} size={24} color="#3B82F6" />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.title}>Stay ahead of risks</Text>
          <Text style={styles.description}>
            Get alerts when conditions change for your saved locations.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => hidePrompt(true)}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.laterButton}
          onPress={() => hidePrompt(false)}
        >
          <Text style={styles.laterText}>Maybe Later</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.enableButton}
          onPress={requestPermission}
        >
          <Text style={styles.enableText}>Enable Notifications</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  description: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  laterButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#F3F4F6",
  },
  laterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  enableButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  enableText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
});
