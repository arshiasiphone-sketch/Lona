/**
 * Phase 5.8 — Lona Single Source of Truth.
 *
 * All Lingerie Mock Data lives here. Both:
 *   • `src/data/catalog.ts` (FE static fallback mirror) and
 *   • `src/convex/seed.ts` (Convex seed action)
 * import from this file. Never duplicate this content elsewhere.
 *
 * Conventions
 * ───────────
 *   • Category slugs = the lingerie taxonomy the user locked in
 *     Phase 5.5 (English slugs; Persian labels live in the FE
 *     mirror at `src/data/catalog.ts::CATEGORY_LABEL_FA`).
 *   • Colors are mapped onto the gradient literals (`mist`/`oat`/
 *     `rose`/`deep`/`pearl`) the validator already constrains.
 *   • Prices are stored as toman in `priceCents` (the field name
 *     preserves schema compatibility; the adapter treats the value
 *     as toman directly — see `centsToman` helper below).
 *   • Variants are derived at seed time (color × size).
 *   • Images use Unsplash public CDN URLs. The minimum 4 / target
 *     6 requirement is satisfied per product from a hand-curated
 *     pool of stable, editorial fashion photo IDs.
 */
import type { GradientKey } from "@/lib/glass";

// ──────────────────────────────────────────────────────────────
// IDENTITY — categories, colors, sizes
// ──────────────────────────────────────────────────────────────

export const LONA_CATEGORY_LABELS_FA: Record<string, string> = {
  bras: "سوتین",
  briefs: "شورت",
  sets: "ست لباس زیر",
  sleepwear: "لباس خواب",
  loungewear: "لباس راحتی",
  bodysuits: "بادی",
  shapewear: "گن",
  sportswear: "لباس ورزشی زنانه",
  accessories: "اکسسوری",
  bridal: "کالکشن عروس",
};

export const LONA_CATEGORIES = [
  { slug: "bras",        name: "سوتین", description: "سوتین‌های ظریف و راحت لونا", order: 1,  visible: true, seo: { title: "سوتین — لونا", description: "سوتین‌های ظریف و راحت لونا" } },
  { slug: "briefs",      name: "شورت", description: "شورت‌های زنانه با دوخت نرم", order: 2,  visible: true, seo: { title: "شورت — لونا", description: "شورت‌های زنانه با دوخت نرم" } },
  { slug: "sets",        name: "ست لباس زیر", description: "ست‌های هماهنگ لباس زیر زنانه", order: 3,  visible: true, seo: { title: "ست لباس زیر — لونا", description: "ست‌های هماهنگ لباس زیر زنانه" } },
  { slug: "sleepwear",   name: "لباس خواب", description: "لباس‌های خواب ابریشمی و راحت", order: 4,  visible: true, seo: { title: "لباس خواب — لونا", description: "لباس‌های خواب ابریشمی و راحت" } },
  { slug: "loungewear",  name: "لباس راحتی", description: "لباس‌های راحتی برای خانه", order: 5,  visible: true, seo: { title: "لباس راحتی — لونا", description: "لباس‌های راحتی برای خانه" } },
  { slug: "bodysuits",   name: "بادی", description: "بادی‌های شیک و ظریف", order: 6,  visible: true, seo: { title: "بادی — لونا", description: "بادی‌های شیک و ظریف" } },
  { slug: "shapewear",   name: "گن", description: "گن‌های راحت با فرم‌دهی طبیعی", order: 7,  visible: true, seo: { title: "گن — لونا", description: "گن‌های راحت با فرم‌دهی طبیعی" } },
  { slug: "sportswear",  name: "لباس ورزشی زنانه", description: "لباس ورزشی با پشتیبانی مناسب", order: 8,  visible: true, seo: { title: "لباس ورزشی زنانه — لونا", description: "لباس ورزشی با پشتیبانی مناسب" } },
  { slug: "accessories", name: "اکسسوری", description: "اکسسوری‌های پارچه‌ای و ظریف", order: 9,  visible: true, seo: { title: "اکسسوری — لونا", description: "اکسسوری‌های پارچه‌ای و ظریف" } },
  { slug: "bridal",      name: "کالکشن عروس", description: "کالکشن ویژه عروس لونا", order: 10, visible: true, seo: { title: "کالکشن عروس — لونا", description: "کالکشن ویژه عروس لونا" } },
] as const;

export type LonaCategorySlug = (typeof LONA_CATEGORIES)[number]["slug"];

export const LINGERIE_SIZES = [
  { id: "xs",  label: "XS"  },
  { id: "s",   label: "S"   },
  { id: "m",   label: "M"   },
  { id: "l",   label: "L"   },
  { id: "xl",  label: "XL"  },
  { id: "xxl", label: "XXL" },
] as const;

export const ACCESSORY_SIZES = [
  { id: "one", label: "تک سایز" },
] as const;

/**
 * Color ledger. The `gradient` value snaps to one of the locked
 * gradient literals so the seed action does not bust schema. Real
 * Lona brand colors map as follows:
 *   BLACK       → deep
 *   WHITE       → mist
 *   BEIGE/NUDE  → oat
 *   BLUSH/ROSE  → rose
 *   BURGUNDY    → deep (read as the same ink-tinted family)
 *   NAVY        → deep
 *   CHOCOLATE   → oat
 *   EMERALD     → oat (best-lit approximation)
 */
export const LONA_COLOR_OPTIONS = [
  { id: "black",    name: "مشکی",        gradient: "deep" as const },
  { id: "white",    name: "سفید",        gradient: "mist" as const },
  { id: "beige",    name: "بژ",          gradient: "oat" as const },
  { id: "rose",     name: "رز کمرنگ",    gradient: "rose" as const },
  { id: "burgundy", name: "شرابی",       gradient: "deep" as const },
  { id: "navy",     name: "سرمه‌ای",     gradient: "deep" as const },
  { id: "chocolate",name: "شکلاتی",      gradient: "oat" as const },
  { id: "emerald",  name: "زمردی",       gradient: "oat" as const },
];

// ──────────────────────────────────────────────────────────────
// IMAGE POOL — stable Unsplash IDs, neutral/editorial fashion
// ──────────────────────────────────────────────────────────────
// 64 IDs curated for lingerie / sleepwear / fabric / fashion
// editorial. The seed script picks groups of 4-6 per product.
const IMG = {
  // bras / briefs related
  bra1:  "photo-1571513800374-df1bbe650e56",
  bra2:  "photo-1605518216938-7c31b7b14ad0",
  bra3:  "photo-1571945153237-4929e783af4a",
  bra4:  "photo-1583845112310-172c8a94509d",
  bra5:  "photo-1605518216934-1eca1fd8fa12",
  bra6:  "photo-1606902965551-dce093cda6e7",
  // silk / sleepwear
  silk1: "photo-1583845112203-29329902332e",
  silk2: "photo-1585914924626-19adbc1b6b76",
  silk3: "photo-1611042553365-9b101441c135",
  silk4: "photo-1617137984095-74e4e5e3613f",
  silk5: "photo-1490481651871-ab68de25d43d",
  silk6: "photo-1551803091-e20673f15770",
  silk7: "photo-1572804013427-4d7ca7268217",
  silk8: "photo-1515886657613-9f3515b0c78f",
  // robe / loungewear
  robe1: "photo-1485231183945-fffde7cc051e",
  robe2: "photo-1617137968995-6cf6ad23d2fb",
  robe3: "photo-1581338834647-b0fb40704e21",
  robe4: "photo-1531538606174-0f8ff5a4c719",
  robe5: "photo-1554941829-202a0b2403b8",
  robe6: "photo-1567581935884-3349723552ca",
  // bodysuit / shapewear / sportswear
  body1: "photo-1496360166961-10a51d5f367a",
  body2: "photo-1502716119720-b23a93e5fe1b",
  body3: "photo-1518310383802-640c5de311c6",
  body4: "photo-1571019613454-1cb2f99b2d8b",
  body5: "photo-1550345332-09ce3ac9a538",
  body6: "photo-1606902965551-dce093cda6e7",
  // bridal
  bride1:"photo-1519225421980-715cb0215aed",
  bride2:"photo-1591604463042-d3a7bf90d8a8",
  bride3:"photo-1583939003579-730e3918a45a",
  bride4:"photo-1565057016-1c1ee91e0b13",
  bride5:"photo-1606800052052-a08af7148866",
  bride6:"photo-1502716119720-b23a93e5fe1b",
  // accessories (slips, garters, eyeshades etc.)
  acc1:  "photo-1601924638867-3a5b93b1a9f9",
  acc2:  "photo-1620012253295-c15cc3e65df4",
  acc3:  "photo-1556905055-8f358a7a47b2",
  acc4:  "photo-1605518216948-7c4fc89d4d83",
  acc5:  "photo-1620331317094-2cd53edd7787",
  acc6:  "photo-1582234009-8e05ad3a3e6e",
  // editorial portraits
  ed1:   "photo-1494790108377-be9c29b29330",
  ed2:   "photo-1483985988355-763728e1935b",
  ed3:   "photo-1487412720507-e7ab37603c6f",
  ed4:   "photo-1469334031218-e382a71b716b",
  ed5:   "photo-1467043198406-dc953a3def28",
  ed6:   "photo-1487222477894-8943e30ef7b2",
  // detail / fabric
  fab1:  "photo-1581338834647-b0fb40704e21",
  fab2:  "photo-1551727974-8af20a3322fc",
  fab3:  "photo-1466728620078-5bcdbb1e1d35",
  fab4:  "photo-1568667256549-094345857637",
  fab5:  "photo-1622500188203-5d0dbe0e07fa",
  fab6:  "photo-1566870830453-157e2c1b8d72",
  // flat-lay
  flat1: "photo-1602810316693-3667c854239a",
  flat2: "photo-1591369822096-aed549a50307",
  flat3: "photo-1567113463300-102a7eb3cb26",
  flat4: "photo-1599842057874-37393e9342df",
  flat5: "photo-1606902965551-dce093cda6e7",
  flat6: "photo-1572804013427-4d7ca7268217",
} as const;

const photoUrl = (id: string, w = 1200): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// Per-category 6-image pools. Seed script picks 4-6 from each list.
const CATEGORY_IMAGE_POOL: Record<LonaCategorySlug, readonly string[]> = {
  bras:       [IMG.bra1, IMG.bra2, IMG.bra3, IMG.flat2, IMG.ed5, IMG.fab4],
  briefs:     [IMG.bra4, IMG.bra5, IMG.flat1, IMG.flat2, IMG.fab1, IMG.fab3],
  sets:       [IMG.bra6, IMG.silk7, IMG.flat1, IMG.flat2, IMG.ed3, IMG.fab4],
  sleepwear:  [IMG.silk1, IMG.silk2, IMG.silk3, IMG.silk4, IMG.silk5, IMG.silk6],
  loungewear: [IMG.robe1, IMG.robe2, IMG.robe3, IMG.silk3, IMG.silk8, IMG.fab2],
  bodysuits:  [IMG.body1, IMG.body2, IMG.body3, IMG.flat3, IMG.ed2, IMG.fab5],
  shapewear:  [IMG.body4, IMG.body5, IMG.body6, IMG.flat4, IMG.fab1, IMG.fab6],
  sportswear: [IMG.body4, IMG.body3, IMG.flat5, IMG.flat6, IMG.ed4, IMG.fab5],
  accessories:[IMG.acc1, IMG.acc2, IMG.acc3, IMG.acc4, IMG.acc5, IMG.acc6],
  bridal:     [IMG.bride1, IMG.bride2, IMG.bride3, IMG.bride4, IMG.bride5, IMG.bride6],
};

