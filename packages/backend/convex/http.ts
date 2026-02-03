import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// ============================================================================
// RevenueCat Webhook Handler
// ============================================================================

/**
 * RevenueCat Webhook Events:
 * - INITIAL_PURCHASE: First-time purchase
 * - RENEWAL: Subscription renewed
 * - CANCELLATION: User cancelled (still has access until period ends)
 * - EXPIRATION: Subscription period ended
 * - BILLING_ISSUE: Payment failed
 * - PRODUCT_CHANGE: User changed subscription tier
 * - UNCANCELLATION: User reactivated after cancellation
 * - SUBSCRIBER_ALIAS: User identity changed
 * - TRANSFER: Subscription transferred
 *
 * Webhook payload structure:
 * {
 *   "api_version": "1.0",
 *   "event": {
 *     "type": "INITIAL_PURCHASE" | "RENEWAL" | ...,
 *     "app_user_id": "<clerk_id>", // We set this to Clerk ID in RevenueCat
 *     "original_app_user_id": "<original_id>",
 *     "product_id": "pro_monthly" | "pro_yearly",
 *     "expiration_at_ms": 1234567890000,
 *     "store": "APP_STORE" | "PLAY_STORE",
 *     ...
 *   }
 * }
 */

// RevenueCat webhook endpoint
http.route({
  path: "/webhooks/revenuecat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Optional: Verify webhook signature
      // RevenueCat sends a signature in the Authorization header
      const authHeader = request.headers.get("Authorization");
      const expectedSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

      if (expectedSecret && authHeader) {
        // RevenueCat uses Bearer token format
        const providedSecret = authHeader.replace("Bearer ", "");
        if (providedSecret !== expectedSecret) {
          console.error("[RevenueCat Webhook] Invalid webhook secret");
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Parse the webhook payload
      const body = await request.json();
      const event = body.event;

      if (!event) {
        console.error("[RevenueCat Webhook] Missing event in payload");
        return new Response(JSON.stringify({ error: "Invalid payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const eventType = event.type as string;
      // app_user_id is the Clerk ID (set when configuring RevenueCat in the app)
      const clerkId = event.app_user_id as string;
      const productId = event.product_id as string;
      const expirationAtMs = event.expiration_at_ms as number | undefined;
      const originalTransactionId = event.original_transaction_id as
        | string
        | undefined;

      if (!clerkId) {
        console.error("[RevenueCat Webhook] Missing app_user_id (clerkId)");
        return new Response(
          JSON.stringify({ error: "Missing app_user_id" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.log(
        `[RevenueCat Webhook] Received event: ${eventType} for user: ${clerkId}`
      );

      // Handle different event types
      switch (eventType) {
        case "INITIAL_PURCHASE":
        case "UNCANCELLATION":
          // User purchased or reactivated subscription -> Grant Pro access
          await ctx.runMutation(internal.subscriptions.updateUserTierFromWebhook, {
            clerkId,
            tier: "pro",
            subscriptionId: originalTransactionId,
            expiresAt: expirationAtMs,
            status: "active",
          });
          break;

        case "RENEWAL":
          // Subscription renewed -> Extend Pro access
          await ctx.runMutation(internal.subscriptions.handleSubscriptionRenewal, {
            clerkId,
            subscriptionId: originalTransactionId ?? "",
            expiresAt: expirationAtMs ?? Date.now() + 30 * 24 * 60 * 60 * 1000,
          });
          break;

        case "CANCELLATION":
          // User cancelled -> Keep Pro until period ends
          await ctx.runMutation(
            internal.subscriptions.handleSubscriptionCancellation,
            {
              clerkId,
              expiresAt: expirationAtMs ?? Date.now(),
            }
          );
          break;

        case "EXPIRATION":
          // Subscription expired -> Revoke Pro access
          await ctx.runMutation(
            internal.subscriptions.handleSubscriptionExpiration,
            {
              clerkId,
            }
          );
          break;

        case "BILLING_ISSUE":
          // Payment failed -> Enter grace period
          await ctx.runMutation(internal.subscriptions.handleBillingIssue, {
            clerkId,
            gracePeriodExpiresAt: expirationAtMs,
          });
          break;

        case "PRODUCT_CHANGE":
          // User changed subscription tier
          // For now, treat any paid product as Pro
          const isPro = productId?.includes("pro") ?? false;
          await ctx.runMutation(internal.subscriptions.updateUserTierFromWebhook, {
            clerkId,
            tier: isPro ? "pro" : "free",
            subscriptionId: originalTransactionId,
            expiresAt: expirationAtMs,
            status: isPro ? "active" : "expired",
          });
          break;

        case "SUBSCRIBER_ALIAS":
        case "TRANSFER":
          // Identity-related events - log but no action needed
          console.log(
            `[RevenueCat Webhook] Identity event: ${eventType} for ${clerkId}`
          );
          break;

        default:
          console.log(
            `[RevenueCat Webhook] Unhandled event type: ${eventType}`
          );
      }

      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          event: eventType,
          userId: clerkId,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("[RevenueCat Webhook] Error processing webhook:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// Health check endpoint for the HTTP router
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
});

export default http;
