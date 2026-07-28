import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { products as allProducts, type Product } from "@/data/catalog";
import {
  FiltersPanel,
  FILTER_DEFAULTS,
  type ShopFilters,
} from "@/components/customer/FiltersPanel";
import { SortDropdown } from "@/components/customer/SortDropdown";
import type { ShopSort } from "@/components/customer/SortDropdown";
import { ViewToggle } from "@/components/customer/ViewToggle";
import { InfiniteSentinel } from "@/components/customer/InfiniteSentinel";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ListCard } from "@/components/customer/ListCard";
import {
  EmptyState,
  EmptyFilter,
} from "@/components/customer/EmptyStates";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";

const PAGE_SIZE = 6;
const isServer = typeof window === "undefined";

const parseFilters = (params: URLSearchParams): ShopFilters => ({
  category: (params.get("category") as ShopFilters["category"]) ?? "all",
  colors: params.getAll("color"),
  sizes: params.getAll("size"),
  availability:
    (params.get("availability") as ShopFilters["availability"]) ?? "all",
  priceMin: Number(params.get("min")) || FILTER_DEFAULTS.priceMin,
  priceMax: Number(params.get("max")) || FILTER_DEFAULTS.priceMax,
});

const writeFilters = (prev: URLSearchParams, f: ShopFilters): URLSearchParams => {
  const next = new URLSearchParams(prev);
  if (f.category !== "all") next.set("category", f.category);
  else next.delete("category");

  next.delete("color");
  f.colors.forEach((c) => next.append("color", c));

  next.delete("size");
  f.sizes.forEach((s) => next.append("size", s));

  if (f.availability !== "all") next.set("availability", f.availability);
  else next.delete("availability");

  if (f.priceMin !== FILTER_DEFAULTS.priceMin) next.set("min", String(f.priceMin));
  else next.delete("min");
  if (f.priceMax !== FILTER_DEFAULTS.priceMax) next.set("max", String(f.priceMax));
  else next.delete("max");

  return next;
};

const filterProducts = (items: Product[], f: ShopFilters): Product[] => {
  return items.filter((p) => {
    if (f.category !== "all" && p.category !== f.category) return false;
    if (f.colors.length > 0 && !p.colors.some((c) => f.colors.includes(c.id))) return false;
    if (f.sizes.length > 0 && !p.sizes.some((s) => f.sizes.includes(s.id))) return false;
    if (p.price < f.priceMin || p.price > f.priceMax) return false;
    if (f.availability === "limited" && !p.badges?.includes("limited")) return false;
    if (
      f.availability === "in_stock" &&
      p.badges?.includes("limited") &&
      false /* mock: always available */
    ) {
      return false;
    }
    return true;
  });
};

const sortItems = (items: Product[], sort: ShopSort): Product[] => {
  const copy = items.slice();
  switch (sort) {
    case "newest":
      return copy.sort(
        (a, b) =>
          Number(!!b.badges?.includes("new")) - Number(!!a.badges?.includes("new"))
      );
    case "editor_picks":
      return copy.sort(
        (a, b) =>
          Number(!!b.badges?.includes("editorial")) -
          Number(!!a.badges?.includes("editorial"))
      );
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    default:
      return copy;
  }
};

