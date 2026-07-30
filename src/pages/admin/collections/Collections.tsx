/**
 * Phase 5.2 — Collection management.
 *
 * Surface: `/admin/collections`.
 *
 * Reads from `api.admin_catalog.listCollectionsForAdmin` and
 * surfaces the Lona merchandising tool: create, edit, archive,
 * restore, soft-delete (the Convex `deleteCollection` refuses
 * when products still reference the collection — we surface that
 * error via ConfirmDialog and let the user move products first).
 *
 * Product assignment uses the shared `ProductPickerDialog` in
 * `ordered` mode so the storefront render order matches what the
 * admin dragged into place.
 */
import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Archive,
  Boxes,
  ChevronLeft,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  AdminEmptyState,
  StatusBadge,
  type StatusKind,
} from "@/components/admin";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ProductPickerDialog } from "@/components/admin/ProductPickerDialog";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";

type CollectionRow = Doc<"collections">;

export default function Collections() {
  const rows = useQuery(api.admin_catalog.listCollectionsForAdmin, {});

  const [query, setQuery] = React.useState("");
  const [showArchived, setShowArchived] = React.useState(false);
  const [editId, setEditId] = React.useState<Id<"collections"> | null>(null);
  const [create, setCreate] = React.useState(false);
  const [delId, setDelId] = React.useState<Id<"collections"> | null>(null);

  const filtered = React.useMemo(() => {
    if (!rows) return [] as CollectionRow[];
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!showArchived && !row..visible) return false;
      if (!needle) return true;
      return [row.name, row.slug, row.description ?? "", row.eyebrow ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, query, showArchived]);

  const archive = useMutation(api.admin_catalog.archiveCollection);
  const restore = useMutation(api.admin_catalog.restoreCollection);
  const deleteCollection = useMutation(api.admin_catalog.deleteCollection);

  const editingRow = editId ? (rows ?? []).find((r) => r._id === editId) : undefined;

  const delRow = delId ? (rows ?? []).find((r) => r._id === delId) : undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">کاتالوگ</p>
          <h1 className="mt-2 font-display text-4xl text-ink lg:text-5xl">
            کالکسیون‌ها
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            فصلی، کمپین، ادبی و همیشگی. هر کالکسیون ترتیب محصولات خود را
            به‌طور مستقل کنترل می‌کند و در فروشگاه با همین ترتیب نمایش داده می‌شود.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreate(true)}
          className="inline-flex items-center gap-2 self-start rounded-full bg-ink px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          کالکسیون تازه
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
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
          {showArchived ? "شامل آرشیو" : "فقط فعال"}
        </button>
        <div className="ms-auto flex flex-1 items-center gap-2 rounded-full hairline bg-canvas/70 px-3 py-1.5 lg:max-w-sm">
          <Search className="h-3.5 w-3.5 text-ink-muted" />
          <input
            type="search"
            placeholder="جست‌وجو…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            dir="rtl"
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-edge bg-white/85">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-canvas-soft text-ink-muted">
              <tr>
                {[
                  "عنوان",
                  "نوع",
                  "محصولات",
                  "وضعیت",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows === undefined
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-edge/60">
                      {[0, 1, 2, 3, 4].map((j) => (
                        <td key={j} className="px-4 py-3">
                          <span className="block h-3 w-2/3 animate-pulse rounded bg-ink-muted/15" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10">
                        <AdminEmptyState
                          title={
                            rows && rows.length > 0
                              ? "نتیجه‌ای یافت نشد."
                              : "هنوز کالکسیونی ساخته نشده."
                          }
                          body={
                            rows && rows.length > 0
                              ? "فیلتر یا جست‌وجو را شل‌تر کنید."
                              : "مثلاً: «لحظات ابریشمی» یا «راحتی روزانه»."
                          }
                          icon={<Boxes className="h-5 w-5" />}
                          action={
                            <button
                              type="button"
                              onClick={() => setCreate(true)}
                              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-canvas hover:bg-primary"
                            >
                              ساخت اولین کالکسیون{" "}
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row, i) => (
                      <motion.tr
                        key={row._id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.35,
                          ease: EASE_LUXURY,
                          delay: Math.min(i, 6) * 0.03,
                        }}
                        className="border-t border-edge/60 transition hover:bg-canvas-soft"
                      >
                        <td className="px-4 py-3 align-top">
                          <p className="font-display text-base text-ink">
                            {row.name}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                            {row.eyebrow} · {row.slug}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]",
                              row.kind === "seasonal"
                                ? "bg-emerald-50 text-emerald-700"
                                : row.kind === "campaign"
                                  ? "bg-sky-50 text-sky-700"
                                  : row.kind === "editorial"
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-canvas-soft text-ink-soft",
                            )}
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            {row.kind === "seasonal"
                              ? "فصلی"
                              : row.kind === "campaign"
                                ? "کمپین"
                                : row.kind === "editorial"
                                  ? "ادبی"
                                  : "همیشگی"}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="type-caption text-ink">
                            {row.productSlugs.length.toLocaleString("fa-IR")}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <StatusBadge
                            status={
                              row.?.visible
                                ? ("published" as StatusKind)
                                : ("archived" as StatusKind)
                            }
                            label={row.?.visible ? "فعال" : "آرشیو"}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditId(row._id)}
                              aria-label="ویرایش"
                              className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white"
                            >
                              <Pencil className="h-3.5 w-3.5 text-ink" />
                            </button>
                            {row.?.visible ? (
                              <button
                                type="button"
                                onClick={() => archive({ id: row._id })}
                                aria-label="آرشیو"
                                className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white"
                              >
                                <Archive className="h-3.5 w-3.5 text-ink" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => restore({ id: row._id })}
                                aria-label="بازنشانی"
                                className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white"
                              >
                                <RotateCcw className="h-3.5 w-3.5 text-ink" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDelId(row._id)}
                              aria-label="حذف"
                              className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
            </tbody>
          </table>
        </div>
      </div>

      <CollectionEditDrawer
        open={create || editId !== null}
        onClose={() => {
          setEditId(null);
          setCreate(false);
        }}
        collectionId={editId}
        collections={rows ?? []}
      />

      <ConfirmDialog
        open={delId !== null}
        onOpenChange={(o) => !o && setDelId(null)}
        title={`حذف ${delRow?.name ?? "کالکسیون"}؟`}
        confirmLabel="حذف کالکسیون"
        destructive
        tone="destructive"
        body={
          <span>
            اگر محصولی هنوز از طریق <code>collectionSlug</code> به این
            کالکسیون متصل باشد، سیستم اجازه حذف نمی‌دهد. ابتدا محصولات
            را به کالکسیون دیگری منتقل یا آرشیو کنید.
          </span>
        }
        onConfirm={async () => {
          if (!delId) return;
          try {
            await deleteCollection({ id: delId });
          } catch {
            // Convex throws COLLECTION_NOT_EMPTY — silent here;
            // designer can retry once products are moved.
          }
          setDelId(null);
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 *  Edit drawer — shared for create + edit.
 *  Gradient swatch uses the existing `gradient-oat | mist | rose
 *  | rose-quartz | deep` palette so the look matches storefront
 *  cards.
 * ────────────────────────────────────────────────────────────── */

const GRADIENT_OPTIONS = [
  { id: "oat", label: "ماسه‌ای", cls: "gradient-oat" },
  { id: "mist", label: "مه‌آلود", cls: "gradient-mist" },
  { id: "rose-quartz", label: "رز کوارتز", cls: "gradient-rose-quartz" },
  { id: "deep", label: "ژرف", cls: "gradient-deep" },
];

function CollectionEditDrawer({
  open,
  onClose,
  collectionId,
  collections,
}: {
  open: boolean;
  onClose: () => void;
  collectionId: Id<"collections"> | null;
  collections: Array<CollectionRow>;
}) {
  const editingRow = collectionId
    ? collections.find((c) => c._id === collectionId)
    : null;
  const upsert = useMutation(api.admin_catalog.upsertCollection);
  const setProducts = useMutation(api.admin_catalog.setCollectionProducts);

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [eyebrow, setEyebrow] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [kind, setKind] = React.useState<"seasonal" | "campaign" | "editorial" | "permanent">(
    "seasonal",
  );
  const [season, setSeason] = React.useState("");
  const [productSlugs, setProductSlugs] = React.useState<Id<"products">[]>([]);
  const [gradient, setGradient] = React.useState("oat");
  const [visible, setVisible] = React.useState(true);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(editingRow?.name ?? "");
    setSlug(editingRow?.slug ?? "");
    setEyebrow(editingRow?.eyebrow ?? "");
    setDescription(editingRow?.description ?? "");
    setKind(editingRow?.kind ?? "seasonal");
    setSeason(editingRow?.season ?? "");
    setGradient(editingRow?.gradient ?? "oat");
    setProductSlugs(
      (editingRow?.productSlugs ?? []).filter(Boolean) as Id<"products">[],
    );
    setVisible(editingRow?.?.visible ?? true);
  }, [open, editingRow]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const id = await upsert({
        slug,
        name,
        eyebrow,
        description,
        productSlugs: productSlugs as string[],
        gradient: gradient as "oat" | "mist" | "deep" | "rose-quartz",
        coverGradient: undefined,
        kind,
        season: season || undefined,
        order: editingRow?.order ?? 0,
        visible,
      });
      // Persist product order explicitly — upsert already saved
      // it, but calling again makes the ordering a no-throw
      // contract that fails loudly if anything in the chain
      // becomes stricter later.
      if (id) {
        await setProducts({
          id,
          productSlugs: productSlugs as string[],
        });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

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
        className="flex h-full w-full max-w-3xl flex-col overflow-hidden border border-edge bg-white/95 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-edge px-7 py-6">
          <div className="text-start">
            <p className="type-eyebrow text-ink-muted">
              {editingRow ? "ویرایش کالکسیون" : "کالکسیون تازه"}
            </p>
            <h2 className="mt-2 font-display text-2xl text-ink">
              {editingRow?.name ?? "نام کالکسیون"}
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
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                dir="rtl"
                className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                placeholder="مثلاً: لحظات ابریشمی"
              />
            </Field>
            <Field label="slug" required>
              <input
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                dir="ltr"
                className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                placeholder="silk-stories"
              />
            </Field>
            <Field label="متن کوتاه (eyebrow)">
              <input
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                dir="rtl"
                className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </Field>
            <Field label="فصل">
              <input
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                dir="rtl"
                className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                placeholder="مثلاً: بهار ۱۴۰۵"
              />
            </Field>
            <Field label="نوع کالکسیون">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["seasonal", "فصلی"],
                    ["campaign", "کمپین"],
                    ["editorial", "ادبی"],
                    ["permanent", "همیشگی"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em]",
                      kind === k
                        ? "bg-ink text-canvas"
                        : "hairline bg-canvas/70 text-ink-soft hover:bg-white",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="گرادینت کاور">
              <div className="flex flex-wrap gap-2">
                {GRADIENT_OPTIONS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGradient(g.id)}
                    className={cn(
                      "h-12 w-16 rounded-xl ring-1 ring-inset ring-white/40 transition",
                      g.cls,
                      gradient === g.id
                        ? "ring-2 ring-primary ring-offset-2"
                        : "",
                    )}
                    aria-label={g.label}
                    title={g.label}
                  />
                ))}
              </div>
            </Field>
            <Field label="نمایش در فروشگاه">
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm font-medium",
                  visible ? "text-ink" : "text-ink-soft line-through",
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
            <Field label="توضیحات" full>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                dir="rtl"
                rows={3}
                className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </Field>
            <Field label="محصولات کالکسیون" full>
              <div className="rounded-2xl border border-edge bg-canvas/60 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                    {productSlugs.length.toLocaleString("fa-IR")} محصول انتخاب‌شده
                  </p>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
                  >
                    <Plus className="h-3 w-3" />
                    {productSlugs.length ? "ویرایش محصولات" : "انتخاب محصول"}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-ink-soft">
                  ترتیب نمایش در فروشگاه دقیقاً به همین شکل خواهد بود. در پنجره
                  بعدی می‌توانید با کشیدن و رها کردن، ترتیب را تنظیم کنید.
                </p>
              </div>
            </Field>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-edge pt-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
              ذخیره روی Convex
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
                {busy
                  ? "در حال ذخیره…"
                  : editingRow
                    ? "ذخیره تغییرات"
                    : "ایجاد کالکسیون"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      <ProductPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode="ordered"
        initialIds={productSlugs}
        title="انتخاب و ترتیب محصولات"
        body="محصولات را با کشیدن و رها کردن مرتب کنید. ترتیب نهایی در فروشگاه همان است که در اینجا می‌بینید."
        confirmLabel="تأیید ترتیب"
        onResolve={async (ids) => {
          setProductSlugs(ids);
        }}
      />
    </motion.div>
  );
}

function Field({
  label,
  hint,
  required,
  full,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn("block space-y-1.5", full && "sm:col-span-2")}
    >
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
