/**
 * Phase 5.1 — ProductWizard.
 *
 * Hosts the multi-step product editor in one file. The wizard reads
 * its step from `?step=` so refreshing, deep-linking and the
 * browser back button all behave predictably.
 *
 * Routing surface:
 *   • `/admin/products/new`         → calls `createDraft` and replaces
 *                                    the location with `/admin/products/:id?step=basic`.
 *   • `/admin/products/:id`         → renders the wizard bound to that
 *                                    draft.
 *   • `/admin/products/:id?step=…`  → renders the matching step.
 *
 * Each step forms its own substrate and fires the relevant admin
 * mutation on its "Save & continue" button. Step 9 (`publishing`)
 * is the final gate that calls `publish` after a self-check.
 */
import * as React from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router";
import { useMutation, useQuery } from "convex/react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Loader2,
  Send,
  Sparkles,
  Star,
} from "lucide-react";

import { MediaUploader } from "@/components/admin/MediaUploader";
import { VariantEditor } from "@/components/admin/VariantEditor";
import {
  StatusBadge,
  type StatusKind,
} from "@/components/admin";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatPrice } from "@/lib/format";
import { getAdminErrorMessage, withAdminTimeout } from "@/lib/admin-errors";
import { QueryErrorBoundary } from "@/components/admin/QueryErrorBoundary";
import {
  ACCESSORY_SIZES,
  LINGERIE_SIZES,
  LONA_COLOR_OPTIONS,
} from "@/data/lona-catalog";

const STEPS = [
  { key: "basic", label: "اطلاعات پایه" },
  { key: "media", label: "رسانه" },
  { key: "categories", label: "دسته‌بندی‌ها" },
  { key: "collections", label: "کالکسیون‌ها" },
  { key: "variants", label: "تنوع‌ها" },
  { key: "pricing", label: "قیمت و موجودی" },
  { key: "seo", label: "سئو" },
  { key: "publishing", label: "انتشار نهایی" },
] as const;

/**
 * Phase 7.5: the wizard previously used a made-up category list
 * (outerwear / knitwear / …) that does not exist in `vProductCategory`
 * — every save except "accessories" failed with a Convex validation
 * error. These are the canonical schema literals.
 */
const CATEGORY_OPTIONS: { value: Doc<"products">["category"]; label: string }[] = [
  { value: "bras", label: "سوتین" },
  { value: "briefs", label: "شورت" },
  { value: "sets", label: "ست لباس زیر" },
  { value: "sleepwear", label: "لباس خواب" },
  { value: "loungewear", label: "لانژری" },
  { value: "bodysuits", label: "بادی‌سوت" },
  { value: "shapewear", label: "شکل‌دهنده" },
  { value: "sportswear", label: "ورزشی" },
  { value: "accessories", label: "اکسسوری" },
  { value: "bridal", label: "عروس" },
];

const COLOR_SWATCH_CLASSES: Record<(typeof LONA_COLOR_OPTIONS)[number]["gradient"], string> = {
  deep: "bg-ink",
  mist: "bg-white",
  oat: "bg-[#d8c3a5]",
  rose: "bg-[#dba6ae]",
};

type StepKey = (typeof STEPS)[number]["key"];

/* ===================================================================
 * Wizard entry — same mountable used at /new and /:id
 * =================================================================== */
export default function ProductWizard() {
  return (
    <QueryErrorBoundary
      title="بارگذاری محصول انجام نشد"
      backTo="/admin/products"
      backLabel="بازگشت به محصولات"
    >
      <ProductWizardInner />
    </QueryErrorBoundary>
  );
}

