/**
 * Phase 5.1 — ProductList (`/admin/products`).
 *
 * Builds on the consolidated `AdminTable` from
 * `src/components/admin/index.tsx`. Reads `listForAdmin` for the row
 * payload, then projects it through a handful of derived columns:
 * gradient chip, name + slug, category, status, inventory health,
 * creation date, and a per-row actions menu.
 *
 * Search runs client-side against name/slug/category. Status filter
 * is a chip bar that ANDs with the search text. Bulk actions call
 * `api.admin_products.bulkArchive` / `bulkPublish`.
 */
import * as React from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  Copy,
  Edit3,
  Filter,
  Package,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Star,
} from "lucide-react";

import {
  AdminTable,
  AdminEmptyState,
  type AdminTableColumn,
} from "@/components/admin";
import { StatusBadge, type StatusKind } from "@/components/admin";
import { EASE_LUXURY } from "@/lib/motion";
import { cn } from "@/lib/glass";
import { formatPrice } from "@/lib/format";

type ProductRow = Doc<"products">;

const STATUS_FILTERS = [
  { value: "all", label: "همه" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشر شده" },
  { value: "archived", label: "آرشیو شده" },
] as const;

type StatusFilterValue = (typeof STATUS_FILTERS)[number]["value"];

export default function ProductList() {
  const products = useQuery(api.admin_products.listForAdmin, {});
  const bulkArchive = useMutation(api.admin_products.bulkArchive);
  const bulkPublish = useMutation(api.admin_products.bulkPublish);
  const duplicate = useMutation(api.admin_products.duplicate);

  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilterValue>("all");
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setSelectedKeys(new Set());
  }, [query, status]);

  const rows = React.useMemo(() => {
    if (!products) return [];
    const needle = query.trim().toLowerCase();
    return products.filter((row: ProductRow) => {
      if (status !== "all" && row.status !== status) return false;
      if (!needle) return true;
      return [row.name, row.slug, row.category, row.collectionSlug]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [products, query, status]);

  const toggle = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const bulkAction = selectedKeys.size > 0 ? (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={async () => {
          await bulkArchive({ ids: [...selectedKeys] as Id<"products">[] });
          setSelectedKeys(new Set());
        }}
        className="rounded-full bg-canvas/40 px-2 py-1 text-[10px] uppercase tracking-[0.18em] hover:bg-canvas/60"
      >
        بایگانی
      </button>
      <button
        type="button"
        onClick={async () => {
          await bulkPublish({ ids: [...selectedKeys] as Id<"products">[] });
          setSelectedKeys(new Set());
        }}
        className="rounded-full bg-canvas/40 px-2 py-1 text-[10px] uppercase tracking-[0.18em] hover:bg-canvas/60"
      >
        انتشار
      </button>
    </div>
  ) : null;

  const columns: AdminTableColumn<ProductRow>[] = [
    {
      key: "preview",
      header: "",
      cell: (row) => <GradientChip row={row} />,
      className: "w-[72px]",
    },
    {
      key: "name",
      header: "عنوان",
      sortable: true,
      sortValue: (row) => row.name,
      cell: (row) => (
        <Link
          to={`/admin/products/${row._id}`}
          className="block transition hover:text-primary"
        >
          <p className="font-display text-base leading-tight text-ink">
            {row.name || "بدون عنوان"}
          </p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            {row.slug}
          </p>
        </Link>
      ),
    },
    {
      key: "category",
      header: "دسته‌بندی",
      cell: (row) => (
        <span className="text-xs uppercase tracking-[0.16em] text-ink-soft">
          {row.category}
        </span>
      ),
    },
    {
      key: "status",
      header: "وضعیت",
      cell: (row) => <StatusBadge status={row.status as StatusKind} />,
    },
    {
      key: "price",
      header: "قیمت",
      cell: (row) => (
        <span className="font-medium text-ink type-caption">
          {row.priceCents > 0 ? formatPrice(row.priceCents / 100) : "—"}
        </span>
      ),
    },
    {
      key: "flags",
      header: "نشان‌ها",
      cell: (row) => (
        <div className="flex flex-wrap items-center gap-1">
          {row.featured ? (
            <Pill tone="primary">
              <Star className="h-2.5 w-2.5" /> ویژه
            </Pill>
          ) : null}
          {row.trending ? (
            <Pill tone="info">
              <Sparkles className="h-2.5 w-2.5" /> پرطرفدار
            </Pill>
          ) : null}
          {row.editorial ? (
            <Pill tone="neutral">
              <Edit3 className="h-2.5 w-2.5" /> ادیتوریال
            </Pill>
          ) : null}
          {!row.featured && !row.trending && !row.editorial ? (
            <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
              —
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "created",
      header: "تاریخ ایجاد",
      cell: (row) => (
        <span className="text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          {new Date(row._creationTime).toLocaleDateString("fa-IR")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => <RowActions row={row} onDuplicate={handleDuplicate} />,
      className: "w-[60px]",
    },
  ];

  const handleDuplicate = React.useCallback(
    async (productId: Id<"products">) => {
      await duplicate({ id: productId });
    },
    [duplicate],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">کاتالوگ</p>
          <h1 className="mt-2 font-display text-4xl text-ink lg:text-5xl">
            محصولات
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            تمام تکه‌های لونا — پیش‌نویس، منتشر شده و آرشیو شده — در یک جدول
            قابل جست‌وجو.
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 self-start rounded-full bg-ink px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          <Plus className="h-3.5 w-3.5" /> محصول تازه
        </Link>
      </header>

      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_LUXURY }}
        className="flex flex-wrap items-center gap-2"
      >
        <Filter className="h-3.5 w-3.5 text-ink-muted" />
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] transition",
              status === filter.value
                ? "bg-ink text-canvas"
                : "hairline bg-canvas/70 text-ink-soft hover:bg-white",
            )}
          >
            {filter.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          {rows.length} از {products?.length ?? 0}
        </span>
      </motion.div>

      <AdminTable
        rows={rows}
        rowKey={(row) => row._id}
        columns={columns}
        isLoading={products === undefined}
        searchPlaceholder="جست‌وجو بر اساس نام، اسلاگ یا کالکسیون…"
        searchValue={query}
        onSearchChange={setQuery}
        selectedKeys={[...selectedKeys]}
        onToggleRow={toggle}
        bulkAction={bulkAction}
        empty={
          <AdminEmptyState
            title={
              products && products.length > 0
                ? "نتیجه‌ای پیدا نشد."
                : "هنوز محصولی پیش‌نویس نشده است."
            }
            body={
              products && products.length > 0
                ? "فیلتر وضعیت یا جست‌وجو را کمی بازتر کنید."
                : "برای شروع، روی «محصول تازه» در بالا کلیک کنید."
            }
            icon={<Package className="h-5 w-5" />}
            action={
              <Link
                to="/admin/products/new"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-canvas hover:bg-primary"
              >
                شروع یک پیش‌نویس <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              </Link>
            }
          />
        }
      />
    </div>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "primary" | "info" | "neutral";
  children: React.ReactNode;
}) {
  const cls =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "info"
        ? "bg-sky-100 text-sky-700"
        : "bg-zinc-100 text-zinc-600";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]",
        cls,
      )}
    >
      {children}
    </span>
  );
}

