"use node";

import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values";

const BROWSERLESS_ENDPOINT = "https://production-sfo.browserless.io";
const MAX_OUTPUT_BYTES = 12 * 1024 * 1024;

/**
 * Render a public URL through Browserless without exposing the service token
 * to the browser. The caller must have the content-management permission.
 * Results are returned as base64 because Convex action results are JSON values.
 */
export const render = action({
  args: {
    url: v.string(),
    format: v.union(v.literal("screenshot"), v.literal("pdf")),
    fullPage: v.optional(v.boolean()),
  },
  handler: async (ctx, { url, format, fullPage }) => {
    await ctx.runQuery(api.browserlessAccess.canUse, {});

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error("INVALID_URL");
    }
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      throw new Error("INVALID_URL_PROTOCOL");
    }

    const token = process.env.BROWSERLESS_TOKEN;
    if (!token) {
      throw new Error("BROWSERLESS_NOT_CONFIGURED");
    }

    const endpoint = `${BROWSERLESS_ENDPOINT}/${format}?token=${encodeURIComponent(token)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: parsedUrl.toString(),
        options: format === "screenshot"
          ? { fullPage: fullPage ?? true }
          : { printBackground: true },
      }),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`BROWSERLESS_REQUEST_FAILED:${response.status}:${detail}`);
    }

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_OUTPUT_BYTES) {
      throw new Error("BROWSERLESS_OUTPUT_TOO_LARGE");
    }

    return {
      format,
      contentType: format === "pdf" ? "application/pdf" : "image/png",
      data: Buffer.from(bytes).toString("base64"),
    } as const;
  },
});
