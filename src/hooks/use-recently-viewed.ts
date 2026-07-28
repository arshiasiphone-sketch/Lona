import { createContext, createElement, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface RecentlyViewedContextValue {
  ids: string[];
  track: (id: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "aeon-recently-viewed-v1";
const CAP = 20;

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, CAP)));
    } catch {
      /* swallow quota errors */
    }
  }, [ids]);

  const track = useCallback((id: string) => {
    setIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)];
      return next.slice(0, CAP);
    });
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({ ids, track, clear }),
    [ids, track, clear]
  );

  return createElement(RecentlyViewedContext.Provider, { value }, children);
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error("useRecentlyViewed must be used inside RecentlyViewedProvider");
  return ctx;
}