function ProductWizardInner() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();

  // /admin/products/new → createDraft → replace with create-flow.
  const createDraft = useMutation(api.admin_products.createDraft);
  const [creating, setCreating] = React.useState(false);
  const createStarted = React.useRef(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  // `/admin/products/new` is a sibling route, not the `:id` route, so
  // React Router does not populate `params.id` on the create screen.
  const isNewRoute =
    params.id === "new" || location.pathname === "/admin/products/new";
  React.useEffect(() => {
    if (!isNewRoute || creating || createStarted.current) return;
    createStarted.current = true;
    setCreating(true);
    void (async () => {
      try {
        const tempSlug = `draft-${crypto.randomUUID().slice(0, 8)}`;
        const id = await withAdminTimeout(createDraft({
          name: "تکهٔ بدون نام",
          slug: tempSlug,
          category: "accessories",
          collectionSlug: "",
        }));
        navigate(`/admin/products/${id}?step=basic`, { replace: true });
      } catch (err) {
        setCreateError(getAdminErrorMessage(err));
        setCreating(false);
      }
    })();
  }, [isNewRoute, creating, createDraft, navigate, location.pathname]);

  const rawId = params.id;
  const isNew = rawId === "new";
  const id = !isNew && rawId ? (rawId as Id<"products">) : undefined;
  const product = useQuery(api.admin_products.getById, id ? { id } : "skip");
  const [variantAxes, setVariantAxes] = React.useState<{
    colors: Doc<"products">["colors"];
    sizes: Doc<"products">["sizes"];
  }>({ colors: [], sizes: [] });
  const initializedProduct = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!product || initializedProduct.current === product._id) return;
    initializedProduct.current = product._id;
    setVariantAxes({ colors: product.colors, sizes: product.sizes });
  }, [product]);

  if (createError) {
    return (
      <div className="rounded-3xl border border-edge bg-white/85 p-10 text-center">
        <p className="font-display text-2xl text-ink">ایجاد محصول ناموفق بود</p>
        <p className="mt-2 text-sm text-ink-soft">{createError}</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              createStarted.current = false;
              setCreating(false);
            }}
            className="rounded-full bg-ink px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-canvas hover:bg-primary"
          >
            تلاش دوباره
          </button>
          <Link
            to="/admin/products"
            className="rounded-full hairline bg-white/70 px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-white"
          >
            بازگشت به محصولات
          </Link>
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="rounded-3xl border border-edge bg-white/85 p-10 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-ink-soft" />
        <p className="mt-4 text-sm text-ink-soft">در حال ایجاد پیش‌نویس محصول…</p>
        <p className="mt-2 text-xs text-ink-muted">در صورت طولانی‌شدن، صفحه را تازه‌سازی نکنید؛ از گزینهٔ تلاش دوباره استفاده کنید.</p>
      </div>
    );
  }
  if (product === undefined) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-ink-soft" />
      </div>
    );
  }
  if (product === null) {
    return (
      <div className="rounded-3xl border border-edge bg-white/85 p-10 text-center">
        <p className="font-display text-2xl text-ink">محصول یافت نشد.</p>
        <Link
          to="/admin/products"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          بازگشت به محصولات
        </Link>
      </div>
    );
  }

  const step: StepKey =
    (search.get("step") as StepKey | null) ?? "basic";
  const idx = STEPS.findIndex((s) => s.key === step);
  const goTo = (target: StepKey) => {
    const next = new URLSearchParams(search);
    next.set("step", target);
    setSearch(next);
  };

  return (
    <div className="space-y-8">
      <WizardHeader product={product} step={step} onStepClick={goTo} />
      {renderStep(
        step,
        product,
        () => goTo(nextStep(idx)),
        variantAxes,
        (colors, sizes) => setVariantAxes({ colors, sizes }),
      )}
      <WizardFooter
        step={step}
        index={idx}
        onPrev={() => goTo(prevStep(idx))}
        onNext={() => goTo(nextStep(idx))}
        product={product}
      />
    </div>
  );
}

function nextStep(idx: number): StepKey {
  return STEPS[Math.min(idx + 1, STEPS.length - 1)].key;
}

function prevStep(idx: number): StepKey {
  return STEPS[Math.max(idx - 1, 0)].key;
}

function renderStep(
  step: StepKey,
  product: Doc<"products">,
  onAdvance: () => void,
  variantAxes: {
    colors: Doc<"products">["colors"];
    sizes: Doc<"products">["sizes"];
  },
  onVariantAxesChange: (
    colors: Doc<"products">["colors"],
    sizes: Doc<"products">["sizes"],
  ) => void,
) {
  switch (step) {
    case "basic":
      return (
        <BasicInfoStep
          product={product}
          onAdvance={onAdvance}
          onAxesChange={onVariantAxesChange}
        />
      );
    case "media":
      return <MediaStep product={product} />;
    case "categories":
      return <CategoriesStep product={product} onAdvance={onAdvance} />;
    case "collections":
      return <CollectionsStep product={product} onAdvance={onAdvance} />;
    case "variants":
      return (
        <VariantsStep
          product={product}
          colorIds={variantAxes.colors.map((color) => color.id)}
          sizeOptions={variantAxes.sizes.map((size) => ({ id: size.id, label: size.label }))}
        />
      );
    case "pricing":
      return <PricingInventoryStep product={product} onAdvance={onAdvance} />;
    case "seo":
      return <SeoStep product={product} onAdvance={onAdvance} />;
    case "publishing":
      return <PublishingStep product={product} />;
    default:
      return (
        <BasicInfoStep
          product={product}
          onAdvance={onAdvance}
          onAxesChange={onVariantAxesChange}
        />
      );
  }
}

