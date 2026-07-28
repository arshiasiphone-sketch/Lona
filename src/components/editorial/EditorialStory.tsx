import { motion } from "framer-motion";
import { EASE_LUXURY } from "@/lib/motion";

interface Props {
  eyebrow?: string;
  quote: string;
  body: string;
  attribution?: string;
}

export function EditorialStory({
  eyebrow = "From the Atelier",
  quote,
  body,
  attribution,
}: Props) {
  return (
    <section className="mx-auto mt-32 max-w-[1728px] px-6 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease: EASE_LUXURY }}
        className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-20"
      >
        <div>
          <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
          <p className="mt-6 font-display text-3xl leading-[1.18] text-ink lg:text-5xl">
            <span className="mr-3 text-ink-muted">“</span>
            {quote}
            <span className="ml-1 text-ink-muted">”</span>
          </p>
          {attribution && (
            <p className="mt-8 text-sm text-ink-muted">— {attribution}</p>
          )}
        </div>
        <div className="glass rounded-3xl p-8 lg:p-10">
          <p className="text-base leading-relaxed text-ink-soft">
            {body}
          </p>
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px w-8 bg-ink/40" />
            <span className="font-display text-sm tracking-[0.2em] text-ink">ÆON</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
