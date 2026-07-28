import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface OverlayContextValue {
  sideCartOpen: boolean;
  openSideCart: () => void;
  closeSideCart: () => void;
  toggleSideCart: () => void;

  commandOpen: boolean;
  openCommand: () => void;
  closeCommand: () => void;
  toggleCommand: () => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [sideCartOpen, setSideCartOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Cmd-K / Ctrl-K listener, globally registered once.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((s) => !s);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
        setSideCartOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo<OverlayContextValue>(
    () => ({
      sideCartOpen,
      openSideCart: () => setSideCartOpen(true),
      closeSideCart: () => setSideCartOpen(false),
      toggleSideCart: () => setSideCartOpen((s) => !s),
      commandOpen,
      openCommand: () => setCommandOpen(true),
      closeCommand: () => setCommandOpen(false),
      toggleCommand: () => setCommandOpen((s) => !s),
    }),
    [sideCartOpen, commandOpen]
  );

  return createElement(OverlayContext.Provider, { value }, children);
}

export function useOverlay(): OverlayContextValue {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used inside OverlayProvider");
  return ctx;
}
