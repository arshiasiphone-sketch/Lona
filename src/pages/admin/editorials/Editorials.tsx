/**
 * Phase 7.4 — Editorial CMS (Magazine).
 *
 * Surface: `/admin/editorial`.
 *
 * Full lifecycle for magazine entries: list, create, edit (including
 * a real cover image via `CoverImageField` — no longer gradient-only),
 * publish / unpublish, archive and hard-delete. Every mutation writes
 * an `activity_logs` row on the server (`admin_catalog` pattern).
 */
import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  FileText,
  Newspaper,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { AdminEmptyState, StatusBadge } from "@/components/admin";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { CoverImageField } from "@/components/admin/CoverImageField";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";

type EditorialRow = Doc<"editorials">;

const KIND_LABEL: Record<EditorialRow["kind"], string> = {
  journal: "مجله",
  atelier: "یادداشت کارگاه",
  campaign: "کالکسیون",
  blog: "بلاگ",
};

const STATUS_LABEL: Record<EditorialRow["status"], string> = {
  draft: "پیش‌نویس",
  published: "منتشر شده",
  archived: "آرشیو",
};

const GRADIENT_OPTIONS = [
  { id: "oat", label: "ماسه‌ای", cls: "gradient-oat" },
  { id: "mist", label: "مه‌آلود", cls: "gradient-mist" },
  { id: "rose", label: "رز کوارتز", cls: "gradient-rose-quartz" },
  { id: "deep", label: "ژرف", cls: "gradient-deep" },
] as const;

type GradientId = (typeof GRADIENT_OPTIONS)[number]["id"];

