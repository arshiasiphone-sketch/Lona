import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ReturnsAdminPage() {
  const rows = useQuery(api.returns.listAllReturns, {});
  const update = useMutation(api.returns.updateReturnStatus);
  const [note, setNote] = useState("");
  if (!rows) return <div className="grid place-items-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-ink">مرجوعی‌ها</h1>
      {rows.length === 0 ? <p className="rounded-3xl border border-dashed border-edge bg-white/60 px-6 py-12 text-center text-sm text-ink-muted">درخواستی ثبت نشده.</p> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r._id} className="rounded-3xl border border-edge bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{r.type === "return" ? "مرجوعی" : "تعویض"} — {r.reason}</p>
                  <p className="text-xs text-ink-muted mt-1">{r.description ?? ""}</p>
                  <p className="text-[11px] text-ink-muted mt-1">{new Date(r.createdAt).toLocaleString("fa-IR")} · {r.status}</p>
                </div>
                <span className="rounded-full bg-canvas-soft px-3 py-1 text-xs">{r.status}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="یادداشت ادمین" className="rounded-full border border-edge bg-white px-3 py-2 text-xs flex-1 min-w-[160px]" />
                {(["reviewing", "approved", "rejected", "completed"] as const).map((s) => (
                  <button key={s} onClick={() => update({ returnId: r._id, status: s, adminNote: note || undefined })} className="rounded-full border border-edge bg-white px-3 py-1.5 text-xs hover:bg-canvas-soft">{s}</button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
