import { internalQuery } from "../_generated/server";

// Get routes that need departure alerts right now
export const getRoutesNeedingAlerts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sunday
    // Convert to our format: 0=Monday
    const dayIndex = currentDay === 0 ? 6 : currentDay - 1;

    // Current time in HH:MM format
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHours * 60 + currentMinutes;

    // Get all active routes
    const allRoutes = await ctx.db.query("routes").collect();

    const results: Array<{
      routeId: string;
      routeName: string;
      pushToken: string;
      message: string;
    }> = [];

    for (const route of allRoutes) {
      // Skip inactive routes
      if (!route.isActive) continue;

      // Skip if today is not a monitored day
      if (!route.monitorDays[dayIndex]) continue;

      // Parse alert time (format: "7:30 AM" or "07:30")
      const alertTimeMinutes = parseTimeToMinutes(route.alertTime);
      if (alertTimeMinutes === null) continue;

      // Check if we're within the 5-minute alert window
      // We want to alert ~30 min before the alert time (or based on user preference)
      const diff = alertTimeMinutes - currentTimeMinutes;

      // Alert if we're within 0-5 minutes of the alert time
      if (diff < 0 || diff > 5) continue;

      // Get the user for this route
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", route.userId))
        .unique();

      if (!user?.expoPushToken) continue;

      // Build the message based on cached score
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
