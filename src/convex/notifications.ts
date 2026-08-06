/**
 * Phase 8.1 — notification foundation.
 *
 * Abstraction layer for every outbound notification (SMS / email /
 * push). Providers are NOT connected yet — the row insert into the
 * `notifications` table is the durable inbox, and `dispatch` is the
 * provider hook that future integrations (SMS, email, push) will
 * fill in. Keeping dispatch separate means wiring a provider never
 * touches the order/cart domains.
 *
 * Events emitted by the commerce core:
 *   order_created / payment_success / payment_failed /
 *   order_shipped / order_completed / order_cancelled
 */
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export type NotificationKind =
  | "order"
  | "back_in_stock"
  | "editorial"
  | "system"
  | "ticket"
  | "return"
  | "coupon";

/**
 * Record a notification row for a user. Fire-and-forget: never throw
 * into the calling mutation — a failed notification must not fail an
 * order.
 */
export async function recordNotification(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    kind: NotificationKind;
    title: string;
    body: string;
    link?: string;
  }
): Promise<void> {
  try {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      kind: args.kind,
      title: args.title,
      body: args.body,
      link: args.link,
      read: false,
      createdAt: Date.now(),
    });
  } catch {
    // Notifications are best-effort — swallow write failures.
  }
}

/**
 * Provider dispatch hook — intentionally a no-op today.
 *
 * Future SMS / email / push providers register here and receive the
 * same normalized payload, so adding a provider is a one-file change:
 *   1. add the provider to `dispatch`
 *   2. wire its API key through a Convex action reading `process.env`
 *
 * The `notifications` rows are the durable fallback regardless.
 */
export async function dispatch(
  _ctx: MutationCtx,
  _args: {
    userId: Id<"users">;
    kind: NotificationKind;
    title: string;
    body: string;
    link?: string;
  }
): Promise<void> {
  // Placeholder — no provider connected yet.
}
