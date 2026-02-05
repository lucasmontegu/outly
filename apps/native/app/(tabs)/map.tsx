import { useQuery, useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { Id } from "@outia/backend/convex/_generated/dataModel";
import {
  Search01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  CloudIcon,
  Location01Icon,
  Tick02Icon,
  Car01Icon,
  Navigation03Icon,
  CarouselHorizontalIcon,
  GridViewIcon,
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
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import MapView, { Circle, PROVIDER_DEFAULT } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutDown,
} from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";

import { useLocation } from "@/hooks/use-location";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";
import { calculateDistance, isPointNearRoute } from "@/lib/geo-utils";
import { lightHaptic, mediumHaptic } from "@/lib/haptics";
import { AlertsListSheet } from "@/components/alerts-list-sheet";
import type { AlertItem, UserRoute } from "@/components/alerts-list-sheet";
import { AlertCarousel } from "@/components/map/alert-carousel";
import { RoutePolylineGroup } from "@/components/map/route-polyline-group";
import { TieredEventMarker } from "@/components/map/tiered-event-marker";
import { TrafficPolyline } from "@/components/map/traffic-polyline";
import { ClusterMarker } from "@/components/map/cluster-marker";
import { clusterEvents } from "@/lib/cluster-utils";

// Round timestamp to nearest minute for better Convex cache hits
function getRoundedTimestamp(): number {
  return Math.floor(Date.now() / 60000) * 60000;
}

type SearchResult = {
  placeId: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
};

// Matches mediumEventDoc from backend (includes routePoints for traffic polylines)
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
  routePoints?: { lat: number; lng: number }[];
  radius: number;
};

type TieredEvent = EventType & { tier: 1 | 2 | 3 };

// Full route type from backend (has more fields than UserRoute from alerts-list-sheet)
type FullRoute = {
  _id: Id<"routes">;
  _creationTime: number;
  userId: string;
  name: string;
  fromName: string;
  toName: string;
  fromLocation: { lat: number; lng: number };
  toLocation: { lat: number; lng: number };
  fromLocationId?: Id<"userLocations">;
  toLocationId?: Id<"userLocations">;
  icon: "building" | "running" | "home";
  monitorDays: boolean[];
  alertThreshold: number;
  alertTime: string;
  isActive: boolean;
};

/**
 * Helper function to calculate event marker tier
 * TIER 1: On user's active route (< 1.5km from route line)
 * TIER 2: Nearby (< 2km from user location)
 * TIER 3: Far (>= 2km from user location)
 */
function calculateEventTier(
  event: EventType,
  userLocation: { lat: number; lng: number } | null,
  activeRoutes: FullRoute[]
): 1 | 2 | 3 {
  if (!userLocation) return 3;

  // Check TIER 1: On any active route
  for (const route of activeRoutes) {
    if (
      isPointNearRoute(
        event.location,
        route.fromLocation,
        route.toLocation,
        1.5 // 1.5km threshold for "on route"
      )
    ) {
      return 1;
    }
  }

  // Check TIER 2: Nearby (< 2km)
  const distance = calculateDistance(userLocation, event.location);
  if (distance < 2) {
    return 2;
  }

  // TIER 3: Far
  return 3;
}

