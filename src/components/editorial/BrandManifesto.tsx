import { Reveal } from "@/components/motion/Reveal";

interface Props {
  eyebrow?: string;
  paragraphs?: string[];
}

export function BrandManifesto({
  eyebrow = "مانیفست",
  paragraphs,
}: Props) {
  const content = paragraphs ?? [
    "لونا بر اساس تقویم طراحی نمی‌کند؛ ما بر اساس پارچه طراحی می‌کنیم — وقتی پشم استراحت کرده، وقتی چرم‌سازی دور دوم پخت را تمام کرده، وقتی رنگ در دومین عبور آرام گرفته است.",
    "هر آنچه منتشر می‌کنیم در تعداد محدود و در کارگاه‌های ما در تهران و اصفهان تولید می‌شود. هر تکه به دست سازنده‌ای تمام می‌شود که نامش بر برچسب درون لباس درج شده است. برچسب یک برند نیست؛ یک سند است.",
    "ما بر کیفیت و آرامش پایبندیم — هم به‌عنوان شیوهٔ ساخت، هم به‌عنوان تجربهٔ استفاده از محصول. هیچ چیز در اینجا پرسروصدا نیست؛ هیچ چیز هم قرار نیست باشد.",
  ];
  return (
    <Reveal as="section" className="mx-auto mt-32 max-w-[1728px] px-6 lg:px-10">
      <div className="grid items-start gap-12 lg:grid-cols-[260px_1fr]">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
          <p className="mt-3 font-display text-xl text-ink">— بنیان‌گذار، تهران</p>
          <p className="mt-2 text-xs text-ink-muted">۱۳۹۸ تا امروز</p>
        </div>
        <div className="space-y-8">
          {content.map((text, i) => (
            <p
              key={i}
              className="font-display text-2xl leading-[1.6] text-ink lg:text-3xl lg:leading-[1.55]"
            >
              {text}
            </p>
          ))}
          <div className="mt-12 flex items-center gap-3">
            <span className="h-px w-10 bg-ink/40" />
            <span className="font-display text-sm tracking-[0.2em] text-ink">LONA</span>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
