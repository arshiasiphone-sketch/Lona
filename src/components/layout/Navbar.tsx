import { Link, NavLink, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Search,
  ShoppingBag,
  User as UserIcon,
  Menu as MenuIcon,
  X as CloseIcon,
} from "lucide-react";
import { cn } from "@/lib/glass";
import { collections } from "@/data/catalog";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { useOverlay } from "@/hooks/use-overlay";
import { EASE_LUXURY } from "@/lib/motion";

const PRIMARY_LINKS: { label: string; to: string }[] = [
  { label: "Shop", to: "/shop" },
  { label: "Collections", to: "/collections" },
  { label: "Journal", to: "/press" },
  { label: "Atelier", to: "/about" },
];

export function Navbar() {
  const { itemCount } = useCart();
  const { ids: wishlistIds } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { openSideCart, openCommand } = useOverlay();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileSearch) {
      const t = setTimeout(() => searchRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [mobileSearch]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 mx-auto w-full transition-all duration-500",
        scrolled
          ? "border-b border-edge bg-canvas-soft/75 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <nav
        className="relative mx-auto flex h-16 max-w-[1728px] items-center justify-between px-6 lg:px-10"
        aria-label="Primary"
      >
        {/* Left — collection nav (desktop), menu + search (mobile) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileSearch((s) => !s)}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-white/40 lg:hidden"
            aria-label="Toggle search"
          >
            <Search className="h-4 w-4" />
          </button>
          <ul className="hidden items-center gap-1 lg:flex">
            {PRIMARY_LINKS.map((link, i) => (
              <li
                key={link.to}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="relative"
              >
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "type-caption px-3 py-2 text-[12px] font-medium uppercase tracking-[0.18em] transition-colors",
                      isActive ? "text-ink" : "text-ink-soft hover:text-ink"
                    )
                  }
                >
                  {link.label}
                </NavLink>
                <AnimatePresence>
                  {hoverIndex === i && link.label === "Collections" && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.32, ease: EASE_LUXURY }}
                      className="absolute left-1/2 top-full z-50 mt-2 w-[640px] -translate-x-1/2"
                    >
                      <div className="glass-strong rounded-2xl p-6">
                        <div className="grid grid-cols-2 gap-4">
                          {collections.map((c) => (
                            <Link
                              key={c.id}
                              to={`/collections/${c.slug}`}
                              className="group flex items-start gap-3 rounded-xl p-3 transition hover:bg-white/40"
                              onClick={() => setHoverIndex(null)}
                            >
                              <div
                                className={cn(
                                  "h-14 w-14 shrink-0 rounded-lg",
                                  c.gradient === "oat" && "gradient-oat",
                                  c.gradient === "mist" && "gradient-mist",
                                  c.gradient === "deep" && "gradient-deep",
                                  c.gradient === "rose" && "gradient-rose-quartz"
                                )}
                              />
                              <div>
                                <p className="type-eyebrow text-ink-muted">
                                  {c.eyebrow}
                                </p>
                                <p className="font-display text-base text-ink transition group-hover:text-primary">
                                  {c.name}
                                </p>
                                <p className="mt-0.5 text-xs text-ink-muted line-clamp-1">
                                  {c.description}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ul>
        </div>

        {/* Center — wordmark */}
        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 font-display text-[22px] font-light tracking-[0.36em] text-ink"
          aria-label="ÆON home"
        >
          ÆON
        </Link>

        {/* Right — utilities */}
        <div className="flex items-center gap-1">
          <button
            onClick={openCommand}
            className="flex items-center gap-2 rounded-full hairline bg-canvas/60 px-3 py-2 text-ink-soft transition hover:bg-white/80"
            aria-label="Open command palette"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline text-[11px] uppercase tracking-[0.18em]">
              Search
            </span>
            <kbd className="hidden md:inline rounded bg-canvas/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-muted">
              ⌘K
            </kbd>
          </button>
          <Link
            to="/wishlist"
            className="relative grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-white/40 hover:text-ink"
            aria-label="Wishlist"
          >
            <Heart className="h-4 w-4" />
            <AnimatePresence>
              {wishlistIds.length > 0 && (
                <motion.span
                  key={`w-${wishlistIds.length}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE_LUXURY }}
                  className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground"
                >
                  {wishlistIds.length}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={openSideCart}
            className="relative grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-white/40 hover:text-ink"
            aria-label="Open shopping bag"
          >
            <ShoppingBag className="h-4 w-4" />
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span
                  key={`c-${itemCount}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE_LUXURY }}
                  className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground"
                >
                  {itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={() => navigate(isAuthenticated ? "/account" : "/auth")}
            className="ml-1 grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-white/40 hover:text-ink"
            aria-label={isAuthenticated ? "Account" : "Sign in"}
          >
            <UserIcon className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Mobile-only quick search bar */}
      <AnimatePresence>
        {mobileSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: EASE_LUXURY }}
            className="lg:hidden border-t border-edge/60"
          >
            <div className="glass-strong flex items-center gap-3 px-6 py-3">
              <Search className="h-4 w-4 text-ink-muted" />
              <input
                ref={searchRef}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchValue.trim()) {
                    navigate(`/search?q=${encodeURIComponent(searchValue)}`);
                    setMobileSearch(false);
                    setSearchValue("");
                  }
                }}
                placeholder="Search…"
                className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              />
              <button
                onClick={() => setMobileSearch(false)}
                className="grid h-7 w-7 place-items-center rounded-full text-ink-muted hover:bg-white"
                aria-label="Close search"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
