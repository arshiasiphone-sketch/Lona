/**
 * Phase 5 — Admin chrome and primitives.
 *
 * One consolidated module exporting the admin layout pieces plus
 * reusable primitives so domain pages can compose them without
 * pulling in a dozen small files. Designed to coexist with the
 * existing storefront `src/components/ui/*` library.
 *
 * Exports
 * ───────
 *   • AdminShell        — wraps every /admin route; sidebar + topbar
 *   • AdminTopBar       — header with search, notifications, user
 *   • AdminSidebar      — role-aware nav (mirrors src/lib/data/permissions)
 *   • AdminBreadcrumb   — URL-derived breadcrumb pills
 *   • StatusBadge       — pill component for product/order/review status
 *   • AdminTable        — generic shadcn-based table for the admin surfaces
 *   • AdminKPI          — KPI tile for the dashboard
 *   • AdminEmptyState   — empty/zero-state for admin lists
 */
import * as React from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  LogOut,
  Search,
  Sparkles,
  Stethoscope,
} from "lucide-react";

import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { useAuth } from "@/hooks/use-auth";
import {
  ADMIN_NAV,
  hasPermission,
  isAdminRole,
  type AdminPermission,
  type AdminRole,
} from "@/lib/data/permissions";
import { LonaMark } from "@/components/brand/LonaLogo";

const GROUP_LABEL_FA: Record<string, string> = {
  Catalogue: "کاتالوگ",
  Operations: "عملیات",
  Content: "محتوا",
  Settings: "تنظیمات",
};

/* ─────────────────────────────────────────────────────────────
 *  AdminShell
 * ───────────────────────────────────────────────────────────── */

export function AdminShell() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-canvas-soft text-ink">
      <div className="grid min-h-screen lg:grid-cols-[264px_1fr]">
        <AdminSidebar role={user?.role as AdminRole | undefined} />
        <div className="min-w-0 flex-1">
          <AdminTopBar
            userName={user?.name ?? ""}
            userEmail={user?.email ?? ""}
            roleLabel={user?.role ?? "user"}
            onSignOut={signOut}
          />
          <main className="mx-auto max-w-[1480px] px-6 py-8 lg:px-10 lg:py-12">
            <AdminBreadcrumb />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_LUXURY }}
              className="mt-6"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  AdminSidebar
 * ───────────────────────────────────────────────────────────── */

