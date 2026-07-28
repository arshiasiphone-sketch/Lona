import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import type { ReactNode } from "react";
import { useReducedMotionStrict } from "@/hooks/use-prefers-reduced-motion";
import { SPRING_GENTLE } from "@/lib/motion";

interface MagneticHoverProps {
  children: ReactNode;
  className?: string;
  /** Maximum translate in px on either axis. Default 8. */
  maxTranslate?: number;
  /** Damping intensity 0..1 (default 0.4) */
  strength?: number;
  /** Disables pointer-attraction but still applies hover-lift */
  passive?: boolean;
}

/**
 * Magnetic-hover wrapper. Children are translated toward the pointer on hover
 * and snapped back on leave. Disabled on reduced-motion devices.
 *
 * Uses motion-value + spring for buttery tracking — no re-renders per frame.
 */
export function MagneticHover({
  children,
  className,
  maxTranslate = 8,
  strength = 1,
  passive = false,
}: MagneticHoverProps) {
  const reduced = useReducedMotionStrict();
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING_GENTLE);
  const springY = useSpring(y, SPRING_GENTLE);
  const [hovered, setHovered] = useState(false);

  const handleMove = useCallback(
    (event: MouseEvent) => {
      if (passive || reduced) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
      const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
      x.set(offsetX * 2 * maxTranslate * strength);
      y.set(offsetY * 2 * maxTranslate * strength);
    },
    [x, y, maxTranslate, strength, passive, reduced]
  );

  const handleLeave = useCallback(() => {
    setHovered(false);
    x.set(0);
    y.set(0);
  }, [x, y]);

  const handleEnter = useCallback(() => {
    setHovered(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    el.addEventListener("mouseenter", handleEnter);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
      el.removeEventListener("mouseenter", handleEnter);
    };
  }, [handleMove, handleLeave, handleEnter]);

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY, willChange: "transform" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      data-magnetic="1"
    >
      {children}
    </motion.div>
  );
}
