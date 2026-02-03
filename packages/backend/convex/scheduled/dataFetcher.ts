"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

// Main data fetcher action - runs every 15 minutes
// Optimized to only process active locations (default + with active routes)
export const fetchAllData = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get only active locations (default + with active routes)
    // This reduces bandwidth by ~60% compared to getAllLocations
    const locations = await ctx.runQuery(
      internal.scheduled.dataFetcherQueries.getActiveLocations
    );

    if (locations.length === 0) return { processed: 0 };

    // Group by grid cell (~50km)
    const gridCells = groupByGridCell(locations, 0.5); // 0.5 degrees ≈ 50km

    let processed = 0;

    for (const [cellKey, cellLocations] of Object.entries(gridCells)) {
      // Use center of cell for API calls
      const center = getCellCenter(cellLocations as any[]);

      try {
        // Fetch weather data
        const weatherData = await ctx.runAction(
          internal.integrations.weather.fetchOpenWeatherMap,
          { lat: center.lat, lng: center.lng }
        );

        // Fetch traffic data
        const trafficData = await ctx.runAction(
          internal.integrations.traffic.fetchHereTraffic,
          { lat: center.lat, lng: center.lng, radiusMeters: 10000 }
        );

        // Fetch Tomorrow.io nowcasting data (minute-by-minute precipitation)
        let nowcastData = null;
        try {
          nowcastData = await ctx.runAction(
            internal.integrations.weather.fetchTomorrowIO,
            { lat: center.lat, lng: center.lng }
          );
        } catch (error) {
          // Tomorrow.io is optional - continue without it
          console.warn("Tomorrow.io fetch failed:", error);
        }

        // Get nearby events
        const nearbyEvents = await ctx.runQuery(
          internal.scheduled.dataFetcherQueries.getNearbyEvents,
          { lat: center.lat, lng: center.lng, radiusKm: 10 }
        );

        // Calculate risk for each location in cell
        for (const location of cellLocations as any[]) {
          // Combine weather data with alerts for risk calculation
          const weatherDataForRisk = {
            ...weatherData.current,
            alerts: weatherData.alerts,
            // Add nowcast precipitation if available (next 10 minutes)
            nowcastPrecipitation: nowcastData?.minutely?.slice(0, 10)?.reduce(
              (max: number, m: any) => Math.max(max, m.precipitationIntensity ?? 0),
              0
            ),
          };

          await ctx.runMutation(internal.riskScore.calculate, {
            locationId: location._id,
            weatherData: weatherDataForRisk,
            trafficData,
            nearbyEvents: nearbyEvents.map((e: any) => ({
              severity: e.severity,
              confidenceScore: e.confidenceScore,
            })),
          });
          processed++;
        }

        // Collect all events to batch insert (reduces mutation overhead)
        const eventsToInsert: Array<{
          type: "weather" | "traffic";
          subtype: string;
          location: { lat: number; lng: number };
          routePoints?: Array<{ lat: number; lng: number }>;
          radius: number;
          severity: number;
          source: "openweathermap" | "tomorrow" | "here";
          ttl: number;
          rawData?: any;
        }> = [];

        // Weather events from alerts
        for (const alert of weatherData.alerts ?? []) {
          eventsToInsert.push({
            type: "weather",
            subtype: alert.event ?? "severe_weather",
            location: center,
            radius: 50000,
            severity: mapAlertSeverity(alert),
            source: "openweathermap",
            ttl: alert.end ?? Date.now() + 3600000,
            rawData: alert,
          });
        }

        // Weather events from hourly forecast (rain, storm, snow)
        const upcomingWeather = analyzeUpcomingWeather(weatherData.hourly ?? []);
        for (const weatherEvent of upcomingWeather) {
          eventsToInsert.push({
            type: "weather",
            subtype: weatherEvent.subtype,
            location: center,
            radius: 10000,
            severity: weatherEvent.severity,
            source: "openweathermap",
            ttl: weatherEvent.ttl,
            rawData: weatherEvent.rawData,
          });
        }

        // Traffic events from incidents
        for (const incident of trafficData.incidents ?? []) {
          const incidentLocation = extractIncidentLocation(incident, center);
          if (incidentLocation) {
            eventsToInsert.push({
              type: "traffic",
              subtype: incident.type ?? "incident",
              location: incidentLocation,
              routePoints: incident.routePoints,
              radius: 1000,
              severity: incident.severity,
              source: "here",
              ttl: incident.endTime
                ? new Date(incident.endTime).getTime()
                : Date.now() + 3600000,
              rawData: incident,
            });
          }
        }

        // Batch insert all events at once (much more efficient!)
        if (eventsToInsert.length > 0) {
          await ctx.runMutation(internal.events.batchInsertFromAPI, {
            events: eventsToInsert,
          });
        }
      } catch (error) {
        console.error(`Error fetching data for cell ${cellKey}:`, error);
      }
    }

    // Clean expired events
    await ctx.runMutation(internal.events.cleanExpired, {});

    return { processed };
  },
});

