import { useSearchParams } from "react-router";
import { LayoutGrid, Rows3 } from "lucide-react";
import { cn } from "@/lib/glass";
import { motion } from "framer-motion";
import { EASE_LUXURY } from "@/lib/motion";

export type ShopView = "grid" | "list";

export function ViewToggle() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get("view") as ShopView) || "grid";

  const set = (next: ShopView) => {
    const params = new URLSearchParams(searchParams);
    if (next === "grid") params.delete("view");
    else params.set("view", next);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="relative grid h-9 grid-cols-2 rounded-full border border-edge bg-canvas/70 p-1">
      <motion.span
        layout
        transition={{ duration: 0.4, ease: EASE_LUXURY }}
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-ink"
        style={{
          transform: `translateX(${view === "list" ? "100%" : "0%"})`,
        }}
      />
      <button
        onClick={() => set("grid")}
        aria-label="grid view"
        aria-pressed={view === "grid"}
        className={cn(
          "relative z-10 flex items-center justify-center gap-1.5 rounded-full text-[11px] uppercase tracking-[0.16em] transition",
          view === "grid" ? "text-canvas" : "text-ink-soft"
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Grid
      </button>
      <button
        onClick={() => set("list")}
        aria-label="list view"
        aria-pressed={view === "list"}
        className={cn(
          "relative z-10 flex items-center justify-center gap-1.5 rounded-full text-[11px] uppercase tracking-[0.16em] transition",
          view === "list" ? "text-canvas" : "text-ink-soft"
        )}
      >
        <Rows3 className="h-3.5 w-3.5" />
        List
      </button>
    </div>
  );
}
