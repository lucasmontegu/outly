"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";

// Internal version for scheduled jobs
export const fetchHereTraffic = internalAction({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusMeters: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.HERE_API_KEY;
    if (!apiKey) throw new Error("HERE_API_KEY not configured");

    const radius = args.radiusMeters ?? 5000;

    // Fetch traffic flow
    const flowUrl = `https://data.traffic.hereapi.com/v7/flow?in=circle:${args.lat},${args.lng};r=${radius}&locationReferencing=shape&apiKey=${apiKey}`;

    const flowResponse = await fetch(flowUrl);
    if (!flowResponse.ok) {
      const errorBody = await flowResponse.text();
      console.error("HERE Flow error body:", errorBody);
      throw new Error(`HERE Traffic Flow API error: ${flowResponse.status} - ${errorBody}`);
    }

    const flowData = await flowResponse.json();

    // Fetch incidents
    const incidentsUrl = `https://data.traffic.hereapi.com/v7/incidents?in=circle:${args.lat},${args.lng};r=${radius}&locationReferencing=shape&apiKey=${apiKey}`;

    const incidentsResponse = await fetch(incidentsUrl);
    if (!incidentsResponse.ok) {
      const errorBody = await incidentsResponse.text();
      console.error("HERE Incidents error body:", errorBody);
      throw new Error(`HERE Traffic Incidents API error: ${incidentsResponse.status} - ${errorBody}`);
    }

    const incidentsData = await incidentsResponse.json();

    // Calculate average jam factor
    const flows = flowData.results ?? [];
    let totalJamFactor = 0;
    let flowCount = 0;

    for (const flow of flows) {
      if (flow.currentFlow?.jamFactor !== undefined) {
        totalJamFactor += flow.currentFlow.jamFactor;
        flowCount++;
      }
    }

    const avgJamFactor = flowCount > 0 ? totalJamFactor / flowCount : 0;

    // Process incidents with route points extraction
    const incidents = (incidentsData.results ?? []).map((inc: any) => {
      // Extract route points from HERE shape data
      const routePoints = extractRoutePoints(inc.location);

      return {
        id: inc.incidentDetails?.id,
        type: inc.incidentDetails?.type,
        description: inc.incidentDetails?.description?.value,
        severity: mapHereSeverity(inc.incidentDetails?.criticality),
        startTime: inc.incidentDetails?.startTime,
        endTime: inc.incidentDetails?.endTime,
        location: inc.location,
        routePoints,
      };
    });

    const maxSeverity = incidents.length > 0
      ? Math.max(...incidents.map((i: any) => i.severity))
      : 0;

    return {
      jamFactor: avgJamFactor,
      incidents,
      maxSeverity,
      flowCount,
    };
  },
});

function mapHereSeverity(criticality: string | undefined): number {
  switch (criticality) {
    case "critical": return 5;
    case "major": return 4;
    case "minor": return 2;
    case "lowImpact": return 1;
    default: return 3;
  }
}

// Extract route points from HERE location shape
function extractRoutePoints(location: any): { lat: number; lng: number }[] | undefined {
  if (!location?.shape) return undefined;

  const points: { lat: number; lng: number }[] = [];

  // HERE API returns shape with links containing points
  if (location.shape.links) {
    for (const link of location.shape.links) {
      if (link.points) {
        for (const point of link.points) {
          if (point.lat !== undefined && point.lng !== undefined) {
            points.push({ lat: point.lat, lng: point.lng });
          }
        }
      }
    }
  }

  // Also try direct points array
  if (location.shape.points) {
    for (const point of location.shape.points) {
      if (point.lat !== undefined && point.lng !== undefined) {
        points.push({ lat: point.lat, lng: point.lng });
      }
    }
  }

  // Return undefined if no points found (will use circle instead)
  return points.length > 0 ? points : undefined;
}
