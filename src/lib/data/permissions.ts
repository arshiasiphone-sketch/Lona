/**
 * Phase 5 — Admin permission primitives (FE mirror).
 *
 * Mirrors the Convex permission matrix in `convex/admin.ts` so the
 * FE can hide nav links and gate UI without round-tripping the
 * server for every visibility decision. Server-side
 * `requirePermission` remains authoritative; this is purely UX.
 */
export const adminPermissionLiterals = [
  "manage_products",
  "manage_inventory",
  "manage_orders",
  "manage_customers",
  "manage_content",
  "manage_coupons",
  "manage_settings",
  "manage_media",
  "view_reports",
] as const;

export type AdminPermission = (typeof adminPermissionLiterals)[number];

export type AdminRole =
  | "owner"
  | "admin"
  | "manager"
  | "editor"
  | "support"
  | "member"
  | "user";

const PERMISSIONS: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  owner: new Set(adminPermissionLiterals),
  admin: new Set(adminPermissionLiterals),
  manager: new Set([
    "manage_products",
    "manage_inventory",
    "manage_orders",
    "manage_customers",
    "manage_content",
    "manage_coupons",
    "manage_media",
    "view_reports",
  ]),
  editor: new Set([
    "manage_products",
    "manage_content",
    "manage_media",
  ]),
  support: new Set(["manage_customers"]),
  member: new Set(),
  user: new Set(),
};

export function hasPermission(
  role: AdminRole | null | undefined,
  permission: AdminPermission,
): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.has(permission) ?? false;
}

export function isAdminRole(role: AdminRole | null | undefined): boolean {
  if (!role) return false;
  return role === "owner" || role === "admin" || role === "manager";
}

export const ADMIN_NAV: Array<{
  href: string;
  label: string;
  permission: AdminPermission;
  group: "Catalogue" | "Operations" | "Content" | "Settings";
}> = [
  { href: "/admin", label: "Overview", permission: "view_reports", group: "Catalogue" },
  { href: "/admin/products", label: "Products", permission: "manage_products", group: "Catalogue" },
  { href: "/admin/categories", label: "Categories", permission: "manage_products", group: "Catalogue" },
  { href: "/admin/collections", label: "Collections", permission: "manage_products", group: "Catalogue" },
  { href: "/admin/inventory", label: "Inventory", permission: "manage_inventory", group: "Catalogue" },
  { href: "/admin/media", label: "Media Library", permission: "manage_media", group: "Catalogue" },
  { href: "/admin/orders", label: "Orders", permission: "manage_orders", group: "Operations" },
  { href: "/admin/customers", label: "Customers", permission: "manage_customers", group: "Operations" },
  { href: "/admin/reviews", label: "Reviews", permission: "manage_content", group: "Operations" },
  { href: "/admin/coupons", label: "Coupons", permission: "manage_coupons", group: "Content" },
  { href: "/admin/editorial", label: "Editorial", permission: "manage_content", group: "Content" },
  { href: "/admin/settings", label: "Settings", permission: "manage_settings", group: "Settings" },
];
