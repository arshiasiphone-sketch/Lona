/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _helpers from "../_helpers.js";
import type * as addresses from "../addresses.js";
import type * as admin from "../admin.js";
import type * as admin_bootstrap from "../admin_bootstrap.js";
import type * as admin_bootstrap_action from "../admin_bootstrap_action.js";
import type * as admin_catalog from "../admin_catalog.js";
import type * as admin_media from "../admin_media.js";
import type * as admin_orders from "../admin_orders.js";
import type * as admin_products from "../admin_products.js";
import type * as admin_reviews from "../admin_reviews.js";
import type * as admin_settings from "../admin_settings.js";
import type * as admin_team from "../admin_team.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as backups from "../backups.js";
import type * as browserless from "../browserless.js";
import type * as browserlessAccess from "../browserlessAccess.js";
import type * as cart from "../cart.js";
import type * as categories from "../categories.js";
import type * as collections from "../collections.js";
import type * as coupons from "../coupons.js";
import type * as crons from "../crons.js";
import type * as editorials from "../editorials.js";
import type * as http from "../http.js";
import type * as marketplace from "../marketplace.js";
import type * as notificationCenter from "../notificationCenter.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as preferences from "../preferences.js";
import type * as products from "../products.js";
import type * as recentlyViewed from "../recentlyViewed.js";
import type * as reports from "../reports.js";
import type * as reservations from "../reservations.js";
import type * as returns from "../returns.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as shipping from "../shipping.js";
import type * as support from "../support.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";
import type * as variants from "../variants.js";
import type * as wishlist from "../wishlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _helpers: typeof _helpers;
  addresses: typeof addresses;
  admin: typeof admin;
  admin_bootstrap: typeof admin_bootstrap;
  admin_bootstrap_action: typeof admin_bootstrap_action;
  admin_catalog: typeof admin_catalog;
  admin_media: typeof admin_media;
  admin_orders: typeof admin_orders;
  admin_products: typeof admin_products;
  admin_reviews: typeof admin_reviews;
  admin_settings: typeof admin_settings;
  admin_team: typeof admin_team;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  backups: typeof backups;
  browserless: typeof browserless;
  browserlessAccess: typeof browserlessAccess;
  cart: typeof cart;
  categories: typeof categories;
  collections: typeof collections;
  coupons: typeof coupons;
  crons: typeof crons;
  editorials: typeof editorials;
  http: typeof http;
  marketplace: typeof marketplace;
  notificationCenter: typeof notificationCenter;
  notifications: typeof notifications;
  orders: typeof orders;
  payments: typeof payments;
  preferences: typeof preferences;
  products: typeof products;
  recentlyViewed: typeof recentlyViewed;
  reports: typeof reports;
  reservations: typeof reservations;
  returns: typeof returns;
  reviews: typeof reviews;
  seed: typeof seed;
  shipping: typeof shipping;
  support: typeof support;
  users: typeof users;
  validators: typeof validators;
  variants: typeof variants;
  wishlist: typeof wishlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
