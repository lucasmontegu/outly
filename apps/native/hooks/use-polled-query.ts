import { useState, useEffect, useCallback, useRef } from "react";
import { useConvex } from "convex/react";
import { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server";

/**
 * Options for the usePolledQuery hook
 */
export interface PolledQueryOptions {
  /** Polling interval in milliseconds. Default: 60000 (60 seconds) */
  interval?: number;
  /** Whether to enable polling. When false, acts like a one-time fetch. Default: true */
  enabled?: boolean;
  /** Whether to fetch immediately on mount. Default: true */
  fetchOnMount?: boolean;
}

/**
 * Return type for the usePolledQuery hook
 */
export interface PolledQueryResult<T> {
  /** The data returned from the query */
  data: T | undefined;
  /** Whether the query is currently loading (first fetch or refresh) */
  isLoading: boolean;
  /** Error if the query failed */
  error: Error | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Timestamp of the last successful fetch */
  lastUpdated: number | null;
}

/**
 * Custom hook that polls a Convex query at intervals instead of using real-time subscriptions.
 *
 * Use this for data that doesn't change frequently (like weather data that only updates
 * every 10-15 minutes). This reduces bandwidth usage compared to real-time subscriptions.
 *
 * @example
 * ```tsx
 * const { data, isLoading, refresh, lastUpdated } = usePolledQuery(
 *   api.riskScore.getLatestForecast,
 *   { locationId: selectedLocation._id },
 *   { interval: 60000 } // Poll every 60 seconds
 * );
 * ```
 *
 * @param query - The Convex query function reference
 * @param args - Arguments to pass to the query
 * @param options - Polling options (interval, enabled, fetchOnMount)
 * @returns Object containing data, loading state, error, refresh function, and lastUpdated timestamp
 */
export function usePolledQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>,
  options: PolledQueryOptions = {}
): PolledQueryResult<FunctionReturnType<Query>> {
  const { interval = 60000, enabled = true, fetchOnMount = true } = options;

  const convex = useConvex();
  const [data, setData] = useState<FunctionReturnType<Query> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(fetchOnMount);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Track args to detect changes
  const argsRef = useRef(args);
  const argsString = JSON.stringify(args);

  // Fetch function
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await convex.query(query, args);
      setData(result);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Query failed"));
      console.error("[usePolledQuery] Query error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [convex, query, argsString, enabled]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initial fetch on mount
  useEffect(() => {
    if (fetchOnMount && enabled) {
      fetchData();
    }
  }, [fetchOnMount, enabled, fetchData]);

  // Re-fetch when args change
  useEffect(() => {
    const prevArgsString = JSON.stringify(argsRef.current);
    if (prevArgsString !== argsString && enabled) {
      argsRef.current = args;
      fetchData();
    }
  }, [argsString, enabled, fetchData]);

  // Set up polling interval
  useEffect(() => {
    if (!enabled || interval <= 0) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, interval, fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh,
    lastUpdated,
  };
}

/**
 * Variant of usePolledQuery that only fetches once and doesn't poll.
 * Useful for data that you want to control manually via refresh.
 *
 * @example
 * ```tsx
 * const { data, isLoading, refresh } = useOnceQuery(
 *   api.riskScore.getLatestForecast,
 *   { locationId: selectedLocation._id }
 * );
 * ```
 */
export function useOnceQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>,
  options: Omit<PolledQueryOptions, "interval"> = {}
): PolledQueryResult<FunctionReturnType<Query>> {
  return usePolledQuery(query, args, { ...options, interval: 0 });
}
