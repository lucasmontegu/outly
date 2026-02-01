import { v } from "convex/values";
import { GenericDatabaseWriter } from "convex/server";
import { query, mutation, internalMutation } from "./_generated/server";
import { DataModel, Id } from "./_generated/dataModel";

// Level thresholds and requirements
const LEVELS = [
  { level: 1, title: "Newcomer", pointsRequired: 0, weeklyMinVotes: 0 },
  { level: 2, title: "Spotter", pointsRequired: 500, weeklyMinVotes: 3 },
  { level: 3, title: "Route Guardian", pointsRequired: 1500, weeklyMinVotes: 5 },
  { level: 4, title: "Road Watcher", pointsRequired: 4000, weeklyMinVotes: 8 },
  { level: 5, title: "Traffic Sentinel", pointsRequired: 10000, weeklyMinVotes: 12 },
  { level: 6, title: "Storm Tracker", pointsRequired: 25000, weeklyMinVotes: 15 },
  { level: 7, title: "Community Legend", pointsRequired: 50000, weeklyMinVotes: 20 },
];

// Badge definitions
const BADGES = {
  // Milestone badges
  first_steps: {
    id: "first_steps",
    name: "First Steps",
    description: "Cast your first 5 votes",
    icon: "footprints",
    category: "milestone",
    points: 10,
    canBeLost: false,
  },
  dedicated: {
    id: "dedicated",
    name: "Dedicated",
    description: "Validate 50 hazards",
    icon: "star",
    category: "milestone",
    points: 75,
    canBeLost: false,
  },
  veteran: {
    id: "veteran",
    name: "Veteran",
    description: "Validate 250 hazards",
    icon: "medal",
    category: "milestone",
    points: 300,
    canBeLost: false,
  },
  elite_validator: {
    id: "elite_validator",
    name: "Elite Validator",
    description: "Validate 1,000 hazards",
    icon: "trophy",
    category: "milestone",
    points: 1000,
    canBeLost: false,
  },
  // Accuracy badges
  sharp_eye: {
    id: "sharp_eye",
    name: "Sharp Eye",
    description: "Maintain 85%+ accuracy with 50+ votes",
    icon: "target",
    category: "accuracy",
    points: 200,
    canBeLost: false,
  },
  laser_focus: {
    id: "laser_focus",
    name: "Laser Focus",
    description: "Maintain 95%+ accuracy with 100+ votes",
    icon: "crosshair",
    category: "accuracy",
    points: 500,
    canBeLost: false,
  },
  untouchable: {
    id: "untouchable",
    name: "Untouchable",
    description: "Maintain 98%+ accuracy with 200+ votes",
    icon: "shield",
    category: "accuracy",
    points: 1500,
    canBeLost: false,
  },
  // Streak badges (can be lost)
  weekly_warrior: {
    id: "weekly_warrior",
    name: "Weekly Warrior",
    description: "Vote 7 consecutive days",
    icon: "flame",
    category: "streak",
    points: 100,
    canBeLost: true,
  },
  monthly_guardian: {
    id: "monthly_guardian",
    name: "Monthly Guardian",
    description: "Vote 30 consecutive days",
    icon: "calendar",
    category: "streak",
    points: 500,
    canBeLost: true,
  },
  quarterly_legend: {
    id: "quarterly_legend",
    name: "Quarterly Legend",
    description: "Vote 90 consecutive days",
    icon: "crown",
    category: "streak",
    points: 2000,
    canBeLost: true,
  },
  // Special badges
  storm_chaser: {
    id: "storm_chaser",
    name: "Storm Chaser",
    description: "Validate 50 weather events",
    icon: "cloud-lightning",
    category: "special",
    points: 150,
    canBeLost: false,
  },
  traffic_master: {
    id: "traffic_master",
    name: "Traffic Master",
    description: "Validate 50 traffic events",
    icon: "car",
    category: "special",
    points: 150,
    canBeLost: false,
  },
  first_responder: {
    id: "first_responder",
    name: "First Responder",
    description: "Be first to validate 25 events",
    icon: "zap",
    category: "special",
    points: 300,
    canBeLost: false,
  },
  comeback_kid: {
    id: "comeback_kid",
    name: "Comeback Kid",
    description: "Recover from a level downgrade",
    icon: "arrow-up",
    category: "special",
    points: 100,
    canBeLost: false,
  },
};

