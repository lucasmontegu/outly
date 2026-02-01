import { useAuth } from "@clerk/clerk-expo";
import {
  GridViewIcon,
  MapsIcon,
  BookmarkIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Redirect, Tabs } from "expo-router";
import { View } from "react-native";

import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function TabsLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
  const theme = isDarkColorScheme ? NAV_THEME.dark : NAV_THEME.light;

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <HugeiconsIcon
                icon={GridViewIcon}
                size={24}
                color={color}
                strokeWidth={focused ? 2 : 1.5}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <HugeiconsIcon
                icon={MapsIcon}
                size={24}
                color={color}
                strokeWidth={focused ? 2 : 1.5}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <HugeiconsIcon
                icon={BookmarkIcon}
                size={24}
                color={color}
                strokeWidth={focused ? 2 : 1.5}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <HugeiconsIcon
                icon={Settings02Icon}
                size={24}
                color={color}
                strokeWidth={focused ? 2 : 1.5}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