// ──────────────────────────────────────────────────────────────
// COLLECTIONS — 12 curated seasonal/thematic sets
// ──────────────────────────────────────────────────────────────

export const LONA_COLLECTIONS = [
  { slug: "spring-elegance",    name: "شکوفه‌های بهار",        eyebrow: "بهار ۱۴۰۵",  description: "ترکیب‌های تازه و رنگ‌های شکوفه‌ای برای آغاز فصلی تازه؛ پارچه‌هایی با لمس نرم و دوخت‌هایی که روی پوست نفس می‌کشند.", gradient: "rose"  as GradientKey, kind: "seasonal"  as const, season: "بهار ۱۴۰۵" },
  { slug: "soft-essentials",    name: "ملزومات نرم",           eyebrow: "Permanent",   description: "اصول روزمره‌ی کمد لباس زیر هر زن ایرانی؛ شش تکه‌ای که هر روز به آن‌ها بازمی‌گردید.",                              gradient: "mist"  as GradientKey, kind: "permanent" as const },
  { slug: "bridal-moments",     name: "لحظه‌های عروسی",        eyebrow: "Bridal ’25",  description: "کالکشنی برای روزهای پیش از عروسی؛ توری‌های فرانسوی، ابریشم خالص و رنگ‌های عاج و شیری.",                          gradient: "oat"   as GradientKey, kind: "campaign"  as const, season: "Bridal ۲۰۲۵" },
  { slug: "daily-comfort",      name: "راحتی روزانه",          eyebrow: "Daily",       description: "برای روزهای پُرکار، ساعت‌های طولانی پشت میز یا در مسیر خانه؛ لباس‌هایی که فراموش می‌کنید تن‌تان هست.",            gradient: "oat"   as GradientKey, kind: "permanent" as const },
  { slug: "silk-stories",       name: "داستان‌های ابریشم",     eyebrow: "Atelier",     description: "ابریشم خالص مولبری در شش تکه‌ی ظریف؛ پیراهن‌های خوابی که با لمس‌شان آرامش را به خواب می‌برند.",                      gradient: "pearl" as GradientKey, kind: "editorial" as const },
  { slug: "midnight-collection",name: "کالکشن نیمه‌شب",       eyebrow: "بعد از شش",   description: "رنگ‌های عمیق، احساس شب و زرق‌و‌رقی که فقط در نور کم خودنمایی می‌کند.",                                                  gradient: "deep"  as GradientKey, kind: "campaign"  as const },
  { slug: "summer-escape",      name: "فرار تابستانی",         eyebrow: "تابستان",     description: "پارچه‌های خنک و رنگ‌های روشن برای سفرهای کوتاه و روزهای گرم سال.",                                                       gradient: "mist"  as GradientKey, kind: "seasonal"  as const, season: "تابستان ۱۴۰۵" },
  { slug: "premium-lace",       name: "توری لوکس",             eyebrow: "Heritage",    description: "توری‌های فرانسوی Chantilly و Calais، انتخابی ظریف برای لحظه‌های خاص.",                                                 gradient: "rose"  as GradientKey, kind: "editorial" as const },
  { slug: "minimal-line",       name: "خط مینیمال",            eyebrow: "Clean",       description: "خطی بی‌صدا، بدون تزئینات اضافی؛ برای کسانی که زیبایی را در سادگی می‌بینند.",                                              gradient: "mist"  as GradientKey, kind: "permanent" as const },
  { slug: "lounge-edition",     name: "ویرایش خانه‌نشینی",     eyebrow: "At-home",     description: "راحتی و آرامش در خانه؛ از لباس خواب گرفته تا لباس راحتی صبحانه.",                                                       gradient: "oat"   as GradientKey, kind: "permanent" as const },
  { slug: "romantic-hours",     name: "ساعت‌های عاشقانه",      eyebrow: "Limited",     description: "تکه‌هایی با رنگ‌های شرابی و مخمل که حس لحظه‌های خاص را زنده می‌کنند.",                                                gradient: "deep"  as GradientKey, kind: "campaign"  as const },
  { slug: "heritage-edition",   name: "ویرایش میراثی",         eyebrow: "Atelier",     description: "ترکیب سنت ایرانی با ظرافت اروپایی؛ طرح‌هایی که ریشه در گذشته دارند و امروز معنا پیدا می‌کنند.",                     gradient: "oat"   as GradientKey, kind: "editorial" as const },
];

// ──────────────────────────────────────────────────────────────
// PRODUCT SCHEMA — used by data/catalog.ts AND convex/seed.ts
// ──────────────────────────────────────────────────────────────

export interface LonaProductRaw {
  slug: string;
  name: string;             // Persian display name
  nameLatin?: string;       // Optional latin version (rare)
  category: LonaCategorySlug;
  collectionSlug: string;
  /** Toman amount — stored 1:1 in `priceCents` for display purposes. */
  price: number;
  /** Optional higher reference price for discount badges. */
  compareAt?: number;
  currency: "USD";          // legacy literal preserved for schema compatibility
  description: string;
  shortDescription: string;
  composition: string;
  origin: string;
  colors: string[];         // ids from LONA_COLOR_OPTIONS
  sizes: string[];          // ids from LINGERIE_SIZES or ACCESSORY_SIZES
  badges: ("new" | "restocked" | "limited" | "editorial" | "exclusive")[];
  rating: number;
  reviewCount: number;
  secondaryGradient: GradientKey;
  imageUrls: string[];      // minimum 4, target 6
  featured: boolean;
  trending: boolean;
  editorial: boolean;
  /** FAQ entries for product page — Persian copy. */
  faqs?: { question: string; answer: string }[];
}

// ──────────────────────────────────────────────────────────────
// PRODUCT BUILDERS — keeps the dataset compact and consistent
// ──────────────────────────────────────────────────────────────

interface ProfileOpts {
  name: string;
  short: string;
  long: string;
  composition: string;
  origin: string;
  basePrice: number;
  compareAt?: number;
  colors: string[];
  /** Either `LINGERIE_SIZES` or `ACCESSORY_SIZES` (or custom). */
  sizeSet: "lingerie" | "accessory";
  badges: LonaProductRaw["badges"];
  rating: number;
  reviewCount: number;
  secondaryGradient: GradientKey;
  featured?: boolean;
  trending?: boolean;
  editorial?: boolean;
  faqs?: LonaProductRaw["faqs"];
  /* 4-6 image offsets into the per-category pool */
  images: number[];
  /** Optional re-statement for the factory spread (buildProduct uses its first arg). */
  category?: LonaCategorySlug;
  collectionSlug?: string;
}

function pickImages(category: LonaCategorySlug, indexes: number[]): string[] {
  const pool = CATEGORY_IMAGE_POOL[category];
  return indexes.map((i) => photoUrl(pool[i % pool.length]!));
}

function buildProduct(category: LonaCategorySlug, collectionSlug: string, opts: ProfileOpts): LonaProductRaw {
  const sizes = (opts.sizeSet === "accessory" ? ACCESSORY_SIZES : LINGERIE_SIZES).map((s) => s.id);
  const colors = opts.colors.map((id) => {
    const def = LONA_COLOR_OPTIONS.find((c) => c.id === id);
    if (!def) throw new Error(`Unknown color id: ${id}`);
    return def.id;
  });
  return {
    slug: category + "-" + opts.name.replace(/\s+/g, "-").toLowerCase() + "-" + collectionSlug,
    name: opts.name,
    category,
    collectionSlug,
    price: opts.basePrice,
    compareAt: opts.compareAt,
    currency: "USD",
    description: opts.long,
    shortDescription: opts.short,
    composition: opts.composition,
    origin: opts.origin,
    colors,
    sizes,
    badges: opts.badges,
    rating: opts.rating,
    reviewCount: opts.reviewCount,
    secondaryGradient: opts.secondaryGradient,
    imageUrls: pickImages(category, opts.images),
    featured: !!opts.featured,
    trending: !!opts.trending,
    editorial: !!opts.editorial,
    faqs: opts.faqs,
  };
}

// ──────────────────────────────────────────────────────────────
// DATASET — 90 products, distributed across 10 categories
// ──────────────────────────────────────────────────────────────
// We aim 9-10 products per category. Each array below describes
// the curated profiles by category.

const STANDARD_FAQS = [
  { question: "چگونه سایز مناسب را انتخاب کنم؟", answer: "با استفاده از راهنمای سایز در صفحه‌ی محصول و اندازه‌گیری دقیق، سایز خود را پیدا کنید. تیم پشتیبانی لونا نیز آماده‌ی راهنمایی است." },
  { question: "زمان ارسال چقدر است؟",           answer: "ارسال عادی ۲ تا ۳ روز کاری و ارسال سریع یک روز کاری در شهرهای بزرگ. تمامی سفارش‌ها بسته‌بندی محرمانه دارند." },
  { question: "آیا امکان تعویض وجود دارد؟",      answer: "بله، تا ۷ روز پس از دریافت می‌توانید با رعایت شرایط بهداشتی محصول را تعویض یا مرجوع کنید." },
  { question: "جنس پارچه چیست؟",                answer: "برای هر محصول، ترکیب دقیق پارچه در بخش «جزئیات محصول» ذکر شده است." },
  { question: "روش شستشو چگونه است؟",           answer: "تمامی محصولات لونا باید با آب سرد و دست شسته شوند. از مواد سفیدکننده استفاده نکنید." },
];

const braFaqs = [
  ...STANDARD_FAQS,
  { question: "بهترین مدل سوتین برای استفاده‌ی روزانه چیست؟", answer: "سوتین‌های بدون فنر (Soft) لونا با پارچه‌ی میکروفیبر، راحت‌ترین انتخاب برای استفاده‌ی طولانی هستند." },
];

// ──────────────────────────────────────────────────────────────
// COMMON PROFILE FACTORIES
// ──────────────────────────────────────────────────────────────

const bra = (collection: string, opts: Omit<ProfileOpts,"sizeSet"|"images"|"category"|"collectionSlug">) =>
  buildProduct("bras", collection, { ...opts, category: "bras", collectionSlug: collection, sizeSet: "lingerie", faqs: braFaqs, images: [0,1,2,3] });

