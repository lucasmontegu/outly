import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import { Redirect, Stack } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function SetupLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Wait for auth to load
  if (!isLoaded) {
    return null;
  }

  // If not signed in, redirect to onboarding
  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  // Wait for user data to load
  if (currentUser === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  // If onboarding is already completed, go to main app
  if (currentUser?.onboardingCompleted) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="save-location" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="gamification" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
