import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import {
  ArrowLeft01Icon,
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
import { Card, Button } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";

import { useLocation } from "@/hooks/use-location";

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

const ICONS: { type: RouteIcon; icon: any; label: string; color: string; bg: string }[] = [
  { type: "building", icon: Building02Icon, label: "Work", color: "#3B82F6", bg: "#DBEAFE" },
  { type: "home", icon: Home01Icon, label: "Home", color: "#10B981", bg: "#D1FAE5" },
  { type: "running", icon: WorkoutRunIcon, label: "Activity", color: "#F97316", bg: "#FED7AA" },
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
    setFromData(null); // Clear selected location when typing

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
    setToData(null); // Clear selected location when typing

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Route</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Route Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Route Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Daily Commute"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Icon Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Icon</Text>
            <View style={styles.iconRow}>
              {ICONS.map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.iconOption,
                    selectedIcon === item.type && styles.iconOptionSelected,
                    { borderColor: selectedIcon === item.type ? item.color : "#E5E7EB" },
                  ]}
                  onPress={() => setSelectedIcon(item.type)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                    <HugeiconsIcon icon={item.icon} size={24} color={item.color} />
                  </View>
                  <Text style={styles.iconLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* From Location */}
          <View style={[styles.section, { zIndex: 20 }]}>
            <Text style={styles.label}>From</Text>
            <View style={styles.locationInputContainer}>
              <HugeiconsIcon icon={Location01Icon} size={20} color="#10B981" />
              <TextInput
                style={styles.locationInput}
                placeholder="Starting location"
                placeholderTextColor="#9CA3AF"
                value={fromData ? fromData.name : fromQuery}
                onChangeText={handleFromChange}
                onFocus={() => fromQuery.length >= 3 && setShowFromResults(true)}
              />
              {fromSearching && <ActivityIndicator size="small" color="#10B981" />}
              {(fromQuery.length > 0 || fromData) && !fromSearching && (
                <TouchableOpacity onPress={() => { setFromQuery(""); setFromData(null); setFromResults([]); }}>
                  <HugeiconsIcon icon={Cancel01Icon} size={18} color="#9CA3AF" />
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
                    <HugeiconsIcon icon={Location01Icon} size={16} color="#10B981" />
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
                <Text style={styles.suggestionText}>Use current: {address}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* To Location */}
          <View style={[styles.section, { zIndex: 10 }]}>
            <Text style={styles.label}>To</Text>
            <View style={styles.locationInputContainer}>
              <HugeiconsIcon icon={Location01Icon} size={20} color="#EF4444" />
              <TextInput
                style={styles.locationInput}
                placeholder="Destination"
                placeholderTextColor="#9CA3AF"
                value={toData ? toData.name : toQuery}
                onChangeText={handleToChange}
                onFocus={() => toQuery.length >= 3 && setShowToResults(true)}
              />
              {toSearching && <ActivityIndicator size="small" color="#EF4444" />}
              {(toQuery.length > 0 || toData) && !toSearching && (
                <TouchableOpacity onPress={() => { setToQuery(""); setToData(null); setToResults([]); }}>
                  <HugeiconsIcon icon={Cancel01Icon} size={18} color="#9CA3AF" />
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
                    <HugeiconsIcon icon={Location01Icon} size={16} color="#EF4444" />
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
                {savedLocations.slice(0, 3).map((loc) => (
                  <TouchableOpacity
                    key={loc._id}
                    style={styles.savedLocationItem}
                    onPress={() => {
                      setToData({ name: loc.name, lat: loc.location.lat, lng: loc.location.lng });
                      setToQuery(loc.name);
                    }}
                  >
                    <Text style={styles.savedLocationText}>{loc.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Map Preview */}
          <View style={styles.mapPreviewSection}>
            <LinearGradient
              colors={["#E2E8F0", "#CBD5E1"]}
              style={styles.mapPreview}
            >
              <Text style={styles.mapPreviewText}>Route Preview</Text>
            </LinearGradient>
          </View>

          {/* Monitor Days */}
          <View style={styles.section}>
            <Text style={styles.label}>Monitor Days</Text>
            <View style={styles.daysRow}>
              {DAYS.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    monitorDays[index] && styles.dayButtonActive,
                  ]}
                  onPress={() => toggleDay(index)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      monitorDays[index] && styles.dayTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Alert Threshold */}
          <View style={styles.section}>
            <View style={styles.thresholdHeader}>
              <Text style={styles.label}>Alert Threshold</Text>
              <Text style={styles.thresholdValue}>
                {alertThreshold <= 33 ? "Low" : alertThreshold <= 66 ? "Medium" : "High"} Risk (&gt;{alertThreshold})
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
                <View style={[styles.sliderThumb, { left: `${alertThreshold}%` }]} />
              </View>
              <Text style={styles.sliderLabel}>Critical</Text>
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
                >
                  <Text
                    style={[
                      styles.thresholdButtonText,
                      alertThreshold === value && styles.thresholdButtonTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Alert Time */}
          <View style={styles.section}>
            <Text style={styles.label}>Alert Time</Text>
            <View style={styles.timeRow}>
              {["6:00 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM"].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeButton,
                    alertTime === time && styles.timeButtonActive,
                  ]}
                  onPress={() => setAlertTime(time)}
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      alertTime === time && styles.timeButtonTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <Button
            color="accent"
            size="lg"
            className="w-full h-14 rounded-xl"
            onPress={handleSubmit}
            isDisabled={isSubmitting || !name.trim() || !fromLocation || !toLocation}
          >
            {isSubmitting ? "Creating..." : "Create Route"}
          </Button>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  inputContainer: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    color: "#111827",
  },
  iconRow: {
    flexDirection: "row",
    gap: 12,
  },
  iconOption: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: "#F9FAFB",
  },
  iconOptionSelected: {
    backgroundColor: "#fff",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  locationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  locationInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  locationPlaceholder: {
    color: "#9CA3AF",
  },
  searchDropdown: {
    position: "absolute",
    top: 78,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
    maxHeight: 220,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  searchResultAddress: {
    fontSize: 12,
    color: "#6B7280",
  },
  currentLocationSuggestion: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#D1FAE5",
    borderRadius: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: "#059669",
  },
  savedLocationsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  savedLocationItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
  },
  savedLocationText: {
    fontSize: 13,
    color: "#374151",
  },
  mapPreviewSection: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  mapPreview: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  mapPreviewText: {
    fontSize: 14,
    color: "#6B7280",
  },
  daysRow: {
    flexDirection: "row",
    gap: 8,
  },
  dayButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
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
    width: 45,
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
  thresholdButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  thresholdButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  thresholdButtonActive: {
    backgroundColor: "#111827",
  },
  thresholdButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  thresholdButtonTextActive: {
    color: "#fff",
  },
  timeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  timeButtonActive: {
    backgroundColor: "#111827",
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  timeButtonTextActive: {
    color: "#fff",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
});
