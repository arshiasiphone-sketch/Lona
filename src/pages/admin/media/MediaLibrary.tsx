/**
 * Phase 5.2 — Media library.
 *
 * Surface: `/admin/media`.
 *
 * Reads from `api.admin_media.listLibrary` which unifies
 * `media_library` (global assets) and `product_images` (assets
 * tied to a specific product) into one grid. Each row carries its
 * source label so the team can spot orphaned assets and reuse
 * product imagery for editorial placements.
 *
 * Upload path uses `admin_media.generateUploadUrl` →
 * POST file → `admin_media.attachToLibrary`. Errors surface
 * inline in the row with retry; success removes the row and the
 * `listLibrary` query picks it up next tick.
 *
 * The "library entry delete → cascading storage delete" lives on
 * the Convex side; we mirror that contract via the side panel.
 */
import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Copy,
  Grid3x3,
  Image as ImageIcon,
  ImagePlus,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  AdminEmptyState,
  AdminKPI,
} from "@/components/admin";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";

type LibraryRow = {
  id: string;
  source: "library" | "product";
  filename: string;
  alt: string;
  caption?: string | null;
  section?: string | null;
  url: string | null;
  width: number | null;
  height: number | null;
  uploadedAt: number;
  contentType?: string | null;
  productSlug?: string | null;
  productName?: string | null;
};

const SECTION_OPTS = [
  ["all", "همه"],
  ["brand", "برند"],
  ["editorial", "ادیتوریال"],
  ["instagram", "اینستاگرام"],
  ["banner", "بنر"],
  ["general", "عمومی"],
] as const;

const SECTION_LABEL: Record<string, string> = {
  brand: "برند",
  editorial: "ادیتوریال",
  instagram: "اینستاگرام",
  banner: "بنر",
  general: "عمومی",
};

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const MAX_BYTES = 12 * 1024 * 1024; // 12 MB for the global library

type UploadRow =
  | { key: string; state: "uploading"; progress: number; localUrl: string; name: string; size: number }
  | { key: string; state: "success"; storageId: Id<"_storage">; localUrl: string; name: string }
  | { key: string; state: "failed"; error: string; name: string; size: number };