/* ===================================================================
 * Wizard chrome
 * =================================================================== */
function WizardHeader({
  product,
  step,
  onStepClick,
}: {
  product: Doc<"products">;
  step: StepKey;
  onStepClick: (key: StepKey) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
        <Link to="/admin/products" className="hover:text-ink">
          ← محصولات
        </Link>
        <span className="text-edge">/</span>
        <span className="text-ink">{product.name}</span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <h1 className="font-display text-3xl text-ink lg:text-4xl">
          {product.name || "بدون عنوان"}
        </h1>
        <StatusBadge status={product.status as StatusKind} />
        <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          آخرین تغییر: {" "}
          {new Date(product._creationTime).toLocaleDateString()}
        </span>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => {
          const active = s.key === step;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onStepClick(s.key)}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-full px-3 text-[11px] font-medium uppercase tracking-[0.16em] transition",
                active
                  ? "bg-ink text-canvas"
                  : "hairline bg-white/70 text-ink-soft hover:bg-white",
              )}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-canvas/30 text-[10px]">
                {i + 1}
              </span>
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WizardFooter({
  step,
  index,
  product,
  onPrev,
  onNext,
}: {
  step: StepKey;
  index: number;
  product: Doc<"products">;
  onPrev: () => void;
  onNext: () => void;
}) {
  const isLast = index === STEPS.length - 1;
  return (
    <div className="flex items-center justify-between border-t border-edge pt-6">
      <button
        type="button"
        onClick={onPrev}
        disabled={index === 0}
        className="inline-flex items-center gap-2 rounded-full hairline bg-white/70 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink hover:bg-white disabled:opacity-30"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> بازگشت
      </button>
      <div className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
        مرحلهٔ {index + 1} از {STEPS.length} · {step}
      </div>
      {!isLast ? (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          ادامه <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Link
          to={`/shop/${product.slug}`}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          <Eye className="h-3.5 w-3.5" /> مشاهده در فروشگاه
        </Link>
      )}
    </div>
  );
}

/* ===================================================================
 * Step: Basic Information
 * =================================================================== */
