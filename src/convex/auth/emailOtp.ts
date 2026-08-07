import { Email } from "@convex-dev/auth/providers/Email";
import axios from "axios";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

// Sending order:
//  1) Resend, when RESEND_API_KEY is configured in Convex.
//  2) The legacy VLY platform gateway and auth endpoint for compatibility.
//  3) An explicitly enabled development fallback that prints the OTP to the
//     server console. It is never enabled implicitly, so a production failure
//     cannot leak authentication codes.
//
// Secrets are read only on the Convex server. Never put an API key in the
// client bundle, source code, or a public chat.

const APP_NAME = process.env.VLY_APP_NAME || "لونا";

function isDevFallbackEnabled(): boolean {
  // Explicit opt-in only. Never infer this from NODE_ENV because an unset or
  // unexpected deployment environment must fail closed.
  return process.env.DEV_EMAIL_FALLBACK === "true";
}

async function sendViaResend(email: string, token: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) return false;

  try {
    const res = await axios.post(
      "https://api.resend.com/emails",
      {
        from: fromEmail,
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
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    return typeof res.data?.id === "string";
  } catch {
    return false;
  }
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
    // 1) Resend — production path when RESEND_API_KEY is configured.
    if (await sendViaResend(email, token)) return;

    // 2) Legacy VLY platform gateway.
    if (await sendViaPlatformGateway(email, token)) return;

    // 3) Legacy endpoint for deployments that still configure FREEBUFF_EMAIL_API_KEY.
    if (await sendViaLegacyEndpoint(email, token)) return;

    // 4) Explicit development fallback — prints the OTP to the server console.
    //    It must be enabled manually with DEV_EMAIL_FALLBACK=true.
    if (isDevFallbackEnabled()) {
      // eslint-disable-next-line no-console
      console.warn(
        `[emailOtp] حالت توسعه — کد ورود برای ${email}: ${token}`,
      );
      return;
    }

    throw new Error(
      "سرویس ارسال ایمیل در دسترس نیست. در Convex مقدار RESEND_API_KEY را تنظیم کنید و برای ارسال به مشتریان، RESEND_FROM_EMAIL را روی ایمیل دامنه تأییدشده بگذارید.",
    );
  },
});
