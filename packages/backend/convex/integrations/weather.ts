"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

export const fetchOpenWeatherMap = action({
  args: {
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) throw new Error("OPENWEATHERMAP_API_KEY not configured");

    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${args.lat}&lon=${args.lng}&appid=${apiKey}&units=metric&exclude=minutely,daily`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      current: {
        temp: data.current.temp,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_speed,
        visibility: data.current.visibility,
        weather: data.current.weather[0],
        rain: data.current.rain,
        snow: data.current.snow,
      },
      alerts: data.alerts ?? [],
      hourly: data.hourly?.slice(0, 12).map((h: any) => ({
        dt: h.dt,
        temp: h.temp,
        pop: h.pop,
        rain: h.rain?.["1h"],
        weather: h.weather[0],
      })),
    };
  },
});

export const fetchTomorrowIO = action({
  args: {
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.TOMORROW_IO_API_KEY;
    if (!apiKey) throw new Error("TOMORROW_IO_API_KEY not configured");

    const url = `https://api.tomorrow.io/v4/timelines?location=${args.lat},${args.lng}&fields=precipitationIntensity,precipitationType,visibility&timesteps=1m&units=metric&apikey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Tomorrow.io API error: ${response.status}`);
    }

    const data = await response.json();
    const intervals = data.data?.timelines?.[0]?.intervals ?? [];

    return {
      minutely: intervals.slice(0, 60).map((i: any) => ({
        time: i.startTime,
        precipitationIntensity: i.values.precipitationIntensity,
        precipitationType: i.values.precipitationType,
        visibility: i.values.visibility,
      })),
    };
  },
});
