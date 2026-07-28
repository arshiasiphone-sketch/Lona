import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  vBadge,
  vColorOption,
  vEditorialKind,
  vGradient,
  vOrderStatus,
  vProductCategory,
  vProductStatus,
  vRole,
  vSizeOption,
} from "./validators";

/**
 * ÆON data architecture — schema-first.
 *
 * Every table has `_id` + `_creationTime` (Convex-managed). We add
 * `createdAt` / `updatedAt` on write paths where the UI needs an
 * explicit ordering (recently viewed pushes, order history).
 *
 * Index strategy follows the thinker's Phase-4 design:
 *   • products: by_slug, by_category, by_status, by_collectionSlug,
 *     by_featured, by_trending, by_editorial, AND a searchIndex on name.
 *   • storage-bearing tables: by_user + by_session (cart / wishlist / recent).
 *   • orders: by_user, by_number, by_status.
 *   • order_items: by_order.
 *   • variants: by_product, by_sku.
 *   • reviews: by_product, by_user.
 *   • editorials: by_slug, by_category + searchIndex on title.
 *   • coupons: by_code.
 *   • addresses/preferences: by_user.
 *
 * Roles extend authTables; admin gate is `role === "admin"` matched in
 * `_helpers.ts::assertAdmin`.
 */

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

