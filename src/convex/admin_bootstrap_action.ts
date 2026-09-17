"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * The only public bootstrap entry point. Configure ADMIN_BOOTSTRAP_SECRET
 * in the Convex environment, then run this action ONCE with that secret
 * and the identity of the first owner:
 *
 *   # phone-first — the row already exists because the owner signed in
 *   # with SMS OTP
 *   npx convex run admin_bootstrap_action:bootstrapOwner \
 *     '{"secret":"…","phone":"09121234567"}'
 *
 *   # legacy email account + the mobile that should own it
 *   npx convex run admin_bootstrap_action:bootstrapOwner \
 *     '{"secret":"…","email":"owner@example.com","phone":"09121234567"}'
 *
 * The secret is never stored in the database and the underlying mutation
 * stays internal. The phone is normalized server-side before use.
 *
 * The same action also re-attaches a mobile to an ALREADY-existing owner
 * (the phone-migration path for an account that only had an email), in
 * which case the role is returned unchanged and never elevated.
 */
export const bootstrapOwner = action({
  args: {
    secret: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { secret, email, phone },
  ): Promise<{ id: Id<"users">; role: "owner" | "admin" }> => {
    const configured = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!configured || secret !== configured) throw new Error("BOOTSTRAP_SECRET_INVALID");
    return await ctx.runMutation(internal.admin_bootstrap.claimOwner, {
      email,
      phone,
    });
  },
});
