import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import {
  Home01Icon,
  Building06Icon,
  Location01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Location from "expo-location";
import { useState, useEffect } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { SetupShell } from "@/components/setup-shell";
import { colors, spacing, borderRadius, typography } from "@/lib/design-tokens";

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
  const [loadingLocation, setLoadingLocation] = useState(true);

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
      } finally {
        setLoadingLocation(false);
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
    if (!currentLocation) {
      return;
    }

    setIsLoading(true);
    try {
      await createLocation({
        name: getLocationName(),
        location: currentLocation,
        address: address || undefined,
        isDefault: true,
      });
      router.push("/(setup)/preferences");
    } catch (error) {
      console.error("Error saving location:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const skipAndContinue = () => {
    router.push("/(setup)/preferences");
  };

  const canContinue = currentLocation !== null;

  return (
    <SetupShell
      currentStep={2}
      totalSteps={4}
      title="Where do you usually go?"
      subtitle="Save your first location so we can calculate risk scores for it."
      primaryAction={{
        label: `Save ${getLocationName()}`,
        onPress: saveLocation,
        disabled: !canContinue,
        loading: isLoading,
      }}
      secondaryAction={{
        label: "Skip for now",
        onPress: skipAndContinue,
      }}
    >
      {/* Location Type Selection */}
      <Animated.View entering={FadeIn.delay(400)} style={styles.section}>
        <Text style={styles.sectionLabel}>What is this place?</Text>
        <View style={styles.typeOptions}>
          <LocationTypeCard
            type="home"
            icon={Home01Icon}
            label="Home"
            isSelected={selectedType === "home"}
            onPress={() => setSelectedType("home")}
          />
          <LocationTypeCard
            type="work"
            icon={Building06Icon}
            label="Work"
            isSelected={selectedType === "work"}
            onPress={() => setSelectedType("work")}
          />
          <LocationTypeCard
            type="other"
            icon={Location01Icon}
            label="Other"
            isSelected={selectedType === "other"}
            onPress={() => setSelectedType("other")}
          />
        </View>

        {selectedType === "other" && (
          <Animated.View entering={FadeIn.delay(100)}>
            <TextInput
              style={styles.customNameInput}
              placeholder="Name this place (e.g., Gym, School)"
              value={customName}
              onChangeText={setCustomName}
              placeholderTextColor={colors.text.tertiary}
              autoComplete="off"
            />
          </Animated.View>
        )}
      </Animated.View>

      {/* Current Location Card */}
      <Animated.View entering={FadeIn.delay(500)}>
        {loadingLocation ? (
          <View style={styles.locationCard}>
            <Text style={styles.locationLabel}>Detecting your location...</Text>
          </View>
        ) : currentLocation ? (
          <View style={[styles.locationCard, styles.locationCardActive]}>
            <View style={styles.locationIcon}>
              <HugeiconsIcon icon={Location01Icon} size={20} color={colors.state.info} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Current location</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {address || "Location detected"}
              </Text>
            </View>
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={24}
              color={colors.state.success}
            />
          </View>
        ) : (
          <View style={[styles.locationCard, styles.locationCardWarning]}>
            <Text style={styles.noLocationText}>
              Enable location access to save this place
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Benefits Preview */}
      <Animated.View entering={FadeIn.delay(600)} style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>What you'll get</Text>
        <View style={styles.benefit}>
          <Text style={styles.benefitIcon}>📊</Text>
          <Text style={styles.benefitText}>Daily risk scores for this location</Text>
        </View>
        <View style={styles.benefit}>
          <Text style={styles.benefitIcon}>🔔</Text>
          <Text style={styles.benefitText}>Alerts when conditions change</Text>
        </View>
        <View style={styles.benefit}>
          <Text style={styles.benefitIcon}>⏰</Text>
          <Text style={styles.benefitText}>Best departure time recommendations</Text>
        </View>
      </Animated.View>
    </SetupShell>
  );
}

// Location Type Card Component
function LocationTypeCard({
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
      style={[styles.typeCard, isSelected && styles.typeCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.typeIconWrapper, isSelected && styles.typeIconWrapperSelected]}>
        <HugeiconsIcon
          icon={icon}
          size={24}
          color={isSelected ? colors.brand.secondary : colors.text.secondary}
        />
      </View>
      <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
        {label}
      </Text>
      {isSelected && <View style={styles.selectedIndicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  section: {
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
  typeCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
    position: "relative",
  },
  typeCardSelected: {
    borderColor: colors.brand.secondary,
    backgroundColor: "#EFF6FF",
  },
  typeIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius["3xl"],
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
    color: colors.brand.secondary,
    fontWeight: typography.weight.semibold,
  },
  selectedIndicator: {
    position: "absolute",
    bottom: spacing[2],
    width: spacing[6],
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.brand.secondary,
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
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  locationCardActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.risk.low.light,
    borderColor: "#BBF7D0",
  },
  locationCardWarning: {
    backgroundColor: colors.risk.medium.light,
    borderColor: "#FED7AA",
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius["2xl"],
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
    color: colors.slate[700],
  },
  locationAddress: {
    fontSize: typography.size.base,
    color: colors.slate[600],
    marginTop: 2,
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
});
