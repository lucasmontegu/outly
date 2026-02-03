import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { Id } from "@outia/backend/convex/_generated/dataModel";
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Button } from "heroui-native";
import { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Pressable } from "react-native";

import { AnimatedIconButton, AnimatedCard } from "@/components/ui/animated-pressable";
import { RouteCardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { lightHaptic, mediumHaptic, successHaptic, errorHaptic, warningHaptic } from "@/lib/haptics";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

type RouteIcon = "building" | "running" | "home";

export default function SavedScreen() {
  const router = useRouter();
  const toast = useToast();
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
        return colors.state.info;
      case "running":
        return colors.risk.medium.primary;
      case "home":
        return colors.state.success;
      default:
        return colors.state.info;
    }
  };

  const getIconBgColor = (icon: RouteIcon): string => {
    switch (icon) {
      case "building":
        return colors.slate[100];
      case "running":
        return colors.risk.medium.light;
      case "home":
        return colors.risk.low.light;
      default:
        return colors.slate[100];
    }
  };

  const toggleDay = useCallback((routeId: string, dayIndex: number, currentDays: boolean[]) => {
    lightHaptic();
    const currentPending = pendingChanges[routeId] || {};
    const newDays = [...(currentPending.monitorDays || currentDays)];
    newDays[dayIndex] = !newDays[dayIndex];
    setPendingChanges({
      ...pendingChanges,
      [routeId]: { ...currentPending, monitorDays: newDays },
    });
  }, [pendingChanges]);

  const updateThreshold = (routeId: string, threshold: number) => {
    const currentPending = pendingChanges[routeId] || {};
    setPendingChanges({
      ...pendingChanges,
      [routeId]: { ...currentPending, alertThreshold: threshold },
    });
  };

  const handleSaveChanges = useCallback(async (routeId: Id<"routes">) => {
    const changes = pendingChanges[routeId];
    if (!changes) return;

    try {
      await updateRoute({
        routeId,
        ...(changes.monitorDays && { monitorDays: changes.monitorDays }),
        ...(changes.alertThreshold !== undefined && { alertThreshold: changes.alertThreshold }),
      });

      // Clear pending changes for this route
      const { [routeId]: _, ...rest } = pendingChanges;
      setPendingChanges(rest);

      successHaptic();
      toast.success("Route settings saved");
    } catch (error) {
      errorHaptic();
      toast.error("Failed to save changes");
    }
  }, [pendingChanges, updateRoute, toast]);

  const handleDeleteRoute = useCallback((routeId: Id<"routes">, routeName: string) => {
    warningHaptic();
    Alert.alert(
      "Delete Route",
      `Are you sure you want to delete "${routeName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRoute({ routeId });
              successHaptic();
              toast.success("Route deleted");
            } catch (error) {
              errorHaptic();
              toast.error("Failed to delete route");
            }
          },
        },
      ]
    );
  }, [deleteRoute, toast]);

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
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>My Routes</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <RouteCardSkeleton />
          <View style={{ height: 16 }} />
          <RouteCardSkeleton />
          <View style={{ height: 16 }} />
          <RouteCardSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>My Routes</Text>
        <AnimatedIconButton
          style={styles.addButton}
          onPress={() => router.push("/add-route")}
        >
          <HugeiconsIcon icon={Add01Icon} size={24} color="#3B82F6" />
        </AnimatedIconButton>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {routes.length === 0 ? (
          <Animated.View
            entering={FadeIn.duration(400).delay(200)}
            style={styles.emptyContainer}
          >
            <Text style={styles.emptyTitle}>No routes saved</Text>
            <Text style={styles.emptyText}>
              Add your first route to start monitoring conditions
            </Text>
            <Button
              className="px-6 h-12 rounded-xl"
              onPress={() => router.push("/add-route")}
            >
              Add Route
            </Button>
          </Animated.View>
        ) : (
          routes.map((route, index) => (
            <Animated.View
              key={route._id}
              entering={FadeInDown.delay(index * 80).duration(350).springify().damping(20)}
              exiting={FadeOut.duration(200)}
              layout={Layout.springify().damping(20)}
            >
              <AnimatedCard
                style={[
                  styles.routeCard,
                  expandedRoute === route._id && styles.routeCardExpanded,
                ]}
                onPress={() => {
                  mediumHaptic();
                  setExpandedRoute(expandedRoute === route._id ? null : route._id);
                }}
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
                    <Animated.View entering={FadeIn.duration(250)}>
                      {/* Map Preview */}
                      <Animated.View
                        entering={FadeInDown.duration(300).delay(50)}
                        style={styles.mapPreview}
                      >
                        <LinearGradient
                          colors={["#E2E8F0", "#CBD5E1"]}
                          style={styles.mapGradient}
                        >
                          <AnimatedPressable
                            style={styles.editPathButton}
                            onPress={() => lightHaptic()}
                          >
                            <Text style={styles.editPathText}>Edit Path</Text>
                          </AnimatedPressable>
                        </LinearGradient>
                      </Animated.View>

                      {/* Monitor Days */}
                      <Animated.View
                        entering={FadeInDown.duration(300).delay(100)}
                        style={styles.section}
                      >
                        <Text style={styles.sectionLabel}>MONITOR DAYS</Text>
                        <View style={styles.daysRow}>
                          {DAYS.map((day, dayIndex) => {
                            const effectiveDays = getEffectiveDays(route._id, route.monitorDays);
                            return (
                              <DayButton
                                key={dayIndex}
                                day={day}
                                isActive={effectiveDays[dayIndex]}
                                onPress={() => toggleDay(route._id, dayIndex, route.monitorDays)}
                              />
                            );
                          })}
                        </View>
                      </Animated.View>

                      {/* Alert Threshold */}
                      <Animated.View
                        entering={FadeInDown.duration(300).delay(150)}
                        style={styles.section}
                      >
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
                      </Animated.View>

                      {/* Alert Info */}
                      <Animated.View
                        entering={FadeInDown.duration(300).delay(200)}
                        style={styles.alertInfo}
                      >
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
                      </Animated.View>

                      {/* Actions */}
                      <Animated.View
                        entering={FadeInDown.duration(300).delay(250)}
                        style={styles.actions}
                      >
                        <Button
                          className="flex-1 h-12 rounded-xl"
                          onPress={() => handleSaveChanges(route._id)}
                          isDisabled={!hasChanges(route._id)}
                        >
                          {hasChanges(route._id) ? "Save Changes" : "No Changes"}
                        </Button>
                        <AnimatedIconButton
                          style={styles.deleteButton}
                          onPress={() => handleDeleteRoute(route._id, route.name)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={20} color="#9CA3AF" />
                        </AnimatedIconButton>
                      </Animated.View>
                    </Animated.View>
                  )}
                </Card.Body>
              </AnimatedCard>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Animated Day Button component
function DayButton({
  day,
  isActive,
  onPress,
}: {
  day: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.dayButton,
        isActive && styles.dayButtonActive,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={[styles.dayText, isActive && styles.dayTextActive]}>
        {day}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
  },
  loadingText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
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
    padding: spacing[4],
    gap: spacing[4],
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: spacing[5],
    marginBottom: spacing[6],
  },
  routeCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius['2xl'],
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  routeCardExpanded: {
    borderColor: colors.state.info,
    borderWidth: 2,
  },
  routeCardBody: {
    padding: spacing[4],
  },
  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  routeIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  routePath: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    marginTop: 2,
  },
  routePathText: {
    fontSize: typography.size.sm + 1,
    color: colors.text.secondary,
  },
  activeBadge: {
    backgroundColor: colors.risk.low.light,
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  activeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.risk.low.dark,
  },
  mapPreview: {
    height: 120,
    marginTop: spacing[4],
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  mapGradient: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    padding: spacing[3],
  },
  editPathButton: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  editPathText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  section: {
    marginTop: spacing[5],
  },
  sectionLabel: {
    fontSize: typography.size.xs - 1,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: typography.tracking.wide,
    marginBottom: spacing[3],
  },
  daysRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonActive: {
    backgroundColor: colors.text.primary,
  },
  dayText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
  },
  dayTextActive: {
    color: colors.text.inverse,
  },
  thresholdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  thresholdValue: {
    fontSize: typography.size.sm + 1,
    fontWeight: typography.weight.semibold,
    color: colors.state.warning,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  sliderLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    width: 60,
  },
  sliderTrack: {
    flex: 1,
    height: spacing[2],
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    position: "relative",
  },
  sliderGradient: {
    flex: 1,
    borderRadius: borderRadius.sm,
  },
  sliderThumb: {
    position: "absolute",
    top: -4,
    width: spacing[4],
    height: spacing[4],
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.primary,
    borderWidth: 2,
    borderColor: colors.text.primary,
    marginLeft: -spacing[2],
  },
  alertInfo: {
    flexDirection: "row",
    backgroundColor: colors.background.secondary,
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginTop: spacing[4],
    gap: spacing[2],
  },
  alertInfoIcon: {
    fontSize: typography.size.base,
  },
  alertInfoText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: typography.size.xl,
  },
  alertInfoBold: {
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  actions: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[5],
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
  },
});
