import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/**
 * Bandwidth Monitoring Module
 *
 * Tracks query execution statistics to help identify bandwidth optimization opportunities.
 * Metrics are aggregated daily to keep storage minimal while providing useful insights.
 *
 * Usage:
 * - Call `logQueryExecution` after heavy queries to track their bandwidth impact
 * - Use `getBandwidthReport` to analyze query patterns and identify optimization targets
 * - `cleanOldMetrics` runs weekly via cron to remove data older than 30 days
 */

// ============================================================================
// INTERNAL MUTATIONS
// ============================================================================

/**
 * Log a query execution for bandwidth monitoring.
 * Call this after queries that return significant amounts of data.
 *
 * @param queryName - Identifier for the query (e.g., "events.getEventsInGrid")
 * @param bytesEstimate - Estimated bytes returned (can be rough estimate based on doc count * avg size)
 * @param documentCount - Number of documents returned
 */
export const logQueryExecution = internalMutation({
  args: {
    queryName: v.string(),
    bytesEstimate: v.number(),
    documentCount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0] as string;

    // Try to find existing record for this query/date
    const existing = await ctx.db
      .query("bandwidthMetrics")
      .withIndex("by_query_date", (q) =>
        q.eq("queryName", args.queryName).eq("date", today)
      )
      .first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        totalBytes: existing.totalBytes + args.bytesEstimate,
        callCount: existing.callCount + 1,
        totalDocuments: existing.totalDocuments + args.documentCount,
      });
    } else {
      // Create new record
      await ctx.db.insert("bandwidthMetrics", {
        queryName: args.queryName,
        date: today as string,
        totalBytes: args.bytesEstimate,
        callCount: 1,
        totalDocuments: args.documentCount,
      });
    }

    return null;
  },
});

// ============================================================================
// INTERNAL QUERIES
// ============================================================================

/**
 * Get bandwidth usage report for the last N days.
 * Returns aggregated statistics per query, sorted by total bytes descending.
 *
 * @param days - Number of days to include in the report (default: 7)
 * @returns Array of query statistics with totals
 */
export const getBandwidthReport = internalQuery({
  args: {
    days: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      queryName: v.string(),
      totalBytes: v.number(),
      totalCalls: v.number(),
      totalDocuments: v.number(),
      avgBytesPerCall: v.number(),
      avgDocumentsPerCall: v.number(),
      dailyBreakdown: v.array(
        v.object({
          date: v.string(),
          bytes: v.number(),
          calls: v.number(),
          documents: v.number(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const days = args.days ?? 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0] as string;

    // Get all metrics within date range
    const metrics = await ctx.db
      .query("bandwidthMetrics")
      .withIndex("by_date")
      .filter((q) => q.gte(q.field("date"), cutoffDateStr))
      .collect();

    // Aggregate by query name
    const aggregated = new Map<
      string,
      {
        totalBytes: number;
        totalCalls: number;
        totalDocuments: number;
        dailyBreakdown: Map<
          string,
          { bytes: number; calls: number; documents: number }
        >;
      }
    >();

    for (const metric of metrics) {
      const existing = aggregated.get(metric.queryName);
      if (existing) {
        existing.totalBytes += metric.totalBytes;
        existing.totalCalls += metric.callCount;
        existing.totalDocuments += metric.totalDocuments;

        const daily = existing.dailyBreakdown.get(metric.date);
        if (daily) {
          daily.bytes += metric.totalBytes;
          daily.calls += metric.callCount;
          daily.documents += metric.totalDocuments;
        } else {
          existing.dailyBreakdown.set(metric.date, {
            bytes: metric.totalBytes,
            calls: metric.callCount,
            documents: metric.totalDocuments,
          });
        }
      } else {
        const dailyBreakdown = new Map<
          string,
          { bytes: number; calls: number; documents: number }
        >();
        dailyBreakdown.set(metric.date, {
          bytes: metric.totalBytes,
          calls: metric.callCount,
          documents: metric.totalDocuments,
        });
        aggregated.set(metric.queryName, {
          totalBytes: metric.totalBytes,
          totalCalls: metric.callCount,
          totalDocuments: metric.totalDocuments,
          dailyBreakdown,
        });
      }
    }

    // Convert to array and sort by total bytes
    const results = Array.from(aggregated.entries())
      .map(([queryName, stats]) => ({
        queryName,
        totalBytes: stats.totalBytes,
        totalCalls: stats.totalCalls,
        totalDocuments: stats.totalDocuments,
        avgBytesPerCall:
          stats.totalCalls > 0
            ? Math.round(stats.totalBytes / stats.totalCalls)
            : 0,
        avgDocumentsPerCall:
          stats.totalCalls > 0
            ? Math.round((stats.totalDocuments / stats.totalCalls) * 10) / 10
            : 0,
        dailyBreakdown: Array.from(stats.dailyBreakdown.entries())
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      }))
      .sort((a, b) => b.totalBytes - a.totalBytes);

    return results;
  },
});

/**
 * Get a summary of bandwidth usage for the last N days.
 * Provides high-level overview without per-query breakdown.
 */
export const getBandwidthSummary = internalQuery({
  args: {
    days: v.optional(v.number()),
  },
  returns: v.object({
    totalBytes: v.number(),
    totalCalls: v.number(),
    totalDocuments: v.number(),
    uniqueQueries: v.number(),
    avgBytesPerDay: v.number(),
    topQueries: v.array(
      v.object({
        queryName: v.string(),
        totalBytes: v.number(),
        percentOfTotal: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const days = args.days ?? 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0] as string;

    const metrics = await ctx.db
      .query("bandwidthMetrics")
      .withIndex("by_date")
      .filter((q) => q.gte(q.field("date"), cutoffDateStr))
      .collect();

    let totalBytes = 0;
    let totalCalls = 0;
    let totalDocuments = 0;
    const queryBytes = new Map<string, number>();

    for (const metric of metrics) {
      totalBytes += metric.totalBytes;
      totalCalls += metric.callCount;
      totalDocuments += metric.totalDocuments;

      const existing = queryBytes.get(metric.queryName) ?? 0;
      queryBytes.set(metric.queryName, existing + metric.totalBytes);
    }

    const topQueries = Array.from(queryBytes.entries())
      .map(([queryName, bytes]) => ({
        queryName,
        totalBytes: bytes,
        percentOfTotal:
          totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.totalBytes - a.totalBytes)
      .slice(0, 5);

    return {
      totalBytes,
      totalCalls,
      totalDocuments,
      uniqueQueries: queryBytes.size,
      avgBytesPerDay: days > 0 ? Math.round(totalBytes / days) : 0,
      topQueries,
    };
  },
});

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clean up bandwidth metrics older than 30 days.
 * Should be run weekly via cron to prevent unbounded growth.
 */
export const cleanOldMetrics = internalMutation({
  args: {},
  returns: v.object({
    deletedCount: v.number(),
  }),
  handler: async (ctx) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0] as string;

    // Find all metrics older than 30 days
    const oldMetrics = await ctx.db
      .query("bandwidthMetrics")
      .withIndex("by_date")
      .filter((q) => q.lt(q.field("date"), cutoffDateStr))
      .collect();

    // Delete them
    for (const metric of oldMetrics) {
      await ctx.db.delete(metric._id);
    }

    return { deletedCount: oldMetrics.length };
  },
});
