import { Email } from "@convex-dev/auth/providers/Email";
import axios from "axios";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  // This function can be asynchronous
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const apiKey = process.env.FREEBUFF_EMAIL_API_KEY;
    // Development fallback: when the email API key is not configured
    // (e.g. local preview / before production keys are set) we log
    // the OTP and return successfully instead of throwing a 500.
    // In production you MUST set FREEBUFF_EMAIL_API_KEY in
    // Convex Dashboard → Settings → Environment Variables.
    if (!apiKey) {
      console.warn(
        `[emailOtp] FREEBUFF_EMAIL_API_KEY not configured — dev fallback. OTP for ${email}: ${token}`
      );
      return;
    }

    try {
      await axios.post(
        "https://auth.freebuff.app/send_otp",
        {
          to: email,
          otp: token,
          appName: process.env.VLY_APP_NAME || "a freebuff.com application",
        },
        {
          headers: {
            "x-api-key": apiKey,
          },
        },
      );
    } catch (error) {
      // Surface a readable error instead of a raw JSON blob
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.error(`[emailOtp] send_otp failed for ${email}:`, message);
      throw new Error(`ارسال کد تایید ناموفق بود — لطفاً دوباره تلاش کنید. (${message})`);
    }
  },
});
