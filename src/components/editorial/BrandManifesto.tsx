import { Reveal } from "@/components/motion/Reveal";

interface Props {
  eyebrow?: string;
  paragraphs?: string[];
}

export function BrandManifesto({
  eyebrow = "Manifesto",
  paragraphs,
}: Props) {
  const content = paragraphs ?? [
    "ÆON does not design to the calendar. We design to the cloth — when the wool is rested, when the tannery has finished its second cure, when the dye is quiet on the second pass.",
    "Everything we publish is produced in numbered runs at our ateliers in Italy and Japan. Each piece is finished by a maker whose name is on the label inside. The label is not a brand. It is a record.",
    "We hold the line on quality, and on quietness — both as a way of making and as the experience of the objects themselves. Nothing here is loud. Nothing here is meant to be.",
  ];
  return (
    <Reveal as="section" className="mx-auto mt-32 max-w-[1728px] px-6 lg:px-10">
      <div className="grid items-start gap-12 lg:grid-cols-[260px_1fr]">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
          <p className="mt-3 font-display text-xl text-ink">— Lou Bertrand, founder</p>
          <p className="mt-2 text-xs text-ink-muted">Florence · 2012 → today</p>
        </div>
        <div className="space-y-8">
          {content.map((text, i) => (
            <p
              key={i}
              className="font-display text-2xl leading-[1.32] text-ink lg:text-3xl lg:leading-[1.22]"
            >
              {text}
            </p>
          ))}
          <div className="mt-12 flex items-center gap-3">
            <span className="h-px w-10 bg-ink/40" />
            <span className="font-display text-sm tracking-[0.2em] text-ink">ÆON</span>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
