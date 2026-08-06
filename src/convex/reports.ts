import { query } from "./_generated/server";
import { requirePermission } from "./admin";
import { v } from "convex/values";

export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "view_reports");
    const [orders, products, variants, users, orderItems] = await Promise.all([
      ctx.db.query("orders").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("variants").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("order_items").collect(),
    ]);
    const now = Date.now();
    const dayMs = 86_400_000;
    const startOfToday = Math.floor(now / dayMs) * dayMs;
    const startOfWeek = now - 7 * dayMs;
    const startOfMonth = now - 30 * dayMs;

    const active = (o: typeof orders[number]) => o.status !== "cancelled" && o.status !== "returning";
    const sum = (arr: typeof orders) => arr.filter(active).reduce((s, o) => s + o.totalCents, 0);

    const byRange = (from: number) => orders.filter((o) => o.placedAt >= from);
    const todayOrders = byRange(startOfToday);
    const weekOrders = byRange(startOfWeek);
    const monthOrders = byRange(startOfMonth);

    // Sales series last 14 days
    const salesByDay: { label: string; cents: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = Math.floor((now - i * dayMs) / dayMs) * dayMs;
      const dayEnd = dayStart + dayMs;
      const dayOrders = orders.filter((o) => o.placedAt >= dayStart && o.placedAt < dayEnd);
      salesByDay.push({
        label: new Date(dayStart).toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
        cents: sum(dayOrders),
      });
    }

    // Category share by order_items joined to product slug
    const slugToCategory = new Map(products.map((p) => [p.slug, p.category]));
    const categoryTotals = new Map<string, number>();
    for (const item of orderItems) {
      const cat = slugToCategory.get(item.productId) ?? "other";
      categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + item.lineTotalCents);
    }
    const categoryShare = [...categoryTotals.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

    // Top products by quantity sold
    const productQty = new Map<string, number>();
    for (const item of orderItems) productQty.set(item.productId, (productQty.get(item.productId) ?? 0) + item.quantity);
    const slugToName = new Map(products.map((p) => [p.slug, p.name]));
    const topProducts = [...productQty.entries()].map(([slug, qty]) => ({ slug, name: slugToName.get(slug) ?? slug, qty })).sort((a, b) => b.qty - a.qty).slice(0, 8);

    const lowStock = variants.filter((v) => v.available && v.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 8).map((v) => ({
      sku: v.sku, stock: v.stock, productName: products.find((p) => p._id === v.productId)?.name ?? v.sku,
    }));

    const avgOrderValue = orders.filter(active).length ? Math.round(sum(orders) / orders.filter(active).length) : 0;

    // New customers last 30 days vs prior
    const newCustomersMonth = users.filter((u) => u._creationTime >= startOfMonth).length;
    const returningRate = users.length ? Math.round((orders.filter(active).length / Math.max(users.length, 1)) * 100) / 100 : 0;

    return {
      kpi: {
        todaySalesCents: sum(todayOrders),
        weekSalesCents: sum(weekOrders),
        monthSalesCents: sum(monthOrders),
        todayOrderCount: todayOrders.filter(active).length,
        monthOrderCount: monthOrders.filter(active).length,
        avgOrderValueCents: avgOrderValue,
        newCustomersMonth,
        returningRate,
      },
      salesByDay,
      categoryShare,
      topProducts,
      lowStock,
      totals: { orders: orders.length, products: products.length, users: users.length },
    };
  },
});

// Lightweight export query — returns rows for CSV/Excel in the browser (no server streaming)
export const exportRows = query({
  args: { kind: v.union(v.literal("orders"), v.literal("products"), v.literal("customers"), v.literal("reviews")) },
  handler: async (ctx, { kind }) => {
    await requirePermission(ctx, "view_reports");
    if (kind === "orders") return ctx.db.query("orders").collect();
    if (kind === "products") return ctx.db.query("products").collect();
    if (kind === "customers") return ctx.db.query("users").collect();
    return ctx.db.query("reviews").collect();
  },
});