function GradientChip({ row }: { row: ProductRow }) {
  const grad =
    row.secondaryGradient ?? (row.colors[0]?.gradient ?? "oat");
  const cls =
    grad === "oat"
      ? "gradient-oat"
      : grad === "mist"
        ? "gradient-mist"
        : grad === "rose"
          ? "gradient-rose-quartz"
          : "gradient-deep";
  return (
    <div
      className={cn(
        "h-12 w-10 overflow-hidden rounded-lg ring-1 ring-inset ring-white/40",
        cls,
      )}
    />
  );
}

function RowActions({
  row,
  onDuplicate,
}: {
  row: ProductRow;
  onDuplicate: (id: Id<"products">) => Promise<void>;
}) {
  const archive = useMutation(api.admin_products.archive);
  const restore = useMutation(api.admin_products.restore);
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        to={`/admin/products/${row._id}`}
        aria-label="ویرایش"
        className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white"
      >
        <Edit3 className="h-3.5 w-3.5 text-ink" />
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onDuplicate(row._id);
          } finally {
            setBusy(false);
          }
        }}
        aria-label="کپی"
        className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white disabled:opacity-40"
      >
        <Copy className="h-3.5 w-3.5 text-ink" />
      </button>
      {row.status === "archived" ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await restore({ id: row._id });
            } finally {
              setBusy(false);
            }
          }}
          aria-label="بازنشانی"
          className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5 text-ink" />
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await archive({ id: row._id });
            } finally {
              setBusy(false);
            }
          }}
          aria-label="بایگانی"
          className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white disabled:opacity-40"
        >
          <Archive className="h-3.5 w-3.5 text-ink" />
        </button>
      )}
      <PublishGate row={row} />
    </div>
  );
}

function PublishGate({ row }: { row: ProductRow }) {
  const publish = useMutation(api.admin_products.publish);
  const [busy, setBusy] = React.useState(false);
  if (row.status === "published") return null;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await publish({ id: row._id });
        } catch {
          // The publish mutation throws INCOMPLETE:… — the wizard
          // already shows the validation summary on /edit. We just
          // swallow here so the user isn't surprised by a toast.
        } finally {
          setBusy(false);
        }
      }}
      aria-label="انتشار"
      title="انتشار مستقیم از فهرست"
      className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white disabled:opacity-40"
    >
      <Send className="h-3.5 w-3.5 text-ink" />
    </button>
  );
}