function BasicInfoStep({
  product,
  onAdvance,
  onAxesChange,
}: {
  product: Doc<"products">;
  onAdvance: () => void;
  onAxesChange: (
    colors: Doc<"products">["colors"],
    sizes: Doc<"products">["sizes"],
  ) => void;
}) {
  const updateBasics = useMutation(api.admin_products.updateBasics);
  const [form, setForm] = React.useState({
    name: product.name,
    slug: product.slug,
    category: product.category,
    collectionSlug: product.collectionSlug,
    description: product.description,
    composition: product.composition,
    origin: product.origin,
    brand: product.brand ?? "لونا",
    barcode: product.barcode ?? "",
    material: product.material ?? "",
    care: product.care ?? "",
    colors: product.colors,
    sizes: product.sizes,
  });
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState<"idle" | "ok" | "err">("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setBusy(true);
    setSaved("idle");
    setSaveError(null);
    try {
      if (form.colors.length === 0 || form.sizes.length === 0) {
        throw new Error("تنوع محصول: حداقل یک رنگ و یک سایز انتخاب کنید.");
      }
      await withAdminTimeout(updateBasics({
        id: product._id,
        name: form.name,
        slug: form.slug,
        category: form.category,
        collectionSlug: form.collectionSlug,
        description: form.description,
        composition: form.composition,
        origin: form.origin,
        brand: form.brand,
        barcode: form.barcode,
        material: form.material,
        care: form.care,
        colors: form.colors,
        sizes: form.sizes,
      }));
      setSaved("ok");
      onAdvance();
    } catch (error) {
      setSaved("err");
      setSaveError(getAdminErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-edge bg-white/85 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">مرحلهٔ ۱ از ۸</p>
          <h3 className="mt-2 font-display text-2xl text-ink">اطلاعات پایه</h3>
        </div>
        <div className="flex items-center gap-2">
          <SaveIndicator state={saved} />
          {saveError ? <span className="text-[11px] text-rose-700">{saveError}</span> : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="عنوان محصول">
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="admin-input"
          />
        </Field>
        <Field label="شناسه انگلیسی">
          <input
            value={form.slug}
            onChange={(e) =>
              set(
                "slug",
                e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
              )
            }
            className="admin-input"
          />
        </Field>
        <Field label="دسته‌بندی">
          <select
            value={form.category}
            onChange={(e) => {
              const nextCategory = e.target.value as typeof form.category;
              set("category", nextCategory);
              if (nextCategory === "accessories") {
                const nextSizes = ACCESSORY_SIZES.map((size) => ({ ...size }));
                set("sizes", nextSizes);
                onAxesChange(form.colors, nextSizes);
              } else if (form.category === "accessories") {
                set("sizes", []);
                onAxesChange(form.colors, []);
              }
            }}
            className="admin-input"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="کالکسیون (اسلاگ)">
          <input
            value={form.collectionSlug}
            onChange={(e) => set("collectionSlug", e.target.value.toLowerCase())}
            className="admin-input"
            placeholder="پاییز-زمستان، ضروریات، شب، اکسسوری…"
          />
        </Field>

        <div className="lg:col-span-2 rounded-2xl border border-edge bg-canvas-soft/70 p-5">
          <div className="flex flex-col gap-1">
            <span className="type-eyebrow text-ink-muted">تنوع محصول</span>
            <h4 className="font-display text-xl text-ink">رنگ‌ها و سایزهای قابل فروش</h4>
            <p className="text-xs leading-6 text-ink-soft">
              رنگ و سایزهای این بخش منبع اصلی ساخت جدول تنوع‌ها هستند. در مرحلهٔ بعد، ترکیب‌های لازم به‌صورت خودکار ساخته می‌شوند.
            </p>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">رنگ‌ها</p>
                  <p className="mt-1 text-[11px] text-ink-muted">حداقل یک رنگ انتخاب کنید.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] text-ink-muted">
                  {form.colors.length.toLocaleString("fa-IR")} انتخاب
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LONA_COLOR_OPTIONS.map((color) => {
                  const selected = form.colors.some((item) => item.id === color.id);
                  return (
                    <button
                      key={color.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        const nextColors = selected
                          ? form.colors.filter((item) => item.id !== color.id)
                          : [...form.colors, { ...color }];
                        set("colors", nextColors);
                        onAxesChange(nextColors, form.sizes);
                      }}
                      className={cn(
                        "flex min-h-16 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-2 text-[11px] transition focus:outline-none focus:ring-2 focus:ring-primary",
                        selected
                          ? "border-primary bg-white ring-2 ring-primary/30"
                          : "border-edge bg-white/50 hover:bg-white",
                      )}
                    >
                      <span
                        className={cn(
                          "h-7 w-7 rounded-full border border-ink/15 shadow-sm",
                          COLOR_SWATCH_CLASSES[color.gradient],
                          selected && "ring-2 ring-primary ring-offset-2",
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-ink">{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">سایزها</p>
                  <p className="mt-1 text-[11px] text-ink-muted">سایزهای موجود برای این محصول را انتخاب کنید.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] text-ink-muted">
                  {form.sizes.length.toLocaleString("fa-IR")} انتخاب
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(form.category === "accessories" ? ACCESSORY_SIZES : LINGERIE_SIZES).map((size) => {
                  const selected = form.sizes.some((item) => item.id === size.id);
                  return (
                    <button
                      key={size.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        const nextSizes = selected
                          ? form.sizes.filter((item) => item.id !== size.id)
                          : [...form.sizes, { ...size }];
                        set("sizes", nextSizes);
                        onAxesChange(form.colors, nextSizes);
                      }}
                      className={cn(
                        "min-w-16 rounded-full border px-4 py-2.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-primary",
                        selected
                          ? "border-ink bg-ink text-canvas"
                          : "border-edge bg-white/70 text-ink-soft hover:bg-white",
                      )}
                    >
                      {size.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {(form.colors.length === 0 || form.sizes.length === 0) && (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              برای فعال‌شدن مرحلهٔ تنوع‌ها، حداقل یک رنگ و یک سایز انتخاب کنید.
            </p>
          )}
        </div>

        <Field label="توضیحات" full>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className="admin-input"
          />
        </Field>
        <Field label="ترکیب پارچه">
          <input
            value={form.composition}
            onChange={(e) => set("composition", e.target.value)}
            className="admin-input"
            placeholder="۱۰۰٪ مرینو ایتالیایی…"
          />
        </Field>
        <Field label="مبدأ تولید" full>
          <input
            value={form.origin}
            onChange={(e) => set("origin", e.target.value)}
            className="admin-input"
            placeholder="برش و دوخت در فلورانس."
          />
        </Field>
        <Field label="برند" hint="برای فیدهای ترب و دیجی‌کالا">
          <input
            value={form.brand}
            onChange={(e) => set("brand", e.target.value)}
            className="admin-input"
            placeholder="لونا"
          />
        </Field>
        <Field label="بارکد (EAN/GTIN)" hint="اختیاری — در فیدهای بازار استفاده می‌شود">
          <input
            dir="ltr"
            value={form.barcode}
            onChange={(e) => set("barcode", e.target.value)}
            className="admin-input"
            placeholder="6260111000000"
          />
        </Field>
        <Field label="جنس پارچه">
          <input
            value={form.material}
            onChange={(e) => set("material", e.target.value)}
            className="admin-input"
            placeholder="پنبه ارگانیک، توری گیپور…"
          />
        </Field>
        <Field label="نحوه نگهداری" full>
          <input
            value={form.care}
            onChange={(e) => set("care", e.target.value)}
            className="admin-input"
            placeholder="شستشو با دست، آب سرد…"
          />
        </Field>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          ذخیره و ادامه
        </button>
      </div>
    </div>
  );
}

/* ===================================================================
 * Step: Media
 * =================================================================== */
function MediaStep({ product }: { product: Doc<"products"> }) {
  return (
    <div className="space-y-3 rounded-3xl border border-edge bg-white/85 p-6">
      <p className="type-eyebrow text-ink-muted">مرحلهٔ ۲ از ۸</p>
      <h3 className="font-display text-2xl text-ink">کتابخانهٔ رسانه</h3>
      <p className="text-sm text-ink-soft">
        تصویر محصول را بارگذاری کنید. اولین تصویر به‌عنوان تصویر اصلی محصول نمایش داده می‌شود.
      </p>
      <div className="pt-3">
        <MediaUploader productId={product._id} />
      </div>
    </div>
  );
}

/* ===================================================================
 * Step: Categories
 * =================================================================== */
function CategoriesStep({
  product,
  onAdvance,
}: {
  product: Doc<"products">;
  onAdvance: () => void;
}) {
  const updateBasics = useMutation(api.admin_products.updateBasics);
  const [category, setCategory] = React.useState(product.category);
  const [busy, setBusy] = React.useState(false);
  const [categoryError, setCategoryError] = React.useState<string | null>(null);
  return (
    <div className="rounded-3xl border border-edge bg-white/85 p-6">
      <p className="type-eyebrow text-ink-muted">مرحلهٔ ۳ از ۸</p>
      <h3 className="mt-2 font-display text-2xl text-ink">دسته‌بندی‌ها</h3>
      <p className="mt-2 text-sm text-ink-soft">
        هر محصول در یک دستهٔ اصلی ایندکس می‌شود؛ کالکسیون‌ها برای گروه‌بندی
        داستانی روی آن لایه می‌شوند.
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORY_OPTIONS.map((c) => (
          <label
            key={c.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-2xl border border-edge bg-canvas-soft px-3 py-2.5 text-sm transition",
              category === c.value && "ring-2 ring-primary bg-white",
            )}
          >
            <input
              type="radio"
              name="category"
              className="h-4 w-4 accent-primary"
              checked={category === c.value}
              onChange={() => setCategory(c.value)}
            />
            <span>{c.label}</span>
          </label>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setCategoryError(null);
            try {
              await withAdminTimeout(updateBasics({ id: product._id, category }));
              onAdvance();
            } catch (error) {
              setCategoryError(getAdminErrorMessage(error));
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary disabled:opacity-40"
        >
          <Check className="h-3.5 w-3.5" /> ذخیره و ادامه
        </button>
      </div>
    </div>
  );
}

/* ===================================================================
 * Step: Collections
 * =================================================================== */
function CollectionsStep({
  product,
  onAdvance,
}: {
  product: Doc<"products">;
  onAdvance: () => void;
}) {
  const updateBasics = useMutation(api.admin_products.updateBasics);
  // Phase 7.5: read live collections instead of a hardcoded demo list
  // that drifted from the seeded data.
  const liveCollections = useQuery(api.collections.listAll, {});
  const collections = (liveCollections ?? []).sort((a, b) => a.order - b.order);
  const [picked, setPicked] = React.useState<string[]>(
    product.collectionSlug ? [product.collectionSlug] : [],
  );
  const [collectionError, setCollectionError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="rounded-3xl border border-edge bg-white/85 p-6">
      <p className="type-eyebrow text-ink-muted">مرحلهٔ ۴ از ۸</p>
      <h3 className="mt-2 font-display text-2xl text-ink">کالکسیون‌ها</h3>
      <p className="mt-2 text-sm text-ink-soft">
        محصول را به کالکسیون اصلی وصل کنید تا در صفحهٔ کالکسیون و ماژول‌های
        فروشگاهی ظاهر شود.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {collections.length === 0 ? (
          <p className="text-sm text-ink-muted">کالکسیونی یافت نشد.</p>
        ) : (
          collections.map((c) => {
            const on = picked.includes(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() =>
                  setPicked(
                    on ? [] : [c.slug],
                  )
                }
                className={cn(
                  "rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition",
                  on
                    ? "bg-ink text-canvas"
                    : "hairline bg-canvas/60 text-ink-soft hover:bg-white",
                )}
              >
                {c.name} ({c.slug})
              </button>
            );
          })
        )}
      </div>
      {collectionError ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
          {collectionError}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setCollectionError(null);
            try {
              if (picked.length) {
                await withAdminTimeout(updateBasics({
                  id: product._id,
                  collectionSlug: picked[0],
                }));
              }
              onAdvance();
            } catch (error) {
              setCollectionError(getAdminErrorMessage(error));
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          <Check className="h-3.5 w-3.5" /> ذخیره و ادامه
        </button>
      </div>
    </div>
  );
}

/* ===================================================================
 * Step: Variants
 * =================================================================== */
function VariantsStep({
  product,
  colorIds,
  sizeOptions,
}: {
  product: Doc<"products">;
  colorIds: string[];
  sizeOptions: Array<{ id: string; label: string }>;
}) {
  return (
    <div>
      <p className="type-eyebrow text-ink-muted">مرحلهٔ ۵ از ۸</p>
      <h3 className="mt-2 font-display text-2xl text-ink">تنوع‌ها</h3>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        ترکیب‌های سایز و رنگ را مدیریت کنید. موجودی هر تنوع در همین بخش ثبت می‌شود.
      </p>
      <div className="mt-4">
        <VariantEditor
          productId={product._id}
          colorIds={colorIds}
          sizeOptions={sizeOptions}
        />
      </div>
    </div>
  );
}

/* ===================================================================
 * Step: Pricing & Inventory
 * =================================================================== */
function PricingInventoryStep({
  product,
  onAdvance,
}: {
  product: Doc<"products">;
  onAdvance: () => void;
}) {
  const updatePricing = useMutation(api.admin_products.updatePricing);
  const [price, setPrice] = React.useState(product.priceCents);
  const [compare, setCompare] = React.useState(
    product.compareAtCents !== undefined ? product.compareAtCents : 0,
  );
  const [busy, setBusy] = React.useState(false);
  const [pricingError, setPricingError] = React.useState<string | null>(null);
  return (
    <div className="rounded-3xl border border-edge bg-white/85 p-6">
      <p className="type-eyebrow text-ink-muted">مرحلهٔ ۶ از ۸</p>
      <h3 className="mt-2 font-display text-2xl text-ink">قیمت‌گذاری و موجودی</h3>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Field label="قیمت فروش (تومان)">
          <input
            type="number"
            step="1000"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
            className="admin-input"
          />
        </Field>
        <Field label="قیمت اصلی (تومان)" hint="بزرگ‌تر از قیمت فروش">
          <input
            type="number"
            step="1000"
            min={0}
            value={compare || ""}
            onChange={(e) => setCompare(Number(e.target.value) || 0)}
            className="admin-input"
          />
        </Field>
      </div>
      {pricingError && (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
          {pricingError}
        </p>
      )}
      <div className="mt-6 rounded-2xl bg-canvas-soft p-4 text-sm text-ink-soft">
        <p>
          <strong className="text-ink">موجودی:</strong> در مرحلهٔ تنوع‌ها مدیریت می‌شود. برای ثبت موجودی هر سایز و رنگ از جدول تنوع‌ها استفاده کنید.
        </p>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setPricingError(null);
            try {
              // Toman is stored directly in `priceCents` (Phase 5.5
              // convention); there is no cent sub-unit in toman.
              const sale = Math.max(0, Math.round(price));
              const original = compare > 0 ? Math.round(compare) : undefined;
              if (original !== undefined && original <= sale) {
                setPricingError(
                  "قیمت اصلی باید از قیمت فروش بزرگ‌تر باشد.",
                );
                return;
              }
              await withAdminTimeout(updatePricing({
                id: product._id,
                priceCents: sale,
                compareAtCents: original,
              }));
              onAdvance();
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary disabled:opacity-40"
        >
          <Check className="h-3.5 w-3.5" /> ذخیره و ادامه
        </button>
      </div>
    </div>
  );
}

/* ===================================================================
 * Step: SEO
 * =================================================================== */
function SeoStep({
  product,
  onAdvance,
}: {
  product: Doc<"products">;
  onAdvance: () => void;
}) {
  const updateSeo = useMutation(api.admin_products.updateSeo);
  const [seoTitle, setSeoTitle] = React.useState(product.seoTitle ?? product.name);
  const [seoDescription, setSeoDescription] = React.useState(
    product.seoDescription ?? "",
  );
  const [seoError, setSeoError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="rounded-3xl border border-edge bg-white/85 p-6">
      <p className="type-eyebrow text-ink-muted">مرحلهٔ ۷ از ۸</p>
      <h3 className="mt-2 font-display text-2xl text-ink">سئو</h3>
      <p className="mt-2 text-sm text-ink-soft">
        متادیتای جست‌وجو و شبکه‌های اجتماعی. این فیلدها مستقل از توضیحات
        بلند محصول ذخیره می‌شوند و آن را بازنویسی نمی‌کنند.
      </p>
      <div className="mt-5 grid gap-5">
        <Field label="عنوان سئو">
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="admin-input"
          />
        </Field>
        <Field label="توضیحات سئو">
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={4}
            className="admin-input"
          />
        </Field>
      </div>
      {seoError ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
          {seoError}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setSeoError(null);
            try {
              await withAdminTimeout(updateSeo({
                id: product._id,
                seoTitle,
                seoDescription,
              }));
              onAdvance();
            } catch (error) {
              setSeoError(getAdminErrorMessage(error));
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} ذخیره و ادامه
        </button>
      </div>
    </div>
  );
}

/* ===================================================================
 * Step: Publishing
 * =================================================================== */
function PublishingStep({ product }: { product: Doc<"products"> }) {
  const updateFlags = useMutation(api.admin_products.updateFlags);
  const publishMut = useMutation(api.admin_products.publish);
  const archive = useMutation(api.admin_products.archive);
  const restore = useMutation(api.admin_products.restore);
  const navigate = useNavigate();

  const [featured, setFeatured] = React.useState(product.featured);
  const [trending, setTrending] = React.useState(product.trending);
  const [editorial, setEditorial] = React.useState(product.editorial);
  const [busy, setBusy] = React.useState(false);
  const [published, setPublished] = React.useState<{
    ok: boolean;
    missing?: string[];
    message?: string;
  } | null>(null);

  const handlePublish = async () => {
    setBusy(true);
    setPublished(null);
    try {
      await withAdminTimeout(updateFlags({
        id: product._id,
        featured,
        trending,
        editorial,
      }));
      await withAdminTimeout(publishMut({ id: product._id }));

      setPublished({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith("INCOMPLETE:")) {
        setPublished({
          ok: false,
          missing: message.slice("INCOMPLETE:".length).split(","),
        });
      } else {
        setPublished({ ok: false, message: getAdminErrorMessage(err) });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-edge bg-white/85 p-6">
        <p className="type-eyebrow text-ink-muted">مرحلهٔ ۸ از ۸</p>
        <h3 className="mt-2 font-display text-2xl text-ink">انتشار نهایی</h3>
        <p className="mt-2 text-sm text-ink-soft">
این محصول را برای بخش‌های ویژه، پرطرفدار و ادیتوریال انتخاب کنید و سپس آن را در فروشگاه منتشر کنید.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(
            [
              { key: "featured", label: "ویژه", state: featured, set: setFeatured, icon: Star },
              { key: "trending", label: "پرطرفدار", state: trending, set: setTrending, icon: Sparkles },
              { key: "editorial", label: "انتخاب ادیتوریال", state: editorial, set: setEditorial, icon: Eye },
            ] as const
          ).map(({ key, label, state, set, icon: Icon }) => (
            <label
              key={key}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-edge bg-canvas-soft px-4 py-3 transition",
                state && "ring-2 ring-primary bg-white",
              )}
            >
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full hairline bg-white text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-ink">{label}</span>
              </span>
              <button
                type="button"
                onClick={() => set(!state)}
                className={cn(
                  "relative grid h-6 w-11 place-items-start rounded-full p-1 transition",
                  state ? "bg-primary" : "bg-edge",
                )}
                aria-label={`Toggle ${label}`}
              >
                <span
                  className={cn(
                    "h-4 w-4 rounded-full bg-canvas transition-transform duration-300",
                    state && "translate-x-5",
                  )}
                />
              </button>
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={handlePublish}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground hover:bg-ink hover:text-canvas disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            انتشار در فروشگاه
          </button>
          {product.status === "published" ? (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                  setBusy(true);
                  try {
                    await withAdminTimeout(archive({ id: product._id }));
                  } catch (error) {
                    setPublished({ ok: false, missing: [getAdminErrorMessage(error)] });
                  } finally {
                    setBusy(false);
                  }
                }}

              className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/70 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-white"
            >
              بایگانی
            </button>
          ) : product.status === "archived" ? (
            <button
              type="button"
              disabled={busy}                onClick={async () => {
                  setBusy(true);
                  try {
                    await withAdminTimeout(restore({ id: product._id }));
                    navigate("/admin/products");
                  } catch (error) {
                    setPublished({ ok: false, missing: [getAdminErrorMessage(error)] });
                  } finally {
                    setBusy(false);
                  }
                }}

              className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/70 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-white"
            >
              بازگردانی به پیش‌نویس
            </button>
          ) : null}
        </div>

        {published?.ok ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_LUXURY }}
            className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700"
          >
            محصول با موفقیت در فروشگاه منتشر شد.
          </motion.p>
        ) : null}
        {published && !published.ok ? (
          published.message ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_LUXURY }}
              className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-800"
            >
              {published.message}
            </motion.p>
          ) : (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_LUXURY }}
              className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-800"
            >
              فیلدهای لازم برای انتشار تکمیل نشده‌اند: {" "}
              <strong>
                {(published.missing ?? ["unknown"]).join(", ")}
              </strong>
              . به مراحل قبل برگردید، موارد را تکمیل کنید و دوباره انتشار دهید.
            </motion.p>
          )
        ) : null}

        <p className="mt-5 rounded-xl bg-canvas-soft px-3 py-2 text-[12px] text-ink-soft">
          پیش‌نمایش قیمت: {" "}
          <strong className="text-ink type-caption">
            {formatPrice(product.priceCents)}
          </strong>
        </p>
      </div>
    </div>
  );
}

/* ===================================================================
 * Tiny shared primitives
 * =================================================================== */
function Field({
  label,
  hint,
  full,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", full && "lg:col-span-2")}>
      <span className="type-eyebrow text-ink-muted">{label}</span>
      {hint ? (
        <span className="ml-2 text-[10px] uppercase tracking-[0.16em] text-ink-muted">
          {hint}
        </span>
      ) : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function SaveIndicator({ state }: { state: "idle" | "ok" | "err" }) {
  if (state === "idle") return null;
  const text = state === "ok" ? "ذخیره شد" : "ذخیره انجام نشد";
  const cls =
    state === "ok"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-rose-50 text-rose-700";
  return (
    <span className={cn("rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em]", cls)}>
      {text}
    </span>
  );
}
