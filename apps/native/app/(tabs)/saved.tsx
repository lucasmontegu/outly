import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { Id } from "@outia/backend/convex/_generated/dataModel";
import {
  Building02Icon,
  ArrowDown01Icon,
  Add01Icon,
  Delete02Icon,
  WorkoutRunIcon,
  Home01Icon,
  MoreVerticalIcon,
  Route01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Pressable } from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { AnimatedIconButton } from "@/components/ui/animated-pressable";
import { RouteCardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { lightHaptic, mediumHaptic, successHaptic, errorHaptic, warningHaptic } from "@/lib/haptics";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

type RouteIcon = "building" | "running" | "home";

// Empty state component
function EmptyRoutes({ onAdd }: { onAdd: () => void }) {
  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(200)}
      style={styles.emptyState}
    >
      <View style={styles.emptyIcon}>
        <HugeiconsIcon icon={Route01Icon} size={48} color={colors.text.tertiary} />
      </View>
      <Text style={styles.emptyTitle}>No routes yet</Text>
      <Text style={styles.emptySubtitle}>
        Add your daily commute to get personalized departure alerts
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onAdd}>
        <Text style={styles.emptyButtonText}>Add Your First Route</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Header component
function SavedHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.savedHeader}>
      <View>
        <Text style={styles.savedTitle}>Saved Routes</Text>
        <Text style={styles.savedSubtitle}>Monitor your daily commutes</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={onAdd}>
        <HugeiconsIcon icon={Add01Icon} size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

