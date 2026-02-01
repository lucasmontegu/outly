import { useState } from "react";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import { Id } from "@outly/backend/convex/_generated/dataModel";
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
    if (lowerName.includes("home")) return { color: "#10B981", bg: "#D1FAE5" };
    if (lowerName.includes("work") || lowerName.includes("office")) return { color: "#3B82F6", bg: "#DBEAFE" };
    return { color: "#8B5CF6", bg: "#EDE9FE" };
  };

  if (locations === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Locations</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd}>
          <HugeiconsIcon icon={Add01Icon} size={24} color="#3B82F6" />
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
              <HugeiconsIcon icon={Location01Icon} size={24} color="#3B82F6" />
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
                  variant="primary"
                  style={styles.emptyButton}
                  onPress={handleOpenAdd}
                >
                  Add Location
                </Button>
              </Card.Body>
            </Card>
          ) : (
            locations.map((loc) => {
              const colors = getLocationColor(loc.name);
              return (
                <Card key={loc._id} style={styles.locationCard}>
                  <Card.Body style={styles.locationCardBody}>
                    <View style={[styles.locationIcon, { backgroundColor: colors.bg }]}>
                      <HugeiconsIcon
                        icon={getLocationIcon(loc.name)}
                        size={20}
                        color={colors.color}
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
                        <HugeiconsIcon icon={Edit02Icon} size={18} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(loc._id, loc.name)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={18} color="#EF4444" />
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
                        color={newIcon === item.type ? "#3B82F6" : "#6B7280"}
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
                  placeholderTextColor="#9CA3AF"
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
                  placeholderTextColor="#9CA3AF"
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
                    <HugeiconsIcon icon={Location01Icon} size={16} color="#3B82F6" />
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
                variant="primary"
                size="lg"
                style={styles.modalSubmitButton}
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
    backgroundColor: "#F9FAFB",
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
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
    paddingBottom: 40,
  },
  currentLocationCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    marginBottom: 24,
  },
  currentLocationBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  currentLocationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  currentLocationInfo: {
    flex: 1,
  },
  currentLocationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
    marginBottom: 2,
  },
  currentLocationAddress: {
    fontSize: 14,
    color: "#1E40AF",
  },
  saveCurrentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 8,
  },
  saveCurrentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  emptyCardBody: {
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
  locationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
  },
  locationCardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  defaultBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#059669",
  },
  locationAddress: {
    fontSize: 13,
    color: "#6B7280",
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
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalKeyboard: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 15,
    color: "#6B7280",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalHeaderSpacer: {
    width: 60,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  iconGrid: {
    flexDirection: "row",
    gap: 12,
  },
  iconOption: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  iconOptionSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  iconOptionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 8,
  },
  iconOptionLabelSelected: {
    color: "#3B82F6",
  },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
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
    borderRadius: 8,
  },
  useCurrentText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  defaultToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  defaultToggleContent: {
    flex: 1,
  },
  defaultToggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  defaultToggleDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalSubmitButton: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    backgroundColor: "#111827",
  },
});
