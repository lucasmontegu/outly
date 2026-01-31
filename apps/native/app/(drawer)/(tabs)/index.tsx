import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";

import { Container } from "@/components/container";
import { RiskCircle } from "@/components/risk-circle";
import { LocationCard } from "@/components/location-card";
import { useLocation } from "@/hooks/use-location";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function HomeScreen() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

  const { location: currentLocation, loading: locationLoading, refresh: refreshLocation } = useLocation();

  const userLocations = useQuery(api.userLocations.list);
  const riskSnapshots = useQuery(api.riskScore.listForUser);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshLocation();
    setRefreshing(false);
  }, [refreshLocation]);

  // Get the default location's risk or the first one
  const defaultLocation = userLocations?.find((l) => l.isDefault) ?? userLocations?.[0];
  const defaultRisk = defaultLocation
    ? riskSnapshots?.find((r) => r.locationId === defaultLocation._id)
    : null;

  const loading = locationLoading || userLocations === undefined;

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
        <Text style={[styles.title, { color: theme.text }]}>Outly</Text>
        <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
          Tu riesgo de viaje actual
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <>
            {/* Main Risk Circle */}
            <View style={styles.riskContainer}>
              {defaultRisk ? (
                <RiskCircle
                  score={defaultRisk.score}
                  classification={defaultRisk.classification}
                />
              ) : (
                <View style={styles.noRiskContainer}>
                  <Text style={[styles.noRiskText, { color: theme.text }]}>
                    Agrega una ubicación para ver tu riesgo
                  </Text>
                </View>
              )}
            </View>

            {/* Risk Breakdown */}
            {defaultRisk && (
              <View style={styles.breakdownContainer}>
                <BreakdownItem
                  label="Clima"
                  score={defaultRisk.breakdown.weatherScore}
                  color="#3b82f6"
                />
                <BreakdownItem
                  label="Tráfico"
                  score={defaultRisk.breakdown.trafficScore}
                  color="#f97316"
                />
                <BreakdownItem
                  label="Eventos"
                  score={defaultRisk.breakdown.eventScore}
                  color="#a855f7"
                />
              </View>
            )}

            {/* Saved Locations */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Mis ubicaciones
            </Text>

            {userLocations && userLocations.length > 0 ? (
              userLocations.map((loc) => {
                const risk = riskSnapshots?.find((r) => r.locationId === loc._id);
                return (
                  <LocationCard
                    key={loc._id}
                    name={loc.name}
                    address={loc.address}
                    score={risk?.score ?? 0}
                    classification={risk?.classification ?? "low"}
                    isDefault={loc.isDefault}
                  />
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.text, opacity: 0.5 }]}>
                  No hay ubicaciones guardadas
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Container>
  );
}

function BreakdownItem({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <View style={styles.breakdownItem}>
      <View style={[styles.breakdownBar, { backgroundColor: color + "30" }]}>
        <View
          style={[
            styles.breakdownFill,
            { backgroundColor: color, width: `${score}%` },
          ]}
        />
      </View>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={[styles.breakdownScore, { color }]}>{score}</Text>
    </View>
  );
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  riskContainer: {
    alignItems: "center",
    marginVertical: 32,
  },
  noRiskContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  noRiskText: {
    fontSize: 14,
    textAlign: "center",
  },
  breakdownContainer: {
    gap: 12,
    marginBottom: 32,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  breakdownBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  breakdownFill: {
    height: "100%",
    borderRadius: 4,
  },
  breakdownLabel: {
    width: 60,
    fontSize: 14,
    color: "#94a3b8",
  },
  breakdownScore: {
    width: 30,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