// Route card component
function RouteCard({
  route,
  isExpanded,
  onPress,
  onEdit,
  onDelete,
  onSaveChanges,
  pendingChanges,
  onToggleDay,
  hasChanges,
  getEffectiveDays,
  getEffectiveThreshold,
  getThresholdLabel,
}: {
  route: any;
  isExpanded: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSaveChanges: () => void;
  pendingChanges: any;
  onToggleDay: (dayIndex: number) => void;
  hasChanges: boolean;
  getEffectiveDays: () => boolean[];
  getEffectiveThreshold: () => number;
  getThresholdLabel: (threshold: number) => string;
}) {
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
        return colors.brand.primary;
      case "running":
        return colors.risk.medium.primary;
      case "home":
        return colors.state.success;
      default:
        return colors.brand.primary;
    }
  };

  const effectiveDays = getEffectiveDays();
  const effectiveThreshold = getEffectiveThreshold();

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[styles.routeCard, isExpanded && styles.routeCardExpanded]}
    >
      <TouchableOpacity
        style={styles.routeCardTouchable}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Route Header */}
        <View style={styles.routeHeader}>
          <View style={styles.routeIconContainer}>
            <HugeiconsIcon
              icon={getRouteIcon(route.icon)}
              size={24}
              color={getIconColor(route.icon)}
            />
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.routeFrom}>{route.fromName}</Text>
            <View style={styles.routeArrow}>
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} color={colors.text.tertiary} />
            </View>
            <Text style={styles.routeTo}>{route.toName}</Text>
          </View>
          <TouchableOpacity style={styles.routeMenu} onPress={onEdit}>
            <HugeiconsIcon icon={MoreVerticalIcon} size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Day Selector - Always visible */}
        <View style={styles.daySelector}>
          {DAYS.map((day, index) => (
            <View
              key={index}
              style={[
                styles.dayPill,
                effectiveDays[index] && styles.dayPillActive
              ]}
            >
              <Text style={[
                styles.dayText,
                effectiveDays[index] && styles.dayTextActive
              ]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Alert Threshold */}
        <View style={styles.thresholdRow}>
          <View style={styles.thresholdLabelRow}>
            <HugeiconsIcon icon={AlertCircleIcon} size={14} color={colors.text.tertiary} />
            <Text style={styles.thresholdLabel}>Alert when risk is above</Text>
          </View>
          <View style={styles.thresholdBadge}>
            <Text style={styles.thresholdValue}>{effectiveThreshold}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.expandedContent}>
          {/* Divider */}
          <View style={styles.divider} />

          {/* Monitor Days - Interactive */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MONITOR DAYS</Text>
            <View style={styles.daysRow}>
              {DAYS.map((day, dayIndex) => (
                <DayButton
                  key={dayIndex}
                  day={day}
                  isActive={effectiveDays[dayIndex]}
                  onPress={() => onToggleDay(dayIndex)}
                />
              ))}
            </View>
          </View>

          {/* Alert Threshold Slider */}
          <View style={styles.section}>
            <View style={styles.thresholdHeader}>
              <Text style={styles.sectionLabel}>ALERT THRESHOLD</Text>
              <Text style={styles.thresholdValueLabel}>
                {getThresholdLabel(effectiveThreshold)} (&gt;{effectiveThreshold})
              </Text>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>All</Text>
              <View style={styles.sliderTrack}>
                <LinearGradient
                  colors={[colors.risk.low.primary, colors.risk.medium.primary, colors.risk.high.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sliderGradient}
                />
                <View
                  style={[
                    styles.sliderThumb,
                    { left: `${effectiveThreshold}%` },
                  ]}
                />
              </View>
              <Text style={styles.sliderLabelRight}>Critical</Text>
            </View>
          </View>

          {/* Alert Info */}
          <View style={styles.alertInfo}>
            <Text style={styles.alertInfoText}>
              You will be notified at{" "}
              <Text style={styles.alertInfoBold}>{route.alertTime}</Text> only if
              risk score exceeds{" "}
              <Text style={styles.alertInfoBold}>{effectiveThreshold}</Text>
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              className="flex-1 h-12 rounded-xl"
              onPress={onSaveChanges}
              isDisabled={!hasChanges}
            >
              {hasChanges ? "Save Changes" : "No Changes"}
            </Button>
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <HugeiconsIcon icon={Delete02Icon} size={20} color={colors.risk.high.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </Animated.View>
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
        styles.dayButtonInteractive,
        isActive && styles.dayButtonActiveInteractive,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={[styles.dayTextInteractive, isActive && styles.dayTextActiveInteractive]}>
        {day}
      </Text>
    </AnimatedPressable>
  );
}

export default function SavedScreen() {
  const router = useRouter();
  const toast = useToast();
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, {
    monitorDays?: boolean[];
    alertThreshold?: number;
  }>>({});

  const [isScreenFocused, setIsScreenFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => setIsScreenFocused(false);
    }, [])
  );

  const routes = useQuery(
    api.routes.getUserRoutes,
    isScreenFocused ? {} : "skip"
  );
  const updateRoute = useMutation(api.routes.updateRoute);
  const deleteRoute = useMutation(api.routes.deleteRoute);

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

  const handleSaveChanges = useCallback(async (routeId: Id<"routes">) => {
    const changes = pendingChanges[routeId];
    if (!changes) return;

    try {
      await updateRoute({
        routeId,
        ...(changes.monitorDays && { monitorDays: changes.monitorDays }),
        ...(changes.alertThreshold !== undefined && { alertThreshold: changes.alertThreshold }),
      });

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

  const handleAddRoute = () => {
    mediumHaptic();
    router.push("/add-route");
  };

  if (routes === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <SavedHeader onAdd={handleAddRoute} />
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
      <SavedHeader onAdd={handleAddRoute} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {routes.length === 0 ? (
          <EmptyRoutes onAdd={handleAddRoute} />
        ) : (
          routes.map((route, index) => (
            <RouteCard
              key={route._id}
              route={route}
              isExpanded={expandedRoute === route._id}
              onPress={() => {
                mediumHaptic();
                setExpandedRoute(expandedRoute === route._id ? null : route._id);
              }}
              onEdit={() => lightHaptic()}
              onDelete={() => handleDeleteRoute(route._id, route.name)}
              onSaveChanges={() => handleSaveChanges(route._id)}
              pendingChanges={pendingChanges[route._id]}
              onToggleDay={(dayIndex) => toggleDay(route._id, dayIndex, route.monitorDays)}
              hasChanges={hasChanges(route._id)}
              getEffectiveDays={() => getEffectiveDays(route._id, route.monitorDays)}
              getEffectiveThreshold={() => getEffectiveThreshold(route._id, route.alertThreshold)}
              getThresholdLabel={getThresholdLabel}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: 120, // Extra padding for floating tab bar
    gap: spacing[4],
  },

  // Header
  savedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.primary,
  },
  savedTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  savedSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: spacing[6],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[6],
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing[6],
  },
  emptyButton: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },

  // Route card
  routeCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius['2xl'],
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: "hidden",
  },
  routeCardExpanded: {
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  routeCardTouchable: {
    padding: spacing[5],
  },
  routeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  routeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.brand.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  routeInfo: {
    flex: 1,
  },
  routeFrom: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  routeArrow: {
    paddingVertical: spacing[1],
  },
  routeTo: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  routeMenu: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Day selector (compact view)
  daySelector: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[4],
  },
  dayPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  dayPillActive: {
    backgroundColor: colors.brand.primary,
  },
  dayText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
  },
  dayTextActive: {
    color: colors.text.inverse,
  },

  // Threshold row
  thresholdRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
  },
  thresholdLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  thresholdLabel: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  thresholdBadge: {
    backgroundColor: colors.risk.medium.light,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: borderRadius.full,
  },
  thresholdValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.risk.medium.dark,
  },

  // Expanded content
  expandedContent: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
  },
  divider: {
    height: 1,
    backgroundColor: colors.slate[100],
    marginBottom: spacing[4],
  },

  // Sections
  section: {
    marginBottom: spacing[5],
  },
  sectionLabel: {
    fontSize: typography.size.xs - 1,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
    letterSpacing: typography.tracking.wide,
    marginBottom: spacing[3],
  },

  // Interactive day buttons
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayButtonInteractive: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonActiveInteractive: {
    backgroundColor: colors.brand.primary,
  },
  dayTextInteractive: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
  },
  dayTextActiveInteractive: {
    color: colors.text.inverse,
  },

  // Threshold slider
  thresholdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  thresholdValueLabel: {
    fontSize: typography.size.sm,
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
    width: 30,
  },
  sliderLabelRight: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    width: 50,
    textAlign: "right",
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
    width: spacing[4],
    height: spacing[4],
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.primary,
    borderWidth: 3,
    borderColor: colors.text.primary,
    marginLeft: -spacing[2],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  // Alert info
  alertInfo: {
    backgroundColor: colors.slate[50],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
  },
  alertInfoText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  alertInfoBold: {
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },

  // Actions
  actions: {
    flexDirection: "row",
    gap: spacing[3],
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.risk.high.light,
    alignItems: "center",
    justifyContent: "center",
  },
});
