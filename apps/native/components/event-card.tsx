import React, { useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  FadeInDown,
  Layout,
} from "react-native-reanimated";
import { Pressable } from "react-native";
import { lightHaptic, mediumHaptic, successHaptic } from "@/lib/haptics";
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";

type EventType = "weather" | "traffic";
type Vote = "still_active" | "cleared" | "not_exists";

type EventCardProps = {
  type: EventType;
  subtype: string;
  severity: number;
  confidenceScore: number;
  distance?: number;
  myVote?: Vote | null;
  onVote?: (vote: Vote) => void;
  onPress?: () => void;
  /**
   * Index for staggered entrance animation
   */
  index?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TYPE_ICONS: Record<EventType, keyof typeof Ionicons.glyphMap> = {
  weather: "cloud",
  traffic: "car",
};

const SUBTYPE_LABELS: Record<string, string> = {
  storm: "Tormenta",
  rain: "Lluvia fuerte",
  flood: "Inundación",
  fog: "Niebla",
  wind: "Viento fuerte",
  accident: "Accidente",
  congestion: "Congestión",
  roadwork: "Obras",
  closure: "Corte de vía",
};

const SEVERITY_COLORS = [
  colors.risk.low.primary, // 1 - green (safe)
  colors.risk.low.dark, // 2 - darker green
  colors.risk.medium.primary, // 3 - amber (caution)
  colors.risk.high.dark, // 4 - darker red
  colors.risk.high.primary, // 5 - red (urgent)
];

export function EventCard({
  type,
  subtype,
  severity,
  confidenceScore,
  distance,
  myVote,
  onVote,
  onPress,
  index = 0,
}: EventCardProps) {
  const severityColor = SEVERITY_COLORS[severity - 1] ?? SEVERITY_COLORS[2];
  const label = SUBTYPE_LABELS[subtype] ?? subtype;

  // Animation values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
    translateY.value = withSpring(2, { damping: 20, stiffness: 400 });
    lightHaptic();
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 400 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handleVote = useCallback((vote: Vote) => {
    successHaptic();
    onVote?.(vote);
  }, [onVote]);

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(index * 50).duration(300).springify().damping(20)}
      layout={Layout.springify().damping(20)}
      style={[styles.container, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.header}>
        <Animated.View style={[styles.iconContainer, { backgroundColor: severityColor + "20" }]}>
          <Ionicons
            name={TYPE_ICONS[type]}
            size={24}
            color={severityColor}
          />
        </Animated.View>

        <View style={styles.info}>
          <Text style={styles.title}>{label}</Text>
          <View style={styles.meta}>
            {distance !== undefined && (
              <Text style={styles.metaText}>
                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
              </Text>
            )}
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>{confidenceScore}% confianza</Text>
          </View>
        </View>

        <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
          <Text style={styles.severityText}>{severity}</Text>
        </View>
      </View>

      {onVote && (
        <View style={styles.voteContainer}>
          <VoteButton
            icon="checkmark-circle"
            label="Sigue"
            active={myVote === "still_active"}
            color={colors.state.success}
            onPress={() => handleVote("still_active")}
          />
          <VoteButton
            icon="checkmark-done-circle"
            label="Despejado"
            active={myVote === "cleared"}
            color={colors.state.info}
            onPress={() => handleVote("cleared")}
          />
          <VoteButton
            icon="close-circle"
            label="No existe"
            active={myVote === "not_exists"}
            color={colors.state.error}
            onPress={() => handleVote("not_exists")}
          />
        </View>
      )}
    </AnimatedPressable>
  );
}

function VoteButton({
  icon,
  label,
  active,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const activeScale = useSharedValue(active ? 1 : 0);

  // Update active animation when active state changes
  React.useEffect(() => {
    if (active) {
      activeScale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    } else {
      activeScale.value = withSpring(1, { damping: 20, stiffness: 300 });
    }
  }, [active]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 20, stiffness: 500 });
    lightHaptic();
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 500 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * activeScale.value }],
  }));

  const animatedBgStyle = useAnimatedStyle(() => ({
    backgroundColor: active ? color + "20" : "transparent",
    borderColor: active ? color : colors.slate[700],
  }));

  return (
    <AnimatedPressable
      style={[styles.voteButton, animatedStyle, animatedBgStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? color : colors.slate[500]}
      />
      <Text style={[styles.voteLabel, active && { color }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.slate[800],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.slate[50],
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[1],
    gap: spacing[2] - spacing[1] / 2,
  },
  metaText: {
    fontSize: typography.size.sm,
    color: colors.slate[400],
  },
  severityBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  severityText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  voteContainer: {
    flexDirection: "row",
    marginTop: spacing[3],
    gap: spacing[2],
  },
  voteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.slate[700],
    gap: spacing[1],
  },
  voteLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.slate[500],
  },
});
