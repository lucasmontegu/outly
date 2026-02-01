import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import {
  Home01Icon,
  Building06Icon,
  Location01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Location from "expo-location";
import { useState, useEffect } from "react";

type LocationType = "home" | "work" | "other";

export default function SaveLocationScreen() {
  const router = useRouter();
  const createLocation = useMutation(api.userLocations.create);

  const [selectedType, setSelectedType] = useState<LocationType>("home");
  const [customName, setCustomName] = useState("");
  const [address, setAddress] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  // Get current location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });

          // Reverse geocode to get address
          const [geocode] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (geocode) {
            const addressParts = [
              geocode.street,
              geocode.city,
              geocode.region,
            ].filter(Boolean);
            setAddress(addressParts.join(", "));
          }
        }
      } catch (error) {
        console.error("Error getting location:", error);
      }
    })();
  }, []);

  const getLocationName = () => {
    if (selectedType === "other") {
      return customName || "My Place";
    }
    return selectedType === "home" ? "Home" : "Work";
  };

  const saveLocation = async () => {
    if (!currentLocation && useCurrentLocation) {
      return;
    }

    setIsLoading(true);
    try {
      // Save the location
      await createLocation({
        name: getLocationName(),
        location: currentLocation || { lat: 0, lng: 0 },
        address: address || undefined,
        isDefault: true,
      });

      // Navigate to preferences screen
      router.push("/(setup)/preferences");
    } catch (error) {
      console.error("Error saving location:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const skipAndFinish = () => {
    // Skip to preferences, they can add location later
    router.push("/(setup)/preferences");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
            <Text style={styles.title}>Save Your First Location</Text>
            <Text style={styles.description}>
              Add a place you go often. We'll calculate risk scores for it automatically.
            </Text>
          </View>

          {/* Location Type Selection */}
          <View style={styles.typeSection}>
            <Text style={styles.sectionLabel}>What is this place?</Text>
            <View style={styles.typeOptions}>
              <LocationTypeButton
                type="home"
                icon={Home01Icon}
                label="Home"
                isSelected={selectedType === "home"}
                onPress={() => setSelectedType("home")}
              />
              <LocationTypeButton
                type="work"
                icon={Building06Icon}
                label="Work"
                isSelected={selectedType === "work"}
                onPress={() => setSelectedType("work")}
              />
              <LocationTypeButton
                type="other"
                icon={Location01Icon}
                label="Other"
                isSelected={selectedType === "other"}
                onPress={() => setSelectedType("other")}
              />
            </View>

            {selectedType === "other" && (
              <TextInput
                style={styles.customNameInput}
                placeholder="Name this place (e.g., Gym, School)"
                value={customName}
                onChangeText={setCustomName}
                placeholderTextColor="#9CA3AF"
              />
            )}
          </View>

          {/* Current Location Card */}
          {currentLocation && (
            <View style={styles.locationCard}>
              <View style={styles.locationCardHeader}>
                <View style={styles.locationIcon}>
                  <HugeiconsIcon icon={Location01Icon} size={20} color="#3B82F6" />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Using current location</Text>
                  <Text style={styles.locationAddress} numberOfLines={2}>
                    {address || "Detecting address..."}
                  </Text>
                </View>
                <View style={styles.checkIcon}>
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={24}
                    color="#10B981"
                  />
                </View>
              </View>
            </View>
          )}

          {!currentLocation && (
            <View style={styles.noLocationCard}>
              <Text style={styles.noLocationText}>
                Enable location access to save this place
              </Text>
            </View>
          )}

          {/* Benefits reminder */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>What you'll get:</Text>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>📊</Text>
              <Text style={styles.benefitText}>
                Daily risk scores for this location
              </Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>🔔</Text>
              <Text style={styles.benefitText}>
                Alerts when conditions change
              </Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>⏰</Text>
              <Text style={styles.benefitText}>
                Best departure time recommendations
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <Button
            color="accent"
            size="lg"
            className="w-full h-14 rounded-xl"
            onPress={saveLocation}
            isDisabled={isLoading || (!currentLocation && useCurrentLocation)}
          >
            {isLoading ? "Saving..." : `Save ${getLocationName()} & Start`}
          </Button>
          <TouchableOpacity onPress={skipAndFinish} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>

          {/* Progress dots */}
          <View style={styles.pagination}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Location Type Button Component
function LocationTypeButton({
  type,
  icon,
  label,
  isSelected,
  onPress,
}: {
  type: LocationType;
  icon: typeof Home01Icon;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.typeButton, isSelected && styles.typeButtonSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.typeIconWrapper,
          isSelected && styles.typeIconWrapperSelected,
        ]}
      >
        <HugeiconsIcon
          icon={icon}
          size={24}
          color={isSelected ? "#3B82F6" : "#6B7280"}
        />
      </View>
      <Text
        style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}
      >
        {label}
      </Text>
    </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  typeSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  typeOptions: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  typeButtonSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  typeIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  typeIconWrapperSelected: {
    backgroundColor: "#DBEAFE",
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  typeLabelSelected: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  customNameInput: {
    marginTop: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  locationCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  locationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  locationAddress: {
    fontSize: 14,
    color: "#374151",
    marginTop: 2,
  },
  checkIcon: {
    marginLeft: 8,
  },
  noLocationCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  noLocationText: {
    fontSize: 14,
    color: "#92400E",
    textAlign: "center",
  },
  benefitsCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 18,
  },
  benefitText: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  skipText: {
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  dotActive: {
    backgroundColor: "#111827",
  },
});
