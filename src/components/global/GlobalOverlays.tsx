import { SideCart } from "./SideCart";
import { CommandPalette } from "./CommandPalette";

/**
 * Mounted once at the top of the router tree so it can read overlay context
 * AND access router navigation hooks (used by CommandPalette).
 * Keep this dumb — no markup beyond the overlays.
 */
export function GlobalOverlays() {
  return (
    <>
      <SideCart />
      <CommandPalette />
    </>
  );
}
