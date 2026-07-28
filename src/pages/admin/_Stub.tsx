/**
 * Phase 5.1 — shared stub page used by every non-Product admin
 * route (Categories / Collections / Inventory / Orders / Customers /
 * Reviews / Coupons / Editorial / Media / Settings).
 *
 * Each route renders the same shell but supplies its own copy via
 * route param. Once a domain grows a real surface, the route is
 * swapped to point at a dedicated page; the AdminShell and
 * RequireRole wrappers don't move.
 */
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Boxes,
  CalendarRange,
  Camera,
  Database,
  FileText,
  Image as ImageIcon,
  ListTree,
  Newspaper,
  Percent,
  Receipt,
  Settings as SettingsIcon,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";

export default function AdminStub() {
  const { domain } = useParams();
  const spec =
    DOMAIN_MAP[domain ?? ""] ??
    FALLBACK;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_LUXURY }}
      className="grid gap-6 lg:grid-cols-[2fr_1fr]"
    >
      <div className="rounded-3xl border border-edge bg-white/85 p-10">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          <span className="grid h-7 w-7 place-items-center rounded-full hairline bg-white text-primary">
            {ICONS[spec.icon] ?? <Blocks className="h-3 w-3" />}
          </span>
          {spec.eyebrow}
        </div>
        <h1 className="mt-3 font-display text-4xl text-ink lg:text-5xl">
          {spec.title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
          {spec.body}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
          >
            Begin with the catalogue <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/70 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-white"
          >
            Back to overview
          </Link>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-edge bg-white/85 p-6">
          <p className="type-eyebrow text-ink-muted">Up next for this slice</p>
          <ul className="mt-4 space-y-2">
            {spec.upNext.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-ink"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-edge bg-white/85 p-6">
          <p className="type-eyebrow text-ink-muted">Permissions</p>
          <p className="mt-3 text-[12px] uppercase tracking-[0.18em] text-ink-soft">
            {spec.permission}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Authorization is server-side. The sidebar nav hides this
            card if you don't carry the role required.
          </p>
        </div>
      </aside>
    </motion.div>
  );
}

type Spec = {
  eyebrow: string;
  title: string;
  body: string;
  icon: keyof typeof ICONS;
  permission: string;
  upNext: string[];
};

const ICONS: Record<string, React.ReactNode> = {
  Tree: <ListTree className="h-3 w-3" />,
  Collection: <Boxes className="h-3 w-3" />,
  Boxes: <Boxes className="h-3 w-3" />,
  Receipt: <Receipt className="h-3 w-3" />,
  Wallet: <Wallet className="h-3 w-3" />,
  Newspaper: <Newspaper className="h-3 w-3" />,
  FileText: <FileText className="h-3 w-3" />,
  Camera: <Camera className="h-3 w-3" />,
  Image: <ImageIcon className="h-3 w-3" />,
  Settings: <SettingsIcon className="h-3 w-3" />,
  Inventory: <Truck className="h-3 w-3" />,
  Customers: <BarChart3 className="h-3 w-3" />,
  Reviews: <ShieldCheck className="h-3 w-3" />,
  Calendar: <CalendarRange className="h-3 w-3" />,
  Coupons: <Percent className="h-3 w-3" />,
  Data: <Database className="h-3 w-3" />,
};

