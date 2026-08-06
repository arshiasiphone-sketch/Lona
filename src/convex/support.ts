import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./_helpers";
import { requirePermission, audit } from "./admin";
import { vTicketCategory, vTicketPriority, vTicketStatus } from "./validators";
import { recordNotification } from "./notifications";

const RATE_LIMIT_MS = 30_000;
const lastCreate = new Map<string, number>();

function checkRate(userId: string) {
  const last = lastCreate.get(userId) ?? 0;
  if (Date.now() - last < RATE_LIMIT_MS) throw new Error("RATE_LIMITED");
  lastCreate.set(userId, Date.now());
}

export const createTicket = mutation({
  args: {
    subject: v.string(),
    category: vTicketCategory,
    priority: vTicketPriority,
    body: v.string(),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    checkRate(user._id);
    const subject = args.subject.trim();
    const body = args.body.trim();
    if (subject.length < 4 || subject.length > 120) throw new Error("INVALID_SUBJECT");
    if (body.length < 10 || body.length > 4000) throw new Error("INVALID_BODY");
    const now = Date.now();
    const id = await ctx.db.insert("support_tickets", {
      userId: user._id,
      subject,
      category: args.category,
      priority: args.priority,
      status: "new",
      body,
      attachments: args.attachments?.slice(0, 5),
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("support_messages", {
      ticketId: id,
      authorId: user._id,
      authorRole: user.role ?? "user",
      body,
      createdAt: now,
    });
    // Notify admins via activity + user notification
    await audit(ctx, user, "ticket.create", "support_tickets", id, { subject });
    return id;
  },
});

export const replyTicket = mutation({
  args: { ticketId: v.id("support_tickets"), body: v.string(), attachments: v.optional(v.array(v.string())) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("TICKET_NOT_FOUND");
    const isOwner = ticket.userId === user._id;
    const isAdmin = user.role === "admin" || user.role === "owner" || user.role === "support" || user.role === "manager";
    if (!isOwner && !isAdmin) throw new Error("FORBIDDEN");
    const body = args.body.trim();
    if (body.length < 2 || body.length > 4000) throw new Error("INVALID_BODY");
    await ctx.db.insert("support_messages", {
      ticketId: args.ticketId,
      authorId: user._id,
      authorRole: user.role ?? "user",
      body,
      attachments: args.attachments?.slice(0, 5),
      createdAt: Date.now(),
    });
    // If admin replies, mark answered; if user replies to answered, back to reviewing
    const nextStatus = isAdmin ? "answered" as const : ticket.status === "answered" ? "reviewing" as const : ticket.status;
    await ctx.db.patch(args.ticketId, { status: nextStatus, updatedAt: Date.now() });
    if (isAdmin && ticket.userId !== user._id) {
      await recordNotification(ctx, {
        userId: ticket.userId,
        kind: "ticket",
        title: "پاسخ جدید به تیکت شما",
        body: `تیکت «${ticket.subject}» پاسخ جدیدی دریافت کرد.`,
        link: "/account",
      });
    }
    if (!isAdmin) {
      await recordNotification(ctx, {
        userId: ticket.userId,
        kind: "ticket",
        title: "تیکت به‌روزرسانی شد",
        body: `پیام جدیدی به تیکت «${ticket.subject}» اضافه شد.`,
        link: "/admin/support",
      });
    }
  },
});

export const setTicketStatus = mutation({
  args: { ticketId: v.id("support_tickets"), status: vTicketStatus },
  handler: async (ctx, args) => {
    const admin = await requirePermission(ctx, "manage_customers");
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("TICKET_NOT_FOUND");
    await ctx.db.patch(args.ticketId, { status: args.status, updatedAt: Date.now() });
    await audit(ctx, admin, `ticket.${args.status}`, "support_tickets", args.ticketId);
    if (args.status === "answered" || args.status === "closed") {
      await recordNotification(ctx, {
        userId: ticket.userId,
        kind: "ticket",
        title: args.status === "closed" ? "تیکت بسته شد" : "پاسخ تیکت",
        body: `وضعیت تیکت «${ticket.subject}» به ${args.status} تغییر کرد.`,
        link: "/account",
      });
    }
  },
});

export const listMyTickets = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db.query("support_tickets").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    rows.sort((a, b) => b.updatedAt - a.updatedAt);
    return rows;
  },
});

export const getTicketWithMessages = query({
  args: { ticketId: v.id("support_tickets") },
  handler: async (ctx, { ticketId }) => {
    const user = await requireUser(ctx);
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) return null;
    const isAdmin = user.role === "admin" || user.role === "owner" || user.role === "manager" || user.role === "support";
    if (ticket.userId !== user._id && !isAdmin) throw new Error("FORBIDDEN");
    const messages = await ctx.db.query("support_messages").withIndex("by_ticket", (q) => q.eq("ticketId", ticketId)).collect();
    messages.sort((a, b) => a.createdAt - b.createdAt);
    return { ticket, messages };
  },
});

export const listAllTickets = query({
  args: { status: v.optional(vTicketStatus) },
  handler: async (ctx, { status }) => {
    await requirePermission(ctx, "manage_customers");
    const rows = status
      ? await ctx.db.query("support_tickets").withIndex("by_status", (q) => q.eq("status", status)).collect()
      : await ctx.db.query("support_tickets").collect();
    rows.sort((a, b) => b.updatedAt - a.updatedAt);
    return rows;
  },
});
