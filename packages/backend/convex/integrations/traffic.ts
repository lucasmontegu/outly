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
      throw new Error(`HERE Traffic Flow API error: ${flowResponse.status}`);
    }

    const flowData = await flowResponse.json();

    // Fetch incidents
    const incidentsUrl = `https://data.traffic.hereapi.com/v7/incidents?in=circle:${args.lat},${args.lng};r=${radius}&apiKey=${apiKey}`;

    const incidentsResponse = await fetch(incidentsUrl);
    if (!incidentsResponse.ok) {
      throw new Error(`HERE Traffic Incidents API error: ${incidentsResponse.status}`);
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

    // Process incidents
    const incidents = (incidentsData.results ?? []).map((inc: any) => ({
      id: inc.incidentDetails?.id,
      type: inc.incidentDetails?.type,
      description: inc.incidentDetails?.description?.value,
      severity: mapHereSeverity(inc.incidentDetails?.criticality),
      startTime: inc.incidentDetails?.startTime,
      endTime: inc.incidentDetails?.endTime,
      location: inc.location,
    }));

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