const schema = defineSchema(
  {
    // ============================================================
    // AUTH (do not modify)
    // ============================================================
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(vRole),
      phone: v.optional(v.string()),
      locale: v.optional(v.string()),
      defaultAddressId: v.optional(v.id("addresses")),
      lastSeenAt: v.optional(v.number()),
    }).index("email", ["email"]),

    // ============================================================
    // USER · addresses / preferences / notifications / activity
    // ============================================================

    addresses: defineTable({
      userId: v.id("users"),
      label: v.string(), // "home" | "office" | "atelier" | custom
      fullName: v.string(),
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      region: v.string(),
      postalCode: v.string(),
      country: v.string(), // ISO-3166 alpha-2
      phone: v.optional(v.string()),
      isDefault: v.boolean(),
    })
      .index("by_user", ["userId"])
      .index("by_default_user", ["userId", "isDefault"]),

    preferences: defineTable({
      userId: v.id("users"),
      locale: v.string(),
      currency: v.literal("USD"),
      sizes: v.object({
        top: v.optional(v.string()),
        bottom: v.optional(v.string()),
        shoe: v.optional(v.string()),
      }),
      notifications: v.object({
        orderUpdates: v.boolean(),
        editorialDigest: v.boolean(),
        backInStock: v.boolean(),
        marketing: v.boolean(),
      }),
      marketingOptIn: v.boolean(),
      updatedAt: v.number(),
    }).index("by_user", ["userId"]),

    notifications: defineTable({
      userId: v.id("users"),
      kind: v.union(
        v.literal("order"),
        v.literal("back_in_stock"),
        v.literal("editorial"),
        v.literal("system")
      ),
      title: v.string(),
      body: v.string(),
      link: v.optional(v.string()),
      read: v.boolean(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    activity_logs: defineTable({
      userId: v.optional(v.id("users")),
      action: v.string(),
      resource: v.string(),
      resourceId: v.optional(v.string()),
      payload: v.optional(v.any()),
      at: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_resource", ["resource"]),

    // ============================================================
    // PRODUCT · categories / collections / products / variants
    // ============================================================

    categories: defineTable({
      slug: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      parentId: v.optional(v.id("categories")),
      order: v.number(),
      visible: v.boolean(),
      seo: v.object({
        title: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    })
      .index("by_slug", ["slug"])
      .index("by_parent", ["parentId"]),

    collections: defineTable({
      slug: v.string(),
      name: v.string(),
      eyebrow: v.string(),
      description: v.string(),
      /**
       * Mirror of "products in this collection" — denormalized for read
       * speed. `product_collections` is the canonical index for queries.
       */
      productSlugs: v.array(v.string()),
      gradient: vGradient,
      coverGradient: v.optional(vGradient),
      kind: v.union(
        v.literal("seasonal"),
        v.literal("campaign"),
        v.literal("editorial"),
        v.literal("permanent")
      ),
      season: v.optional(v.string()),
      order: v.number(),
      visible: v.boolean(),
    })
      .index("by_slug", ["slug"])
      .index("by_kind", ["kind"])
      .index("by_visible", ["visible"]),

    products: defineTable({
      slug: v.string(),
      name: v.string(),
      category: vProductCategory,
      collectionSlug: v.string(),
      priceCents: v.number(),
      compareAtCents: v.optional(v.number()),
      currency: v.literal("USD"),
      description: v.string(),
      composition: v.string(),
      origin: v.string(),
      colors: v.array(vColorOption),
      sizes: v.array(vSizeOption),
      badges: v.array(vBadge),
      rating: v.optional(v.number()),
      reviewCount: v.optional(v.number()),
      secondaryGradient: v.optional(vGradient),
      imageUrls: v.optional(v.array(v.string())),
      status: vProductStatus,
      featured: v.boolean(),
      trending: v.boolean(),
      editorial: v.boolean(),
      visible: v.boolean(),
    })
      .index("by_slug", ["slug"])
      .index("by_category", ["category"])
      .index("by_status", ["status"])
      .index("by_collectionSlug", ["collectionSlug"])
      .index("by_featured", ["featured"])
      .index("by_trending", ["trending"])
      .index("by_editorial", ["editorial"])
      .searchIndex("search_name", {
        searchField: "name",
        filterFields: ["status", "category", "visible"],
      }),

    /** M:N registry `product x collection` — kept tiny, indexed both ways. */
    product_collections: defineTable({
      productId: v.id("products"),
      collectionId: v.id("collections"),
      order: v.number(),
    })
      .index("by_product", ["productId"])
      .index("by_collection", ["collectionId"]),

    /**
     * Inventory-aware variants. Keys are (productId, size, colorId).
     * UI-flat strings remain on the FE — these rows are server-only for
     * stock decrementing at checkout.
     */
    variants: defineTable({
      productId: v.id("products"),
      size: v.string(),
      color: v.string(),
      sku: v.string(),
      stock: v.number(),
      reserved: v.optional(v.number()),
      priceCentsOverride: v.optional(v.number()),
      available: v.boolean(),
    })
      .index("by_product", ["productId"])
      .index("by_sku", ["sku"]),

    product_images: defineTable({
      productId: v.id("products"),
      url: v.optional(v.string()),
      storageId: v.optional(v.id("_storage")),
      alt: v.string(),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      order: v.number(),
      dominantGradient: v.optional(vGradient),
    }).index("by_product", ["productId"]),

    // ============================================================
    // INVENTORY · stock movements
    // ============================================================

    warehouses: defineTable({
      code: v.string(),
      name: v.string(),
      country: v.string(),
      active: v.boolean(),
    }).index("by_code", ["code"]),

    stock_movements: defineTable({
      variantId: v.id("variants"),
      warehouseId: v.optional(v.id("warehouses")),
      kind: v.union(
        v.literal("restock"),
        v.literal("sale"),
        v.literal("return"),
        v.literal("adjustment"),
        v.literal("transfer")
      ),
      quantity: v.number(),
      reason: v.optional(v.string()),
      at: v.number(),
    }).index("by_variant", ["variantId"]),

    // ============================================================
    // SHOPPING · carts / wishlist / recently viewed
    // ============================================================

    carts: defineTable({
      userId: v.optional(v.id("users")),
      sessionId: v.string(), // anonymous device token (or "u:<userId>" if logged in)
      lines: v.array(
        v.object({
          // opaque product reference — string so it stays compatible with
          // the FE catalog ids (e.g. "p-001") today; resolved by-slug
          // server-side whenever a checkout reads the lines.
          productId: v.string(),
          size: v.string(),
          color: v.string(),
          quantity: v.number(),
          addedAt: v.number(),
        })
      ),
      couponCode: v.optional(v.string()),
      giftNote: v.optional(v.string()),
      shippingCents: v.optional(v.number()),
      updatedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_session", ["sessionId"]),

    wishlists: defineTable({
      userId: v.optional(v.id("users")),
      sessionId: v.string(),
      // opaque product references (see carts.lines.productId).
      productIds: v.array(v.string()),
      updatedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_session", ["sessionId"]),

    recently_viewed: defineTable({
      userId: v.optional(v.id("users")),
      sessionId: v.string(),
      // opaque product references (see carts.lines.productId).
      productIds: v.array(v.string()),
      updatedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_session", ["sessionId"]),

    // ============================================================
    // ORDER · orders / items / status history
    // ============================================================

    orders: defineTable({
      userId: v.optional(v.id("users")),
      number: v.string(), // Æ-24102, etc.
      status: vOrderStatus,
      placedAt: v.number(),
      currency: v.literal("USD"),
      subtotalCents: v.number(),
      discountCents: v.number(),
      shippingCents: v.number(),
      taxCents: v.number(),
      totalCents: v.number(),
      couponCode: v.optional(v.string()),
      giftNote: v.optional(v.string()),
      shipping: v.object({
        fullName: v.string(),
        line1: v.string(),
        line2: v.optional(v.string()),
        city: v.string(),
        region: v.string(),
        postalCode: v.string(),
        country: v.string(),
        method: v.union(
          v.literal("standard"),
          v.literal("express"),
          v.literal("white_glove")
        ),
        trackingNumber: v.optional(v.string()),
      }),
      notes: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_number", ["number"])
      .index("by_status", ["status"]),

    order_items: defineTable({
      orderId: v.id("orders"),
      // opaque product reference — string for cross-feature compatibility
      productId: v.string(),
      size: v.string(),
      color: v.string(),
      quantity: v.number(),
      productNameSnapshot: v.string(),
      unitPriceCents: v.number(),
      lineTotalCents: v.number(),
    }).index("by_order", ["orderId"]),

    order_status_history: defineTable({
      orderId: v.id("orders"),
      status: vOrderStatus,
      note: v.optional(v.string()),
      at: v.number(),
    }).index("by_order", ["orderId"]),

    // ============================================================
    // CONTENT · editorials / campaigns / journal / blog
    // ============================================================

    editorials: defineTable({
      slug: v.string(),
      title: v.string(),
      excerpt: v.string(),
      body: v.optional(v.string()),
      coverGradient: vGradient,
      coverImageId: v.optional(v.id("product_images")),
      kind: vEditorialKind,
      author: v.string(),
      publishedAt: v.number(),
      status: v.union(
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived")
      ),
      tags: v.optional(v.array(v.string())),
    })
      .index("by_slug", ["slug"])
      .index("by_kind", ["kind"])
      .index("by_status", ["status"])
      .searchIndex("search_title", {
        searchField: "title",
        filterFields: ["kind", "status"],
      }),

    // ============================================================
    // REVIEW · ratings / questions
    // ============================================================

    reviews: defineTable({
      // opaque product reference
      productId: v.string(),
      userId: v.optional(v.id("users")),
      rating: v.number(), // 1-5
      title: v.optional(v.string()),
      body: v.optional(v.string()),
      verified: v.boolean(),
      status: v.union(
        v.literal("pending"),
        v.literal("published"),
        v.literal("rejected")
      ),
      createdAt: v.number(),
    })
      .index("by_product", ["productId"])
      .index("by_user", ["userId"]),

    questions: defineTable({
      // opaque product reference
      productId: v.string(),
      userId: v.optional(v.id("users")),
      body: v.string(),
      answer: v.optional(v.string()),
      answeredAt: v.optional(v.number()),
      status: v.union(
        v.literal("pending"),
        v.literal("answered"),
        v.literal("archived")
      ),
      createdAt: v.number(),
    })
      .index("by_product", ["productId"])
      .index("by_status", ["status"]),

    // ============================================================
    // COUPONS
    // ============================================================

    coupons: defineTable({
      code: v.string(),
      percentOff: v.number(),
      description: v.optional(v.string()),
      active: v.boolean(),
      validFrom: v.optional(v.number()),
      validUntil: v.optional(v.number()),
      maxUses: v.optional(v.number()),
      usedCount: v.number(),
    }).index("by_code", ["code"]),

    // ============================================================
    // SYSTEM · settings / audit
    // ============================================================

    settings: defineTable({
      key: v.string(),
      value: v.any(),
      updatedAt: v.number(),
      updatedBy: v.optional(v.id("users")),
    }).index("by_key", ["key"]),
  },
  {
    schemaValidation: false,
  }
);

export default schema;
