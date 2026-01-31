import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Classification = "low" | "medium" | "high";

type LocationCardProps = {
  name: string;
  address?: string;
  score: number;
  classification: Classification;
  isDefault?: boolean;
  onPress?: () => void;
};

const COLORS = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#ef4444",
};

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: "home",
  Casa: "home",
  Work: "briefcase",
  Trabajo: "briefcase",
  Gym: "fitness",
  Gimnasio: "fitness",
};

export function LocationCard({
  name,
  address,
  score,
  classification,
  isDefault,
  onPress,
}: LocationCardProps) {
  const iconName = ICONS[name] ?? "location";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={24} color="#94a3b8" />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Principal</Text>
            </View>
          )}
        </View>
        {address && <Text style={styles.address} numberOfLines={1}>{address}</Text>}
      </View>

      <View style={[styles.scoreBadge, { backgroundColor: COLORS[classification] }]}>
        <Text style={styles.scoreText}>{score}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
  },
  defaultBadge: {
    backgroundColor: "#3b82f6",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  address: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 2,
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
