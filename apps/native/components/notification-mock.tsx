import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";

interface NotificationMockProps {
  title: string;
  message: string;
  time?: string;
  icon?: "weather" | "traffic";
}

export function NotificationMock({
  title,
  message,
  time = "now",
  icon = "weather"
}: NotificationMockProps) {
  return (
    <BlurView intensity={80} style={styles.container}>
      <View style={styles.content}>
        {/* App Icon */}
        <View style={[
          styles.appIcon,
          { backgroundColor: icon === "weather" ? "#3B82F6" : "#F59E0B" }
        ]}>
          <Text style={styles.appIconText}>O</Text>
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <View style={styles.header}>
            <Text style={styles.appName}>OUTIA</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    padding: spacing[3],
    gap: spacing[3],
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  appIconText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  textContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  appName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
  },
  message: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18,
    marginTop: 2,
  },
});
