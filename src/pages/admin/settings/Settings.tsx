/**
 * Phase 5.2 — Settings CMS.
 *
 * Surface: `/admin/settings`.
 *
 * Single page with horizontal tabs. Each tab holds an independent
 * form. Every save calls `api.admin_settings.upsertSetting` with
 * a stable key (e.g. `brand.name`). The settings table is open-
 * shaped on the server so future knobs ship without migration.
 *
 * Sections:
 *   • اطلاعات برند — name, tagline, description
 *   • فروشگاه — phone, email, address, social links
 *   • SEO — site title, meta description, OpenGraph defaults
 *   • اعلان‌ها — toggles for order, inventory, content channels
 */
import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Bell,
  Check,
  Globe,
  Hash,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  Send,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { EASE_LUXURY } from "@/lib/motion";
import { cn } from "@/lib/glass";

type SettingRow = { _id: string; key: string; value: unknown };

export default function Settings() {
  const rows = useQuery(api.admin_settings.getAll, {}) ?? [];
  const upsert = useMutation(api.admin_settings.upsertSetting);

  const lookup = React.useCallback(
    (key: string) => {
      const row = (rows as SettingRow[]).find((r) => r.key === key);
      return row?.value as Record<string, unknown> | undefined;
    },
    [rows],
  );

  const [tab, setTab] = React.useState<"brand" | "store" | "seo" | "notifications">("brand");
  const [pending, setPending] = React.useState<string | null>(null);

  const save = React.useCallback(
    async (key: string, value: unknown) => {
      setPending(key);
      try {
        await upsert({ key, value });
      } finally {
        setPending(null);
      }
    },
    [upsert],
  );

  const persistedLookup: Record<string, Record<string, unknown>> = React.useMemo(() => {
    const map: Record<string, Record<string, unknown>> = {};
    (rows as SettingRow[]).forEach((row) => {
      if (typeof row.value === "object" && row.value !== null) {
        map[row.key] = row.value as Record<string, unknown>;
      }
    });
    return map;
  }, [rows]);

  // Stable `value` for each setting keyed off latest snapshot.
  const v = React.useCallback(
    (key: string) => persistedLookup[key] ?? {},
    [persistedLookup],
  );

  const TABS = [
    { id: "brand" as const, label: "اطلاعات برند", icon: Sparkles },
    { id: "store" as const, label: "فروشگاه", icon: ShoppingBag },
    { id: "seo" as const, label: "SEO", icon: Globe },
    { id: "notifications" as const, label: "اعلان‌ها", icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">سیستم</p>
          <h1 className="mt-2 font-display text-4xl text-ink lg:text-5xl">
            تنظیمات
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            نام برند، اطلاعات تماس، متادیتای SEO و ترجیحات اعلان‌ها — همه در
            یک صفحه. تغییرات بلافاصله برای فروشگاه اعمال می‌شوند.
          </p>
        </div>
      </header>

      <div className="overflow-hidden rounded-3xl border border-edge bg-white/85">
        <nav
          role="tablist"
          aria-label="بخش‌های تنظیمات"
          className="flex flex-wrap items-center gap-2 border-b border-edge bg-canvas-soft px-6 py-4"
          dir="rtl"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition",
                tab === t.id
                  ? "bg-ink text-canvas"
                  : "hairline bg-white/70 text-ink-soft hover:bg-white",
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </nav>

        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_LUXURY }}
          className="px-7 py-7"
          dir="rtl"
        >
          {tab === "brand" ? (
            <BrandPanel
              value={v("brand")}
              pending={pending}
              onSave={(value) => save("brand", value)}
            />
          ) : tab === "store" ? (
            <StorePanel
              value={v("store")}
              pending={pending}
              onSave={(value) => save("store", value)}
            />
          ) : tab === "seo" ? (
            <SeoPanel
              value={v("seo")}
              pending={pending}
              onSave={(value) => save("seo", value)}
            />
          ) : (
            <NotificationsPanel
              value={v("notifications")}
              pending={pending}
              onSave={(value) => save("notifications", value)}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

function BrandPanel({
  value,
  pending,
  onSave,
}: {
  value: Record<string, unknown>;
  pending: string | null;
  onSave: (value: Record<string, unknown>) => void;
}) {
  const [name, setName] = React.useState((value.name as string) ?? "Lona");
  const [tagline, setTagline] = React.useState((value.tagline as string) ?? "");
  const [description, setDescription] = React.useState(
    (value.description as string) ?? "",
  );
  React.useEffect(() => {
    setName((value.name as string) ?? "Lona");
    setTagline((value.tagline as string) ?? "");
    setDescription((value.description as string) ?? "");
  }, [value]);
  return (
    <Section
      title="هویت برند"
      description="این نام و شعار در هدر، فوتر و متادیتای صفحات نمایش داده می‌شود."
      icon={Sparkles}
    >
      <Field label="نام برند" required>
        <input
          dir="rtl"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </Field>
      <Field label="شعار کوتاه">
        <input
          dir="rtl"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="ظرافتی که هر روز همراه شماست"
          className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </Field>
      <Field label="توضیح کوتاه" hint="در بخش دربارهٔ ما و OpenGraph نمایش داده می‌شود.">
        <textarea
          dir="rtl"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </Field>
      <SaveBar
        busy={pending === "brand"}
        onSave={() => onSave({ name, tagline, description })}
        disabled={!name}
      />
    </Section>
  );
}

function StorePanel({
  value,
  pending,
  onSave,
}: {
  value: Record<string, unknown>;
  pending: string | null;
  onSave: (value: Record<string, unknown>) => void;
}) {
  const [phone, setPhone] = React.useState((value.phone as string) ?? "");
  const [email, setEmail] = React.useState((value.email as string) ?? "");
  const [address, setAddress] = React.useState((value.address as string) ?? "");
  const [hours, setHours] = React.useState((value.hours as string) ?? "");
  const [social, setSocial] = React.useState<Record<string, string>>(
    (value.social as Record<string, string>) ?? {
      instagram: "",
      telegram: "",
      whatsapp: "",
    },
  );
  React.useEffect(() => {
    setPhone((value.phone as string) ?? "");
    setEmail((value.email as string) ?? "");
    setAddress((value.address as string) ?? "");
    setHours((value.hours as string) ?? "");
    setSocial(
      (value.social as Record<string, string>) ?? {
        instagram: "",
        telegram: "",
        whatsapp: "",
      },
    );
  }, [value]);

  return (
    <Section
      title="اطلاعات فروشگاه"
      description="تماس، آدرس و شبکه‌های اجتماعی. این مقادیر در فوتر و صفحه تماس با ما نمایش داده می‌شوند."
      icon={ShoppingBag}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="تلفن" icon={Phone}>
          <input
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+98 21 8877 0000"
            className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </Field>
        <Field label="ایمیل پشتیبانی" icon={Mail}>
          <input
            dir="ltr"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@lona.luxury"
            className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </Field>
      </div>
      <Field label="آدرس فروشگاه" icon={MapPin}>
        <textarea
          dir="rtl"
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="تهران، خیابان الهیه، پلاک ۲۴"
          className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </Field>
      <Field label="ساعات کاری">
        <input
          dir="rtl"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="شنبه تا چهارشنبه، ۱۰ تا ۲۰"
          className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </Field>

      <div className="space-y-3 rounded-2xl border border-edge bg-canvas/60 p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
          شبکه‌های اجتماعی
        </p>
        {(
          [
            ["instagram", "Instagram", "@lonaboutique"],
            ["telegram", "Telegram", "@lona_official"],
            ["whatsapp", "WhatsApp", "https://wa.me/98…"],
          ] as const
        ).map(([key, label, placeholder]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-28 text-xs text-ink-soft">{label}</span>
            <input
              dir="ltr"
              value={social[key] ?? ""}
              onChange={(e) =>
                setSocial((prev) => ({ ...prev, [key]: e.target.value }))
              }
              placeholder={placeholder}
              className="flex-1 rounded-xl border border-edge bg-white px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>
        ))}
      </div>

      <SaveBar
        busy={pending === "store"}
        onSave={() => onSave({ phone, email, address, hours, social })}
      />
    </Section>
  );
}

function SeoPanel({
  value,
  pending,
  onSave,
}: {
  value: Record<string, unknown>;
  pending: string | null;
  onSave: (value: Record<string, unknown>) => void;
}) {
  const [siteTitle, setSiteTitle] = React.useState(
    (value.siteTitle as string) ?? "لونا · لباس زیر و راحتی زنانه",
  );
  const [metaDescription, setMetaDescription] = React.useState(
    (value.metaDescription as string) ?? "",
  );
  const [ogImage, setOgImage] = React.useState((value.ogImage as string) ?? "");
  const [twitterHandle, setTwitterHandle] = React.useState(
    (value.twitterHandle as string) ?? "",
  );
  React.useEffect(() => {
    setSiteTitle((value.siteTitle as string) ?? "لونا · لباس زیر و راحتی زنانه");
    setMetaDescription((value.metaDescription as string) ?? "");
    setOgImage((value.ogImage as string) ?? "");
    setTwitterHandle((value.twitterHandle as string) ?? "");
  }, [value]);

  return (
    <Section
      title="سئو و شبکه‌های اجتماعی"
      description="این مقادیر در تگ‌های <meta> و OpenGraph استفاده می‌شوند."
      icon={Globe}
    >
      <Field label="عنوان سایت" icon={Hash}>
        <input
          dir="rtl"
          value={siteTitle}
          onChange={(e) => setSiteTitle(e.target.value)}
          className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </Field>
      <Field label="توضیحات متا" hint="حداکثر ۱۶۰ کاراکتر پیشنهاد می‌شود.">
        <textarea
          dir="rtl"
          rows={3}
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </Field>
      <Field label="آدرس تصویر OpenGraph" icon={Globe}>
        <input
          dir="ltr"
          value={ogImage}
          onChange={(e) => setOgImage(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </Field>
      <Field label="Twitter handle" icon={MessageCircle}>
        <input
          dir="ltr"
          value={twitterHandle}
          onChange={(e) => setTwitterHandle(e.target.value)}
          placeholder="@lonaboutique"
          className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </Field>
      <SaveBar
        busy={pending === "seo"}
        onSave={() =>
          onSave({ siteTitle, metaDescription, ogImage, twitterHandle })
        }
        disabled={!siteTitle}
      />
    </Section>
  );
}

function NotificationsPanel({
  value,
  pending,
  onSave,
}: {
  value: Record<string, unknown>;
  pending: string | null;
  onSave: (value: Record<string, unknown>) => void;
}) {
  const [orderSms, setOrderSms] = React.useState(
    (value.orderSms as boolean) ?? true,
  );
  const [orderEmail, setOrderEmail] = React.useState(
    (value.orderEmail as boolean) ?? true,
  );
  const [lowStock, setLowStock] = React.useState(
    (value.lowStock as boolean) ?? true,
  );
  const [newsletter, setNewsletter] = React.useState(
    (value.newsletter as boolean) ?? true,
  );
  React.useEffect(() => {
    setOrderSms((value.orderSms as boolean) ?? true);
    setOrderEmail((value.orderEmail as boolean) ?? true);
    setLowStock((value.lowStock as boolean) ?? true);
    setNewsletter((value.newsletter as boolean) ?? true);
  }, [value]);
  return (
    <Section
      title="اعلان‌ها"
      description="کانال‌های اطلاع‌رسانی برای رویدادهای فروشگاه."
      icon={Bell}
    >
      <Toggle
        label="پیامک تأیید سفارش"
        description="پس از ثبت موفق سفارش، پیامک تأیید برای مشتری ارسال شود."
        checked={orderSms}
        onChange={setOrderSms}
        icon={Send}
      />
      <Toggle
        label="ایمیل تأیید سفارش"
        description="ایمیل تأیید + فاکتور برای مشتری ارسال شود."
        checked={orderEmail}
        onChange={setOrderEmail}
        icon={Mail}
      />
      <Toggle
        label="هشدار کمبود موجودی"
        description="وقتی موجودی یک تنوع زیر آستانه تعریف‌شده رفت، به تیم اطلاع بده."
        checked={lowStock}
        onChange={setLowStock}
        icon={ShoppingBag}
      />
      <Toggle
        label="خبرنامه فصلی"
        description="مشترکین، محصولات جدید و نوشته‌های مجله را دریافت می‌کنند."
        checked={newsletter}
        onChange={setNewsletter}
        icon={MessageCircle}
      />
      <SaveBar
        busy={pending === "notifications"}
        onSave={() => onSave({ orderSms, orderEmail, lowStock, newsletter })}
      />
    </Section>
  );
}

function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full hairline bg-canvas-soft text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="text-start">
          <h2 className="font-display text-2xl text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-soft">{description}</p>
        </div>
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  icon: Icon,
  required,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
        <span className="inline-flex items-center gap-1">
          {Icon ? <Icon className="h-3 w-3" /> : null}
          {label}
          {required ? <span className="text-primary">*</span> : null}
        </span>
        {hint ? <span className="text-[10px] text-ink-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function SaveBar({
  busy,
  onSave,
  disabled,
}: {
  busy: boolean;
  onSave: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-edge pt-5">
      {busy ? (
        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          <Loader2 className="h-3 w-3 animate-spin" />
          در حال ذخیره…
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-emerald-700">
          <Check className="h-3 w-3" />
          تغییرات ذخیره شده‌اند.
        </span>
      )}
      <button
        type="button"
        onClick={onSave}
        disabled={busy || disabled}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary disabled:opacity-60"
      >
        <Save className="h-3.5 w-3.5" />
        ذخیره تغییرات
      </button>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      dir="rtl"
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-start transition",
        checked
          ? "border-primary/40 bg-primary/8"
          : "border-edge bg-canvas/60 hover:bg-white",
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full hairline",
          checked ? "bg-primary text-canvas" : "bg-white text-ink-soft",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-0.5 text-[12px] text-ink-soft">{description}</p>
      </span>
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-primary" : "bg-ink-muted/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-canvas transition",
            checked ? "left-0.5" : "right-0.5",
          )}
        />
      </span>
    </button>
  );
}
