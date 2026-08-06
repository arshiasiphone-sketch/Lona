import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Download } from "lucide-react";

type Kind = "orders" | "products" | "customers" | "reviews";

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ExportsPage() {
  const [kind, setKind] = useState<Kind>("orders");
  const rows = useQuery(api.reports.exportRows, { kind });

  const handle = (fmt: "csv" | "json") => {
    if (!rows) return;
    if (fmt === "json") download(`${kind}.json`, JSON.stringify(rows, null, 2), "application/json");
    else download(`${kind}.csv`, toCSV(rows as unknown as Record<string, unknown>[]), "text/csv;charset=utf-8");
  };

  return (
    <div className="space-y-6">
      <header><h1 className="font-display text-3xl text-ink">مرکز خروجی</h1><p className="text-sm text-ink-muted mt-1">خروجی Excel / CSV / JSON برای سفارش‌ها، محصولات، مشتریان و نظرات</p></header>
      <div className="flex flex-wrap gap-2">
        {(["orders", "products", "customers", "reviews"] as Kind[]).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`rounded-full px-4 py-2 text-sm border ${kind === k ? "bg-ink text-canvas border-ink" : "bg-white border-edge"}`}>
            {k === "orders" ? "سفارش‌ها" : k === "products" ? "محصولات" : k === "customers" ? "مشتریان" : "نظرات"}
          </button>
        ))}
      </div>
      <div className="glass rounded-3xl p-6 flex flex-wrap gap-3">
        <button onClick={() => handle("csv")} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-canvas"><Download className="h-4 w-4" /> CSV</button>
        <button onClick={() => handle("json")} className="inline-flex items-center gap-2 rounded-full border border-edge bg-white px-5 py-2.5 text-sm"><Download className="h-4 w-4" /> JSON</button>
        <button onClick={() => rows && download(`${kind}.html`, `<html dir="rtl"><body><h1>${kind}</h1><pre>${JSON.stringify(rows, null, 2)}</pre></body></html>`, "text/html")} className="inline-flex items-center gap-2 rounded-full border border-edge bg-white px-5 py-2.5 text-sm"><Download className="h-4 w-4" /> PDF (چاپ)</button>
        <span className="text-xs text-ink-muted self-center">{rows ? `${rows.length.toLocaleString("fa-IR")} ردیف` : "در حال بارگذاری…"}</span>
      </div>
    </div>
  );
}
