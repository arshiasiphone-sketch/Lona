/**
 * LONA — server-side OTP send throttle.
 *
 * The login UI shows a 60-second resend countdown, but a UI timer is
 * advisory: nothing stops a client from calling `signIn("phone", …)`
 * directly. This mutation is the authoritative limit — it runs on the
 * Convex backend before any SMS leaves the building.
 *
 * Policy (per canonical phone number, sliding window):
 *   • minimum 60s between two sends
 *   • at most 5 sends per 15 minutes
 *
 * Rows are pruned on every write, so the table stays tiny without a cron.
 * Only the canonical phone and a timestamp are stored — never the code.
 */

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/** Minimum gap between two codes for the same number. */
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
/** Sliding window for the burst limit. */
export const OTP_WINDOW_MS = 15 * 60 * 1000;
/** Maximum codes issued per number inside `OTP_WINDOW_MS`. */
export const OTP_MAX_PER_WINDOW = 5;

export const claim = internalMutation({
  args: { phone: v.string() },
  handler: async (ctx, { phone }): Promise<{ ok: true; retryAfterMs?: number }> => {
    const now = Date.now();
    const windowStart = now - OTP_WINDOW_MS;

    const recent = (
      await ctx.db
        .query("otp_send_log")
        .withIndex("by_phone", (q) => q.eq("phone", phone))
        .collect()
    ).filter((row) => row.at > windowStart);

    // Prune everything outside the window (cheap: bounded by the burst cap).
    const stale = await ctx.db
      .query("otp_send_log")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .collect();
    for (const row of stale) {
      if (row.at <= windowStart) await ctx.db.delete(row._id);
    }

    const last = recent.reduce(
      (latest, row) => (row.at > latest ? row.at : latest),
      0,
    );
    if (last && now - last < OTP_RESEND_COOLDOWN_MS) {
      throw new Error("OTP_RATE_LIMITED");
    }
    if (recent.length >= OTP_MAX_PER_WINDOW) {
      throw new Error("OTP_RATE_LIMITED");
    }

    await ctx.db.insert("otp_send_log", { phone, at: now });
    return { ok: true };
  },
});
