import { useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { products, collections } from "@/data/catalog";
import { useOverlay } from "@/hooks/use-overlay";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import {
  ShoppingBag,
  Heart,
  Search,
  Sparkles,
  ArrowRight,
  Compass,
} from "lucide-react";

const PAGE_LINKS: { label: string; to: string; group: string }[] = [
  { label: "Home", to: "/", group: "Pages" },
  { label: "Shop all", to: "/shop", group: "Pages" },
  { label: "Collections", to: "/collections", group: "Pages" },
  { label: "Cart", to: "/cart", group: "Pages" },
  { label: "Wishlist", to: "/wishlist", group: "Pages" },
  { label: "Account", to: "/account", group: "Pages" },
  { label: "Atelier (About)", to: "/about", group: "Pages" },
  { label: "Journal (Press)", to: "/press", group: "Pages" },
];

const SUGGESTIONS: { label: string; to: string; meta: string }[] = [
  { label: "New Arrivals", to: "/shop?badge=new", meta: "12 pieces" },
  { label: "Outerwear", to: "/shop?category=outerwear", meta: "2 chapters" },
  { label: "Knitwear", to: "/shop?category=knitwear", meta: "Soft, dense" },
  { label: "The Essentials", to: "/collections/essentials", meta: "Permanent" },
  { label: "Objects", to: "/collections/objects", meta: "Carry with you" },
];

export function CommandPalette() {
  const { commandOpen, closeCommand } = useOverlay();
  const { isAuthenticated } = useAuth();
  const { ids: wishlistIds } = useWishlist();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!commandOpen) setQuery("");
  }, [commandOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) =>
        [p.name, p.description, p.category, p.collection]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 6);
  }, [query]);

  const go = (to: string) => {
    closeCommand();
    navigate(to);
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={(o) => !o && closeCommand()}>
      <CommandInput
        placeholder="Search pieces, collections, pages…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          <span className="block py-8 text-center text-sm text-ink-muted">
            No result for &ldquo;{query}&rdquo;. Try a collection or page.
          </span>
        </CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Pieces">
            {results.map((p) => (
              <CommandItem
                key={p.id}
                value={`product-${p.id}-${p.name}`}
                onSelect={() => go(`/shop/${p.slug}`)}
                className="flex items-center gap-3"
              >
                <span className="grid h-9 w-9 place-items-center rounded-md hairline bg-white/60">
                  <Search className="h-3.5 w-3.5 text-ink-soft" />
                </span>
                <div className="flex-1 leading-tight">
                  <p className="text-sm text-ink">{p.name}</p>
                  <p className="text-[11px] text-ink-muted">{p.collection.replace("-", " ")}</p>
                </div>
                <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                  ${p.price}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.length > 0 && wishlistIds.length > 0 && (
          <CommandSeparator />
        )}

        {!query && (
          <>
            <CommandGroup heading="Suggestions">
              {SUGGESTIONS.map((s) => (
                <CommandItem
                  key={s.label}
                  value={`sugg-${s.label}`}
                  onSelect={() => go(s.to)}
                >
                  <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
                  <span className="flex-1">{s.label}</span>
                  <span className="text-[11px] text-ink-muted">{s.meta}</span>
                  <ArrowRight className="h-3 w-3 text-ink-muted" />
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Collections">
              {collections.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`coll-${c.slug}`}
                  onSelect={() => go(`/collections/${c.slug}`)}
                >
                  <Compass className="mr-2 h-3.5 w-3.5 text-primary" />
                  <div className="flex-1 leading-tight">
                    <p className="text-sm text-ink">{c.name}</p>
                    <p className="text-[11px] text-ink-muted">{c.eyebrow}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Pages">
              {PAGE_LINKS.map((link) => (
                <CommandItem
                  key={link.to}
                  value={`page-${link.to}`}
                  onSelect={() => go(link.to)}
                >
                  <span className="mr-2 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                    ▸
                  </span>
                  {link.label}
                </CommandItem>
              ))}
            </CommandGroup>

            {isAuthenticated && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Your">
                  <CommandItem value="account-home" onSelect={() => go("/account")}>
                    <ShoppingBag className="mr-2 h-3.5 w-3.5 text-primary" />
                    Account workspace
                    <CommandShortcut>⏎</CommandShortcut>
                  </CommandItem>
                  <CommandItem value="wishlist" onSelect={() => go("/wishlist")}>
                    <Heart className="mr-2 h-3.5 w-3.5 text-primary" />
                    Wishlist · {wishlistIds.length}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
