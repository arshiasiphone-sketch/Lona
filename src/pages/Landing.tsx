/**
 * Lona — Landing page composition.
 *
 * Locked section order (do not change without consulting the spec):
 *   1. Hero
 *   2. New Collection
 *   3. Categories
 *   4. Featured Products
 *   5. Brand Story
 *   6. Benefits
 *   7. Bestsellers
 *   8. Lookbook
 *   9. Journal
 *   10. Instagram
 *   (Footer + its built-in newsletter band follows via PageShell.)
 */
import { Hero } from "@/components/editorial/Hero";
import { TrendingProducts } from "@/components/editorial/TrendingProducts";
import { CategoryGrid } from "@/components/editorial/CategoryGrid";
import { ProductGrid } from "@/components/product/ProductGrid";
import { BrandStory } from "@/components/editorial/BrandStory";
import { Benefits } from "@/components/editorial/Benefits";
import { Bestsellers } from "@/components/editorial/Bestsellers";
import { Lookbook } from "@/components/editorial/Lookbook";
import { EditorialStory } from "@/components/editorial/EditorialStory";
import { InstagramGallery } from "@/components/editorial/InstagramGallery";
import {
  useCollections,
  useNewArrivals,
  staticCollections,
  staticProducts,
} from "@/lib/data/catalog";
import { OrganizationJsonLd, usePageMeta } from "@/lib/seo";

export default function Landing() {
  usePageMeta({
    title: "بوتیک لباس زیر زنانه لوکس",
    description: "لونا — بوتیک آنلاین لباس زیر زنانه لوکس. طراحی‌های ظریف، پارچه‌های مرغوب و تجربه خریدی خاص برای زنان امروزی.",
    canonical: typeof window !== "undefined" ? window.location.origin : undefined,
    ogType: "website",
  });

  const collections = useCollections();
  const newItems = useNewArrivals();
  const featured = (newItems ?? staticProducts).slice(0, 4);
  const bestsellers = (newItems ?? staticProducts).slice(2, 6);

  return (
    <div className="relative bg-canvas text-ink">
      <OrganizationJsonLd
        name="لونا"
        url={typeof window !== "undefined" ? window.location.origin : ""}
        logo={`${typeof window !== "undefined" ? window.location.origin : ""}/logo.svg`}
        description="لونا — بوتیک آنلاین لباس زیر زنانه لوکس. طراحی‌های ظریف، پارچه‌های مرغوب و تجربه خریدی خاص."
      />
      {/* 1 · Hero */}
      <Hero />

      {/* 2 · New Collection */}
      <TrendingProducts
        products={newItems ?? staticProducts}
        eyebrow="تازه‌ها"
        title="کالکسیون جدید"
        ctaLabel="مشاهده همه"
        ctaTo="/shop"
      />

      {/* 3 · Categories */}
      <CategoryGrid />

      {/* 4 · Featured Products */}
      <section
        className="mx-auto mt-36 max-w-[1728px] px-6 lg:px-10"
        aria-label="محصولات منتخب"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="type-eyebrow text-ink-muted">انتخاب سردبیر</p>
            <h2 className="mt-3 font-display text-4xl font-light leading-[1.08] text-ink lg:text-5xl">
              محصولات منتخب
            </h2>
          </div>
          <p className="max-w-md font-sans text-sm font-light leading-relaxed text-ink-muted md:text-start">
            چهار تکه‌ی ظریف که تیم لونا این فصل بیشتر پوشیده است.
          </p>
        </div>
        <div className="mt-12">
          <ProductGrid products={featured} columns={4} priority />
        </div>
      </section>

      {/* 5 · Brand Story */}
      <BrandStory />

      {/* 6 · Benefits */}
      <Benefits />

      {/* 7 · Bestsellers */}
      <Bestsellers
        products={bestsellers}
        eyebrow="پرفروش‌ها"
        title="آنچه مشتریان ما بیشتر سفارش داده‌اند"
      />

      {/* 8 · Lookbook */}
      <Lookbook />

      {/* 9 · Journal */}
      <EditorialStory
        eyebrow="مجله لونا"
        quote="لباس زیر زنانه، اگر درست انتخاب شود، کمتر دیده می‌شود اما بیشتر حس می‌شود."
        body="ما در لونا هر فصل با چند مزون ایتالیایی و دو کارگاه ایرانی کار می‌کنیم تا پارچه‌ای انتخاب کنیم که هم لطیف باشد، هم ماندگار. طراحی ما از سادگی شروع می‌شود و در جزئیات تمام می‌شود؛ از دوخت‌های نامرئی تا لبه‌های دست‌دوز."
        attribution="تحریریه لونا"
      />

      {/* 10 · Instagram */}
      <InstagramGallery />
    </div>
  );
}