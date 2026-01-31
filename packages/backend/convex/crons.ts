import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every 10 minutes to fetch weather and traffic data
// Groups locations into ~50km grid cells to minimize API calls
crons.interval(
  "fetch weather and traffic data",
  { minutes: 10 },
  internal.scheduled.dataFetcher.fetchAllData
);

export default crons;