const briefs = (collection: string, opts: Omit<ProfileOpts,"sizeSet"|"images"|"category"|"collectionSlug">) =>
  buildProduct("briefs", collection, { ...opts, category: "briefs", collectionSlug: collection, sizeSet: "lingerie", images: [0,1,2,3] });

const sets = (collection: string, opts: Omit<ProfileOpts,"sizeSet"|"images"|"category"|"collectionSlug">) =>
  buildProduct("sets", collection, { ...opts, category: "sets", collectionSlug: collection, sizeSet: "lingerie", images: [0,2,3,4] });

const sleepwear = (collection: string, opts: Omit<ProfileOpts,"sizeSet"|"images"|"category"|"collectionSlug">) =>
  buildProduct("sleepwear", collection, { ...opts, category: "sleepwear", collectionSlug: collection, sizeSet: "lingerie", images: [0,1,4,5] });

const loungewear = (collection: string, opts: Omit<ProfileOpts,"sizeSet"|"images"|"category"|"collectionSlug">) =>
  buildProduct("loungewear", collection, { ...opts, category: "loungewear", collectionSlug: collection, sizeSet: "lingerie", images: [0,1,2,3] });

const bodysuits = (collection: string, opts: Omit<ProfileOpts,"sizeSet"|"images"|"category"|"collectionSlug">) =>
  buildProduct("bodysuits", collection, { ...opts, category: "bodysuits", collectionSlug: collection, sizeSet: "lingerie", images: [0,2,3,4] });

const shapewear = (collection: string, opts: Omit<ProfileOpts,"sizeSet"|"images"|"category"|"collectionSlug">) =>
  buildProduct("shapewear", collection, { ...opts, category: "shapewear", collectionSlug: collection, sizeSet: "lingerie", images: [0,1,2,3] });

const sportswear = (collection: string, opts: Omit<ProfileOpts,"sizeSet"|"images"|"category"|"collectionSlug">) =>
  buildProduct("sportswear", collection, { ...opts, category: "sportswear", collectionSlug: collection, sizeSet: "lingerie", images: [0,1,4,5] });

const accessories = (collection: string, opts: Omit<ProfileOpts,"sizeSet"|"images"|"category"|"collectionSlug">) =>
  buildProduct("accessories", collection, { ...opts, category: "accessories", collectionSlug: collection, sizeSet: "accessory", images: [0,1,2,3] });

const bridal = (collection: string, opts: Omit<ProfileOpts,"sizeSet"|"images"|"category"|"collectionSlug">) =>
  buildProduct("bridal", collection, { ...opts, category: "bridal", collectionSlug: collection, sizeSet: "lingerie", images: [0,1,4,5] });

// ──────────────────────────────────────────────────────────────
// PRODUCTS — 90 hand-curated profiles (9 per category)
// ──────────────────────────────────────────────────────────────

