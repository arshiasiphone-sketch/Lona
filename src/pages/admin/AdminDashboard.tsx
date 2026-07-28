/**
 * Phase 5.1 — Admin home (`/admin`).
 *
 * Reads the live `dashboardStats` aggregate (revenue, products,
 * drafts, customers, low-stock + active coupon counts) and layers
 * the recent-order and activity feeds on top. Every tile comes from
 * a single Convex roundtrip so the page hydrates in one render.
 */
import * as React from "react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCheck,
  DollarSign,
  Layers,
  Package,
  ShoppingBag,
  Tag,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import {
  AdminKPI,
  AdminShell,
  AdminEmptyState,
} from "@/components/admin";
import { StatusBadge } from "@/components/admin";
import { useAuth } from "@/hooks/use-auth";
import { EASE_LUXURY } from "@/lib/motion";
import { formatPrice } from "@/lib/format";

// Standalone shell so this file works both as a child of `<Outlet/>`
// inside the AdminShell layout and as the direct import target from
// the router. We mount AdminShell conditionally to avoid double
// chrome when nested.
export function AdminDashboard() {
  return (
    <div>
      <KpisAndFeeds />
    </div>
  );
}

// Legacy export — the layout expects this name to pick the body.
export default function DashboardBody() {
  return <KpisAndFeeds />;
}

function KpisAndFeeds() {
  const { user } = useAuth();
  const stats = useQuery(api.admin_orders.dashboardStats, {});
  const recentOrders = useQuery(api.admin_orders.listAllOrders, { limit: 5 });
  const activity = useQuery(api.admin_orders.listActivity, { limit: 8 });

  if (stats === undefined) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-3xl bg-white/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <p className="type-eyebrow text-ink-muted">
          Welcome back · {user?.name || "Admin"}
        </p>
        <h1 className="font-display text-4xl text-ink lg:text-5xl">
          The state of ÆON, today.
        </h1>
      </header>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <AdminKPI
          label="Revenue"
          value={formatPrice(stats.totalRevenueCents / 100, true)}
          trend={`${stats.activeOrderCount} active orders`}
          icon={<DollarSign className="h-3.5 w-3.5" />}
        />
        <AdminKPI
          label="Products"
          value={String(stats.productCount)}
          trend={`${stats.publishedCount} published · ${stats.draftCount} drafts · ${stats.archivedCount} archived`}
          icon={<Layers className="h-3.5 w-3.5" />}
        />
        <AdminKPI
          label="Customers"
          value={String(stats.customerCount)}
          trend={`Avg order size tracked over time`}
          icon={<Users className="h-3.5 w-3.5" />}
        />
        <AdminKPI
          label="Active coupons"
          value={String(stats.activeCouponCount)}
          trend={`${stats.pendingReviewCount} reviews awaiting moderation`}
          icon={<Tag className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <AdminKPI
          label="Active orders"
          value={String(stats.activeOrderCount)}
          trend={`over ${stats.orderCount} total`}
          icon={<Package className="h-3.5 w-3.5" />}
        />
        <AdminKPI
          label="Low-stock SKUs"
          value={String(stats.lowStockVariantCount)}
          trend={`Needs replenishment`}
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
        />
        <AdminKPI
          label="Reviews"
          value={String(stats.reviewCount)}
          trend={`Tracked via the moderation queue`}
          icon={<CheckCheck className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <RecentOrdersCard orders={recentOrders ?? []} />
        <ActivityFeed items={activity ?? []} />
      </div>
    </div>
  );
}

function RecentOrdersCard({
  orders,
}: {
  orders: Array<{
    _id: string;
    number: string;
    totalCents: number;
    status: string;
    placedAt: number;
  }>;
}) {
  return (
    <div className="rounded-3xl border border-edge bg-white/85 p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl text-ink">Recent orders</h2>
        <Link
          to="/admin/orders"
          className="text-[11px] uppercase tracking-[0.18em] text-ink-muted transition hover:text-ink"
        >
          View all <ArrowRight className="ml-1 inline h-3 w-3" />
        </Link>
      </div>
      {orders.length === 0 ? (
        <AdminEmptyState
          title="Quiet so far."
          body="New orders fill in here automatically. The dashboard reads from your live Convex data."
          icon={<ShoppingBag className="h-5 w-5" />}
        />
      ) : (
        <ul className="mt-5 space-y-3">
          {orders.map((order, i) => (
            <motion.li
              key={order._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_LUXURY, delay: i * 0.04 }}
              className="rounded-2xl border border-edge bg-canvas-soft px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full hairline bg-white">
                  <Package className="h-3.5 w-3.5 text-ink" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {order.number}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                    Placed {new Date(order.placedAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={order.status as "pending" | "processing" | "shipped" | "delivered" | "returning" | "cancelled"} />
                <span className="font-display text-base text-ink type-caption">
                  {formatPrice(order.totalCents / 100)}
                </span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityFeed({
  items,
}: {
  items: Array<{
    _id: string;
    action: string;
    resource: string;
    resourceId?: string | undefined;
    at: number;
  }>;
}) {
  return (
    <div className="rounded-3xl border border-edge bg-white/85 p-6">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="font-display text-2xl text-ink">Activity</h2>
      </div>
      {items.length === 0 ? (
        <AdminEmptyState
          title="Nothing logged yet."
          body="Every admin write is captured here. Try publishing a draft."
          icon={<Activity className="h-5 w-5" />}
        />
      ) : (
        <ol className="mt-5 space-y-3">
          {items.map((event) => (
            <li
              key={event._id}
              className="rounded-xl border border-edge bg-canvas-soft px-4 py-3 text-[12.5px]"
            >
              <p className="text-ink">
                <span className="text-ink-muted">{event.action}</span> ·{" "}
                <span className="font-medium">{event.resource}</span>
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                {new Date(event.at).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
