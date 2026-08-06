import { Email } from "@convex-dev/auth/providers/Email";
import axios from "axios";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

// Sending order:
//  1) Platform email gateway (https://integrations.vly.ai/v1/email/send) using the
//     auto-injected VLY_INTEGRATION_KEY — zero manual setup.
//  2) Legacy auth.freebuff.app/send_otp endpoint using FREEBUFF_EMAIL_API_KEY
//     (kept for compatibility with deployments that already configured it).
//  3) Dev fallback that prints the OTP to the server console (visible in the
//     browser console via F12) so pre-launch testing works without an email
//     provider. It is enabled automatically outside production (NODE_ENV !==
//     "production") or when DEV_EMAIL_FALLBACK=true is explicitly set, and can
//     be force-disabled with DEV_EMAIL_FALLBACK=false. In real production
//     deployments this never activates unless deliberately forced.

const APP_NAME = process.env.VLY_APP_NAME || "لونا";

function isDevFallbackEnabled(): boolean {
  const explicit = process.env.DEV_EMAIL_FALLBACK;
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  // Convex sets NODE_ENV to "production" on prod deployments and
  // "development" on dev deployments, so this stays off in production.
  return process.env.NODE_ENV !== "production";
}

async function sendViaPlatformGateway(
  email: string,
  token: string,
): Promise<boolean> {
  const key = process.env.VLY_INTEGRATION_KEY;
  if (!key) return false;

  try {
    const res = await axios.post(
      "https://integrations.vly.ai/v1/email/send",
      {
        to: [email],
        subject: `کد ورود به ${APP_NAME}`,
        html: `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; background:#faf6f1; padding:32px 16px;">
            <div style="max-width:420px; margin:0 auto; background:#ffffff; border:1px solid #eadfd3; border-radius:16px; padding:32px 24px; text-align:center;">
              <div style="font-size:20px; font-weight:bold; color:#4a2c2a; letter-spacing:2px;">لونا</div>
              <p style="color:#7a6a5f; margin:16px 0 8px;">کد ورود شما به بوتیک لونا</p>
              <div style="font-size:32px; font-weight:bold; letter-spacing:8px; color:#b76e5a; background:#faf3ec; border-radius:12px; padding:16px 8px; margin:12px 0;">${token}</div>
              <p style="color:#9a8a80; font-size:12px; margin:8px 0 0;">این کد تا ۱۵ دقیقه معتبر است. اگر این درخواست را شما نبودید، این ایمیل را نادیده بگیرید.</p>
            </div>
          </div>
        `,
        text: `کد ورود شما به ${APP_NAME}: ${token}\n\nاین کد تا ۱۵ دقیقه معتبر است.`,
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "X-Vly-Version": "0.1.0",
        },
        timeout: 15000,
      },
    );
    return res.data?.success === true;
  } catch {
    return false;
  }
}

async function sendViaLegacyEndpoint(
  email: string,
  token: string,
): Promise<boolean> {
  const apiKey = process.env.FREEBUFF_EMAIL_API_KEY;
  if (!apiKey) return false;

  try {
    const res = await axios.post(
      "https://auth.freebuff.app/send_otp",
      {
        to: email,
        otp: token,
        appName: APP_NAME,
      },
      {
        headers: {
          "x-api-key": apiKey,
        },
        timeout: 15000,
      },
    );
    return res.data?.success !== false;
  } catch {
    return false;
  }
}

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
    // 1) Platform email gateway — the recommended path, uses the auto-injected key.
    if (await sendViaPlatformGateway(email, token)) return;

    // 2) Legacy endpoint for deployments that still configure FREEBUFF_EMAIL_API_KEY.
    if (await sendViaLegacyEndpoint(email, token)) return;

    // 3) Dev fallback — prints the OTP to the server console, which Convex
    //    mirrors to the browser console in development. Auto-enabled outside
    //    production so pre-launch login works with zero setup.
    if (isDevFallbackEnabled()) {
      // eslint-disable-next-line no-console
      console.warn(
        `[emailOtp] حالت توسعه — کد ورود برای ${email}: ${token}`,
      );
      return;
    }

    throw new Error(
      "سرویس ارسال ایمیل در دسترس نیست. قبل از لانچ، یک سرویس ایمیل معتبر (مثل Resend) را در Convex تنظیم کنید.",
    );
  },
});
