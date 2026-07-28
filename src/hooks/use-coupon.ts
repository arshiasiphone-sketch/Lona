import { useCallback, useState } from "react";

/**
 * Cart coupon state. Purely client-side mock — the real validation lives server-side later.
 * WELCOME10 is a working demo code. Anything else falls into try/catch feedback.
 */
export interface AppliedCoupon {
  code: string;
  percentOff: number;
}

const VALID_CODES: Record<string, number> = {
  WELCOME10: 0.1,
  ÆON15: 0.15,
  PATRON20: 0.2,
};

export function useCoupon() {
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);

  const apply = useCallback((raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) return null;
    const percent = VALID_CODES[code];
    if (percent === undefined) {
      setApplied(null);
      return null;
    }
    const next = { code, percentOff: percent };
    setApplied(next);
    return next;
  }, []);

  const remove = useCallback(() => setApplied(null), []);

  return { applied, apply, remove };
}
