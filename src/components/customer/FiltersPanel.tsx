import { useEffect, useMemo, useState } from "react";
import type { ProductCategory } from "@/data/catalog";
import { products as allProducts } from "@/data/catalog";
import { cn } from "@/lib/glass";
import { formatPrice } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ShopFilters {
  category: ProductCategory | "all";
  colors: string[];
  sizes: string[];
  availability: "all" | "in_stock" | "limited";
  priceMin: number;
  priceMax: number;
}

const empty: ShopFilters = {
  category: "all",
  colors: [],
  sizes: [],
  availability: "all",
  priceMin: 0,
  priceMax: 5_000_000,
};

/**
 * Toman price bounds — the catalogue ranges roughly from
 * 220,000 toman (basic briefs) to 3,990,000 toman (bridal sets).
 * The slider adapts to whichever category is selected, so these
 * are absolute floor/ceiling.
 */
const PRICE_FLOOR = 200_000;
const PRICE_CEIL = 5_000_000;

const CATEGORIES: { id: ProductCategory | "all"; label: string }[] = [
  { id: "all",        label: "همه دسته‌ها" },
  { id: "bras",       label: "سوتین" },
  { id: "briefs",     label: "شورت" },
  { id: "sets",       label: "ست لباس زیر" },
  { id: "sleepwear",  label: "لباس خواب" },
  { id: "loungewear", label: "لباس راحتی" },
  { id: "bodysuits",  label: "بادی" },
  { id: "shapewear",  label: "گن" },
  { id: "sportswear", label: "لباس ورزشی زنانه" },
  { id: "accessories",label: "اکسسوری" },
  { id: "bridal",     label: "کالکشن عروس" },
];

interface FiltersPanelProps {
  filters: ShopFilters;
  onChange: (next: ShopFilters) => void;
  /** Compact mode hides size / availability (mobile drawer) */
  compact?: boolean;
  variant?: "sidebar" | "inline";
}

