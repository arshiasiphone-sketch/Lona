import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { Search as SearchIcon, Sparkles, ArrowUpRight, History, X } from "lucide-react";
import {
  useProducts,
  useCollections,
  useNewArrivals,
  useSearchProducts,
  staticProducts,
  staticCollections,
} from "@/lib/data/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptySearch } from "@/components/customer/EmptyStates";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";

const RECENT_KEY = "aeon-recent-searches-v1";
const POPULAR = [
  "Cashmere",
  "Outerwear",
  "The Permanent collection",
  "Leather",
  "Eyewear",
];
const silhouetteFor = (cat: string) => {
  switch (cat) {
    case "outerwear": return "coat" as const;
    case "knitwear": return "knit" as const;
    case "trousers": return "trouser" as const;
    case "shirting": return "shirt" as const;
    case "dresses": return "dress" as const;
    case "leather": return "leather" as const;
    default: return "accessory" as const;
  }
};
const gradientFor = (k: string) =>
  k === "oat" ? "gradient-oat" : k === "deep" ? "gradient-deep" : k === "rose" ? "gradient-rose-quartz" : "gradient-mist";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { ids: wishlistIds } = useWishlist();
  const q = searchParams.get("q") ?? "";
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {
      /* swallow */
    }
  }, []);

  const liveProducts = useProducts();
  const liveCollections = useCollections();
  const products = liveProducts ?? staticProducts;
  const collections = liveCollections ?? staticCollections;
  const results = useSearchProducts({ query: q, limit: 24 }) ?? [];
  const trending = useNewArrivals(4) ?? products.slice(0, 4);

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recent.filter((r) => r !== trimmed)].slice(0, 5);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
    setRecent(next);
    setSearchParams({ q: trimmed });
  };

  const onClearRecent = () => {
    try {
      window.localStorage.removeItem(RECENT_KEY);
    } catch { /* ignore */ }
    setRecent([]);
  };

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <header className="max-w-3xl">
        <p className="type-eyebrow text-ink-muted">Search</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-7xl">
          {q ? `“${q}”` : "What are you looking for?"}
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-ink-soft lg:text-base">
          Search across the catalogue. Pieces and collections are matched against name,
          description, and category.
        </p>
      </header>

      {/* Search field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const value = String(data.get("q") ?? "").trim();
          submit(value);
        }}
        className="mt-10 flex max-w-3xl items-center gap-3 rounded-full hairline bg-canvas/60 px-5 py-3"
      >
        <SearchIcon className="h-4 w-4 text-ink-muted" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Knitwear, leather, the Paragon coat…"
          className="flex-1 bg-transparent text-base text-ink placeholder:text-ink-muted focus:outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => navigate("/search")}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-white"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className="rounded-full bg-ink px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          Search
        </button>
      </form>

      {/* Keyboard hints */}
      <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
        Press <kbd className="hairline rounded bg-canvas/60 px-1.5 py-0.5 text-ink">⌘ K</kbd>{" "}
        to open the command palette anywhere.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_320px]">
        <div>
          {q && results.length === 0 && (
            <EmptySearch query={q} onReset={() => navigate("/search")} />
          )}
          {q && results.length > 0 && (
            <>
              <p className="type-eyebrow text-ink-muted">
                {results.length} pieces match
              </p>
              <div className="mt-6">
                <ProductGrid products={results} columns={3} />
              </div>
            </>
          )}
          {!q && (
            <div className="grid gap-10">
              <div>
                <p className="type-eyebrow text-ink-muted">Trending now</p>
                <div className="mt-5">
                  <ProductGrid products={trending} columns={4} />
                </div>
              </div>
              <div>
                <p className="type-eyebrow text-ink-muted">From your preferences</p>
                <h2 className="mt-2 font-display text-3xl text-ink lg:text-4xl">
                  Considered for you
                </h2>
                <p className="mt-3 max-w-md text-sm text-ink-soft">
                  Discover pieces based on your last visits. Personalization arrives fully
                  with the next release.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {products.slice(0, 4).map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, ease: EASE_LUXURY }}
                    >
                      <Link
                        to={`/shop/${p.slug}`}
                        className="glass block overflow-hidden rounded-2xl p-3"
                      >
                        <ProductImage
                          gradient={p.colors[0].gradient}
                          silhouette={silhouetteFor(p.category)}
                          withMark={false}
                          className="aspect-[4/5] w-full"
                        />
                        <p className="mt-3 font-display text-base text-ink">{p.name}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                          ${p.price}
                        </p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side rail */}
        <aside className="lg:sticky lg:top-32 lg:h-fit">
          <div className="glass rounded-3xl p-6">
            <p className="type-eyebrow text-ink-muted">Popular searches</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {POPULAR.map((term) => (
                <li key={term}>
                  <button
                    onClick={() => submit(term)}
                    className="rounded-full hairline bg-canvas/60 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-ink hover:bg-white"
                  >
                    {term}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass mt-6 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <p className="type-eyebrow text-ink-muted">Your recent searches</p>
              {recent.length > 0 && (
                <button
                  onClick={onClearRecent}
                  className="text-[10px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink"
                >
                  Clear
                </button>
              )}
            </div>
            {recent.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">
                Searches you make here are remembered for later sessions.
              </p>
            ) : (
              <ul className="mt-4 space-y-1">
                {recent.map((term) => (
                  <li key={term}>
                    <button
                      onClick={() => submit(term)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/60",
                        term === q && "bg-white/80 text-ink"
                      )}
                    >
                      <History className="h-3.5 w-3.5 text-ink-muted" />
                      <span className="flex-1 text-ink">{term}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="glass mt-6 rounded-3xl p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="type-eyebrow text-ink-muted">Suggested collections</p>
            </div>
            <ul className="mt-4 space-y-2">
              {collections.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/collections/${c.slug}`}
                    className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm text-ink transition hover:bg-white/60"
                  >
                    <span>{c.name}</span>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                      {c.eyebrow}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {isAuthenticated && (
            <div className="glass mt-6 rounded-3xl p-6">
              <p className="type-eyebrow text-ink-muted">From your account</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/wishlist" className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/60">
                    <span>Saved pieces</span>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">{wishlistIds.length}</span>
                  </Link>
                </li>
                <li>
                  <Link to="/account" className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/60">
                    <span>Workspace</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-ink-muted" />
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
