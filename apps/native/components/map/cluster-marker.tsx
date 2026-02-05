/**
 * ClusterMarker
 *
 * A badge-style cluster marker for displaying multiple grouped events.
 * Used for TIER 3 events when implementing clustering in the future.
 *
 * Visual: Circular badge with count ("24", "18", etc.)
 * - 36px diameter
 * - Brand secondary color background
 * - White text with semibold weight
 * - 1px white border
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";

import { colors, borderRadius, typography, spacing } from "@/lib/design-tokens";

type ClusterMarkerProps = {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  count: number;
  onPress: () => void;
};

export const ClusterMarker = memo(function ClusterMarker({
  coordinate,
  count,
  onPress,
}: ClusterMarkerProps) {
  // Format count (show 99+ for large clusters)
  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      tracksViewChanges={false}
      opacity={0.9}
    >
      <View style={styles.clusterContainer}>
        <Text style={styles.clusterText}>{displayCount}</Text>
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  clusterContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.secondary,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  clusterText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: "#FFFFFF",
  },
});
