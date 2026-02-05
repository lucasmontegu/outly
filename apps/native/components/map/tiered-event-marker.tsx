/**
 * TieredEventMarker
 *
 * A 3-tier marker system for map events:
 * - TIER 1 (On route): 44px, pulse animation, 100% opacity, 2px white border
 * - TIER 2 (Nearby < 2km): 32px, no animation, 80% opacity, 1px white border
 * - TIER 3 (Far > 2km): 24px, no animation, 60% opacity, 1px white border
 */

import { memo, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CloudIcon, Car01Icon } from "@hugeicons/core-free-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { Id } from "@outia/backend/convex/_generated/dataModel";

import { colors, borderRadius } from "@/lib/design-tokens";

type EventType = {
  _id: Id<"events">;
  type: "weather" | "traffic";
  subtype: string;
  severity: number;
  location: {
    lat: number;
    lng: number;
  };
};

type TieredEventMarkerProps = {
  event: EventType;
  tier: 1 | 2 | 3;
  isSelected: boolean;
  onPress: () => void;
};

export const TieredEventMarker = memo(function TieredEventMarker({
  event,
  tier,
  isSelected,
  onPress,
}: TieredEventMarkerProps) {
  // Pulse animation for TIER 1 only
  const scale = useSharedValue(1);

  useEffect(() => {
    if (tier === 1) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite
        false
      );
    } else {
      scale.value = 1;
    }
  }, [tier, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Get marker size based on tier
  const getMarkerSize = (): number => {
    switch (tier) {
      case 1:
        return 44;
      case 2:
        return 32;
      case 3:
        return 24;
    }
  };

  // Get icon size based on tier
  const getIconSize = (): number => {
    switch (tier) {
      case 1:
        return 20;
      case 2:
        return 16;
      case 3:
        return 12;
    }
  };

  // Get opacity based on tier
  const getOpacity = (): number => {
    switch (tier) {
      case 1:
        return 1.0;
      case 2:
        return 0.8;
      case 3:
        return 0.6;
    }
  };

  // Get border width based on tier
  const getBorderWidth = (): number => {
    return tier === 1 ? 2 : 1;
  };

  // Get background color based on severity
  const getBackgroundColor = (): string => {
    if (event.type === "weather") {
      if (event.severity >= 4) return colors.risk.high.primary;
      if (event.severity >= 3) return colors.risk.medium.primary;
      return colors.state.info;
    } else {
      // traffic
      if (event.severity >= 4) return colors.risk.high.primary;
      if (event.severity >= 3) return colors.risk.medium.primary;
      return colors.state.warning;
    }
  };

  const markerSize = getMarkerSize();
  const iconSize = getIconSize();
  const opacity = getOpacity();
  const borderWidth = getBorderWidth();
  const bgColor = getBackgroundColor();
  const Icon = event.type === "weather" ? CloudIcon : Car01Icon;

  return (
    <Marker
      coordinate={{
        latitude: event.location.lat,
        longitude: event.location.lng,
      }}
      onPress={onPress}
      tracksViewChanges={false}
      opacity={opacity}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            width: markerSize,
            height: markerSize,
          },
        ]}
      >
        <View
          style={[
            styles.markerContainer,
            {
              width: markerSize,
              height: markerSize,
              backgroundColor: bgColor,
              borderWidth: borderWidth,
              borderColor: "#FFFFFF",
            },
            isSelected && styles.markerSelected,
          ]}
        >
          <HugeiconsIcon icon={Icon} size={iconSize} color="#FFFFFF" />
        </View>
      </Animated.View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  markerContainer: {
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerSelected: {
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
