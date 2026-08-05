import { useMemo } from "react";
import { Link, useLocation } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BreadcrumbJsonLd,
  LocalBusinessJsonLd,
  usePageMeta,
} from "@/lib/seo";

type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
};

export function LegalPage({
  eyebrow,
  title,
  description,
  sections,
}: LegalPageProps) {
  const location = useLocation();
  const store = useQuery(api.admin_settings.getStoreInfo, {});
  const canonical = useMemo(
    () =>
      typeof window === "undefined"
        ? undefined
        : `${window.location.origin}${location.pathname}`,
    [location.pathname],
  );

  usePageMeta({ title, description, canonical });

  const breadcrumbUrl = canonical ?? location.pathname;
  const schema = store ? <LocalBusinessJsonLd {...store} /> : null;

  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-16 lg:px-10 lg:pt-24" dir="rtl">
      {schema}
      {BreadcrumbJsonLd([
        { name: "خانه", url: `${typeof window === "undefined" ? "" : window.location.origin}/` },
        { name: title, url: breadcrumbUrl },
      ])}
      <nav aria-label="مسیر ناوبری" className="text-xs text-ink-muted">
        <Link to="/" className="transition hover:text-ink">خانه</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span aria-current="page" className="text-ink-soft">{title}</span>
      </nav>

      <header className="mt-8 max-w-3xl">
        <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.08] text-ink lg:text-6xl">{title}</h1>
        <p className="mt-5 text-sm leading-8 text-ink-soft">{description}</p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[210px_1fr] lg:items-start">
        <aside className="glass rounded-3xl p-5 lg:sticky lg:top-28">
          <p className="type-eyebrow text-ink-muted">فهرست مطالب</p>
          <ol className="mt-4 space-y-3 text-sm text-ink-soft">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a className="transition hover:text-ink" href={`#${section.id}`}>
                  {toPersianDigits(index + 1)}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <Accordion type="multiple" className="glass-strong rounded-3xl px-6 sm:px-8">
          {sections.map((section, index) => (
            <AccordionItem key={section.id} value={section.id} id={section.id}>
              <AccordionTrigger className="py-6 text-right text-base text-ink hover:no-underline">
                <span>{toPersianDigits(index + 1)}. {section.title}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-sm leading-8 text-ink-soft">
                <div className="space-y-4">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.bullets?.length ? (
                    <ul className="list-disc space-y-2 pr-5">
                      {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="mt-10 glass rounded-3xl p-6 text-sm leading-8 text-ink-soft">
        <p className="font-medium text-ink">اطلاعات تماس فروشگاه</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {store?.shopName ? <p>نام فروشگاه: {store.shopName}</p> : null}
          {store?.legalName ? <p>نام حقوقی: {store.legalName}</p> : null}
          {store?.landlinePhone || store?.mobilePhone || store?.phone ? (
            <p dir="ltr" className="text-right">تلفن: {store.landlinePhone || store.phone || store.mobilePhone}</p>
          ) : null}
          {store?.email ? <p dir="ltr" className="text-right">ایمیل: {store.email}</p> : null}
          {store?.address ? <p className="sm:col-span-2">آدرس: {store.address}</p> : null}
          {store?.postalCode ? <p>کد پستی: {store.postalCode}</p> : null}
        </div>
        <Link to="/contact" className="mt-5 inline-flex rounded-full bg-ink px-5 py-2.5 text-xs text-canvas transition hover:bg-primary">
          ارتباط با پشتیبانی
        </Link>
      </div>
    </div>
  );
}

function toPersianDigits(value: number): string {
  return value.toLocaleString("fa-IR");
}
