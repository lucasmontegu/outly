import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import { Id } from "@outly/backend/convex/_generated/dataModel";
import {
  Building02Icon,
  ArrowRight01Icon,
  Add01Icon,
  Delete02Icon,
  WorkoutRunIcon,
  Home01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Button } from "heroui-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

type RouteIcon = "building" | "running" | "home";

export default function SavedScreen() {
  const router = useRouter();
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, {
    monitorDays?: boolean[];
    alertThreshold?: number;
  }>>({});

  // Query routes from Convex
  const routes = useQuery(api.routes.getUserRoutes);
  const updateRoute = useMutation(api.routes.updateRoute);
  const deleteRoute = useMutation(api.routes.deleteRoute);

  const getRouteIcon = (icon: RouteIcon) => {
    switch (icon) {
      case "building":
        return Building02Icon;
      case "running":
        return WorkoutRunIcon;
      case "home":
        return Home01Icon;
      default:
        return Building02Icon;
    }
  };

  const getIconColor = (icon: RouteIcon): string => {
    switch (icon) {
      case "building":
        return "#3B82F6";
      case "running":
        return "#F97316";
      case "home":
        return "#10B981";
      default:
        return "#3B82F6";
    }
  };

  const getIconBgColor = (icon: RouteIcon): string => {
    switch (icon) {
      case "building":
        return "#DBEAFE";
      case "running":
        return "#FED7AA";
      case "home":
        return "#D1FAE5";
      default:
        return "#DBEAFE";
    }
  };

  const toggleDay = (routeId: string, dayIndex: number, currentDays: boolean[]) => {
    const currentPending = pendingChanges[routeId] || {};
    const newDays = [...(currentPending.monitorDays || currentDays)];
    newDays[dayIndex] = !newDays[dayIndex];
    setPendingChanges({
      ...pendingChanges,
      [routeId]: { ...currentPending, monitorDays: newDays },
    });
  };

  const updateThreshold = (routeId: string, threshold: number) => {
    const currentPending = pendingChanges[routeId] || {};
    setPendingChanges({
      ...pendingChanges,
      [routeId]: { ...currentPending, alertThreshold: threshold },
    });
  };

  const handleSaveChanges = async (routeId: Id<"routes">) => {
    const changes = pendingChanges[routeId];
    if (!changes) return;

    await updateRoute({
      routeId,
      ...(changes.monitorDays && { monitorDays: changes.monitorDays }),
      ...(changes.alertThreshold !== undefined && { alertThreshold: changes.alertThreshold }),
    });

    // Clear pending changes for this route
    const { [routeId]: _, ...rest } = pendingChanges;
    setPendingChanges(rest);
  };

  const handleDeleteRoute = (routeId: Id<"routes">, routeName: string) => {
    Alert.alert(
      "Delete Route",
      `Are you sure you want to delete "${routeName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteRoute({ routeId });
          },
        },
      ]
    );
  };

  const getEffectiveDays = (routeId: string, originalDays: boolean[]): boolean[] => {
    return pendingChanges[routeId]?.monitorDays || originalDays;
  };

  const getEffectiveThreshold = (routeId: string, originalThreshold: number): number => {
    return pendingChanges[routeId]?.alertThreshold ?? originalThreshold;
  };

  const hasChanges = (routeId: string): boolean => {
    return !!pendingChanges[routeId];
  };

  const getThresholdLabel = (threshold: number): string => {
    if (threshold <= 33) return "Low Risk";
    if (threshold <= 66) return "Medium Risk";
    return "High Risk";
  };

  if (routes === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading routes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>My Routes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push("/add-route")}>
          <HugeiconsIcon icon={Add01Icon} size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {routes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No routes saved</Text>
            <Text style={styles.emptyText}>
              Add your first route to start monitoring conditions
            </Text>
            <Button
              variant="primary"
              style={styles.addRouteButton}
              onPress={() => router.push("/add-route")}
            >
              Add Route
            </Button>
          </View>
        ) : (
          routes.map((route) => (
            <Card
              key={route._id}
              style={[
                styles.routeCard,
                expandedRoute === route._id && styles.routeCardExpanded,
              ]}
            >
              <TouchableOpacity
                onPress={() =>
                  setExpandedRoute(expandedRoute === route._id ? null : route._id)
                }
              >
                <Card.Body style={styles.routeCardBody}>
                  {/* Route Header */}
                  <View style={styles.routeHeader}>
                    <View
                      style={[
                        styles.routeIcon,
                        { backgroundColor: getIconBgColor(route.icon) },
                      ]}
                    >
                      <HugeiconsIcon
                        icon={getRouteIcon(route.icon)}
                        size={20}
                        color={getIconColor(route.icon)}
                      />
                    </View>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeName}>{route.name}</Text>
                      <View style={styles.routePath}>
                        <Text style={styles.routePathText}>{route.fromName}</Text>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={14}
                          color="#9CA3AF"
                        />
                        <Text style={styles.routePathText}>{route.toName}</Text>
                      </View>
                    </View>
                    {route.isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeText}>Active</Text>
                      </View>
                    )}
                  </View>

                  {/* Expanded Content */}
                  {expandedRoute === route._id && (
                    <>
                      {/* Map Preview */}
                      <View style={styles.mapPreview}>
                        <LinearGradient
                          colors={["#E2E8F0", "#CBD5E1"]}
                          style={styles.mapGradient}
                        >
                          <TouchableOpacity style={styles.editPathButton}>
                            <Text style={styles.editPathText}>Edit Path</Text>
                          </TouchableOpacity>
                        </LinearGradient>
                      </View>

                      {/* Monitor Days */}
                      <View style={styles.section}>
                        <Text style={styles.sectionLabel}>MONITOR DAYS</Text>
                        <View style={styles.daysRow}>
                          {DAYS.map((day, index) => {
                            const effectiveDays = getEffectiveDays(route._id, route.monitorDays);
                            return (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.dayButton,
                                  effectiveDays[index] && styles.dayButtonActive,
                                ]}
                                onPress={() => toggleDay(route._id, index, route.monitorDays)}
                              >
                                <Text
                                  style={[
                                    styles.dayText,
                                    effectiveDays[index] && styles.dayTextActive,
                                  ]}
                                >
                                  {day}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Alert Threshold */}
                      <View style={styles.section}>
                        <View style={styles.thresholdHeader}>
                          <Text style={styles.sectionLabel}>ALERT THRESHOLD</Text>
                          <Text style={styles.thresholdValue}>
                            {getThresholdLabel(getEffectiveThreshold(route._id, route.alertThreshold))} (&gt;{getEffectiveThreshold(route._id, route.alertThreshold)})
                          </Text>
                        </View>
                        <View style={styles.sliderContainer}>
                          <Text style={styles.sliderLabel}>All</Text>
                          <View style={styles.sliderTrack}>
                            <LinearGradient
                              colors={["#10B981", "#F59E0B", "#EF4444"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.sliderGradient}
                            />
                            <View
                              style={[
                                styles.sliderThumb,
                                { left: `${getEffectiveThreshold(route._id, route.alertThreshold)}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.sliderLabel}>Critical Only</Text>
                        </View>
                      </View>

                      {/* Alert Info */}
                      <View style={styles.alertInfo}>
                        <Text style={styles.alertInfoIcon}>ℹ️</Text>
                        <Text style={styles.alertInfoText}>
                          You will be notified at{" "}
                          <Text style={styles.alertInfoBold}>{route.alertTime}</Text> only if
                          risk score exceeds{" "}
                          <Text style={styles.alertInfoBold}>
                            {getEffectiveThreshold(route._id, route.alertThreshold)}
                          </Text>{" "}
                          (Rain, Congestion, or Accidents).
                        </Text>
                      </View>

                      {/* Actions */}
                      <View style={styles.actions}>
                        <Button
                          variant="primary"
                          style={[
                            styles.saveButton,
                            !hasChanges(route._id) && styles.saveButtonDisabled,
                          ]}
                          onPress={() => handleSaveChanges(route._id)}
                          isDisabled={!hasChanges(route._id)}
                        >
                          {hasChanges(route._id) ? "Save Changes" : "No Changes"}
                        </Button>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteRoute(route._id, route.name)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </Card.Body>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  addRouteButton: {
    paddingHorizontal: 32,
  },
  routeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  routeCardExpanded: {
    borderColor: "#3B82F6",
    borderWidth: 2,
  },
  routeCardBody: {
    padding: 16,
  },
  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  routeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  routePath: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  routePathText: {
    fontSize: 13,
    color: "#6B7280",
  },
  activeBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  mapPreview: {
    height: 120,
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  mapGradient: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    padding: 12,
  },
  editPathButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editPathText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  section: {
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  daysRow: {
    flexDirection: "row",
    gap: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonActive: {
    backgroundColor: "#111827",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  dayTextActive: {
    color: "#fff",
  },
  thresholdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  thresholdValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F59E0B",
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sliderLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    width: 60,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  sliderGradient: {
    flex: 1,
    borderRadius: 4,
  },
  sliderThumb: {
    position: "absolute",
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#111827",
    marginLeft: -8,
  },
  alertInfo: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  alertInfoIcon: {
    fontSize: 14,
  },
  alertInfoText: {
    flex: 1,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  alertInfoBold: {
    fontWeight: "700",
    color: "#111827",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#111827",
  },
  saveButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
});
