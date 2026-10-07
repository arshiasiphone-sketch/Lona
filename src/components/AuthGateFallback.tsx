/**
 * Recovery for the "auth gate spins forever" state.
 *
 * Root cause (verified against the @convex-dev/auth + convex sources):
 * when a device holds a stale session — an expired JWT plus a refresh
 * token the backend no longer accepts (e.g. after server-side session
 * cleanup, or a sign-in from an older deployment) — the library's
 * background token refresh THROWS inside Convex's AuthenticationManager.
 * That rejection is never reported back to React, so
 * `useConvexAuth().isLoading` stays `true` forever, the Convex WebSocket
 * is left stopped, and every `<RequireAuth>` route shows an endless
 * spinner instead of redirecting to /auth. iOS Safari/Chrome are the
 * visible victims because their localStorage still holds tokens from an
 * old sign-in, while freshly signed-in devices never hit the path.
 *
 * The guard below gives the auth state a bounded window to resolve:
 *   • expired stored credentials → clear them and hard-navigate to
 *     /auth for a clean OTP sign-in (standard "invalid session"
 *     recovery — a healthy session always keeps an unexpired JWT in
 *     storage, so this never logs out a working device);
 *   • unexpired credentials but still unresolved (slow/blocked
 *     network) → render a visible retry fallback instead of a spinner.
 */
import { useEffect, useRef, useState } from "react";
import { Loader2, WifiOff } from "lucide-react";

/** How long the auth gate may stay unresolved before recovering. */
const STUCK_TIMEOUT_MS = 8_000;

/** 30s leeway when judging a stored JWT's `exp`. */
const JWT_LEEWAY_S = 30;

const AUTH_KEY_PATTERN = /^__convexAuth(?:JWT|RefreshToken|OAuthVerifier)_/;

function decodeJwtExpiry(jwt: string): number | null {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const exp = JSON.parse(json)?.exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

/** True when some stored JWT is still valid — i.e. a healthy device. */
function hasFreshStoredJwt(): boolean {
  try {
    const nowS = Date.now() / 1000 + JWT_LEEWAY_S;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("__convexAuthJWT_")) continue;
      const value = localStorage.getItem(key);
      if (!value) continue;
      const exp = decodeJwtExpiry(value);
      if (exp === null || exp > nowS) return true;
    }
  } catch {
    // Storage unavailable — assume credentials may be fine.
    return true;
  }
  return false;
}

function clearStoredAuthKeys(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && AUTH_KEY_PATTERN.test(key)) doomed.push(key);
    }
    doomed.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Best effort only.
  }
}

/**
 * Runs while `isLoading` is true. Returns `timedOut` when the auth
 * state failed to resolve within the window AND the stored session
 * looked healthy (so a retry is meaningful). Expired-credential
 * devices are recovered automatically via a hard redirect to /auth.
 */
export function useAuthStuckGuard(isLoading: boolean): boolean {
  const [timedOut, setTimedOut] = useState(false);
  const recovering = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }
    if (recovering.current) return;

    const timer = setTimeout(() => {
      if (!hasFreshStoredJwt()) {
        // Stale session the library cannot refresh — clean slate.
        recovering.current = true;
        clearStoredAuthKeys();
        const returnTo = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        window.location.replace(`/auth?returnTo=${returnTo}`);
        return;
      }
      setTimedOut(true);
    }, STUCK_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [isLoading]);

  return timedOut;
}

/** Fallback UI shown instead of an eternal spinner after the timeout. */
export function AuthGateFallback({ returnTo }: { returnTo: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <WifiOff className="size-6 text-muted-foreground" />
      <div>
        <p className="font-display text-xl text-ink">اتصال برقرار نشد</p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">
          حساب کاربری بارگیری نشد. اتصال اینترنت را بررسی کنید و دوباره
          تلاش کنید.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
        >
          تلاش دوباره
        </button>
        <button
          onClick={() => {
            window.location.replace(
              `/auth?returnTo=${encodeURIComponent(returnTo)}`,
            );
          }}
          className="rounded-full hairline bg-canvas/60 px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-ink-soft transition hover:bg-white hover:text-ink"
        >
          صفحه ورود
        </button>
      </div>
    </main>
  );
}

/** Small centered spinner shared by the two auth gates. */
export function AuthGateSpinner() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </main>
  );
}
