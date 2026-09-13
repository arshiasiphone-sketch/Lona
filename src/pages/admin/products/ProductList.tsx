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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Trash2,
} from "lucide-react";

import {
  AdminTable,
  AdminEmptyState,
  type AdminTableColumn,
} from "@/components/admin";
import { StatusBadge, type StatusKind } from "@/components/admin";
import { QueryErrorBoundary } from "@/components/admin/QueryErrorBoundary";
import { EASE_LUXURY } from "@/lib/motion";
import { cn } from "@/lib/glass";
import { formatPrice } from "@/lib/format";
import { getAdminErrorMessage, withAdminTimeout } from "@/lib/admin-errors";

type ProductRow = Doc<"products">;

const STATUS_FILTERS = [
  { value: "all", label: "همه" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشر شده" },
  { value: "archived", label: "آرشیو شده" },
] as const;

type StatusFilterValue = (typeof STATUS_FILTERS)[number]["value"];	export default function ProductList() {
  const products = useQuery(api.admin_products.listForAdmin, {});
  const bulkArchive = useMutation(api.admin_products.bulkArchive);
	const bulkPublish = useMutation(api.admin_products.bulkPublish);
	const duplicate = useMutation(api.admin_products.duplicate);
	const archive = useMutation(api.admin_products.archive);

	const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilterValue>("all");
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [archivingId, setArchivingId] = React.useState<Id<"products"> | null>(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = React.useState(false);
  const [archiveTarget, setArchiveTarget] = React.useState<ProductRow | null>(null);

  React.useEffect(() => {
    setSelectedKeys(new Set());
  }, [query, status]);

  const rows = React.useMemo(() => {
    if (!products) return [];
    const needle = query.trim().toLowerCase();
    return products.filter((row: ProductRow) => {
      if (status !== "all" && row.status !== status) return false;
      if (!needle) return true;
      return [row.name, row.slug, row.category]
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
  };	  const handleDuplicate = React.useCallback(
    async (productId: Id<"products">) => {
      await duplicate({ id: productId });
    },
    [duplicate],
  );

  const requestArchive = (row: ProductRow) => {
    setArchiveTarget(row);
    setArchiveConfirmOpen(true);
  };	  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setArchivingId(archiveTarget._id);
    try {
      await withAdminTimeout(archive({ id: archiveTarget._id }));
      setArchiveConfirmOpen(false);
      setArchiveTarget(null);
    } catch (error) {
      setActionError(getAdminErrorMessage(error));
    } finally {
      setArchivingId(null);
    }
  };

  const bulkAction = selectedKeys.size > 0 ? (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={bulkBusy}
        onClick={async () => {
          setBulkBusy(true);
          setActionError(null);
          try {
            await withAdminTimeout(bulkArchive({ ids: [...selectedKeys] as Id<"products">[] }));
            setSelectedKeys(new Set());
          } catch (error) {
            setActionError(getAdminErrorMessage(error));
          } finally {
            setBulkBusy(false);
          }
        }}
        className="rounded-full bg-canvas/40 px-2 py-1 text-[10px] uppercase tracking-[0.18em] hover:bg-canvas/60"
      >
        بایگانی
      </button>
      <button
        type="button"
        disabled={bulkBusy}
        onClick={async () => {
          setBulkBusy(true);
          setActionError(null);
          try {
            await withAdminTimeout(bulkPublish({ ids: [...selectedKeys] as Id<"products">[] }));
            setSelectedKeys(new Set());
          } catch (error) {
            setActionError(getAdminErrorMessage(error));
          } finally {
            setBulkBusy(false);
          }
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
          {row.priceCents > 0 ? formatPrice(row.priceCents) : "—"}
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

  return (
    <div className="space-y-6">
      <AlertDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>بایگانی محصول</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget
                ? `آیا از بایگانی محصول «${archiveTarget.name}» مطمئن هستید؟ این محصول از لیست محصولات پنهان می‌شود، اما داده‌های سفارشات تاریخی دست‌نخورده باقی می‌مانند.`
                : "آیا از بایگانی این محصول مطمئن هستید؟"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setArchiveConfirmOpen(false)}>
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchive}
      
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isArchiveBusy ? "در حال بایگانی…" : "بایگانی محصول"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {actionError ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="rounded-full bg-white/80 px-3 py-1 text-[11px] text-rose-800 hover:bg-white"
          >
            بستن
          </button>
        </div>
      ) : null}

      <QueryErrorBoundary
        title="بارگذاری محصولات انجام نشد"
        backTo="/admin"
        backLabel="بازگشت به داشبورد"
      >
      <AdminTable
        rows={rows}
        rowKey={(row) => row._id}
        columns={columns}
        isLoading={products === undefined}
        searchPlaceholder="جست‌وجو بر اساس نام، اسلاگ یا دسته‌بندی…"
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
      </QueryErrorBoundary>
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
  const imageUrl = row.imageUrls?.[0];
  return (
    <div
      className={cn(
        "h-12 w-10 overflow-hidden rounded-lg ring-1 ring-inset ring-white/40",
        cls,
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          width={80}
          height={96}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}

function RowActions({
  row,
  onDuplicate,
}: {
  row: ProductRow;
  onDuplicate: (id: Id<"products">) => Promise<void>;
}) {	const restore = useMutation(api.admin_products.restore);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isArchived = row.status === "archived";
  const isArchiveBusy = archivingId === row._id;

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
          setError(null);
          try {
            await withAdminTimeout(onDuplicate(row._id));
          } catch (actionError) {
            setError(getAdminErrorMessage(actionError));
          } finally {
            setBusy(false);
          }
        }}
        aria-label="کپی"
        className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white disabled:opacity-40"
      >
        <Copy className="h-3.5 w-3.5 text-ink" />
      </button>
      {isArchived ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await withAdminTimeout(restore({ id: row._id }));
            } catch (actionError) {
              setError(getAdminErrorMessage(actionError));
            } finally {
              setBusy(false);
            }
          }}
          aria-label="بازیابی"
          className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5 text-ink" />
        </button>
      ) : (
        <>
          <button
            type="button"
    
            onClick={() => requestArchive(row)}
            aria-label="بایگانی محصول"
            className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
          >
            {isArchiveBusy ? (
              <span className="grid h-3.5 w-3.5 place-items-center">
                <svg className="h-3.5 w-3.5 animate-spin text-ink-soft" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </span>
            ) : (
              <Archive className="h-3.5 w-3.5 text-ink" />
            )}
          </button>
          <PublishGate row={row} />
        </>
      )}
      {error ? <span className="max-w-32 text-[10px] text-rose-700">{error}</span> : null}
    </div>
  );
}

function PublishGate({ row }: { row: ProductRow }) {
  const publish = useMutation(api.admin_products.publish);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  if (row.status === "published") return null;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        setError(null);
        try {
          await withAdminTimeout(publish({ id: row._id }));
        } catch (actionError) {
          setError(getAdminErrorMessage(actionError));
        } finally {
          setBusy(false);
        }
      }}
      aria-label="انتشار"
      title="انتشار مستقیم از فهرست"
      className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white disabled:opacity-40"
    >
      <Send className="h-3.5 w-3.5 text-ink" />
      {error ? <span className="sr-only">{error}</span> : null}
    </button>
  );
}
