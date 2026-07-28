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
  ArrowLeft,
  Compass,
} from "lucide-react";

const PAGE_LINKS: { label: string; to: string; group: string }[] = [
  { label: "خانه", to: "/", group: "صفحه‌ها" },
  { label: "همه محصولات", to: "/shop", group: "صفحه‌ها" },
  { label: "کالکسیون‌ها", to: "/collections", group: "صفحه‌ها" },
  { label: "سبد خرید", to: "/cart", group: "صفحه‌ها" },
  { label: "علاقه‌مندی‌ها", to: "/wishlist", group: "صفحه‌ها" },
  { label: "حساب کاربری", to: "/account", group: "صفحه‌ها" },
  { label: "درباره لونا", to: "/about", group: "صفحه‌ها" },
  { label: "مجله لونا", to: "/press", group: "صفحه‌ها" },
];

const SUGGESTIONS: { label: string; to: string; meta: string }[] = [
  { label: "تازه‌ها", to: "/shop?badge=new", meta: "۱۲ تکه" },
  { label: "سوتین", to: "/shop?category=intimates-bras", meta: "ظریف، روزمره" },
  { label: "شورت", to: "/shop?category=intimates-briefs", meta: "هماهنگ با سوتین" },
  { label: "ست لباس زیر", to: "/shop?category=intimates-sets", meta: "هماهنگ" },
  { label: "لباس خواب", to: "/shop?category=sleepwear", meta: "ملایم، راحت" },
  { label: "لباس راحتی", to: "/shop?category=homewear", meta: "برای خانه" },
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
        placeholder="جست‌وجو در لونا… محصول، کالکسیون، صفحه"
        value={query}
        onValueChange={setQuery}
        dir="rtl"
      />
      <CommandList>
        <CommandEmpty>
          <span className="block py-8 text-center text-sm text-ink-muted">
            نتیجه‌ای برای «{query}» پیدا نشد. یک کالکسیون یا صفحه را امتحان کنید.
          </span>
        </CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="محصولات">
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
                <div className="flex-1 text-right leading-tight">
                  <p className="text-sm text-ink">{p.name}</p>
                  <p className="text-[11px] text-ink-muted">
                    {p.collection.replace("-", " ")}
                  </p>
                </div>
                <span className="text-[11px] text-ink-muted">
                  {p.price.toLocaleString("fa-IR")} تومان
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
            <CommandGroup heading="پیشنهادها">
              {SUGGESTIONS.map((s) => (
                <CommandItem
                  key={s.label}
                  value={`sugg-${s.label}`}
                  onSelect={() => go(s.to)}
                >
                  <Sparkles className="ml-2 h-3.5 w-3.5 text-primary" />
                  <span className="flex-1">{s.label}</span>
                  <span className="text-[11px] text-ink-muted">{s.meta}</span>
                  <ArrowLeft className="h-3 w-3 text-ink-muted" />
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="کالکسیون‌ها">
              {collections.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`coll-${c.slug}`}
                  onSelect={() => go(`/collections/${c.slug}`)}
                >
                  <Compass className="ml-2 h-3.5 w-3.5 text-primary" />
                  <div className="flex-1 text-right leading-tight">
                    <p className="text-sm text-ink">{c.name}</p>
                    <p className="text-[11px] text-ink-muted">{c.eyebrow}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="صفحه‌ها">
              {PAGE_LINKS.map((link) => (
                <CommandItem
                  key={link.to}
                  value={`page-${link.to}`}
                  onSelect={() => go(link.to)}
                >
                  <span className="ml-2 text-[11px] text-ink-muted">▸</span>
                  {link.label}
                </CommandItem>
              ))}
            </CommandGroup>

            {isAuthenticated && (
              <>
                <CommandSeparator />
                <CommandGroup heading="حساب شما">
                  <CommandItem value="account-home" onSelect={() => go("/account")}>
                    <ShoppingBag className="ml-2 h-3.5 w-3.5 text-primary" />
                    حساب کاربری
                    <CommandShortcut>⏎</CommandShortcut>
                  </CommandItem>
                  <CommandItem value="wishlist" onSelect={() => go("/wishlist")}>
                    <Heart className="ml-2 h-3.5 w-3.5 text-primary" />
                    علاقه‌مندی‌ها · {wishlistIds.length.toLocaleString("fa-IR")}
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