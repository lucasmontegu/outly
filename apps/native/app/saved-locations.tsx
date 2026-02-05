import { useState } from "react";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { Id } from "@outia/backend/convex/_generated/dataModel";
import {
  Location01Icon,
  Add01Icon,
  Delete02Icon,
  Home01Icon,
  Building02Icon,
  StarIcon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ScreenHeader } from "@/components/screen-header";
import { useLocation } from "@/hooks/use-location";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

type LocationIcon = "home" | "building" | "star" | "location";

const LOCATION_ICONS: { type: LocationIcon; icon: any; label: string; color: string; bg: string }[] = [
  { type: "home", icon: Home01Icon, label: "Home", color: colors.state.success, bg: "#ECFDF5" },
  { type: "building", icon: Building02Icon, label: "Work", color: colors.state.info, bg: "#EFF6FF" },
  { type: "star", icon: StarIcon, label: "Favorite", color: colors.gamification.gold, bg: "#FEF3C7" },
  { type: "location", icon: Location01Icon, label: "Other", color: colors.gamification.xp, bg: "#EDE9FE" },
];

export default function SavedLocationsScreen() {
  const router = useRouter();
  const { location: currentLocation, address: currentAddress } = useLocation();

  const locations = useQuery(api.userLocations.list);
  const createLocation = useMutation(api.userLocations.create);
  const updateLocation = useMutation(api.userLocations.update);
  const removeLocation = useMutation(api.userLocations.remove);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Id<"userLocations"> | null>(null);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newIcon, setNewIcon] = useState<LocationIcon>("location");
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setNewName("");
    setNewAddress("");
    setNewIcon("location");
    setIsDefault(false);
    setEditingLocation(null);
  };

  const handleOpenAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (loc: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingLocation(loc._id);
    setNewName(loc.name);
    setNewAddress(loc.address || "");
    setIsDefault(loc.isDefault);
    // Determine icon from name
    if (loc.name.toLowerCase().includes("home")) setNewIcon("home");
    else if (loc.name.toLowerCase().includes("work")) setNewIcon("building");
    else setNewIcon("location");
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Please enter a location name");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingLocation) {
        await updateLocation({
          id: editingLocation,
          name: newName.trim(),
          address: newAddress.trim() || undefined,
          isDefault,
        });
      } else {
        await createLocation({
          name: newName.trim(),
          location: currentLocation || { lat: 0, lng: 0 },
          address: newAddress.trim() || undefined,
          isDefault,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      Alert.alert("Error", "Failed to save location. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: Id<"userLocations">, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Location",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeLocation({ id });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert("Error", "Failed to delete location");
            }
          },
        },
      ]
    );
  };

  const getLocationIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("home")) return Home01Icon;
    if (lowerName.includes("work") || lowerName.includes("office")) return Building02Icon;
    return Location01Icon;
  };

  const getLocationColor = (name: string): { color: string; bg: string } => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("home")) return { color: colors.state.success, bg: "#ECFDF5" };
    if (lowerName.includes("work") || lowerName.includes("office")) return { color: colors.state.info, bg: "#EFF6FF" };
    return { color: colors.gamification.xp, bg: "#EDE9FE" };
  };

  if (locations === undefined) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Saved Locations"
          rightAction={{ label: "Add", onPress: handleOpenAdd }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Saved Locations"
        rightAction={{ label: "Add", onPress: handleOpenAdd }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Location Card */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.currentLocationCard}>
          <View style={styles.currentLocationIcon}>
            <HugeiconsIcon icon={Location01Icon} size={24} color={colors.brand.secondary} />
          </View>
          <View style={styles.currentLocationInfo}>
            <Text style={styles.currentLocationLabel}>Current Location</Text>
            <Text style={styles.currentLocationAddress} numberOfLines={1}>
              {currentAddress || "Detecting..."}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.saveCurrentButton}
            onPress={() => {
              setNewAddress(currentAddress || "");
              handleOpenAdd();
            }}
            activeOpacity={0.7}
          >
            <HugeiconsIcon icon={Add01Icon} size={18} color={colors.text.inverse} />
            <Text style={styles.saveCurrentText}>Save</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Saved Locations List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YOUR LOCATIONS</Text>
          <Text style={styles.sectionCount}>{locations.length} saved</Text>
        </View>

        {locations.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>pin</Text>
            <Text style={styles.emptyTitle}>No saved locations</Text>
            <Text style={styles.emptyText}>
              Add your frequently visited places for quick access to risk scores
            </Text>
            <Button
              color="accent"
              className="px-6 h-12 rounded-xl mt-4"
              onPress={handleOpenAdd}
            >
              Add Location
            </Button>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(500).delay(200)}>
            {locations.map((loc, index) => {
              const locColors = getLocationColor(loc.name);
              return (
                <TouchableOpacity
                  key={loc._id}
                  style={styles.locationCard}
                  onPress={() => handleOpenEdit(loc)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.locationIcon, { backgroundColor: locColors.bg }]}>
                    <HugeiconsIcon
                      icon={getLocationIcon(loc.name)}
                      size={22}
                      color={locColors.color}
                    />
                  </View>
                  <View style={styles.locationInfo}>
                    <View style={styles.locationNameRow}>
                      <Text style={styles.locationName}>{loc.name}</Text>
                      {loc.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    {loc.address && (
                      <Text style={styles.locationAddress} numberOfLines={1}>
                        {loc.address}
                      </Text>
                    )}
                  </View>
                  <View style={styles.locationActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(loc._id, loc.name);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={20} color={colors.state.error} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: spacing[10] }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKeyboard}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingLocation ? "Edit Location" : "Add Location"}
              </Text>
              <View style={styles.modalHeaderSpacer} />
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Icon Selection */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>TYPE</Text>
                <View style={styles.iconGrid}>
                  {LOCATION_ICONS.map((item) => (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        styles.iconOption,
                        newIcon === item.type && styles.iconOptionSelected,
                        newIcon === item.type && { borderColor: item.color },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNewIcon(item.type);
                        if (!newName && item.type !== "location") {
                          setNewName(item.label);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconOptionCircle, { backgroundColor: item.bg }]}>
                        <HugeiconsIcon
                          icon={item.icon}
                          size={24}
                          color={item.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.iconOptionLabel,
                          newIcon === item.type && { color: item.color },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Name Input */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>NAME</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Home, Work, Gym"
                  placeholderTextColor={colors.text.tertiary}
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              {/* Address Input */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>ADDRESS (OPTIONAL)</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputMultiline]}
                  placeholder="Enter address or use current location"
                  placeholderTextColor={colors.text.tertiary}
                  value={newAddress}
                  onChangeText={setNewAddress}
                  multiline
                  numberOfLines={2}
                />
                {currentAddress && (
                  <TouchableOpacity
                    style={styles.useCurrentButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewAddress(currentAddress);
                    }}
                    activeOpacity={0.7}
                  >
                    <HugeiconsIcon icon={Location01Icon} size={16} color={colors.brand.secondary} />
                    <Text style={styles.useCurrentText}>Use current location</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Default Toggle */}
              <TouchableOpacity
                style={styles.defaultToggle}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsDefault(!isDefault);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.defaultToggleContent}>
                  <Text style={styles.defaultToggleLabel}>Set as default location</Text>
                  <Text style={styles.defaultToggleDescription}>
                    This will be used for the overview screen
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    isDefault && styles.checkboxChecked,
                  ]}
                >
                  {isDefault && <Text style={styles.checkmark}>check</Text>}
                </View>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                color="accent"
                size="lg"
                className="w-full h-14 rounded-2xl"
                onPress={handleSubmit}
                isDisabled={isSubmitting || !newName.trim()}
              >
                {isSubmitting
                  ? "Saving..."
                  : editingLocation
                  ? "Save Changes"
                  : "Add Location"}
              </Button>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },

  // Current Location Card
  currentLocationCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    padding: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[6],
    ...shadows.sm,
  },
  currentLocationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  currentLocationInfo: {
    flex: 1,
  },
  currentLocationLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.brand.secondary,
    marginBottom: 2,
  },
  currentLocationAddress: {
    fontSize: typography.size.base,
    color: "#1E40AF",
  },
  saveCurrentButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    backgroundColor: colors.brand.secondary,
    borderRadius: 10,
  },
  saveCurrentText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },

  // Empty State
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing[8],
    alignItems: "center",
    ...shadows.sm,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: spacing[4],
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
    lineHeight: 22,
  },

  // Location Card
  locationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  locationName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  defaultBadge: {
    backgroundColor: colors.risk.low.light,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.risk.low.dark,
  },
  locationAddress: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  locationActions: {
    flexDirection: "row",
    gap: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.risk.high.light,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  modalKeyboard: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalCloseButton: {
    padding: spacing[2],
  },
  modalCloseText: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  modalHeaderSpacer: {
    width: 60,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: spacing[4],
  },
  modalSection: {
    marginBottom: spacing[5],
  },
  modalLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[3],
    letterSpacing: 0.5,
  },
  iconGrid: {
    flexDirection: "row",
    gap: spacing[3],
  },
  iconOption: {
    flex: 1,
    alignItems: "center",
    padding: spacing[4],
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  iconOptionSelected: {
    backgroundColor: "#FFFFFF",
  },
  iconOptionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  iconOptionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  modalInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 14,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  modalInputMultiline: {
    height: 80,
    textAlignVertical: "top",
  },
  useCurrentButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[3],
    padding: spacing[3],
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
  },
  useCurrentText: {
    fontSize: typography.size.base,
    color: colors.brand.secondary,
    fontWeight: typography.weight.medium,
  },
  defaultToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  defaultToggleContent: {
    flex: 1,
  },
  defaultToggleLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  defaultToggleDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.brand.secondary,
    borderColor: colors.brand.secondary,
  },
  checkmark: {
    color: colors.text.inverse,
    fontSize: typography.size.sm,
  },
  modalFooter: {
    padding: spacing[4],
    paddingBottom: spacing[6],
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});
