import { useState } from "react";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import {
  Camera01Icon,
  UserIcon,
  Mail01Icon,
  Notification01Icon,
  Calendar01Icon,
  Delete02Icon,
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
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ScreenHeader } from "@/components/screen-header";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSaving(true);
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      <View style={styles.container}>
        <ScreenHeader title="Edit Profile" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.secondary} />
        </View>
      </View>
    );
  }

  const hasChanges =
    firstName.trim() !== (user?.firstName || "") ||
    lastName.trim() !== (user?.lastName || "");

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Edit Profile"
        rightAction={{
          label: isSaving ? "..." : "Save",
          onPress: handleSave,
          disabled: !hasChanges || isSaving,
          loading: isSaving,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.photoSection}>
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
              activeOpacity={0.8}
            >
              <HugeiconsIcon icon={Camera01Icon} size={18} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.7}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Personal Information Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
          </View>
          <View style={styles.formCard}>
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
          </View>
        </Animated.View>

        {/* Contact Information Section (Read-only) */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>
          </View>
          <View style={styles.formCard}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <View style={[styles.inputIcon, { backgroundColor: "#EFF6FF" }]}>
                <HugeiconsIcon icon={Mail01Icon} size={20} color={colors.state.info} />
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
              <View style={[styles.inputIcon, { backgroundColor: "#ECFDF5" }]}>
                <HugeiconsIcon icon={Notification01Icon} size={20} color={colors.state.success} />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone</Text>
                <Text style={styles.readOnlyText}>
                  {user?.phoneNumbers[0]?.phoneNumber || "Not set"}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.infoText}>
            Contact information is managed through your authentication provider.
          </Text>
        </Animated.View>

        {/* Account Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
          </View>
          <View style={styles.formCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={[styles.inputIcon, { backgroundColor: colors.slate[100] }]}>
                  <HugeiconsIcon icon={UserIcon} size={20} color={colors.text.secondary} />
                </View>
                <Text style={styles.infoLabel}>User ID</Text>
              </View>
              <Text style={styles.infoValue} numberOfLines={1}>
                {user?.id?.slice(0, 12)}...
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={[styles.inputIcon, { backgroundColor: "#EDE9FE" }]}>
                  <HugeiconsIcon icon={Calendar01Icon} size={20} color={colors.gamification.xp} />
                </View>
                <Text style={styles.infoLabel}>Member Since</Text>
              </View>
              <Text style={styles.infoValue}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "Unknown"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.dangerSection}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(
                "Delete Account",
                "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete Account",
                    style: "destructive",
                    onPress: () => {},
                  },
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <View style={styles.deleteButtonIcon}>
              <HugeiconsIcon icon={Delete02Icon} size={20} color={colors.state.error} />
            </View>
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: spacing[10] }} />
      </ScrollView>
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

  // Photo Section
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
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  cameraButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    ...shadows.md,
  },
  changePhotoText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.brand.secondary,
  },

  // Section Header
  sectionHeader: {
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },

  // Form Card
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    gap: spacing[3],
  },
  inputIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
    marginHorizontal: spacing[4],
  },
  infoText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: -spacing[2],
    marginBottom: spacing[4],
    paddingHorizontal: spacing[1],
    lineHeight: 18,
  },

  // Info Row
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  infoLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  infoValue: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    maxWidth: "40%",
    textAlign: "right",
  },

  // Danger Section
  dangerSection: {
    marginTop: spacing[4],
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.risk.high.light,
    borderRadius: 16,
  },
  deleteButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.state.error,
  },
});
