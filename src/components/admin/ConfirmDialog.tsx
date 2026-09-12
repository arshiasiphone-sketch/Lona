/**
 * Phase 5.2 — ConfirmDialog.
 *
 * Controlled Radix AlertDialog with Persian defaults (action
 * labels, RTL layout, glass surface). Used by every destructive
 * admin mutation (category.delete, coupon.delete,
 * media.delete, settings.reset). Kept page-local — each page
 * owns an `open` piece of state — to avoid a singleton
 * provider. Five pages, five tiny `useState` calls.
 */
import * as React from "react";
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
import { cn } from "@/lib/glass";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  /** Variant hint — surfaces an icon chip in the header strip. */
  tone?: "destructive" | "neutral" | "info";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  destructive = false,
  busy = false,
  onConfirm,
  tone = "neutral",
}: ConfirmDialogProps) {
  const toneChip =
    tone === "destructive"
      ? "bg-rose-100 text-rose-700"
      : tone === "info"
        ? "bg-sky-100 text-sky-700"
        : "bg-canvas-soft text-ink-soft";
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="max-w-md rounded-3xl border border-edge bg-white/95 p-0 backdrop-blur-xl"
        dir="rtl"
      >
        <AlertDialogHeader className="space-y-3 px-7 pt-7 text-start">
          <span
            className={cn(
              "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]",
              toneChip,
            )}
          >
            {destructive ? "تأیید حذف" : "تأیید عملیات"}
          </span>
          <AlertDialogTitle className="font-display text-2xl leading-tight text-ink">
            {title}
          </AlertDialogTitle>
          {body ? (
            <AlertDialogDescription className="text-sm leading-relaxed text-ink-soft">
              {body}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row-reverse items-center gap-2 px-7 pb-7 pt-4">
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition",
              destructive
                ? "bg-rose-700 hover:bg-rose-800"
                : "bg-ink hover:bg-primary",
              busy && "opacity-60",
            )}
          >
            {busy ? "در حال انجام…" : confirmLabel}
          </AlertDialogAction>
          <AlertDialogCancel
            disabled={busy}
            className="rounded-full hairline bg-canvas/70 px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-white"
          >
            {cancelLabel}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
