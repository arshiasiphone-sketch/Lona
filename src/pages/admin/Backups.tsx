import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Download, Trash2, Upload, Loader2 } from "lucide-react";

export default function BackupsPage() {
  const snaps = useQuery(api.backups.listSnapshots, {});
  const create = useMutation(api.backups.createSnapshot);
  const del = useMutation(api.backups.deleteSnapshot);
  const exportRows = useQuery(api.reports.exportRows, { kind: "orders" });
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState("");
  const [fileErr, setFileErr] = useState("");

  const handleExport = async () => {
    setMsg("");
    try {
      const rows = exportRows ?? [];
      await create({ label: label || undefined, payload: { exportedAt: Date.now(), orders: rows } });
      setMsg("نسخه پشتیبان ساخته شد");
      setLabel("");
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : "خطا"); }
  };

  const handleImportFile = async (file: File) => {
    setFileErr("");
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await create({ label: `وارد شده: ${file.name}`, payload: json });
      setMsg("بازیابی از فایل انجام شد");
    } catch { setFileErr("فایل JSON نامعتبر"); }
  };

  const dl = (payload: unknown, name: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header><h1 className="font-display text-3xl text-ink">پشتیبان‌گیری</h1><p className="text-sm text-ink-muted mt-1">Export JSON/CSV · Import · نسخه‌ها</p></header>

      <div className="glass rounded-3xl p-6 flex flex-wrap gap-3 items-end">
        <label className="flex-1 min-w-[200px]">
          <span className="text-xs text-ink-muted">برچسب نسخه</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="مثلاً پیش از آپدیت" className="mt-1 w-full rounded-2xl border border-edge bg-white px-4 py-2.5 text-sm" />
        </label>
        <button onClick={handleExport} className="rounded-full bg-ink px-6 py-2.5 text-sm text-canvas hover:bg-primary">ساخت نسخه</button>
        <label className="rounded-full border border-edge bg-white px-5 py-2.5 text-sm cursor-pointer inline-flex items-center gap-2">
          <Upload className="h-4 w-4" /> وارد کردن JSON
          <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])} />
        </label>
      </div>
      {msg && <p className="text-xs text-emerald-600">{msg}</p>}
      {fileErr && <p className="text-xs text-destructive">{fileErr}</p>}

      {snaps === undefined ? <Loader2 className="h-5 w-5 animate-spin" /> : snaps.length === 0 ? <p className="rounded-3xl border border-dashed border-edge bg-white/60 px-6 py-12 text-center text-sm text-ink-muted">هنوز نسخه‌ای ساخته نشده.</p> : (
        <ul className="space-y-2">
          {snaps.map((s) => (
            <li key={s._id} className="rounded-2xl border border-edge bg-white px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">{s.label} — نسخه {String(s.version).padStart(2, "0")}</p>
                <p className="text-xs text-ink-muted">{new Date(s.createdAt).toLocaleString("fa-IR")}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => dl(s.payload, `backup-v${s.version}.json`)} className="grid h-8 w-8 place-items-center rounded-full border border-edge bg-white hover:bg-canvas-soft"><Download className="h-4 w-4" /></button>
                <button onClick={() => { if (confirm("حذف نسخه؟")) del({ id: s._id }); }} className="grid h-8 w-8 place-items-center rounded-full border border-edge bg-white text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
