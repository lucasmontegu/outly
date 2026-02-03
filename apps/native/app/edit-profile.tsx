import { useState } from "react";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import {
  ArrowLeft01Icon,
  Camera01Icon,
  UserIcon,
  Mail01Icon,
  Phone01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "heroui-native";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      "Change Photo",
      "Choose an option",
      [
        { text: "Take Photo", onPress: () => {} },
        { text: "Choose from Library", onPress: () => {} },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.state.success} />
        </View>
      </SafeAreaView>
    );
  }

  const hasChanges =
    firstName.trim() !== (user?.firstName || "") ||
    lastName.trim() !== (user?.lastName || "");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                !hasChanges && styles.saveButtonTextDisabled,
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.avatarContainer}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <HugeiconsIcon icon={UserIcon} size={48} color={colors.text.tertiary} />
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleChangePhoto}
            >
              <HugeiconsIcon icon={Camera01Icon} size={18} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleChangePhoto}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Card style={styles.formCard}>
            <Card.Body style={styles.formCardBody}>
              {/* First Name */}
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <HugeiconsIcon icon={UserIcon} size={20} color={colors.text.secondary} />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter first name"
                    placeholderTextColor={colors.text.tertiary}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.divider} />

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <HugeiconsIcon icon={UserIcon} size={20} color={colors.text.secondary} />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter last name"
                    placeholderTextColor={colors.text.tertiary}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </Card.Body>
          </Card>
        </View>

        {/* Email Section (Read-only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Card style={styles.formCard}>
            <Card.Body style={styles.formCardBody}>
              {/* Email */}
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <HugeiconsIcon icon={Mail01Icon} size={20} color={colors.text.secondary} />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <Text style={styles.readOnlyText}>
                    {user?.emailAddresses[0]?.emailAddress || "No email"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Phone */}
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <HugeiconsIcon icon={Phone01Icon} size={20} color={colors.text.secondary} />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Phone</Text>
                  <Text style={styles.readOnlyText}>
                    {user?.phoneNumbers[0]?.phoneNumber || "Not set"}
                  </Text>
                </View>
              </View>
            </Card.Body>
          </Card>
          <Text style={styles.infoText}>
            Contact information is managed through your authentication provider.
          </Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card style={styles.formCard}>
            <Card.Body style={styles.formCardBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>User ID</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {user?.id?.slice(0, 20)}...
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Unknown"}
                </Text>
              </View>
            </Card.Body>
          </Card>
        </View>

        {/* Delete Account */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() =>
            Alert.alert(
              "Delete Account",
              "Are you sure you want to delete your account? This action cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {},
                },
              ]
            )
          }
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
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
  saveButton: {
    backgroundColor: colors.state.success,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: colors.border.light,
  },
  saveButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  saveButtonTextDisabled: {
    color: colors.text.tertiary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  photoSection: {
    alignItems: "center",
    marginBottom: spacing[6],
    paddingTop: spacing[2],
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing[3],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.state.success,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  changePhotoText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.state.success,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[2],
    marginLeft: 4,
  },
  formCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
  },
  formCardBody: {
    padding: 4,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    gap: spacing[3],
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  textInput: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    padding: 0,
  },
  readOnlyText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.slate[100],
    marginHorizontal: spacing[3],
  },
  infoText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing[2],
    marginLeft: 4,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[3],
  },
  infoLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  infoValue: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    maxWidth: "60%",
    textAlign: "right",
  },
  deleteButton: {
    alignItems: "center",
    padding: spacing[4],
    marginTop: spacing[2],
  },
  deleteButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.state.error,
  },
});
