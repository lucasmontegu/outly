import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { successHaptic, errorHaptic, warningHaptic } from "@/lib/haptics";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

// ============================================================
// Types
// ============================================================

type ToastType = "success" | "error" | "warning" | "info";

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextValue {
  show: (config: ToastConfig | string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  hide: () => void;
}

// ============================================================
// Context
// ============================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ============================================================
// Toast Component
// ============================================================

const TOAST_COLORS: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: colors.state.success, text: colors.text.inverse, icon: "checkmark-circle" },
  error: { bg: colors.state.error, text: colors.text.inverse, icon: "close-circle" },
  warning: { bg: colors.state.warning, text: colors.text.inverse, icon: "warning" },
  info: { bg: colors.state.info, text: colors.text.inverse, icon: "information-circle" },
};

interface ToastItemProps {
  config: ToastConfig;
  onHide: () => void;
}

function ToastItem({ config, onHide }: ToastItemProps) {
  const { message, type = "info", duration = 3000, action } = config;
  const colors = TOAST_COLORS[type];
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide after duration
  React.useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      onHide();
    }, duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, onHide]);

  // Trigger haptic based on type
  React.useEffect(() => {
    switch (type) {
      case "success":
        successHaptic();
        break;
      case "error":
        errorHaptic();
        break;
      case "warning":
        warningHaptic();
        break;
    }
  }, [type]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(20).stiffness(300)}
      exiting={SlideOutUp.springify().damping(20)}
      style={[
        styles.toast,
        { backgroundColor: colors.bg, marginTop: insets.top + spacing[2] },
        animatedStyle,
      ]}
    >
      <Ionicons
        name={colors.icon as any}
        size={20}
        color={colors.text}
        style={styles.toastIcon}
      />
      <Text style={[styles.toastMessage, { color: colors.text }]} numberOfLines={2}>
        {message}
      </Text>
      {action && (
        <Animated.Text
          style={[styles.toastAction, { color: colors.text }]}
          onPress={() => {
            action.onPress();
            onHide();
          }}
        >
          {action.label}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

// ============================================================
// Provider
// ============================================================

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<(ToastConfig & { id: string })[]>([]);

  const show = useCallback((config: ToastConfig | string) => {
    const normalizedConfig: ToastConfig =
      typeof config === "string" ? { message: config } : config;

    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...normalizedConfig, id }]);
  }, []);

  const hide = useCallback(() => {
    setToasts((prev) => prev.slice(1));
  }, []);

  const hideById = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message: string) => show({ message, type: "success" }),
    [show]
  );

  const error = useCallback(
    (message: string) => show({ message, type: "error" }),
    [show]
  );

  const warning = useCallback(
    (message: string) => show({ message, type: "warning" }),
    [show]
  );

  const info = useCallback(
    (message: string) => show({ message, type: "info" }),
    [show]
  );

  const value: ToastContextValue = {
    show,
    success,
    error,
    warning,
    info,
    hide,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.slice(0, 1).map((toast) => (
          <ToastItem
            key={toast.id}
            config={toast}
            onHide={() => hideById(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    ...shadows.lg,
    maxWidth: 400,
    width: "100%",
  },
  toastIcon: {
    marginRight: spacing[2] + spacing[1] / 2,
  },
  toastMessage: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    lineHeight: typography.size.base * typography.leading.normal,
  },
  toastAction: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    marginLeft: spacing[3],
    textDecorationLine: "underline",
  },
});
