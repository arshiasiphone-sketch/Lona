import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useReducedMotionStrict } from "@/hooks/use-prefers-reduced-motion";

interface PressScaleProps {
  children: ReactNode;
  scale?: number;
  className?: string;
}

/**
 * Generic press-scale wrapper. Used over buttons / interactive surfaces.
 */
export function PressScale({ children, scale = 0.97, className }: PressScaleProps) {
  const reduced = useReducedMotionStrict();
  return (
    <motion.div
      whileTap={reduced ? undefined : { scale }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
