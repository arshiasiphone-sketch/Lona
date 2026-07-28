import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotionStrict } from "@/hooks/use-prefers-reduced-motion";

interface HoverGlowProps {
  children: ReactNode;
  className?: string;
  /** Glow intensity 0..1 (default 0.6) */
  intensity?: number;
  /** Glow radius in pixels (default 280) */
  radius?: number;
}

import type { ReactNode } from "react";

/**
 * Adds a radial glow that follows the pointer inside its bounds.
 * Useful for glass cards/buttons to give premium ambient lighting.
 */
export function HoverGlow({
  children,
  className,
  intensity = 0.6,
  radius = 280,
}: HoverGlowProps) {
  const reduced = useReducedMotionStrict();
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const sx = useSpring(x, { stiffness: 220, damping: 28, mass: 0.7 });
  const sy = useSpring(y, { stiffness: 220, damping: 28, mass: 0.7 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        setActive(false);
        return;
      }
      setActive(true);
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
    };
    const onLeave = () => setActive(false);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [x, y]);

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <motion.div
        aria-hidden="true"
        style={{
          x: sx,
          y: sy,
          width: radius,
          height: radius,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{ opacity: active ? intensity : 0, scale: active ? 1 : 0.4 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute left-0 top-0 rounded-full bg-primary/25 blur-3xl mix-blend-multiply"
      />
      {children}
    </div>
  );
}
