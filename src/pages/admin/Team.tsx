import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "react-router";
import { api } from "@/convex/_generated/api";
import { AdminEmptyState, AdminTable, StatusBadge } from "@/components/admin";
import { Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useToast } from "@/lib/toast";

const roleLabels: Record<string, string> = {
  owner: "مالک",
  admin: "مدیر",
  manager: "مدیر اجرایی",
  editor: "ویراستار",
  support: "پشتیبانی",
};

const rolePermissions: Record<string, string[]> = {
  admin: ["manage_products", "manage_orders", "manage_customers", "manage_content", "manage_media", "manage_coupons", "manage_settings", "view_reports"],
  manager: ["manage_products", "manage_inventory", "manage_orders", "manage_customers", "manage_content", "manage_coupons", "manage_media", "view_reports"],
  editor: ["manage_products", "manage_content", "manage_media"],
  support: ["manage_customers"],
};

function formatDate(value?: number) {
  return value ? new Date(value).toLocaleDateString("fa-IR") : "—";
}

export default function TeamPage() {
  const { id } = useParams<{ id?: string }>();
  const members = useQuery(api.admin_team.list, {});
  const activity = useQuery(api.admin_team.activity, id ? { userId: id as never } : "skip");
  const createInvite = useMutation(api.admin_team.createInvite);
  const updateRole = useMutation(api.admin_team.updateRole);
  const setStatus = useMutation(api.admin_team.setStatus);
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (members ?? []).filter((member) => !needle || `${member.name} ${member.email}`.toLowerCase().includes(needle));
  }, [members, search]);

  async function invite() {
    if (!email.trim()) return;
    setBusy(true);
    try {
      const result = await createInvite({ email, role, permissions: rolePermissions[role] ?? [] });
      setInviteToken(result.token);
      setEmail("");
      toast.success("دعوت ایجاد شد؛ توکن را فقط از مسیر امن برای مدیر ارسال کنید.");
    } catch (error) {
      toast.error((error as Error).message || "ایجاد دعوت ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(userId: string, nextRole: string) {
    try {
      await updateRole({ userId: userId as never, role: nextRole, permissions: rolePermissions[nextRole] ?? [] });
      toast.success("نقش مدیر به‌روزرسانی شد.");
    } catch (error) {
      toast.error((error as Error).message || "تغییر نقش ناموفق بود.");
    }
  }

  async function toggleStatus(userId: string, current: string) {
    try {
      await setStatus({ userId: userId as never, status: current === "disabled" ? "active" : "disabled" });
      toast.success(current === "disabled" ? "دسترسی فعال شد." : "دسترسی مدیر متوقف شد.");
    } catch (error) {
      toast.error((error as Error).message || "تغییر وضعیت ناموفق بود.");
    }
  }

  if (id) {
    const member = members?.find((row) => String(row.id) === id);
    return (
      <div className="space-y-6" dir="rtl">
        <header>
          <p className="type-eyebrow text-ink-muted">تیم مدیریتی</p>
          <h1 className="mt-2 font-display text-4xl text-ink">جزئیات مدیر</h1>
        </header>
        {!member ? <AdminEmptyState title="مدیر پیدا نشد." body="ممکن است دسترسی این حساب حذف یا غیرفعال شده باشد." icon={<ShieldCheck className="h-5 w-5" />} /> : (
          <>
            <div className="grid gap-4 rounded-3xl border border-edge bg-white/85 p-6 sm:grid-cols-3">
              <div><p className="text-xs text-ink-muted">نام</p><p className="mt-1 font-medium text-ink">{member.name || "بدون نام"}</p></div>
              <div><p className="text-xs text-ink-muted">ایمیل</p><p className="mt-1 text-ink" dir="ltr">{member.email}</p></div>
              <div><p className="text-xs text-ink-muted">آخرین ورود</p><p className="mt-1 text-ink">{formatDate(member.lastLoginAt)}</p></div>
            </div>
            <div className="rounded-3xl border border-edge bg-white/85 p-6">
              <h2 className="font-display text-2xl text-ink">فعالیت‌های اخیر</h2>
              {activity === undefined ? <Loader2 className="mt-6 h-5 w-5 animate-spin" /> : activity.length === 0 ? <p className="mt-5 text-sm text-ink-muted">فعالیتی ثبت نشده است.</p> : <ul className="mt-5 space-y-3">{activity.map((row) => <li key={row._id} className="rounded-2xl border border-edge bg-canvas-soft p-3 text-sm"><span className="text-ink">{row.action}</span><span className="mx-2 text-ink-muted">·</span><span className="text-ink-muted">{formatDate(row.at)}</span></li>)}</ul>}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-7" dir="rtl">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">امنیت و دسترسی</p>
          <h1 className="mt-2 font-display text-4xl text-ink lg:text-5xl">مدیریت کاربران مدیریتی</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">فقط مالک می‌تواند دعوت کند، نقش را تغییر دهد یا دسترسی مدیر را فوراً متوقف کند.</p>
        </div>
      </header>

      <section className="rounded-3xl border border-edge bg-white/85 p-6">
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary"><UserPlus className="h-4 w-4" /></span><div><h2 className="font-display text-2xl text-ink">دعوت مدیر جدید</h2><p className="text-sm text-ink-muted">توکن دعوت فقط یک‌بار نمایش داده می‌شود و هفت روز اعتبار دارد.</p></div></div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input dir="ltr" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" className="rounded-2xl border border-edge bg-canvas/60 px-4 py-3 text-sm text-ink focus:border-primary focus:outline-none" />
          <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-2xl border border-edge bg-canvas/60 px-4 py-3 text-sm text-ink focus:border-primary focus:outline-none">{Object.keys(roleLabels).filter((key) => key !== "owner").map((key) => <option key={key} value={key}>{roleLabels[key]}</option>)}</select>
          <button type="button" onClick={() => void invite()} disabled={busy || !email.trim()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-canvas transition hover:bg-primary disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} ایجاد دعوت</button>
        </div>
        {inviteToken ? <div className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 p-4"><p className="text-sm font-medium text-amber-900">توکن امن دعوت — این مقدار را در اختیار فرد دعوت‌شده بگذارید:</p><code dir="ltr" className="mt-2 block select-all break-all rounded-xl bg-white/80 p-3 text-xs text-amber-950">{inviteToken}</code></div> : null}
      </section>

      <section className="rounded-3xl border border-edge bg-white/85 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl text-ink">اعضای تیم</h2><input dir="rtl" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جست‌وجوی نام یا ایمیل" className="rounded-full border border-edge bg-canvas/60 px-4 py-2 text-sm text-ink focus:border-primary focus:outline-none" /></div>
        <AdminTable
          rows={filtered}
          rowKey={(row) => String(row.id)}
          searchPlaceholder=""
          columns={[
            { key: "identity", header: "هویت", cell: (row) => <div><a href={`/admin/team/${String(row.id)}`} className="font-medium text-ink hover:text-primary">{row.name || "بدون نام"}</a><p className="text-xs text-ink-muted" dir="ltr">{row.email}</p></div> },
            { key: "role", header: "نقش", cell: (row) => row.role === "owner" ? <span className="font-medium text-ink">مالک</span> : <select value={row.role ?? "support"} onChange={(event) => void changeRole(String(row.id), event.target.value)} className="rounded-lg border border-edge bg-white px-2 py-1 text-xs">{Object.keys(roleLabels).filter((key) => key !== "owner").map((key) => <option key={key} value={key}>{roleLabels[key]}</option>)}</select> },
            { key: "status", header: "وضعیت", cell: (row) => <StatusBadge status={row.adminStatus === "disabled" ? "inactive" : "active"} label={row.adminStatus === "disabled" ? "غیرفعال" : "فعال"} /> },
            { key: "login", header: "آخرین ورود", cell: (row) => formatDate(row.lastLoginAt) },
            { key: "actions", header: "اقدام", cell: (row) => row.role === "owner" ? <span className="text-xs text-ink-muted">محافظت‌شده</span> : <button type="button" onClick={() => void toggleStatus(String(row.id), row.adminStatus ?? "active")} className="text-xs font-medium text-primary hover:underline">{row.adminStatus === "disabled" ? "فعال‌سازی" : "توقف دسترسی"}</button> },
          ]}
          empty="هنوز مدیر دیگری ثبت نشده است."
        />
      </section>
    </div>
  );
}
