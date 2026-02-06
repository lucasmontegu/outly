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
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

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
          <HugeiconsIcon icon={Notification01Icon} size={24} color={colors.state.info} />
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
          <HugeiconsIcon icon={Cancel01Icon} size={20} color={colors.text.tertiary} />
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
    left: spacing[4],
    right: spacing[4],
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing[4],
    gap: spacing[3],
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  description: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: spacing[1],
    lineHeight: typography.size.sm * typography.leading.normal,
  },
  closeButton: {
    padding: spacing[1],
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
  },
  laterButton: {
    flex: 1,
    paddingVertical: spacing[3] + spacing[1] / 2,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: colors.slate[100],
  },
  laterText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
  enableButton: {
    flex: 1,
    paddingVertical: spacing[3] + spacing[1] / 2,
    alignItems: "center",
    backgroundColor: colors.background.secondary,
  },
  enableText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.state.info,
  },
});
