import { useQuery, useMutation } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import { Id } from "@outly/backend/convex/_generated/dataModel";
import {
  Search01Icon,
  Alert02Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  CloudIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "heroui-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

import { useLocation } from "@/hooks/use-location";

const { width } = Dimensions.get("window");

type EventType = {
  _id: Id<"events">;
  type: "weather" | "traffic";
  subtype: string;
  confidenceScore: number;
  severity: number;
  _creationTime: number;
  ttl: number;
};

export default function MapScreen() {
  const { location } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);

  // Query nearby events
  const events = useQuery(
    api.events.listNearby,
    location ? { lat: location.lat, lng: location.lng, radiusKm: 10 } : "skip"
  );

  // Get selected event details
  const selectedEvent = events?.find((e) => e._id === selectedEventId);

  // Get user's vote on selected event
  const myVote = useQuery(
    api.confirmations.getMyVote,
    selectedEventId ? { eventId: selectedEventId } : "skip"
  );

  // Vote mutation
  const vote = useMutation(api.confirmations.vote);

  const handleVote = async (voteType: "still_active" | "cleared" | "not_exists") => {
    if (!selectedEventId) return;
    await vote({ eventId: selectedEventId, vote: voteType });
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <HugeiconsIcon icon={Search01Icon} size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location or route..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <LinearGradient
          colors={["#E2E8F0", "#CBD5E1", "#94A3B8"]}
          style={styles.mapPlaceholder}
        >
          <View style={styles.mapContent}>
            {/* Event markers */}
            {events === undefined ? (
              <ActivityIndicator size="large" color="#3B82F6" />
            ) : events.length === 0 ? (
              <View style={styles.noEventsContainer}>
                <Text style={styles.noEventsText}>No events nearby</Text>
              </View>
            ) : (
              events.slice(0, 5).map((event, index) => (
                <TouchableOpacity
                  key={event._id}
                  style={[
                    styles.eventMarker,
                    {
                      top: `${25 + index * 12}%`,
                      left: `${20 + index * 15}%`,
                    },
                    selectedEventId === event._id && styles.eventMarkerSelected,
                  ]}
                  onPress={() => setSelectedEventId(event._id)}
                >
                  <View
                    style={[
                      styles.markerIcon,
                      { borderColor: getEventColor(event.severity) },
                    ]}
                  >
                    <HugeiconsIcon
                      icon={getEventIcon(event.type)}
                      size={16}
                      color={getEventColor(event.severity)}
                    />
                  </View>
                  <Text style={[styles.markerLabel, { color: getEventColor(event.severity) }]}>
                    {formatSubtype(event.subtype).split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </LinearGradient>
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
  mapContainer: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  noEventsContainer: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
  },
  noEventsText: {
    fontSize: 16,
    color: "#6B7280",
  },
  eventMarker: {
    position: "absolute",
    alignItems: "center",
  },
  eventMarkerSelected: {
    transform: [{ scale: 1.2 }],
  },
  markerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  markerLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