// Helper to calculate level from points
function calculateLevel(points: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].pointsRequired) {
      return LEVELS[i].level;
    }
  }
  return 1;
}

// Helper to get today's date string
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

// Helper to get yesterday's date string
function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

// ============ QUERIES ============

export const getMyStats = query({
  args: {},
  returns: v.union(
    v.object({
      totalPoints: v.number(),
      level: v.number(),
      levelTitle: v.string(),
      totalVotes: v.number(),
      correctVotes: v.number(),
      accuracyPercent: v.number(),
      currentStreak: v.number(),
      longestStreak: v.number(),
      votesThisWeek: v.number(),
      weatherVotes: v.number(),
      trafficVotes: v.number(),
      firstResponderCount: v.number(),
      percentileRank: v.number(),
      pointsToNextLevel: v.number(),
      nextLevelPoints: v.number(),
      weeklyMinVotes: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const stats = await ctx.db
      .query("userStats")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (!stats) return null;

    const currentLevelData = LEVELS.find((l) => l.level === stats.level) || LEVELS[0];
    const nextLevelData = LEVELS.find((l) => l.level === stats.level + 1);

    return {
      totalPoints: stats.totalPoints,
      level: stats.level,
      levelTitle: currentLevelData.title,
      totalVotes: stats.totalVotes,
      correctVotes: stats.correctVotes,
      accuracyPercent: stats.accuracyPercent,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      votesThisWeek: stats.votesThisWeek,
      weatherVotes: stats.weatherVotes,
      trafficVotes: stats.trafficVotes,
      firstResponderCount: stats.firstResponderCount,
      percentileRank: stats.percentileRank,
      pointsToNextLevel: nextLevelData
        ? nextLevelData.pointsRequired - stats.totalPoints
        : 0,
      nextLevelPoints: nextLevelData?.pointsRequired || stats.totalPoints,
      weeklyMinVotes: currentLevelData.weeklyMinVotes,
    };
  },
});

export const getMyBadges = query({
  args: {},
  returns: v.array(
    v.object({
      badgeId: v.string(),
      name: v.string(),
      description: v.string(),
      icon: v.string(),
      category: v.string(),
      earnedAt: v.number(),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return userBadges.map((ub) => {
      const badgeDef = BADGES[ub.badgeId as keyof typeof BADGES];
      return {
        badgeId: ub.badgeId,
        name: badgeDef?.name || ub.badgeId,
        description: badgeDef?.description || "",
        icon: badgeDef?.icon || "badge",
        category: badgeDef?.category || "milestone",
        earnedAt: ub.earnedAt,
        isActive: ub.isActive,
      };
    });
  },
});

export const getAllBadges = query({
  args: {},
  returns: v.array(
    v.object({
      badgeId: v.string(),
      name: v.string(),
      description: v.string(),
      icon: v.string(),
      category: v.string(),
      points: v.number(),
      earned: v.boolean(),
      earnedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    let earnedBadges: Record<string, number> = {};

    if (identity) {
      const userBadges = await ctx.db
        .query("userBadges")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .collect();

      earnedBadges = Object.fromEntries(
        userBadges.map((ub) => [ub.badgeId, ub.earnedAt])
      );
    }

    return Object.values(BADGES).map((badge) => ({
      badgeId: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      points: badge.points,
      earned: badge.id in earnedBadges,
      earnedAt: earnedBadges[badge.id],
    }));
  },
});

export const getLevelInfo = query({
  args: {},
  returns: v.array(
    v.object({
      level: v.number(),
      title: v.string(),
      pointsRequired: v.number(),
      weeklyMinVotes: v.number(),
    })
  ),
  handler: async () => {
    return LEVELS;
  },
});

// ============ MUTATIONS ============

export const initializeStats = mutation({
  args: {},
  returns: v.id("userStats"),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if stats already exist
    const existing = await ctx.db
      .query("userStats")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) return existing._id;

    // Create initial stats
    return await ctx.db.insert("userStats", {
      userId: identity.subject,
      totalPoints: 0,
      level: 1,
      totalVotes: 0,
      correctVotes: 0,
      accuracyPercent: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastVoteDate: "",
      votesThisWeek: 0,
      inactiveWeeks: 0,
      weatherVotes: 0,
      trafficVotes: 0,
      firstResponderCount: 0,
      percentileRank: 100,
    });
  },
});

export const recordVote = mutation({
  args: {
    eventId: v.id("events"),
    eventType: v.union(v.literal("weather"), v.literal("traffic")),
    isFirstVote: v.boolean(),
  },
  returns: v.object({
    pointsEarned: v.number(),
    newBadges: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get or create user stats
    let stats = await ctx.db
      .query("userStats")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (!stats) {
      const statsId = await ctx.db.insert("userStats", {
        userId: identity.subject,
        totalPoints: 0,
        level: 1,
        totalVotes: 0,
        correctVotes: 0,
        accuracyPercent: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastVoteDate: "",
        votesThisWeek: 0,
        inactiveWeeks: 0,
        weatherVotes: 0,
        trafficVotes: 0,
        firstResponderCount: 0,
        percentileRank: 100,
      });
      stats = await ctx.db.get(statsId);
      if (!stats) throw new Error("Failed to create stats");
    }

    let pointsEarned = 5; // Base points
    const newBadges: string[] = [];

    // First responder bonus
    if (args.isFirstVote) {
      pointsEarned += 10;
    }

    // Update streak
    const today = getTodayString();
    const yesterday = getYesterdayString();
    let newStreak = stats.currentStreak;

    if (stats.lastVoteDate === yesterday) {
      newStreak += 1;
    } else if (stats.lastVoteDate !== today) {
      newStreak = 1;
    }

    const newLongestStreak = Math.max(newStreak, stats.longestStreak);

    // Category tracking
    const newWeatherVotes =
      args.eventType === "weather" ? stats.weatherVotes + 1 : stats.weatherVotes;
    const newTrafficVotes =
      args.eventType === "traffic" ? stats.trafficVotes + 1 : stats.trafficVotes;
    const newFirstResponderCount = args.isFirstVote
      ? stats.firstResponderCount + 1
      : stats.firstResponderCount;

    const newTotalVotes = stats.totalVotes + 1;
    const newTotalPoints = stats.totalPoints + pointsEarned;
    const newLevel = calculateLevel(newTotalPoints);

    // Update stats
    await ctx.db.patch(stats._id, {
      totalPoints: newTotalPoints,
      level: newLevel,
      totalVotes: newTotalVotes,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastVoteDate: today,
      votesThisWeek: stats.votesThisWeek + 1,
      inactiveWeeks: 0, // Reset inactive weeks on activity
      weatherVotes: newWeatherVotes,
      trafficVotes: newTrafficVotes,
      firstResponderCount: newFirstResponderCount,
    });

    // Check for new badges
    const earnedBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    const earnedBadgeIds = new Set(earnedBadges.map((b) => b.badgeId));

    // Milestone badges
    if (newTotalVotes >= 5 && !earnedBadgeIds.has("first_steps")) {
      await awardBadge(ctx, identity.subject, "first_steps");
      newBadges.push("first_steps");
      pointsEarned += BADGES.first_steps.points;
    }
    if (newTotalVotes >= 50 && !earnedBadgeIds.has("dedicated")) {
      await awardBadge(ctx, identity.subject, "dedicated");
      newBadges.push("dedicated");
      pointsEarned += BADGES.dedicated.points;
    }
    if (newTotalVotes >= 250 && !earnedBadgeIds.has("veteran")) {
      await awardBadge(ctx, identity.subject, "veteran");
      newBadges.push("veteran");
      pointsEarned += BADGES.veteran.points;
    }
    if (newTotalVotes >= 1000 && !earnedBadgeIds.has("elite_validator")) {
      await awardBadge(ctx, identity.subject, "elite_validator");
      newBadges.push("elite_validator");
      pointsEarned += BADGES.elite_validator.points;
    }

    // Streak badges
    if (newStreak >= 7 && !earnedBadgeIds.has("weekly_warrior")) {
      await awardBadge(ctx, identity.subject, "weekly_warrior");
      newBadges.push("weekly_warrior");
      pointsEarned += BADGES.weekly_warrior.points;
    }
    if (newStreak >= 30 && !earnedBadgeIds.has("monthly_guardian")) {
      await awardBadge(ctx, identity.subject, "monthly_guardian");
      newBadges.push("monthly_guardian");
      pointsEarned += BADGES.monthly_guardian.points;
    }
    if (newStreak >= 90 && !earnedBadgeIds.has("quarterly_legend")) {
      await awardBadge(ctx, identity.subject, "quarterly_legend");
      newBadges.push("quarterly_legend");
      pointsEarned += BADGES.quarterly_legend.points;
    }

    // Special badges
    if (newWeatherVotes >= 50 && !earnedBadgeIds.has("storm_chaser")) {
      await awardBadge(ctx, identity.subject, "storm_chaser");
      newBadges.push("storm_chaser");
      pointsEarned += BADGES.storm_chaser.points;
    }
    if (newTrafficVotes >= 50 && !earnedBadgeIds.has("traffic_master")) {
      await awardBadge(ctx, identity.subject, "traffic_master");
      newBadges.push("traffic_master");
      pointsEarned += BADGES.traffic_master.points;
    }
    if (newFirstResponderCount >= 25 && !earnedBadgeIds.has("first_responder")) {
      await awardBadge(ctx, identity.subject, "first_responder");
      newBadges.push("first_responder");
      pointsEarned += BADGES.first_responder.points;
    }

    // Update total points with badge bonuses
    if (newBadges.length > 0) {
      const finalStats = await ctx.db.get(stats._id);
      if (finalStats) {
        const badgeBonus = newBadges.reduce((sum, badgeId) => {
          return sum + (BADGES[badgeId as keyof typeof BADGES]?.points || 0);
        }, 0);
        await ctx.db.patch(stats._id, {
          totalPoints: finalStats.totalPoints + badgeBonus,
          level: calculateLevel(finalStats.totalPoints + badgeBonus),
        });
      }
    }

    return { pointsEarned, newBadges };
  },
});

export const recordAccuracyResult = mutation({
  args: {
    userId: v.string(),
    wasCorrect: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query("userStats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!stats) return null;

    const newCorrectVotes = args.wasCorrect
      ? stats.correctVotes + 1
      : stats.correctVotes;
    const newAccuracy =
      stats.totalVotes > 0
        ? Math.round((newCorrectVotes / stats.totalVotes) * 100)
        : 0;

    let pointsBonus = 0;
    if (args.wasCorrect) {
      pointsBonus = 15; // Accuracy bonus
    }

    await ctx.db.patch(stats._id, {
      correctVotes: newCorrectVotes,
      accuracyPercent: newAccuracy,
      totalPoints: stats.totalPoints + pointsBonus,
      level: calculateLevel(stats.totalPoints + pointsBonus),
    });

    // Check accuracy badges
    const earnedBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const earnedBadgeIds = new Set(earnedBadges.map((b) => b.badgeId));

    if (
      newAccuracy >= 85 &&
      stats.totalVotes >= 50 &&
      !earnedBadgeIds.has("sharp_eye")
    ) {
      await awardBadge(ctx, args.userId, "sharp_eye");
    }
    if (
      newAccuracy >= 95 &&
      stats.totalVotes >= 100 &&
      !earnedBadgeIds.has("laser_focus")
    ) {
      await awardBadge(ctx, args.userId, "laser_focus");
    }
    if (
      newAccuracy >= 98 &&
      stats.totalVotes >= 200 &&
      !earnedBadgeIds.has("untouchable")
    ) {
      await awardBadge(ctx, args.userId, "untouchable");
    }

    return null;
  },
});

// Helper to award a badge - takes db directly for internal use
async function internalAwardBadge(
  db: GenericDatabaseWriter<DataModel>,
  userId: string,
  badgeId: string
): Promise<void> {
  // Check if already has badge
  const existing = await db
    .query("userBadges")
    .withIndex("by_user_badge", (q) =>
      q.eq("userId", userId).eq("badgeId", badgeId)
    )
    .first();

  if (existing) {
    // Reactivate if was deactivated
    if (!existing.isActive) {
      await db.patch(existing._id, { isActive: true });
    }
    return;
  }

  await db.insert("userBadges", {
    userId,
    badgeId,
    earnedAt: Date.now(),
    isActive: true,
  });
}

// Helper to award a badge - takes ctx for public mutations
async function awardBadge(
  ctx: { db: GenericDatabaseWriter<DataModel> },
  userId: string,
  badgeId: string
): Promise<void> {
  await internalAwardBadge(ctx.db, userId, badgeId);
}

// ============ INTERNAL MUTATIONS ============

// Internal mutation to record a vote from confirmations.ts
// This avoids code duplication by centralizing gamification logic
export const internalRecordVote = internalMutation({
  args: {
    userId: v.string(),
    eventType: v.union(v.literal("weather"), v.literal("traffic")),
    isFirstVote: v.boolean(),
  },
  returns: v.object({
    pointsEarned: v.number(),
    newBadges: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get or create user stats
    let stats = await ctx.db
      .query("userStats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!stats) {
      const statsId = await ctx.db.insert("userStats", {
        userId: args.userId,
        totalPoints: 0,
        level: 1,
        totalVotes: 0,
        correctVotes: 0,
        accuracyPercent: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastVoteDate: "",
        votesThisWeek: 0,
        inactiveWeeks: 0,
        weatherVotes: 0,
        trafficVotes: 0,
        firstResponderCount: 0,
        percentileRank: 100,
      });
      stats = await ctx.db.get(statsId);
      if (!stats) throw new Error("Failed to create stats");
    }

    let pointsEarned = 5; // Base points
    const newBadges: string[] = [];

    // First responder bonus
    if (args.isFirstVote) {
      pointsEarned += 10;
    }

    // Update streak
    const today = getTodayString();
    const yesterday = getYesterdayString();
    let newStreak = stats.currentStreak;

    if (stats.lastVoteDate === yesterday) {
      newStreak += 1;
    } else if (stats.lastVoteDate !== today) {
      newStreak = 1;
    }

    const newLongestStreak = Math.max(newStreak, stats.longestStreak);

    // Category tracking
    const newWeatherVotes =
      args.eventType === "weather" ? stats.weatherVotes + 1 : stats.weatherVotes;
    const newTrafficVotes =
      args.eventType === "traffic" ? stats.trafficVotes + 1 : stats.trafficVotes;
    const newFirstResponderCount = args.isFirstVote
      ? stats.firstResponderCount + 1
      : stats.firstResponderCount;

    const newTotalVotes = stats.totalVotes + 1;
    const newTotalPoints = stats.totalPoints + pointsEarned;
    const newLevel = calculateLevel(newTotalPoints);

    // Update stats
    await ctx.db.patch(stats._id, {
      totalPoints: newTotalPoints,
      level: newLevel,
      totalVotes: newTotalVotes,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastVoteDate: today,
      votesThisWeek: stats.votesThisWeek + 1,
      inactiveWeeks: 0,
      weatherVotes: newWeatherVotes,
      trafficVotes: newTrafficVotes,
      firstResponderCount: newFirstResponderCount,
    });

    // Check for new badges
    const earnedBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const earnedBadgeIds = new Set(earnedBadges.map((b) => b.badgeId));

    // Milestone badges
    if (newTotalVotes >= 5 && !earnedBadgeIds.has("first_steps")) {
      await internalAwardBadge(ctx.db, args.userId, "first_steps");
      newBadges.push("first_steps");
      pointsEarned += BADGES.first_steps.points;
    }
    if (newTotalVotes >= 50 && !earnedBadgeIds.has("dedicated")) {
      await internalAwardBadge(ctx.db, args.userId, "dedicated");
      newBadges.push("dedicated");
      pointsEarned += BADGES.dedicated.points;
    }
    if (newTotalVotes >= 250 && !earnedBadgeIds.has("veteran")) {
      await internalAwardBadge(ctx.db, args.userId, "veteran");
      newBadges.push("veteran");
      pointsEarned += BADGES.veteran.points;
    }
    if (newTotalVotes >= 1000 && !earnedBadgeIds.has("elite_validator")) {
      await internalAwardBadge(ctx.db, args.userId, "elite_validator");
      newBadges.push("elite_validator");
      pointsEarned += BADGES.elite_validator.points;
    }

    // Streak badges
    if (newStreak >= 7 && !earnedBadgeIds.has("weekly_warrior")) {
      await internalAwardBadge(ctx.db, args.userId, "weekly_warrior");
      newBadges.push("weekly_warrior");
      pointsEarned += BADGES.weekly_warrior.points;
    }
    if (newStreak >= 30 && !earnedBadgeIds.has("monthly_guardian")) {
      await internalAwardBadge(ctx.db, args.userId, "monthly_guardian");
      newBadges.push("monthly_guardian");
      pointsEarned += BADGES.monthly_guardian.points;
    }
    if (newStreak >= 90 && !earnedBadgeIds.has("quarterly_legend")) {
      await internalAwardBadge(ctx.db, args.userId, "quarterly_legend");
      newBadges.push("quarterly_legend");
      pointsEarned += BADGES.quarterly_legend.points;
    }

    // Special badges
    if (newWeatherVotes >= 50 && !earnedBadgeIds.has("storm_chaser")) {
      await internalAwardBadge(ctx.db, args.userId, "storm_chaser");
      newBadges.push("storm_chaser");
      pointsEarned += BADGES.storm_chaser.points;
    }
    if (newTrafficVotes >= 50 && !earnedBadgeIds.has("traffic_master")) {
      await internalAwardBadge(ctx.db, args.userId, "traffic_master");
      newBadges.push("traffic_master");
      pointsEarned += BADGES.traffic_master.points;
    }
    if (newFirstResponderCount >= 25 && !earnedBadgeIds.has("first_responder")) {
      await internalAwardBadge(ctx.db, args.userId, "first_responder");
      newBadges.push("first_responder");
      pointsEarned += BADGES.first_responder.points;
    }

    // Update total points with badge bonuses
    if (newBadges.length > 0) {
      const finalStats = await ctx.db.get(stats._id);
      if (finalStats) {
        const badgeBonus = newBadges.reduce((sum, badgeId) => {
          return sum + (BADGES[badgeId as keyof typeof BADGES]?.points || 0);
        }, 0);
        await ctx.db.patch(stats._id, {
          totalPoints: finalStats.totalPoints + badgeBonus,
          level: calculateLevel(finalStats.totalPoints + badgeBonus),
        });
      }
    }

    return { pointsEarned, newBadges };
  },
});

export const weeklyDecay = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const allStats = await ctx.db.query("userStats").collect();

    for (const stats of allStats) {
      const levelData = LEVELS.find((l) => l.level === stats.level) || LEVELS[0];
      const metMinimum = stats.votesThisWeek >= levelData.weeklyMinVotes;

      let newPoints = stats.totalPoints;
      let newLevel = stats.level;
      let newInactiveWeeks = stats.inactiveWeeks;
      const previousLevel = stats.level;

      if (!metMinimum && stats.level > 1) {
        // Didn't meet minimum - apply decay
        newInactiveWeeks += 1;
        newPoints = Math.floor(newPoints * 0.9); // -10%

        if (newInactiveWeeks >= 2) {
          // Downgrade 1 level
          newLevel = Math.max(1, newLevel - 1);

          // Revoke streak badges
          const streakBadges = await ctx.db
            .query("userBadges")
            .withIndex("by_user", (q) => q.eq("userId", stats.userId))
            .collect();

          for (const badge of streakBadges) {
            const badgeDef = BADGES[badge.badgeId as keyof typeof BADGES];
            if (badgeDef?.canBeLost && badge.isActive) {
              await ctx.db.patch(badge._id, { isActive: false });
            }
          }
        }

        if (newInactiveWeeks >= 4) {
          // Downgrade 2 levels total
          newLevel = Math.max(1, previousLevel - 2);
        }
      } else {
        newInactiveWeeks = 0;
      }

      // Accuracy penalty
      if (stats.accuracyPercent < 70 && stats.totalVotes >= 20) {
        newPoints = Math.floor(newPoints * 0.85); // -15%
      }

      // Recalculate level from points (in case decay dropped us)
      newLevel = Math.min(newLevel, calculateLevel(newPoints));

      await ctx.db.patch(stats._id, {
        totalPoints: newPoints,
        level: newLevel,
        votesThisWeek: 0, // Reset weekly counter
        inactiveWeeks: newInactiveWeeks,
      });

      // Award comeback badge if recovered level
      if (newLevel > previousLevel && stats.inactiveWeeks > 0) {
        await awardBadge(ctx, stats.userId, "comeback_kid");
      }
    }

    // Recalculate percentiles
    const sortedStats = await ctx.db
      .query("userStats")
      .withIndex("by_points")
      .order("desc")
      .collect();

    const totalUsers = sortedStats.length;
    for (let i = 0; i < sortedStats.length; i++) {
      const percentile = Math.ceil(((i + 1) / totalUsers) * 100);
      await ctx.db.patch(sortedStats[i]._id, { percentileRank: percentile });
    }

    return null;
  },
});

export const processConsensus = internalMutation({
  args: {
    eventId: v.id("events"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("confirmations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    if (votes.length < 3) return null; // Need at least 3 votes for consensus

    // Count votes
    const voteCounts: Record<string, number> = {
      still_active: 0,
      cleared: 0,
      not_exists: 0,
    };

    for (const vote of votes) {
      voteCounts[vote.vote]++;
    }

    // Determine majority
    let majorityVote = "still_active";
    let maxCount = 0;
    for (const [vote, count] of Object.entries(voteCounts)) {
      if (count > maxCount) {
        maxCount = count;
        majorityVote = vote;
      }
    }

    // Award accuracy to users who matched majority
    for (const vote of votes) {
      const wasCorrect = vote.vote === majorityVote;

      const stats = await ctx.db
        .query("userStats")
        .withIndex("by_user", (q) => q.eq("userId", vote.userId))
        .first();

      if (stats) {
        const newCorrectVotes = wasCorrect
          ? stats.correctVotes + 1
          : stats.correctVotes;
        const newAccuracy =
          stats.totalVotes > 0
            ? Math.round((newCorrectVotes / stats.totalVotes) * 100)
            : 0;

        let pointsBonus = wasCorrect ? 15 : 0;

        await ctx.db.patch(stats._id, {
          correctVotes: newCorrectVotes,
          accuracyPercent: newAccuracy,
          totalPoints: stats.totalPoints + pointsBonus,
          level: calculateLevel(stats.totalPoints + pointsBonus),
        });
      }
    }

    return null;
  },
});
