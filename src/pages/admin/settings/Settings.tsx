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
  BadgeCheck,
  Bell,
  Check,
  Globe,
  Hash,
  Images,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Upload,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/lib/toast";
import {
  DEFAULT_HOMEPAGE_IMAGES,
  HOMEPAGE_IMAGE_SLOTS,
  type HomepageImageSlot,
} from "@/lib/homepage-images";
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

  const [tab, setTab] = React.useState<
    "brand" | "store" | "seo" | "images" | "notifications" | "shipping"
  >("brand");
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
    { id: "images" as const, label: "تصاویر", icon: Images },
    { id: "shipping" as const, label: "ارسال", icon: Truck },
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
          ) : tab === "images" ? (
            <ImagesPanel />
          ) : tab === "shipping" ? (
            <ShippingPanel />
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
  const [shopName, setShopName] = React.useState(
    (value.shopName as string) ?? "لونا"
  );
  const [phone, setPhone] = React.useState((value.phone as string) ?? "");
  const [email, setEmail] = React.useState((value.email as string) ?? "");
  const [address, setAddress] = React.useState((value.address as string) ?? "");
  const [postalCode, setPostalCode] = React.useState(
    (value.postalCode as string) ?? ""
  );
  const [nationalId, setNationalId] = React.useState(
    (value.nationalId as string) ?? ""
  );
  const [enamadCode, setEnamadCode] = React.useState(
    (value.enamadCode as string) ?? ""
  );
  const [hours, setHours] = React.useState((value.hours as string) ?? "");
  const [social, setSocial] = React.useState<Record<string, string>>(
    (value.social as Record<string, string>) ?? {
      instagram: "",
      telegram: "",
      whatsapp: "",
    },
  );
  React.useEffect(() => {
    setShopName((value.shopName as string) ?? "لونا");
    setPhone((value.phone as string) ?? "");
    setEmail((value.email as string) ?? "");
    setAddress((value.address as string) ?? "");
    setPostalCode((value.postalCode as string) ?? "");
    setNationalId((value.nationalId as string) ?? "");
    setEnamadCode((value.enamadCode as string) ?? "");
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
        <Field label="نام فروشگاه" icon={ShoppingBag}>
          <input
            dir="rtl"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="لونا — بوتیک لباس زیر زنانه"
            className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </Field>
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="کد پستی" icon={MapPin}>
          <input
            dir="ltr"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="۱۹۸۳۹۴۸۸۱۲"
            className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </Field>
        <Field label="شناسه ملی" icon={BadgeCheck}>
          <input
            dir="ltr"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            placeholder="۱۰۱۰۱۲۳۴۵۶"
            className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </Field>
        <Field label="کد نماد اعتماد (اینماد)" icon={ShieldCheck}>
          <input
            dir="ltr"
            value={enamadCode}
            onChange={(e) => setEnamadCode(e.target.value)}
            placeholder="eNamad code"
            className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </Field>
      </div>
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
        onSave={() =>
          onSave({ shopName, phone, email, address, postalCode, nationalId, enamadCode, hours, social })
        }
      />
    </Section>
  );
}

function ShippingPanel() {
  const methods = useQuery(api.shipping.listAll) ?? [];
  const upsert = useMutation(api.shipping.upsert);
  const toast = useToast();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<
    { code: string; name: string; price: string; days: string; active: boolean }[]
  >([]);

  const persist = React.useCallback(
    async (key: string, payload: {
      code: string;
      name: string;
      priceCents: number;
      estimatedDays: number;
      active: boolean;
      order: number;
    }) => {
      setBusyId(key);
      try {
        await upsert(payload);
        toast.success("روش ارسال ذخیره شد");
      } catch (err) {
        toast.error(`خطا: ${(err as Error)?.message ?? "نامشخص"}`);
      } finally {
        setBusyId(null);
      }
    },
    [upsert, toast],
  );

  return (
    <Section
      title="روش‌های ارسال"
      description="هزینه، زمان تحویل و وضعیت هر روش ارسال. مشتری در چک‌اوت از بین روش‌های فعال انتخاب می‌کند."
      icon={Truck}
    >
      {methods.length === 0 && drafts.length === 0 ? (
        <p className="text-sm text-ink-soft">هنوز روش ارسالی تعریف نشده است.</p>
      ) : null}

      {methods.map((m, i) => (
        <ShippingMethodRow
          key={String(m._id)}
          method={m}
          busy={busyId === String(m._id)}
          onSave={(p) => persist(String(m._id), { ...p, order: i + 1 })}
        />
      ))}

      {drafts.map((d, i) => (
        <div
          key={d.code}
          className="grid gap-3 rounded-2xl border border-dashed border-primary/40 bg-canvas/40 p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Field label="کد روش">
            <input
              dir="ltr"
              value={d.code}
              onChange={(e) => setDrafts((prev) => prev.map((r, j) => (j === i ? { ...r, code: e.target.value } : r)))}
              className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="نام روش">
            <input
              dir="rtl"
              value={d.name}
              onChange={(e) => setDrafts((prev) => prev.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
              placeholder="پیک شهری"
              className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="هزینه (تومان)">
            <input
              dir="ltr"
              type="number"
              value={d.price}
              onChange={(e) => setDrafts((prev) => prev.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))}
              className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="زمان تحویل (روز)">
            <input
              dir="ltr"
              type="number"
              value={d.days}
              onChange={(e) => setDrafts((prev) => prev.map((r, j) => (j === i ? { ...r, days: e.target.value } : r)))}
              className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </Field>
          <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-4">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
              <input
                type="checkbox"
                checked={d.active}
                onChange={(e) => setDrafts((prev) => prev.map((r, j) => (j === i ? { ...r, active: e.target.checked } : r)))}
                className="h-4 w-4 accent-primary"
              />
              فعال
            </label>
            <button
              type="button"
              disabled={busyId === d.code}
              onClick={() => {
                void persist(
                  d.code,
                  {
                    code: d.code || `method-${Date.now()}`,
                    name: d.name || "روش جدید",
                    priceCents: Number(d.price) || 0,
                    estimatedDays: Number(d.days) || 1,
                    active: d.active,
                    order: methods.length + drafts.length,
                  },
                ).then(() => setDrafts((prev) => prev.filter((r) => r.code !== d.code)));
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-canvas hover:bg-primary disabled:opacity-50"
            >
              {busyId === d.code ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              ذخیره روش
            </button>
            <button
              type="button"
              onClick={() => setDrafts((prev) => prev.filter((r) => r.code !== d.code))}
              className="text-xs text-ink-muted hover:text-ink"
            >
              انصراف
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          setDrafts((prev) => [
            ...prev,
            { code: `method-${Date.now()}`, name: "", price: "", days: "1", active: true },
          ])
        }
        className="inline-flex items-center gap-2 rounded-full border border-edge bg-canvas/60 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-ink hover:border-primary hover:text-primary"
      >
        + افزودن روش ارسال
      </button>
    </Section>
  );
}

function ShippingMethodRow({
  method,
  busy,
  onSave,
}: {
  method: Doc<"shipping_methods">;
  busy: boolean;
  onSave: (p: {
    code: string;
    name: string;
    priceCents: number;
    estimatedDays: number;
    active: boolean;
    order: number;
  }) => void;
}) {
  const [code, setCode] = React.useState(method.code);
  const [name, setName] = React.useState(method.name);
  const [price, setPrice] = React.useState(String(method.priceCents));
  const [days, setDays] = React.useState(String(method.estimatedDays));
  const [active, setActive] = React.useState(method.active);

  React.useEffect(() => {
    setCode(method.code);
    setName(method.name);
    setPrice(String(method.priceCents));
    setDays(String(method.estimatedDays));
    setActive(method.active);
  }, [method]);

  return (
    <div className="grid gap-3 rounded-2xl border border-edge bg-canvas/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="کد روش">
        <input
          dir="ltr"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </Field>
      <Field label="نام روش">
        <input
          dir="rtl"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </Field>
      <Field label="هزینه (تومان)">
        <input
          dir="ltr"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </Field>
      <Field label="زمان تحویل (روز)">
        <input
          dir="ltr"
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </Field>
      <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-4">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          {active ? "فعال" : "غیرفعال"}
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            onSave({
              code,
              name,
              priceCents: Number(price) || 0,
              estimatedDays: Number(days) || 1,
              active,
              order: method.order,
            })
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-canvas hover:bg-primary disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          ذخیره
        </button>
      </div>
    </div>
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

/* ────────────────────────────────────────────────────────────────
 * Images — every storefront/editorial image slot, editable in one
 * place. Upload lands in the Convex media library first, then the
 * returned URL is stored as the homepage slot override. Empty URL
 * resets to the luxury default imagery.
 * ──────────────────────────────────────────────────────────────── */

const IMAGE_GROUPS: { title: string; keys: HomepageImageSlot[] }[] = [
  { title: "برند", keys: ["logo", "favicon", "og_image"] },
  { title: "هرو", keys: ["hero"] },
  {
    title: "دسته‌بندی‌ها",
    keys: [
      "category_1",
      "category_2",
      "category_3",
      "category_4",
      "category_5",
      "category_6",
      "category_7",
      "category_8",
      "category_9",
      "category_10",
    ],
  },
  { title: "لوک‌بوک", keys: ["lookbook_1", "lookbook_2", "lookbook_3"] },
  {
    title: "اینستاگرام",
    keys: [
      "instagram_1",
      "instagram_2",
      "instagram_3",
      "instagram_4",
      "instagram_5",
      "instagram_6",
    ],
  },
  {
    title: "کالکشن‌های منتخب",
    keys: [
      "featured_collection_1",
      "featured_collection_2",
      "featured_collection_3",
    ],
  },
  {
    title: "درباره، کالکشن‌ها و مجله",
    keys: [
      "about_workshop",
      "collections_1",
      "collections_2",
      "collections_3",
      "collections_4",
      "collection_hero",
      "press_hero",
      "press_1",
      "press_2",
      "press_3",
      "press_4",
    ],
  },
];

const slotLabel = (key: HomepageImageSlot): string =>
  HOMEPAGE_IMAGE_SLOTS.find((s) => s.key === key)?.label ?? key;

function ImagesPanel() {
  const raw = useQuery(api.admin_settings.getPublicHomepageImages, {});
  const overrides = (raw ?? {}) as Record<string, string | undefined>;

  return (
    <Section
      title="تصاویر صفحات فروشگاه"
      description="همه تصاویر لندینگ، دسته‌بندی‌ها، لوک‌بوک، اینستاگرام و صفحات دیگر — از همین‌جا قابل تغییر هستند. بارگذاری مستقیم یا وارد کردن آدرس تصویر، همان لحظه در سایت اعمال می‌شود."
      icon={Images}
    >
      {IMAGE_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-3 mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            {group.title}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.keys.map((key) => (
              <ImageSlotCard
                key={key}
                slotKey={key}
                label={slotLabel(key)}
                current={overrides[key] ?? DEFAULT_HOMEPAGE_IMAGES[key]}
                overridden={Boolean(overrides[key])}
              />
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}

function ImageSlotCard({
  slotKey,
  label,
  current,
  overridden,
}: {
  slotKey: HomepageImageSlot;
  label: string;
  current: string;
  overridden: boolean;
}) {
  const [draft, setDraft] = React.useState(current);
  const [busy, setBusy] = React.useState<"url" | "upload" | "reset" | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const generateUploadUrl = useMutation(api.admin_media.generateUploadUrl);
  const attachToLibrary = useMutation(api.admin_media.attachToLibrary);
  const setImage = useMutation(api.admin_settings.setHomepageImage);

  React.useEffect(() => {
    setDraft(current);
  }, [current]);

  const applyDraft = async () => {
    const url = draft.trim();
    if (!url) return;
    setBusy("url");
    setError(null);
    try {
      await setImage({ key: slotKey, url });
      setDraft(url);
    } catch (err) {
      setError((err as Error).message ?? "خطا در ذخیره آدرس");
    } finally {
      setBusy(null);
    }
  };

  const reset = async () => {
    setBusy("reset");
    setError(null);
    try {
      await setImage({ key: slotKey, url: "" });
      setDraft("");
    } catch (err) {
      setError((err as Error).message ?? "خطا در بازگشت به پیش‌فرض");
    } finally {
      setBusy(null);
    }
  };

  const upload = async (file: File) => {
    setBusy("upload");
    setError(null);
    try {
      const uploadUrl = await generateUploadUrl();
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(uploadUrl, { method: "POST", body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { storageId: Id<"_storage"> };
      const attached = await attachToLibrary({
        storageId: data.storageId,
        filename: file.name,
        alt: label,
      });
      if (!attached.url) throw new Error("آدرس تصویر دریافت نشد");
      await setImage({ key: slotKey, url: attached.url });
      setDraft(attached.url);
    } catch (err) {
      setError((err as Error).message ?? "بارگذاری ناموفق بود");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white/80 transition",
        overridden ? "border-primary/40" : "border-edge",
      )}
    >
      <div className="relative aspect-[4/3] bg-canvas-soft">
        <img
          src={current}
          alt={label}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {overridden ? (
          <span className="absolute right-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-canvas">
            سفارشی
          </span>
        ) : null}
        {busy === "upload" ? (
          <div className="absolute inset-0 grid place-items-center bg-ink/40 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-canvas" />
          </div>
        ) : null}
      </div>
      <div className="space-y-2 p-3">
        <p className="text-[12px] font-medium text-ink">{label}</p>
        <div className="flex items-center gap-1.5">
          <input
            dir="ltr"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://… یا خالی برای پیش‌فرض"
            className="h-8 w-full rounded-lg border border-edge bg-canvas/60 px-2 text-[11px] text-ink focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void applyDraft()}
            disabled={busy !== null || !draft.trim()}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink text-canvas transition hover:bg-primary disabled:opacity-50"
            aria-label="ذخیره آدرس"
            title="ذخیره آدرس"
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
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hairline text-ink-soft transition hover:bg-white hover:text-ink disabled:opacity-50"
            aria-label="بارگذاری تصویر"
            title="بارگذاری از دستگاه"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => void reset()}
            disabled={busy !== null || !overridden}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hairline text-ink-soft transition hover:bg-white hover:text-ink disabled:opacity-40"
            aria-label="بازگشت به پیش‌فرض"
            title="بازگشت به پیش‌فرض"
          >
            {busy === "reset" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            hidden
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </div>
        {error ? <p className="text-[11px] text-rose-700">{error}</p> : null}
      </div>
    </div>
  );
}
