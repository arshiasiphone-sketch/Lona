import { Hero } from "@/components/editorial/Hero";
import { Marquee } from "@/components/editorial/Marquee";
import { FeaturedCollections } from "@/components/editorial/FeaturedCollections";
import { TrendingProducts } from "@/components/editorial/TrendingProducts";
import { EditorialStory } from "@/components/editorial/EditorialStory";
import { Testimonials } from "@/components/editorial/Testimonials";
import {
  collections,
  newArrivals,
  testimonials,
} from "@/data/catalog";

export default function Landing() {
  return (
    <div className="relative">
      <Hero />
      <Marquee
        items={[
          "ÆON — Established MMXII",
          "Cut in Florence",
          "Knit in Como",
          "Tailored in Naples",
          "Eyewear in Cadore",
          "Quietly distinguished",
        ]}
        className="mt-2"
      />
      <FeaturedCollections collections={collections.slice(0, 3)} title="Volume XII" eyebrow="Chapter" />
      <TrendingProducts products={newArrivals()} title="Newly considered" eyebrow="New Arrivals" />
      <EditorialStory
        eyebrow="From the Atelier"
        quote="Cloth first; line second; everything else — the buttons, the seams, the inside of a pocket — after."
        body="Our atelier in Florence works across four seasons of the year. We do not produce to the calendar. We produce to the cloth — when the mill is right, when the dye is quiet, when the wool is rested. The pieces in Volume XII have been in this conversation for two years."
        attribution="Vittorio Sala, Head Tailor"
      />
      <Testimonials items={testimonials} />
    </div>
  );
}
