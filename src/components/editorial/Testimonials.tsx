import { motion } from "framer-motion";
import type { Testimonial } from "@/data/catalog";
import { EASE_LUXURY } from "@/lib/motion";

interface Props {
  items: Testimonial[];
}

export function Testimonials({ items }: Props) {
  return (
    <section className="mx-auto mt-32 max-w-[1728px] px-6 lg:px-10">
      <p className="type-eyebrow text-ink-muted">Notes</p>
      <h2 className="mt-3 font-display text-4xl leading-[1.05] text-ink lg:text-5xl">
        From our patrons
      </h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((t, i) => (
          <motion.figure
            key={t.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE_LUXURY, delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            className="glass rounded-2xl p-7"
          >
            <blockquote className="font-display text-lg leading-relaxed text-ink">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-6 flex flex-col gap-0.5">
              <span className="text-sm font-medium text-ink">{t.author}</span>
              <span className="text-xs text-ink-muted">{t.role}</span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
