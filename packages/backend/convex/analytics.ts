import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Record when a user views a departure recommendation
export const recordDepartureView = mutation({
  args: {
    routeId: v.id("routes"),
    recommendedDepartureTime: v.string(),
    riskScoreAtDeparture: v.number(),
    estimatedTimeSaved: v.number(),
    followedRecommendation: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    // Calculate week ID (ISO week)
    const now = new Date();
    const weekId = getWeekId(now);

    await ctx.db.insert("departureAnalytics", {
      userId: user.clerkId,
      routeId: args.routeId,
      viewedAt: Date.now(),
      recommendedDepartureTime: args.recommendedDepartureTime,
      followedRecommendation: args.followedRecommendation,
      estimatedTimeSaved: args.estimatedTimeSaved,
      riskScoreAtDeparture: args.riskScoreAtDeparture,
      weekId,
    });
  },
});

// Get weekly summary for a user
export const getWeeklySummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const now = new Date();
    const currentWeekId = getWeekId(now);

    const weekEntries = await ctx.db
      .query("departureAnalytics")
      .withIndex("by_user_week", (q) =>
        q.eq("userId", user.clerkId).eq("weekId", currentWeekId)
      )
      .collect();

    if (weekEntries.length === 0) {
      return {
        totalTimeSaved: 0,
        departuresTracked: 0,
        recommendationsFollowed: 0,
        averageTimeSaved: 0,
        weekId: currentWeekId,
      };
    }

    const totalTimeSaved = weekEntries.reduce(
      (sum, e) => sum + e.estimatedTimeSaved,
      0
    );
    const recommendationsFollowed = weekEntries.filter(
      (e) => e.followedRecommendation
    ).length;

    return {
      totalTimeSaved: Math.round(totalTimeSaved),
      departuresTracked: weekEntries.length,
      recommendationsFollowed,
      averageTimeSaved: Math.round(totalTimeSaved / weekEntries.length),
      weekId: currentWeekId,
    };
  },
});

// Get all-time summary for a user
export const getAllTimeSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const allEntries = await ctx.db
      .query("departureAnalytics")
      .withIndex("by_user", (q) => q.eq("userId", user.clerkId))
      .collect();

    if (allEntries.length === 0) {
      return {
        totalTimeSaved: 0,
        departuresTracked: 0,
        recommendationsFollowed: 0,
        averageTimeSaved: 0,
      };
    }

    const totalTimeSaved = allEntries.reduce(
      (sum, e) => sum + e.estimatedTimeSaved,
      0
    );
    const recommendationsFollowed = allEntries.filter(
      (e) => e.followedRecommendation
    ).length;

    return {
      totalTimeSaved: Math.round(totalTimeSaved),
      departuresTracked: allEntries.length,
      recommendationsFollowed,
      averageTimeSaved: Math.round(totalTimeSaved / allEntries.length),
    };
  },
});

// Helper: Get ISO week ID from date
function getWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
