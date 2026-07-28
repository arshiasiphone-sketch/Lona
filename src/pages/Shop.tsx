import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { products, type Product, type ProductCategory } from "@/data/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";

const CATEGORIES: { id: ProductCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "outerwear", label: "Outerwear" },
  { id: "knitwear", label: "Knitwear" },
  { id: "shirting", label: "Shirting" },
  { id: "trousers", label: "Trousers" },
  { id: "dresses", label: "Dresses" },
  { id: "leather", label: "Leather & Objects" },
  { id: "accessories", label: "Accessories" },
];

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "new", label: "Newly arrived" },
  { id: "price-low", label: "Price · Low → High" },
  { id: "price-high", label: "Price · High → Low" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

function sortProducts(items: Product[], sort: SortId): Product[] {
  const copy = items.slice();
  switch (sort) {
    case "new":
      return copy.sort((a, b) => Number(b.badges?.includes("new") ?? 0) - Number(a.badges?.includes("new") ?? 0));
    case "price-low":
      return copy.sort((a, b) => a.price - b.price);
    case "price-high":
      return copy.sort((a, b) => b.price - a.price);
    default:
      return copy;
  }
}

export default function Shop() {
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [sort, setSort] = useState<SortId>("featured");
  const [priceMax, setPriceMax] = useState(3000);
  const [drawer, setDrawer] = useState(false);

  const filtered = useMemo(() => {
    const items =
      category === "all"
        ? products
        : products.filter((p) => p.category === category);
    return sortProducts(items.filter((p) => p.price <= priceMax), sort);
  }, [category, sort, priceMax]);

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-12 pb-24 lg:px-10 lg:pt-20">
      {/* Heading */}
      <header className="flex flex-col gap-4 pb-12 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">The Catalogue</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.02] tracking-[-0.02em] text-ink lg:text-7xl">
            Shop
          </h1>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-ink-muted">
          Every ÆON piece is made in limited runs at our ateliers in Italy and Japan.
          Pieces are restocked seasonally — not continuously.
        </p>
      </header>

      {/* Toolbar */}
      <div className="sticky top-16 z-20 -mx-6 mb-10 border-y border-edge bg-canvas-soft/70 px-6 py-3 backdrop-blur-xl lg:-mx-10 lg:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setDrawer((d) => !d)}
            className="lg:hidden inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </button>
          <div className="hidden items-center gap-1.5 lg:flex">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition",
                  category === c.id
                    ? "bg-ink text-canvas"
                    : "hairline text-ink-soft hover:text-ink"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3 text-[11px] uppercase tracking-[0.18em]">
            <span className="text-ink-muted">{filtered.length} pieces</span>
            <span className="h-3 w-px bg-edge-strong" />
            <label className="flex items-center gap-2 text-ink-soft">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortId)}
                className="rounded-full bg-transparent hairline px-3 py-1.5 text-[11px] uppercase text-ink"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        {/* Sidebar filters */}
        <aside
          className={cn(
            "space-y-10 lg:sticky lg:top-32 lg:h-fit",
            drawer
              ? "fixed inset-0 z-40 bg-canvas p-6 lg:static lg:p-0 lg:bg-transparent"
              : "hidden lg:block"
          )}
        >
          <div className="flex items-center justify-between lg:hidden">
            <h2 className="font-display text-2xl text-ink">Filter</h2>
            <button
              onClick={() => setDrawer(false)}
              className="grid h-9 w-9 place-items-center rounded-full hairline"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="type-eyebrow text-ink-muted">Category</p>
            <ul className="space-y-1.5">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      setCategory(c.id);
                      setDrawer(false);
                    }}
                    className={cn(
                      "block w-full rounded-lg px-3 py-2 text-left text-sm transition",
                      category === c.id
                        ? "bg-white/80 font-medium text-ink"
                        : "text-ink-soft hover:bg-white/40 hover:text-ink"
                    )}
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <p className="type-eyebrow text-ink-muted">Price ceiling</p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink-soft">$0</span>
              <input
                type="range"
                min={400}
                max={3000}
                step={20}
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-sm font-medium text-ink">${priceMax}</span>
            </div>
          </div>
        </aside>

        {/* Grid or empty state */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_LUXURY }}
            className="glass flex flex-col items-center justify-center rounded-3xl px-10 py-24 text-center"
          >
            <p className="font-display text-3xl text-ink">No pieces yet</p>
            <p className="mt-3 max-w-sm text-sm text-ink-muted">
              The category you've selected is currently quiet at our atelier. Returns in early next volume.
            </p>
            <button
              onClick={() => setCategory("all")}
              className="mt-8 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
            >
              View Full Catalogue
            </button>
          </motion.div>
        ) : (
          <ProductGrid products={filtered} columns={3} />
        )}
      </div>
    </div>
  );
}