const DOMAIN_MAP: Record<string, Spec> = {
  categories: {
    eyebrow: "Catalogue · Categories",
    title: "Taxonomy, in progress.",
    body:
      "The category surface keeps the storefront filter single-select at the moment. The Phase 5.2 follow-up graduates categories to a nested tree (parent · children · ordering · visibility) and adds the assignment workflow.",
    icon: "Tree",
    permission: "manage_products",
    upNext: [
      "tree builder with drag-to-reorder",
      "nested categories for Spring/Summer 2026",
    ],
  },
  collections: {
    eyebrow: "Catalogue · Collections",
    title: "Collection stories, soon.",
    body:
      "Phase 5.1 binds collections as a single field on the product. The full collection editor (campaign layouts, ordering, mixed-archive inclusions) drops in with the next admin slice.",
    icon: "Collection",
    permission: "manage_products",
    upNext: [
      "drag-to-reorder cards within a collection",
      "seasonal cover image editor",
    ],
  },
  inventory: {
    eyebrow: "Catalogue · Inventory",
    title: "Stock at a glance.",
    body:
      "Variants ship with stock + SKU + availability; the wizard matrix is the deepest surface. Warehouse-aware stock movements and a low-stock inbox land in the next phase.",
    icon: "Inventory",
    permission: "manage_inventory",
    upNext: [
      "warehouse-aware transfer ledger",
      "low-stock email alerts to suppliers",
    ],
  },
  media: {
    eyebrow: "Catalogue · Media Library",
    title: "Visual library, in progress.",
    body:
      "Product images upload via the MediaUploader. The reusable cross-product library (with alt-text search, tag filters, orphan reclamation) ships in Phase 5.2 once media volume crosses the threshold for search usefulness.",
    icon: "Image",
    permission: "manage_media",
    upNext: [
      "search by alt-text or tag",
      "usage tracker — where each asset is referenced",
    ],
  },
  orders: {
    eyebrow: "Operations · Orders",
    title: "Order ledger, scaffolding.",
    body:
      "The Convex `orders` table and `dashboardStats` already power the dashboard. The order workspace (search · status filters · refunds · fulfilment timeline) arrives in the next slice.",
    icon: "Receipt",
    permission: "manage_orders",
    upNext: [
      "fulfilment timeline editor",
      "refund + restock workflow",
    ],
  },
  customers: {
    eyebrow: "Operations · Customers",
    title: "Customer ledger, scaffolding.",
    body:
      "The Convex `customerDetail` query already joins orders + addresses + preferences + activity. The Phase 5.2 surface puts that data in context with search, segmentation and audit-ready notes.",
    icon: "Customers",
    permission: "manage_customers",
    upNext: [
      "filterable customer table",
      "internal note thread per customer",
    ],
  },
  reviews: {
    eyebrow: "Operations · Reviews",
    title: "Moderation queue, soon.",
    body:
      "Reviews already persist through the Phase 4 schema. The Phase 5.2 moderator gate uses `status: \"pending\"` and ships an approve / reject / respond flow.",
    icon: "Reviews",
    permission: "manage_content",
    upNext: [
      "approve · reject · respond inline",
      "audit trail shown alongside the review",
    ],
  },
  coupons: {
    eyebrow: "Content · Coupons",
    title: "Coupon admin, in progress.",
    body:
      "`admin_catalog.upsertCoupon` already handles create / edit / archive. The visible workspace (active list · usage graph · copy-to-clipboard) ships with the next slice.",
    icon: "Coupons",
    permission: "manage_coupons",
    upNext: [
      "coupon usage charts",
      "auto-archive on max uses",
    ],
  },
  editorial: {
    eyebrow: "Content · Editorial",
    title: "Editorial CMS, scaffolding.",
    body:
      "The editorials table is fully wired; the editor itself (rich body, cover image picker, scheduling) lands next.",
    icon: "Newspaper",
    permission: "manage_content",
    upNext: [
      "rich body editor with image inserts",
      "publication scheduling",
    ],
  },
  settings: {
    eyebrow: "System · Settings",
    title: "Brand & ops settings, in progress.",
    body:
      "Settings, brand-styling knobs and notification delivery primitives arrive in Phase 5.3 once the data domain has settled.",
    icon: "Settings",
    permission: "manage_settings",
    upNext: [
      "brand tokens (palette · typography)",
      "notification templates",
    ],
  },
};

const FALLBACK: Spec = {
  eyebrow: "Admin · Up next",
  title: "This slice ships in phase 5.2.",
  body:
    "Routes to a domain we haven't surfaced yet. The Products slice at full depth is the entry point; the rest lands in subsequent slices.",
  icon: "Data",
  permission: "manage_products",
  upNext: ["", "—"],
};

// Convenience helper: the route summary bars on the stub pages share
// this exact typography / colour. The label here is intentionally
// narrow so it doesn't fight the dominant copy.
export function stubHeadingClass() {
  return cn(
    "type-eyebrow text-ink-muted",
    "px-5 py-2 rounded-full hairline bg-canvas-70",
  );
}
