import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Route document type for return validators
const routeDoc = v.object({
  _id: v.id("routes"),
  _creationTime: v.number(),
  userId: v.string(),
  name: v.string(),
  fromLocationId: v.optional(v.id("userLocations")),
  fromName: v.string(),
  toLocationId: v.optional(v.id("userLocations")),
  toName: v.string(),
  fromLocation: v.object({
    lat: v.number(),
    lng: v.number(),
  }),
  toLocation: v.object({
    lat: v.number(),
    lng: v.number(),
  }),
  icon: v.union(v.literal("building"), v.literal("running"), v.literal("home")),
  monitorDays: v.array(v.boolean()),
  alertThreshold: v.number(),
  alertTime: v.string(),
  isActive: v.boolean(),
});

// Get all routes for current user
export const getUserRoutes = query({
  args: {},
  returns: v.array(routeDoc),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const routes = await ctx.db
      .query("routes")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return routes;
  },
});

// Get a single route
export const getRoute = query({
  args: { routeId: v.id("routes") },
  returns: v.union(routeDoc, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const route = await ctx.db.get(args.routeId);
    if (!route || route.userId !== identity.subject) {
      return null;
    }

    return route;
  },
});

// Create a new route
export const createRoute = mutation({
  args: {
    name: v.string(),
    fromName: v.string(),
    toName: v.string(),
    fromLocation: v.object({ lat: v.number(), lng: v.number() }),
    toLocation: v.object({ lat: v.number(), lng: v.number() }),
    fromLocationId: v.optional(v.id("userLocations")),
    toLocationId: v.optional(v.id("userLocations")),
    icon: v.union(v.literal("building"), v.literal("running"), v.literal("home")),
    monitorDays: v.array(v.boolean()),
    alertThreshold: v.number(),
    alertTime: v.string(),
  },
  returns: v.id("routes"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const routeId = await ctx.db.insert("routes", {
      userId: identity.subject,
      name: args.name,
      fromName: args.fromName,
      toName: args.toName,
      fromLocation: args.fromLocation,
      toLocation: args.toLocation,
      fromLocationId: args.fromLocationId,
      toLocationId: args.toLocationId,
      icon: args.icon,
      monitorDays: args.monitorDays,
      alertThreshold: args.alertThreshold,
      alertTime: args.alertTime,
      isActive: true,
    });

    return routeId;
  },
});

// Update a route
export const updateRoute = mutation({
  args: {
    routeId: v.id("routes"),
    name: v.optional(v.string()),
    monitorDays: v.optional(v.array(v.boolean())),
    alertThreshold: v.optional(v.number()),
    alertTime: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const route = await ctx.db.get(args.routeId);
    if (!route || route.userId !== identity.subject) {
      throw new Error("Route not found");
    }

    const { routeId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(routeId, filteredUpdates);
    return null;
  },
});

// Delete a route
export const deleteRoute = mutation({
  args: { routeId: v.id("routes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const route = await ctx.db.get(args.routeId);
    if (!route || route.userId !== identity.subject) {
      throw new Error("Route not found");
    }

    await ctx.db.delete(args.routeId);
    return null;
  },
});
