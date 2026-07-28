import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useReducedMotionStrict } from "@/hooks/use-prefers-reduced-motion";

interface FlyRequest {
  id: string;
  image: string;
  from: { x: number; y: number; width: number; height: number };
  to: { x: number; y: number };
  label?: string;
}

/**
 * Global "fly to bag" portal. Any client can dispatch a `flyToBag` event with
 * a product identifier and a source rect; this component renders a small
 * thumbnail that animates toward the bag icon and disappears.
 *
 * Mount once via `<FlyToBagRenderer />` near the root — it portals into body.
 */
export function FlyToBagRenderer() {
  const reduced = useReducedMotionStrict();
  const [active, setActive] = useState<FlyRequest | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<FlyRequest>).detail;
      if (!detail) return;
      setActive(detail);
    };
    window.addEventListener("aeon:fly-to-bag", handler as EventListener);
    return () =>
      window.removeEventListener("aeon:fly-to-bag", handler as EventListener);
  }, []);

  useEffect(() => {
    if (!active || reduced) return;
    const t = setTimeout(() => setActive(null), 1100);
    return () => clearTimeout(t);
  }, [active, reduced]);

  if (reduced) return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.id}
          initial={{
            x: active.from.x + active.from.width / 2 - 36,
            y: active.from.y + active.from.height / 2 - 36,
            scale: 1,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: active.to.x - 36,
            y: active.to.y - 36,
            scale: 0.2,
            opacity: 0.6,
            rotate: -28,
          }}
          exit={{
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: 0.95,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="pointer-events-none fixed left-0 top-0 z-[200] h-[72px] w-[72px] overflow-hidden rounded-full ring-1 ring-inset ring-white/55 shadow-float"
          style={{
            backgroundImage: active.image,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}

/**
 * Hook helper — lets callers fire a fly-to-bag from any source.
 * Reads the source rect from the supplied element, finds the topmost bag icon
 * via data attribute `[data-bag-target]`, and dispatches the event.
 */
export function useFlyToBag() {
  const flightInFlight = useRef(false);
  return (source: HTMLElement | null, opts: { image: string; label?: string }) => {
    if (!source || flightInFlight.current) return;
    const rect = source.getBoundingClientRect();
    const target =
      document.querySelector<HTMLElement>("[data-bag-target]") ?? null;
    const toRect = target?.getBoundingClientRect() ?? {
      left: window.innerWidth - 80,
      top: 80,
      width: 0,
      height: 0,
    };
    flightInFlight.current = true;
    window.dispatchEvent(
      new CustomEvent("aeon:fly-to-bag", {
        detail: {
          id: `${Date.now()}-fly`,
          image: opts.image,
          label: opts.label,
          from: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
          to: { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 },
        },
      })
    );
    setTimeout(() => {
      flightInFlight.current = false;
    }, 1200);
  };
}