export const LONA_PRODUCTS: LonaProductRaw[] = [
  // ── 9 BRAS ────────────────────────────────────────────────
  bra("soft-essentials", {
    name: "سوتین نرم بدون فنر «آرام»",
    short: "سوتین روزانه با لمس ابریشم",
    long: "سوتینی بدون فنر با پارچه‌ی میکروفایبر نرم، مناسب استفاده‌ی طولانی‌مدت. بندهای قابل تنظیم و کاپ‌های یکنواخت، فشار یکنواختی روی شانه ایجاد می‌کنند.",
    composition: "۸۸٪ نایلون، ۱۲٪ الاستین. بدون دوخت داخلی.",
    origin: "طراحی و دوخت در استان البرز.",
    basePrice: 690000, compareAt: 790000,
    colors: ["beige","black","white","rose"],
    badges: ["new","editorial"],
    rating: 4.9, reviewCount: 184,
    secondaryGradient: "oat",
    featured: true, trending: true, editorial: true,
  }),
  bra("summer-escape", {
    name: "سوتین نخی «تابش»",
    short: "سوتین نخی برای روزهای گرم",
    long: "پارچه‌ی ۱۰۰٪ نخ پنبه با بافت تنفس‌پذیر، مناسب پوست‌های حساس. کاپ‌های کم‌حجم، بدون ایجاد خط زیر لباس.",
    composition: "۹۵٪ پنبه ارگانیک، ۵٪ الاستین.",
    origin: "تولید در اصفهان.",
    basePrice: 490000,
    colors: ["white","beige","rose"],
    badges: ["new"],
    rating: 4.7, reviewCount: 96,
    secondaryGradient: "mist",
  }),
  bra("midnight-collection", {
    name: "سوتین توری «نیمه‌شب»",
    short: "سوتین توری با تزئینات فلزی",
    long: "توری فرانسوی Calais با تزئینات فلزی بسیار ظریف، مناسب لحظه‌های خاص. طراحی سه‌تکه با بندهای قابل تنظیم.",
    composition: "۷۰٪ پلی‌استر، ۳۰٪ الاستین. تزئینات فلزی ضد زنگ.",
    origin: "طراحی در پاریس، دوخت در تهران.",
    basePrice: 1290000, compareAt: 1490000,
    colors: ["black","burgundy","navy"],
    badges: ["editorial","exclusive"],
    rating: 4.8, reviewCount: 52,
    secondaryGradient: "deep",
    featured: true, editorial: true,
  }),
  bra("premium-lace", {
    name: "سوتین توری Chantilly «مات»",
    short: "توری Chantilly فرانسوی خالص",
    long: "توری Chantilly اصیل فرانسوی با دوخت‌های ظریف دستی. حس لوکس واقعی یک کالای اروپایی با کیفیت ایرانی.",
    composition: "۶۰٪ پلی‌استر، ۳۰٪ نایلون، ۱۰٪ الاستین.",
    origin: "پارچه وارداتی فرانسه، دوخت ایران.",
    basePrice: 1690000,
    colors: ["beige","rose","navy"],
    badges: ["limited","editorial"],
    rating: 4.9, reviewCount: 38,
    secondaryGradient: "rose",
    featured: true,
  }),
  bra("daily-comfort", {
    name: "سوتین بی‌سیم «مهتاب»",
    short: "بدون سیم، با پشتیبانی کامل",
    long: "طراحی بدون سیم با ساختار داخلی تقویت‌شده، مناسب استفاده‌ی طولانی. بند پهن برای توزیع یکنواخت فشار روی شانه.",
    composition: "۸۰٪ نایلون، ۲۰٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 790000,
    colors: ["beige","black","white"],
    badges: ["restocked"],
    rating: 4.6, reviewCount: 122,
    secondaryGradient: "oat",
    trending: true,
  }),
  bra("spring-elegance", {
    name: "سوتین فنری «شکوفه»",
    short: "فنری با طرح گلدار",
    long: "سوتین فنری با گلدوزی ظریف بهاری. کاپ‌های عمیق با پشتیبانی مناسب برای استفاده‌ی روزانه و مجالس.",
    composition: "۶۵٪ پلی‌استر، ۳۰٪ نایلون، ۵٪ الاستین.",
    origin: "تولید در اصفهان.",
    basePrice: 990000,
    colors: ["rose","beige","white"],
    badges: ["new","editorial"],
    rating: 4.8, reviewCount: 71,
    secondaryGradient: "rose",
    featured: true, trending: true,
  }),
  bra("sportswear", {
    name: "سوتین ورزشی «پویا»",
    short: "پشتیبانی بالا برای ورزش",
    long: "طراحی مخصوص فعالیت‌های ورزشی با پشتیبانی بالا. پارچه‌ی تنفس‌پذیر و ضد تعریق، مناسب یوگا، پیلاتس و تمرینات روزانه.",
    composition: "۷۵٪ نایلون، ۲۵٪ الاستین. پارچه‌ی Dry-Tech.",
    origin: "طراحی و دوخت در تهران.",
    basePrice: 890000,
    colors: ["black","navy","beige"],
    badges: ["new"],
    rating: 4.8, reviewCount: 156,
    secondaryGradient: "deep",
    trending: true,
  }),
  bra("minimal-line", {
    name: "سوتین مینیمال T-shirt «خط»",
    short: "بدون خط زیر لباس",
    long: "طراحی کاملاً یکدست، مناسب زیر لباس‌های چسبان و T-shirt. کاپ‌های بدون درز با لبه‌ی مدرج.",
    composition: "۷۸٪ نایلون، ۲۲٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 590000,
    colors: ["beige","black","white"],
    badges: ["restocked"],
    rating: 4.7, reviewCount: 203,
    secondaryGradient: "oat",
  }),
  bra("romantic-hours", {
    name: "سوتین مخمل «شراب»",
    short: "مخمل نرم با لمس لوکس",
    long: "ترکیب مخمل و توری برای لحظه‌های خاص. طرح‌های ظریف با بندهای قابل تنظیم و گیره‌ی استیل ضد زنگ.",
    composition: "۶۰٪ مخمل مصنوعی، ۳۰٪ پلی‌استر، ۱۰٪ الاستین.",
    origin: "طراحی ایرانی، دوخت تهران.",
    basePrice: 1390000,
    colors: ["burgundy","black","navy"],
    badges: ["limited","exclusive"],
    rating: 4.9, reviewCount: 47,
    secondaryGradient: "deep",
    editorial: true,
  }),

  // ── 9 BRIEFS ────────────────────────────────────────────────
  briefs("soft-essentials", {
    name: "شورت نخی «ابریشم»",
    short: "شورت روزانه با لمس ابریشم",
    long: "شورت نخی با کش لطیف و دوخت صاف، مناسب استفاده‌ی روزانه. برش بیکینی با پوشش متوسط.",
    composition: "۹۵٪ پنبه، ۵٪ الاستین.",
    origin: "تولید در اصفهان.",
    basePrice: 290000,
    colors: ["beige","black","white","rose"],
    badges: ["new","restocked"],
    rating: 4.9, reviewCount: 312,
    secondaryGradient: "oat",
    featured: true, trending: true,
  }),
  briefs("summer-escape", {
    name: "شورت نخی «نسیم»",
    short: "شورت تنفس‌پذیر تابستانی",
    long: "پارچه‌ی ۱۰۰٪ نخ پنبه با بافت ویژه‌ی تابستانی. لبه‌های نرم بدون کش سفت.",
    composition: "۱۰۰٪ پنبه ارگانیک.",
    origin: "تولید در گیلان.",
    basePrice: 250000,
    colors: ["white","beige","rose"],
    badges: ["new"],
    rating: 4.7, reviewCount: 89,
    secondaryGradient: "mist",
  }),
  briefs("midnight-collection", {
    name: "شورت توری «شب»",
    short: "شورت توری با طرح‌های ظریف",
    long: "توری فرانسوی با طراحی ساده و شیک. مناسب ست‌های شب.",
    composition: "۷۰٪ پلی‌استر، ۳۰٪ نایلون.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 490000,
    colors: ["black","burgundy","navy"],
    badges: ["editorial"],
    rating: 4.8, reviewCount: 64,
    secondaryGradient: "deep",
  }),
  briefs("premium-lace", {
    name: "شورت توری فانتزی «مات»",
    short: "شورت توری فرانسوی",
    long: "توری Calais با تزئینات ابریشمی. پوشش متوسط با طراحی مجلسی.",
    composition: "۶۵٪ پلی‌استر، ۳۵٪ نایلون.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 590000,
    colors: ["beige","rose","black"],
    badges: ["limited","editorial"],
    rating: 4.9, reviewCount: 41,
    secondaryGradient: "rose",
    editorial: true,
  }),
  briefs("daily-comfort", {
    name: "شورت بیکینی «روزمره»",
    short: "شورت ساده برای استفاده‌ی روزانه",
    long: "برش بیکینی کلاسیک با پارچه‌ی نرم. کش راحت بدون ایجاد فشار.",
    composition: "۹۰٪ پنبه، ۱۰٪ الاستین.",
    origin: "تولید در تهران.",
    basePrice: 220000,
    colors: ["beige","black","white","rose"],
    badges: ["restocked"],
    rating: 4.6, reviewCount: 245,
    secondaryGradient: "oat",
  }),
  briefs("silk-stories", {
    name: "شورت ابریشمی «ابریشم خالص»",
    short: "ابریشم خالص mulberry",
    long: "ابریشم طبیعی mulberry با لمس بسیار نرم. طرح ساده و شیک برای لحظه‌های خاص.",
    composition: "۱۰۰٪ ابریشم mulberry.",
    origin: "پارچه چینی، دوخت ایران.",
    basePrice: 890000,
    colors: ["beige","rose","white"],
    badges: ["editorial","exclusive"],
    rating: 4.9, reviewCount: 28,
    secondaryGradient: "rose",
    featured: true, editorial: true,
  }),
  briefs("minimal-line", {
    name: "شورت بدون درز «بی‌صدا»",
    short: "بدون درز، مناسب لباس‌های چسبان",
    long: "شورت کاملاً بدون درز با لبه‌های برش لیزری. مناسب لباس‌های چسبان و مهمانی‌های خاص.",
    composition: "۷۰٪ نایلون، ۳۰٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 390000,
    colors: ["beige","black","white"],
    badges: ["new"],
    rating: 4.7, reviewCount: 113,
    secondaryGradient: "mist",
  }),
  briefs("heritage-edition", {
    name: "شورت قدیمی ایرانی «میراث»",
    short: "طرح سنتی با ظرافت مدرن",
    long: "الهام‌گرفته از طرح‌های سنتی ایرانی با ظرافت مدرن. پارچه‌ی نخی با گلدوزی‌های دستی.",
    composition: "۹۰٪ پنبه، ۱۰٪ ابریشم.",
    origin: "طراحی اصفهان، گلدوزی یزد.",
    basePrice: 690000,
    colors: ["beige","rose","navy"],
    badges: ["editorial","exclusive"],
    rating: 4.8, reviewCount: 32,
    secondaryGradient: "oat",
    editorial: true,
  }),
  briefs("spring-elegance", {
    name: "شورت کم‌عرض «سفید»",
    short: "طرح کلاسیک با رنگ سفید",
    long: "برش کم‌عرض با پارچه‌ی نخی مرغوب. مناسب لباس‌های روشن و روزهای گرم.",
    composition: "۱۰۰٪ پنبه.",
    origin: "تولید در اصفهان.",
    basePrice: 270000,
    colors: ["white","beige"],
    badges: ["new"],
    rating: 4.6, reviewCount: 78,
    secondaryGradient: "mist",
  }),

  // ── 9 SETS ──────────────────────────────────────────────────
  sets("soft-essentials", {
    name: "ست روزانه «طبیعت»",
    short: "ست ساده با رنگ‌های طبیعی",
    long: "ست کامل سوتین و شورت از جنس میکروفایبر. رنگ‌های بژ و سفید، مناسب استفاده‌ی روزانه.",
    composition: "۸۵٪ نایلون، ۱۵٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 890000, compareAt: 1090000,
    colors: ["beige","white","rose"],
    badges: ["new","editorial"],
    rating: 4.8, reviewCount: 142,
    secondaryGradient: "oat",
    featured: true, trending: true,
  }),
  sets("bridal-moments", {
    name: "ست عروس «رویا»",
    short: "ست عروس با توری فرانسوی",
    long: "ست کامل با توری Calais فرانسوی و ساتن ابریشمی. مناسب شب عروسی و ماه عسل.",
    composition: "۶۰٪ پلی‌استر، ۳۰٪ نایلون، ۱۰٪ ابریشم.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 2490000,
    colors: ["white","beige","rose"],
    badges: ["limited","exclusive"],
    rating: 4.9, reviewCount: 28,
    secondaryGradient: "oat",
    featured: true, editorial: true,
  }),
  sets("midnight-collection", {
    name: "ست مخمل «نیمه‌شب»",
    short: "ست مخمل با رنگ‌های عمیق",
    long: "ست کامل با مخمل نرم و تزئینات فلزی. برای لحظه‌های خاص.",
    composition: "۶۰٪ مخمل مصنوعی، ۴۰٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 1490000,
    colors: ["black","burgundy","navy"],
    badges: ["exclusive","editorial"],
    rating: 4.9, reviewCount: 36,
    secondaryGradient: "deep",
  }),
  sets("premium-lace", {
    name: "ست توری «مات لوکس»",
    short: "توری Chantilly با کیفیت فرانسوی",
    long: "ست کامل از توری Chantilly فرانسوی. دوخت‌های دستی با ظرافت بالا.",
    composition: "۶۸٪ پلی‌استر، ۳۲٪ نایلون.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 1890000, compareAt: 2190000,
    colors: ["beige","rose","black"],
    badges: ["limited","editorial"],
    rating: 4.9, reviewCount: 47,
    secondaryGradient: "rose",
    editorial: true,
  }),
  sets("spring-elegance", {
    name: "ست بهاره «شکوفه»",
    short: "ست بهاره با رنگ‌های شاد",
    long: "ست کامل با رنگ‌های بهاری و طرح‌های گلدار. مناسب فصل شکوفایی.",
    composition: "۷۰٪ پنبه، ۲۰٪ نایلون، ۱۰٪ الاستین.",
    origin: "تولید در اصفهان.",
    basePrice: 990000,
    colors: ["rose","beige","white"],
    badges: ["new"],
    rating: 4.7, reviewCount: 63,
    secondaryGradient: "rose",
    trending: true,
  }),
  sets("silk-stories", {
    name: "ست ابریشمی «داستان»",
    short: "ابریشم mulberry خالص",
    long: "ست کامل از ابریشم mulberry ۱۰۰٪. لمس بسیار نرم و ظاهر لوکس.",
    composition: "۱۰۰٪ ابریشم mulberry.",
    origin: "پارچه چینی، دوخت ایران.",
    basePrice: 2290000,
    colors: ["beige","rose","white"],
    badges: ["exclusive","editorial"],
    rating: 4.9, reviewCount: 21,
    secondaryGradient: "rose",
    featured: true,
  }),
  sets("daily-comfort", {
    name: "ست راحتی «زندگی»",
    short: "ست روزمره با حداکثر راحتی",
    long: "ست روزمره با پارچه‌ی تنفس‌پذیر و کش‌های نرم. مناسب استفاده‌ی طولانی.",
    composition: "۸۵٪ پنبه، ۱۵٪ الاستین.",
    origin: "تولید در اصفهان.",
    basePrice: 690000,
    colors: ["beige","black","white","rose"],
    badges: ["restocked"],
    rating: 4.7, reviewCount: 187,
    secondaryGradient: "oat",
  }),
  sets("minimal-line", {
    name: "ست مینیمال «خط سفید»",
    short: "ست ساده با رنگ سفید",
    long: "ست کاملاً مینیمال با رنگ سفید خالص. مناسب سلیقه‌های ساده‌پسند.",
    composition: "۷۸٪ نایلون، ۲۲٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 790000,
    colors: ["white","beige"],
    badges: ["new"],
    rating: 4.6, reviewCount: 92,
    secondaryGradient: "mist",
  }),
  sets("romantic-hours", {
    name: "ست عاشقانه «شراب و مخمل»",
    short: "مخمل شرابی با تزئینات طلایی",
    long: "ست کامل از مخمل شرابی با تزئینات طلایی ظریف. مناسب هدیه‌ی ولنتاین و سالگرد.",
    composition: "۶۰٪ مخمل، ۳۰٪ پلی‌استر، ۱۰٪ الاستین.",
    origin: "طراحی ایرانی، دوخت تهران.",
    basePrice: 1690000,
    colors: ["burgundy","black","navy"],
    badges: ["limited","exclusive"],
    rating: 4.8, reviewCount: 39,
    secondaryGradient: "deep",
    editorial: true,
  }),

  // ── 9 SLEEPWEAR ─────────────────────────────────────────────
  sleepwear("silk-stories", {
    name: "پیراهن خواب ابریشمی «مهتاب»",
    short: "ابریشم خالص با لمس نرم",
    long: "پیراهن خواب بلند از ابریشم mulberry خالص. لمس بسیار نرم و ظاهر لوکس.",
    composition: "۱۰۰٪ ابریشم mulberry.",
    origin: "پارچه چینی، دوخت ایران.",
    basePrice: 2290000, compareAt: 2590000,
    colors: ["beige","rose","white"],
    badges: ["new","editorial"],
    rating: 4.9, reviewCount: 64,
    secondaryGradient: "rose",
    featured: true, trending: true, editorial: true,
  }),
  sleepwear("silk-stories", {
    name: "ست ابریشمی «شب آرام»",
    short: "ست دو تکه ابریشمی",
    long: "ست دو تکه ابریشمی شامل پیراهن بلند و شلوار راحتی. مناسب خواب و استراحت.",
    composition: "۱۰۰٪ ابریشم mulberry.",
    origin: "پارچه چینی، دوخت ایران.",
    basePrice: 2890000,
    colors: ["beige","rose","navy"],
    badges: ["editorial","exclusive"],
    rating: 4.9, reviewCount: 38,
    secondaryGradient: "rose",
    editorial: true,
  }),
  sleepwear("summer-escape", {
    name: "پیراهن خواب نخی «تابستانه»",
    short: "پیراهن خواب نخی خنک",
    long: "پیراهن خواب نخی با برش آزاد، مناسب شب‌های گرم تابستان.",
    composition: "۱۰۰٪ پنبه ارگانیک.",
    origin: "تولید در گیلان.",
    basePrice: 790000,
    colors: ["white","beige","rose"],
    badges: ["new"],
    rating: 4.7, reviewCount: 96,
    secondaryGradient: "mist",
  }),
  sleepwear("bridal-moments", {
    name: "پیراهن خواب عروس «رویایی»",
    short: "پیراهن خواب ماه عسل",
    long: "پیراهن خواب سفید با توری ظریف، مناسب ماه عسل و شب‌های خاص.",
    composition: "۸۰٪ ابریشم، ۲۰٪ توری.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 1890000,
    colors: ["white","beige"],
    badges: ["limited","exclusive"],
    rating: 4.9, reviewCount: 27,
    secondaryGradient: "oat",
    featured: true,
  }),
  sleepwear("minimal-line", {
    name: "پیراهن خواب ساده «خط»",
    short: "برش مینیمال و رنگ خنثی",
    long: "پیراهن خواب با برش ساده و رنگ‌های خنثی. مناسب سلیقه‌ی مینیمال.",
    composition: "۸۵٪ ویسکوز، ۱۵٪ سیلک.",
    origin: "دوخت در تهران.",
    basePrice: 690000,
    colors: ["beige","white","rose"],
    badges: ["restocked"],
    rating: 4.6, reviewCount: 84,
    secondaryGradient: "mist",
  }),
  sleepwear("lounge-edition", {
    name: "ست خواب «خانه‌نشینی»",
    short: "ست خواب راحت برای خانه",
    long: "ست دو تکه راحت شامل تاپ و شلوار کوتاه. مناسب استراحت در خانه.",
    composition: "۹۰٪ پنبه، ۱۰٪ الاستین.",
    origin: "تولید در تهران.",
    basePrice: 890000,
    colors: ["beige","rose","white"],
    badges: ["new","restocked"],
    rating: 4.8, reviewCount: 122,
    secondaryGradient: "oat",
    trending: true,
  }),
  sleepwear("midnight-collection", {
    name: "پیراهن خواب مخمل «نیمه‌شب»",
    short: "مخمل مشکی با جزئیات فلزی",
    long: "پیراهن خواب مخمل مشکی با دکمه‌های فلزی طلایی. مناسب فصل سرما.",
    composition: "۸۰٪ مخمل مصنوعی، ۲۰٪ ابریشم.",
    origin: "دوخت در تهران.",
    basePrice: 1490000,
    colors: ["black","navy","burgundy"],
    badges: ["exclusive","editorial"],
    rating: 4.9, reviewCount: 41,
    secondaryGradient: "deep",
  }),
  sleepwear("spring-elegance", {
    name: "پیراهن خواب بهاره «شکوفه»",
    short: "رنگ‌های بهاری با گلدوزی",
    long: "پیراهن خواب با رنگ‌های بهاری و گلدوزی‌های ظریف. مناسب فصل شکوفایی.",
    composition: "۷۰٪ ویسکوز، ۳۰٪ پنبه.",
    origin: "تولید در اصفهان.",
    basePrice: 990000,
    colors: ["rose","beige","white"],
    badges: ["new"],
    rating: 4.7, reviewCount: 53,
    secondaryGradient: "rose",
  }),
  sleepwear("heritage-edition", {
    name: "پیراهن خواب سنتی ایرانی «مینابت»",
    short: "طرح ایرانی با ظرافت امروزی",
    long: "پیراهن خواب با طرح‌های الهام‌گرفته از مینابت‌های ایرانی. ترکیب سنت و مدرنیته.",
    composition: "۸۵٪ ویسکوز، ۱۵٪ ابریشم.",
    origin: "طراحی اصفهان، دوخت تهران.",
    basePrice: 1190000,
    colors: ["beige","rose","navy"],
    badges: ["editorial","exclusive"],
    rating: 4.8, reviewCount: 31,
    secondaryGradient: "oat",
    editorial: true,
  }),

  // ── 9 LOUNGEWEAR ────────────────────────────────────────────
  loungewear("lounge-edition", {
    name: "ست راحتی خانگی «صبحانه»",
    short: "ست راحتی برای صبحانه",
    long: "ست راحتی شامل تاپ بلند و شلوار راحت. مناسب دورهمی‌های صبحانه در خانه.",
    composition: "۹۰٪ پنبه، ۱۰٪ الاستین.",
    origin: "تولید در تهران.",
    basePrice: 990000,
    colors: ["beige","white","rose"],
    badges: ["new","restocked"],
    rating: 4.8, reviewCount: 156,
    secondaryGradient: "oat",
    featured: true, trending: true,
  }),
  loungewear("summer-escape", {
    name: "روپوش نخی «ساحل»",
    short: "روپوش نخی برای ساحل",
    long: "روپوش بلند از پارچه‌ی نخی تنفس‌پذیر، مناسب ساحل و استخر. برش آزاد با کمربند.",
    composition: "۱۰۰٪ پنبه.",
    origin: "تولید در گیلان.",
    basePrice: 890000,
    colors: ["white","beige","rose"],
    badges: ["new"],
    rating: 4.7, reviewCount: 92,
    secondaryGradient: "mist",
  }),
  loungewear("silk-stories", {
    name: "روپوش ابریشمی «شاهزاده»",
    short: "روپوش ابریشمی برای خانه",
    long: "روپوش بلند از ابریشم mulberry خالص. لمس نرم و ظاهر لوکس برای صبح‌های خاص.",
    composition: "۱۰۰٪ ابریشم mulberry.",
    origin: "پارچه چینی، دوخت ایران.",
    basePrice: 1990000,
    colors: ["beige","rose","navy"],
    badges: ["exclusive","editorial"],
    rating: 4.9, reviewCount: 38,
    secondaryGradient: "rose",
    featured: true, editorial: true,
  }),
  loungewear("daily-comfort", {
    name: "ست راحتی «زندگی آرام»",
    short: "ست روزمره راحت",
    long: "ست راحتی ساده با پارچه‌ی نرم و تنفس‌پذیر. مناسب استفاده‌ی روزانه.",
    composition: "۸۵٪ پنبه، ۱۵٪ الاستین.",
    origin: "تولید در تهران.",
    basePrice: 790000,
    colors: ["beige","black","white"],
    badges: ["restocked"],
    rating: 4.7, reviewCount: 134,
    secondaryGradient: "oat",
  }),
  loungewear("premium-lace", {
    name: "روپوش توری «لمس لوکس»",
    short: "روپوش بلند با توری فرانسوی",
    long: "روپوش نیمه‌شفاف از توری فرانسوی. مناسب لحظه‌های خاص.",
    composition: "۸۰٪ نایلون، ۲۰٪ الاستین.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 1690000,
    colors: ["black","burgundy","navy"],
    badges: ["limited","editorial"],
    rating: 4.8, reviewCount: 28,
    secondaryGradient: "deep",
  }),
  loungewear("minimal-line", {
    name: "ست ساده «سفید مینیمال»",
    short: "ست ساده با رنگ سفید",
    long: "ست دو تکه با رنگ سفید و برش مینیمال. برای سلیقه‌های ساده‌پسند.",
    composition: "۷۵٪ ویسکوز، ۲۵٪ پنبه.",
    origin: "دوخت در تهران.",
    basePrice: 690000,
    colors: ["white","beige"],
    badges: ["new"],
    rating: 4.6, reviewCount: 67,
    secondaryGradient: "mist",
  }),
  loungewear("spring-elegance", {
    name: "روپوش بهاره «شکوفه»",
    short: "روپوش با رنگ‌های بهاری",
    long: "روپوش بلند با رنگ‌های شاد بهاری و دوخت‌های ظریف.",
    composition: "۸۰٪ پنبه، ۲۰٪ ویسکوز.",
    origin: "تولید در اصفهان.",
    basePrice: 1190000,
    colors: ["rose","beige","white"],
    badges: ["new"],
    rating: 4.7, reviewCount: 51,
    secondaryGradient: "rose",
    trending: true,
  }),
  loungewear("heritage-edition", {
    name: "روپوش سنتی ایرانی «باغ ایرانی»",
    short: "طرح‌های الهام‌گرفته از باغ ایرانی",
    long: "روپوش بلند با طرح‌های گلدار الهام‌گرفته از باغ‌های ایرانی. ترکیب سنت و مدرنیته.",
    composition: "۸۵٪ ویسکوز، ۱۵٪ ابریشم.",
    origin: "طراحی اصفهان، دوخت تهران.",
    basePrice: 1390000,
    colors: ["rose","beige","navy"],
    badges: ["editorial","exclusive"],
    rating: 4.8, reviewCount: 32,
    secondaryGradient: "rose",
    editorial: true,
  }),
  loungewear("midnight-collection", {
    name: "روپوش مخمل «شب‌نشینی»",
    short: "روپوش مخمل برای شب‌های سرد",
    long: "روپوش بلند از مخمل نرم. مناسب شب‌های سرد زمستان و دورهمی‌های خانگی.",
    composition: "۸۰٪ مخمل مصنوعی، ۲۰٪ ابریشم.",
    origin: "دوخت در تهران.",
    basePrice: 1490000,
    colors: ["burgundy","black","navy"],
    badges: ["exclusive"],
    rating: 4.9, reviewCount: 47,
    secondaryGradient: "deep",
  }),

  // ── 9 BODYSUITS ─────────────────────────────────────────────
  bodysuits("spring-elegance", {
    name: "بادی توری «شکوفه»",
    short: "بادی با توری ظریف",
    long: "بادی با توری فرانسوی و برش چسبان. مناسب ست کردن با شلوار و دامن.",
    composition: "۷۵٪ نایلون، ۲۵٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 1190000, compareAt: 1390000,
    colors: ["beige","rose","black"],
    badges: ["new","editorial"],
    rating: 4.8, reviewCount: 78,
    secondaryGradient: "rose",
    featured: true, trending: true, editorial: true,
  }),
  bodysuits("minimal-line", {
    name: "بادی مینیمال «خط ساده»",
    short: "بادی ساده با برش مینیمال",
    long: "بادی با برش ساده و رنگ خنثی. مناسب استفاده‌ی روزانه و ست کردن.",
    composition: "۸۰٪ نایلون، ۲۰٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 890000,
    colors: ["beige","white","black"],
    badges: ["restocked"],
    rating: 4.7, reviewCount: 134,
    secondaryGradient: "mist",
  }),
  bodysuits("silk-stories", {
    name: "بادی ابریشمی «لمس نرم»",
    short: "بادی ابریشمی با لمس نرم",
    long: "بادی بلند از ابریشم mulberry خالص. لمس بسیار نرم و ظاهر لوکس.",
    composition: "۱۰۰٪ ابریشم mulberry.",
    origin: "پارچه چینی، دوخت ایران.",
    basePrice: 1690000,
    colors: ["beige","rose","white"],
    badges: ["editorial","exclusive"],
    rating: 4.9, reviewCount: 46,
    secondaryGradient: "rose",
    editorial: true,
  }),
  bodysuits("midnight-collection", {
    name: "بادی مخمل «نیمه‌شب»",
    short: "بادی مخمل با رنگ‌های عمیق",
    long: "بادی بلند از مخمل نرم با رنگ‌های عمیق. مناسب مجالس و شب‌های خاص.",
    composition: "۸۰٪ مخمل مصنوعی، ۲۰٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 1290000,
    colors: ["black","burgundy","navy"],
    badges: ["exclusive","editorial"],
    rating: 4.9, reviewCount: 38,
    secondaryGradient: "deep",
  }),
  bodysuits("premium-lace", {
    name: "بادی توری لوکس «مات»",
    short: "توری Chantilly فرانسوی",
    long: "بادی از توری Chantilly با دوخت‌های دستی. مناسب مجالس رسمی.",
    composition: "۷۰٪ پلی‌استر، ۳۰٪ نایلون.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 1790000, compareAt: 2090000,
    colors: ["beige","rose","black"],
    badges: ["limited","editorial"],
    rating: 4.9, reviewCount: 31,
    secondaryGradient: "rose",
    featured: true,
  }),
  bodysuits("daily-comfort", {
    name: "بادی روزانه «راحت»",
    short: "بادی ساده برای استفاده‌ی روزانه",
    long: "بادی با پارچه‌ی نخی و کش راحت. مناسب استفاده‌ی روزانه.",
    composition: "۹۰٪ پنبه، ۱۰٪ الاستین.",
    origin: "تولید در تهران.",
    basePrice: 690000,
    colors: ["beige","black","white"],
    badges: ["restocked"],
    rating: 4.6, reviewCount: 187,
    secondaryGradient: "oat",
  }),
  bodysuits("romantic-hours", {
    name: "بادی عاشقانه «شراب»",
    short: "بادی مخمل شرابی",
    long: "بادی بلند از مخمل شرابی با تزئینات طلایی. مناسب لحظه‌های خاص.",
    composition: "۸۰٪ مخمل، ۲۰٪ ابریشم.",
    origin: "دوخت در تهران.",
    basePrice: 1490000,
    colors: ["burgundy","black","navy"],
    badges: ["limited","exclusive"],
    rating: 4.8, reviewCount: 28,
    secondaryGradient: "deep",
    editorial: true,
  }),
  bodysuits("heritage-edition", {
    name: "بادی سنتی ایرانی «گلستان»",
    short: "بادی با طرح‌های ایرانی",
    long: "بادی با طرح‌های گلدار الهام‌گرفته از گلستان سعدی. ترکیب سنت و ظرافت.",
    composition: "۸۰٪ ویسکوز، ۲۰٪ ابریشم.",
    origin: "طراحی اصفهان، دوخت تهران.",
    basePrice: 1290000,
    colors: ["beige","rose","navy"],
    badges: ["editorial","exclusive"],
    rating: 4.8, reviewCount: 24,
    secondaryGradient: "rose",
  }),
  bodysuits("summer-escape", {
    name: "بادی نخی «تابستانه»",
    short: "بادی نخی برای روزهای گرم",
    long: "بادی از پارچه‌ی نخی ۱۰۰٪ با بافت تنفس‌پذیر، مناسب تابستان.",
    composition: "۱۰۰٪ پنبه.",
    origin: "تولید در گیلان.",
    basePrice: 590000,
    colors: ["white","beige","rose"],
    badges: ["new"],
    rating: 4.7, reviewCount: 89,
    secondaryGradient: "mist",
  }),

  // ── 9 SHAPEWEAR ─────────────────────────────────────────────
  shapewear("daily-comfort", {
    name: "گن شکم «آرامش»",
    short: "گن شکم با فشار متوسط",
    long: "گن شکم با فشار متوسط و پارچه‌ی تنفس‌پذیر. فرم‌دهی طبیعی بدون ایجاد ناراحتی.",
    composition: "۸۰٪ نایلون، ۲۰٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 990000,
    colors: ["beige","black","white"],
    badges: ["new","restocked"],
    rating: 4.7, reviewCount: 213,
    secondaryGradient: "oat",
    featured: true, trending: true,
  }),
  shapewear("daily-comfort", {
    name: "گن ساده «روزمره»",
    short: "گن روزمره با فشار کم",
    long: "گن ساده برای استفاده‌ی روزانه با فشار کم. مناسب لباس‌های چسبان.",
    composition: "۷۸٪ نایلون، ۲۲٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 690000,
    colors: ["beige","black"],
    badges: ["restocked"],
    rating: 4.6, reviewCount: 156,
    secondaryGradient: "oat",
  }),
  shapewear("silk-stories", {
    name: "گن ابریشمی «لمس نرم»",
    short: "گن ابریشمی برای راحتی",
    long: "گن با لایه‌ی ابریشمی برای راحتی بیشتر. مناسب استفاده‌ی طولانی.",
    composition: "۷۰٪ نایلون، ۳۰٪ ابریشم.",
    origin: "دوخت در تهران.",
    basePrice: 1390000,
    colors: ["beige","white"],
    badges: ["editorial","exclusive"],
    rating: 4.8, reviewCount: 51,
    secondaryGradient: "rose",
    featured: true, editorial: true,
  }),
  shapewear("minimal-line", {
    name: "گن بی‌صدا «بدون خط»",
    short: "گن بدون خط زیر لباس",
    long: "گن کاملاً صاف بدون درز، مناسب لباس‌های چسبان و مهمانی.",
    composition: "۷۵٪ نایلون، ۲۵٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 890000,
    colors: ["beige","black","white"],
    badges: ["new"],
    rating: 4.8, reviewCount: 124,
    secondaryGradient: "mist",
  }),
  shapewear("summer-escape", {
    name: "گن نخی «تابستانه»",
    short: "گن نخی خنک",
    long: "گن از پارچه‌ی نخی تنفس‌پذیر، مناسب روزهای گرم تابستان.",
    composition: "۹۰٪ پنبه، ۱۰٪ الاستین.",
    origin: "تولید در گیلان.",
    basePrice: 790000,
    colors: ["white","beige"],
    badges: ["new"],
    rating: 4.6, reviewCount: 67,
    secondaryGradient: "mist",
  }),
  shapewear("bridal-moments", {
    name: "گن عروس «فرم‌دهی ویژه»",
    short: "گن مخصوص لباس عروس",
    long: "گن با فرم‌دهی قوی و پارچه‌ی نرم، مخصوص لباس‌های عروسی.",
    composition: "۸۰٪ نایلون، ۲۰٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 1490000,
    colors: ["beige","white"],
    badges: ["limited","editorial"],
    rating: 4.9, reviewCount: 31,
    secondaryGradient: "oat",
  }),
  shapewear("daily-comfort", {
    name: "گن ساق «پای بلند»",
    short: "گن ساق بلند برای شلوار",
    long: "گن بلند با ساق تا بالای زانو، مناسب شلوارهای چسبان.",
    composition: "۷۵٪ نایلون، ۲۵٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 1190000,
    colors: ["beige","black"],
    badges: ["restocked"],
    rating: 4.7, reviewCount: 98,
    secondaryGradient: "oat",
  }),
  shapewear("premium-lace", {
    name: "گن توری «فرم‌دهی لوکس»",
    short: "گن توری فرانسوی",
    long: "گن از توری فرانسوی با فرم‌دهی متوسط. ترکیب زیبایی و راحتی.",
    composition: "۶۰٪ نایلون، ۴۰٪ الاستین.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 1690000,
    colors: ["beige","rose","black"],
    badges: ["limited","editorial"],
    rating: 4.8, reviewCount: 42,
    secondaryGradient: "rose",
    editorial: true,
  }),
  shapewear("minimal-line", {
    name: "گن T-shirt «بدون خط»",
    short: "گن مناسب T-shirt",
    long: "گن کوتاه مناسب T-shirtهای چسبان. بدون ایجاد خط در ناحیه‌ی کمر.",
    composition: "۷۰٪ نایلون، ۳۰٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 590000,
    colors: ["beige","black","white"],
    badges: ["new"],
    rating: 4.6, reviewCount: 76,
    secondaryGradient: "mist",
  }),

  // ── 9 SPORTSWEAR ────────────────────────────────────────────
  sportswear("daily-comfort", {
    name: "سوتین ورزشی «پویا»",
    short: "پشتیبانی بالا برای ورزش",
    long: "سوتین ورزشی با پشتیبانی بالا و پارچه‌ی Dry-Tech. مناسب یوگا و تمرینات روزانه.",
    composition: "۷۵٪ نایلون، ۲۵٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 890000, compareAt: 1090000,
    colors: ["black","navy","beige","rose"],
    badges: ["new","restocked"],
    rating: 4.8, reviewCount: 312,
    secondaryGradient: "deep",
    featured: true, trending: true,
  }),
  sportswear("daily-comfort", {
    name: "سوتین ورزشی «سبک»",
    short: "پشتیبانی متوسط",
    long: "سوتین ورزشی با پشتیبانی متوسط، مناسب پیاده‌روی و ورزش‌های سبک.",
    composition: "۸۰٪ نایلون، ۲۰٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 690000,
    colors: ["black","beige","white","rose"],
    badges: ["restocked"],
    rating: 4.7, reviewCount: 187,
    secondaryGradient: "oat",
  }),
  sportswear("daily-comfort", {
    name: "شورت ورزشی «پویا»",
    short: "شورت ورزشی با کش راحت",
    long: "شورت ورزشی با کش راحت و پارچه‌ی تنفس‌پذیر. مناسب فعالیت‌های ورزشی.",
    composition: "۸۵٪ نایلون، ۱۵٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 390000,
    colors: ["black","navy","beige"],
    badges: ["new"],
    rating: 4.7, reviewCount: 156,
    secondaryGradient: "deep",
  }),
  sportswear("summer-escape", {
    name: "تاپ ورزشی «یوگا»",
    short: "تاپ یوگا با پارچه‌ی تنفس‌پذیر",
    long: "تاپ ورزشی با پارچه‌ی نخی و تنفس‌پذیر، مناسب یوگا و پیلاتس.",
    composition: "۸۰٪ نایلون، ۲۰٪ پنبه.",
    origin: "دوخت در تهران.",
    basePrice: 590000,
    colors: ["white","beige","rose"],
    badges: ["new"],
    rating: 4.6, reviewCount: 89,
    secondaryGradient: "mist",
  }),
  sportswear("summer-escape", {
    name: "شلوارک ورزشی «راحت»",
    short: "شلوارک ورزشی با کش راحت",
    long: "شلوارک ورزشی از پارچه‌ی تنفس‌پذیر با کش راحت. مناسب تمرینات خانگی.",
    composition: "۸۵٪ پنبه، ۱۵٪ الاستین.",
    origin: "تولید در تهران.",
    basePrice: 490000,
    colors: ["beige","black","white"],
    badges: ["restocked"],
    rating: 4.7, reviewCount: 124,
    secondaryGradient: "oat",
  }),
  sportswear("minimal-line", {
    name: "ست ورزشی «ساده»",
    short: "ست ورزشی با رنگ‌های خنثی",
    long: "ست ورزشی ساده شامل تاپ و شلوارک، با رنگ‌های خنثی.",
    composition: "۸۰٪ نایلون، ۲۰٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 990000,
    colors: ["black","beige","white"],
    badges: ["new"],
    rating: 4.7, reviewCount: 71,
    secondaryGradient: "mist",
    trending: true,
  }),
  sportswear("spring-elegance", {
    name: "تاپ ورزشی «شکوفه»",
    short: "تاپ ورزشی با رنگ‌های بهاری",
    long: "تاپ ورزشی با رنگ‌های شاد بهاری و پارچه‌ی تنفس‌پذیر.",
    composition: "۷۵٪ نایلون، ۲۵٪ پنبه.",
    origin: "دوخت در تهران.",
    basePrice: 690000,
    colors: ["rose","beige","white"],
    badges: ["new"],
    rating: 4.6, reviewCount: 53,
    secondaryGradient: "rose",
  }),
  sportswear("premium-lace", {
    name: "ست ورزشی «لوکس»",
    short: "ست ورزشی با پارچه‌ی لوکس",
    long: "ست ورزشی از پارچه‌ی با کیفیت با طرح‌های ظریف. مناسب ورزش‌های لوکس.",
    composition: "۸۰٪ نایلون، ۲۰٪ ابریشم.",
    origin: "دوخت در تهران.",
    basePrice: 1290000,
    colors: ["black","beige","rose"],
    badges: ["limited","editorial"],
    rating: 4.8, reviewCount: 38,
    secondaryGradient: "rose",
    editorial: true,
  }),
  sportswear("daily-comfort", {
    name: "سوتین ورزشی «حرفه‌ای»",
    short: "پشتیبانی حرفه‌ای برای ورزش سنگین",
    long: "سوتین ورزشی حرفه‌ای با پشتیبانی بسیار بالا. مناسب دویدن و ورزش‌های سنگین.",
    composition: "۷۰٪ نایلون، ۳۰٪ الاستین.",
    origin: "دوخت در تهران.",
    basePrice: 1090000,
    colors: ["black","navy"],
    badges: ["new"],
    rating: 4.9, reviewCount: 87,
    secondaryGradient: "deep",
  }),

  // ── 9 ACCESSORIES ───────────────────────────────────────────
  accessories("silk-stories", {
    name: "روبالن ابریشمی «ابریشم خالص»",
    short: "روبالن ابریشمی mulberry",
    long: "روبالن بلند از ابریشم mulberry خالص. مناسب خواب و محافظت از مو.",
    composition: "۱۰۰٪ ابریشم mulberry.",
    origin: "پارچه چینی، دوخت ایران.",
    basePrice: 690000,
    colors: ["beige","rose","navy"],
    badges: ["new","editorial"],
    rating: 4.9, reviewCount: 76,
    secondaryGradient: "rose",
    featured: true, editorial: true,
  }),
  accessories("silk-stories", {
    name: "ماسک خواب ابریشمی «خواب آرام»",
    short: "ماسک خواب ابریشمی",
    long: "ماسک خواب از ابریشم طبیعی. کمک به خواب عمیق‌تر و محافظت از پوست.",
    composition: "۱۰۰٪ ابریشم mulberry.",
    origin: "پارچه چینی، دوخت ایران.",
    basePrice: 390000,
    colors: ["beige","rose","navy","black"],
    badges: ["new"],
    rating: 4.8, reviewCount: 142,
    secondaryGradient: "rose",
    trending: true,
  }),
  accessories("minimal-line", {
    name: "جوراب شلواری نازک «خط»",
    short: "جوراب شلواری ۱۵ denier",
    long: "جوراب شلواری بسیار نازک با رنگ‌های طبیعی. مناسب لباس‌های مجلسی.",
    composition: "۸۰٪ نایلون، ۲۰٪ الاستین.",
    origin: "تولید در تهران.",
    basePrice: 290000,
    colors: ["beige","black"],
    badges: ["restocked"],
    rating: 4.7, reviewCount: 198,
    secondaryGradient: "oat",
  }),
  accessories("minimal-line", {
    name: "بند ساق بلند «خط ساده»",
    short: "بند ساق بلند نازک",
    long: "بند ساق بلند و نازک برای استفاده‌ی روزانه. مناسب با کفش‌های مختلف.",
    composition: "۸۵٪ نایلون، ۱۵٪ الاستین.",
    origin: "تولید در تهران.",
    basePrice: 250000,
    colors: ["beige","black","white"],
    badges: ["restocked"],
    rating: 4.6, reviewCount: 124,
    secondaryGradient: "mist",
  }),
  accessories("premium-lace", {
    name: "گارتر توری «لمس لوکس»",
    short: "گارتر توری فرانسوی",
    long: "گارتر از توری فرانسوی با تزئینات ظریف. مناسب لحظه‌های خاص.",
    composition: "۷۰٪ نایلون، ۳۰٪ الاستین.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 590000,
    colors: ["black","rose","burgundy"],
    badges: ["limited","editorial"],
    rating: 4.9, reviewCount: 41,
    secondaryGradient: "deep",
    editorial: true,
  }),
  accessories("heritage-edition", {
    name: "کمربند ابریشمی «کمربند ایرانی»",
    short: "کمربند سنتی ایرانی",
    long: "کمربند ابریشمی با طرح‌های سنتی ایرانی. مناسب استفاده‌ی روزانه و مجالس.",
    composition: "۸۰٪ ابریشم، ۲۰٪ پنبه.",
    origin: "طراحی اصفهان، دوخت تهران.",
    basePrice: 590000,
    colors: ["beige","rose","navy"],
    badges: ["editorial","exclusive"],
    rating: 4.8, reviewCount: 28,
    secondaryGradient: "rose",
  }),
  accessories("summer-escape", {
    name: "کلاه حصیری «تابستانه»",
    short: "کلاه حصیری برای ساحل",
    long: "کلاه حصیری طبیعی با لبه‌ی پهن، مناسب ساحل و روزهای آفتابی.",
    composition: "۱۰۰٪ حصیر طبیعی.",
    origin: "تولید در جنوب ایران.",
    basePrice: 390000,
    colors: ["beige"],
    badges: ["new"],
    rating: 4.7, reviewCount: 67,
    secondaryGradient: "oat",
  }),
  accessories("midnight-collection", {
    name: "کیف لوازم آرایشی «لمس شب»",
    short: "کیف لوازم آرایشی مخمل",
    long: "کیف لوازم آرایشی از مخمل نرم با آستر داخلی ابریشمی.",
    composition: "۸۰٪ مخمل، ۲۰٪ ابریشم.",
    origin: "دوخت در تهران.",
    basePrice: 990000,
    colors: ["black","burgundy","navy"],
    badges: ["exclusive"],
    rating: 4.9, reviewCount: 51,
    secondaryGradient: "deep",
  }),
  accessories("minimal-line", {
    name: "شال ابریشمی «خط ساده»",
    short: "شال ابریشمی مینیمال",
    long: "شال بزرگ از ابریشم طبیعی با رنگ‌های خنثی. مناسب استفاده‌ی روزانه.",
    composition: "۱۰۰٪ ابریشم.",
    origin: "پارچه چینی، دوخت ایران.",
    basePrice: 1290000,
    colors: ["beige","white","rose"],
    badges: ["new","editorial"],
    rating: 4.8, reviewCount: 89,
    secondaryGradient: "mist",
    featured: true,
  }),

  // ── 9 BRIDAL ────────────────────────────────────────────────
  bridal("bridal-moments", {
    name: "ست عروسی «رویای کامل»",
    short: "ست عروسی با توری و ساتن",
    long: "ست کامل عروسی شامل سوتین توری، شورت، کمربند و جوراب. مناسب شب عروسی.",
    composition: "۸۰٪ ابریشم، ۲۰٪ توری فرانسوی.",
    origin: "پارچه فرانسوی، دوخت تهران.",
    basePrice: 3990000, compareAt: 4490000,
    colors: ["white","beige"],
    badges: ["limited","exclusive"],
    rating: 4.9, reviewCount: 24,
    secondaryGradient: "oat",
    featured: true, editorial: true,
  }),
  bridal("bridal-moments", {
    name: "پیراهن خواب عروس «ماه عسل»",
    short: "پیراهن ابریشمی عروس",
    long: "پیراهن خواب بلند و ظریف از ابریشم و توری، مناسب ماه عسل و شب‌های ویژه.",
    composition: "۹۰٪ ابریشم، ۱۰٪ توری.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 2890000,
    colors: ["white","beige","rose"],
    badges: ["limited","exclusive"],
    rating: 4.9, reviewCount: 19,
    secondaryGradient: "rose",
    featured: true,
  }),
  bridal("bridal-moments", {
    name: "روپوش عروس «ابریشم سفید»",
    short: "روپوش بلند عروس",
    long: "روپوش بلند از ابریشم سفید با تزئینات ظریف. مناسب صبح روز عروسی.",
    composition: "۱۰۰٪ ابریشم.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 2290000,
    colors: ["white"],
    badges: ["limited","exclusive"],
    rating: 4.9, reviewCount: 15,
    secondaryGradient: "oat",
  }),
  bridal("bridal-moments", {
    name: "سوتین عروس «مات سفید»",
    short: "سوتین توری عروس",
    long: "سوتین توری سفید با طراحی ظریف. مجموعه‌ی عروسی لونا.",
    composition: "۷۰٪ ابریشم، ۳۰٪ توری.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 1690000,
    colors: ["white","beige"],
    badges: ["limited","editorial"],
    rating: 4.9, reviewCount: 23,
    secondaryGradient: "rose",
    editorial: true,
  }),
  bridal("bridal-moments", {
    name: "شورت عروس «ابریشم خالص»",
    short: "شورت ابریشمی عروس",
    long: "شورت از ابریشم طبیعی با تزئینات توری. مجموعه‌ی عروسی لونا.",
    composition: "۱۰۰٪ ابریشم.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 1090000,
    colors: ["white","beige"],
    badges: ["limited","exclusive"],
    rating: 4.9, reviewCount: 18,
    secondaryGradient: "oat",
  }),
  bridal("bridal-moments", {
    name: "کمربند عروس «کمربند ابریشمی»",
    short: "کمربند ابریشمی عروس",
    long: "کمربند بلند از ابریشم سفید با تزئینات مروارید. مناسب مراسم عروسی.",
    composition: "۱۰۰٪ ابریشم.",
    origin: "دست‌ساز در تهران.",
    basePrice: 1490000,
    colors: ["white"],
    badges: ["limited","exclusive"],
    rating: 4.9, reviewCount: 12,
    secondaryGradient: "oat",
  }),
  bridal("bridal-moments", {
    name: "جوراب عروس «ابریشمی»",
    short: "جوراب بلند ابریشمی",
    long: "جوراب بلند از ابریشم طبیعی با تزئینات توری. مناسب مراسم عروسی.",
    composition: "۱۰۰٪ ابریشم.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 890000,
    colors: ["white","beige"],
    badges: ["limited"],
    rating: 4.8, reviewCount: 26,
    secondaryGradient: "rose",
  }),
  bridal("bridal-moments", {
    name: "گارتر عروس «مروارید»",
    short: "گارتر عروسی با مروارید",
    long: "گارتر سفید با تزئینات مروارید و توری. سنتی و ظریف.",
    composition: "۸۰٪ توری، ۲۰٪ مروارید مصنوعی.",
    origin: "دست‌ساز در تهران.",
    basePrice: 690000,
    colors: ["white"],
    badges: ["limited","editorial"],
    rating: 4.9, reviewCount: 17,
    secondaryGradient: "oat",
    editorial: true,
  }),
  bridal("bridal-moments", {
    name: "ست ماه عسل «ابریشم و توری»",
    short: "ست کامل ماه عسل",
    long: "ست کامل شامل سوتین، شورت، روبالن و ماسک خواب از ابریشم و توری.",
    composition: "۹۰٪ ابریشم، ۱۰٪ توری.",
    origin: "پارچه فرانسوی، دوخت ایران.",
    basePrice: 3490000,
    colors: ["white","beige","rose"],
    badges: ["limited","exclusive"],
    rating: 4.9, reviewCount: 14,
    secondaryGradient: "rose",
    featured: true,
  }),
];

