import { useSearchParams } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export type ShopSort = "featured" | "newest" | "price_asc" | "price_desc" | "editor_picks";

const SORTS: { id: ShopSort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newly arrived" },
  { id: "editor_picks", label: "Editor picks" },
  { id: "price_asc", label: "Price · Low → High" },
  { id: "price_desc", label: "Price · High → Low" },
];

export function SortDropdown() {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = (searchParams.get("sort") as ShopSort) || "featured";

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-3.5 w-3.5 text-ink-muted" />
      <Select
        value={value}
        onValueChange={(v) => {
          const next = new URLSearchParams(searchParams);
          if (v === "featured") next.delete("sort");
          else next.set("sort", v);
          setSearchParams(next, { replace: true });
        }}
      >
        <SelectTrigger className="h-9 rounded-full border-edge bg-canvas/70 px-4 text-[11px] uppercase tracking-[0.16em]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="glass-strong rounded-2xl border-edge">
          {SORTS.map((s) => (
            <SelectItem key={s.id} value={s.id} className="text-sm">
              <span className="flex items-center gap-2">
                <span>{s.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const SORT_VALUES = SORTS.map((s) => s.id);