// Group locations into ~50km grid cells to minimize API calls
function groupByGridCell(
  locations: any[],
  cellSize: number
): Record<string, any[]> {
  const cells: Record<string, any[]> = {};

  for (const loc of locations) {
    const cellLat = Math.floor(loc.location.lat / cellSize);
    const cellLng = Math.floor(loc.location.lng / cellSize);
    const key = `${cellLat},${cellLng}`;

    if (!cells[key]) cells[key] = [];
    cells[key].push(loc);
  }

  return cells;
}

// Calculate center point of all locations in a cell
function getCellCenter(locations: any[]): { lat: number; lng: number } {
  const sum = locations.reduce(
    (acc, loc) => ({
      lat: acc.lat + loc.location.lat,
      lng: acc.lng + loc.location.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / locations.length,
    lng: sum.lng / locations.length,
  };
}

// Map OpenWeatherMap alert severity to 1-5 scale
function mapAlertSeverity(alert: any): number {
  const event = (alert.event ?? "").toLowerCase();
  if (event.includes("tornado") || event.includes("hurricane")) return 5;
  if (event.includes("flood") || event.includes("severe")) return 4;
  if (event.includes("storm") || event.includes("warning")) return 3;
  if (event.includes("watch") || event.includes("advisory")) return 2;
  return 1;
}

// Analyze hourly forecast for significant weather events
type WeatherEventData = {
  subtype: string;
  severity: number;
  ttl: number;
  rawData: any;
};

function analyzeUpcomingWeather(hourly: any[]): WeatherEventData[] {
  const events: WeatherEventData[] = [];
  const now = Date.now();

  // Group consecutive hours with similar conditions
  let rainStart: any = null;
  let stormStart: any = null;
  let maxRainIntensity = 0;

  for (const hour of hourly.slice(0, 6)) { // Next 6 hours
    const weatherId = hour.weather?.id ?? 0;
    const pop = hour.pop ?? 0; // Probability of precipitation
    const rainAmount = hour.rain ?? 0;

    // Thunderstorm (200-299)
    if (weatherId >= 200 && weatherId < 300) {
      if (!stormStart) {
        stormStart = hour;
      }
    } else if (stormStart) {
      // Storm ended
      events.push({
        subtype: "thunderstorm",
        severity: 4,
        ttl: (hour.dt * 1000) + 3600000, // 1 hour after storm ends
        rawData: {
          startTime: stormStart.dt,
          endTime: hour.dt,
          description: "Thunderstorm expected",
          weather: stormStart.weather,
        },
      });
      stormStart = null;
    }

    // Rain (500-599) or high probability
    if ((weatherId >= 500 && weatherId < 600) || pop >= 0.7) {
      if (!rainStart) {
        rainStart = hour;
      }
      maxRainIntensity = Math.max(maxRainIntensity, rainAmount);
    } else if (rainStart) {
      // Rain ended
      const severity = maxRainIntensity > 5 ? 3 : maxRainIntensity > 1 ? 2 : 1;
      events.push({
        subtype: maxRainIntensity > 5 ? "heavy_rain" : "rain",
        severity,
        ttl: (hour.dt * 1000) + 3600000,
        rawData: {
          startTime: rainStart.dt,
          endTime: hour.dt,
          description: maxRainIntensity > 5 ? "Heavy rain expected" : "Rain expected",
          intensity: maxRainIntensity,
          probability: rainStart.pop,
          weather: rainStart.weather,
        },
      });
      rainStart = null;
      maxRainIntensity = 0;
    }

    // Snow (600-699)
    if (weatherId >= 600 && weatherId < 700) {
      events.push({
        subtype: "snow",
        severity: 3,
        ttl: (hour.dt * 1000) + 3600000,
        rawData: {
          time: hour.dt,
          description: "Snow expected",
          weather: hour.weather,
        },
      });
    }
  }

  // Handle ongoing conditions at end of forecast window
  if (stormStart) {
    events.push({
      subtype: "thunderstorm",
      severity: 4,
      ttl: now + 6 * 3600000, // 6 hours from now
      rawData: {
        startTime: stormStart.dt,
        description: "Thunderstorm expected",
        weather: stormStart.weather,
      },
    });
  }

  if (rainStart) {
    const severity = maxRainIntensity > 5 ? 3 : maxRainIntensity > 1 ? 2 : 1;
    events.push({
      subtype: maxRainIntensity > 5 ? "heavy_rain" : "rain",
      severity,
      ttl: now + 6 * 3600000,
      rawData: {
        startTime: rainStart.dt,
        description: maxRainIntensity > 5 ? "Heavy rain expected" : "Rain expected",
        intensity: maxRainIntensity,
        probability: rainStart.pop,
        weather: rainStart.weather,
      },
    });
  }

  return events;
}

// Extract lat/lng from HERE incident location structure
function extractIncidentLocation(
  incident: any,
  fallback: { lat: number; lng: number }
): { lat: number; lng: number } | null {
  // HERE API returns location.shape.links[0].points or similar structures
  const shape = incident.location?.shape;
  if (shape?.links?.[0]?.points?.[0]) {
    const point = shape.links[0].points[0];
    return { lat: point.lat, lng: point.lng };
  }

  // Try direct lat/lng if available
  if (incident.location?.lat && incident.location?.lng) {
    return { lat: incident.location.lat, lng: incident.location.lng };
  }

  // Use cell center as fallback for incidents without precise location
  return fallback;
}
