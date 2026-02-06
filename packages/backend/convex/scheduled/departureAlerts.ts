"use node";

import { v } from "convex/values";
import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

// Clear a one-time departure alert after it's been sent
export const clearPendingAlert = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      pendingDepartureAlert: undefined,
    });
  },
});

// Check departure alerts every 5 minutes
export const checkDepartureAlerts = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all routes and one-time alerts that need notifications
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
          title: data.isOneTime
            ? "Time to leave!"
            : `Time to leave: ${data.routeName}`,
          body: data.message,
          data: {
            routeId: data.routeId ?? "",
            type: "departure_alert",
          },
        });
        sent++;

        // Clear one-time alerts after sending
        if (data.isOneTime) {
          await ctx.runMutation(
            internal.scheduled.departureAlerts.clearPendingAlert,
            { userId: data.userId as any }
          );
        }
      } catch (error) {
        console.error(`Failed to send notification for ${data.routeName}:`, error);
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