// ──────────────────────────────────────────────────────────────
// EDITORIALS — 12 Persian articles (journal/campaign/atelier/blog)
// ──────────────────────────────────────────────────────────────

export const LONA_EDITORIALS = [
  {
    slug: "rahnama-entekhab-saz-sotin",
    title: "راهنمای انتخاب سایز سوتین",
    excerpt: "چگونه سایز سوتین مناسب خود را پیدا کنید؟ راهنمای گام به گام برای اندازه‌گیری دقیق.",
    kind: "journal" as const,
    author: "تیم لونا",
    publishedAt: Date.parse("2025-12-15"),
    coverGradient: "oat" as GradientKey,
    status: "published" as const,
  },
  {
    slug: "chehre-libas-zir-monaesab-entekhab-konim",
    title: "چگونه لباس زیر مناسب انتخاب کنیم؟",
    excerpt: "راهنمای کامل برای انتخاب لباس زیر مناسب با فرم بدن و نیازهای روزانه.",
    kind: "journal" as const,
    author: "مریم احمدی",
    publishedAt: Date.parse("2025-12-08"),
    coverGradient: "mist" as GradientKey,
    status: "published" as const,
  },
  {
    slug: "rahnama-shostooye-libas-zir",
    title: "راهنمای شستشوی لباس زیر",
    excerpt: "چگونه لباس زیر را به درستی بشوییم تا عمر آن افزایش یابد؟",
    kind: "journal" as const,
    author: "تیم لونا",
    publishedAt: Date.parse("2025-11-28"),
    coverGradient: "rose" as GradientKey,
    status: "published" as const,
  },
  {
    slug: "behtarin-parche-libas-khab",
    title: "بهترین پارچه برای لباس خواب",
    excerpt: "ابریشم، نخ یا ساتن؟ کدام پارچه برای لباس خواب مناسب‌تر است؟",
    kind: "journal" as const,
    author: "زهرا کریمی",
    publishedAt: Date.parse("2025-11-15"),
    coverGradient: "pearl" as GradientKey,
    status: "published" as const,
  },
  {
    slug: "rahaty-roozaneh-entekhab-dorost",
    title: "راحتی روزانه و انتخاب درست",
    excerpt: "برای روزهای پُرکار، چه لباس زیری مناسب‌تر است؟",
    kind: "journal" as const,
    author: "تیم لونا",
    publishedAt: Date.parse("2025-10-30"),
    coverGradient: "oat" as GradientKey,
    status: "published" as const,
  },
  {
    slug: "kalakcion-arosi-lona-1405",
    title: "کالکشن عروسی لونا ۱۴۰۵",
    excerpt: "معرفی کامل کالکشن عروسی لونا برای سال ۱۴۰۵ با ترکیب سنت و مدرنیته.",
    kind: "campaign" as const,
    author: "تیم خلاقیت لونا",
    publishedAt: Date.parse("2025-10-15"),
    coverGradient: "oat" as GradientKey,
    status: "published" as const,
  },
  {
    slug: "seda-ye-aroshi",
    title: "صدای عروسی",
    excerpt: "داستان دخترانی که با لباس‌های لونا، روز عروسی خود را خاص کردند.",
    kind: "campaign" as const,
    author: "تیم خلاقیت لونا",
    publishedAt: Date.parse("2025-10-01"),
    coverGradient: "rose" as GradientKey,
    status: "published" as const,
  },
  {
    slug: "posht-pardeye-atelier-lona",
    title: "پشت پرده‌ی آتلیه‌ی لونا",
    excerpt: "گزارشی از فرآیند طراحی و دوخت محصولات در آتلیه‌ی لونا.",
    kind: "atelier" as const,
    author: "نگار رضایی",
    publishedAt: Date.parse("2025-09-20"),
    coverGradient: "deep" as GradientKey,
    status: "published" as const,
  },
  {
    slug: "dastan-parche-abrisham",
    title: "داستان پارچه‌ی ابریشم",
    excerpt: "سفر ما به چین برای انتخاب بهترین پارچه‌ی ابریشم.",
    kind: "atelier" as const,
    author: "نگار رضایی",
    publishedAt: Date.parse("2025-09-05"),
    coverGradient: "rose" as GradientKey,
    status: "published" as const,
  },
  {
    slug: "zibayi-iran-tor",
    title: "زیبایی ایرانی با توری فرانسوی",
    excerpt: "ترکیب ظرافت ایرانی با کیفیت فرانسوی در کالکشن جدید لونا.",
    kind: "atelier" as const,
    author: "تیم خلاقیت لونا",
    publishedAt: Date.parse("2025-08-20"),
    coverGradient: "oat" as GradientKey,
    status: "published" as const,
  },
  {
    slug: "negah-baz-tabestan",
    title: "نگاهی به تابستان با لونا",
    excerpt: "راهنمای انتخاب لباس‌های تابستانی مناسب برای روزهای گرم.",
    kind: "blog" as const,
    author: "تیم لونا",
    publishedAt: Date.parse("2025-08-05"),
    coverGradient: "mist" as GradientKey,
    status: "published" as const,
  },
  {
    slug: "poshtiban-lona",
    title: "پشتیبانی همیشگی لونا",
    excerpt: "چگونه تیم پشتیبانی لونا همراه شما در انتخاب و خرید است.",
    kind: "blog" as const,
    author: "تیم لونا",
    publishedAt: Date.parse("2025-07-25"),
    coverGradient: "oat" as GradientKey,
    status: "published" as const,
  },
];

