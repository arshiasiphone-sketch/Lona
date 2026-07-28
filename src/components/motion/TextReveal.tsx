import { motion, useInView } from "framer-motion";
import { useRef, useMemo } from "react";
import type { ReactNode } from "react";
import {
  textRevealContainer,
  textRevealWord,
  EASE_OUT_SOFT,
} from "@/lib/motion";
import { useReducedMotionStrict } from "@/hooks/use-prefers-reduced-motion";

interface TextRevealProps {
  children: string;
  className?: string;
  /** Stagger between words */
  stagger?: number;
  /** Stagger between letters (overrides words) */
  as?: "words" | "letters";
  /** Element wrapping each token */
  tokenAs?: "span" | "div";
  /** Trigger once or every time */
  once?: boolean;
  /** Container element */
  asRoot?: "p" | "h1" | "h2" | "h3" | "div" | "span";
  /** Custom delay before stagger starts */
  delay?: number;
}

interface TokenProps {
  text: string;
  baseY?: number;
  index: number;
  stagger: number;
  reduced: boolean;
  custom?: number;
}

/**
 * Word-by-word (or letter-by-letter) text reveal.
 * Accessibility: each token retains its semantic content. Render as a single
 * readable string for screen readers via aria-label fallback.
 */
export function TextReveal({
  children,
  className,
  stagger = 0.04,
  as = "words",
  tokenAs = "span",
  once = true,
  asRoot = "div",
  delay = 0,
}: TextRevealProps) {
  const reduced = useReducedMotionStrict();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once, amount: 0.3 });

  const tokens = useMemo(
    () => (as === "letters" ? Array.from(children) : children.split(/(\s+)/)),
    [children, as]
  );

  const container = textRevealContainer(stagger, delay);

  const RootMotion = motion[asRoot] as typeof motion.div;
  const MotionToken = motion[tokenAs] as typeof motion.span;

  return (
    <RootMotion
      ref={ref}
      variants={container}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
      aria-label={children}
      style={{ willChange: "transform" }}
    >
      {tokens.map((tk, i) => {
        if (/^\s+$/.test(tk)) {
          return (
            <MotionToken key={`sp-${i}`} aria-hidden="true">
              {tk}
            </MotionToken>
          );
        }
        return (
          <MotionToken
            key={`tk-${i}`}
            custom={i}
            variants={textRevealWord}
            style={{
              display: "inline-block",
              willChange: "transform, opacity",
            }}
            transition={{ ease: EASE_OUT_SOFT }}
          >
            {tk}
          </MotionToken>
        );
      })}
      {reduced && (
        <span aria-hidden="true" className="sr-only">{children}</span>
      )}
    </RootMotion>
  );
}

interface ParagraphRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Reveals each immediate child paragraph at 80ms intervals.
 * Used for BrandManifesto longform copy.
 */
export function ParagraphReveal({ children, className, delay = 0 }: ParagraphRevealProps) {
  const reduced = useReducedMotionStrict();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={textRevealContainer(0.12, delay)}
      style={{ willChange: "transform" }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={textRevealWord}
              custom={i}
              transition={{ ease: EASE_OUT_SOFT }}
              style={{ willChange: "transform, opacity" }}
            >
              {child}
            </motion.div>
          ))
        : (
          <motion.div
            variants={textRevealWord}
            transition={{ ease: EASE_OUT_SOFT }}
          >
            {children}
          </motion.div>
        )}
      {reduced && <span aria-hidden="true" className="sr-only">{(children as React.ReactNode[] | ReactNode) ?? ""}</span>}
    </motion.div>
  );
}
