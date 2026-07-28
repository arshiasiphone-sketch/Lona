import { useEffect, useRef, useState } from "react";

export type CursorMode = "default" | "link" | "image" | "drag" | "hidden";

export interface CursorState {
  mode: CursorMode;
  /** Pinned to element cursor (text inputs). */
  systemOverride: boolean;
}

const SELECTOR =
  'a, button, [role="button"], [data-cursor="link"], [data-cursor="image"], [data-cursor="drag"], input[type="range"], label';

/**
 * Custom cursor mode controller.
 * - Inspects element under pointer each move
 * - Returns the mode + whether the OS cursor should remain visible (systemOverride)
 * - Disabled on coarse pointer devices (touch)
 */
export function useCursor(): CursorState {
  const [state, setState] = useState<CursorState>({
    mode: "default",
    systemOverride: false,
  });
  const lastRef = useRef(state);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Touch device → fall back to native cursor
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) {
      setState({ mode: "hidden", systemOverride: false });
      return;
    }

    const onMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const override = Boolean(
        target?.closest("input:not([type='range']), textarea, [contenteditable='true']")
      );

      let mode: CursorMode = "default";
      if (target) {
        const link = target.closest(SELECTOR);
        if (link) {
          const explicit = link.getAttribute("data-cursor");
          if (explicit === "image") mode = "image";
          else if (explicit === "drag") mode = "drag";
          else mode = "link";
        }
      }

      const next = { mode, systemOverride: override };
      const last = lastRef.current;
      if (next.mode !== last.mode || next.systemOverride !== last.systemOverride) {
        lastRef.current = next;
        setState(next);
      }

      // Hide OS cursor once we take over
      if (!override) {
        document.documentElement.classList.add("cursor-luxe");
        document.documentElement.classList.remove("cursor-luxe-system");
      } else {
        document.documentElement.classList.add("cursor-luxe-system");
        document.documentElement.classList.remove("cursor-luxe");
      }
    };

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("cursor-luxe");
      document.documentElement.classList.remove("cursor-luxe-system");
    };
  }, []);

  return state;
}
