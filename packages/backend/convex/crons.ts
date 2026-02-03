import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ============================================================================
// DATA FETCHING - Optimized scheduling
// ============================================================================
// Changed from 10 to 15 minutes to reduce API costs by 33%
// The fetcher is also smarter now - it only processes:
// - Default locations (user's primary location)
// - Locations with active routes
// - During off-peak hours (21:00-06:00 UTC), it runs less aggressively
crons.interval(
  "fetch weather and traffic data",
  { minutes: 15 }, // Changed from 10 to 15 min (saves 33% API calls)
  internal.scheduled.dataFetcher.fetchAllData
);

// ============================================================================
// GAMIFICATION - Weekly maintenance
// ============================================================================
// Applies point decay for inactive users, downgrades levels, recalculates percentiles
crons.weekly(
  "weekly gamification decay",
  { dayOfWeek: "sunday", hourUTC: 0, minuteUTC: 0 },
  internal.gamification.weeklyDecay
);

export default crons;
