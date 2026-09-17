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
/** How long after a claim a `release` may still undo it. */
export const OTP_RELEASE_GRACE_MS = 15 * 1000;

export const claim = internalMutation({
  args: { phone: v.string() },
  handler: async (ctx, { phone }): Promise<{ ok: true; retryAfterMs?: number }> => {
    const now = Date.now();
    const windowStart = now - OTP_WINDOW_MS;

    const rows = await ctx.db
      .query("otp_send_log")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .collect();

    // Prune everything outside the window (cheap: bounded by the burst cap).
    const recent: { _id: unknown; at: number }[] = [];
    for (const row of rows) {
      if (row.at > windowStart) recent.push(row);
      else await ctx.db.delete(row._id);
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

/**
 * Controlled retry window for a claim that never produced an SMS.
 *
 * If the Kavenegar call fails (transport error, provider rejection,
 * missing configuration), the send did NOT happen — so it must not count
 * against the number's quota and the user must not be stuck behind the
 * 60-second cooldown for a message they never received.
 *
 * Safety: only the claim made a few seconds ago by THIS send request is
 * removed. Older claims (i.e. sends that actually succeeded) are left
 * alone, and the mutation is internal — reachable only by the auth
 * provider. A client can therefore never invalidate a code that was
 * genuinely delivered, nor reset its burst window.
 */
export const release = internalMutation({
  args: { phone: v.string() },
  handler: async (ctx, { phone }): Promise<{ ok: true }> => {
    const now = Date.now();
    const rows = await ctx.db
      .query("otp_send_log")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .collect();

    const latest = rows.reduce<typeof rows[number] | null>(
      (newest, row) => (!newest || row.at > newest.at ? row : newest),
      null,
    );

    if (latest && now - latest.at <= OTP_RELEASE_GRACE_MS) {
      await ctx.db.delete(latest._id);
    }
    return { ok: true };
  },
});
