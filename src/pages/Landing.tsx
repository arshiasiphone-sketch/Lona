/**
 * Lona — Landing page composition.
 *
 * Locked section order (product-first; do not change without consulting
 * the spec):
 *   1. Hero
 *   2. Products — the first shopping destination, immediately after the
 *      hero so shoppers reach the catalogue with minimal scroll.
 *   3. Categories — lightweight shortcuts into the taxonomy
 *   4. Brand Story
 *   5. Benefits
 *   6. Lookbook
 *   7. Journal
 *   8. Instagram
 *   (Footer + its built-in newsletter band follows via PageShell.)
 *
 * Performance: the hero grid fetches a bounded slice (8 rows) rather
 * than the whole catalogue — the Shop page owns the full paginated list.
 */
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Hero } from "@/components/editorial/Hero";
import { CategoryGrid } from "@/components/editorial/CategoryGrid";
import { ProductGrid } from "@/components/product/ProductGrid";
import { BrandStory } from "@/components/editorial/BrandStory";
import { Benefits } from "@/components/editorial/Benefits";
import { Lookbook } from "@/components/editorial/Lookbook";
import { EditorialStory } from "@/components/editorial/EditorialStory";
import { InstagramGallery } from "@/components/editorial/InstagramGallery";
import { useFeaturedProducts, useProducts } from "@/lib/data/catalog";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  OrganizationJsonLd,
  LocalBusinessJsonLd,
  usePageMeta,
} from "@/lib/seo";

/** Home shows a curated slice — the Shop page owns the full catalog. */
const HOME_PRODUCT_LIMIT = 8;

export default function Landing() {
  usePageMeta({
    title: "بوتیک لباس زیر زنانه لوکس",
    description:
      "لونا — بوتیک آنلاین لباس زیر زنانه لوکس. طراحی‌های ظریف، پارچه‌های مرغوب و تجربه خریدی خاص برای زنان امروزی.",
    canonical:
      typeof window !== "undefined" ? window.location.origin : undefined,
    ogType: "website",
  });

  // Prefer admin-curated `featured` products; fall back to the newest
  // published rows so the section is never empty on a fresh catalogue.
  const featured = useFeaturedProducts(HOME_PRODUCT_LIMIT);
  const latest = useProducts({ limit: HOME_PRODUCT_LIMIT });
  const products =
    featured && featured.length > 0
      ? featured
      : (latest ?? []).slice(0, HOME_PRODUCT_LIMIT);

  const store = useQuery(api.admin_settings.getStoreInfo, {});
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="relative bg-canvas text-ink">
      <OrganizationJsonLd
        name={store?.shopName ?? "لونا"}
        url={origin}
        logo={`${origin}/logo.svg`}
        description="لونا — بوتیک آنلاین لباس زیر زنانه لوکس. طراحی‌های ظریف، پارچه‌های مرغوب و تجربه خریدی خاص."
        sameAs={Object.values(store?.social ?? {}).filter(
          (v): v is string => Boolean(v && /^https?:\/\//.test(v)),
        )}
      />
      <LocalBusinessJsonLd
        shopName={store?.shopName}
        phone={store?.phone}
        email={store?.email}
        address={store?.address}
        postalCode={store?.postalCode}
        nationalId={store?.nationalId}
        hours={store?.hours}
        social={store?.social}
        enamadCode={store?.enamadCode}
      />

      {/* 1 · Hero */}
      <Hero />

      {/* 2 · Products — the first shopping destination after the hero */}
      <section
        className="mx-auto mt-14 max-w-[1728px] px-6 lg:mt-20 lg:px-10"
        aria-label="محصولات منتخب"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="type-eyebrow text-ink-muted">انتخاب سردبیر</p>
            <h2 className="mt-3 font-display text-4xl font-light leading-[1.08] text-ink lg:text-5xl">
              محصولات منتخب
            </h2>
          </div>
          <Link
            to="/shop"
            className="group inline-flex items-center gap-2 self-start font-sans text-[12px] font-medium text-ink-soft transition hover:text-ink md:self-end"
          >
            <span className="border-b border-ink/30 pb-0.5 transition group-hover:border-ink">
              مشاهده همه محصولات
            </span>
            <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" />
          </Link>
        </div>
        <div className="mt-10">
          <ProductGrid
            products={products}
            columns={4}
            mobileTwoUp
            priority
          />
        </div>
      </section>

      {/* 3 · Categories */}
      <CategoryGrid />

      {/* 4 · Brand Story */}
      <BrandStory />

      {/* 5 · Benefits */}
      <Benefits />

      {/* 6 · Lookbook */}
      <Lookbook />

      {/* 7 · Journal */}
      <EditorialStory
        eyebrow="مجله لونا"
        quote="لباس زیر زنانه، اگر درست انتخاب شود، کمتر دیده می‌شود اما بیشتر حس می‌شود."
        body="ما در لونا هر فصل با چند مزون ایتالیایی و دو کارگاه ایرانی کار می‌کنیم تا پارچه‌ای انتخاب کنیم که هم لطیف باشد، هم ماندگار. طراحی ما از سادگی شروع می‌شود و در جزئیات تمام می‌شود؛ از دوخت‌های نامرئی تا لبه‌های دست‌دوز."
        attribution="تحریریه لونا"
      />

      {/* 8 · Instagram */}
      <InstagramGallery />
    </div>
  );
}
