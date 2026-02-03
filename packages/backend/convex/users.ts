import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// User document type for return validators
const userDoc = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  clerkId: v.string(),
  email: v.string(),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  tier: v.union(v.literal("free"), v.literal("pro")),
  onboardingCompleted: v.boolean(),
  // Subscription fields (RevenueCat)
  subscriptionId: v.optional(v.string()),
  subscriptionExpiresAt: v.optional(v.number()),
  subscriptionStatus: v.optional(
    v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired"),
      v.literal("grace_period"),
      v.literal("paused")
    )
  ),
  preferences: v.optional(
    v.object({
      primaryConcern: v.union(
        v.literal("weather"),
        v.literal("traffic"),
        v.literal("both")
      ),
      commuteTime: v.optional(v.string()),
      alertAdvanceMinutes: v.optional(v.number()),
    })
  ),
});

// Get current authenticated user - creates user if doesn't exist
export const getCurrentUser = query({
  args: {},
  returns: v.union(userDoc, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Try to find existing user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      return existingUser;
    }

    // User doesn't exist yet - return null (will be created on first mutation)
    return null;
  },
});

// Ensure user exists in database (call after sign in/up)
export const ensureUser = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      // Update user info from Clerk if changed
      await ctx.db.patch(existingUser._id, {
        email: identity.email ?? existingUser.email,
        firstName: identity.givenName ?? existingUser.firstName,
        lastName: identity.familyName ?? existingUser.lastName,
        imageUrl: identity.pictureUrl ?? existingUser.imageUrl,
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      firstName: identity.givenName,
      lastName: identity.familyName,
      imageUrl: identity.pictureUrl,
      tier: "free",
      onboardingCompleted: false,
    });

    return userId;
  },
});

// Update user tier (for subscription handling)
export const updateTier = mutation({
  args: { tier: v.union(v.literal("free"), v.literal("pro")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { tier: args.tier });
    return null;
  },
});

// Save user preferences
export const savePreferences = mutation({
  args: {
    primaryConcern: v.union(
      v.literal("weather"),
      v.literal("traffic"),
      v.literal("both")
    ),
    commuteTime: v.optional(v.string()),
    alertAdvanceMinutes: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      preferences: {
        primaryConcern: args.primaryConcern,
        commuteTime: args.commuteTime,
        alertAdvanceMinutes: args.alertAdvanceMinutes,
      },
    });
    return null;
  },
});

// Mark onboarding as completed
export const completeOnboarding = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { onboardingCompleted: true });
    return null;
  },
});
