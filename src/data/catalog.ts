/**
 * Mock luxury fashion catalog.
 * Shape mirrors a future Convex collection so swapping to live data is one-line.
 */
import type { GradientKey } from "@/lib/glass";

export type ProductCategory =
  | "outerwear"
  | "knitwear"
  | "shirting"
  | "trousers"
  | "dresses"
  | "leather"
  | "accessories";

export interface ProductColor {
  id: string;
  name: string;
  gradient: GradientKey;
}

export interface ProductSize {
  id: string;
  label: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  collection: string;
  price: number;
  compareAt?: number;
  currency: "USD";
  description: string;
  composition: string;
  origin: string;
  colors: ProductColor[];
  sizes: ProductSize[];
  badges?: ("new" | "restocked" | "limited" | "editorial")[];
  rating?: number;
  reviewCount?: number;
  /** Optional secondary gradient for hover swap. */
  secondaryGradient?: GradientKey;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  productIds: string[];
  gradient: GradientKey;
  cover?: string;
}

export interface Editorial {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: "journal" | "atelier" | "campaign";
  author: string;
  publishedAt: string;
  cover: string;
}

export interface Order {
  id: string;
  number: string;
  placedAt: string;
  status: "processing" | "shipped" | "delivered" | "returning";
  total: number;
  items: { productId: string; quantity: number; size: string; color: string }[];
  trackingNumber?: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
}

/* ------------------------------------------------------------ */
/* Catalog                                                        */
/* ------------------------------------------------------------ */

