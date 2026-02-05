import { memo } from "react";
import { Polyline } from "react-native-maps";
import { colors } from "@/lib/design-tokens";

type TrafficPolylineProps = {
  event: {
    _id: string;
    severity: number;
    location: { lat: number; lng: number };
    routePoints?: { lat: number; lng: number }[];
  };
  onPress: () => void;
};

function getTrafficColor(severity: number): string {
  if (severity >= 4) return colors.risk.high.primary;
  if (severity >= 3) return colors.risk.medium.primary;
  return colors.state.warning;
}

/**
 * Renders a traffic event as a colored polyline on the road.
 * Uses routePoints from HERE API for street geometry.
 * Falls back to invisible if no route points available.
 */
export const TrafficPolyline = memo(function TrafficPolyline({
  event,
  onPress,
}: TrafficPolylineProps) {
  // Need at least 2 points to draw a line
  if (!event.routePoints || event.routePoints.length < 2) return null;

  const coordinates = event.routePoints.map((p) => ({
    latitude: p.lat,
    longitude: p.lng,
  }));

  const strokeColor = getTrafficColor(event.severity);

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={strokeColor}
      strokeWidth={5}
      lineCap="round"
      lineJoin="round"
      tappable
      onPress={onPress}
      zIndex={30}
    />
  );
});
