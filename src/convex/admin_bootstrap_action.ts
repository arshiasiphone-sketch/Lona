"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * The only public bootstrap entry point. Configure ADMIN_BOOTSTRAP_SECRET
 * in the Convex environment, then run this action once with that secret.
 * The secret is never stored in the database and the underlying mutation
 * remains internal.
 */
export const bootstrapOwner = action({
  args: { secret: v.string(), email: v.string() },
  handler: async (ctx, { secret, email }): Promise<{ id: Id<"users">; role: "owner" }> => {
    const configured = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!configured || secret !== configured) throw new Error("BOOTSTRAP_SECRET_INVALID");
    return await ctx.runMutation(internal.admin_bootstrap.claimOwner, { email });
  },
});