// Floating search bar component
function MapSearchBar({
  value,
  onChangeText,
  isSearching,
  onClear,
  onFocus,
}: {
  value: string;
  onChangeText: (text: string) => void;
  isSearching: boolean;
  onClear: () => void;
  onFocus: () => void;
}) {
  return (
    <BlurView
      intensity={Platform.OS === 'ios' ? 80 : 100}
      tint="light"
      style={styles.searchBarContainer}
    >
      <View style={styles.searchBarInner}>
        <HugeiconsIcon icon={Search01Icon} size={20} color={colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search location..."
          placeholderTextColor={colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          returnKeyType="search"
          autoComplete="street-address"
          textContentType="fullStreetAddress"
          accessibilityLabel="Search for a location"
        />
        {isSearching && (
          <ActivityIndicator size="small" color={colors.brand.secondary} />
        )}
        {value.length > 0 && !isSearching && (
          <TouchableOpacity
            onPress={onClear}
            style={styles.clearButton}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
    </BlurView>
  );
}

// Event detail bottom sheet component
function EventDetailSheet({
  event,
  myVote,
  isVoting,
  justVoted,
  onVote,
  onClose,
  bottomOffset = 120,
}: {
  event: EventType;
  myVote: { vote: string } | null | undefined;
  isVoting: boolean;
  justVoted: boolean;
  onVote: (voteType: "still_active" | "cleared" | "not_exists") => void;
  onClose: () => void;
  bottomOffset?: number;
}) {
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

  const formatSubtype = (subtype: string): string => {
    return subtype
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getVoteLabel = (voteType: string): string => {
    switch (voteType) {
      case "still_active": return "Still happening";
      case "cleared": return "Cleared";
      case "not_exists": return "Not here";
      default: return voteType;
    }
  };

  const getEventColor = (severity: number): string => {
    if (severity >= 4) return colors.state.error;
    if (severity >= 3) return colors.state.warning;
    return colors.state.info;
  };

  const EventIcon = event.type === "weather" ? CloudIcon : Car01Icon;

  return (
    <Animated.View
      style={[styles.sheetContainer, { bottom: bottomOffset }]}
      entering={FadeInDown.duration(250)}
      exiting={FadeOutDown.duration(150)}
    >
      <View style={styles.sheetBlur}>
        <View style={styles.sheetContent}>
          {/* Handle bar */}
          <View style={styles.sheetHandle} />

          {justVoted ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.confirmationState}
            >
              <View style={styles.confirmationIconBlue}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.confirmationTitleBlue}>Great job!</Text>
              <Text style={styles.confirmationSubtitleBlue}>
                Your vote keeps the community safe
              </Text>
              <TouchableOpacity
                style={styles.confirmationDismissButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmationDismissText}>Ok, thanks!</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <>
              {/* Header */}
              <View style={styles.sheetHeader}>
                <View
                  style={[
                    styles.eventIconContainer,
                    { backgroundColor: `${getEventColor(event.severity)}15` },
                  ]}
                >
                  <HugeiconsIcon
                    icon={EventIcon}
                    size={24}
                    color={getEventColor(event.severity)}
                  />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>
                    {formatSubtype(event.subtype)}
                  </Text>
                  <Text style={styles.eventMeta}>
                    Reported {getTimeAgo(event._creationTime)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeSheetButton}
                  onPress={onClose}
                  accessibilityLabel="Close event details"
                  accessibilityRole="button"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
              </View>

              {/* Info pills row */}
              <View style={styles.infoPillsRow}>
                <View style={styles.severityPill}>
                  <Text style={styles.severityPillText}>
                    Severity {event.severity}/5
                  </Text>
                </View>
                <View style={styles.confidencePill}>
                  <Text style={styles.confidencePillText}>
                    {event.confidenceScore}% confidence
                  </Text>
                </View>
                <Text style={styles.expiryText}>
                  Expires {getTimeRemaining(event.ttl)}
                </Text>
              </View>

              {/* Voting section */}
              {myVote === null ? (
                <View style={styles.votingSection}>
                  <Text style={styles.votingLabel}>HELP THE COMMUNITY</Text>
                  <Text style={styles.votingQuestion}>Is this still happening?</Text>
                  <View style={styles.votingRow}>
                    <TouchableOpacity
                      style={[styles.voteButton, styles.voteButtonYes]}
                      onPress={() => onVote("still_active")}
                      disabled={isVoting}
                      activeOpacity={0.7}
                    >
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color={colors.brand.secondary} />
                      <Text style={[styles.voteButtonText, { color: colors.brand.secondary }]}>Yes, active</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.voteButton, styles.voteButtonNo]}
                      onPress={() => onVote("cleared")}
                      disabled={isVoting}
                      activeOpacity={0.7}
                    >
                      <HugeiconsIcon icon={Tick02Icon} size={18} color={colors.text.secondary} />
                      <Text style={[styles.voteButtonText, { color: colors.text.secondary }]}>Cleared</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.voteButton, styles.voteButtonNotHere]}
                      onPress={() => onVote("not_exists")}
                      disabled={isVoting}
                      activeOpacity={0.7}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={18} color={colors.text.tertiary} />
                      <Text style={[styles.voteButtonText, { color: colors.text.tertiary }]}>Not here</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.votedStatus}>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color={colors.brand.secondary} />
                  <Text style={styles.votedStatusText}>
                    You voted: {myVote && getVoteLabel(myVote.vote)}
                  </Text>
                  <TouchableOpacity style={styles.changeVoteButton}>
                    <Text style={styles.changeVoteText}>Change</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// Bottom view toggle button component
function ViewToggleButton({
  view,
  onToggle,
  bottom,
}: {
  view: 'sheet' | 'carousel';
  onToggle: () => void;
  bottom: number;
}) {
  return (
    <TouchableOpacity
      style={[styles.viewToggleButton, { bottom }]}
      onPress={() => {
        lightHaptic();
        onToggle();
      }}
      accessibilityLabel={`Switch to ${view === 'sheet' ? 'carousel' : 'list'} view`}
      accessibilityRole="button"
    >
      <HugeiconsIcon
        icon={view === 'sheet' ? CarouselHorizontalIcon : GridViewIcon}
        size={20}
        color={colors.brand.secondary}
      />
    </TouchableOpacity>
  );
}

// Custom tab bar height: 56px tab + 16px vertical padding + container bottom offset (8px)
const TAB_BAR_CHROME = 80;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_CHROME + insets.bottom;
  const { location, error: locationError, refresh: refreshLocation, isLoading: locationLoading } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<Id<"routes"> | null>(null);
  const [bottomView, setBottomView] = useState<'sheet' | 'carousel'>('sheet');
  const [justVoted, setJustVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [timestamp, setTimestamp] = useState(getRoundedTimestamp);
  const { eventId: eventIdParam } = useLocalSearchParams<{ eventId?: string }>();
  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only subscribe when screen is focused (reduces bandwidth when on other tabs)
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      setTimestamp(getRoundedTimestamp()); // Refresh data when returning to screen
      return () => setIsScreenFocused(false);
    }, [])
  );

  // Query nearby events with medium query (includes routePoints for traffic polylines)
  const events = useQuery(
    api.events.listNearbyMedium,
    location && isScreenFocused
      ? {
          lat: location.lat,
          lng: location.lng,
          radiusKm: 5,
          asOfTimestamp: timestamp,
        }
      : "skip"
  ) as EventType[] | undefined;

  // Query user's saved routes (full route data for polylines)
  const userRoutes = useQuery(
    api.routes.getUserRoutes,
    isScreenFocused ? {} : "skip"
  ) as FullRoute[] | undefined;

  // Convert to minimal UserRoute type for AlertsListSheet compatibility
  const userRoutesForAlerts: UserRoute[] | undefined = useMemo(() => {
    return userRoutes?.map(route => ({
      _id: route._id as unknown as string,
      name: route.name,
      fromLocation: route.fromLocation,
      toLocation: route.toLocation,
    }));
  }, [userRoutes]);

  // Filter to routes monitored today
  const activeRoutes = useMemo(() => {
    if (!userRoutes) return [];
    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    return userRoutes.filter(route =>
      route.isActive &&
      route.monitorDays[today]
    );
  }, [userRoutes]);

  // Partition events by type and tier for different rendering strategies
  const { weatherEvents, trafficEvents, tier3Events } = useMemo(() => {
    if (!events || !location) return { weatherEvents: [] as TieredEvent[], trafficEvents: [] as TieredEvent[], tier3Events: [] as TieredEvent[] };

    const weather: TieredEvent[] = [];
    const traffic: TieredEvent[] = [];
    const tier3: TieredEvent[] = [];

    events.forEach((event) => {
      const tier = calculateEventTier(event, location, activeRoutes);
      const tieredEvent = { ...event, tier } as TieredEvent;

      if (tier === 3) {
        tier3.push(tieredEvent);
      } else if (event.type === "weather") {
        weather.push(tieredEvent);
      } else {
        traffic.push(tieredEvent);
      }
    });

    return { weatherEvents: weather, trafficEvents: traffic, tier3Events: tier3 };
  }, [events, location, activeRoutes]);

  // Cluster Tier 3 events into count badges (reduces visual clutter)
  const { clusters: tier3Clusters, singles: tier3Singles } = useMemo(
    () => clusterEvents(tier3Events, 2),
    [tier3Events]
  );

  const selectedEvent = events?.find((e) => e._id === selectedEventId);

  const myVote = useQuery(
    api.confirmations.getMyVote,
    selectedEventId ? { eventId: selectedEventId } : "skip"
  );

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
    if (!selectedEventId || isVoting) return;

    setIsVoting(true);
    try {
      await vote({ eventId: selectedEventId, vote: voteType });
      mediumHaptic();
      setJustVoted(true);

      dismissTimeoutRef.current = setTimeout(() => {
        setSelectedEventId(null);
        setJustVoted(false);
      }, 2000);
    } finally {
      setIsVoting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [selectedEventId]);

  useEffect(() => {
    setJustVoted(false);
  }, [selectedEventId]);

  const handleMarkerPress = useCallback((eventId: Id<"events">) => {
    lightHaptic();
    setSelectedEventId(eventId);
  }, []);

  const handleMapPress = useCallback(() => {
    setSelectedEventId(null);
    Keyboard.dismiss();
  }, []);

  const getMarkerColor = (severity: number): string => {
    if (severity >= 4) return colors.risk.high.dark;
    if (severity >= 3) return colors.risk.medium.dark;
    return colors.brand.secondary;
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
            "User-Agent": "Outia/1.0",
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
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        {locationError ? (
          <View style={styles.loadingContainer}>
            <HugeiconsIcon icon={Location01Icon} size={48} color={colors.text.tertiary} />
            <Text style={styles.errorTitle}>Location Unavailable</Text>
            <Text style={styles.loadingText}>
              {locationError === "Location permission denied"
                ? "Enable location access in settings"
                : "Unable to get your location"}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshLocation}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : !location || locationLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brand.secondary} />
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
            {/* User route polylines */}
            {activeRoutes.map((route) => {
              const isSelected = selectedRouteId === route._id;

              return (
                <RoutePolylineGroup
                  key={route._id}
                  route={route}
                  isSelected={isSelected}
                  onPress={() => {
                    mediumHaptic();
                    setSelectedRouteId(isSelected ? null : route._id);
                  }}
                />
              );
            })}

            {/* Weather circles - reduced opacity, severity-aware radius cap */}
            {weatherEvents.map((event) => {
              // Severe weather gets larger radius to reflect real danger zone
              const maxRadius = event.severity >= 4 ? 3000 : event.severity >= 3 ? 1500 : 500;
              return (
                <Circle
                  key={`circle-${event._id}`}
                  center={{
                    latitude: event.location.lat,
                    longitude: event.location.lng,
                  }}
                  radius={Math.min(event.radius || 1000, maxRadius)}
                  fillColor={`${getMarkerColor(event.severity)}14`}
                  strokeColor={`${getMarkerColor(event.severity)}30`}
                  strokeWidth={1}
                />
              );
            })}

            {/* Traffic polylines - street geometry from HERE API */}
            {trafficEvents.map((event) => (
              <TrafficPolyline
                key={`poly-${event._id}`}
                event={event}
                onPress={() => handleMarkerPress(event._id)}
              />
            ))}

            {/* Weather markers - Tier 1 + 2 only */}
            {weatherEvents.map((event) => (
              <TieredEventMarker
                key={event._id}
                event={event}
                tier={event.tier}
                isSelected={selectedEventId === event._id}
                onPress={() => handleMarkerPress(event._id)}
              />
            ))}

            {/* Tier 3 clusters - count badge markers */}
            {tier3Clusters.map((cluster) => (
              <ClusterMarker
                key={cluster.id}
                coordinate={cluster.coordinate}
                count={cluster.count}
                onPress={() => {
                  lightHaptic();
                  mapRef.current?.animateToRegion({
                    latitude: cluster.coordinate.latitude,
                    longitude: cluster.coordinate.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }, 500);
                }}
              />
            ))}

            {/* Tier 3 singles - individual markers for unclustered far events */}
            {tier3Singles.map((event) => (
              <TieredEventMarker
                key={event._id}
                event={event}
                tier={3}
                isSelected={selectedEventId === event._id}
                onPress={() => handleMarkerPress(event._id)}
              />
            ))}
          </MapView>
        )}

        {/* Floating search bar */}
        <SafeAreaView style={styles.searchBarWrapper} edges={["top"]}>
          <MapSearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            isSearching={isSearching}
            onClear={clearSearch}
            onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
          />

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={styles.searchResults}
            >
              {searchResults.map((result) => (
                <TouchableOpacity
                  key={result.placeId}
                  style={styles.searchResultItem}
                  onPress={() => handleSearchSelect(result)}
                >
                  <View style={styles.searchResultIcon}>
                    <HugeiconsIcon icon={Location01Icon} size={18} color={colors.brand.secondary} />
                  </View>
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
            </Animated.View>
          )}
        </SafeAreaView>

        {/* My Location Button */}
        {location && (
          <TouchableOpacity
            style={styles.myLocationButton}
            onPress={centerOnUser}
            accessibilityLabel="Center on my location"
            accessibilityRole="button"
          >
            <HugeiconsIcon icon={Navigation03Icon} size={22} color={colors.brand.secondary} />
          </TouchableOpacity>
        )}

        {/* Events count badge */}
        {events && events.length > 0 && (
          <View style={styles.eventsBadge}>
            <View style={styles.eventsBadgeDot} />
            <Text style={styles.eventsBadgeText}>
              {weatherEvents.length + trafficEvents.length} near
              {tier3Events.length > 0 ? ` · ${tier3Events.length} far` : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom UI - Conditional rendering based on view mode */}
      {events && events.length > 0 && location && (
        <>
          {bottomView === 'sheet' ? (
            <AlertsListSheet
              alerts={events as AlertItem[]}
              userLocation={location}
              userRoutes={userRoutesForAlerts}
              mapRef={mapRef}
              bottomInset={tabBarHeight}
              onAlertSelect={(alert) => {
                lightHaptic();
                setSelectedEventId(alert._id as Id<"events">);
              }}
            />
          ) : (
            <AlertCarousel
              alerts={events as AlertItem[]}
              userLocation={location}
              userRoutes={userRoutesForAlerts}
              bottomInset={tabBarHeight + 12}
              onAlertSelect={(alert) => {
                mediumHaptic();
                setSelectedEventId(alert._id as Id<"events">);
              }}
              selectedAlertId={selectedEventId || undefined}
            />
          )}

          {/* View Toggle Button - positioned above carousel/sheet */}
          <ViewToggleButton
            view={bottomView}
            onToggle={() => setBottomView(bottomView === 'sheet' ? 'carousel' : 'sheet')}
            bottom={tabBarHeight + (bottomView === 'carousel' ? 188 : 12)}
          />
        </>
      )}

      {/* Event Detail Bottom Sheet */}
      {selectedEvent && (
        <EventDetailSheet
          event={selectedEvent}
          myVote={myVote}
          isVoting={isVoting}
          justVoted={justVoted}
          onVote={handleVote}
          onClose={() => setSelectedEventId(null)}
          bottomOffset={tabBarHeight + 16}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
    backgroundColor: colors.slate[100],
    gap: spacing[3],
    paddingHorizontal: spacing[6],
  },
  loadingText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  retryButton: {
    marginTop: spacing[2],
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },

  // Floating search bar
  searchBarWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  searchBarContainer: {
    borderRadius: borderRadius['2xl'],
    overflow: "hidden",
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchBarInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.85)' : '#FFFFFF',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3] + 2,
    gap: spacing[3],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  clearButton: {
    padding: spacing[1],
  },
  searchResults: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    marginTop: spacing[2],
    ...shadows.lg,
    overflow: "hidden",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  searchResultIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.brand.secondary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  searchResultAddress: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Map controls
  myLocationButton: {
    position: "absolute",
    right: spacing[4],
    top: 140,
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventsBadge: {
    position: "absolute",
    left: spacing[4],
    top: 140,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2] + 2,
    borderRadius: borderRadius.full,
    gap: spacing[2],
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  eventsBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.risk.medium.primary,
  },
  eventsBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },

  // Bottom sheet
  sheetContainer: {
    position: "absolute",
    left: spacing[4],
    right: spacing[4],
  },
  sheetBlur: {
    borderRadius: borderRadius['3xl'],
    overflow: "hidden",
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    padding: spacing[5],
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: `${colors.brand.secondary}30`,
    alignSelf: "center",
    marginBottom: spacing[4],
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  eventIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  eventMeta: {
    fontSize: typography.size.sm + 1,
    color: colors.text.secondary,
    marginTop: 2,
  },
  closeSheetButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
  },

  // Info pills
  infoPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[4],
    flexWrap: "wrap",
  },
  severityPill: {
    backgroundColor: colors.risk.medium.light,
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: spacing[1] + 2,
    borderRadius: borderRadius.full,
  },
  severityPillText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.risk.medium.dark,
  },
  confidencePill: {
    backgroundColor: colors.risk.low.light,
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: spacing[1] + 2,
    borderRadius: borderRadius.full,
  },
  confidencePillText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.risk.low.dark,
  },
  expiryText: {
    fontSize: typography.size.xs,
    color: colors.state.warning,
    fontWeight: typography.weight.medium,
    marginLeft: "auto",
  },

  // Voting section
  votingSection: {
    marginTop: spacing[4],
    backgroundColor: `${colors.brand.secondary}06`,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: `${colors.brand.secondary}12`,
  },
  votingLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.brand.secondary,
    letterSpacing: typography.tracking.wider,
    marginBottom: spacing[1],
  },
  votingQuestion: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  votingRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  voteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: borderRadius.full,
    gap: spacing[1] + 2,
    borderWidth: 1.5,
  },
  voteButtonYes: {
    backgroundColor: `${colors.brand.secondary}08`,
    borderColor: `${colors.brand.secondary}30`,
  },
  voteButtonNo: {
    backgroundColor: colors.slate[50],
    borderColor: colors.slate[200],
  },
  voteButtonNotHere: {
    backgroundColor: colors.slate[50],
    borderColor: colors.slate[200],
  },
  voteButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },

  // Confirmation state - blue card inspired by Daily UI #45
  confirmationState: {
    alignItems: "center",
    backgroundColor: colors.brand.secondary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[5],
    marginVertical: -spacing[1],
    marginHorizontal: -spacing[1],
  },
  confirmationIconBlue: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  confirmationTitleBlue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: '#FFFFFF',
  },
  confirmationSubtitleBlue: {
    fontSize: typography.size.base,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing[1],
    textAlign: "center",
  },
  confirmationDismissButton: {
    marginTop: spacing[5],
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
  },
  confirmationDismissText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: '#FFFFFF',
  },

  // Voted status
  votedStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: `${colors.brand.secondary}08`,
    borderRadius: borderRadius.full,
    gap: spacing[2],
    borderWidth: 1,
    borderColor: `${colors.brand.secondary}15`,
  },
  votedStatusText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.brand.secondary,
  },
  changeVoteButton: {
    marginLeft: spacing[2],
  },
  changeVoteText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.brand.secondary,
  },

  // View toggle button
  viewToggleButton: {
    position: "absolute",
    right: spacing[4],
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
});