export default function MediaLibrary() {
  const list = useQuery(api.admin_media.listLibrary, {});
  const stats = useQuery(api.admin_media.mediaStats, {});
  const generateUploadUrl = useMutation(api.admin_media.generateUploadUrl);
  const attachToLibrary = useMutation(api.admin_media.attachToLibrary);
  const deleteLibrary = useMutation(api.admin_media.deleteLibraryAsset);

  const [term, setTerm] = React.useState("");
  const [source, setSource] = React.useState<"all" | "library" | "product">("all");
  const [section, setSection] = React.useState<string>("all");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [uploads, setUploads] = React.useState<UploadRow[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [delId, setDelId] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered: LibraryRow[] = React.useMemo(() => {
    const all = (list ?? []) as LibraryRow[];
    const needle = term.trim().toLowerCase();
    return all
      .filter((row) => source === "all" || row.source === source)
      .filter((row) => section === "all" || row.section === section)
      .filter((row) => {
        if (!needle) return true;
        return [row.filename, row.alt, row.caption ?? "", row.productName ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      });
  }, [list, term, source, section]);

  const selected = filtered.find((r) => r.id === selectedId) ?? null;

  const beginUpload = React.useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        setUploads((u) => [
          ...u,
          {
            key: `${file.name}-${Date.now()}`,
            state: "failed",
            error: `نوع فایل پشتیبانی نمی‌شود: ${file.type}`,
            name: file.name,
            size: file.size,
          },
        ]);
        return;
      }
      if (file.size > MAX_BYTES) {
        setUploads((u) => [
          ...u,
          {
            key: `${file.name}-${Date.now()}`,
            state: "failed",
            error: "حجم فایل بیش از ۱۲ مگابایت است.",
            name: file.name,
            size: file.size,
          },
        ]);
        return;
      }
      const key = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const localUrl = URL.createObjectURL(file);
      setUploads((u) => [
        ...u,
        { key, state: "uploading", progress: 12, localUrl, name: file.name, size: file.size },
      ]);

      try {
        const uploadUrl = await generateUploadUrl();
        const form = new FormData();
        form.append("file", file);
        const storageId = await new Promise<Id<"_storage">>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (!e.lengthComputable) return;
            const pct = Math.min(95, Math.round((e.loaded / e.total) * 90) + 12);
            setUploads((u) =>
              u.map((r) =>
                r.key === key && r.state === "uploading" ? { ...r, progress: pct } : r,
              ),
            );
          });
          xhr.addEventListener("error", () => reject(new Error("خطای شبکه")));
          xhr.addEventListener("abort", () => reject(new Error("بارگذاری لغو شد")));
          xhr.addEventListener("load", () => {
            if (xhr.status < 200 || xhr.status >= 300) {
              reject(new Error(`HTTP ${xhr.status}`));
              return;
            }
            try {
              const data = JSON.parse(xhr.responseText) as { storageId: Id<"_storage"> };
              resolve(data.storageId);
            } catch {
              reject(new Error("پاسخ نامعتبر"));
            }
          });
          xhr.open("POST", uploadUrl);
          xhr.send(form);
        });

        await attachToLibrary({
          storageId,
          filename: file.name,
          alt: file.name.replace(/\.[^.]+$/, ""),
          width: undefined,
          height: undefined,
          contentType: file.type,
          size: file.size,
        });
        setUploads((u) =>
          u.map((r) =>
            r.key === key
              ? { key, state: "success", storageId, localUrl, name: file.name }
              : r,
          ),
        );
        // Auto-clear successful rows after 2s so they don't pile up.
        setTimeout(() => {
          setUploads((u) => u.filter((r) => r.key !== key));
        }, 2000);
      } catch (err) {
        setUploads((u) =>
          u.map((r) =>
            r.key === key && r.state === "uploading"
              ? { ...r, state: "failed", error: (err as Error).message }
              : r,
          ),
        );
      }
    },
    [generateUploadUrl, attachToLibrary],
  );

  const handleFiles = React.useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).slice(0, 8).forEach(beginUpload);
    },
    [beginUpload],
  );

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async () => {
    if (!delId) return;
    const row = filtered.find((r) => r.id === delId);
    if (!row) {
      setDelId(null);
      return;
    }
    if (row.source === "library") {
      try {
        await deleteLibrary({ id: delId as Id<"media_library"> });
      } catch {
        // Silent: the toast hook would surface the error in v1.1.
      }
    }
    setDelId(null);
    if (selectedId === delId) setSelectedId(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="type-eyebrow text-ink-muted">کاتالوگ</p>
            <h1 className="mt-2 font-display text-4xl text-ink lg:text-5xl">
              کتابخانه رسانه
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ink-soft">
              همهٔ تصاویر آپلود‌شده — کاورهای محصول، تصاویر ادبی و بنرهای
              کمپین — در یک نمای واحد. کشیدن و رها کردن، فیلتر بر اساس متن، و
              حذف امن با گفت‌وگوی تأیید.
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 self-start rounded-full bg-ink px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
          >
            <Upload className="h-3.5 w-3.5" />
            آپلود تصویر
          </button>
          <input
            ref={inputRef}
            type="file"
            hidden
            multiple
            accept={ACCEPTED.join(",")}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <AdminKPI
            label="کل تصاویر"
            value={(stats?.totalCount ?? 0).toLocaleString("fa-IR")}
            icon={<ImageIcon className="h-3.5 w-3.5" />}
          />
          <AdminKPI
            label="کتابخانه آزاد"
            value={(stats?.libraryCount ?? 0).toLocaleString("fa-IR")}
            icon={<ImagePlus className="h-3.5 w-3.5" />}
          />
          <AdminKPI
            label="پیوست‌شده به محصول"
            value={(stats?.productImageCount ?? 0).toLocaleString("fa-IR")}
            icon={<Package className="h-3.5 w-3.5" />}
          />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-edge bg-white/60 px-6 py-10 text-center transition",
            dragging && "border-primary bg-primary/10",
          )}
        >
          <div className="grid h-10 w-10 place-items-center rounded-full hairline bg-white text-primary">
            <ImagePlus className="h-4 w-4" />
          </div>
          <p className="font-display text-base text-ink">
            فایل‌ها را اینجا رها کنید یا برای انتخاب، روی «آپلود تصویر» بزنید.
          </p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            PNG, JPG, WebP, AVIF · حداکثر ۱۲ مگابایت · هشت فایل در هر نوبت
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full hairline bg-canvas/70 px-3 py-1.5 lg:max-w-sm">
            <Search className="h-3.5 w-3.5 text-ink-muted" />
            <input
              type="search"
              placeholder="جست‌وجوی فایل…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              dir="rtl"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 rounded-full hairline bg-canvas/70 p-1">
            {(
              [
                ["all", "همه"],
                ["library", "کتابخانه"],
                ["product", "محصولات"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setSource(k)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em]",
                  source === k
                    ? "bg-ink text-canvas"
                    : "text-ink-soft hover:bg-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full hairline bg-canvas/70 p-1">
            {SECTION_OPTS.map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setSection(k)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em]",
                  section === k
                    ? "bg-ink text-canvas"
                    : "text-ink-soft hover:bg-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ms-auto flex items-center gap-1 rounded-full hairline bg-canvas/70 p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="شبکه‌ای"
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full",
                view === "grid" ? "bg-ink text-canvas" : "text-ink-soft",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-label="فهرستی"
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full",
                view === "list" ? "bg-ink text-canvas" : "text-ink-soft",
              )}
            >
              <ListIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {uploads.map((row) => (
            <motion.div
              key={row.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE_LUXURY }}
              className="rounded-2xl border border-edge bg-white/85 p-4"
            >
              {row.state === "uploading" ? (
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-ink/10">
                    <img src={row.localUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{row.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                      در حال آپلود · {row.progress}%
                    </p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${row.progress}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                </div>
              ) : row.state === "success" ? (
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-emerald-100">
                    <Check className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{row.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                      با موفقیت ضمیمه شد.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-rose-100">
                    <AlertTriangle className="h-4 w-4 text-rose-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{row.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-rose-700">
                      خطا · {row.error}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setUploads((u) => u.filter((r) => r.key !== row.key))
                    }
                    className="grid h-8 w-8 place-items-center rounded-full hairline bg-white hover:bg-canvas-soft"
                    aria-label="بستن"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-ink-soft" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 ? (
          <AdminEmptyState
            title={
              list && list.length > 0
                ? "نتیجه‌ای یافت نشد."
                : "کتابخانه خالی است."
            }
            body={
              list && list.length > 0
                ? "فیلتر یا جست‌وجو را شل‌تر کنید."
                : "اولین تصویر را با کشیدن و رها کردن در ناحیه بالا بارگذاری کنید."
            }
            icon={<Grid3x3 className="h-5 w-5" />}
          />
        ) : view === "grid" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((row) => (
              <MediaTile
                key={row.id}
                row={row}
                selected={row.id === selectedId}
                onSelect={() => setSelectedId(row.id)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-edge bg-white/85">
            <ul className="divide-y divide-edge">
              {filtered.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={cn(
                      "flex w-full items-center gap-4 px-4 py-3 text-start transition hover:bg-canvas-soft",
                      row.id === selectedId && "bg-canvas/70",
                    )}
                  >
                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-canvas-soft">
                      {row.url ? (
                        <img src={row.url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center">
                          <ImageIcon className="h-4 w-4 text-ink-muted" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {row.alt}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                        {row.source === "library" ? "کتابخانه" : "محصول"} ·{" "}
                        {row.width && row.height
                          ? `${row.width}×${row.height}`
                          : "ابعاد نامشخص"}
                      </p>
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                      {new Date(row.uploadedAt).toLocaleDateString("fa-IR")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Side details panel */}
      <aside className="space-y-4">
        {selected ? (
          <MediaDetailsPanel
            row={selected}
            onClose={() => setSelectedId(null)}
            onDelete={() => setDelId(selected.id)}
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-edge bg-white/60 p-8 text-center">
            <p className="text-sm text-ink-soft">
              یک تصویر را انتخاب کنید تا جزئیات کامل، ابعاد و
              مکان‌های استفاده اینجا نمایش داده شود.
            </p>
          </div>
        )}
      </aside>

      <ConfirmDialog
        open={delId !== null}
        onOpenChange={(o) => !o && setDelId(null)}
        title="حذف این تصویر؟"
        confirmLabel="حذف از کتابخانه"
        destructive
        tone="destructive"
        body={
          <span>
            فایل و ردیف کتابخانه برای همیشه حذف می‌شوند. تصاویر متصل به یک
            محصول از این مسیر حذف نمی‌شوند — برای آن‌ها از صفحهٔ خود محصول
            اقدام کنید.
          </span>
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}

function MediaTile({
  row,
  selected,
  onSelect,
}: {
  row: LibraryRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white/85 text-start transition hover:border-primary",
        selected ? "border-primary ring-1 ring-primary" : "border-edge",
      )}
    >
      <div className="aspect-[4/3] bg-canvas-soft">
        {row.url ? (
          <img src={row.url} alt={row.alt} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-ink-muted">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-ink/80 to-transparent px-3 py-2 text-canvas">
        <span className="text-[10px] uppercase tracking-[0.18em]">
          {row.source === "library" ? "کتابخانه" : "محصول"}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-canvas/80">
          {row.width && row.height ? `${row.width}×${row.height}` : ""}
        </span>
      </div>
      <div className="px-3 py-2">
        <p className="truncate text-[12px] font-medium text-ink">{row.alt}</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">
          {new Date(row.uploadedAt).toLocaleDateString("fa-IR")}
        </p>
      </div>
    </button>
  );
}

function MediaDetailsPanel({
  row,
  onClose,
  onDelete,
}: {
  row: LibraryRow;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const [altDraft, setAltDraft] = React.useState(row.alt);
  const [captionDraft, setCaptionDraft] = React.useState(row.caption ?? "");
  const [metaBusy, setMetaBusy] = React.useState(false);
  const [replaceBusy, setReplaceBusy] = React.useState(false);
  const [replaceError, setReplaceError] = React.useState<string | null>(null);
  const replaceInputRef = React.useRef<HTMLInputElement | null>(null);

  const updateAlt = useMutation(api.admin_media.updateLibraryAlt);
  const generateUploadUrl = useMutation(api.admin_media.generateUploadUrl);
  const replaceAsset = useMutation(api.admin_media.replaceLibraryAsset);

  const isLibrary = row.source === "library";

  const copyUrl = async () => {
    if (!row.url) return;
    try {
      await navigator.clipboard.writeText(row.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const saveMeta = async () => {
    setMetaBusy(true);
    try {
      await updateAlt({
        id: row.id as Id<"media_library">,
        alt: altDraft.trim(),
        caption: captionDraft.trim(),
      });
    } finally {
      setMetaBusy(false);
    }
  };

  const replace = async (file: File) => {
    setReplaceBusy(true);
    setReplaceError(null);
    try {
      const uploadUrl = await generateUploadUrl();
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(uploadUrl, { method: "POST", body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { storageId: Id<"_storage"> };
      const result = await replaceAsset({
        id: row.id as Id<"media_library">,
        storageId: data.storageId,
        contentType: file.type,
        size: file.size,
      });
      if (!result?.url) throw new Error("فایل جایگزین ذخیره نشد");
    } catch (err) {
      setReplaceError((err as Error).message ?? "جایگزینی ناموفق بود");
    } finally {
      setReplaceBusy(false);
    }
  };

  const sizeLabel = row.width && row.height ? `${row.width}×${row.height}` : "—";
  return (
    <div className="overflow-hidden rounded-3xl border border-edge bg-white/85">
      <div className="border-b border-edge px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-start">
            <span className="type-eyebrow text-ink-muted">جزئیات تصویر</span>
            <h2 className="mt-2 font-display text-xl text-ink">{row.alt}</h2>
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="grid h-8 w-8 place-items-center rounded-full hairline bg-white hover:bg-canvas-soft"
          >
            <X className="h-3.5 w-3.5 text-ink" />
          </button>
        </div>
      </div>
      <div className="aspect-[4/3] bg-canvas-soft">
        {row.url ? (
          <img src={row.url} alt={row.alt} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-ink-muted">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}
      </div>
      <dl className="space-y-3 px-6 py-5 text-sm">
        <Pair label="نام فایل" value={row.filename} />
        {!isLibrary ? <Pair label="متن جایگزین" value={row.alt} /> : null}
        <Pair label="ابعاد" value={sizeLabel} />
        <Pair
          label="تاریخ بارگذاری"
          value={new Date(row.uploadedAt).toLocaleString("fa-IR")}
        />
        <Pair
          label="مأخذ"
          value={row.source === "library" ? "کتابخانه آزاد" : "متصل به محصول"}
        />
        {isLibrary ? (
          <Pair
            label="دسته"
            value={row.section ? SECTION_LABEL[row.section] ?? "عمومی" : "عمومی"}
          />
        ) : null}
        {row.productName ? (
          <Pair label="محصول مرتبط" value={`${row.productName}${row.productSlug ? ` (${row.productSlug})` : ""}`} />
        ) : null}
        <Pair label="نوع MIME" value={row.contentType ?? "نامشخص"} />
      </dl>

      {isLibrary ? (
        <div className="space-y-3 border-t border-edge px-6 py-5">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              متن جایگزین (SEO)
            </span>
            <input
              dir="rtl"
              value={altDraft}
              onChange={(e) => setAltDraft(e.target.value)}
              placeholder="مثال: سوتین گیپور مشکی زنانه لونا"
              className="w-full rounded-xl border border-edge bg-canvas/60 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              عنوان / توضیح کوتاه
            </span>
            <input
              dir="rtl"
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              placeholder="توضیح استفاده از این تصویر…"
              className="w-full rounded-xl border border-edge bg-canvas/60 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => void saveMeta()}
            disabled={metaBusy}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary disabled:opacity-60"
          >
            {metaBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            ذخیره توضیحات
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-edge px-6 py-4">
        <button
          type="button"
          onClick={copyUrl}
          disabled={!row.url}
          className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-white disabled:opacity-40"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "کپی شد" : "کپی URL"}
        </button>
        {isLibrary ? (
          <>
            <button
              type="button"
              onClick={() => replaceInputRef.current?.click()}
              disabled={replaceBusy}
              className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-white disabled:opacity-50"
            >
              {replaceBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              جایگزینی تصویر
            </button>
            <input
              ref={replaceInputRef}
              type="file"
              hidden
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void replace(file);
                e.target.value = "";
              }}
            />
          </>
        ) : null}
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-rose-700 hover:bg-rose-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
          حذف
        </button>
      </div>
      {replaceError ? (
        <p className="border-t border-edge px-6 py-3 text-[11px] text-rose-700">
          {replaceError}
        </p>
      ) : null}
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </dt>
      <dd className="text-start font-medium text-ink">{value}</dd>
    </div>
  );
}
