import "@vly-ai/integrations";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

import { CartProvider } from "@/hooks/use-cart";
import { WishlistProvider } from "@/hooks/use-wishlist";
import { RecentlyViewedProvider } from "@/hooks/use-recently-viewed";
import { OverlayProvider } from "@/hooks/use-overlay";
import { PageShell } from "@/components/layout/PageShell";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Shop = lazy(() => import("./pages/Shop.tsx"));
const Product = lazy(() => import("./pages/Product.tsx"));
const Cart = lazy(() => import("./pages/Cart.tsx"));
const Wishlist = lazy(() => import("./pages/Wishlist.tsx"));
const Checkout = lazy(() => import("./pages/Checkout.tsx"));
// Phase 8.2 — payment callback + invoice (standalone routes)
const CheckoutCallback = lazy(() => import("./pages/CheckoutCallback.tsx"));
const InvoicePage = lazy(() => import("./pages/Invoice.tsx"));
const ContactPage = lazy(() => import("./pages/Contact.tsx"));
const Collections = lazy(() => import("./pages/Collections.tsx"));
const Collection = lazy(() => import("./pages/Collection.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Press = lazy(() => import("./pages/Press.tsx"));
const PressArticle = lazy(() => import("./pages/PressArticle.tsx"));
const Search = lazy(() => import("./pages/Search.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
// Trust / Legal pages
const TermsPage = lazy(() => import("./pages/Terms.tsx"));
const PrivacyPage = lazy(() => import("./pages/Privacy.tsx"));
const FAQPage = lazy(() => import("./pages/FAQ.tsx"));
const ReturnsPage = lazy(() => import("./pages/Returns.tsx"));
const ShippingPage = lazy(() => import("./pages/Shipping.tsx"));
const PaymentPolicyPage = lazy(() => import("./pages/PaymentPolicy.tsx"));

// Admin (Phase 5) — kept in their own lazy chunk so the storefront
// bundle doesn't pay for them.
const AdminShell = lazy(() =>
  import("./components/admin").then((m) => ({ default: m.AdminShell })),
);
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.tsx"));
const ProductList = lazy(() =>
  import("./pages/admin/products/ProductList.tsx"),
);
const ProductWizard = lazy(() =>
  import("./pages/admin/products/ProductWizard.tsx"),
);
const CategoriesPage = lazy(() =>
  import("./pages/admin/categories/Categories.tsx"),
);
const CollectionsPage = lazy(() =>
  import("./pages/admin/collections/Collections.tsx"),
);
const EditorialsPage = lazy(() =>
  import("./pages/admin/editorials/Editorials.tsx"),
);
const MediaLibraryPage = lazy(() =>
  import("./pages/admin/media/MediaLibrary.tsx"),
);
const SettingsPage = lazy(() =>
  import("./pages/admin/settings/Settings.tsx"),
);
const OrdersPage = lazy(() =>
  import("./pages/admin/orders/Orders.tsx"),
);
const CustomersPage = lazy(() =>
  import("./pages/admin/customers/Customers.tsx"),
);
const CouponsPage = lazy(() =>
  import("./pages/admin/coupons/Coupons.tsx"),
);
const ReviewsPage = lazy(() =>
  import("./pages/admin/reviews/Reviews.tsx"),
);
const ReportsPage = lazy(() => import("./pages/admin/Reports.tsx"));
const ExportsPage = lazy(() => import("./pages/admin/Exports.tsx"));
const AdminNotificationsPage = lazy(() => import("./pages/admin/AdminNotifications.tsx"));
const ActivityTimelinePage = lazy(() => import("./pages/admin/ActivityTimeline.tsx"));
const BackupsPage = lazy(() => import("./pages/admin/Backups.tsx"));
const AdminSupportPage = lazy(() => import("./pages/admin/SupportAdmin.tsx"));
const AdminReturnsPage = lazy(() => import("./pages/admin/ReturnsAdmin.tsx"));
const AdminStub = lazy(() => import("./pages/admin/_Stub.tsx"));
const RequireRole = lazy(() =>
  import("./components/admin/RequireRole.tsx").then((m) => ({
    default: m.RequireRole,
  })),
);

function RouteLoading() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="glass rounded-full px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-ink-muted">
        در حال بارگذاری
      </div>
    </div>
  );
}

class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="font-display text-2xl text-ink">مشکلی پیش آمده است</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              لطفاً صفحه را دوباره بارگذاری کنید یا به صفحه اصلی بازگردید.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button onClick={() => window.location.reload()} className="rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary">
                تلاش دوباره
              </button>
              <a href="/" className="rounded-full hairline bg-canvas/60 px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft hover:bg-white">
                بازگشت به خانه
              </a>
            </div>
            {this.state.stack && (
              <details className="mt-6">
                <summary className="cursor-pointer text-[10px] uppercase tracking-[0.18em] text-ink-muted">جزئیات فنی</summary>
                <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                  {this.state.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*"
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <CartProvider>
          <WishlistProvider>
            <RecentlyViewedProvider>
              <OverlayProvider>
                <BrowserRouter>
                  <RouteSyncer />
                  <Suspense fallback={<RouteLoading />}>
                    <Routes>
                      {/* Auth — standalone */}
                      <Route
                        path="/auth"
                        element={<AuthPage redirectAfterAuth="/account" />}
                      />

                      {/* Public + Authenticated via PageShell */}
                      <Route element={<PageShell />}>
                        <Route path="/" element={<Landing />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/shop/:slug" element={<Product />} />
                        {/* Legacy product URL kept as a stable alias for shared links. */}
                        <Route path="/product/:slug" element={<Product />} />
                        <Route path="/collections" element={<Collections />} />
                        <Route
                          path="/collections/:slug"
                          element={<Collection />}
                        />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/wishlist" element={<Wishlist />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/press" element={<Press />} />
                        <Route path="/press/:slug" element={<PressArticle />} />
                        {/* Legacy journal URLs kept as stable aliases. */}
                        <Route path="/journal" element={<Press />} />
                        <Route path="/journal/:slug" element={<PressArticle />} />
                        <Route path="/search" element={<Search />} />
                        {/* Trust / Legal */}
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/rules" element={<TermsPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/faq" element={<FAQPage />} />
                        <Route path="/returns" element={<ReturnsPage />} />
                        <Route path="/refund-policy" element={<ReturnsPage />} />
                        <Route path="/shipping" element={<ShippingPage />} />
                        <Route path="/shipping-policy" element={<ShippingPage />} />
                        <Route path="/payment-policy" element={<PaymentPolicyPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                      </Route>

                      {/* Account (protected) */}
                      <Route
                        path="/account"
                        element={
                          <RequireAuth>
                            <Dashboard />
                          </RequireAuth>
                        }
                      />

                      {/* Checkout (protected, full route outside PageShell
                          so the dark checkout layout owns the canvas) */}
                      <Route
                        path="/checkout"
                        element={
                          <RequireAuth>
                            <Checkout />
                          </RequireAuth>
                        }
                      />
                      <Route
                        path="/checkout/callback/:orderId"
                        element={
                          <RequireAuth>
                            <CheckoutCallback />
                          </RequireAuth>
                        }
                      />
                      <Route
                        path="/invoice/:number"
                        element={
                          <RequireAuth>
                            <InvoicePage />
                          </RequireAuth>
                        }
                      />

                      {/* Legacy dashboard → Account */}
                      <Route
                        path="/dashboard"
                        element={
                          <RequireAuth>
                            <Dashboard />
                          </RequireAuth>
                        }
                      />

                      {/* Admin (Phase 5) — every /admin/* route is gated
                          behind RequireRole; the AdminShell layout owns
                          the sidebar + topbar chrome for everything
                          beneath it. Each domain uses AdminStub until its
                          own depth is built. */}
                      <Route
                        path="/admin"
                        element={
                          <Suspense fallback={<RouteLoading />}>
                            <RequireRole permission="view_reports" />
                          </Suspense>
                        }
                      >
                        <Route
                          element={
                            <Suspense fallback={<RouteLoading />}>
                              <AdminShell />
                            </Suspense>
                          }
                        >
                          <Route
                            index
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <AdminDashboard />
                              </Suspense>
                            }
                          />
                          <Route
                            path="dashboard"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <AdminDashboard />
                              </Suspense>
                            }
                          />
                          <Route
                            path="products"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <ProductList />
                              </Suspense>
                            }
                          />
                          <Route
                            path="products/new"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <ProductWizard />
                              </Suspense>
                            }
                          />
                          <Route
                            path="products/:id"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <ProductWizard />
                              </Suspense>
                            }
                          />
                          <Route
                            path="categories"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <CategoriesPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="collections"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <CollectionsPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="editorial"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <EditorialsPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="media"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <MediaLibraryPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="settings"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <SettingsPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="orders"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <OrdersPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="customers"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <CustomersPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="coupons"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <CouponsPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="reviews"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <ReviewsPage />
                              </Suspense>
                            }
                          />
                          <Route path="reports" element={<Suspense fallback={<RouteLoading />}><ReportsPage /></Suspense>} />
                          <Route path="exports" element={<Suspense fallback={<RouteLoading />}><ExportsPage /></Suspense>} />
                          <Route path="notifications" element={<Suspense fallback={<RouteLoading />}><AdminNotificationsPage /></Suspense>} />
                          <Route path="activity" element={<Suspense fallback={<RouteLoading />}><ActivityTimelinePage /></Suspense>} />
                          <Route path="backups" element={<Suspense fallback={<RouteLoading />}><BackupsPage /></Suspense>} />
                          <Route path="support" element={<Suspense fallback={<RouteLoading />}><AdminSupportPage /></Suspense>} />
                          <Route path="returns" element={<Suspense fallback={<RouteLoading />}><AdminReturnsPage /></Suspense>} />
                          <Route
                            path=":domain"
                            element={
                              <Suspense fallback={<RouteLoading />}>
                                <AdminStub />
                              </Suspense>
                            }
                          />
                        </Route>
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
                <Toaster />
              </OverlayProvider>
            </RecentlyViewedProvider>
          </WishlistProvider>
        </CartProvider>
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>
);
