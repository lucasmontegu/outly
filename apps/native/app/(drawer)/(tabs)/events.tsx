import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import { Id } from "@outly/backend/convex/_generated/dataModel";

import { Container } from "@/components/container";
import { EventCard } from "@/components/event-card";
import { useLocation } from "@/hooks/use-location";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

type FilterType = "all" | "weather" | "traffic";

export default function EventsScreen() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const { location, refresh: refreshLocation } = useLocation();

  const events = useQuery(
    api.events.listNearby,
    location ? { lat: location.lat, lng: location.lng, radiusKm: 20 } : "skip"
  );

  const vote = useMutation(api.confirmations.vote);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    setRefreshing(false);
  };

  const handleVote = async (eventId: Id<"events">, voteType: "still_active" | "cleared" | "not_exists") => {
    await vote({ eventId, vote: voteType });
  };

  const filteredEvents = events?.filter((e) => {
    if (filter === "all") return true;
    return e.type === filter;
  });

  return (
    <Container>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <Text style={[styles.title, { color: theme.text }]}>Eventos</Text>
        <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
          Incidentes cercanos a ti
        </Text>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <FilterButton
            label="Todos"
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />
          <FilterButton
            label="Clima"
            active={filter === "weather"}
            onPress={() => setFilter("weather")}
          />
          <FilterButton
            label="Tráfico"
            active={filter === "traffic"}
            onPress={() => setFilter("traffic")}
          />
        </View>

        {/* Events List */}
        {filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCardWithVote
              key={event._id}
              event={event}
              userLocation={location}
              onVote={(voteType) => handleVote(event._id, voteType)}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text, opacity: 0.5 }]}>
              {events === undefined
                ? "Cargando eventos..."
                : "No hay eventos cercanos"}
            </Text>
          </View>
        )}
      </ScrollView>
    </Container>
  );
}

function EventCardWithVote({
  event,
  userLocation,
  onVote,
}: {
  event: any;
  userLocation: { lat: number; lng: number } | null;
  onVote: (vote: "still_active" | "cleared" | "not_exists") => void;
}) {
  const myVote = useQuery(api.confirmations.getMyVote, { eventId: event._id });

  const distance = userLocation
    ? haversineDistance(
        userLocation.lat,
        userLocation.lng,
        event.location.lat,
        event.location.lng
      )
    : undefined;

  return (
    <EventCard
      type={event.type}
      subtype={event.subtype}
      severity={event.severity}
      confidenceScore={event.confidenceScore}
      distance={distance}
      myVote={myVote?.vote}
      onVote={onVote}
    />
  );
}

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text
        style={[styles.filterLabel, active && styles.filterLabelActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#1e293b",
  },
  filterButtonActive: {
    backgroundColor: "#3b82f6",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
  },
  filterLabelActive: {
    color: "#fff",
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
