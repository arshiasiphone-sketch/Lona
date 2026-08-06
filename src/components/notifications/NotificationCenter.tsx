import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

export function NotificationCenter() {
  const list = useQuery(api.notificationCenter.listMine, {});
  const markRead = useMutation(api.notificationCenter.markRead);
  const markAll = useMutation(api.notificationCenter.markAllRead);
  const remove = useMutation(api.notificationCenter.remove);

  if (list === undefined) return <p className="text-sm text-ink-muted">در حال بارگذاری…</p>;
  if (list.length === 0) return <div className="rounded-3xl border border-dashed border-edge bg-white/60 px-6 py-12 text-center"><Bell className="mx-auto h-6 w-6 text-ink-muted" /><p className="mt-3 text-sm text-ink-muted">اعلانی ندارید.</p></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => markAll({})} className="inline-flex items-center gap-2 rounded-full border border-edge bg-white px-4 py-2 text-xs hover:bg-canvas-soft"><CheckCheck className="h-4 w-4" /> خواندن همه</button>
      </div>
      <ul className="space-y-2">
        {list.map((n) => (
          <li key={n._id} className={`rounded-2xl border px-4 py-3 flex gap-3 ${n.read ? "bg-white/60 border-edge" : "bg-white border-primary/30"}`}>
            <Bell className={`h-4 w-4 mt-1 shrink-0 ${n.read ? "text-ink-muted" : "text-primary"}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink font-medium">{n.title}</p>
              <p className="text-xs text-ink-muted mt-0.5">{n.body}</p>
              <p className="text-[11px] text-ink-muted mt-1">{new Date(n.createdAt).toLocaleString("fa-IR")}</p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              {!n.read && <button onClick={() => markRead({ id: n._id })} className="text-[11px] text-primary hover:underline">خوانده شد</button>}
              <button onClick={() => remove({ id: n._id })} className="text-ink-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
