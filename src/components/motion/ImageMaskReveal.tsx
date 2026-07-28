import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { ReactNode } from "react";
import type { Variants } from "framer-motion";
import { maskReveal, maskRevealSideways, EASE_LUXURY } from "@/lib/motion";

type Direction = "up" | "left" | "right";

interface ImageMaskRevealProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  innerClassName?: string;
  /** Default 0.5 — how much of the element must be visible */
  threshold?: number;
}

const rightVariant: Variants = {
  hidden: { clipPath: "inset(0 0 0 100%)", opacity: 0.6 },
  visible: {
    clipPath: "inset(0 0 0 0%)",
    opacity: 1,
    transition: { duration: 1.6, ease: EASE_LUXURY, delay: 0 },
  },
};

/**
 * Reveals an image / plate by sliding a clip-path mask.
 * Used by Hero plates, editorial images, and section feature plates.
 */
export function ImageMaskReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  innerClassName,
  threshold = 0.4,
}: ImageMaskRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: threshold });

  const variants: Variants =
    direction === "left"
      ? maskRevealSideways
      : direction === "right"
      ? rightVariant
      : (maskReveal as Variants);

  // When delay is non-zero we apply it via inline transition.
  const transition =
    delay > 0 ? { delay } : undefined;

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={variants}
        className={innerClassName}
        transition={transition}
        style={{ willChange: "clip-path, opacity" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
