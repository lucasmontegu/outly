import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { colors, spacing, typography } from "@/lib/design-tokens";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  variant?: "back" | "close";
  rightAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  style?: ViewStyle;
  transparent?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  variant = "back",
  rightAction,
  style,
  transparent = false,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + spacing[2] },
        transparent && styles.headerTransparent,
        style,
      ]}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <HugeiconsIcon
          icon={variant === "close" ? Cancel01Icon : ArrowLeft01Icon}
          size={24}
          color={transparent ? colors.text.inverse : colors.text.primary}
        />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text
          style={[
            styles.title,
            transparent && styles.titleTransparent,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              transparent && styles.subtitleTransparent,
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightAction ? (
        <TouchableOpacity
          style={[
            styles.rightAction,
            rightAction.disabled && styles.rightActionDisabled,
          ]}
          onPress={rightAction.onPress}
          disabled={rightAction.disabled || rightAction.loading}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.rightActionText,
              rightAction.disabled && styles.rightActionTextDisabled,
              transparent && styles.rightActionTextTransparent,
            ]}
          >
            {rightAction.loading ? "..." : rightAction.label}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTransparent: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -spacing[2],
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing[2],
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  titleTransparent: {
    color: colors.text.inverse,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  subtitleTransparent: {
    color: "rgba(255,255,255,0.7)",
  },
  rightAction: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 8,
    backgroundColor: colors.brand.secondary,
    minWidth: 60,
    alignItems: "center",
  },
  rightActionDisabled: {
    backgroundColor: colors.slate[200],
  },
  rightActionText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  rightActionTextDisabled: {
    color: colors.text.tertiary,
  },
  rightActionTextTransparent: {
    color: colors.text.inverse,
  },
  placeholder: {
    width: 44,
  },
});