export const products: Product[] = [
  {
    id: "p-001",
    slug: "merino-overcoat-paragon",
    name: "Paragon Merino Overcoat",
    category: "outerwear",
    collection: "autumn-winter",
    price: 2480,
    compareAt: 2680,
    currency: "USD",
    description:
      "An unlined overcoat cut from a 16-micron Italian merino, finished by hand in our Tuscan atelier. The shoulder is dropped by a half-inch for a quiet, considered line.",
    composition: "100% Italian merino wool. Horn buttons. Cupro lining.",
    origin: "Cut and sewn in Italy.",
    colors: [
      { id: "oat", name: "Oat Melange", gradient: "oat" },
      { id: "mist", name: "Pale Mist", gradient: "mist" },
      { id: "deep", name: "Midnight", gradient: "deep" },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
      { id: "xl", label: "XL" },
    ],
    badges: ["new", "editorial"],
    rating: 4.9,
    reviewCount: 64,
    secondaryGradient: "mist",
  },
  {
    id: "p-002",
    slug: "silk-cashmere-turtleneck",
    name: "Aria Silk-Cashmere Turtleneck",
    category: "knitwear",
    collection: "essentials",
    price: 690,
    currency: "USD",
    description:
      "A close-knit sweater drawn together from Mongolian cashmere and mulberry silk. A clean funnel collar and a structural rib at the cuff.",
    composition: "70% cashmere, 30% silk.",
    origin: "Knitted in Northern Italy.",
    colors: [
      { id: "oat", name: "Raw Ivory", gradient: "oat" },
      { id: "rose", name: "Rose Quartz", gradient: "rose" },
      { id: "mist", name: "Polar Mist", gradient: "mist" },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
    badges: ["restocked"],
    rating: 4.8,
    reviewCount: 142,
    secondaryGradient: "rose",
  },
  {
    id: "p-003",
    slug: "wide-leg-trouser-monolith",
    name: "Monolith Wide-Leg Trouser",
    category: "trousers",
    collection: "essentials",
    price: 720,
    currency: "USD",
    description:
      "A high-rise trouser pressed from a dry Japanese gabardine. The leg opens from the knee; the waist stays close. A single forward pleat sets the line.",
    composition: "100% Japanese cotton gabardine.",
    origin: "Tailored in Portugal.",
    colors: [
      { id: "oat", name: "Bone", gradient: "oat" },
      { id: "deep", name: "Carbon", gradient: "deep" },
    ],
    sizes: [
      { id: "24", label: "24" },
      { id: "26", label: "26" },
      { id: "28", label: "28" },
      { id: "30", label: "30" },
      { id: "32", label: "32" },
    ],
    badges: ["editorial"],
    rating: 4.7,
    reviewCount: 88,
    secondaryGradient: "deep",
  },
  {
    id: "p-004",
    slug: "poplin-shirt-constellation",
    name: "Constellation Poplin Shirt",
    category: "shirting",
    collection: "essentials",
    price: 420,
    currency: "USD",
    description:
      "A long-staple Egyptian cotton poplin, mother-of-pearl buttons, an unfused collar that holds its line after a full day's wear.",
    composition: "100% Egyptian cotton.",
    origin: "Sewn in Como.",
    colors: [
      { id: "mist", name: "Quartz White", gradient: "mist" },
      { id: "rose", name: "Blush", gradient: "rose" },
      { id: "oat", name: "Sand", gradient: "oat" },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
      { id: "xl", label: "XL" },
    ],
    badges: ["new"],
    rating: 4.9,
    reviewCount: 211,
    secondaryGradient: "mist",
  },
  {
    id: "p-005",
    slug: "leather-tote-glycine",
    name: "Glycine Leather Tote",
    category: "leather",
    collection: "objects",
    price: 1850,
    currency: "USD",
    description:
      "A tote formed from a single hide of vegetable-tanned Tuscan calfskin. Will develop a quiet patina with years of wear. Saddle-stitched by hand.",
    composition: "Vegetable-tanned calfskin. Brass hardware. Unlined.",
    origin: "Hand-finished in Florence.",
    colors: [
      { id: "oat", name: "Saddle", gradient: "oat" },
      { id: "deep", name: "Ink", gradient: "deep" },
      { id: "rose", name: "Coral Skin", gradient: "rose" },
    ],
    sizes: [{ id: "one", label: "One Size" }],
    badges: ["limited", "editorial"],
    rating: 5.0,
    reviewCount: 38,
    secondaryGradient: "oat",
  },
  {
    id: "p-006",
    slug: "wool-crepe-slip-dress",
    name: "Whitehaven Wool-Crepe Slip Dress",
    category: "dresses",
    collection: "evening",
    price: 1280,
    compareAt: 1480,
    currency: "USD",
    description:
      "A weightless column drawn in a closely-woven Italian wool crepe. Adjustable straps finished with a hand-rolled hem.",
    composition: "100% Italian wool crepe.",
    origin: "Atelier in Milan.",
    colors: [
      { id: "mist", name: "Pearl", gradient: "mist" },
      { id: "deep", name: "Noir", gradient: "deep" },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
    badges: ["new"],
    rating: 4.8,
    reviewCount: 56,
    secondaryGradient: "rose",
  },
  {
    id: "p-007",
    slug: "cashmere-scarf-soren",
    name: "Sorén Cashmere Scarf",
    category: "accessories",
    collection: "objects",
    price: 420,
    currency: "USD",
    description:
      "A long, gently-weighted scarf drawn from a single 200-needle cashmere. Woven on a quiet loom in northern Scotland.",
    composition: "100% Inner Mongolian cashmere.",
    origin: "Woven in Scotland.",
    colors: [
      { id: "oat", name: "Champagne", gradient: "oat" },
      { id: "mist", name: "Glacier", gradient: "mist" },
      { id: "rose", name: "Petal", gradient: "rose" },
    ],
    sizes: [{ id: "one", label: "180 × 50 cm" }],
    badges: ["restocked"],
    rating: 4.9,
    reviewCount: 124,
    secondaryGradient: "mist",
  },
  {
    id: "p-008",
    slug: "berlino-derby-vegetal",
    name: "Berlino Vegetal Derby",
    category: "leather",
    collection: "objects",
    price: 980,
    currency: "USD",
    description:
      "A blake-stitched derby with a vegetal-tanned upper and a hand-burnished toe. Built on a soft last with a low, considered waist.",
    composition: "Vegetal-tanned calfskin. Leather sole.",
    origin: "Made in Marche, Italy.",
    colors: [
      { id: "oat", name: "Saddle", gradient: "oat" },
      { id: "deep", name: "Espresso", gradient: "deep" },
    ],
    sizes: [
      { id: "39", label: "39" },
      { id: "40", label: "40" },
      { id: "41", label: "41" },
      { id: "42", label: "42" },
      { id: "43", label: "43" },
    ],
    badges: ["editorial"],
    rating: 4.7,
    reviewCount: 47,
    secondaryGradient: "deep",
  },
  {
    id: "p-009",
    slug: "structured-blazer-canon",
    name: "Canon Structured Blazer",
    category: "outerwear",
    collection: "essentials",
    price: 1480,
    currency: "USD",
    description:
      "A precise single-breasted blazer with a half-canvas chest and a low button stance. The shoulder is unpadded; the line is clean.",
    composition: "100% Italian wool.",
    origin: "Tailored in Naples.",
    colors: [
      { id: "oat", name: "Ecru", gradient: "oat" },
      { id: "mist", name: "Pale Slate", gradient: "mist" },
      { id: "deep", name: "Slate", gradient: "deep" },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
    badges: ["new", "limited"],
    rating: 4.8,
    reviewCount: 73,
    secondaryGradient: "mist",
  },
  {
    id: "p-010",
    slug: "linen-trouser-callisto",
    name: "Callisto Linen Trouser",
    category: "trousers",
    collection: "resort",
    price: 540,
    currency: "USD",
    description:
      "A relaxed trouser in a Belgian heavyweight linen. Garment-washed for an immediate, lived-in hand.",
    composition: "100% Belgian linen.",
    origin: "Sewn in Portugal.",
    colors: [
      { id: "oat", name: "Sand", gradient: "oat" },
      { id: "mist", name: "Sea", gradient: "mist" },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
    badges: ["new"],
    rating: 4.6,
    reviewCount: 61,
    secondaryGradient: "oat",
  },
  {
    id: "p-011",
    slug: "tortoise-eyewear-athena",
    name: "Athena Tortoise Eyewear",
    category: "accessories",
    collection: "objects",
    price: 380,
    currency: "USD",
    description:
      "An acetate frame with a soft square lens. Cut, polished and assembled by hand in Cadore, Italy.",
    composition: "Italian Mazzucchelli acetate.",
    origin: "Made in Cadore, Italy.",
    colors: [
      { id: "oat", name: "Champagne Tortoise", gradient: "oat" },
      { id: "deep", name: "Midnight Tortoise", gradient: "deep" },
    ],
    sizes: [{ id: "one", label: "One Size" }],
    badges: ["restocked"],
    rating: 4.8,
    reviewCount: 92,
    secondaryGradient: "deep",
  },
  {
    id: "p-012",
    slug: "ponte-knit-skirt-aria",
    name: "Aria Ponte Pencil Skirt",
    category: "knitwear",
    collection: "essentials",
    price: 480,
    currency: "USD",
    description:
      "A knee-length pencil cut from a tightly-knit Italian ponte. Holds its narrow line through the day.",
    composition: "68% viscose, 28% nylon, 4% elastane.",
    origin: "Knitted in Italy.",
    colors: [
      { id: "deep", name: "Onyx", gradient: "deep" },
      { id: "mist", name: "Pearl", gradient: "mist" },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
    badges: ["editorial"],
    rating: 4.7,
    reviewCount: 53,
    secondaryGradient: "mist",
  },
];

/* ------------------------------------------------------------ */
/* Collections                                                   */
/* ------------------------------------------------------------ */
export const collections: Collection[] = [
  {
    id: "c-aw",
    slug: "autumn-winter",
    name: "Autumn — Winter",
    eyebrow: "Volume XII",
    description:
      "Long coats, dense knits, considered evenings. The season in pieces designed to last past it.",
    productIds: ["p-001", "p-002", "p-003", "p-004", "p-009"],
    gradient: "oat",
  },
  {
    id: "c-ess",
    slug: "essentials",
    name: "The Essentials",
    eyebrow: "Permanent",
    description:
      "Pieces that hold the wardrobe together. Refined twice a year, then left alone.",
    productIds: ["p-002", "p-003", "p-004", "p-009", "p-012"],
    gradient: "mist",
  },
  {
    id: "c-evening",
    slug: "evening",
    name: "Evening",
    eyebrow: "After Six",
    description: "Low light, high whisper. Pieces for rooms where points are made quietly.",
    productIds: ["p-006", "p-001", "p-005", "p-011"],
    gradient: "deep",
  },
  {
    id: "c-objects",
    slug: "objects",
    name: "Objects",
    eyebrow: "Carry With You",
    description:
      "Leather, eyewear, fragrance. The companions you reach for daily, made to age beautifully.",
    productIds: ["p-005", "p-007", "p-008", "p-011"],
    gradient: "rose",
  },
];

/* ------------------------------------------------------------ */
/* Editorials — Journal                                          */
/* ------------------------------------------------------------ */
export const editorials: Editorial[] = [
  {
    id: "e-001",
    slug: "in-the-quiet-room",
    title: "In The Quiet Room",
    excerpt:
      "A study in low light and long shadows — photographed at our Tuscan atelier over three November afternoons.",
    category: "campaign",
    author: "Editorial Office",
    publishedAt: "2026-01-12",
    cover: "mist",
  },
  {
    id: "e-002",
    slug: "the-patination-of-leather",
    title: "The Patination of Leather",
    excerpt:
      "How vegetable-tanned calfskin reads sunlight, rain, and the corner of a well-stacked shelf.",
    category: "atelier",
    author: "Maria Venturi",
    publishedAt: "2025-12-04",
    cover: "oat",
  },
  {
    id: "e-003",
    slug: "a-conversation-with-the-tailor",
    title: "A Conversation With The Tailor",
    excerpt:
      "Our head tailor, Vittorio Sala, on half-canvas construction, the dropped shoulder, and the room left for the wearer.",
    category: "atelier",
    author: "Editorial Office",
    publishedAt: "2025-11-18",
    cover: "deep",
  },
  {
    id: "e-004",
    slug: "the-permanent-wardrobe",
    title: "The Permanent Wardrobe",
    excerpt:
      "Why we list the same five pieces twice a year, and only refine them.",
    category: "journal",
    author: "Lou Bertrand",
    publishedAt: "2025-10-22",
    cover: "mist",
  },
];

/* ------------------------------------------------------------ */
/* Testimonials                                                  */
/* ------------------------------------------------------------ */
export const testimonials: Testimonial[] = [
  {
    id: "t-001",
    quote:
      "The Paragon coat is the first piece that has held my attention through a whole season. The cut, the cloth, the way it moves.",
    author: "Naomi K.",
    role: "Architect · London",
  },
  {
    id: "t-002",
    quote:
      "We've owned the Glycine tote for nearly four years. It looks, somehow, more itself than when it arrived.",
    author: "Hiro S.",
    role: "Publisher · Kyoto",
  },
  {
    id: "t-003",
    quote:
      "Customer service wrote me back twice, by hand, about a single button. I'll be back.",
    author: "Frédérique M.",
    role: "Curator · Paris",
  },
];

/* ------------------------------------------------------------ */
/* Mock orders for the account workspace                          */
/* ------------------------------------------------------------ */
export const mockOrders: Order[] = [
  {
    id: "o-001",
    number: "Æ-24102",
    placedAt: "2026-01-04",
    status: "shipped",
    total: 2880,
    items: [
      {
        productId: "p-001",
        quantity: 1,
        size: "M",
        color: "Pale Mist",
      },
      {
        productId: "p-002",
        quantity: 1,
        size: "S",
        color: "Rose Quartz",
      },
    ],
    trackingNumber: "DH-7820-1140",
  },
  {
    id: "o-002",
    number: "Æ-23874",
    placedAt: "2025-11-19",
    status: "delivered",
    total: 1480,
    items: [
      {
        productId: "p-009",
        quantity: 1,
        size: "M",
        color: "Pale Slate",
      },
    ],
  },
  {
    id: "o-003",
    number: "Æ-23620",
    placedAt: "2025-09-02",
    status: "delivered",
    total: 1850,
    items: [
      {
        productId: "p-005",
        quantity: 1,
        size: "One Size",
        color: "Saddle",
      },
    ],
  },
];

/* ------------------------------------------------------------ */
/* Lookup helpers                                                */
/* ------------------------------------------------------------ */
export const getProduct = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug);

export const getProductById = (id: string): Product | undefined =>
  products.find((p) => p.id === id);

export const getCollection = (slug: string): Collection | undefined =>
  collections.find((c) => c.slug === slug);

export const getCollectionProducts = (slug: string): Product[] => {
  const c = getCollection(slug);
  if (!c) return [];
  return c.productIds
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p));
};

export const newArrivals = (): Product[] =>
  products.filter((p) => p.badges?.includes("new"));

export const editorialPicks = (): Product[] =>
  products.filter((p) => p.badges?.includes("editorial"));