function AdminSidebar({ role }: { role?: AdminRole }) {
  const groups: AdminGroup = {
    Catalogue: [],
    Operations: [],
    Content: [],
    Settings: [],
  };
  for (const item of ADMIN_NAV) {
    if (item.href === "/admin") {
      groups.Catalogue.unshift(item);
      continue;
    }
    if (!isAdminRole(role) && !hasPermission(role, item.permission)) continue;
    groups[item.group as keyof AdminGroup].push(item);
  }
  return (
    <aside className="sticky top-0 hidden h-screen border-r border-edge bg-canvas/95 backdrop-blur-xl lg:block">
      <div className="flex h-16 items-center gap-3 border-b border-edge px-5">
        <Link to="/admin" className="flex items-center gap-3">
          <LonaMark size={28} />
          <span className="font-latin-display text-base tracking-[0.32em] text-ink">
            LONA
          </span>
          <span className="text-ink-muted">— مدیریت</span>
        </Link>
      </div>
      <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-4">
        {(Object.keys(groups) as Array<keyof AdminGroup>).map((group) =>
          groups[group].length === 0 ? null : (
            <div key={group} className="mb-6">
              <p className="type-eyebrow mb-2 px-2 text-ink-muted">
                {GROUP_LABEL_FA[group] ?? group}
              </p>
              <ul className="space-y-0.5">
                {groups[group].map((item) => (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      end={item.href === "/admin"}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 rounded-xl px-3 py-2 text-[12.5px] font-medium transition",
                          isActive
                            ? "bg-ink text-canvas"
                            : "text-ink-soft hover:bg-white/70 hover:text-ink",
                        )
                      }
                    >
                      <span className="flex-1">{item.labelFa ?? item.label}</span>
                      <ChevronLeft className="h-3 w-3 opacity-40" />
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ),
        )}
        <div className="mt-12 rounded-2xl border border-edge bg-white/60 p-4 text-xs leading-relaxed text-ink-soft">
          <Stethoscope className="h-4 w-4 text-primary" />
          <p className="mt-2 text-ink">شما در حالت عملیاتی هستید.</p>
          <p className="mt-1">
            هر نوشتن ادمین در <code>لاگ فعالیت</code> با نقش و زمان ثبت می‌شود.
          </p>
        </div>
      </nav>
    </aside>
  );
}

type AdminGroup = Record<
  "Catalogue" | "Operations" | "Content" | "Settings",
  Array<{ href: string; label: string; labelFa: string; permission: AdminPermission; group: string }>
>;

/* ─────────────────────────────────────────────────────────────
 *  AdminTopBar
 * ───────────────────────────────────────────────────────────── */

interface AdminTopBarProps {
  userName?: string;
  userEmail?: string;
  roleLabel: string;
  onSignOut: () => Promise<void> | void;
}

function AdminTopBar({
  userName = "",
  userEmail = "",
  roleLabel,
  onSignOut,
}: AdminTopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-edge bg-canvas/90 px-6 backdrop-blur-xl lg:px-10">
      <form
        role="search"
        className="flex flex-1 items-center gap-2 rounded-full border border-edge bg-white/70 px-3 py-1.5"
      >
        <Search className="h-3.5 w-3.5 text-ink-muted" />
        <input
          type="search"
          placeholder="جست‌وجوی کاتالوگ، سفارش، مشتری…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          dir="rtl"
        />
        <kbd className="hidden text-[10px] tracking-[0.04em] text-ink-muted lg:inline">
          ⌘ K
        </kbd>
      </form>
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full hairline hover:bg-white"
        aria-label="اعلان‌ها"
      >
        <Bell className="h-3.5 w-3.5 text-ink" />
      </button>
      <div className="hidden items-center gap-3 lg:flex">
        <div className="text-right">
          <p className="text-[11px] font-medium tracking-[0.04em] text-ink-muted">
            {roleLabel}
          </p>
          <p className="text-sm text-ink" title={userEmail}>
            {userName || userEmail || "ادمین"}
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="grid h-9 w-9 place-items-center rounded-full hairline text-ink-soft hover:bg-white hover:text-ink"
          aria-label="خروج"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  AdminBreadcrumb
 * ───────────────────────────────────────────────────────────── */

function AdminBreadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  return (
    <nav
      aria-label="مسیر"
      className="flex items-center gap-1 text-[11px] tracking-[0.04em] text-ink-muted"
    >
      <Link to="/admin" className="hover:text-ink">
        مدیریت
      </Link>
      {segments.map((seg, i) => (
        <span key={`${seg}-${i}`} className="flex items-center gap-1">
          <ChevronLeft className="h-3 w-3" />
          <Link
            to={`/${segments.slice(0, i + 1).join("/")}`}
            className={cn(
              "hover:text-ink",
              i === segments.length - 1 && "text-ink",
            )}
          >
            {prettySegmentFa(seg)}
          </Link>
        </span>
      ))}
    </nav>
  );
}

function prettySegmentFa(segment: string) {
  if (!segment) return "";
  if (/^[a-f0-9]{24,}$/i.test(segment)) return "جزئیات";
  const fa: Record<string, string> = {
    products: "محصولات",
    categories: "دسته‌ها",
    collections: "کالکسیون‌ها",
    media: "رسانه",
    inventory: "موجودی",
    orders: "سفارش‌ها",
    customers: "مشتریان",
    reviews: "نظرات",
    coupons: "کوپن‌ها",
    editorial: "محتوای ادبی",
    settings: "تنظیمات",
    new: "جدید",
    permissions: "دسترسی‌ها",
  };
  if (fa[segment]) return fa[segment];
  return segment.replace(/-/g, " ");
}

/* ─────────────────────────────────────────────────────────────
 *  StatusBadge
 * ───────────────────────────────────────────────────────────── */

export type StatusKind =
  | "draft"
  | "published"
  | "archived"
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "returning"
  | "cancelled"
  | "active"
  | "inactive";

const STATUS_TONE: Record<StatusKind, { dot: string; ink: string; bg: string }> = {
  draft: { dot: "bg-ink-muted", ink: "text-ink-muted", bg: "bg-white/70" },
  published: { dot: "bg-emerald-500", ink: "text-emerald-700", bg: "bg-emerald-50" },
  archived: { dot: "bg-zinc-400", ink: "text-zinc-600", bg: "bg-zinc-100" },
  pending: { dot: "bg-amber-500", ink: "text-amber-700", bg: "bg-amber-50" },
  processing: { dot: "bg-amber-500", ink: "text-amber-700", bg: "bg-amber-50" },
  shipped: { dot: "bg-sky-500", ink: "text-sky-700", bg: "bg-sky-50" },
  delivered: { dot: "bg-emerald-500", ink: "text-emerald-700", bg: "bg-emerald-50" },
  returning: { dot: "bg-rose-500", ink: "text-rose-700", bg: "bg-rose-50" },
  cancelled: { dot: "bg-zinc-400", ink: "text-zinc-600", bg: "bg-zinc-100" },
  active: { dot: "bg-emerald-500", ink: "text-emerald-700", bg: "bg-emerald-50" },
  inactive: { dot: "bg-ink-muted", ink: "text-ink-muted", bg: "bg-white/70" },
};

const STATUS_LABEL_FA: Record<StatusKind, string> = {
  draft: "پیش‌نویس",
  published: "منتشر شده",
  archived: "آرشیو",
  pending: "در انتظار",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  returning: "در حال بازگشت",
  cancelled: "لغو شده",
  active: "فعال",
  inactive: "غیرفعال",
};

export function StatusBadge({
  status,
  className,
  label,
}: {
  status: StatusKind;
  className?: string;
  label?: string;
}) {
  const tone = STATUS_TONE[status] ?? STATUS_TONE.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-[0.04em]",
        tone.bg,
        tone.ink,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {label ?? STATUS_LABEL_FA[status] ?? status}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  AdminTable — generic shadcn-style table
 * ───────────────────────────────────────────────────────────── */

export interface AdminTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
}

export interface AdminTableProps<T> {
  rows: T[];
  columns: AdminTableColumn<T>[];
  rowKey: (row: T) => string;
  empty?: React.ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
  selectedKeys?: string[];
  onToggleRow?: (key: string) => void;
  bulkAction?: React.ReactNode;
}

export function AdminTable<T>({
  rows,
  columns,
  rowKey,
  empty,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  isLoading,
  selectedKeys,
  onToggleRow,
  bulkAction,
}: AdminTableProps<T>) {
  return (
    <div className="space-y-4">
      {(searchPlaceholder || onSearchChange) && (
        <div className="flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-full hairline bg-canvas/70 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-ink-muted" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
          </div>
          {selectedKeys && selectedKeys.length > 0 ? (
            <div className="flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-canvas">
              <span className="text-[11px] uppercase tracking-[0.18em]">
                {selectedKeys.length.toLocaleString("fa-IR")} انتخاب شده
              </span>
              {bulkAction}
            </div>
          ) : null}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-edge bg-white/85">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas-soft text-ink-muted">
            <tr>
              {onToggleRow ? (
                <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em]">
                  &nbsp;
                </th>
              ) : null}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em]",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`s-${i}`} className="border-t border-edge/60">
                  {onToggleRow ? <td className="px-4 py-3">&nbsp;</td> : null}
                  {columns.map((col) => (
                    <td key={`s-${i}-${col.key}`} className="px-4 py-3">
                      <span className="block h-3 w-2/3 animate-pulse rounded bg-ink-muted/15" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onToggleRow ? 1 : 0)}
                  className="px-6 py-12 text-center text-sm text-ink-muted"
                >
                  {empty ?? "هنوز موردی ثبت نشده است."}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const key = rowKey(row);
                const selected = selectedKeys?.includes(key) ?? false;
                return (
                  <tr
                    key={key}
                    className={cn(
                      "border-t border-edge/60 transition hover:bg-canvas-soft",
                      selected && "bg-canvas/70",
                    )}
                  >
                    {onToggleRow ? (
                      <td className="px-4 py-3 align-top">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => onToggleRow(key)}
                          className="h-4 w-4 cursor-pointer rounded border-edge accent-ink"
                        />
                      </td>
                    ) : null}
                    {columns.map((col) => (
                      <td
                        key={`${key}-${col.key}`}
                        className={cn("px-4 py-3 align-top", col.className)}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  AdminKPI
 * ───────────────────────────────────────────────────────────── */

export function AdminKPI({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: string;
  trend?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-edge bg-white/85 p-6">
      <div className="flex items-center gap-2 text-ink-muted">
        {icon ? (
          <span className="grid h-7 w-7 place-items-center rounded-full hairline bg-white">
            {icon}
          </span>
        ) : null}
        <p className="type-eyebrow">{label}</p>
      </div>
      <p className="mt-3 font-display text-3xl text-ink lg:text-4xl">{value}</p>
      {trend ? <p className="mt-1 text-[11px] text-ink-soft">{trend}</p> : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  AdminEmptyState
 * ───────────────────────────────────────────────────────────── */

export function AdminEmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-edge bg-white/60 px-8 py-16 text-center">
      {icon ? (
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full hairline bg-white text-primary">
          {icon}
        </span>
      ) : null}
      <p className="font-display text-2xl text-ink">{title}</p>
      {body ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{body}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
