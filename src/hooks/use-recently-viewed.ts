/**
 * Recently-viewed — Convex-backed.
 *
 * Same public API ({ ids, track, clear }) as the legacy implementation.
 * Cap is enforced server-side (20).
 */
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useDeviceSession } from "@/lib/data/session";

interface RecentlyViewedContextValue {
  ids: string[];
  track: (id: string) => void;
  clear: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const sessionId = useDeviceSession();
  const remote = useQuery(
    api.recentlyViewed.getMine,
    sessionId ? { sessionId } : "skip"
  );

  const trackView = useMutation(api.recentlyViewed.track);
  const clearView = useMutation(api.recentlyViewed.clear);

  const ids = useMemo(() => remote?.productIds ?? [], [remote]);

  const track = useCallback(
    (id: string) => {
      if (!sessionId) return;
      void trackView({ sessionId, productId: id });
    },
    [sessionId, trackView]
  );

  const clear = useCallback(() => {
    if (!sessionId) return;
    void clearView({ sessionId });
  }, [sessionId, clearView]);

  const value: RecentlyViewedContextValue = { ids, track, clear };
  return createElement(RecentlyViewedContext.Provider, { value }, children);
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error(
    "useRecentlyViewed must be used inside RecentlyViewedProvider"
  );
  return ctx;
}
