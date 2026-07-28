import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  LogOut,
  Package,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { mockOrders } from "@/data/catalog";
import { getProductById } from "@/data/catalog";
import { useWishlist } from "@/hooks/use-wishlist";
import { products } from "@/data/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatDate, formatPrice } from "@/lib/format";

const tabKeys = ["overview", "orders", "saved", "profile"] as const;
type TabKey = (typeof tabKeys)[number];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { ids } = useWishlist();
  const navigate = useNavigate();
  const [active, setActive] = useState<TabKey>(tabKeys[0]);

  const saved = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const tabs: { id: TabKey; label: string; icon: typeof Package }[] = [
    { id: "overview", label: "Overview", icon: Package },
    { id: "orders", label: "Orders", icon: Package },
    { id: "saved", label: "Saved", icon: Heart },
    { id: "profile", label: "Profile", icon: Settings },
  ];

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
      <div className="mt-12 flex flex-wrap items-center gap-1 border-b border-edge pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition",
              active === t.id
                ? "bg-ink text-canvas"
                : "text-ink-soft hover:bg-white/40 hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_LUXURY }}
        className="mt-10"
      >
        {active === "overview" && (
          <div className="grid gap-5 md:grid-cols-3">
            <GlassStat label="Active Orders" value={String(mockOrders.filter((o) => o.status === "shipped" || o.status === "processing").length)} />
            <GlassStat label="Saved Pieces" value={String(saved.length)} />
            <GlassStat label="Patron Since" value="MMXXIV" />
          </div>
        )}

        {active === "orders" && (
          <ul className="space-y-4">
            {mockOrders.map((order) => {
              const first = order.items[0];
              const product = first ? getProductById(first.productId) : undefined;
              return (
                <li key={order.id} className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="type-eyebrow text-ink-muted">Order {order.number}</p>
                      <p className="mt-1 font-display text-xl text-ink">
                        {formatPrice(order.total, true)}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        Placed {formatDate(order.placedAt)} · {order.status[0].toUpperCase() + order.status.slice(1)}
                      </p>
                    </div>
                    <div className="h-24 w-20 overflow-hidden rounded-xl">
                      {product && (
                        <ProductImage
                          gradient={
                            product.colors[0].gradient === "oat"
                              ? "gradient-oat"
                              : product.colors[0].gradient === "mist"
                              ? "gradient-mist"
                              : product.colors[0].gradient === "rose"
                              ? "gradient-rose-quartz"
                              : "gradient-deep"
                          }
                          silhouette={
                            product.category === "outerwear"
                              ? "coat"
                              : product.category === "knitwear"
                              ? "knit"
                              : product.category === "dresses"
                              ? "dress"
                              : product.category === "trousers"
                              ? "trouser"
                              : product.category === "shirting"
                              ? "shirt"
                              : product.category === "leather"
                              ? "leather"
                              : "accessory"
                          }
                          withMark={false}
                          className="h-full w-full"
                        />
                      )}
                    </div>
                  </div>
                  {order.trackingNumber && (
                    <p className="mt-3 text-xs text-ink-muted">
                      Tracking · {order.trackingNumber}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {active === "saved" && (
          saved.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center">
              <p className="font-display text-2xl text-ink">Nothing saved yet</p>
              <p className="mt-2 text-sm text-ink-soft">
                Pieces you favorite from shop will appear here.
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
                    gradient={
                      p.colors[0].gradient === "oat"
                        ? "gradient-oat"
                        : p.colors[0].gradient === "mist"
                        ? "gradient-mist"
                        : p.colors[0].gradient === "rose"
                        ? "gradient-rose-quartz"
                        : "gradient-deep"
                    }
                    silhouette={
                      p.category === "outerwear"
                        ? "coat"
                        : p.category === "knitwear"
                        ? "knit"
                        : p.category === "dresses"
                        ? "dress"
                        : p.category === "trousers"
                        ? "trouser"
                        : p.category === "shirting"
                        ? "shirt"
                        : p.category === "leather"
                        ? "leather"
                        : "accessory"
                    }
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

        {active === "profile" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="glass rounded-3xl p-8">
              <p className="type-eyebrow text-ink-muted">Profile</p>
              <div className="mt-6 grid gap-4">
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
            <div className="glass rounded-3xl p-8">
              <p className="type-eyebrow text-ink-muted">Communications</p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  { label: "Receive the seasonal letter", on: true },
                  { label: "Atelier event invitations", on: false },
                  { label: "Editorial release notifications", on: true },
                ].map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between rounded-2xl px-3 py-2 hairline"
                  >
                    <span className="text-ink">{row.label}</span>
                    <span
                      className={cn(
                        "grid h-6 w-11 place-items-start rounded-full p-1 transition",
                        row.on ? "bg-primary" : "bg-edge"
                      )}
                    >
                      <span
                        className={cn(
                          "h-4 w-4 rounded-full bg-canvas transition",
                          row.on && "translate-x-5"
                        )}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function GlassStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-strong rounded-3xl p-7">
      <p className="type-eyebrow text-ink-muted">{label}</p>
      <p className="mt-3 font-display text-4xl text-ink lg:text-5xl">{value}</p>
    </div>
  );
}
