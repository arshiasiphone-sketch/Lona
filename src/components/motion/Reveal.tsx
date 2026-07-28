import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import type { ReactNode } from "react";
import { EASE_LUXURY } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Direction of the reveal */
  from?: "up" | "down" | "left" | "right";
  /** Distance in px to travel */
  distance?: number;
  /** Duration in seconds */
  duration?: number;
  /** Trigger once or every time */
  once?: boolean;
  /** Element override */
  as?: "div" | "section" | "article" | "header" | "figure" | "li";
}

const offsetFromDirection = (dir: RevealProps["from"], dist: number) => {
  switch (dir) {
    case "down":
      return { y: -dist, x: 0 };
    case "left":
      return { x: dist, y: 0 };
    case "right":
      return { x: -dist, y: 0 };
    default:
      return { y: dist, x: 0 };
  }
};

export function Reveal({
  children,
  delay = 0,
  className,
  from = "up",
  distance = 22,
  duration = 0.7,
  once = true,
  as = "div",
}: RevealProps) {
  const { ref, inView } = useInView({ triggerOnce: once, threshold: 0.15 });
  const MotionTag = motion[as] as typeof motion.div;
  const offset = offsetFromDirection(from, distance);
  return (
    <MotionTag
      ref={ref}
      initial={{ opacity: 0, ...offset }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, ...offset }}
      transition={{ duration, ease: EASE_LUXURY, delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
