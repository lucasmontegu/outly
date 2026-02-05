/**
 * Example usage of AlertsListSheet component
 *
 * This file demonstrates how to integrate the alerts list sheet
 * into a map screen with full functionality.
 */

import React, { useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import MapView from "react-native-maps";
import { useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";

import { AlertsListSheet } from "./alerts-list-sheet";
import type { AlertItem, UserRoute } from "./alerts-list-sheet";
import { useLocation } from "@/hooks/use-location";

export function MapWithAlertsExample() {
  const mapRef = useRef<MapView>(null);
  const { location } = useLocation();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Query events from Convex
  const events = useQuery(
    api.events.listNearby,
    location
      ? {
          lat: location.lat,
          lng: location.lng,
          radiusKm: 5,
          asOfTimestamp: Date.now(),
        }
      : "skip"
  ) as AlertItem[] | undefined;

  // Query user's saved routes
  const userRoutes = useQuery(api.routes.getUserRoutes) as UserRoute[] | undefined;

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={
          location
            ? {
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : undefined
        }
        showsUserLocation
      />

      {/* Alerts List Sheet */}
      {events && events.length > 0 && location && (
        <AlertsListSheet
          alerts={events}
          userLocation={location}
          userRoutes={userRoutes}
          mapRef={mapRef}
          onAlertSelect={(alert) => {
            console.log("Alert selected:", alert._id);
            setSelectedAlertId(alert._id);

            // You can show a detail sheet, update state, etc.
            // The map will already be centered by the component
          }}
        />
      )}

      {/*
        Optional: Add your own event detail sheet here
        It will appear on top of the alerts list
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

// ============================================================================
// ADVANCED USAGE EXAMPLE
// ============================================================================

/**
 * Advanced example with custom state management and detail view
 */
export function MapWithAlertsAdvanced() {
  const mapRef = useRef<MapView>(null);
  const { location } = useLocation();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const events = useQuery(
    api.events.listNearby,
    location
      ? {
          lat: location.lat,
          lng: location.lng,
          radiusKm: 10, // Larger radius for more alerts
          asOfTimestamp: Date.now(),
        }
      : "skip"
  ) as AlertItem[] | undefined;

  const userRoutes = useQuery(api.routes.getUserRoutes) as UserRoute[] | undefined;

  // Find the selected alert
  const selectedAlert = events?.find((e) => e._id === selectedAlertId);

  // Count alerts on routes
  const alertsOnRoute = events?.filter((alert) => {
    if (!userRoutes) return false;
    // Check if alert is on any route
    // (This logic is also inside AlertsListSheet, but we can use it externally too)
    return userRoutes.some((route) => {
      // Simplified check - you can use the full isPointNearRoute function
      const distance = calculateSimpleDistance(alert.location, route.fromLocation);
      return distance < 1.5;
    });
  }).length ?? 0;

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} showsUserLocation />

      {/* Status overlay */}
      {events && (
        <View style={styles.statusOverlay}>
          <Text style={styles.statusText}>
            {events.length} alerts ({alertsOnRoute} on your routes)
          </Text>
        </View>
      )}

      {/* Alerts List Sheet */}
      {events && events.length > 0 && location && (
        <AlertsListSheet
          alerts={events}
          userLocation={location}
          userRoutes={userRoutes}
          mapRef={mapRef}
          onAlertSelect={(alert) => {
            setSelectedAlertId(alert._id);
            // Additional custom logic here
          }}
        />
      )}

      {/* Custom detail view */}
      {selectedAlert && (
        <DetailSheet
          alert={selectedAlert}
          onClose={() => setSelectedAlertId(null)}
        />
      )}
    </View>
  );
}

// Helper function (simplified)
function calculateSimpleDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
