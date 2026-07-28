/**
 * Wishlist — Convex-backed.
 *
 * Same public surface as the legacy localStorage implementation
 * ({ ids, has, toggle, remove, clear }) so the locked UI keeps working.
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

interface WishlistContextValue {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const sessionId = useDeviceSession();
  const remote = useQuery(
    api.wishlist.getMine,
    sessionId ? { sessionId } : "skip"
  );

  const toggleWish = useMutation(api.wishlist.toggle);
  const removeWish = useMutation(api.wishlist.remove);
  const clearWish = useMutation(api.wishlist.clear);

  const ids = useMemo(() => remote?.productIds ?? [], [remote]);

  const has = useCallback(
    (id: string) => ids.includes(id),
    [ids]
  );

  const toggle = useCallback(
    (id: string) => {
      if (!sessionId) return;
      void toggleWish({ sessionId, productId: id });
    },
    [sessionId, toggleWish]
  );

  const remove = useCallback(
    (id: string) => {
      if (!sessionId) return;
      void removeWish({ sessionId, productId: id });
    },
    [sessionId, removeWish]
  );

  const clear = useCallback(() => {
    if (!sessionId) return;
    void clearWish({ sessionId });
  }, [sessionId, clearWish]);

  const value: WishlistContextValue = { ids, has, toggle, remove, clear };
  return createElement(WishlistContext.Provider, { value }, children);
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
