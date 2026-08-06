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
    // IMPORTANT: Never log the token itself — Convex forwards
    // server console output to the browser, which would leak OTPs.
    if (!apiKey) {
      throw new Error(
        "سرویس ارسال ایمیل هنوز پیکربندی نشده است. لطفاً در داشبورد Convex مقدار FREEBUFF_EMAIL_API_KEY را تنظیم کنید و دوباره تلاش کنید."
      );
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
    } catch {
      throw new Error(
        "ارسال کد تایید ناموفق بود — اتصال ایمیل برقرار نشد. لطفاً چند لحظه بعد دوباره تلاش کنید."
      );
    }
  },
});
