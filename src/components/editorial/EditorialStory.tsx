/**
 * Lona — Editorial story (Journal).
 *
 * Two-column editorial pull-quote + body. Used on the homepage as the
 * "مجله لونا" section. Generous whitespace, no decoration.
 */
import { motion } from "framer-motion";
import { EASE_LUXURY } from "@/lib/motion";

interface Props {
  eyebrow?: string;
  quote: string;
  body: string;
  attribution?: string;
}

export function EditorialStory({
  eyebrow = "مجله لونا",
  quote,
  body,
  attribution,
}: Props) {
  return (
    <section
      className="mx-auto mt-36 max-w-[1728px] px-6 lg:px-10"
      aria-label={eyebrow}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease: EASE_LUXURY }}
        className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20"
      >
        <div>
          <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
          <p className="mt-8 font-display text-3xl font-light leading-[1.22] text-ink lg:text-5xl">
            <span className="ms-2 text-ink-muted">«</span>
            {quote}
            <span className="text-ink-muted">»</span>
          </p>
          {attribution && (
            <p className="mt-8 font-sans text-sm font-light text-ink-muted">
              — {attribution}
            </p>
          )}
        </div>
        <div className="glass rounded-3xl p-8 lg:p-10">
          <p className="font-sans text-base font-light leading-[1.95] text-ink-soft">
            {body}
          </p>
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px w-8 bg-ink/35" />
            <span className="font-latin-display text-sm tracking-[0.32em] text-ink">
              LONA
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}