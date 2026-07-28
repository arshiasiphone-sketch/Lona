/**
 * Device-session helper.
 *
 * Generates a stable, opaque device token once per browser via
 * `crypto.randomUUID()`. The token persists in localStorage and is
 * passed to every state-bearing Convex query so anonymous device
 * carts / wishlists / recently-viewed are reachable. On sign-in the
 * FE triggers `cart.mergeFromLocal` (and the wishlist + recent
 * equivalents) so the device rows flow into the user's session.
 */
import { useEffect, useState } from "react";

const STORAGE_KEY = "aeon.deviceSession.v1";

function mint(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for ancient browsers — entropy is "good enough" for a
  // device cart identifier; this is never used for security decisions.
  return `dev-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

/**
 * Read the persisted token once from localStorage, mint + persist
 * if missing. SSR-safe — returns null on the server.
 */
function readOrMint(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const fresh = mint();
    window.localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // Storage might be disabled (private mode, SSR, etc.) — mint
    // an in-memory id only and don't try to persist.
    return mint();
  }
}

/**
 * Returns the device session id once available. Always a string on
 * the client; `null` only during SSR / hydration until React reads
 * the cookie + storage.
 */
export function useDeviceSession(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    setId(readOrMint());
  }, []);
  return id;
}

/**
 * Imperative access for callers that need the id outside of React
 * (e.g. the merge-on-signin side-effect).
 */
export function readDeviceSession(): string {
  return readOrMint() ?? mint();
}
