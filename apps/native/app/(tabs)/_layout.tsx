import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import { CustomTabBar } from "@/components/custom-tab-bar";
import { useDepartureNotifications } from "@/hooks/use-departure-notifications";

export default function TabsLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Schedule departure notifications for saved routes
  useDepartureNotifications();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
