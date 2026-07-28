import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  LogOut,
  Package,
  Plus,
  Settings,
  MapPin,
  Bell,
  Eye,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { mockOrders, getProductById, products } from "@/data/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatDate, formatPrice } from "@/lib/format";

const tabKeys = ["overview", "orders", "saved", "addresses", "preferences", "recent"] as const;
type TabKey = (typeof tabKeys)[number];

const tabLabels: Record<TabKey, string> = {
  overview: "Overview",
  orders: "Orders",
  saved: "Saved",
  addresses: "Addresses",
  preferences: "Preferences",
  recent: "Recently viewed",
};

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

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { ids: wishlistIds } = useWishlist();
  const { ids: recentIds, clear: clearRecent } = useRecentlyViewed();
  const { itemCount, clear: clearCart } = useCart();
  const navigate = useNavigate();
  const [active, setActive] = useState<TabKey>("overview");

  const saved = wishlistIds.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const recent = recentIds.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">The Workspace</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-7xl">
            Welcome back{user?.name ? `, ${user.name}` : ""}.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">
            Your orders, saved pieces and profile — quietly held together.
          </p>
        </div>
        <button
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          className="inline-flex items-center gap-2 rounded-full hairline px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft transition hover:bg-white/60 hover:text-ink"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </header>

      {/* Tab nav */}
      <div className="mt-12 flex flex-wrap items-center gap-1.5 border-b border-edge pb-3">
        {tabKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={cn(
              "rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition",
              active === key
                ? "bg-ink text-canvas"
                : "text-ink-soft hover:bg-white/40 hover:text-ink"
            )}
          >
            {tabLabels[key]}
          </button>
        ))}
      </div>

      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_LUXURY }}
        className="mt-10"
      >
        {active === "overview" && (
          <div className="grid gap-5 md:grid-cols-4">
            <StatCard label="Active Orders" value={String(mockOrders.filter((o) => o.status === "shipped" || o.status === "processing").length)} icon={<Package className="h-3.5 w-3.5" />} />
            <StatCard label="Saved Pieces" value={String(saved.length)} icon={<Heart className="h-3.5 w-3.5" />} />
            <StatCard label="In Bag" value={String(itemCount)} icon={<Plus className="h-3.5 w-3.5" />} />
            <StatCard label="Patron Since" value="MMXXIV" icon={<Settings className="h-3.5 w-3.5" />} />
          </div>
        )}

        {active === "orders" && (
          <div className="space-y-4">
            {mockOrders.length === 0 ? (
              <p className="glass rounded-3xl px-8 py-12 text-center text-sm text-ink-muted">
                No orders yet. Begin a piece from the catalogue.
              </p>
            ) : (
              mockOrders.map((order) => {
                const first = order.items[0];
                const product = first ? getProductById(first.productId) : undefined;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE_LUXURY }}
                    className="glass rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="type-eyebrow text-ink-muted">Order {order.number}</p>
                        <p className="mt-1 font-display text-xl text-ink">
                          {formatPrice(order.total, true)}
                        </p>
                        <p className="mt-1 text-xs text-ink-soft">
                          Placed {formatDate(order.placedAt)} ·{" "}
                          <span className="text-primary">
                            {order.status[0].toUpperCase() + order.status.slice(1)}
                          </span>
                        </p>
                      </div>
                      <div className="h-24 w-20 overflow-hidden rounded-xl">
                        {product && (
                          <ProductImage
                            gradient={product.colors[0].gradient}
                            silhouette={silhouetteFor(product.category)}
                            withMark={false}
                            className="h-full w-full"
                          />
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      {order.trackingNumber && (
                        <p className="text-xs text-ink-muted">
                          Tracking · {order.trackingNumber}
                        </p>
                      )}
                      <button className="ml-auto inline-flex items-center gap-2 rounded-full hairline bg-canvas/60 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-ink hover:bg-white">
                        View order
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {active === "saved" && (
          saved.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center">
              <p className="font-display text-2xl text-ink">Nothing saved yet</p>
              <p className="mt-2 text-sm text-ink-soft">
                Pieces you favorite from the shop will appear here.
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-canvas hover:bg-primary"
              >
                Browse Catalogue
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {saved.map((p) => (
                <Link key={p.id} to={`/shop/${p.slug}`} className="glass rounded-2xl p-3 transition hover:bg-white/60">
                  <ProductImage
                    gradient={p.colors[0].gradient}
                    silhouette={silhouetteFor(p.category)}
                    withMark={false}
                    className="aspect-[4/5] w-full"
                  />
                  <p className="mt-3 font-display text-base text-ink">{p.name}</p>
                  <p className="mt-1 text-xs text-ink-muted">{formatPrice(p.price)}</p>
                </Link>
              ))}
            </div>
          )
        )}

        {active === "addresses" && (
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              {
                label: "Default · Milan",
                name: "Lou Bertrand",
                line1: "Via dei Giardini 14",
                city: "20121 Milano, IT",
              },
              {
                label: "Atelier · New York",
                name: "Lou Bertrand",
                line1: "118 Greene Street",
                city: "SoHo, NY 10012, US",
              },
            ].map((addr) => (
              <div key={addr.label} className="glass rounded-3xl p-7">
                <p className="type-eyebrow text-ink-muted">{addr.label}</p>
                <p className="mt-3 font-display text-xl text-ink">{addr.name}</p>
                <p className="mt-2 text-sm text-ink-soft">{addr.line1}</p>
                <p className="text-sm text-ink-soft">{addr.city}</p>
                <div className="mt-6 flex items-center gap-3">
                  <button className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/60 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-ink hover:bg-white">
                    Edit
                  </button>
                  <button className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink">
                    Make default
                  </button>
                </div>
              </div>
            ))}
            <div className="glass rounded-3xl p-7 lg:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="type-eyebrow text-ink-muted">Add new address</p>
                  <p className="mt-2 font-display text-lg text-ink">
                    Used for shipment, atelier returns, and white-glove scheduling.
                  </p>
                </div>
                <MapPin className="h-4 w-4 text-ink-muted" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">Country</span>
                  <select className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>United States</option>
                    <option>Italy</option>
                    <option>Japan</option>
                  </select>
                </label>
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">Postal code</span>
                  <input className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" placeholder="00000" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="type-eyebrow text-ink-muted">Street address</span>
                  <input className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" placeholder="118 Greene Street" />
                </label>
              </div>
              <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary">
                Save address
              </button>
            </div>
          </div>
        )}

        {active === "preferences" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass rounded-3xl p-7">
              <p className="type-eyebrow text-ink-muted">Profile</p>
              <div className="mt-5 grid gap-4">
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">Name</span>
                  <input
                    defaultValue={user?.name ?? ""}
                    className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">Email</span>
                  <input
                    type="email"
                    defaultValue={user?.email ?? ""}
                    className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
              </div>
            </div>

            <div className="glass rounded-3xl p-7">
              <p className="type-eyebrow text-ink-muted">Notifications</p>
              <ul className="mt-5 space-y-3">
                {[
                  { label: "Receive the seasonal letter", on: true },
                  { label: "Atelier event invitations", on: false },
                  { label: "Editorial release notifications", on: true },
                  { label: "Restock alerts on saved pieces", on: true },
                ].map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between rounded-2xl px-3 py-2 hairline"
                  >
                    <span className="text-sm text-ink">{row.label}</span>
                    <Switch initial={row.on} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-3xl p-7 lg:col-span-2">
              <p className="type-eyebrow text-ink-muted">Reading & measurement</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">Currency</span>
                  <select className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>USD · $</option>
                    <option>EUR · €</option>
                    <option>GBP · £</option>
                    <option>JPY · ¥</option>
                  </select>
                </label>
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">Language</span>
                  <select className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>English</option>
                    <option>Italiano</option>
                    <option>日本語</option>
                    <option>Français</option>
                  </select>
                </label>
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">Letter size</span>
                  <select className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>EU · 38</option>
                    <option>US · 8</option>
                    <option>JP · 9</option>
                    <option>Custom</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="glass rounded-3xl p-7 lg:col-span-2">
              <p className="type-eyebrow text-ink-muted">Concierge data</p>
              <p className="mt-3 text-sm text-ink-soft">
                You can wipe your bag and recently-viewed history at any time. Saved wishlist
                items remain for ninety days.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    clearCart();
                  }}
                  className="rounded-full hairline bg-canvas/60 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft hover:bg-white"
                >
                  Clear bag
                </button>
                <button
                  onClick={clearRecent}
                  className="rounded-full hairline bg-canvas/60 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft hover:bg-white"
                >
                  Clear recently viewed
                </button>
              </div>
            </div>
          </div>
        )}

        {active === "recent" && (
          recent.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center">
              <Eye className="mx-auto h-5 w-5 text-ink-soft" />
              <p className="mt-4 font-display text-2xl text-ink">Nothing recent.</p>
              <p className="mt-2 text-sm text-ink-soft">
                Pieces you browse will appear here. Up to 20 items are kept locally.
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-canvas hover:bg-primary"
              >
                Browse
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                {recent.slice(0, 16).map((p) => (
                  <Link key={p.id} to={`/shop/${p.slug}`} className="glass rounded-2xl p-3 transition hover:bg-white/60">
                    <ProductImage
                      gradient={p.colors[0].gradient}
                      silhouette={silhouetteFor(p.category)}
                      withMark={false}
                      className="aspect-[4/5] w-full"
                    />
                    <p className="mt-3 font-display text-base text-ink">{p.name}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                      {formatPrice(p.price)}
                    </p>
                  </Link>
                ))}
              </div>
              {recent.length > 0 && (
                <div className="mt-10 text-right">
                  <button
                    onClick={clearRecent}
                    className="text-[11px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink"
                  >
                    Clear history
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </motion.div>

      {/* Hidden accessibility landmarks */}
      <div className="sr-only">
        <p>Account workspace skeleton</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_LUXURY }}
      className="glass-strong rounded-3xl p-7"
    >
      <div className="flex items-center gap-2 text-ink-muted">
        <span className="grid h-7 w-7 place-items-center rounded-full hairline bg-white/50">
          {icon}
        </span>
        <p className="type-eyebrow">{label}</p>
      </div>
      <p className="mt-4 font-display text-4xl text-ink lg:text-5xl">{value}</p>
    </motion.div>
  );
}

function Switch({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className={cn(
        "relative grid h-6 w-11 place-items-start rounded-full p-1 transition",
        on ? "bg-primary" : "bg-edge"
      )}
    >
      <span
        className={cn(
          "h-4 w-4 rounded-full bg-canvas transition-transform duration-300",
          on && "translate-x-5"
        )}
      />
    </button>
  );
}
