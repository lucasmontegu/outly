import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
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
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

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
                placeholder="Name this place (e.g., Gym, School)…"
                value={customName}
                onChangeText={setCustomName}
                placeholderTextColor={colors.text.tertiary}
                autoComplete="off"
                accessibilityLabel="Custom location name"
              />
            )}
          </View>

          {/* Current Location Card */}
          {currentLocation && (
            <View style={styles.locationCard}>
              <View style={styles.locationCardHeader}>
                <View style={styles.locationIcon}>
                  <HugeiconsIcon icon={Location01Icon} size={20} color={colors.state.info} />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Using current location</Text>
                  <Text style={styles.locationAddress} numberOfLines={2}>
                    {address || "Detecting address…"}
                  </Text>
                </View>
                <View style={styles.checkIcon}>
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={24}
                    color={colors.state.success}
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
            {isLoading ? "Saving…" : `Save ${getLocationName()} & Start`}
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
          color={isSelected ? colors.state.info : colors.text.secondary}
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
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[6],
  },
  header: {
    marginBottom: spacing[8],
  },
  stepLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.state.info,
    letterSpacing: typography.tracking.wide,
    textAlign: "center",
    marginBottom: spacing[2],
  },
  title: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: "center",
  },
  description: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: spacing[2],
    textAlign: "center",
  },
  typeSection: {
    marginBottom: spacing[6],
  },
  sectionLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.slate[700],
    marginBottom: spacing[3],
  },
  typeOptions: {
    flexDirection: "row",
    gap: spacing[3],
  },
  typeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  typeButtonSelected: {
    borderColor: colors.state.info,
    backgroundColor: "#EFF6FF",
  },
  typeIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius['3xl'],
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  typeIconWrapperSelected: {
    backgroundColor: "#DBEAFE",
  },
  typeLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
  typeLabelSelected: {
    color: colors.state.info,
    fontWeight: typography.weight.semibold,
  },
  customNameInput: {
    marginTop: spacing[4],
    height: 48,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    fontSize: typography.size.md,
    color: colors.text.primary,
    backgroundColor: colors.background.tertiary,
  },
  locationCard: {
    backgroundColor: colors.risk.low.light,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  locationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius['2xl'],
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: "#059669",
  },
  locationAddress: {
    fontSize: typography.size.base,
    color: colors.slate[700],
    marginTop: 2,
  },
  checkIcon: {
    marginLeft: spacing[2],
  },
  noLocationCard: {
    backgroundColor: colors.risk.medium.light,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    marginBottom: spacing[6],
    alignItems: "center",
  },
  noLocationText: {
    fontSize: typography.size.base,
    color: "#92400E",
    textAlign: "center",
  },
  benefitsCard: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
  },
  benefitsTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.slate[700],
    marginBottom: spacing[4],
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  benefitIcon: {
    fontSize: typography.size.xl,
  },
  benefitText: {
    fontSize: typography.size.base,
    color: colors.slate[600],
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
    backgroundColor: colors.background.primary,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: spacing[3],
    marginTop: spacing[2],
  },
  skipText: {
    fontSize: typography.size.md,
    color: colors.text.tertiary,
    fontWeight: typography.weight.medium,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing[3],
    gap: spacing[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.light,
  },
  dotActive: {
    backgroundColor: colors.text.primary,
  },
});
