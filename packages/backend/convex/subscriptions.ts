import { v, ConvexError } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Subscription status types
const subscriptionStatusValidator = v.union(
  v.literal("active"),
  v.literal("cancelled"),
  v.literal("expired"),
  v.literal("grace_period"),
  v.literal("paused")
);

// Subscription status response
const subscriptionStatusDoc = v.object({
  tier: v.union(v.literal("free"), v.literal("pro")),
  subscriptionId: v.union(v.string(), v.null()),
  subscriptionStatus: v.union(subscriptionStatusValidator, v.null()),
  subscriptionExpiresAt: v.union(v.number(), v.null()),
  isActive: v.boolean(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the current authenticated user from the database
 */
export async function getCurrentUserInternal(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  return user;
}

/**
 * Get a user by their Clerk ID
 */
export async function getUserByClerkId(
  ctx: QueryCtx | MutationCtx,
  clerkId: string
): Promise<Doc<"users"> | null> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .unique();

  return user;
}

/**
 * Check if a user has an active Pro subscription
 */
export function hasActiveProSubscription(user: Doc<"users">): boolean {
  if (user.tier !== "pro") {
    return false;
  }

  // If no subscription status, fall back to tier check only
  if (!user.subscriptionStatus) {
    return user.tier === "pro";
  }

  // Active statuses that grant Pro access
  const activeStatuses = ["active", "grace_period"];
  return activeStatuses.includes(user.subscriptionStatus);
}

/**
 * Require the user to have a Pro subscription
 * Throws ConvexError if not authenticated or not Pro
 */
export async function requireProTier(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await getCurrentUserInternal(ctx);

  if (!user) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  if (!hasActiveProSubscription(user)) {
    throw new ConvexError({
      code: "SUBSCRIPTION_REQUIRED",
      message: "Pro subscription required to access this feature",
    });
  }

  return user;
}

/**
 * Require the user to be authenticated (any tier)
 * Throws ConvexError if not authenticated
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await getCurrentUserInternal(ctx);

  if (!user) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  return user;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get the current user's subscription status
 */
export const getSubscriptionStatus = query({
  args: {},
  returns: v.union(subscriptionStatusDoc, v.null()),
  handler: async (ctx) => {
    const user = await getCurrentUserInternal(ctx);

    if (!user) {
      return null;
    }

    return {
      tier: user.tier,
      subscriptionId: user.subscriptionId ?? null,
      subscriptionStatus: user.subscriptionStatus ?? null,
      subscriptionExpiresAt: user.subscriptionExpiresAt ?? null,
      isActive: hasActiveProSubscription(user),
    };
  },
});

/**
 * Check if current user has Pro access (convenience query)
 */
export const hasProAccess = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const user = await getCurrentUserInternal(ctx);
    if (!user) {
      return false;
    }
    return hasActiveProSubscription(user);
  },
});

// ============================================================================
// Mutations (Called from client after RevenueCat purchase)
// ============================================================================

/**
 * Update user tier from client (after RevenueCat purchase verification)
 * This is called from the mobile app after a successful purchase
 */
export const syncSubscriptionFromClient = mutation({
  args: {
    tier: v.union(v.literal("free"), v.literal("pro")),
    subscriptionId: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    await ctx.db.patch(user._id, {
      tier: args.tier,
      subscriptionId: args.subscriptionId,
      subscriptionExpiresAt: args.expiresAt,
      subscriptionStatus: args.tier === "pro" ? "active" : "expired",
    });

    return null;
  },
});

// ============================================================================
// Internal Mutations (Called from webhook handler)
// ============================================================================

/**
 * Update user tier from webhook (internal - not exposed to clients)
 * This is called by the HTTP webhook handler
 */
export const updateUserTierFromWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    tier: v.union(v.literal("free"), v.literal("pro")),
    subscriptionId: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    status: v.optional(subscriptionStatusValidator),
  },
  handler: async (ctx, args) => {
    const user = await getUserByClerkId(ctx, args.clerkId);

    if (!user) {
      // User doesn't exist yet - this can happen if webhook arrives before
      // user is created in our database. Log and return gracefully.
      console.warn(
        `[Subscription Webhook] User not found for clerkId: ${args.clerkId}`
      );
      return { success: false, reason: "user_not_found" };
    }

    await ctx.db.patch(user._id, {
      tier: args.tier,
      subscriptionId: args.subscriptionId,
      subscriptionExpiresAt: args.expiresAt,
      subscriptionStatus: args.status,
    });

    console.log(
      `[Subscription Webhook] Updated user ${args.clerkId} to tier: ${args.tier}, status: ${args.status}`
    );

    return { success: true };
  },
});

/**
 * Handle subscription renewal
 */
export const handleSubscriptionRenewal = internalMutation({
  args: {
    clerkId: v.string(),
    subscriptionId: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getUserByClerkId(ctx, args.clerkId);

    if (!user) {
      console.warn(
        `[Subscription Renewal] User not found for clerkId: ${args.clerkId}`
      );
      return { success: false, reason: "user_not_found" };
    }

    await ctx.db.patch(user._id, {
      tier: "pro",
      subscriptionId: args.subscriptionId,
      subscriptionExpiresAt: args.expiresAt,
      subscriptionStatus: "active",
    });

    console.log(`[Subscription Renewal] Renewed subscription for ${args.clerkId}`);

    return { success: true };
  },
});

/**
 * Handle subscription cancellation (user cancelled but still has access until period ends)
 */
export const handleSubscriptionCancellation = internalMutation({
  args: {
    clerkId: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getUserByClerkId(ctx, args.clerkId);

    if (!user) {
      console.warn(
        `[Subscription Cancellation] User not found for clerkId: ${args.clerkId}`
      );
      return { success: false, reason: "user_not_found" };
    }

    // User cancelled but still has Pro access until expiresAt
    await ctx.db.patch(user._id, {
      subscriptionStatus: "cancelled",
      subscriptionExpiresAt: args.expiresAt,
      // Keep tier as "pro" until expiration - they paid for this period
    });

    console.log(
      `[Subscription Cancellation] User ${args.clerkId} cancelled, access until ${new Date(args.expiresAt).toISOString()}`
    );

    return { success: true };
  },
});

/**
 * Handle subscription expiration (access should be revoked)
 */
export const handleSubscriptionExpiration = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserByClerkId(ctx, args.clerkId);

    if (!user) {
      console.warn(
        `[Subscription Expiration] User not found for clerkId: ${args.clerkId}`
      );
      return { success: false, reason: "user_not_found" };
    }

    await ctx.db.patch(user._id, {
      tier: "free",
      subscriptionStatus: "expired",
    });

    console.log(`[Subscription Expiration] User ${args.clerkId} downgraded to free`);

    return { success: true };
  },
});

/**
 * Handle billing issue / grace period
 */
export const handleBillingIssue = internalMutation({
  args: {
    clerkId: v.string(),
    gracePeriodExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserByClerkId(ctx, args.clerkId);

    if (!user) {
      console.warn(
        `[Billing Issue] User not found for clerkId: ${args.clerkId}`
      );
      return { success: false, reason: "user_not_found" };
    }

    await ctx.db.patch(user._id, {
      subscriptionStatus: "grace_period",
      subscriptionExpiresAt: args.gracePeriodExpiresAt,
      // Keep tier as "pro" during grace period
    });

    console.log(
      `[Billing Issue] User ${args.clerkId} in grace period until ${args.gracePeriodExpiresAt ? new Date(args.gracePeriodExpiresAt).toISOString() : "unknown"}`
    );

    return { success: true };
  },
});