// Optionally align a "badge" query — invisible here, but the URL ?badge=new is read.
const matchesBadge = (p: Product, badge: string | null): boolean => {
  if (!badge) return true;
  return !!p.badges?.includes(badge as NonNullable<Product["badges"]>[number]);
};

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(!isServer);

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const sort = (searchParams.get("sort") as ShopSort) ?? "featured";
  const view = (searchParams.get("view") as "grid" | "list") ?? "grid";

  const baseFiltered = useMemo(
    () => filterProducts(allProducts, filters),
    [filters]
  );

  const sorted = useMemo(
    () => sortItems(baseFiltered, sort),
    [baseFiltered, sort]
  );

  const visible = useMemo(() => sorted.slice(0, page * PAGE_SIZE), [sorted, page]);
  const hasMore = visible.length < sorted.length;

  useEffect(() => {
    // brief skeleton placeholder for perceived polish; immediate on real data
    const t = setTimeout(() => setLoading(false), 240);
    return () => clearTimeout(t);
  }, []);

  // Reset page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [filters, sort]);

  const onFiltersChange = useCallback(
    (next: ShopFilters) => {
      setSearchParams(writeFilters(searchParams, next), { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setPage((p) => p + 1);
  }, [hasMore]);

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-12 pb-24 lg:px-10 lg:pt-20">
      {/* Heading */}
      <header className="flex flex-col gap-4 pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">The Catalogue</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.02] tracking-[-0.02em] text-ink lg:text-7xl">
            Shop
          </h1>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-ink-muted">
          Every ÆON piece is made in limited runs at our ateliers in Italy and
          Japan. Pieces are restocked seasonally — not continuously.
        </p>
      </header>

      {/* Toolbar */}
      <div className="sticky top-16 z-20 -mx-6 mb-10 border-y border-edge bg-canvas-soft/75 px-6 py-3 backdrop-blur-xl lg:-mx-10 lg:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setDrawer((d) => !d)}
            className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/60 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink hover:bg-white/80"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {activeFacetCount(filters) > 0 && (
              <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {activeFacetCount(filters)}
              </span>
            )}
          </button>
          <FiltersPanel
            variant="inline"
            filters={filters}
            onChange={onFiltersChange}
          />
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-[11px] uppercase tracking-[0.18em] text-ink-muted sm:inline">
              {sorted.length} pieces
            </span>
            <span className="hidden h-3 w-px bg-edge sm:inline-block" />
            <SortDropdown />
            <ViewToggle />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside
          className={cn(
            "lg:sticky lg:top-32 lg:h-fit lg:block",
            drawer
              ? "fixed inset-0 z-40 grid place-items-start overflow-y-auto bg-canvas p-6 lg:static lg:p-0"
              : "hidden"
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
          <div className="lg:block">
            <FiltersPanel
              filters={filters}
              onChange={(next) => {
                onFiltersChange(next);
                setDrawer(false);
              }}
            />
            <button
              onClick={() => onFiltersChange(FILTER_DEFAULTS)}
              className="mt-10 w-full rounded-full hairline bg-canvas/60 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft transition hover:bg-white"
            >
              Reset all filters
            </button>
          </div>
        </aside>

        {/* Grid */}
        <div>
          {loading ? (
            <div className="grid gap-10">
              <Skeleton className="h-12 w-1/2" />
              {view === "grid" ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-8 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-4">
                      <Skeleton className="h-96 aspect-[4/5]" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-44" />
                  ))}
                </div>
              )}
            </div>
          ) : sorted.length === 0 ? (
            <EmptyFilter
              onReset={() => {
                onFiltersChange(FILTER_DEFAULTS);
                setDrawer(false);
              }}
            />
          ) : view === "grid" ? (
            <>
              <ProductGrid products={visible} columns={3} />
              <InfiniteSentinel onLoad={loadMore} hasMore={hasMore} />
            </>
          ) : (
            <>
              <div className="space-y-5">
                {visible.map((p) => (
                  <ListCard key={p.id} product={p} />
                ))}
              </div>
              <InfiniteSentinel onLoad={loadMore} hasMore={hasMore} />
            </>
          )}

          {sorted.length > 0 && view === "grid" && hasMore && !loading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: EASE_LUXURY }}
              className="mt-8 text-center text-xs text-ink-muted"
            >
              Showing {visible.length} of {sorted.length} pieces. The next page
              loads as you scroll.
            </motion.p>
          )}
        </div>
      </div>

      {/* Pre-footer — services */}
      <section className="mt-32 grid gap-8 md:grid-cols-3">
        {[
          {
            title: "Complimentary shipping",
            body: "On orders above $300, express worldwide.",
          },
          {
            title: "30-day returns",
            body: "Quiet, full-refund window — we send a courier.",
          },
          {
            title: "Concierge",
            body: "Write to the atelier directly. Replies within 24h.",
          },
        ].map((s) => (
          <div key={s.title} className="glass rounded-3xl p-7">
            <p className="font-display text-xl text-ink">{s.title}</p>
            <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
            <Link
              to="/about#contact"
              className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:text-primary"
            >
              Concierge →
            </Link>
          </div>
        ))}
      </section>

      {/* Helpful empty-search slot for empty state consumers */}
      <div className="sr-only">
        <EmptyState
          icon={<SlidersHorizontal className="h-5 w-5 text-ink" />}
          eyebrow="Search"
          title="No piece matches your filter."
          body="Try loosening the price ceiling or returning to the full catalogue."
        />
      </div>
    </div>
  );
}

function activeFacetCount(f: ShopFilters): number {
  let n = 0;
  if (f.category !== "all") n++;
  if (f.colors.length > 0) n++;
  if (f.sizes.length > 0) n++;
  if (f.availability !== "all") n++;
  if (f.priceMin !== FILTER_DEFAULTS.priceMin || f.priceMax !== FILTER_DEFAULTS.priceMax) n++;
  return n;
}
