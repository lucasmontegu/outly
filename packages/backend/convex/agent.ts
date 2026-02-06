import { createOpenAI } from "@ai-sdk/openai";
import { type LanguageModel, stepCountIs } from "ai";
import { Agent, createTool, type UsageHandler } from "@convex-dev/agent";
import { z } from "zod";

import { api, components } from "./_generated/api";

// OpenRouter via OpenAI-compatible API
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Usage tracking — logs every LLM call for cost visibility
const usageHandler: UsageHandler = async (_ctx, args) => {
  const { usage } = args;
  console.log(
    `[agent-usage] model=${args.model} provider=${args.provider} ` +
      `in=${usage.inputTokens ?? 0} out=${usage.outputTokens ?? 0} ` +
      `agent=${args.agentName}`
  );
};

// ============================================================================
// TOOLS — Give the agent access to Outia's real-time data
// ============================================================================

const getCurrentRisk = createTool({
  description:
    "Get the current risk score (0-100) for a location. Returns score, classification (low/medium/high), breakdown by weather/traffic/events, a description, and nearby active events.",
  args: z.object({
    lat: z.number().describe("Latitude of the location"),
    lng: z.number().describe("Longitude of the location"),
  }),
  handler: async (ctx, args): Promise<string> => {
    const risk = await ctx.runQuery(api.riskScore.getCurrentRisk, {
      lat: args.lat,
      lng: args.lng,
    });
    return JSON.stringify(risk);
  },
});

const getForecast = createTool({
  description:
    "Get a 2-hour departure forecast with 15-minute intervals for a location. Returns time slots with predicted risk scores, the optimal departure slot, and how many minutes to wait.",
  args: z.object({
    lat: z.number().describe("Latitude of the location"),
    lng: z.number().describe("Longitude of the location"),
  }),
  handler: async (ctx, args): Promise<string> => {
    const forecast = await ctx.runQuery(api.riskScore.getForecast, {
      lat: args.lat,
      lng: args.lng,
    });
    return JSON.stringify(forecast);
  },
});

const getNearbyEvents = createTool({
  description:
    "Get active weather and traffic events near a location within a radius. Returns events with type, subtype, severity (1-5), confidence score, and location.",
  args: z.object({
    lat: z.number().describe("Latitude of the center point"),
    lng: z.number().describe("Longitude of the center point"),
    radiusKm: z
      .number()
      .default(10)
      .describe("Search radius in kilometers (default 10)"),
  }),
  handler: async (ctx, args): Promise<string> => {
    const events = await ctx.runQuery(api.events.listNearbySlim, {
      lat: args.lat,
      lng: args.lng,
      radiusKm: args.radiusKm,
    });
    return JSON.stringify(events);
  },
});

const getUserLocations = createTool({
  description:
    "Get the user's saved locations (home, work, etc). Returns location name, coordinates, address, and which one is the default.",
  args: z.object({}),
  handler: async (ctx): Promise<string> => {
    const locations = await ctx.runQuery(api.userLocations.list);
    return JSON.stringify(
      locations.map((l) => ({
        id: l._id,
        name: l.name,
        lat: l.location.lat,
        lng: l.location.lng,
        address: l.address,
        isDefault: l.isDefault,
      }))
    );
  },
});

const getRiskForSavedLocation = createTool({
  description:
    "Get the latest risk snapshot for a user's saved location by its ID. Use getUserLocations first to get valid location IDs.",
  args: z.object({
    locationId: z
      .string()
      .describe("The ID of a saved user location (from getUserLocations)"),
  }),
  handler: async (ctx, args): Promise<string> => {
    const risk = await ctx.runQuery(api.riskScore.getForLocation, {
      locationId: args.locationId as any,
    });
    return risk ? JSON.stringify(risk) : "No risk data available for this location yet.";
  },
});

// ============================================================================
// AGENT DEFINITION
// ============================================================================

export const chatAgent = new Agent(components.agent, {
  name: "Outia Assistant",
  // Cast needed: @ai-sdk/openai types resolve to V3 due to npm deduplication,
  // but runtime produces V2. Safe to cast since ai@5 + openai@2.x are compatible.
  languageModel: openrouter("google/gemma-3-4b-it:free") as unknown as LanguageModel,
  instructions: `You are Outia's AI assistant — a risk intelligence copilot that helps users make safe departure decisions.

You have access to real-time tools to check risk scores, weather/traffic events, forecasts, and saved locations. USE THEM to give data-backed answers instead of guessing.

## How to respond

- When asked about conditions, risk, or whether to leave: call getCurrentRisk and/or getForecast with the user's location.
- When asked about events or incidents: call getNearbyEvents.
- When the user mentions "home", "work", or a saved place: call getUserLocations first to get coordinates, then use those coordinates with other tools.
- Always explain risk scores in plain language: low (<34) = good to go, medium (34-67) = monitor/consider waiting, high (>67) = delay recommended.
- Mention the breakdown (weather vs traffic vs events) so the user understands WHY the score is what it is.
- When showing forecast data, highlight the optimal departure time.
- Be concise. Mobile users want quick, actionable answers.
- Respond in the same language the user writes in (Spanish or English).

## What you CANNOT do

- You cannot change user settings or locations (read-only access).
- You don't have access to historical trends beyond the current snapshot.
- If you don't have location data, ask the user for their location or to check their saved locations.`,
  tools: {
    getCurrentRisk,
    getForecast,
    getNearbyEvents,
    getUserLocations,
    getRiskForSavedLocation,
  },
  // Allow up to 4 tool calls before responding (e.g., get locations → get risk → get forecast → respond)
  stopWhen: stepCountIs(5),
  usageHandler,
});
