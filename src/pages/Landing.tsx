import { HeroChoreography } from "@/components/editorial/HeroChoreography";
import { Marquee } from "@/components/editorial/Marquee";
import { FeaturedCollections } from "@/components/editorial/FeaturedCollections";
import { TrendingProducts } from "@/components/editorial/TrendingProducts";
import { EditorialStory } from "@/components/editorial/EditorialStory";
import { Testimonials } from "@/components/editorial/Testimonials";
import { Lookbook } from "@/components/editorial/Lookbook";
import { BrandManifesto } from "@/components/editorial/BrandManifesto";
import { Recommendations } from "@/components/editorial/Recommendations";
import { InstagramGallery } from "@/components/editorial/InstagramGallery";
import { RecentlyViewedStrip } from "@/components/global/RecentlyViewed";
import { ImageMaskReveal } from "@/components/motion/ImageMaskReveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { HoverGlow } from "@/components/motion/HoverGlow";
import { PressScale } from "@/components/motion/PressScale";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import {
  collections,
  newArrivals,
  testimonials,
} from "@/data/catalog";

export default function Landing() {
  return (
    <div className="relative">
      <HeroChoreography />

      {/* Quick-access CTA pills */}
      <section className="mx-auto -mt-8 max-w-[1728px] px-6 lg:px-10">
        <div className="glass-strong mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 rounded-3xl px-6 py-4 lg:px-8">
          <div>
            <p className="type-eyebrow text-ink-muted">Skip ahead</p>
            <p className="mt-1 font-display text-base text-ink">
              <TextReveal asRoot="span" as="words" stagger={0.02}>
                Begin a quiet browse.
              </TextReveal>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PressScale>
              <Link
                to="/shop"
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
              >
                New Arrivals
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </Link>
            </PressScale>
            <PressScale>
              <Link
                to="/collections/autumn-winter"
                className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/60 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink hover:bg-white"
                data-cursor="image"
              >
                Volume XII editorial
              </Link>
            </PressScale>
          </div>
        </div>
      </section>

      <Marquee
        items={[
          "ÆON — Established MMXII",
          "Cut in Florence",
          "Knit in Como",
          "Tailored in Naples",
          "Eyewear in Cadore",
          "Quietly distinguished",
        ]}
        className="mt-12"
      />

      <FeaturedCollections
        collections={collections.slice(0, 3)}
        title="Volume XII"
        eyebrow="Chapter"
      />

      <TrendingProducts
        products={newArrivals()}
        title="Newly considered"
        eyebrow="New Arrivals"
      />

      <Lookbook />

      <BrandManifesto />

      <Recommendations />

      <RecentlyViewedStrip />

      <EditorialStory
        eyebrow="From the Atelier"
        quote="Cloth first; line second; everything else — the buttons, the seams, the inside of a pocket — after."
        body="Our atelier in Florence works across four seasons of the year. We do not produce to the calendar. We produce to the cloth — when the mill is right, when the dye is quiet, when the wool is rested. The pieces in Volume XII have been in this conversation for two years."
        attribution="Vittorio Sala, Head Tailor"
      />

      <Testimonials items={testimonials} />

      <InstagramGallery />
    </div>
  );
}
