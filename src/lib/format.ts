/**
 * Legacy formatting entry point — re-exports the canonical money
 * module (src/lib/money.ts, Phase 8.1). Kept as a thin alias so
 * every existing import site keeps working unchanged; new code
 * should import from "@/lib/money" directly.
 */
export * from "./money";
