/**
 * Phase 7.4 — CoverImageField.
 *
 * Reusable admin field for a single cover image (editorial covers,
 * editorial covers, …). Mirrors the Settings → تصاویر slot card recipe:
 *
 *   1. client calls `admin_media.generateUploadUrl` for a one-shot URL
 *   2. client POSTs the file directly to that URL
 *   3. server returns a `storageId`
 *   4. client calls `admin_media.attachToLibrary` to bind it to the
 *      media library (section = "editorial" by default)
 *   5. the resolved URL is handed back via `onChange`
 *
 * Also supports pasting an external URL and clearing back to none
 * (the consumer keeps its gradient fallback).
 */
import * as React from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Check, ImagePlus, Loader2, RotateCcw, Upload, X } from "lucide-react";
import { cn } from "@/lib/glass";
import {
  IMAGE_ACCEPT,
  MAX_LIBRARY_IMAGE_BYTES,
  formatAcceptedImageTypes,
  getImageContentType,
} from "@/lib/media";

const MAX_BYTES = MAX_LIBRARY_IMAGE_BYTES;

export function CoverImageField({
  label,
  value,
  onChange,
  section = "editorial",
  aspect = "aspect-[16/9]",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  section?: "brand" | "editorial" | "instagram" | "banner" | "general";
  aspect?: string;
}) {
  const [draft, setDraft] = React.useState(value);
  const [busy, setBusy] = React.useState<"url" | "upload" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const generateUploadUrl = useMutation(api.admin_media.generateUploadUrl);
  const attachToLibrary = useMutation(api.admin_media.attachToLibrary);
  const deleteLibraryAsset = useMutation(api.admin_media.deleteLibraryAsset);
  const discardUpload = useMutation(api.admin_media.discardUpload);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const applyUrl = async () => {
    const url = draft.trim();
    if (!url) return;
    setBusy("url");
    setError(null);
    try {
      onChange(url);
    } catch (err) {
      setError((err as Error).message ?? "خطا در ذخیره آدرس");
    } finally {
      setBusy(null);
    }
  };

  const upload = async (file: File) => {
    const contentType = getImageContentType(file);
    if (!contentType) {
      setError(`فرمت فایل پشتیبانی نمی‌شود (${formatAcceptedImageTypes()})`);
      return;
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      setError("حجم تصویر باید بیشتر از صفر و حداکثر ۱۰ مگابایت باشد");
      return;
    }
    setBusy("upload");
    setError(null);
    let uploadedStorageId: Id<"_storage"> | null = null;
    let attachedId: Id<"media_library"> | null = null;
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { storageId: Id<"_storage"> };
      uploadedStorageId = data.storageId;
      const attached = await attachToLibrary({
        storageId: data.storageId,
        filename: file.name,
        alt: label,
        section,
      });
      attachedId = attached.id;
      if (!attached.url) throw new Error("آدرس تصویر دریافت نشد");
      onChange(attached.url);
      setDraft(attached.url);
    } catch (err) {
      if (attachedId) {
        await deleteLibraryAsset({ id: attachedId }).catch(() => {});
      } else if (uploadedStorageId) {
        await discardUpload({ storageId: uploadedStorageId }).catch(() => {});
      }
      setError((err as Error).message ?? "بارگذاری ناموفق بود");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border bg-canvas-soft",
          value ? "border-edge" : "border-dashed border-edge",
          aspect,
        )}
      >
        {value ? (
          <img
            src={value}
            alt={label}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center gap-1 p-4 text-center">
            <ImagePlus className="h-5 w-5 text-ink-muted" />
            <p className="text-[11px] text-ink-muted">بدون تصویر کاور — گرادیان نمایش داده می‌شود</p>
          </div>
        )}
        {busy === "upload" ? (
          <div className="absolute inset-0 grid place-items-center bg-ink/40 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-canvas" />
          </div>
        ) : null}
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setDraft("");
            }}
            className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink/85 text-canvas transition hover:bg-ink"
            aria-label="حذف تصویر کاور"
            title="حذف تصویر کاور"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5">
        <input
          dir="ltr"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://… یا آپلود از دستگاه"
          className="h-9 w-full rounded-xl border border-edge bg-canvas/60 px-3 text-[12px] text-ink focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void applyUrl()}
          disabled={busy !== null || !draft.trim()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-canvas transition hover:bg-primary disabled:opacity-50"
          aria-label="اعمال آدرس"
          title="اعمال آدرس"
        >
          {busy === "url" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy !== null}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hairline text-ink-soft transition hover:bg-white hover:text-ink disabled:opacity-50"
          aria-label="بارگذاری از دستگاه"
          title="بارگذاری از دستگاه"
        >
          <Upload className="h-3.5 w-3.5" />
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setDraft("");
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hairline text-ink-soft transition hover:bg-white hover:text-ink"
            aria-label="حذف تصویر"
            title="حذف تصویر"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          hidden            accept={IMAGE_ACCEPT}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </div>
      {error ? <p className="text-[11px] text-rose-700">{error}</p> : null}
    </div>
  );
}
