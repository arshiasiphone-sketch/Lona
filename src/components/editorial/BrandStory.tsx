/**
 * Lona — Brand story.
 *
 * Editorial two-column section with verbatim copy: headline + body +
 * tiny signature line. Generous whitespace, serif headline, no icons,
 * no stat dl. Reads like a quiet magazine letter.
 */
import { Reveal } from "@/components/motion/Reveal";
import { LonaMark } from "@/components/brand/LonaLogo";

interface Props {
  eyebrow?: string;
  title?: string;
  body?: string;
}

export function BrandStory({
  eyebrow = "داستان لونا",
  title = "لونا؛ ظرافتی که هر روز همراه شماست",
  body = "در لونا باور داریم لباس زیر تنها یک پوشش نیست؛ بخشی از احساس راحتی، اعتمادبه‌نفس و سبک شخصی شماست. به همین دلیل هر محصول با دقت در انتخاب پارچه، دوخت و جزئیات طراحی انتخاب می‌شود تا تجربه‌ای باکیفیت و ماندگار ایجاد کند.",
}: Props) {
  return (
    <Reveal
      as="section"
      className="mx-auto mt-36 max-w-[1728px] px-6 lg:px-10"
      aria-label={eyebrow}
    >
      <div className="grid items-start gap-16 lg:grid-cols-[260px_1fr]">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
          <div className="mt-8 flex items-center gap-3">
            <LonaMark size={32} />
            <span className="font-latin-display text-base tracking-[0.32em] text-ink">
              LONA
            </span>
          </div>
          <p className="mt-3 font-display text-base font-light text-ink-soft">
            بوتیک لباس زیر زنانه
          </p>
          <p className="mt-1 font-sans text-xs text-ink-muted">
            تأسیس ۱۳۹۸ · تهران و فلورانس
          </p>
        </div>

        <div className="space-y-10">
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.6rem)] font-light leading-[1.18] text-ink">
            {title}
          </h2>
          <p className="max-w-2xl font-sans text-base font-light leading-[1.95] text-ink-soft lg:text-lg lg:leading-[1.85]">
            {body}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="h-px w-10 bg-ink/35" />
            <span className="font-latin-display text-sm tracking-[0.32em] text-ink">
              LONA
            </span>
          </div>
        </div>
      </div>
    </Reveal>
  );
}