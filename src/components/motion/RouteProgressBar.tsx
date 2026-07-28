import { Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotionStrict } from "@/hooks/use-prefers-reduced-motion";
import { EASE_LUXURY } from "@/lib/motion";

/**
 * Tiny route-change progress bar. Listens for location changes,
 * animates a bar 0 → 100% over ~700ms then fades.
 */
export function RouteProgressBar() {
  const reduced = useReducedMotionStrict();
  const location = useLocation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (reduced) return;
    setActive(true);
    const t1 = setTimeout(() => setActive(false), 700);
    return () => clearTimeout(t1);
  }, [location.pathname, reduced]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={`rb-${location.pathname}`}
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.85, ease: EASE_LUXURY }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[61] h-[2px] bg-primary/85 shadow-[0_0_8px_rgba(60,90,140,0.35)]"
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}

/* ---------- SmoothScrollProvider  --------------------------------- */

/**
 * Native smooth-scroll substitute for Lenis — purely CSS-driven,
 * so it remains buttery without an extra library. Also reuses the OS
 * anchor system so deep-links still resolve correctly.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.add("scroll-smooth-luxe");
    return () => {
      document.documentElement.classList.remove("scroll-smooth-luxe");
    };
  }, []);
  return <Suspense fallback={null}>{children}</Suspense>;
}
