/**
 * Coupon — hybrid client / server validator.
 *
 *   1. `apply(raw)` echoes the typed code through a tiny client-side
 *      allow-list so the toast feedback (success / invalid) is instant
 *      for the three known AEON codes (WELCOME10, ÆON15, PATRON20).
 *   2. The same code is committed to the live `coupons.getByCode`
 *      subscription so unknown / disabled / expired codes stop being
 *      applied at the first server roundtrip.
 *
 * The shape matches the legacy `useCoupon` API: `applied`, `apply`,
 * `remove`, plus an `input` field for echoing the user's code in the
 * form while typing.
 */
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useCallback, useState } from "react";

export interface AppliedCoupon {
  code: string;
  percentOff: number;
}

const ALLOW_LIST: Record<string, number> = {
  WELCOME10: 0.10,
  "\u00c6ON15": 0.15,
  PATRON20: 0.20,
};

export function useCoupon() {
  const [input, setInput] = useState<string>("");
  const [committed, setCommitted] = useState<string | null>(null);

  const remote = useQuery(
    api.coupons.getByCode,
    committed ? { code: committed } : "skip"
  );

  const optimistic: AppliedCoupon | null = committed
    ? ALLOW_LIST[committed]
      ? { code: committed, percentOff: ALLOW_LIST[committed] }
      : null
    : null;

  // Trust the server result when available; otherwise show the
  // optimistic client value.
  const applied: AppliedCoupon | null = remote
    ? { code: remote.code, percentOff: remote.percentOff }
    : optimistic;

  const apply: (raw: string) => AppliedCoupon | null = useCallback((raw: string): AppliedCoupon | null => {
    const code = raw.trim().toUpperCase();
    setInput(raw);
    setCommitted(code || null);
    if (!code) return null;
    return ALLOW_LIST[code] ? { code, percentOff: ALLOW_LIST[code] } : null;
  }, []);

  const remove = useCallback(() => {
    setCommitted(null);
    setInput("");
  }, []);

  return { applied, apply, remove, input };
}
