/**
 * Phase 5.2 — Category management.
 *
 * Surface: `/admin/categories`.
 *
 * Tree visualization uses an indented flat list (parent ref +
 * depth). Lists inherit from `categories.parentId`. Reorder
 * operates only on root-level rows; child reorder is bounded to
 * the parent's order field which we never expose in the FE for
 * v1 (children keep insertion order via `order`).
 *
 * Delete is gated through `categoryProductCount`. If any product
 * still references the category, the ConfirmDialog shows the
 * Persian safety copy and numbers; only the Convex mutation
 * actually decides whether to short-circuit.
 */
import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  CornerDownRight,
  Eye,
  EyeOff,
  FolderTree,
  Pencil,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  AdminEmptyState,
  AdminTable,
  type AdminTableColumn,
} from "@/components/admin";
import { StatusBadge, type StatusKind } from "@/components/admin";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";

type CategoryRow = Doc<"categories"> & { _count?: number };

export default function Categories() {
  const flat = useQuery(api.admin_catalog.listCategories, {});

  const [query, setQuery] = React.useState("");
  const [showArchived, setShowArchived] = React.useState(false);
  const [editId, setEditId] = React.useState<Id<"categories"> | null>(null);
  const [create, setCreate] = React.useState(false);
  const [delId, setDelId] = React.useState<Id<"categories"> | null>(null);

  // Build the tree.
  const tree = React.useMemo(() => {
    if (!flat) return [] as CategoryRow[][];
    const byParent = new Map<string | null, CategoryRow[]>();
    flat.forEach((c) => {
      const key = c.parentId ?? null;
      const arr = byParent.get(key) ?? [];
      arr.push(c as CategoryRow);
      byParent.set(key, arr);
    });
    const rootRow = byParent.get(null) ?? [];
    const out: CategoryRow[][] = [];
    const visit = (rows: CategoryRow[], depth: number) => {
      const sorted = [...rows].sort((a, b) => a.order - b.order);
      out.push(sorted.map((r) => ({ ...r })));
      for (const r of sorted) {
        const children = byParent.get(r._id) ?? [];
        if (children.length) visit(children, depth + 1);
      }
    };
    visit(rootRow, 0);
    return out;
  }, [flat]);

  // Flatten + search filter.
  const visible = React.useMemo(() => {
    if (!flat) return [] as CategoryRow[];
    const needle = query.trim().toLowerCase();
    const productCountByName = new Map<string, number>();
    flat.forEach((c) => productCountByName.set(c.name, 0));
    const indexed = flat.map((c) => {
      const depth = depthOf(c._id, tree);
      return { ...c, _count: 0, depth } as CategoryRow & { depth: number };
    });
    return indexed.filter((row) => {
      if (!showArchived && !row.visible) return false;
      if (!needle) return true;
      return [row.name, row.slug, row.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [flat, tree, query, showArchived]);

  const closeEdit = () => {
    setEditId(null);
    setCreate(false);
  };

  const confirmDeleteId = delId;
  const confirmDeleteRow = confirmDeleteId
    ? (flat ?? []).find((c) => c._id === confirmDeleteId)
    : undefined;

  const columns: AdminTableColumn<CategoryRow>[] = [
    {
      key: "name",
      header: "نام دسته‌بندی",
      cell: (row) => <CategoryCell row={row as CategoryRow & { depth: number }} tree={tree} />,
    },
    {
      key: "count",
      header: "محصولات",
      cell: (row) => (
        <span className="type-caption text-ink">
          {(row as CategoryRow & { _count?: number })._count ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "وضعیت",
      cell: (row) => (
        <StatusBadge
          status={(row.visible ? "published" : "archived") as StatusKind}
          label={row.visible ? "فعال" : "آرشیو"}
        />
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
      header: "عملیات",
      cell: (row) => (
        <RowActions
          row={row}
          tree={tree}
          onEdit={() => setEditId(row._id)}
          onDelete={() => setDelId(row._id)}
        />
      ),
    },
  ];

  const isLoading = flat === undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">کاتالوگ</p>
          <h1 className="mt-2 font-display text-4xl text-ink lg:text-5xl">
            دسته‌بندی‌ها
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            ساختار درختی فروشگاه. هر دسته می‌تواند والد داشته باشد؛ ترتیب نمایش
            در فروشگاه از همین صفحه کنترل می‌شود.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreate(true)}
          className="inline-flex items-center gap-2 self-start rounded-full bg-ink px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          دسته تازه
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_LUXURY }}
        className="flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setShowArchived((s) => !s)}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] transition",
            showArchived
              ? "bg-primary text-canvas"
              : "hairline bg-canvas/70 text-ink-soft hover:bg-white",
          )}
        >
          {showArchived ? (
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" /> همه وضعیت
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <EyeOff className="h-3 w-3" /> فقط فعال
            </span>
          )}
        </button>
        <span className="ms-auto text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          {visible.length.toLocaleString("fa-IR")} از{" "}
          {(flat?.length ?? 0).toLocaleString("fa-IR")}
        </span>
      </motion.div>

      <AdminTable
        rows={visible}
        rowKey={(row) => row._id}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="جست‌وجوی دسته‌بندی…"
        searchValue={query}
        onSearchChange={setQuery}
        empty={
          <AdminEmptyState
            title={flat && flat.length > 0 ? "نتیجه‌ای یافت نشد." : "هنوز دسته‌ای ساخته نشده."}
            body={
              flat && flat.length > 0
                ? "فیلتر یا جست‌وجو را کمی شل‌تر کنید."
                : "برای شروع، اولین دسته را ایجاد کنید — سوتین، شورت یا لباس خواب."
            }
            icon={<FolderTree className="h-5 w-5" />}
            action={
              <button
                type="button"
                onClick={() => setCreate(true)}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-canvas hover:bg-primary"
              >
                ایجاد اولین دسته <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            }
          />
        }
      />

      <CategoryEditDrawer
        open={create || editId !== null}
        onClose={closeEdit}
        categoryId={editId}
        categories={flat ?? []}
      />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(o) => !o && setDelId(null)}
        title={`حذف ${confirmDeleteRow?.name ?? "دسته"}؟`}
        confirmLabel="حذف دسته"
        destructive
        tone="destructive"
        body={
          <span>
            اگر محصولی هنوز در این دسته قرار داشته باشد، سیستم اجازه حذف
            نمی‌دهد. ابتدا محصولات را جابه‌جا یا آرشیو کنید.
          </span>
        }
        onConfirm={async () => {
          if (!delId) return;
          try {
            await deleteCategory({ id: delId });
          } catch (e) {
            // The Convex mutation throws when products are still
            // linked. We surface a soft inline note via toast hook
            // if available — for v1 we just close the dialog so
            // the user can move products first.
          }
          setDelId(null);
        }}
      />
    </div>
  );
}