export function FiltersPanel({ filters, onChange, compact, variant = "sidebar" }: FiltersPanelProps) {
  const set = <K extends keyof ShopFilters>(k: K, v: ShopFilters[K]) =>
    onChange({ ...filters, [k]: v });

  // Derive available colors / sizes from current category
  const facets = useMemo(() => {
    const pool = filters.category === "all"
      ? allProducts
      : allProducts.filter((p) => p.category === filters.category);
    const colors = new Map<string, string>();
    pool.forEach((p) => p.colors.forEach((c) => colors.set(c.id, c.name)));
    const sizes = new Map<string, string>();
    pool.forEach((p) => p.sizes.forEach((s) => sizes.set(s.id, s.label)));
    return {
      colors: Array.from(colors, ([id, label]) => ({ id, label })),
      sizes: Array.from(sizes, ([id, label]) => ({ id, label })),
    };
  }, [filters.category]);

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.category}
          onValueChange={(v) => set("category", v as ShopFilters["category"])}
        >
          <SelectTrigger className="h-9 rounded-full border-edge bg-canvas/70 px-4 text-[11px] uppercase tracking-[0.16em]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="glass-strong rounded-2xl border-edge">
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-sm">
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AvailabilityPill value={filters.availability} onChange={(v) => set("availability", v)} />
        <PriceRangePill
          value={[filters.priceMin, filters.priceMax]}
          onChange={([min, max]) => onChange({ ...filters, priceMin: min, priceMax: max })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <FacetGroup label="دسته‌بندی">
        <ul className="space-y-1">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => set("category", c.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-right text-sm transition",
                  filters.category === c.id
                    ? "bg-white/80 font-medium text-ink"
                    : "text-ink-soft hover:bg-white/40 hover:text-ink"
                )}
              >
                <span>{c.label}</span>
                <span className="text-[11px] text-ink-muted">
                  {c.id === "all"
                    ? allProducts.length
                    : allProducts.filter((p) => p.category === c.id).length}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </FacetGroup>

      <FacetGroup label="موجودی">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "all",      label: "همه" },
              { id: "in_stock", label: "موجود" },
              { id: "limited",  label: "محدود" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => set("availability", opt.id)}
              className={cn(
                "rounded-full border border-edge px-3 py-1.5 text-[11px] transition",
                filters.availability === opt.id
                  ? "bg-ink text-canvas"
                  : "text-ink-soft hover:bg-white/40"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FacetGroup>

      <FacetGroup label="قیمت">
        <PriceRangePill
          value={[filters.priceMin, filters.priceMax]}
          onChange={([min, max]) => onChange({ ...filters, priceMin: min, priceMax: max })}
        />
        <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
          <span>{formatPrice(filters.priceMin)}</span>
          <span>{formatPrice(filters.priceMax)}</span>
        </div>
      </FacetGroup>

      {!compact && (
        <>
          <FacetGroup label="رنگ">
            <div className="flex flex-wrap gap-2.5">
              {facets.colors.map((c) => {
                const on = filters.colors.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() =>
                      set(
                        "colors",
                        on
                          ? filters.colors.filter((x) => x !== c.id)
                          : [...filters.colors, c.id]
                      )
                    }
                    className={cn(
                      "relative h-9 w-9 rounded-full ring-1 ring-inset ring-edge",
                      c.id === "oat" && "gradient-oat",
                      c.id === "mist" && "gradient-mist",
                      c.id === "rose" && "gradient-rose-quartz",
                      c.id === "deep" && "gradient-deep"
                    )}
                    aria-pressed={on}
                    aria-label={c.label}
                  >
                    <span
                      className={cn(
                        "absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-canvas transition",
                        on ? "ring-ink" : "ring-transparent"
                      )}
                    />
                  </button>
                );
              })}
              {facets.colors.length === 0 && (
                <span className="text-xs text-ink-muted">—</span>
              )}
            </div>
          </FacetGroup>

          <FacetGroup label="سایز">
            <div className="grid grid-cols-5 gap-1.5">
              {facets.sizes.map((s) => {
                const on = filters.sizes.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() =>
                      set(
                        "sizes",
                        on
                          ? filters.sizes.filter((x) => x !== s.id)
                          : [...filters.sizes, s.id]
                      )
                    }
                    className={cn(
                      "rounded-lg py-2 text-[10px] transition",
                      on
                        ? "bg-ink text-canvas"
                        : "hairline text-ink-soft hover:bg-white/40"
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </FacetGroup>
        </>
      )}
    </div>
  );
}

function FacetGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="type-eyebrow text-ink-muted">{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function AvailabilityPill({
  value,
  onChange,
}: {
  value: ShopFilters["availability"];
  onChange: (v: ShopFilters["availability"]) => void;
}) {
  const opts = [
    { id: "all",      label: "موجودی" },
    { id: "in_stock", label: "موجود" },
    { id: "limited",  label: "محدود" },
  ] as const;
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ShopFilters["availability"])}>
      <SelectTrigger className="h-9 rounded-full border-edge bg-canvas/70 px-4 text-[11px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="glass-strong rounded-2xl border-edge">
        {opts.map((o) => (
          <SelectItem key={o.id} value={o.id} className="text-sm">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PriceRangePill({
  value,
  onChange,
}: {
  value: [number, number];
  onChange: (next: [number, number]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [min, max] = value;
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);
  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="h-9 rounded-full border border-edge bg-canvas/70 px-4 text-[11px] text-ink hover:bg-white/80"
      >
        قیمت · {formatPrice(min)} – {formatPrice(max)}
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="glass-strong absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-edge p-4 shadow-float"
        >
          <PriceDualRange value={value} onChange={onChange} min={PRICE_FLOOR} max={PRICE_CEIL} />
        </div>
      )}
    </div>
  );
}

function PriceDualRange({
  value,
  onChange,
  min,
  max,
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
  min: number;
  max: number;
}) {
  const [lo, hi] = value;
  const pctLo = ((lo - min) / (max - min)) * 100;
  const pctHi = ((hi - min) / (max - min)) * 100;
  const step = 50_000; // 50k toman tick
  return (
    <div>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-edge" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), hi - step);
            onChange([v, hi]);
          }}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-ink"
          aria-label="حداقل قیمت"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), lo + step);
            onChange([lo, v]);
          }}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-ink"
          aria-label="حداکثر قیمت"
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
        <span>{formatPrice(lo)}</span>
        <span>{formatPrice(hi)}</span>
      </div>
    </div>
  );
}

export const FILTER_DEFAULTS = empty;