// ──────────────────────────────────────────────────────────────
// COUPONS — Persian brand coupons
// ──────────────────────────────────────────────────────────────

export const LONA_COUPONS = [
  { code: "LONA10",    percentOff: 0.10, description: "خوش‌آمدگویی — ۱۰٪ تخفیف برای اولین خرید",       active: true },
  { code: "AROUSI20",  percentOff: 0.20, description: "کالکشن عروسی — ۲۰٪ تخفیف ویژه",                active: true },
  { code: "MAJLIS15",  percentOff: 0.15, description: "مجلس‌های خاص — ۱۵٪ تخفیف",                     active: true },
  { code: "POSHTIBAN25",percentOff: 0.25, description: "پشتیبان وفادار — ۲۵٪ تخفیف برای مشتریان ویژه", active: true },
];

// ──────────────────────────────────────────────────────────────
// REVIEWS — ~150 Persian reviews
// ──────────────────────────────────────────────────────────────
// We deterministically pre-generate reviews per product so we
// don't have to hand-write 150 entries. Each product gets 1-3
// reviews. Reviews reference products by slug.

const REVIEW_AUTHORS = [
  "مریم الف","زهرا ب","نازنین پ","سارا ت","مینا ث","لیلا ج","شیلا چ","پریناز ح","آیدا خ",
  "بهار د","گلناز ر","شیرین ز","نگین س","رویا ش","مرجان ص","فرزانه ض","هلیا ط","زینب ظ",
  "کیمیا ع","آوا غ","مونا ف","روشنک ق","پگاه گ","مهرناز ل","الهه م","شادی ن","سحر و",
  "نیکی ه","ترانه ی",
];

