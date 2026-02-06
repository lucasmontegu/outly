import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Notification03Icon,
  CheckmarkCircle01Icon,
  Car01Icon,
} from "@hugeicons/core-free-icons";
import { lightHaptic } from "@/lib/haptics";
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";

type DepartureAlertCtaProps = {
  optimalTime: string;
  isOptimalNow: boolean;
  classification: "low" | "medium" | "high";
  hasActiveAlert?: boolean;
  onSetAlert: () => void;
  onEditAlert?: () => void;
};

export function DepartureAlertCta({
  optimalTime,
  isOptimalNow,
  classification,
  hasActiveAlert = false,
  onSetAlert,
  onEditAlert,
}: DepartureAlertCtaProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!hasActiveAlert && !isOptimalNow) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.01, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    } else {
      scale.value = 1;
    }
  }, [hasActiveAlert, isOptimalNow, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    lightHaptic();
    if (hasActiveAlert && onEditAlert) {
      onEditAlert();
    } else {
      onSetAlert();
    }
  };

  const getContainerStyle = () => {
    if (isOptimalNow) return [styles.container, styles.optimalNowContainer];
    if (hasActiveAlert) return [styles.container, styles.alertSetContainer];
    return [styles.container, styles.noAlertContainer];
  };

  if (isOptimalNow) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View style={getContainerStyle()}>
          <View style={styles.content}>
            <HugeiconsIcon icon={Car01Icon} size={20} color={colors.text.inverse} />
            <Text style={styles.textWhite}>Go now — conditions are perfect</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (hasActiveAlert) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View style={getContainerStyle()}>
          <View style={styles.alertSetContent}>
            <View style={styles.alertSetLeft}>
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color={colors.brand.secondary} />
              <Text style={styles.textBrand}>Alert set for {optimalTime}</Text>
            </View>
            <Text style={styles.editText}>Edit</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={animatedStyle}>
        <View style={getContainerStyle()}>
          <View style={styles.content}>
            <HugeiconsIcon icon={Notification03Icon} size={20} color={colors.text.inverse} />
            <View>
              <Text style={styles.textWhite}>Notify me at {optimalTime}</Text>
              <Text style={styles.secondaryText}>When conditions are best</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  noAlertContainer: {
    backgroundColor: colors.brand.secondary,
  },
  alertSetContainer: {
    backgroundColor: `${colors.brand.secondary}1A`,
  },
  optimalNowContainer: {
    backgroundColor: colors.risk.low.primary,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
  },
  alertSetContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  alertSetLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
  },
  textWhite: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  textBrand: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.brand.secondary,
  },
  secondaryText: {
    fontSize: typography.size.sm,
    color: colors.text.inverse,
    opacity: 0.85,
    marginTop: 2,
  },
  editText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.brand.secondary,
  },
});
