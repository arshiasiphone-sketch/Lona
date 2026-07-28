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
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

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
        {/* Left — collection nav (desktop), menu (mobile) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen((s) => !s)}
            className="grid h-9 w-9 place-items-center rounded-full hairline text-ink-soft transition hover:text-ink lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="h-4 w-4" />
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
            onClick={() => setSearchOpen((s) => !s)}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-white/40 hover:text-ink"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </button>
          <Link
            to="/wishlist"
            className="relative grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-white/40 hover:text-ink"
            aria-label="Wishlist"
          >
            <Heart className="h-4 w-4" />
            {wishlistIds.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground">
                {wishlistIds.length}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            className="relative grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-white/40 hover:text-ink"
            aria-label="Cart"
          >
            <ShoppingBag className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => navigate(isAuthenticated ? "/account" : "/auth")}
            className="ml-1 grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-white/40 hover:text-ink"
            aria-label={isAuthenticated ? "Account" : "Sign in"}
          >
            <UserIcon className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: EASE_LUXURY }}
            className="absolute left-0 right-0 top-full z-50 mx-auto max-w-[1728px] px-6 lg:px-10"
          >
            <div className="glass-strong mt-2 flex items-center gap-3 rounded-2xl px-5 py-4">
              <Search className="h-4 w-4 text-ink-muted" />
              <input
                ref={searchRef}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchValue.trim()) {
                    navigate(`/shop?q=${encodeURIComponent(searchValue)}`);
                    setSearchOpen(false);
                    setSearchValue("");
                  }
                }}
                placeholder="Search coats, knitwear, objects…"
                className="flex-1 bg-transparent text-base text-ink placeholder:text-ink-muted focus:outline-none"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchValue("");
                }}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-white/40 hover:text-ink"
                aria-label="Close search"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
