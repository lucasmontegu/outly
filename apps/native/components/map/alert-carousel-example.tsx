/**
 * Example: Using AlertCarousel in map.tsx
 *
 * This example demonstrates how to integrate the AlertCarousel component
 * into the existing map screen, either replacing or alongside AlertsListSheet.
 */

import { useState, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { Id } from "@outia/backend/convex/_generated/dataModel";
import MapView from "react-native-maps";

import { AlertCarousel } from "@/components/map/alert-carousel";
import type { AlertItem } from "@/components/map/alert-carousel";
import { useLocation } from "@/hooks/use-location";

/**
 * OPTION 1: Replace AlertsListSheet with AlertCarousel
 *
 * Simply swap the AlertsListSheet component with AlertCarousel.
 * Both have similar APIs, making migration straightforward.
 */
export function MapWithCarousel() {
  const { location } = useLocation();
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);
  const mapRef = useRef<MapView>(null);

  // Query events and routes
  const events = useQuery(
    api.events.listNearbySlim,
    location ? { lat: location.lat, lng: location.lng, radiusKm: 5 } : "skip"
  );
  const userRoutes = useQuery(api.routes.getUserRoutes);

  // Optional: Track user votes
  const userVotes = useQuery(api.confirmations.getMyVotes);

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map}>
        {/* Your map markers, circles, polylines */}
      </MapView>

      {/* Alert Carousel at bottom */}
      {events && events.length > 0 && location && (
        <AlertCarousel
          alerts={events as AlertItem[]}
          userLocation={location}
          userRoutes={userRoutes}
          onAlertSelect={(alert) => setSelectedEventId(alert._id as Id<"events">)}
          selectedAlertId={selectedEventId || undefined}
          userVotes={userVotes}
        />
      )}
    </View>
  );
}

/**
 * OPTION 2: Toggle between Carousel and List views
 *
 * Give users the choice between horizontal carousel and vertical list.
 * Store preference in local state or user settings.
 */
export function MapWithToggleableViews() {
  const { location } = useLocation();
  const [viewMode, setViewMode] = useState<"carousel" | "list">("carousel");
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);
  const mapRef = useRef<MapView>(null);

  const events = useQuery(
    api.events.listNearbySlim,
    location ? { lat: location.lat, lng: location.lng, radiusKm: 5 } : "skip"
  );
  const userRoutes = useQuery(api.routes.getUserRoutes);

  const handleAlertSelect = (alert: AlertItem) => {
    setSelectedEventId(alert._id as Id<"events">);
  };

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map}>
        {/* Map content */}
      </MapView>

      {/* View toggle button (could be in header or floating) */}
      {/* <ViewToggleButton viewMode={viewMode} onToggle={() => setViewMode(...)} /> */}

      {/* Conditional rendering based on view mode */}
      {events && events.length > 0 && location && (
        viewMode === "carousel" ? (
          <AlertCarousel
            alerts={events as AlertItem[]}
            userLocation={location}
            userRoutes={userRoutes}
            onAlertSelect={handleAlertSelect}
            selectedAlertId={selectedEventId || undefined}
          />
        ) : (
          // Import and use AlertsListSheet here if you want both options
          <View /> // Placeholder for AlertsListSheet
        )
      )}
    </View>
  );
}

/**
 * OPTION 3: Both views simultaneously
 *
 * Show carousel at bottom for quick browsing, keep sheet collapsed
 * but available for detailed filtering and sorting.
 */
export function MapWithBothViews() {
  const { location } = useLocation();
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);
  const mapRef = useRef<MapView>(null);

  const events = useQuery(
    api.events.listNearbySlim,
    location ? { lat: location.lat, lng: location.lng, radiusKm: 5 } : "skip"
  );
  const userRoutes = useQuery(api.routes.getUserRoutes);

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map}>
        {/* Map content */}
      </MapView>

      {events && events.length > 0 && location && (
        <>
          {/* Carousel for quick browsing (positioned above bottom sheet) */}
          <View style={styles.carouselWrapper}>
            <AlertCarousel
              alerts={events as AlertItem[]}
              userLocation={location}
              userRoutes={userRoutes}
              onAlertSelect={(alert) => setSelectedEventId(alert._id as Id<"events">)}
              selectedAlertId={selectedEventId || undefined}
            />
          </View>

          {/* Bottom sheet for detailed view (collapsed by default) */}
          {/* <AlertsListSheet ... /> */}
        </>
      )}
    </View>
  );
}

/**
 * IMPLEMENTATION STEPS:
 *
 * 1. Import AlertCarousel in apps/native/app/(tabs)/map.tsx
 *
 * 2. Replace AlertsListSheet render with:
 *    <AlertCarousel
 *      alerts={events as AlertItem[]}
 *      userLocation={location}
 *      userRoutes={userRoutes}
 *      onAlertSelect={(alert) => setSelectedEventId(alert._id as Id<"events">)}
 *      selectedAlertId={selectedEventId || undefined}
 *    />
 *
 * 3. Adjust bottom positioning if needed (default is bottom: 20)
 *
 * 4. Test scroll behavior, selection, and event detail sheet interaction
 *
 * 5. Optional: Add userVotes prop if you track vote status:
 *    const userVotes = useQuery(api.confirmations.getMyVotes);
 *
 * 6. Optional: Adjust CARD_WIDTH/HEIGHT in alert-carousel.tsx for your design
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  carouselWrapper: {
    position: "absolute",
    bottom: 140, // Above bottom sheet
    left: 0,
    right: 0,
  },
});
