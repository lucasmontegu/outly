import { internalQuery } from "../_generated/server";

// Get routes that need departure alerts right now
export const getRoutesNeedingAlerts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const nowMs = now.getTime();
    const currentDay = now.getDay(); // 0=Sunday
    // Convert to our format: 0=Monday
    const dayIndex = currentDay === 0 ? 6 : currentDay - 1;

    // Current time in HH:MM format
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHours * 60 + currentMinutes;

    const results: Array<{
      routeId: string | null;
      routeName: string;
      pushToken: string;
      message: string;
      userId: string; // Convex doc ID for clearing one-time alerts
      isOneTime: boolean;
    }> = [];

    // ========================================================================
    // 1. Recurring route alerts (existing behavior)
    // ========================================================================
    const allRoutes = await ctx.db.query("routes").collect();

    for (const route of allRoutes) {
      if (!route.isActive) continue;
      if (!route.monitorDays[dayIndex]) continue;

      const alertTimeMinutes = parseTimeToMinutes(route.alertTime);
      if (alertTimeMinutes === null) continue;

      const diff = alertTimeMinutes - currentTimeMinutes;
      if (diff < 0 || diff > 5) continue;

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", route.userId))
        .unique();

      if (!user?.expoPushToken) continue;

      const score = route.cachedScore ?? 50;
      const classification = route.cachedClassification ?? "medium";

      let message: string;
      if (classification === "low") {
        message = `Great conditions for ${route.fromName} → ${route.toName}. Leave now!`;
      } else if (classification === "medium") {
        message = `Moderate conditions for ${route.fromName} → ${route.toName}. Score: ${score}`;
      } else {
        message = `Challenging conditions for ${route.fromName} → ${route.toName}. Plan extra time. Score: ${score}`;
      }

      results.push({
        routeId: route._id,
        routeName: route.name,
        pushToken: user.expoPushToken,
        message,
        userId: user._id,
        isOneTime: false,
      });
    }

    // ========================================================================
    // 2. One-time alerts from smart-departure screen
    // ========================================================================
    const usersWithAlerts = await ctx.db.query("users").collect();

    for (const user of usersWithAlerts) {
      if (!user.pendingDepartureAlert) continue;
      if (!user.expoPushToken) continue;

      const alert = user.pendingDepartureAlert;

      // Check if alert time has arrived (within 5-min window)
      // alertAt is a Unix timestamp in ms
      const diffMs = alert.alertAt - nowMs;
      if (diffMs < -60_000 || diffMs > 5 * 60_000) continue;

      results.push({
        routeId: null,
        routeName: "Smart Departure",
        pushToken: user.expoPushToken,
        message: alert.message,
        userId: user._id,
        isOneTime: true,
      });
    }

    return results;
  },
});

// Parse time string to minutes since midnight
function parseTimeToMinutes(timeStr: string): number | null {
  // Handle "7:30 AM" format
  const amPmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = parseInt(amPmMatch[2], 10);
    const isPM = amPmMatch[3].toUpperCase() === "PM";

    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  // Handle "07:30" format
  const militaryMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (militaryMatch) {
    const hours = parseInt(militaryMatch[1], 10);
    const minutes = parseInt(militaryMatch[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}
