import { useState } from "react";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { Id } from "@outia/backend/convex/_generated/dataModel";
import {
  ArrowLeft01Icon,
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
import { Card, Button } from "heroui-native";

import { useLocation } from "@/hooks/use-location";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

type LocationIcon = "home" | "building" | "star" | "location";

const LOCATION_ICONS: { type: LocationIcon; icon: any; label: string }[] = [
  { type: "home", icon: Home01Icon, label: "Home" },
  { type: "building", icon: Building02Icon, label: "Work" },
  { type: "star", icon: StarIcon, label: "Favorite" },
  { type: "location", icon: Location01Icon, label: "Other" },
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
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (loc: any) => {
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
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      Alert.alert("Error", "Failed to save location. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: Id<"userLocations">, name: string) => {
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
            } catch (error) {
              Alert.alert("Error", "Failed to delete location");
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: Id<"userLocations">) => {
    try {
      await updateLocation({ id, isDefault: true });
    } catch (error) {
      Alert.alert("Error", "Failed to set default location");
    }
  };

  const getLocationIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("home")) return Home01Icon;
    if (lowerName.includes("work") || lowerName.includes("office")) return Building02Icon;
    return Location01Icon;
  };

  const getLocationColor = (name: string): { color: string; bg: string } => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("home")) return { color: colors.state.success, bg: colors.risk.low.light };
    if (lowerName.includes("work") || lowerName.includes("office")) return { color: colors.state.info, bg: colors.risk.low.light };
    return { color: colors.gamification.xp, bg: "#EDE9FE" };
  };

  if (locations === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.state.info} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Locations</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd}>
          <HugeiconsIcon icon={Add01Icon} size={24} color={colors.state.info} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current Location Card */}
        <Card style={styles.currentLocationCard}>
          <Card.Body style={styles.currentLocationBody}>
            <View style={styles.currentLocationIcon}>
              <HugeiconsIcon icon={Location01Icon} size={24} color={colors.state.info} />
            </View>
            <View style={styles.currentLocationInfo}>
              <Text style={styles.currentLocationLabel}>Current Location</Text>
              <Text style={styles.currentLocationAddress}>
                {currentAddress || "Detecting..."}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.saveCurrentButton}
              onPress={() => {
                setNewAddress(currentAddress || "");
                handleOpenAdd();
              }}
            >
              <Text style={styles.saveCurrentText}>Save</Text>
            </TouchableOpacity>
          </Card.Body>
        </Card>

        {/* Saved Locations List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Locations</Text>

          {locations.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Body style={styles.emptyCardBody}>
                <Text style={styles.emptyIcon}>📍</Text>
                <Text style={styles.emptyTitle}>No saved locations</Text>
                <Text style={styles.emptyText}>
                  Add your frequently visited places for quick access
                </Text>
                <Button
                  color="accent"
                  className="px-6 h-12 rounded-xl"
                  onPress={handleOpenAdd}
                >
                  Add Location
                </Button>
              </Card.Body>
            </Card>
          ) : (
            locations.map((loc) => {
              const locColors = getLocationColor(loc.name);
              return (
                <Card key={loc._id} style={styles.locationCard}>
                  <Card.Body style={styles.locationCardBody}>
                    <View style={[styles.locationIcon, { backgroundColor: locColors.bg }]}>
                      <HugeiconsIcon
                        icon={getLocationIcon(loc.name)}
                        size={20}
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
                        onPress={() => handleOpenEdit(loc)}
                      >
                        <HugeiconsIcon icon={Edit02Icon} size={18} color={colors.text.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(loc._id, loc.name)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={18} color={colors.state.error} />
                      </TouchableOpacity>
                    </View>
                  </Card.Body>
                </Card>
              );
            })
          )}
        </View>
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
            >
              {/* Icon Selection */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Type</Text>
                <View style={styles.iconGrid}>
                  {LOCATION_ICONS.map((item) => (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        styles.iconOption,
                        newIcon === item.type && styles.iconOptionSelected,
                      ]}
                      onPress={() => {
                        setNewIcon(item.type);
                        if (!newName && item.type !== "location") {
                          setNewName(item.label);
                        }
                      }}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        size={24}
                        color={newIcon === item.type ? colors.state.info : colors.text.secondary}
                      />
                      <Text
                        style={[
                          styles.iconOptionLabel,
                          newIcon === item.type && styles.iconOptionLabelSelected,
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
                <Text style={styles.modalLabel}>Name</Text>
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
                <Text style={styles.modalLabel}>Address (optional)</Text>
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
                    onPress={() => setNewAddress(currentAddress)}
                  >
                    <HugeiconsIcon icon={Location01Icon} size={16} color={colors.state.info} />
                    <Text style={styles.useCurrentText}>Use current location</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Default Toggle */}
              <TouchableOpacity
                style={styles.defaultToggle}
                onPress={() => setIsDefault(!isDefault)}
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
                  {isDefault && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                color="accent"
                size="lg"
                className="w-full h-14 rounded-xl"
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
    </SafeAreaView>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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
    paddingBottom: spacing[10],
  },
  currentLocationCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: borderRadius.xl,
    marginBottom: spacing[6],
  },
  currentLocationBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    gap: spacing[3],
  },
  currentLocationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.risk.low.light,
    alignItems: "center",
    justifyContent: "center",
  },
  currentLocationInfo: {
    flex: 1,
  },
  currentLocationLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.state.info,
    marginBottom: 2,
  },
  currentLocationAddress: {
    fontSize: typography.size.base,
    color: "#1E40AF",
  },
  saveCurrentButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.state.info,
    borderRadius: borderRadius.md,
  },
  saveCurrentText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[3],
    marginLeft: 4,
  },
  emptyCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
  },
  emptyCardBody: {
    alignItems: "center",
    padding: spacing[8],
  },
  emptyIcon: {
    fontSize: 48,
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
    marginBottom: spacing[5],
  },
  locationCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
  },
  locationCardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: spacing[3],
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
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
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.risk.low.dark,
  },
  locationAddress: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  locationActions: {
    flexDirection: "row",
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalKeyboard: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
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
    padding: spacing[5],
  },
  modalSection: {
    marginBottom: spacing[6],
  },
  modalLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.slate[700],
    marginBottom: 10,
  },
  iconGrid: {
    flexDirection: "row",
    gap: spacing[3],
  },
  iconOption: {
    flex: 1,
    alignItems: "center",
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  iconOptionSelected: {
    borderColor: colors.state.info,
    backgroundColor: "#EFF6FF",
  },
  iconOptionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginTop: spacing[2],
  },
  iconOptionLabelSelected: {
    color: colors.state.info,
  },
  modalInput: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
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
    gap: 6,
    marginTop: 10,
    padding: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: borderRadius.md,
  },
  useCurrentText: {
    fontSize: typography.size.base,
    color: colors.state.info,
    fontWeight: typography.weight.medium,
  },
  defaultToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
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
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.state.info,
    borderColor: colors.state.info,
  },
  checkmark: {
    color: colors.text.inverse,
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  modalFooter: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});
