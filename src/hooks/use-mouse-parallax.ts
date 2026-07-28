import { useEffect, useRef, useState } from "react";

export interface MouseState {
  /** Normalised x in [-1, 1] related to viewport center */
  x: number;
  /** Normalised y in [-1, 1] related to viewport center */
  y: number;
  /** Raw client x */
  rawX: number;
  /** Raw client y */
  rawY: number;
}

interface Options {
  /** If set, parallax is computed relative to ref's bounding box. */
  trackerRef?: React.RefObject<HTMLElement | null>;
  /** Optional max magnitude for the normalized offset (-1..1). Default 1. */
  scale?: number;
  /** Damping 0..1 per frame; 0 = no smoothing, 1 = frozen */
  damping?: number;
}

/**
 * Tracks mouse position and returns normalized coordinates.
 * - `x` / `y` are normalized over the viewport, centered to (0, 0)
 * - `rawX` / `rawY` are the literal client coordinates
 */
export function useMouseParallax(options: Options = {}) {
  const { scale = 1, damping = 0.18 } = options;
  const [state, setState] = useState<MouseState>({ x: 0, y: 0, rawX: 0, rawY: 0 });
  const targetRef = useRef<MouseState>({ x: 0, y: 0, rawX: 0, rawY: 0 });
  const currentRef = useRef<MouseState>({ ...targetRef.current });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: PointerEvent) => {
      targetRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
        rawX: e.clientX,
        rawY: e.clientY,
      };
    };
    window.addEventListener("pointermove", handler);
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      const t = targetRef.current;
      const c = currentRef.current;
      currentRef.current = {
        x: c.x + (t.x - c.x) * (1 - damping),
        y: c.y + (t.y - c.y) * (1 - damping),
        rawX: t.rawX,
        rawY: t.rawY,
      };
      setState({
        x: currentRef.current.x * scale,
        y: currentRef.current.y * scale,
        rawX: currentRef.current.rawX,
        rawY: currentRef.current.rawY,
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [damping, scale]);

  return state;
}
