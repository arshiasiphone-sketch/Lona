import { motion } from "framer-motion";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { useReducedMotionStrict } from "@/hooks/use-prefers-reduced-motion";

/**
 * Page scroll progress — thin glassy bar pinned to the top of the viewport.
 * Lives outside PageShell so it appears above all overlays.
 */
export function ScrollProgress() {
  const reduced = useReducedMotionStrict();
  const progress = useScrollProgress();

  return (
    <motion.div
      aria-hidden="true"
      style={{
        scaleX: reduced ? 0 : progress,
        transformOrigin: "0% 50%",
        willChange: "transform",
        opacity: reduced ? 0 : progress > 0.01 ? 1 : 0,
      }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-primary/85 shadow-[0_0_10px_rgba(60,90,140,0.45)]"
    />
  );
}
