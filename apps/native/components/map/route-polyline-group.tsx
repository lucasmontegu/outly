import { Fragment } from 'react';
import { View, StyleSheet } from 'react-native';
import { Polyline, Marker } from 'react-native-maps';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Home01Icon, Building01Icon, Location01Icon } from '@hugeicons/core-free-icons';
import { colors, borderRadius } from '@/lib/design-tokens';

// Route type that matches backend schema
type RouteData = {
  _id: string;
  name: string;
  fromName: string;
  toName: string;
  fromLocation: { lat: number; lng: number };
  toLocation: { lat: number; lng: number };
  icon: "building" | "running" | "home";
  monitorDays: boolean[];
  isActive: boolean;
  // Road-following polyline from HERE Routing API
  polyline?: { lat: number; lng: number }[];
  // Alternative routes with traffic data
  alternatives?: Array<{
    polyline: { lat: number; lng: number }[];
    distance: number;
    duration: number;
    typicalDuration: number;
    trafficDelay: number;
  }>;
};

type Props = {
  route: RouteData;
  isSelected: boolean;
  onPress: () => void;
};

export function RoutePolylineGroup({ route, isSelected, onPress }: Props) {
  // Determine route icon
  const getRouteIcon = (iconType: RouteData['icon']) => {
    switch (iconType) {
      case 'home': return Home01Icon;
      case 'building': return Building01Icon;
      default: return Location01Icon;
    }
  };

  const RouteIcon = getRouteIcon(route.icon);

  // Use road-following polyline if available, otherwise fallback to straight line
  const coordinates = route.polyline && route.polyline.length > 0
    ? route.polyline.map(point => ({
        latitude: point.lat,
        longitude: point.lng,
      }))
    : [
        {
          latitude: route.fromLocation.lat,
          longitude: route.fromLocation.lng,
        },
        {
          latitude: route.toLocation.lat,
          longitude: route.toLocation.lng,
        },
      ];

  // Show alternative routes if selected and available
  const showAlternatives = isSelected && route.alternatives && route.alternatives.length > 1;

  return (
    <Fragment>
      {/* Alternative routes (shown in background when selected) */}
      {showAlternatives && route.alternatives!.slice(1).map((alt, index) => (
        <Polyline
          key={`alt-${index}`}
          coordinates={alt.polyline.map(point => ({
            latitude: point.lat,
            longitude: point.lng,
          }))}
          strokeColor={colors.slate[300]}
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
          lineDashPattern={[5, 5]}
          zIndex={49}
        />
      ))}

      {/* Primary route polyline */}
      <Polyline
        coordinates={coordinates}
        strokeColor={isSelected ? colors.brand.primary : colors.slate[400]}
        strokeWidth={isSelected ? 6 : 4}
        lineCap="round"
        lineJoin="round"
        tappable
        onPress={onPress}
        zIndex={isSelected ? 100 : 50}
      />

      {/* Start marker (from location) */}
      <Marker
        coordinate={{
          latitude: route.fromLocation.lat,
          longitude: route.fromLocation.lng,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={false} // Performance optimization
      >
        <View
          style={[
            styles.routeMarker,
            isSelected && styles.routeMarkerSelected,
          ]}
        >
          <HugeiconsIcon
            icon={RouteIcon}
            size={isSelected ? 18 : 14}
            color={isSelected ? colors.brand.primary : colors.slate[500]}
          />
        </View>
      </Marker>

      {/* End marker (to location) */}
      <Marker
        coordinate={{
          latitude: route.toLocation.lat,
          longitude: route.toLocation.lng,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={false}
      >
        <View
          style={[
            styles.routeMarker,
            styles.routeMarkerEnd,
            isSelected && styles.routeMarkerSelected,
          ]}
        >
          <View
            style={[
              styles.routeMarkerPin,
              { backgroundColor: isSelected ? colors.brand.primary : colors.slate[500] }
            ]}
          />
        </View>
      </Marker>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  routeMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.slate[300],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  routeMarkerSelected: {
    borderColor: colors.brand.primary,
    transform: [{ scale: 1.15 }],
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  routeMarkerEnd: {
    // End marker is a pin instead of icon
  },
  routeMarkerPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
