import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Centralized haptic feedback utilities for consistent tactile feedback
 * across the Outly app. All haptics respect platform capabilities.
 */

const isHapticsSupported = Platform.OS === "ios" || Platform.OS === "android";

/**
 * Light impact - Use for subtle interactions
 * Examples: Toggle switches, checkbox taps, minor selections
 */
export function lightHaptic() {
  if (!isHapticsSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Medium impact - Use for standard interactions
 * Examples: Button presses, card selections, navigation
 */
export function mediumHaptic() {
  if (!isHapticsSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Heavy impact - Use for significant actions
 * Examples: Confirming important actions, completing tasks
 */
export function heavyHaptic() {
  if (!isHapticsSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Selection haptic - Use for selection feedback
 * Examples: Scrolling through pickers, selecting items in lists
 */
export function selectionHaptic() {
  if (!isHapticsSupported) return;
  Haptics.selectionAsync();
}

/**
 * Success notification - Use for successful completions
 * Examples: Form submission success, save completed, vote confirmed
 */
export function successHaptic() {
  if (!isHapticsSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Warning notification - Use for warning states
 * Examples: Approaching limits, risky actions about to happen
 */
export function warningHaptic() {
  if (!isHapticsSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Error notification - Use for error states
 * Examples: Form validation failed, action blocked, error occurred
 */
export function errorHaptic() {
  if (!isHapticsSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/**
 * Risk level haptic - Provides appropriate feedback based on risk classification
 */
export function riskLevelHaptic(level: "low" | "medium" | "high") {
  if (!isHapticsSupported) return;
  switch (level) {
    case "low":
      lightHaptic();
      break;
    case "medium":
      mediumHaptic();
      break;
    case "high":
      heavyHaptic();
      break;
  }
}
