import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface CartLine {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  add: (line: CartLine) => void;
  remove: (productId: string, size: string, color: string) => void;
  update: (productId: string, size: string, color: string, qty: number) => void;
  clear: () => void;
}

const STORAGE_KEY = "aeon-cart-v1";

const CartContext = createContext<CartContextValue | null>(null);

const sameLine = (a: CartLine, b: CartLine) =>
  a.productId === b.productId && a.size === b.size && a.color === b.color;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* swallow quota errors */
    }
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
    return {
      lines,
      itemCount,
      add: (line) => {
        setLines((prev) => {
          const idx = prev.findIndex((l) => sameLine(l, line));
          if (idx >= 0) {
            const copy = prev.slice();
            copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + line.quantity };
            return copy;
          }
          return [...prev, line];
        });
      },
      remove: (productId, size, color) =>
        setLines((prev) =>
          prev.filter((l) => !sameLine(l, { productId, size, color, quantity: 0 }))
        ),
      update: (productId, size, color, qty) =>
        setLines((prev) =>
          prev
            .map((l) =>
              sameLine(l, { productId, size, color, quantity: 0 })
                ? { ...l, quantity: Math.max(0, qty) }
                : l
            )
            .filter((l) => l.quantity > 0)
        ),
      clear: () => setLines([]),
    };
  }, [lines]);

  return createElement(CartContext.Provider, { value }, children);
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