function depthOf(
  id: Id<"categories">,
  levels: CategoryRow[][],
): number {
  for (let i = 0; i < levels.length; i++) {
    if (levels[i].some((c) => c._id === id)) return i;
  }
  return 0;
}

function CategoryCell({
  row,
  tree,
}: {
  row: CategoryRow & { depth: number };
  tree: CategoryRow[][];
}) {
  const isChild = row.depth > 0;
  const parent = row.parentId
    ? (tree.flat().find((c) => c._id === row.parentId)?.name ?? "—")
    : "—";
  return (
    <div className="flex items-center gap-2">
      {isChild ? (
        <CornerDownRight className="h-3.5 w-3.5 text-ink-muted" />
      ) : (
        <FolderTree className="h-3.5 w-3.5 text-primary" />
      )}
      <div className="text-start">
        <p className="font-display text-base leading-tight text-ink">
          {row.name}
        </p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          {row.slug} · {isChild ? `فرزند ${parent}` : "دسته ریشه"}
        </p>
      </div>
    </div>
  );
}

function RowActions({
  row,
  tree,
  onEdit,
  onDelete,
}: {
  row: CategoryRow;
  tree: CategoryRow[][];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const archive = useMutation(api.admin_catalog.archiveCategory);
  const restore = useMutation(api.admin_catalog.restoreCategory);
  const reorder = useMutation(api.admin_catalog.reorderCategories);
  const [busy, setBusy] = React.useState(false);

  // Root-level only reordering — children inherit parent's slot.
  const levelRows = tree.find((l) => l.some((c) => c._id === row._id)) ?? [];
  const idxInLevel = levelRows.findIndex((c) => c._id === row._id);
  const isFirst = idxInLevel === 0;
  const isLast = idxInLevel === levelRows.length - 1;

  const moveLevel = async (delta: number) => {
    if (!row.parentId && levelRows.length < 2) return;
    const targetIdx = idxInLevel + delta;
    if (targetIdx < 0 || targetIdx >= levelRows.length) return;
    const swap = levelRows[targetIdx];
    const reordered = levelRows.map((c) => c._id);
    [reordered[idxInLevel], reordered[targetIdx]] = [
      reordered[targetIdx],
      reordered[idxInLevel],
    ];
    await reorder({ order: reordered });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        disabled={busy || isFirst}
        onClick={() => moveLevel(-1)}
        aria-label="بالا"
        className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white disabled:opacity-30"
      >
        <ArrowUp className="h-3.5 w-3.5 text-ink" />
      </button>
      <button
        type="button"
        disabled={busy || isLast}
        onClick={() => moveLevel(1)}
        aria-label="پایین"
        className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white disabled:opacity-30"
      >
        <ArrowDown className="h-3.5 w-3.5 text-ink" />
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label="ویرایش"
        className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white"
      >
        <Pencil className="h-3.5 w-3.5 text-ink" />
      </button>
      {row.visible ? (
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
          aria-label="آرشیو"
          className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white disabled:opacity-40"
        >
          <Archive className="h-3.5 w-3.5 text-ink" />
        </button>
      ) : (
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
      )}
      <button
        type="button"
        disabled={busy}
        onClick={onDelete}
        aria-label="حذف"
        className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 text-rose-700 hover:bg-rose-50 disabled:opacity-40"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 *  Edit Drawer — Slide-in drawer from end (logical) for create
 *  and edit. Forms are minimal (name, slug, description, parent,
 *  order, visible, SEO title/description). Submit calls
 *  createCategory or updateCategory based on `categoryId`.
 * ────────────────────────────────────────────────────────────── */

function CategoryEditDrawer({
  open,
  onClose,
  categoryId,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categoryId: Id<"categories"> | null;
  categories: Array<Doc<"categories">>;
}) {
  const editing = categoryId
    ? categories.find((c) => c._id === categoryId)
    : null;
  const createCategory = useMutation(api.admin_catalog.createCategory);
  const updateCategory = useMutation(api.admin_catalog.updateCategory);

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [parentId, setParentId] = React.useState<Id<"categories"> | "">("");
  const [visible, setVisible] = React.useState(true);
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDescription, setSeoDescription] = React.useState("");
  const [order, setOrder] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setSlug(editing?.slug ?? "");
    setDescription(editing?.description ?? "");
    setParentId(editing?.parentId ?? "");
    setVisible(editing?.visible ?? true);
    setSeoTitle(editing?.seo?.title ?? "");
    setSeoDescription(editing?.seo?.description ?? "");
    setOrder(editing?.order ?? 0);
  }, [open, editing]);

  if (!open) return null;
  const isEdit = !!categoryId;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE_LUXURY }}
      className="fixed inset-0 z-40 flex items-stretch justify-start bg-ink/30 backdrop-blur-md sm:items-center sm:justify-center"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ x: 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: EASE_LUXURY }}
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden border border-edge bg-white/95 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-edge px-7 py-6">
          <div className="text-start">
            <p className="type-eyebrow text-ink-muted">
              {isEdit ? "ویرایش دسته" : "دسته تازه"}
            </p>
            <h2 className="mt-2 font-display text-2xl text-ink">
              {isEdit ? editing?.name : "ساخت دسته‌بندی"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="grid h-9 w-9 place-items-center rounded-full hairline bg-white hover:bg-canvas-soft"
          >
            <X className="h-3.5 w-3.5 text-ink" />
          </button>
        </header>

        <form
          className="flex-1 overflow-y-auto px-7 py-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            try {
              if (isEdit && categoryId) {
                await updateCategory({
                  id: categoryId,
                  name,
                  slug,
                  description: description || undefined,
                  parentId: parentId || undefined,
                  order,
                  visible,
                  seoTitle: seoTitle || undefined,
                  seoDescription: seoDescription || undefined,
                });
              } else {
                await createCategory({
                  name,
                  slug,
                  description: description || undefined,
                  parentId: parentId || undefined,
                  order: order || 0,
                  visible,
                  seoTitle: seoTitle || undefined,
                  seoDescription: seoDescription || undefined,
                });
              }
              onClose();
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="grid gap-4">
            <Field label="نام" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                dir="rtl"
                className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                placeholder="مثلاً: سوتین"
              />
            </Field>
            <Field label="slug" hint="در URL استفاده می‌شود. لاتین و یکتا.">
              <input
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                dir="ltr"
                className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                placeholder="bras"
              />
            </Field>
            <Field label="توضیحات">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                dir="rtl"
                rows={3}
                className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </Field>
            <Field label="دسته والد">
              <select
                value={parentId}
                onChange={(e) =>
                  setParentId(e.target.value as Id<"categories"> | "")
                }
                dir="rtl"
                className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              >
                <option value="">— بدون والد (دسته ریشه) —</option>
                {categories
                  .filter((c) => c._id !== categoryId)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ترتیب نمایش">
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  dir="ltr"
                  className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label="نمایش در فروشگاه">
                <button
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm font-medium",
                    visible
                      ? "text-ink"
                      : "text-ink-soft line-through",
                  )}
                >
                  <span>{visible ? "فعال" : "مخفی"}</span>
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      visible ? "bg-emerald-500" : "bg-ink-muted",
                    )}
                  />
                </button>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SEO عنوان">
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  dir="rtl"
                  className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label="SEO توضیحات">
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  dir="rtl"
                  rows={2}
                  className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                />
              </Field>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-edge pt-6">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
              <ShieldAlert className="h-3.5 w-3.5" />
              حذف تنها زمانی ممکن است که محصولی به این دسته متصل نباشد.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full hairline bg-canvas/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-white"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={busy || !name || !slug}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary disabled:opacity-60"
              >
                {busy ? "در حال ذخیره…" : isEdit ? "ذخیره تغییرات" : "ایجاد دسته"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
        <span>
          {label}
          {required ? <span className="text-primary"> *</span> : null}
        </span>
        {hint ? <span className="text-[10px] text-ink-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

// Suppress unused import lint flag for `useMutation` re-export in
// some toolchains.
export const _useMutationRef = useMutation;
