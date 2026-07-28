import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import {
  revealUp,
  EASE_LUXURY,
  textRevealContainer,
} from "@/lib/motion";
import { useReducedMotionStrict } from "@/hooks/use-prefers-reduced-motion";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  /** Distance in px (default 24) */
  distance?: number;
  /** Delay in s (default 0) */
  delay?: number;
  /** Internal stagger between siblings (default 0) */
  stagger?: number;
  /** Container tag */
  as?: "div" | "section" | "article" | "header" | "figure" | "ul";
  /** Once or every time */
  once?: boolean;
}

/**
 * Higher-level reveal wrapper for sections — ref-aware parent + per-child stagger.
 * Falls back to static markup when reduced motion is preferred.
 */
export function SectionReveal({
  children,
  className,
  distance = 24,
  delay = 0,
  stagger = 0,
  as = "section",
  once = true,
}: SectionRevealProps) {
  const reduced = useReducedMotionStrict();
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once, amount: 0.2 });

  const MotionRoot = motion[as] as typeof motion.section;
  const container = stagger > 0 ? textRevealContainer(stagger, delay) : undefined;

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <MotionRoot
      ref={ref as React.Ref<HTMLElement>}
      variants={container ?? {
        hidden: {},
        visible: {},
      }}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      <motion.div
        variants={revealUp}
        custom={distance}
        transition={{ duration: 0.85, ease: EASE_LUXURY, delay }}
        style={{ willChange: "transform, opacity" }}
      >
        {children}
      </motion.div>
    </MotionRoot>
  );
}
