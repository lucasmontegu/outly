import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const listForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("confirmations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

export const getMyVote = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const votes = await ctx.db
      .query("confirmations")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", identity.subject).eq("eventId", args.eventId)
      )
      .collect();

    return votes[0] ?? null;
  },
});

export const vote = mutation({
  args: {
    eventId: v.id("events"),
    vote: v.union(
      v.literal("still_active"),
      v.literal("cleared"),
      v.literal("not_exists")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Check if user already voted
    const existingVotes = await ctx.db
      .query("confirmations")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", identity.subject).eq("eventId", args.eventId)
      )
      .collect();

    if (existingVotes.length > 0) {
      // Update existing vote
      const existing = existingVotes[0];
      const oldVote = existing.vote;

      // Reverse old vote impact
      let confidenceChange = 0;
      if (oldVote === "still_active") confidenceChange -= 10;
      else if (oldVote === "cleared") confidenceChange += 20;
      else if (oldVote === "not_exists") confidenceChange += 30;

      // Apply new vote impact
      if (args.vote === "still_active") confidenceChange += 10;
      else if (args.vote === "cleared") confidenceChange -= 20;
      else if (args.vote === "not_exists") confidenceChange -= 30;

      await ctx.db.patch(existing._id, { vote: args.vote });

      const newConfidence = Math.max(0, Math.min(100, event.confidenceScore + confidenceChange));
      await ctx.db.patch(args.eventId, { confidenceScore: newConfidence });

      return existing._id;
    }

    // Check if this is the first vote on this event (for gamification)
    const existingEventVotes = await ctx.db
      .query("confirmations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    const isFirstVote = existingEventVotes.length === 0;

    // Create new vote
    const confirmationId = await ctx.db.insert("confirmations", {
      eventId: args.eventId,
      userId: identity.subject,
      vote: args.vote,
    });

    // Track gamification stats
    await recordGamificationVote(ctx, identity.subject, event.type, isFirstVote);

    // Adjust confidence based on vote
    let confidenceChange = 0;
    if (args.vote === "still_active") confidenceChange = 10;
    else if (args.vote === "cleared") confidenceChange = -20;
    else if (args.vote === "not_exists") confidenceChange = -30;

    const newConfidence = Math.max(0, Math.min(100, event.confidenceScore + confidenceChange));
    await ctx.db.patch(args.eventId, { confidenceScore: newConfidence });

    // Extend or reduce TTL based on vote
    if (args.vote === "still_active") {
      // Extend TTL by 30 minutes
      await ctx.db.patch(args.eventId, { ttl: event.ttl + 30 * 60 * 1000 });
    } else if (args.vote === "cleared" || args.vote === "not_exists") {
      // Reduce TTL to 15 minutes if many negative votes
      const allVotes = await ctx.db
        .query("confirmations")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      const negativeVotes = allVotes.filter(
        (v) => v.vote === "cleared" || v.vote === "not_exists"
      ).length;

      if (negativeVotes >= 3) {
        await ctx.db.patch(args.eventId, { ttl: Date.now() + 15 * 60 * 1000 });
      }
    }

    // Check if we should process consensus (5+ votes)
    const updatedVotes = await ctx.db
      .query("confirmations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    if (updatedVotes.length >= 5) {
      // Process consensus for gamification accuracy tracking
      await processConsensusForGamification(ctx, args.eventId, updatedVotes);
    }

    return confirmationId;
  },
});

// Helper to record gamification vote
async function recordGamificationVote(
  ctx: any,
  userId: string,
  eventType: "weather" | "traffic",
  isFirstVote: boolean
): Promise<void> {
  // Get or create user stats
  let stats = await ctx.db
    .query("userStats")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!stats) {
    await ctx.db.insert("userStats", {
      userId,
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
    stats = await ctx.db
      .query("userStats")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();
  }

  if (!stats) return;

  // Calculate points
  let pointsEarned = 5; // Base points
  if (isFirstVote) pointsEarned += 10; // First responder bonus

  // Update streak
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  let newStreak = stats.currentStreak;

  if (stats.lastVoteDate === yesterday) {
    newStreak += 1;
  } else if (stats.lastVoteDate !== today) {
    newStreak = 1;
  }

  // Level calculation helper
  const calculateLevel = (points: number): number => {
    const levels = [
      { level: 7, points: 50000 },
      { level: 6, points: 25000 },
      { level: 5, points: 10000 },
      { level: 4, points: 4000 },
      { level: 3, points: 1500 },
      { level: 2, points: 500 },
      { level: 1, points: 0 },
    ];
    for (const l of levels) {
      if (points >= l.points) return l.level;
    }
    return 1;
  };

  const newTotalPoints = stats.totalPoints + pointsEarned;

  await ctx.db.patch(stats._id, {
    totalPoints: newTotalPoints,
    level: calculateLevel(newTotalPoints),
    totalVotes: stats.totalVotes + 1,
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, stats.longestStreak),
    lastVoteDate: today,
    votesThisWeek: stats.votesThisWeek + 1,
    inactiveWeeks: 0,
    weatherVotes: eventType === "weather" ? stats.weatherVotes + 1 : stats.weatherVotes,
    trafficVotes: eventType === "traffic" ? stats.trafficVotes + 1 : stats.trafficVotes,
    firstResponderCount: isFirstVote ? stats.firstResponderCount + 1 : stats.firstResponderCount,
  });

  // Check and award badges
  await checkAndAwardBadges(ctx, userId, stats.totalVotes + 1, newStreak,
    eventType === "weather" ? stats.weatherVotes + 1 : stats.weatherVotes,
    eventType === "traffic" ? stats.trafficVotes + 1 : stats.trafficVotes,
    isFirstVote ? stats.firstResponderCount + 1 : stats.firstResponderCount);
}

// Helper to check and award badges
async function checkAndAwardBadges(
  ctx: any,
  userId: string,
  totalVotes: number,
  streak: number,
  weatherVotes: number,
  trafficVotes: number,
  firstResponderCount: number
): Promise<void> {
  const badges = [
    { id: "first_steps", check: () => totalVotes >= 5 },
    { id: "dedicated", check: () => totalVotes >= 50 },
    { id: "veteran", check: () => totalVotes >= 250 },
    { id: "elite_validator", check: () => totalVotes >= 1000 },
    { id: "weekly_warrior", check: () => streak >= 7 },
    { id: "monthly_guardian", check: () => streak >= 30 },
    { id: "quarterly_legend", check: () => streak >= 90 },
    { id: "storm_chaser", check: () => weatherVotes >= 50 },
    { id: "traffic_master", check: () => trafficVotes >= 50 },
    { id: "first_responder", check: () => firstResponderCount >= 25 },
  ];

  const badgePoints: Record<string, number> = {
    first_steps: 10,
    dedicated: 75,
    veteran: 300,
    elite_validator: 1000,
    weekly_warrior: 100,
    monthly_guardian: 500,
    quarterly_legend: 2000,
    storm_chaser: 150,
    traffic_master: 150,
    first_responder: 300,
  };

  for (const badge of badges) {
    if (badge.check()) {
      const existing = await ctx.db
        .query("userBadges")
        .withIndex("by_user_badge", (q: any) =>
          q.eq("userId", userId).eq("badgeId", badge.id)
        )
        .first();

      if (!existing) {
        await ctx.db.insert("userBadges", {
          userId,
          badgeId: badge.id,
          earnedAt: Date.now(),
          isActive: true,
        });

        // Award badge points
        const stats = await ctx.db
          .query("userStats")
          .withIndex("by_user", (q: any) => q.eq("userId", userId))
          .first();

        if (stats) {
          const bonus = badgePoints[badge.id] || 0;
          await ctx.db.patch(stats._id, {
            totalPoints: stats.totalPoints + bonus,
          });
        }
      }
    }
  }
}

// Helper to process consensus and award accuracy
async function processConsensusForGamification(
  ctx: any,
  eventId: any,
  votes: any[]
): Promise<void> {
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
      .withIndex("by_user", (q: any) => q.eq("userId", vote.userId))
      .first();

    if (stats) {
      const newCorrectVotes = wasCorrect
        ? stats.correctVotes + 1
        : stats.correctVotes;
      const newAccuracy =
        stats.totalVotes > 0
          ? Math.round((newCorrectVotes / stats.totalVotes) * 100)
          : 0;

      const pointsBonus = wasCorrect ? 15 : 0;

      await ctx.db.patch(stats._id, {
        correctVotes: newCorrectVotes,
        accuracyPercent: newAccuracy,
        totalPoints: stats.totalPoints + pointsBonus,
      });

      // Check accuracy badges
      if (newAccuracy >= 85 && stats.totalVotes >= 50) {
        await awardBadgeIfNotExists(ctx, vote.userId, "sharp_eye", 200);
      }
      if (newAccuracy >= 95 && stats.totalVotes >= 100) {
        await awardBadgeIfNotExists(ctx, vote.userId, "laser_focus", 500);
      }
      if (newAccuracy >= 98 && stats.totalVotes >= 200) {
        await awardBadgeIfNotExists(ctx, vote.userId, "untouchable", 1500);
      }
    }
  }
}

// Helper to award badge if user doesn't have it
async function awardBadgeIfNotExists(
  ctx: any,
  userId: string,
  badgeId: string,
  points: number
): Promise<void> {
  const existing = await ctx.db
    .query("userBadges")
    .withIndex("by_user_badge", (q: any) =>
      q.eq("userId", userId).eq("badgeId", badgeId)
    )
    .first();

  if (!existing) {
    await ctx.db.insert("userBadges", {
      userId,
      badgeId,
      earnedAt: Date.now(),
      isActive: true,
    });

    const stats = await ctx.db
      .query("userStats")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();

    if (stats) {
      await ctx.db.patch(stats._id, {
        totalPoints: stats.totalPoints + points,
      });
    }
  }
}
