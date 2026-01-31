import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    // Create new vote
    const confirmationId = await ctx.db.insert("confirmations", {
      eventId: args.eventId,
      userId: identity.subject,
      vote: args.vote,
    });

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

    return confirmationId;
  },
});
