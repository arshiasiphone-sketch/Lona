import { useEffect, useRef, useState } from "react";

/**
 * Returns normalized scroll progress of either window or a referenced element.
 *  - 0 = top
 *  - 1 = bottom
 *
 * Uses RAF for smooth updates, not the raw scroll event which clogs the main thread.
 */
export function useScrollProgress(
  ref?: React.RefObject<HTMLElement | null>,
  options: { offset?: { start?: number; end?: number } } = {}
) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref?.current;
    const start = options.offset?.start ?? 0;
    const end = options.offset?.end ?? 0;

    const compute = () => {
      if (el) {
        const rect = el.getBoundingClientRect();
        const total = rect.height - (window.innerHeight || 0);
        const passed = -rect.top - start;
        const denom = total - (end - start);
        if (denom <= 0) {
          setProgress(rect.top < 0 ? 1 : 0);
          return;
        }
        setProgress(Math.min(1, Math.max(0, passed / denom)));
      } else {
        const total = (document.documentElement.scrollHeight || 0) - window.innerHeight;
        const passed = window.scrollY - start;
        const denom = total - (end - start);
        if (denom <= 0) {
          setProgress(window.scrollY > 0 ? 1 : 0);
          return;
        }
        setProgress(Math.min(1, Math.max(0, passed / denom)));
      }
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        compute();
        rafRef.current = null;
      });
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ref, options.offset?.start, options.offset?.end]);

  return progress;
}
