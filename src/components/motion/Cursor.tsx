import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";
import { useCursor } from "@/hooks/use-cursor";
import { useReducedMotionStrict } from "@/hooks/use-prefers-reduced-motion";

/**
 * Premium custom cursor.
 * - Dot follows pointer exactly (spring snap)
 * - Ring follows pointer with damping
 * - Modes: default / link / image / drag / hidden
 * - Disables when prefers-reduced-motion OR coarse pointer
 * - Hides OS cursor via .cursor-luxe class on root (set by use-cursor)
 */
export function Cursor() {
  const reduced = useReducedMotionStrict();
  const { mode, systemOverride } = useCursor();

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 220, damping: 22, mass: 0.9 });
  const ringY = useSpring(y, { stiffness: 220, damping: 22, mass: 0.9 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reduced || mode === "hidden") return;
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y, reduced, mode]);

  if (reduced || mode === "hidden") return null;
  if (systemOverride) return null;

  const sizeByMode = {
    default: 8,
    link: 36,
    image: 64,
    drag: 56,
    hidden: 0,
  } as const;

  // The dot never resizes
  return (
    <>
      {/* Dot — sharp follower */}
      <motion.div
        aria-hidden="true"
        style={{
          x,
          y,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-2 w-2 rounded-full bg-ink mix-blend-difference"
      />
      {/* Ring — damped follower */}
      <motion.div
        aria-hidden="true"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{ width: sizeByMode[mode], height: sizeByMode[mode] }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="pointer-events-none fixed left-0 top-0 z-[99] rounded-full border border-ink/60 mix-blend-difference"
      />
    </>
  );
}
