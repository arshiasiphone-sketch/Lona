// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation
//
// LONA migration (phone-first authentication):
//   Customer sign-in moved from `emailOtp` to the Phone (SMS OTP) provider
//   backed by Kavenegar. Convex Auth stays the authentication authority —
//   see `src/convex/auth/phoneOtp.ts` and `src/convex/auth/kavenegar.ts`.
//
//   `Anonymous` is intentionally preserved: the guest cart / wishlist /
//   recently-viewed flows are keyed by a device session token, and the
//   anonymous provider is still part of the existing auth surface.

import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { phoneOtp } from "./auth/phoneOtp";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [phoneOtp, Anonymous],
});
