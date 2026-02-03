import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type RouteWithForecast = {
  _id: string;
  name: string;
  fromName: string;
  toName: string;
  currentScore: number;
  classification: "low" | "medium" | "high";
  optimalDepartureMinutes: number;
  optimalTime: string;
  isOptimalNow: boolean;
};

export function useDepartureNotifications() {
  const routesWithForecast = useQuery(api.routes.getRoutesWithForecast);
  const currentUser = useQuery(api.users.getCurrentUser);
  const scheduledNotifications = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!routesWithForecast || !currentUser?.preferences) return;

    const alertAdvance = currentUser.preferences.alertAdvanceMinutes ?? 30;

    // Schedule notifications for each route
    for (const route of routesWithForecast) {
      scheduleRouteNotification(route, alertAdvance);
    }

    // Cleanup function to cancel notifications when routes change
    return () => {
      cancelAllScheduledNotifications();
    };
  }, [routesWithForecast, currentUser?.preferences?.alertAdvanceMinutes]);

  const scheduleRouteNotification = async (
    route: RouteWithForecast,
    alertAdvanceMinutes: number
  ) => {
    try {
      // Check if we have notification permission
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") return;

      // Cancel existing notification for this route
      const existingId = scheduledNotifications.current.get(route._id);
      if (existingId) {
        await Notifications.cancelScheduledNotificationAsync(existingId);
      }

      // Don't schedule if optimal time is now
      if (route.isOptimalNow) {
        // Send immediate notification if conditions are optimal now
        await sendOptimalNowNotification(route);
        return;
      }

      // Calculate when to send notification
      // We want to notify (alertAdvanceMinutes) before optimal departure
      const notifyMinutesBefore = route.optimalDepartureMinutes - alertAdvanceMinutes;

      // Only schedule if there's time before the notification should fire
      if (notifyMinutesBefore <= 0) {
        // Optimal time is sooner than alert advance - notify immediately
        await sendImmediateNotification(route);
        return;
      }

      // Schedule the notification
      const triggerSeconds = notifyMinutesBefore * 60;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time to leave: ${route.name}`,
          body: getNotificationBody(route),
          data: { routeId: route._id },
          sound: true,
          ...(Platform.OS === "ios" && {
            interruptionLevel: "timeSensitive",
          }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: triggerSeconds,
        },
      });

      scheduledNotifications.current.set(route._id, notificationId);
    } catch (error) {
      console.error("Error scheduling notification:", error);
    }
  };

  const sendOptimalNowNotification = async (route: RouteWithForecast) => {
    try {
      // Only send once per route session
      const key = `${route._id}_optimal_now`;
      if (scheduledNotifications.current.has(key)) return;

      // Use scheduleNotificationAsync with trigger: null for immediate notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${route.name}: Perfect time to leave!`,
          body: `Conditions are optimal right now for ${route.fromName} to ${route.toName}.`,
          data: { routeId: route._id },
          sound: true,
          ...(Platform.OS === "ios" && {
            interruptionLevel: "timeSensitive",
          }),
        },
        trigger: null, // null trigger = immediate notification
      });

      scheduledNotifications.current.set(key, "sent");
    } catch (error) {
      console.error("Error sending optimal now notification:", error);
    }
  };

  const sendImmediateNotification = async (route: RouteWithForecast) => {
    try {
      // Use scheduleNotificationAsync with trigger: null for immediate notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Heads up: ${route.name}`,
          body: `Best departure time at ${route.optimalTime}. ${getConditionSummary(route)}`,
          data: { routeId: route._id },
          sound: true,
        },
        trigger: null, // null trigger = immediate notification
      });
    } catch (error) {
      console.error("Error sending immediate notification:", error);
    }
  };

  const cancelAllScheduledNotifications = async () => {
    for (const notificationId of scheduledNotifications.current.values()) {
      if (notificationId !== "sent") {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }
    }
    scheduledNotifications.current.clear();
  };

  return {
    scheduledCount: scheduledNotifications.current.size,
  };
}

function getNotificationBody(route: RouteWithForecast): string {
  const conditionSummary = getConditionSummary(route);
  return `Best time to depart for ${route.toName} is ${route.optimalTime}. ${conditionSummary}`;
}

function getConditionSummary(route: RouteWithForecast): string {
  switch (route.classification) {
    case "low":
      return "Conditions look great!";
    case "medium":
      return "Some traffic or weather expected.";
    case "high":
      return "Heavy conditions - plan extra time.";
  }
}
