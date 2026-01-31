import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

type Classification = "low" | "medium" | "high";

type RiskCircleProps = {
  score: number;
  classification: Classification;
  size?: number;
};

const COLORS = {
  low: "#22c55e",      // green-500
  medium: "#eab308",   // yellow-500
  high: "#ef4444",     // red-500
};

const LABELS = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
};

export function RiskCircle({ score, classification, size = 200 }: RiskCircleProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = withTiming(COLORS[classification], { duration: 500 });
    return { backgroundColor };
  }, [classification]);

  const innerSize = size * 0.85;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.outerCircle,
          { width: size, height: size, borderRadius: size / 2 },
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          <Text style={styles.score}>{score}</Text>
          <Text style={[styles.label, { color: COLORS[classification] }]}>
            {LABELS[classification]}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  innerCircle: {
    backgroundColor: "#0f172a", // slate-900
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#fff",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
});
