/**
 * Phase 5.1 — MediaUploader.
 *
 * Implements the canonical Convex file-storage recipe for each
 * drop or pick:
 *
 *   1. client calls `generateUploadUrl` to get a one-shot URL
 *   2. client POSTs the file directly to that URL
 *   3. server returns a `storageId`
 *   4. client calls `attachMedia` to bind the `storageId` to a
 *      `product_images` row tied to a product
 *
 * Validation: file type, file size, max image count. Each in-flight
 * upload is tracked so the row can show progress, success, failure
 * and a retry handler.
 */
import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Upload, X, AlertTriangle, RefreshCw, Star, ChevronUp, ChevronDown, ImagePlus } from "lucide-react";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { motion, AnimatePresence } from "framer-motion";

interface MediaUploaderProps {
  productId: Id<"products">;
}

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_IMAGES = 12;

type Row =
  | { key: string; state: "uploading"; progress: number; localUrl: string; name: string; size: number }
  | { key: string; state: "success"; storageId: Id<"_storage">; localUrl: string; name: string }
  | { key: string; state: "failed"; error: string; name: string; size: number; file?: File };

export function MediaUploader({ productId }: MediaUploaderProps) {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const generateUploadUrl = useMutation(api.admin_products.generateUploadUrl);
  const attachMedia = useMutation(api.admin_products.attachMedia);
  const reorderMedia = useMutation(api.admin_products.reorderMedia);
  const deleteMedia = useMutation(api.admin_products.deleteMedia);
  const liveMedia = useQuery(api.admin_products.listMedia, { productId });

  type PersistedImage = {
    _id: Id<"product_images">;
    url: string | null;
    alt: string;
    order: number;
  };

  const persisted: PersistedImage[] = (liveMedia ?? []) as PersistedImage[];

  const beginUpload = React.useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        const key = `${file.name}-${Date.now()}`;
        setRows((r) => [...r, { key, state: "failed", error: `Unsupported file type: ${file.type}`, name: file.name, size: file.size, file }]);
        return;
      }
      if (file.size > MAX_BYTES) {
        const key = `${file.name}-${Date.now()}`;
        setRows((r) => [...r, { key, state: "failed", error: `File exceeds 8 MB cap`, name: file.name, size: file.size, file }]);
        return;
      }
      const key = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const localUrl = URL.createObjectURL(file);
      setRows((r) => [...r, { key, state: "uploading", progress: 12, localUrl, name: file.name, size: file.size }]);

      try {
        const url = await generateUploadUrl();
        const form = new FormData();
        form.append("file", file);
        const result = await new Promise<{ storageId: Id<"_storage"> }>((resolve, reject) => {
          // Convex storage uploads are direct POSTs to the issued URL.
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (!e.lengthComputable) return;
            const pct = Math.min(95, Math.round((e.loaded / e.total) * 90) + 12);
            setRows((r: Row[]) =>
              r.map((row: Row) =>
                row.key === key && row.state === "uploading"
                  ? { ...row, progress: pct }
                  : row,
              ),
            );
          });
          const handleError = () => reject(new Error("Upload failed"));
          xhr.addEventListener("error", handleError);
          xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));
          xhr.addEventListener("load", () => {
            if (xhr.status < 200 || xhr.status >= 300) {
              reject(new Error(`HTTP ${xhr.status}`));
              return;
            }
            // Convex responds with { storageId: string }
            try {
              const data = JSON.parse(xhr.responseText) as { storageId: Id<"_storage"> };
              resolve({ storageId: data.storageId });
            } catch {
              reject(new Error("Malformed upload response"));
            }
          });
          xhr.open("POST", url);
          xhr.send(form);
        });

        await attachMedia({
          productId,
          storageId: result.storageId,
          alt: file.name.replace(/\.[^.]+$/, ""),
          order: persisted.length + rows.filter((r) => r.state === "success").length,
          dominantGradient: undefined,
        });
        setRows((r) =>
          r.map((row) =>
            row.key === key && row.state === "uploading"
              ? { key, state: "success", storageId: result.storageId, localUrl, name: file.name }
              : row,
          ),
        );
      } catch (err) {
        setRows((r) =>
          r.map((row) =>
            row.key === key && row.state === "uploading"
              ? { ...row, state: "failed", error: (err as Error).message }
              : row,
          ),
        );
      }
    },
    [generateUploadUrl, attachMedia, productId, persisted.length, rows],
  );

  const handleFiles = React.useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const incoming = Array.from(files).slice(0, MAX_IMAGES - persisted.length - rows.filter((r) => r.state === "uploading").length);
      incoming.forEach(beginUpload);
    },
    [beginUpload, persisted.length, rows],
  );

  const handleDrop = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    setDragging(false);
    handleFiles(ev.dataTransfer.files);
  };

  const retry = (key: string) => {
    setRows((r) => r.filter((row) => row.key !== key));
  };

  const move = async (index: number, delta: number) => {
    if (!persisted) return;
    const target = persisted[index];
    const swap = persisted[index + delta];
    if (!target || !swap) return;
    const nextOrder = persisted
      .map((row) => (row._id === target._id ? swap._id : row._id === swap._id ? target._id : row._id))
      .slice();
    await reorderMedia({ productId, order: nextOrder });
  };

  const remove = async (id: Id<"product_images">) => {
    await deleteMedia({ id });
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-edge bg-white/60 px-6 py-12 text-center transition",
          dragging && "border-primary bg-primary/10",
        )}
      >
        <div className="grid h-12 w-12 place-items-center rounded-full hairline bg-white text-primary">
          <ImagePlus className="h-5 w-5" />
        </div>
        <p className="font-display text-lg text-ink">تصاویر تکه را در اینجا رها کنید.</p>
        <p className="mt-1 text-xs text-ink-muted">
          PNG, JPG, WebP, AVIF — حداکثر ۸ مگابایت، ۱۲ تصویر برای هر محصول.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          <Upload className="h-3.5 w-3.5" />
          انتخاب از دستگاه
        </button>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept={ACCEPTED.join(",")}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <AnimatePresence>
        {rows.map((row) => (
          <motion.div
            key={row.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE_LUXURY }}
            className="rounded-2xl border border-edge bg-white/85 p-4"
          >
            {row.state === "uploading" && (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-xl bg-ink/10">
                  <img src={row.localUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{row.name}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                    در حال بارگذاری · {row.progress}٪
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.progress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              </div>
            )}
            {row.state === "success" && (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center text-[10px] uppercase">
                  آماده
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{row.name}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                    ذخیره شد.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => retry(row.key)}
                  className="grid h-8 w-8 place-items-center rounded-full hairline"
                >
                  <X className="h-3.5 w-3.5 text-ink-soft" />
                </button>
              </div>
            )}
            {row.state === "failed" && (
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-xl bg-rose-100 text-rose-700">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{row.name}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-rose-700">
                    خطا · {row.error}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => retry(row.key)}
                  className="grid h-8 w-8 place-items-center rounded-full hairline"
                  aria-label="بستن"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-ink-soft" />
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {persisted.map((row, i) => (
          <div
            key={row._id}
            className="group relative overflow-hidden rounded-2xl border border-edge bg-white/85"
          >
            <div className="aspect-[4/5] bg-canvas-soft">
              {row.url ? (
                <img src={row.url} alt={row.alt} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-ink-muted text-sm">
                  بدون پیش‌نمایش
                </div>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-ink/80 to-transparent px-3 py-2 text-canvas">
              <span className="text-[10px] uppercase tracking-[0.18em]">
                {i === 0 ? "اصلی" : `تصویر ${(i + 1).toLocaleString("fa-IR")}`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/20 disabled:opacity-30"
                  aria-label="جابه‌جایی به بالا"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === persisted.length - 1}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/20 disabled:opacity-30"
                  aria-label="جابه‌جایی به پایین"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(row._id)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/20"
                  aria-label="حذف"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
            {i === 0 && (
              <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink/90 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-canvas">
                <Star className="h-3 w-3" /> اصلی
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
