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

type StepKey = (typeof STEPS)[number]["key"];

/* ===================================================================
 * Wizard entry — same mountable used at /new and /:id
 * =================================================================== */
export default function ProductWizard() {
  const params = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();

  // /admin/products/new → createDraft → replace with create-flow.
  const createDraft = useMutation(api.admin_products.createDraft);
  const [creating, setCreating] = React.useState(false);
  React.useEffect(() => {
    if (params.id !== "new") return;
    if (creating) return;
    setCreating(true);
    void (async () => {
      const tempSlug = `draft-${Math.random().toString(36).slice(2, 10)}`;
      const id = await createDraft({
        name: "تکهٔ بدون نام",
        slug: tempSlug,
        category: "accessories",
        collectionSlug: "essentials",
      });
      navigate(`/admin/products/${id}?step=basic`, { replace: true });
    })();
  }, [params.id, creating, createDraft, navigate]);

  const id = params.id as Id<"products"> | undefined;
  const product = useQuery(api.admin_products.getById, id ? { id } : "skip");

  if (!id || params.id === "new") {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-ink-soft" />
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
          Back to catalogue
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
      {renderStep(step, product, () => goTo(nextStep(idx)))}
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
) {
  switch (step) {
    case "basic":
      return <BasicInfoStep product={product} onAdvance={onAdvance} />;
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
          colorIds={product.colors.map((c) => c.id)}
          sizeLabels={product.sizes.map((s) => s.label)}
        />
      );
    case "pricing":
      return <PricingInventoryStep product={product} onAdvance={onAdvance} />;
    case "seo":
      return <SeoStep product={product} onAdvance={onAdvance} />;
    case "publishing":
      return <PublishingStep product={product} />;
    default:
      return <BasicInfoStep product={product} onAdvance={onAdvance} />;
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
          ← Catalogue
        </Link>
        <span className="text-edge">/</span>
        <span className="text-ink">{product.name}</span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <h1 className="font-display text-3xl text-ink lg:text-4xl">
          {product.name || "Untitled piece"}
        </h1>
        <StatusBadge status={product.status as StatusKind} />
        <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          updated{" "}
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
        Step {index + 1} of {STEPS.length} · {step}
      </div>
      {!isLast ? (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          Continue <ArrowRight className="h-3.5 w-3.5" />
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
}: {
  product: Doc<"products">;
  onAdvance: () => void;
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
  });
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState<"idle" | "ok" | "err">("idle");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setBusy(true);
    setSaved("idle");
    try {
      await updateBasics({
        id: product._id,
        name: form.name,
        slug: form.slug,
        category: form.category,
        collectionSlug: form.collectionSlug,
        description: form.description,
        composition: form.composition,
        origin: form.origin,
      });
      setSaved("ok");
      onAdvance();
    } catch {
      setSaved("err");
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
        <SaveIndicator state={saved} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="Title">
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="admin-input"
          />
        </Field>
        <Field label="Slug">
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
        <Field label="Category">
          <select
            value={form.category}
            onChange={(e) =>
              set("category", e.target.value as typeof form.category)
            }
            className="admin-input"
          >
            {[
              "outerwear",
              "knitwear",
              "shirting",
              "trousers",
              "dresses",
              "leather",
              "accessories",
            ].map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Collection">
          <input
            value={form.collectionSlug}
            onChange={(e) => set("collectionSlug", e.target.value.toLowerCase())}
            className="admin-input"
            placeholder="پاییز-زمستان، ضروریات، شب، اکسسوری…"
          />
        </Field>
        <Field label="Description" full>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className="admin-input"
          />
        </Field>
        <Field label="Composition">
          <input
            value={form.composition}
            onChange={(e) => set("composition", e.target.value)}
            className="admin-input"
            placeholder="۱۰۰٪ مرینو ایتالیایی…"
          />
        </Field>
        <Field label="Origin" full>
          <input
            value={form.origin}
            onChange={(e) => set("origin", e.target.value)}
            className="admin-input"
            placeholder="برش و دوخت در فلورانس."
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
          Save & continue
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
        Drop or browse pieces of editorial photography. The first image
        becomes the primary card on the storefront.
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
  const categories = [
    "outerwear",
    "knitwear",
    "shirting",
    "trousers",
    "dresses",
    "leather",
    "accessories",
  ];
  return (
    <div className="rounded-3xl border border-edge bg-white/85 p-6">
      <p className="type-eyebrow text-ink-muted">مرحلهٔ ۳ از ۸</p>
      <h3 className="mt-2 font-display text-2xl text-ink">دسته‌بندی‌ها</h3>
      <p className="mt-2 text-sm text-ink-soft">
        Storefront indexing puts each piece in one primary category.
        Collections layer on top for grouping.
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <label
            key={c}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-2xl border border-edge bg-canvas-soft px-3 py-2.5 text-sm transition",
              category === c && "ring-2 ring-primary bg-white",
            )}
          >
            <input
              type="radio"
              name="category"
              className="h-4 w-4 accent-primary"
              checked={category === c}
              onChange={() => setCategory(c as Doc<"products">["category"])}
            />
            <span className="capitalize">{c}</span>
          </label>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await updateBasics({ id: product._id, category });
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
  const collections = [
    "essentials",
    "autumn-winter",
    "evening",
    "objects",
    "resort",
  ];
  const [picked, setPicked] = React.useState<string[]>(
    product.collectionSlug ? [product.collectionSlug] : [],
  );
  return (
    <div className="rounded-3xl border border-edge bg-white/85 p-6">
      <p className="type-eyebrow text-ink-muted">مرحلهٔ ۴ از ۸</p>
      <h3 className="mt-2 font-display text-2xl text-ink">کالکسیون‌ها</h3>
      <p className="mt-2 text-sm text-ink-soft">
        Use collections to bundle the piece into seasonal stories and
        merchandising modules.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {collections.map((c) => {
          const on = picked.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() =>
                setPicked((prev) =>
                  prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                )
              }
              className={cn(
                "rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition",
                on
                  ? "bg-ink text-canvas"
                  : "hairline bg-canvas/60 text-ink-soft hover:bg-white",
              )}
            >
              {c}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={async () => {
            if (picked.length) {
              await updateBasics({
                id: product._id,
                collectionSlug: picked[picked.length - 1],
              });
            }
            onAdvance();
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
  sizeLabels,
}: {
  product: Doc<"products">;
  colorIds: string[];
  sizeLabels: string[];
}) {
  return (
    <div>
      <p className="type-eyebrow text-ink-muted">مرحلهٔ ۵ از ۸</p>
      <h3 className="mt-2 font-display text-2xl text-ink">تنوع‌ها</h3>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Layer size × colour combinations. Stock held in a row is never
        hard-deleted — any variant removed from the table is
        automatically flagged as unavailable so historical orders can
        still be audited.
      </p>
      <div className="mt-4">
        <VariantEditor
          productId={product._id}
          colorIds={colorIds}
          sizeLabels={sizeLabels}
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
  const [price, setPrice] = React.useState(product.priceCents / 100);
  const [compare, setCompare] = React.useState(
    product.compareAtCents !== undefined ? product.compareAtCents / 100 : 0,
  );
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="rounded-3xl border border-edge bg-white/85 p-6">
      <p className="type-eyebrow text-ink-muted">مرحلهٔ ۶ از ۸</p>
      <h3 className="mt-2 font-display text-2xl text-ink">قیمت‌گذاری و موجودی</h3>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Field label="Price (USD)">
          <input
            type="number"
            step="0.01"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
            className="admin-input"
          />
        </Field>
        <Field label="Compare-at (USD)" hint="Optional strike-through price">
          <input
            type="number"
            step="0.01"
            min={0}
            value={compare || ""}
            onChange={(e) => setCompare(Number(e.target.value) || 0)}
            className="admin-input"
          />
        </Field>
      </div>
      <div className="mt-6 rounded-2xl bg-canvas-soft p-4 text-sm text-ink-soft">
        <p>
          <strong className="text-ink">موجودی:</strong> stock is owned by
          the Variants step. Use the matrix for column-level totals; reach out
          about low-stock alerts from the dashboard.
        </p>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await updatePricing({
                id: product._id,
                priceCents: Math.max(0, Math.round(price * 100)),
                compareAtCents: compare > 0 ? Math.round(compare * 100) : undefined,
              });
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
  const [seoTitle, setSeoTitle] = React.useState(product.name);
  const [seoDescription, setSeoDescription] = React.useState(product.description);
  return (
    <div className="rounded-3xl border border-edge bg-white/85 p-6">
      <p className="type-eyebrow text-ink-muted">مرحلهٔ ۷ از ۸</p>
      <h3 className="mt-2 font-display text-2xl text-ink">سئو</h3>
      <p className="mt-2 text-sm text-ink-soft">
        Search and social metadata. Description is mirrored into the
        long-form copy until dedicated SEO fields land.
      </p>
      <div className="mt-5 grid gap-5">
        <Field label="Title tag">
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="admin-input"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={4}
            className="admin-input"
          />
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={async () => {
            await updateSeo({
              id: product._id,
              seoTitle,
              seoDescription,
            });
            onAdvance();
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
  } | null>(null);

  const handlePublish = async () => {
    setBusy(true);
    setPublished(null);
    try {
      await updateFlags({
        id: product._id,
        featured,
        trending,
        editorial,
      });
      await publishMut({ id: product._id });
      setPublished({ ok: true });
    } catch (err) {
      const message = (err as Error).message;
      if (message.startsWith("INCOMPLETE:")) {
        setPublished({
          ok: false,
          missing: message.slice("INCOMPLETE:".length).split(","),
        });
      } else {
        setPublished({ ok: false });
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
          Promote the piece into featured, trending and editorial modules,
          then commit it to the storefront.
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
            Publish to storefront
          </button>
          {product.status === "published" ? (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await archive({ id: product._id });
                } finally {
                  setBusy(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/70 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-white"
            >
              Archive
            </button>
          ) : product.status === "archived" ? (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await restore({ id: product._id });
                  navigate("/admin/products");
                } finally {
                  setBusy(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/70 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-white"
            >
              Restore as draft
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
            Live on the storefront. Storefront subscriptions will reflect
            the change within their next roundtrip.
          </motion.p>
        ) : null}
        {published && !published.ok ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_LUXURY }}
            className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-800"
          >
            Missing fields before publishing:{" "}
            <strong>
              {(published.missing ?? ["unknown"]).join(", ")}
            </strong>
            . Step back and complete them, then return to publish.
          </motion.p>
        ) : null}

        <p className="mt-5 rounded-xl bg-canvas-soft px-3 py-2 text-[12px] text-ink-soft">
          List price preview:{" "}
          <strong className="text-ink type-caption">
            {formatPrice(product.priceCents / 100)}
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
  const text = state === "ok" ? "Saved" : "Could not save";
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
