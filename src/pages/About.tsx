import { Link } from "react-router";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { EditorialStory } from "@/components/editorial/EditorialStory";
import { EASE_LUXURY } from "@/lib/motion";

const stores = [
  { city: "Milan", address: "Via dei Giardini 14, 20121", hours: "Mon — Sat · 11:00 — 19:00" },
  { city: "New York", address: "118 Greene Street, SoHo", hours: "Tue — Sun · 11:00 — 19:00" },
  { city: "Kyoto", address: "47 Higashiyama-ku, Gion", hours: "Wed — Mon · 11:00 — 19:00" },
];

export default function About() {
  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <header className="max-w-4xl">
        <p className="type-eyebrow text-ink-muted">Atelier ÆON</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-9xl">
          A house for the slow, the durable, the quietly distinguished.
        </h1>
        <p className="mt-8 text-base leading-relaxed text-ink-soft lg:text-lg">
          ÆON was founded in 2012 in Florence by a small retinue of textile
          makers, tailors and quiet patrons. The house is dedicated to
          producing long-lasting objects — garments in considered cuts,
          accessories in vegetable-tanned leathers, fragrance in small
          numbered runs.
        </p>
      </header>

      <Reveal as="section" className="mt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: EASE_LUXURY }}
          className="grid gap-12 lg:grid-cols-2"
        >
          <div className="gradient-oat aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-inset ring-white/45">
            <div className="grid h-full place-items-center text-ink/55">
              <p className="font-display text-3xl">کارگاه فلورانس</p>
            </div>
          </div>
          <div className="grid gap-6 self-center">
            <p className="type-eyebrow text-ink-muted">ساخته‌شده با دست</p>
            <h2 className="font-display text-3xl leading-[1.05] text-ink lg:text-4xl">
              Each piece is finished by a single maker. The label inside is their name.
            </h2>
            <p className="text-sm leading-relaxed text-ink-soft">
              ÆON does not believe in mass production. Every garment passes through
              at least twelve pairs of hands — from the cutter to the finishing
              presser. Each carries a label inside listing the makers who held it.
            </p>
          </div>
        </motion.div>
      </Reveal>

      <EditorialStory
        eyebrow="Materials"
        quote="We work with twelve mills, four tanneries, and a single glassworks in Murano. We have worked with them for years. We do not change suppliers for price."
        body=""
        attribution="Lou Bertrand, Founder"
      />

      {/* Sustainability */}
      <section id="sustainability" className="mt-32">
        <p className="type-eyebrow text-ink-muted">پایداری</p>
        <h2 className="mt-3 font-display text-4xl leading-[1.05] text-ink lg:text-6xl">
          Slow, by design.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { stat: "100%", label: "پایه‌ی الیاف طبیعی در سری ماندگار لونا." },
            { stat: "≤ 4g", label: "میانگین کربن برای هر تکه، ممیزی سالانه." },
            { stat: "Always", label: "تعمیر، نه تعویض — بازگشت به کارگاه سازنده." },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, ease: EASE_LUXURY, delay: i * 0.08 }}
              className="glass rounded-3xl p-8"
            >
              <p className="font-display text-5xl text-ink">{item.stat}</p>
              <p className="mt-4 text-sm text-ink-muted">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stores */}
      <section id="stores" className="mt-32">
        <p className="type-eyebrow text-ink-muted">بوتیک‌ها</p>
        <h2 className="mt-3 font-display text-4xl leading-[1.05] text-ink lg:text-6xl">
          Three rooms.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {stores.map((s) => (
            <div key={s.city} className="glass rounded-3xl p-8">
              <p className="type-eyebrow text-ink-muted">{s.city}</p>
              <p className="mt-3 font-display text-2xl text-ink">{s.address}</p>
              <p className="mt-2 text-sm text-ink-muted">{s.hours}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mt-32">
        <div className="glass-strong overflow-hidden rounded-3xl">
          <div className="grid gap-10 p-10 lg:grid-cols-[1fr_1.4fr] lg:p-16">
            <div>
              <p className="type-eyebrow text-ink-muted">مشاور شخصی</p>
              <h2 className="mt-3 font-display text-3xl leading-[1.05] text-ink lg:text-4xl">
                Write to the atelier.
              </h2>
              <p className="mt-4 text-sm text-ink-muted">
                For fittings, repairs, custom orders or quiet questions. Replies arrive within 24 hours.
              </p>
            </div>
            <ul className="divide-y divide-edge/60">
              <li className="flex items-center gap-3 py-4 text-sm">
                <Mail className="h-4 w-4 text-ink-muted" />
                <span className="text-ink">concierge@lona.studio</span>
              </li>
              <li className="flex items-center gap-3 py-4 text-sm">
                <Phone className="h-4 w-4 text-ink-muted" />
                <span className="text-ink">+1 (212) 555-0192</span>
              </li>
              <li className="flex items-start gap-3 py-4 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 text-ink-muted" />
                <span className="text-ink-soft">Via dei Giardini 14, 20121 Milano, IT</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between text-sm text-ink-muted">
          <Link to="/shop" className="hover:text-ink">
            View Catalogue →
          </Link>
          <Link to="/press" className="hover:text-ink">
            Read the Journal →
          </Link>
        </div>
      </section>
    </div>
  );
}
