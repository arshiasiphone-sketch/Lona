import { query } from "./_generated/server";
import { requirePermission } from "./admin";

/**
 * Browserless is an admin-side capability. Keep the authorization check in a
 * regular query so the Node action can preserve the caller's auth context
 * before it contacts the external service.
 */
export const canUse = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_content");
    return true;
  },
});
