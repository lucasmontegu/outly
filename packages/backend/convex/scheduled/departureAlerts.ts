"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

// Check departure alerts every 5 minutes
export const checkDepartureAlerts = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all routes that need alerts checked
    const alertData = await ctx.runQuery(
      internal.scheduled.departureAlertQueries.getRoutesNeedingAlerts
    );

    if (alertData.length === 0) return { sent: 0 };

    let sent = 0;

    for (const data of alertData) {
      if (!data.pushToken) continue;

      try {
        await sendPushNotification({
          to: data.pushToken,
          title: `Time to leave: ${data.routeName}`,
          body: data.message,
          data: { routeId: data.routeId, type: "departure_alert" },
        });
        sent++;
      } catch (error) {
        console.error(`Failed to send notification for route ${data.routeId}:`, error);
      }
    }

    return { sent };
  },
});

// Send push notification via Expo Push API
async function sendPushNotification(notification: {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: notification.to,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sound: "default",
      priority: "high",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Expo Push API error: ${response.status} ${errorText}`);
  }
}
