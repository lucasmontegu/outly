import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import {
  Location01Icon,
  Building02Icon,
  WorkoutRunIcon,
  Home01Icon,
  Search01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenHeader } from "@/components/screen-header";
import { useLocation } from "@/hooks/use-location";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

type RouteIcon = "building" | "running" | "home";

type LocationData = {
  name: string;
  lat: number;
  lng: number;
};

type SearchResult = {
  placeId: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
};

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ICONS: { type: RouteIcon; icon: any; label: string; color: string; bg: string }[] = [
  { type: "building", icon: Building02Icon, label: "Work", color: colors.state.info, bg: "#EFF6FF" },
  { type: "home", icon: Home01Icon, label: "Home", color: colors.state.success, bg: "#ECFDF5" },
  { type: "running", icon: WorkoutRunIcon, label: "Activity", color: colors.risk.medium.primary, bg: "#FEF3C7" },
];

export default function AddRouteScreen() {
  const router = useRouter();
  const { location, address } = useLocation();
  const createRoute = useMutation(api.routes.createRoute);
  const savedLocations = useQuery(api.userLocations.list);

  const [name, setName] = useState("");
  const [fromData, setFromData] = useState<LocationData | null>(null);
  const [toData, setToData] = useState<LocationData | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<RouteIcon>("building");
  const [monitorDays, setMonitorDays] = useState([true, true, true, true, true, false, false]);
  const [alertThreshold, setAlertThreshold] = useState(40);
  const [alertTime, setAlertTime] = useState("7:30 AM");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search state for "From" field
  const [fromQuery, setFromQuery] = useState("");
  const [fromResults, setFromResults] = useState<SearchResult[]>([]);
  const [fromSearching, setFromSearching] = useState(false);
  const [showFromResults, setShowFromResults] = useState(false);
  const fromTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search state for "To" field
  const [toQuery, setToQuery] = useState("");
  const [toResults, setToResults] = useState<SearchResult[]>([]);
  const [toSearching, setToSearching] = useState(false);
  const [showToResults, setShowToResults] = useState(false);
  const toTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use current location as default "from" if not set
  const fromLocation = fromData || (location ? { name: address || "Current Location", lat: location.lat, lng: location.lng } : null);
  const toLocation = toData;

  // Search locations using OpenStreetMap Nominatim
  const searchLocations = async (
    query: string,
    setResults: (results: SearchResult[]) => void,
    setSearching: (searching: boolean) => void,
    setShowResults: (show: boolean) => void
  ) => {
    if (!query.trim() || query.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
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
        setResults(results);
        setShowResults(results.length > 0);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  // Handle "From" field changes
  const handleFromChange = (text: string) => {
    setFromQuery(text);
    setFromData(null);

    if (fromTimeoutRef.current) {
      clearTimeout(fromTimeoutRef.current);
    }

    if (text.length >= 3) {
      fromTimeoutRef.current = setTimeout(() => {
        searchLocations(text, setFromResults, setFromSearching, setShowFromResults);
      }, 300);
    } else {
      setFromResults([]);
      setShowFromResults(false);
    }
  };

  // Handle "To" field changes
  const handleToChange = (text: string) => {
    setToQuery(text);
    setToData(null);

    if (toTimeoutRef.current) {
      clearTimeout(toTimeoutRef.current);
    }

    if (text.length >= 3) {
      toTimeoutRef.current = setTimeout(() => {
        searchLocations(text, setToResults, setToSearching, setShowToResults);
      }, 300);
    } else {
      setToResults([]);
      setShowToResults(false);
    }
  };

  // Select a "From" result
  const selectFromResult = (result: SearchResult) => {
    setFromData({ name: result.name, lat: result.lat, lng: result.lng });
    setFromQuery(result.name);
    setFromResults([]);
    setShowFromResults(false);
    Keyboard.dismiss();
  };

  // Select a "To" result
  const selectToResult = (result: SearchResult) => {
    setToData({ name: result.name, lat: result.lat, lng: result.lng });
    setToQuery(result.name);
    setToResults([]);
    setShowToResults(false);
    Keyboard.dismiss();
  };

  const toggleDay = (index: number) => {
    const newDays = [...monitorDays];
    newDays[index] = !newDays[index];
    setMonitorDays(newDays);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a route name");
      return;
    }
    if (!fromLocation) {
      Alert.alert("Error", "Please select a starting location");
      return;
    }
    if (!toLocation) {
      Alert.alert("Error", "Please select a destination");
      return;
    }

    setIsSubmitting(true);
    try {
      await createRoute({
        name: name.trim(),
        fromName: fromLocation.name,
        toName: toLocation.name,
        fromLocation: { lat: fromLocation.lat, lng: fromLocation.lng },
        toLocation: { lat: toLocation.lat, lng: toLocation.lng },
        icon: selectedIcon,
        monitorDays,
        alertThreshold,
        alertTime,
      });
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to create route. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThresholdLabel = () => {
    if (alertThreshold <= 33) return { label: "Low", color: colors.state.success };
    if (alertThreshold <= 66) return { label: "Medium", color: colors.state.warning };
    return { label: "High", color: colors.state.error };
  };

  const thresholdInfo = getThresholdLabel();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Add Route"
        variant="close"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Route Name Card */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Route Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Daily Commute"
                placeholderTextColor={colors.text.tertiary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Icon Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Route Type</Text>
              <View style={styles.iconRow}>
                {ICONS.map((item) => (
                  <TouchableOpacity
                    key={item.type}
                    style={[
                      styles.iconOption,
                      selectedIcon === item.type && styles.iconOptionSelected,
                      selectedIcon === item.type && { borderColor: item.color },
                    ]}
                    onPress={() => setSelectedIcon(item.type)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                      <HugeiconsIcon icon={item.icon} size={24} color={item.color} />
                    </View>
                    <Text style={[
                      styles.iconLabel,
                      selectedIcon === item.type && { color: item.color },
                    ]}>
                      {item.label}
                    </Text>
                    {selectedIcon === item.type && (
                      <View style={[styles.selectedDot, { backgroundColor: item.color }]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Locations Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Locations</Text>

            {/* From Location */}
            <View style={[styles.inputGroup, { zIndex: 20 }]}>
              <Text style={styles.inputLabel}>From</Text>
              <View style={styles.locationInputContainer}>
                <View style={[styles.locationDot, { backgroundColor: colors.state.success }]} />
                <TextInput
                  style={styles.locationInput}
                  placeholder="Starting location"
                  placeholderTextColor={colors.text.tertiary}
                  value={fromData ? fromData.name : fromQuery}
                  onChangeText={handleFromChange}
                  onFocus={() => fromQuery.length >= 3 && setShowFromResults(true)}
                />
                {fromSearching && <ActivityIndicator size="small" color={colors.state.success} />}
                {(fromQuery.length > 0 || fromData) && !fromSearching && (
                  <TouchableOpacity
                    onPress={() => { setFromQuery(""); setFromData(null); setFromResults([]); }}
                    style={styles.clearButton}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={16} color={colors.text.tertiary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* From Search Results Dropdown */}
              {showFromResults && fromResults.length > 0 && (
                <View style={styles.searchDropdown}>
                  {fromResults.map((result) => (
                    <TouchableOpacity
                      key={result.placeId}
                      style={styles.searchResultItem}
                      onPress={() => selectFromResult(result)}
                    >
                      <View style={[styles.resultDot, { backgroundColor: colors.state.success }]} />
                      <View style={styles.searchResultText}>
                        <Text style={styles.searchResultName} numberOfLines={1}>{result.name}</Text>
                        <Text style={styles.searchResultAddress} numberOfLines={1}>{result.displayName}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {address && location && !fromData && !showFromResults && (
                <TouchableOpacity
                  style={styles.currentLocationSuggestion}
                  onPress={() => {
                    setFromData({ name: address, lat: location.lat, lng: location.lng });
                    setFromQuery(address);
                  }}
                >
                  <HugeiconsIcon icon={Location01Icon} size={14} color={colors.risk.low.dark} />
                  <Text style={styles.suggestionText}>Use current location</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Route Line Connector */}
            <View style={styles.routeConnector}>
              <View style={styles.connectorLine} />
            </View>

            {/* To Location */}
            <View style={[styles.inputGroup, { zIndex: 10 }]}>
              <Text style={styles.inputLabel}>To</Text>
              <View style={styles.locationInputContainer}>
                <View style={[styles.locationDot, { backgroundColor: colors.state.error }]} />
                <TextInput
                  style={styles.locationInput}
                  placeholder="Destination"
                  placeholderTextColor={colors.text.tertiary}
                  value={toData ? toData.name : toQuery}
                  onChangeText={handleToChange}
                  onFocus={() => toQuery.length >= 3 && setShowToResults(true)}
                />
                {toSearching && <ActivityIndicator size="small" color={colors.state.error} />}
                {(toQuery.length > 0 || toData) && !toSearching && (
                  <TouchableOpacity
                    onPress={() => { setToQuery(""); setToData(null); setToResults([]); }}
                    style={styles.clearButton}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={16} color={colors.text.tertiary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* To Search Results Dropdown */}
              {showToResults && toResults.length > 0 && (
                <View style={styles.searchDropdown}>
                  {toResults.map((result) => (
                    <TouchableOpacity
                      key={result.placeId}
                      style={styles.searchResultItem}
                      onPress={() => selectToResult(result)}
                    >
                      <View style={[styles.resultDot, { backgroundColor: colors.state.error }]} />
                      <View style={styles.searchResultText}>
                        <Text style={styles.searchResultName} numberOfLines={1}>{result.name}</Text>
                        <Text style={styles.searchResultAddress} numberOfLines={1}>{result.displayName}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Saved locations suggestions */}
              {savedLocations && savedLocations.length > 0 && !toData && !showToResults && (
                <View style={styles.savedLocationsList}>
                  <Text style={styles.savedLocationsLabel}>Quick select:</Text>
                  <View style={styles.savedLocationsPills}>
                    {savedLocations.slice(0, 3).map((loc) => (
                      <TouchableOpacity
                        key={loc._id}
                        style={styles.savedLocationPill}
                        onPress={() => {
                          setToData({ name: loc.name, lat: loc.location.lat, lng: loc.location.lng });
                          setToQuery(loc.name);
                        }}
                      >
                        <Text style={styles.savedLocationText}>{loc.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Schedule Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Schedule</Text>

            {/* Monitor Days */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monitor Days</Text>
              <View style={styles.daysGrid}>
                {DAYS.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      monitorDays[index] && styles.dayButtonActive,
                    ]}
                    onPress={() => toggleDay(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.dayText,
                      monitorDays[index] && styles.dayTextActive,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Alert Time */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alert Time</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timeRow}
              >
                {["6:00 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM"].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeButton,
                      alertTime === time && styles.timeButtonActive,
                    ]}
                    onPress={() => setAlertTime(time)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.timeButtonText,
                      alertTime === time && styles.timeButtonTextActive,
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Alert Threshold Card */}
          <View style={styles.formCard}>
            <View style={styles.thresholdHeader}>
              <Text style={styles.cardTitle}>Alert Threshold</Text>
              <View style={[styles.thresholdBadge, { backgroundColor: `${thresholdInfo.color}15` }]}>
                <Text style={[styles.thresholdBadgeText, { color: thresholdInfo.color }]}>
                  {thresholdInfo.label} Risk
                </Text>
              </View>
            </View>
            <Text style={styles.thresholdDescription}>
              Alert me when risk score exceeds this level
            </Text>

            <View style={styles.thresholdSliderContainer}>
              <View style={styles.sliderTrack}>
                <LinearGradient
                  colors={[colors.state.success, colors.state.warning, colors.state.error]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sliderGradient}
                />
                <View style={[styles.sliderThumb, { left: `${alertThreshold}%` }]}>
                  <Text style={styles.sliderThumbText}>{alertThreshold}</Text>
                </View>
              </View>
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>Low (20)</Text>
                <Text style={styles.sliderLabel}>High (80)</Text>
              </View>
            </View>

            <View style={styles.thresholdButtons}>
              {[20, 40, 60, 80].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.thresholdButton,
                    alertThreshold === value && styles.thresholdButtonActive,
                  ]}
                  onPress={() => setAlertThreshold(value)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.thresholdButtonText,
                    alertThreshold === value && styles.thresholdButtonTextActive,
                  ]}>
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bottom spacing for footer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <Button
            color="accent"
            size="lg"
            className="w-full h-14 rounded-2xl"
            onPress={handleSubmit}
            isDisabled={isSubmitting || !name.trim() || !fromLocation || !toLocation}
          >
            {isSubmitting ? "Creating Route..." : "Create Route"}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: spacing[4],
    borderRadius: 20,
    padding: spacing[5],
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[2],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3] + 2,
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  iconRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  iconOption: {
    flex: 1,
    alignItems: "center",
    padding: spacing[4],
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    position: "relative",
  },
  iconOptionSelected: {
    backgroundColor: "#FFFFFF",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  iconLabel: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  selectedDot: {
    position: "absolute",
    top: spacing[2],
    right: spacing[2],
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  locationInput: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  clearButton: {
    padding: 4,
  },
  routeConnector: {
    paddingLeft: spacing[6],
    marginVertical: -spacing[2],
    marginBottom: spacing[2],
  },
  connectorLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.slate[200],
    borderRadius: 1,
  },
  searchDropdown: {
    position: "absolute",
    top: 78,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.lg,
    zIndex: 1000,
    elevation: 10,
    maxHeight: 220,
    overflow: "hidden",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
    backgroundColor: colors.background.primary,
  },
  resultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  searchResultText: {
    flex: 1,
    overflow: "hidden",
  },
  searchResultName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  searchResultAddress: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  currentLocationSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.risk.low.light,
    borderRadius: 10,
  },
  suggestionText: {
    fontSize: 13,
    color: colors.risk.low.dark,
    fontWeight: typography.weight.medium,
  },
  savedLocationsList: {
    marginTop: spacing[3],
  },
  savedLocationsLabel: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginBottom: spacing[2],
  },
  savedLocationsPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  savedLocationPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.slate[100],
    borderRadius: 20,
  },
  savedLocationText: {
    fontSize: 13,
    color: colors.slate[700],
    fontWeight: typography.weight.medium,
  },
  daysGrid: {
    flexDirection: "row",
    gap: spacing[2],
  },
  dayButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonActive: {
    backgroundColor: colors.brand.primary,
  },
  dayText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
  },
  dayTextActive: {
    color: colors.text.inverse,
  },
  timeRow: {
    flexDirection: "row",
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  timeButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 12,
    backgroundColor: colors.slate[100],
  },
  timeButtonActive: {
    backgroundColor: colors.brand.primary,
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  timeButtonTextActive: {
    color: colors.text.inverse,
  },
  thresholdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[1],
  },
  thresholdBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    borderRadius: 8,
  },
  thresholdBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  thresholdDescription: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginBottom: spacing[4],
  },
  thresholdSliderContainer: {
    marginBottom: spacing[4],
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "visible",
    position: "relative",
  },
  sliderGradient: {
    flex: 1,
    borderRadius: 4,
    height: 8,
  },
  sliderThumb: {
    position: "absolute",
    top: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.primary,
    borderWidth: 3,
    borderColor: colors.brand.primary,
    marginLeft: -14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderThumbText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    color: colors.brand.primary,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing[3],
  },
  sliderLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  thresholdButtons: {
    flexDirection: "row",
    gap: spacing[2],
  },
  thresholdButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
  },
  thresholdButtonActive: {
    backgroundColor: colors.brand.primary,
  },
  thresholdButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  thresholdButtonTextActive: {
    color: colors.text.inverse,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    paddingBottom: spacing[8],
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
});
