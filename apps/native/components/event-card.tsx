import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
};

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
  "#22c55e", // 1 - green
  "#84cc16", // 2 - lime
  "#eab308", // 3 - yellow
  "#f97316", // 4 - orange
  "#ef4444", // 5 - red
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
}: EventCardProps) {
  const severityColor = SEVERITY_COLORS[severity - 1] ?? SEVERITY_COLORS[2];
  const label = SUBTYPE_LABELS[subtype] ?? subtype;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: severityColor + "20" }]}>
          <Ionicons
            name={TYPE_ICONS[type]}
            size={24}
            color={severityColor}
          />
        </View>

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
            color="#22c55e"
            onPress={() => onVote("still_active")}
          />
          <VoteButton
            icon="checkmark-done-circle"
            label="Despejado"
            active={myVote === "cleared"}
            color="#3b82f6"
            onPress={() => onVote("cleared")}
          />
          <VoteButton
            icon="close-circle"
            label="No existe"
            active={myVote === "not_exists"}
            color="#ef4444"
            onPress={() => onVote("not_exists")}
          />
        </View>
      )}
    </Pressable>
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
  return (
    <Pressable
      style={[
        styles.voteButton,
        active && { backgroundColor: color + "20", borderColor: color },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? color : "#64748b"}
      />
      <Text style={[styles.voteLabel, active && { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  severityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  severityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  voteContainer: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  voteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 4,
  },
  voteLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
  },
});