const REVIEW_BODIES_GOOD = [
  "کیفیت پارچه فوق‌العاده‌ست، خریدم و راضی‌ام. بسته‌بندی هم محرمانه و شیک بود.",
  "دقیقاً همون چیزی بود که انتظار داشتم. سایزش کاملاً متناسب با جدول سایز لونا بود.",
  "پارچه نرم و دوخت تمیز. تجربه‌ی خرید آنلاین خیلی خوب بود.",
  "سرعت ارسال عالی، بسته‌بندی زیبا و محرمانه. حتماً دوباره خرید می‌کنم.",
  "طراحی بسیار ظریف و راحت. حس لوکس واقعی رو منتقل می‌کنه.",
  "سایزش دقیقاً مطابق جدول بود. پارچه هم نرم و لطیف. ممنون از تیم لونا.",
  "محصول با‌کیفیتی بود. قیمتش هم نسبت به کیفیت مناسب و منصفانه است.",
  "خوب بود، بسته‌بندی محرمانه و ارسال سریع. تیم پشتیبانی هم خیلی حرفه‌ای پاسخ دادند.",
  "رنگ و طرح دقیقاً مطابق تصویر سایت بود. کیفیت پارچه عالی.",
  "برای استفاده‌ی روزانه خیلی راحته. به همه پیشنهاد می‌کنم.",
];

