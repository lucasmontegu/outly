import { useQuery, useMutation } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import { Id } from "@outly/backend/convex/_generated/dataModel";
import {
  Search01Icon,
  Alert02Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  CloudIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "heroui-native";
import { useState, useRef, useEffect } from "react";
import MapView, { Marker, Callout, Circle, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";

import { useLocation } from "@/hooks/use-location";

type SearchResult = {
  placeId: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
};

type EventType = {
  _id: Id<"events">;
  type: "weather" | "traffic";
  subtype: string;
  confidenceScore: number;
  severity: number;
  _creationTime: number;
  ttl: number;
  location: {
    lat: number;
    lng: number;
  };
  routePoints?: {
    lat: number;
    lng: number;
  }[];
};

export default function MapScreen() {
  const { location } = useLocation();
  const { eventId: eventIdParam } = useLocalSearchParams<{ eventId?: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);
  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Query nearby events
  const events = useQuery(
    api.events.listNearby,
    location ? { lat: location.lat, lng: location.lng, radiusKm: 10 } : "skip"
  ) as EventType[] | undefined;

  // Get selected event details
  const selectedEvent = events?.find((e) => e._id === selectedEventId);

  // Get user's vote on selected event
  const myVote = useQuery(
    api.confirmations.getMyVote,
    selectedEventId ? { eventId: selectedEventId } : "skip"
  );

  // Vote mutation
  const vote = useMutation(api.confirmations.vote);

  // Select event from navigation params
  useEffect(() => {
    if (eventIdParam && events) {
      const eventExists = events.some((e) => e._id === eventIdParam);
      if (eventExists) {
        setSelectedEventId(eventIdParam as Id<"events">);
      }
    }
  }, [eventIdParam, events]);

  // Center map on user location when it loads
  useEffect(() => {
    if (location && mapRef.current && !eventIdParam) {
      mapRef.current.animateToRegion({
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  }, [location, eventIdParam]);

  // Center map on selected event
  useEffect(() => {
    if (selectedEvent && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: selectedEvent.location.lat,
        longitude: selectedEvent.location.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 300);
    }
  }, [selectedEvent]);

  const handleVote = async (voteType: "still_active" | "cleared" | "not_exists") => {
    if (!selectedEventId) return;
    await vote({ eventId: selectedEventId, vote: voteType });
  };

  const handleMarkerPress = (eventId: Id<"events">) => {
    setSelectedEventId(eventId);
  };

  const handleMapPress = () => {
    setSelectedEventId(null);
  };

  const getTimeRemaining = (ttl: number): string => {
    const remaining = ttl - Date.now();
    if (remaining <= 0) return "Expired";
    const minutes = Math.floor(remaining / 60000);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const getTimeAgo = (timestamp: number): string => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getEventIcon = (type: string) => {
    return type === "weather" ? CloudIcon : Alert02Icon;
  };

  const getEventColor = (severity: number): string => {
    if (severity >= 4) return "#EF4444";
    if (severity >= 3) return "#F59E0B";
    return "#3B82F6";
  };

  const getMarkerColor = (severity: number): string => {
    if (severity >= 4) return "#DC2626"; // red-600
    if (severity >= 3) return "#D97706"; // amber-600
    return "#2563EB"; // blue-600
  };

  const getConfidenceLabel = (score: number): string => {
    if (score >= 80) return "High Confidence";
    if (score >= 50) return "Medium Confidence";
    return "Low Confidence";
  };

  const formatSubtype = (subtype: string): string => {
    return subtype
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  };

  // Search locations using OpenStreetMap Nominatim
  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          new URLSearchParams({
            q: query,
            format: "json",
            addressdetails: "1",
            limit: "5",
          }),
        {
          headers: {
            "User-Agent": "Outly/1.0",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const results: SearchResult[] = data.map((item: any) => ({
          placeId: item.place_id.toString(),
          name: item.name || item.display_name.split(",")[0],
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
        setSearchResults(results);
        setShowResults(results.length > 0);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocations(text);
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSearchSelect = (result: SearchResult) => {
    setSearchQuery(result.name);
    setSearchResults([]);
    setShowResults(false);
    setSelectedEventId(null);
    Keyboard.dismiss();

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: result.lat,
        longitude: result.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <HugeiconsIcon icon={Search01Icon} size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
            returnKeyType="search"
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#3B82F6" />
          )}
          {searchQuery.length > 0 && !isSearching && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <HugeiconsIcon icon={Cancel01Icon} size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((result) => (
              <TouchableOpacity
                key={result.placeId}
                style={styles.searchResultItem}
                onPress={() => handleSearchSelect(result)}
              >
                <HugeiconsIcon icon={Location01Icon} size={18} color="#3B82F6" />
                <View style={styles.searchResultText}>
                  <Text style={styles.searchResultName} numberOfLines={1}>
                    {result.name}
                  </Text>
                  <Text style={styles.searchResultAddress} numberOfLines={1}>
                    {result.displayName}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {!location ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: location.lat,
              longitude: location.lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
            showsMyLocationButton={false}
            onPress={handleMapPress}
          >
            {/* Traffic route polylines (like Waze congestion lines) */}
            {events?.filter((e) => e.routePoints && e.routePoints.length > 1).map((event) => (
              <Polyline
                key={`polyline-${event._id}`}
                coordinates={event.routePoints!.map((p) => ({
                  latitude: p.lat,
                  longitude: p.lng,
                }))}
                strokeColor={getMarkerColor(event.severity)}
                strokeWidth={event.severity >= 4 ? 8 : event.severity >= 3 ? 6 : 4}
                lineCap="round"
                lineJoin="round"
                tappable
                onPress={() => handleMarkerPress(event._id)}
              />
            ))}

            {/* Event circles (area of effect) - only for events without route points */}
            {events?.filter((e) => !e.routePoints || e.routePoints.length < 2).map((event) => (
              <Circle
                key={`circle-${event._id}`}
                center={{
                  latitude: event.location.lat,
                  longitude: event.location.lng,
                }}
                radius={event.type === "traffic" ? 500 : 1000}
                fillColor={`${getMarkerColor(event.severity)}20`}
                strokeColor={`${getMarkerColor(event.severity)}60`}
                strokeWidth={2}
              />
            ))}

            {/* Event markers */}
            {events?.map((event) => (
              <Marker
                key={event._id}
                coordinate={{
                  latitude: event.location.lat,
                  longitude: event.location.lng,
                }}
                onPress={() => handleMarkerPress(event._id)}
              >
                <View style={[
                  styles.customMarker,
                  { borderColor: getMarkerColor(event.severity) },
                  selectedEventId === event._id && styles.customMarkerSelected,
                ]}>
                  <HugeiconsIcon
                    icon={getEventIcon(event.type)}
                    size={18}
                    color={getMarkerColor(event.severity)}
                  />
                </View>
                <Callout tooltip onPress={() => handleMarkerPress(event._id)}>
                  <View style={styles.calloutContainer}>
                    <View style={[styles.calloutBadge, { backgroundColor: getMarkerColor(event.severity) }]}>
                      <Text style={styles.calloutBadgeText}>
                        {event.type === "traffic" ? "TRAFFIC" : "WEATHER"}
                      </Text>
                    </View>
                    <Text style={styles.calloutTitle}>{formatSubtype(event.subtype)}</Text>
                    <Text style={styles.calloutSubtext}>
                      {getTimeAgo(event._creationTime)} · {event.confidenceScore}% confidence
                    </Text>
                    <Text style={styles.calloutHint}>Tap for details</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        )}

        {/* My Location Button */}
        {location && (
          <TouchableOpacity style={styles.myLocationButton} onPress={centerOnUser}>
            <HugeiconsIcon icon={Location01Icon} size={22} color="#3B82F6" />
          </TouchableOpacity>
        )}

        {/* Events count badge */}
        {events && events.length > 0 && (
          <View style={styles.eventsBadge}>
            <Text style={styles.eventsBadgeText}>
              {events.length} signal{events.length !== 1 ? "s" : ""} nearby
            </Text>
          </View>
        )}
      </View>

      {/* Event Detail Card */}
      {selectedEvent && (
        <View style={styles.eventCardContainer}>
          <Card style={styles.eventCard}>
            <Card.Body style={styles.eventCardBody}>
              {/* Header */}
              <View style={styles.eventHeader}>
                <View
                  style={[
                    styles.eventIconContainer,
                    { backgroundColor: `${getEventColor(selectedEvent.severity)}20` },
                  ]}
                >
                  <HugeiconsIcon
                    icon={getEventIcon(selectedEvent.type)}
                    size={24}
                    color={getEventColor(selectedEvent.severity)}
                  />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>
                    {formatSubtype(selectedEvent.subtype)}
                  </Text>
                  <Text style={styles.eventMeta}>
                    Reported {getTimeAgo(selectedEvent._creationTime)}
                  </Text>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceLabel}>
                    {getConfidenceLabel(selectedEvent.confidenceScore)}
                  </Text>
                  <Text style={styles.confidenceValue}>
                    {selectedEvent.confidenceScore}%
                  </Text>
                </View>
              </View>

              {/* Expiry info */}
              <View style={styles.expiryRow}>
                <Text style={styles.expiryText}>
                  Expires in {getTimeRemaining(selectedEvent.ttl)}
                </Text>
              </View>

              {/* Voting section */}
              <View style={styles.votingSection}>
                <Text style={styles.votingLabel}>IS THIS STILL HAPPENING?</Text>
                <View style={styles.votingButtons}>
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      styles.voteYes,
                      myVote?.vote === "still_active" && styles.voteSelected,
                    ]}
                    onPress={() => handleVote("still_active")}
                  >
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#10B981" />
                    <Text style={[styles.voteText, styles.voteYesText]}>Yes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      styles.voteCleared,
                      myVote?.vote === "cleared" && styles.voteSelected,
                    ]}
                    onPress={() => handleVote("cleared")}
                  >
                    <Text style={[styles.voteText, styles.voteClearedText]}>Cleared</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      styles.voteNo,
                      myVote?.vote === "not_exists" && styles.voteSelected,
                    ]}
                    onPress={() => handleVote("not_exists")}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={18} color="#EF4444" />
                    <Text style={[styles.voteText, styles.voteNoText]}>Not Here</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card.Body>
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  clearButton: {
    padding: 4,
  },
  searchResults: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  searchResultAddress: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  customMarkerSelected: {
    transform: [{ scale: 1.2 }],
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  calloutContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    minWidth: 180,
    maxWidth: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  calloutBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  calloutBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  calloutSubtext: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 6,
  },
  calloutHint: {
    fontSize: 10,
    color: "#3B82F6",
    fontWeight: "600",
  },
  myLocationButton: {
    position: "absolute",
    right: 16,
    top: 120,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  eventsBadge: {
    position: "absolute",
    left: 16,
    top: 120,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventsBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  eventCardContainer: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  eventCardBody: {
    padding: 20,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  eventIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  eventMeta: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "flex-end",
  },
  confidenceLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#059669",
    letterSpacing: 0.3,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  expiryRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  expiryText: {
    fontSize: 13,
    color: "#F59E0B",
    fontWeight: "500",
  },
  votingSection: {
    marginTop: 16,
  },
  votingLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  votingButtons: {
    flexDirection: "row",
    gap: 10,
  },
  voteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  voteSelected: {
    borderWidth: 2,
    borderColor: "#111827",
  },
  voteYes: {
    backgroundColor: "#D1FAE5",
  },
  voteCleared: {
    backgroundColor: "#F3F4F6",
  },
  voteNo: {
    backgroundColor: "#FEE2E2",
  },
  voteText: {
    fontSize: 14,
    fontWeight: "600",
  },
  voteYesText: {
    color: "#059669",
  },
  voteClearedText: {
    color: "#6B7280",
  },
  voteNoText: {
    color: "#DC2626",
  },
});