export default function Editorials() {
  const rows = useQuery(api.admin_catalog.listEditorialsForAdmin, {});

  const [editId, setEditId] = React.useState<Id<"editorials"> | null>(null);
  const [create, setCreate] = React.useState(false);
  const [delId, setDelId] = React.useState<Id<"editorials"> | null>(null);

  const publish = useMutation(api.admin_catalog.publishEditorial);
  const unpublish = useMutation(api.admin_catalog.unpublishEditorial);
  const archive = useMutation(api.admin_catalog.archiveEditorial);
  const deleteEditorial = useMutation(api.admin_catalog.deleteEditorial);

  const editingRow = editId
    ? (rows ?? []).find((r) => r._id === editId)
    : undefined;
  const delRow = delId ? (rows ?? []).find((r) => r._id === delId) : undefined;

  const sorted = React.useMemo(() => {
    if (!rows) return undefined;
    return [...rows].sort((a, b) => b.publishedAt - a.publishedAt);
  }, [rows]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">محتوا · مجله</p>
          <h1 className="mt-2 font-display text-4xl text-ink lg:text-5xl">
            مجلهٔ لونا
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            روایت‌ها، یادداشت‌های کارگاه و آرشیو کالکسیون‌ها. هر نوشته یک
            تصویر کاور واقعی دارد — با آپلود از دستگاه یا آدرس خارجی — و
            گرادیان فقط جایگزین می‌ماند.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreate(true)}
          className="inline-flex items-center gap-2 self-start rounded-full bg-ink px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          نوشتهٔ تازه
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-edge bg-white/85">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-canvas-soft text-ink-muted">
              <tr>
                {["عنوان", "نوع", "نویسنده", "وضعیت", ""].map((h, i) => (
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
              {sorted === undefined
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-edge/60">
                      {[0, 1, 2, 3, 4].map((j) => (
                        <td key={j} className="px-4 py-3">
                          <span className="block h-3 w-2/3 animate-pulse rounded bg-ink-muted/15" />
                        </td>
                      ))}
                    </tr>
                  ))
                : sorted.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10">
                        <AdminEmptyState
                          title="هنوز نوشته‌ای منتشر نشده."
                          body="اولین روایت مجله را بسازید — تصویر کاور را می‌توانید از دستگاه آپلود کنید."
                          icon={<Newspaper className="h-5 w-5" />}
                          action={
                            <button
                              type="button"
                              onClick={() => setCreate(true)}
                              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-canvas hover:bg-primary"
                            >
                              ساخت اولین نوشته
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    sorted.map((row, i) => (
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
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-canvas-soft">
                              {row.coverImage ? (
                                <img
                                  src={row.coverImage}
                                  alt=""
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div
                                  className={cn(
                                    "h-full w-full",
                                    row.coverGradient === "oat"
                                      ? "gradient-oat"
                                      : row.coverGradient === "rose"
                                        ? "gradient-rose-quartz"
                                        : row.coverGradient === "deep"
                                          ? "gradient-deep"
                                          : "gradient-mist",
                                  )}
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-display text-base text-ink">
                                {row.title}
                              </p>
                              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                                {row.slug}
                                {row.coverImage ? " · تصویر کاور" : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="type-caption text-ink">
                            {KIND_LABEL[row.kind]}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="type-caption text-ink-soft">
                            {row.author}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <StatusBadge
                            status={row.status}
                            label={STATUS_LABEL[row.status]}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center justify-end gap-1">
                            {row.status === "draft" ? (
                              <button
                                type="button"
                                onClick={() => publish({ id: row._id })}
                                aria-label="انتشار"
                                title="انتشار"
                                className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 text-emerald-700 hover:bg-emerald-50"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>
                            ) : row.status === "published" ? (
                              <button
                                type="button"
                                onClick={() => unpublish({ id: row._id })}
                                aria-label="برگرداندن به پیش‌نویس"
                                title="برگرداندن به پیش‌نویس"
                                className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white"
                              >
                                <FileText className="h-3.5 w-3.5 text-ink" />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setEditId(row._id)}
                              aria-label="ویرایش"
                              className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 hover:bg-white"
                            >
                              <Pencil className="h-3.5 w-3.5 text-ink" />
                            </button>
                            {row.status !== "archived" ? (
                              <button
                                type="button"
                                onClick={() => archive({ id: row._id })}
                                aria-label="آرشیو"
                                title="آرشیو"
                                className="grid h-8 w-8 place-items-center rounded-full hairline bg-white/80 text-ink-soft hover:bg-white"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
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

      <EditorialDrawer
        open={create || editId !== null}
        onClose={() => {
          setEditId(null);
          setCreate(false);
        }}
        editorialId={editId}
        editorials={rows ?? []}
      />

      <ConfirmDialog
        open={delId !== null}
        onOpenChange={(o) => !o && setDelId(null)}
        title={`حذف «${delRow?.title ?? "نوشته"}»؟`}
        confirmLabel="حذف نوشته"
        destructive
        tone="destructive"
        body={
          <span>
            نوشته برای همیشه حذف می‌شود و دیگر در مجله نمایش داده نمی‌شود.
            این عمل قابل بازگشت نیست.
          </span>
        }
        onConfirm={async () => {
          if (!delId) return;
          try {
            await deleteEditorial({ id: delId });
          } catch {
            // surface errors silently — row disappears from the list reactively
          }
          setDelId(null);
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 *  Edit drawer — shared for create + edit.
 * ────────────────────────────────────────────────────────────── */

function EditorialDrawer({
  open,
  onClose,
  editorialId,
  editorials,
}: {
  open: boolean;
  onClose: () => void;
  editorialId: Id<"editorials"> | null;
  editorials: EditorialRow[];
}) {
  const editingRow = editorialId
    ? editorials.find((e) => e._id === editorialId)
    : null;
  const upsert = useMutation(api.admin_catalog.upsertEditorial);

  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [body, setBody] = React.useState("");
  const [kind, setKind] = React.useState<EditorialRow["kind"]>("journal");
  const [author, setAuthor] = React.useState("");
  const [status, setStatus] = React.useState<EditorialRow["status"]>("draft");
  const [gradient, setGradient] = React.useState<GradientId>("oat");
  const [coverImage, setCoverImage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitle(editingRow?.title ?? "");
    setSlug(editingRow?.slug ?? "");
    setExcerpt(editingRow?.excerpt ?? "");
    setBody(editingRow?.body ?? "");
    setKind(editingRow?.kind ?? "journal");
    setAuthor(editingRow?.author ?? "");
    setStatus(editingRow?.status ?? "draft");
    setGradient(
      (editingRow?.coverGradient as GradientId | undefined) ?? "oat",
    );
    setCoverImage(editingRow?.coverImage ?? "");
  }, [open, editingRow]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await upsert({
        slug,
        title,
        excerpt,
        body: body || undefined,
        coverGradient: gradient,
        coverImage: coverImage || undefined,
        kind,
        author,
        publishedAt: editingRow?.publishedAt ?? Date.now(),
        status,
      });
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
              {editingRow ? "ویرایش نوشته" : "نوشتهٔ تازه"}
            </p>
            <h2 className="mt-2 font-display text-2xl text-ink">
              {editingRow?.title ?? "عنوان نوشته"}
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                dir="rtl"
                className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                placeholder="مثلاً: هنر آرامش"
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
                placeholder="art-of-calm"
              />
            </Field>
            <Field label="نویسنده">
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                dir="rtl"
                className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                placeholder="تیم تحریریه لونا"
              />
            </Field>
            <Field label="نوع نوشته">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["journal", "مجله"],
                    ["atelier", "کارگاه"],
                    ["campaign", "کالکسیون"],
                    ["blog", "بلاگ"],
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
            <Field label="وضعیت">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["draft", "پیش‌نویس"],
                    ["published", "منتشر شده"],
                    ["archived", "آرشیو"],
                  ] as const
                ).map(([s, label]) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em]",
                      status === s
                        ? "bg-ink text-canvas"
                        : "hairline bg-canvas/70 text-ink-soft hover:bg-white",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="گرادیان کاور (جایگزین)">
              <div className="flex flex-wrap gap-2">
                {GRADIENT_OPTIONS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGradient(g.id as GradientId)}
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
            <Field label="چکیده" full>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                dir="rtl"
                rows={2}
                className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </Field>
            <Field label="متن نوشته" full>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                dir="rtl"
                rows={6}
                className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                placeholder="بدنهٔ نوشته…"
              />
            </Field>
            <Field label="تصویر کاور" full>
              <CoverImageField
                label={`کاور ${title || "نوشته"} — لونا`}
                value={coverImage}
                onChange={setCoverImage}
                section="editorial"
                aspect="aspect-[16/9]"
              />
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
                disabled={busy || !title || !slug}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary disabled:opacity-60"
              >
                {busy
                  ? "در حال ذخیره…"
                  : editingRow
                    ? "ذخیره تغییرات"
                    : "ایجاد نوشته"}
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
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block space-y-1.5", full && "sm:col-span-2")}>
      <span className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
        <span>
          {label}
          {required ? <span className="text-primary"> *</span> : null}
        </span>
      </span>
      {children}
    </label>
  );
}
