/**
 * Client-side caching utility for reducing Convex bandwidth
 * Uses expo-secure-store for persistent storage with TTL-based invalidation
 *
 * Default TTL: 5 minutes
 */

import * as SecureStore from "expo-secure-store";

// Cache TTL in milliseconds (5 minutes)
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

// Cache entry structure
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

// Prefix for all cache keys to avoid collisions
const CACHE_KEY_PREFIX = "outia_cache_";

/**
 * Get a cached value if it exists and is not expired
 * @param key - Cache key
 * @returns Cached data or null if not found/expired
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cacheKey = CACHE_KEY_PREFIX + key;
    const cached = await SecureStore.getItemAsync(cacheKey);

    if (!cached) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - entry.cachedAt > entry.ttlMs) {
      // Cache expired, remove it
      await SecureStore.deleteItemAsync(cacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    // If parsing fails or any other error, return null
    console.warn("[StorageCache] Error reading cache:", error);
    return null;
  }
}

/**
 * Set a cached value with optional custom TTL
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlMs - Optional custom TTL in milliseconds (default: 5 minutes)
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): Promise<void> {
  try {
    const cacheKey = CACHE_KEY_PREFIX + key;
    const entry: CacheEntry<T> = {
      data,
      cachedAt: Date.now(),
      ttlMs,
    };

    await SecureStore.setItemAsync(cacheKey, JSON.stringify(entry));
  } catch (error) {
    // SecureStore has size limits (~2KB per item)
    // If data is too large, log warning but don't fail
    console.warn("[StorageCache] Error writing cache:", error);
  }
}

/**
 * Remove a cached value
 * @param key - Cache key
 */
export async function removeCached(key: string): Promise<void> {
  try {
    const cacheKey = CACHE_KEY_PREFIX + key;
    await SecureStore.deleteItemAsync(cacheKey);
  } catch (error) {
    console.warn("[StorageCache] Error removing cache:", error);
  }
}

/**
 * Get cached value or fetch fresh data
 * @param key - Cache key
 * @param fetcher - Async function to fetch fresh data
 * @param ttlMs - Optional custom TTL in milliseconds
 * @returns Cached or fresh data
 */
export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const fresh = await fetcher();

  // Cache the result (don't await to avoid blocking)
  setCached(key, fresh, ttlMs).catch(() => {
    // Ignore cache write errors
  });

  return fresh;
}

/**
 * Create a cache key for location-based data
 * Rounds coordinates to reduce cache key variations
 * @param prefix - Key prefix
 * @param lat - Latitude
 * @param lng - Longitude
 * @param precision - Decimal precision (default: 3 = ~100m)
 */
export function locationCacheKey(
  prefix: string,
  lat: number,
  lng: number,
  precision: number = 3
): string {
  const factor = Math.pow(10, precision);
  const roundedLat = Math.round(lat * factor) / factor;
  const roundedLng = Math.round(lng * factor) / factor;
  return `${prefix}_${roundedLat}_${roundedLng}`;
}

/**
 * Cache TTL presets for different data types
 */
export const CacheTTL = {
  /** Risk scores - 5 minutes */
  RISK_SCORE: 5 * 60 * 1000,
  /** Forecast data - 10 minutes */
  FORECAST: 10 * 60 * 1000,
  /** Route data - 15 minutes (matches server cache) */
  ROUTES: 15 * 60 * 1000,
  /** Events list - 2 minutes (changes frequently) */
  EVENTS: 2 * 60 * 1000,
  /** User data - 30 minutes (rarely changes) */
  USER_DATA: 30 * 60 * 1000,
} as const;
