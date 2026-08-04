/**
 * Phase 8.1 — background job registrations (Convex cron jobs).
 *
 * These are the scheduled functions that keep the commerce engine
 * self-healing without manual intervention:
 *
 *   • expire-reservations — rolls back inventory holds whose payment
 *     window lapsed, and cancels their pending orders. Runs every 10
 *     minutes; the sweep is idempotent so it is safe to run more
 *     often.
 *
 * Future jobs (notifications dispatch, low-stock alerts, abandoned
 * cart recovery) register here too.
 */
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "expire-reservations",
  { minutes: 10 },
  internal.reservations.expireStale
);

export default crons;
