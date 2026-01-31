import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("userLocations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    address: v.optional(v.string()),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // If this is default, unset other defaults
    if (args.isDefault) {
      const existing = await ctx.db
        .query("userLocations")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .collect();

      for (const loc of existing) {
        if (loc.isDefault) {
          await ctx.db.patch(loc._id, { isDefault: false });
        }
      }
    }

    return await ctx.db.insert("userLocations", {
      userId: identity.subject,
      name: args.name,
      location: args.location,
      address: args.address,
      isDefault: args.isDefault,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("userLocations"),
    name: v.optional(v.string()),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    address: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    pushToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const location = await ctx.db.get(args.id);
    if (!location || location.userId !== identity.subject) {
      throw new Error("Location not found");
    }

    const { id, ...updates } = args;

    // If setting as default, unset others
    if (updates.isDefault) {
      const existing = await ctx.db
        .query("userLocations")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .collect();

      for (const loc of existing) {
        if (loc._id !== id && loc.isDefault) {
          await ctx.db.patch(loc._id, { isDefault: false });
        }
      }
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("userLocations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const location = await ctx.db.get(args.id);
    if (!location || location.userId !== identity.subject) {
      throw new Error("Location not found");
    }

    await ctx.db.delete(args.id);
  },
});