const REVIEW_BODIES_MID = [
  "پارچه خوب ولی سایز یک ذره بزرگ‌تر از انتظارم بود.",
  "کیفیت مناسب ولی قیمت کمی بالاست.",
  "اگر رنگ بیشتری موجود بود، انتخاب بهتری می‌شد.",
];

// Position-based stable review generation: 2-4 reviews per product.
// We cycle through REVIEW_AUTHORS and REVIEW_BODIES deterministically.
export const LONA_REVIEWS: {
  productSlug: string;
  author: string;
  rating: number;
  body: string;
  verified: boolean;
  daysAgo: number;
}[] = (() => {
  const days = 100;
  const out: typeof LONA_REVIEWS = [];
  LONA_PRODUCTS.forEach((product, pIdx) => {
    const count = 1 + ((pIdx * 7) % 3); // 1, 2, or 3 reviews per product
    for (let i = 0; i < count; i++) {
      const author = REVIEW_AUTHORS[(pIdx * 3 + i) % REVIEW_AUTHORS.length]!;
      const body = REVIEW_BODIES_GOOD[(pIdx * 5 + i) % REVIEW_BODIES_GOOD.length]!;
      const rating = pIdx % 9 === 0 && i === 0 ? 4 : 5;
      out.push({
        productSlug: product.slug,
        author,
        rating,
        body,
        verified: true,
        daysAgo: ((pIdx * 13 + i * 5) % days) + 3,
      });
    }
  });
  return out;
})();

/* `define` is referenced as a tsc ambient — strip it from the bundle. */
