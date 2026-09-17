/**
 * LONA — Kavenegar adapter tests.
 *
 * The official `kavenegar` SDK is an untyped CommonJS package that talks to
 * `api.kavenegar.com` over Node's `https` module. These tests mock the
 * package itself, so:
 *
 *   • no network call is ever made,
 *   • no real API key is required,
 *   • the exact error contract the auth layer depends on is asserted.
 *
 * The mocked SDK reproduces the real package's callback shapes verbatim
 * (see `node_modules/kavenegar/kavenegar.js`):
 *   • success   → callback(entries, 200, message)
 *   • rejection → callback(entries, <non-200>, message)
 *   • transport → callback('<json error string>')  ← status stays undefined
 *   • hang      → callback is never invoked
 */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

/** What the fake SDK should do for the next request. */
type Behaviour =
  | { kind: "success" }
  | { kind: "status"; status: number }
  | { kind: "transportError" }
  | { kind: "hang" };

let behaviour: Behaviour = { kind: "success" };
/** Records what the adapter asked Kavenegar to send (never logged). */
let lastCall: { path: string; data: Record<string, string> } | null = null;

mock.module("kavenegar", () => ({
  KavenegarApi: (options: { apikey: string }) => ({
    VerifyLookup(data: Record<string, string>, callback: (...args: unknown[]) => void) {
      lastCall = { path: options.apikey, data };
      switch (behaviour.kind) {
        case "success":
          callback([{ status: 1, statustext: "ok" }], 200, "تایید شد");
          return;
        case "status":
          callback([], behaviour.status, "خطای سرویس");
          return;
        case "transportError":
          // The real SDK calls back with a single JSON string here.
          callback(JSON.stringify({ error: "getaddrinfo ENOTFOUND" }));
          return;
        case "hang":
          // Never settles — only the adapter's own timeout can save us.
          return;
      }
    },
  }),
}));

const { KAVENEGAR_ERRORS, sendOtp } = await import("../src/convex/auth/kavenegar");

/** Minimal ActionCtx stand-in: the adapter never touches ctx. */
const ctx = {} as never;

/** Call the internal action's handler directly (no Convex runtime needed). */
type SendOtpArgs = { phone: string; token: string };
async function callSendOtp(args: SendOtpArgs): Promise<{ ok: true }> {
  const handler = (
    sendOtp as unknown as {
      _handler: (ctx: unknown, args: SendOtpArgs) => Promise<{ ok: true }>;
    }
  )._handler;
  return await handler(ctx, args);
}

const ENV_KEYS = ["KAVENEGAR_API_KEY", "KAVENEGAR_OTP_TEMPLATE"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  process.env.KAVENEGAR_API_KEY = "test-key-not-real";
  process.env.KAVENEGAR_OTP_TEMPLATE = "lona-otp";
  behaviour = { kind: "success" };
  lastCall = null;
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe("Kavenegar adapter — configuration", () => {
  test("the action is internal, so only the auth provider can reach it", () => {
    // `isInternal` is what keeps `sendOtp` off the public API surface: the
    // Phone provider reaches it through `internal.auth.kavenegar.sendOtp`,
    // and no browser-side caller can invoke it directly.
    const fn = sendOtp as unknown as { isAction?: boolean; isInternal?: boolean };
    expect(fn.isAction).toBe(true);
    expect(fn.isInternal).toBe(true);
  });

  test("missing API key is a controlled configuration error", async () => {
    delete process.env.KAVENEGAR_API_KEY;
    await expect(
      callSendOtp({ phone: "09121234567", token: "123456" }),
    ).rejects.toMatchObject({ code: KAVENEGAR_ERRORS.notConfigured });
    expect(lastCall).toBeNull();
  });

  test("missing template is a controlled configuration error", async () => {
    delete process.env.KAVENEGAR_OTP_TEMPLATE;
    await expect(
      callSendOtp({ phone: "09121234567", token: "123456" }),
    ).rejects.toMatchObject({ code: KAVENEGAR_ERRORS.notConfigured });
    expect(lastCall).toBeNull();
  });

  test("an invalid recipient never reaches Kavenegar", async () => {
    await expect(
      callSendOtp({ phone: "+12125551234", token: "123456" }),
    ).rejects.toMatchObject({ code: KAVENEGAR_ERRORS.invalidRecipient });
    expect(lastCall).toBeNull();
  });
});

describe("Kavenegar adapter — VerifyLookup request shape", () => {
  test("sends the national receptor, the Convex Auth token and the template", async () => {
    const result = await callSendOtp({
      phone: "+98 912 123 4567",
      token: "042197",
    });

    expect(result).toEqual({ ok: true });
    expect(lastCall).not.toBeNull();
    // Kavenegar expects the national form as `receptor`.
    expect(lastCall!.data.receptor).toBe("09121234567");
    expect(lastCall!.data.token).toBe("042197");
    expect(lastCall!.data.template).toBe("lona-otp");
    // The API key rides in the URL path, never in the body.
    expect(Object.keys(lastCall!.data)).toEqual(["receptor", "token", "template"]);
  });

  test("the API key is taken from the Convex env, not the arguments", async () => {
    process.env.KAVENEGAR_API_KEY = "another-key";
    await callSendOtp({ phone: "09121234567", token: "1" });
    expect(lastCall!.path).toBe("another-key");
  });
});

describe("Kavenegar adapter — failure mapping", () => {
  test("a non-200 provider status becomes KAVENEGAR_REJECTED", async () => {
    behaviour = { kind: "status", status: 424 };
    await expect(
      callSendOtp({ phone: "09121234567", token: "123456" }),
    ).rejects.toMatchObject({ code: KAVENEGAR_ERRORS.rejected });
  });

  test("a transport failure (status undefined) becomes KAVENEGAR_UNREACHABLE", async () => {
    behaviour = { kind: "transportError" };
    await expect(
      callSendOtp({ phone: "09121234567", token: "123456" }),
    ).rejects.toMatchObject({ code: KAVENEGAR_ERRORS.unreachable });
  });

  test("thrown error codes never carry the key, the token or a provider message", async () => {
    behaviour = { kind: "status", status: 418 };
    const error = await callSendOtp({
      phone: "09121234567",
      token: "042197",
    }).catch((e: unknown) => e as Error & { code: string });

    const surface = `${error.name}:${error.code}:${error.message}`;
    expect(surface).not.toContain("test-key-not-real");
    expect(surface).not.toContain("042197");
    expect(surface).not.toContain("سرویس");
    expect(error.code).toBe(KAVENEGAR_ERRORS.rejected);
  });

  test("a KavenegarError is never reported as success", async () => {
    behaviour = { kind: "transportError" };
    let resolved = false;
    await callSendOtp({ phone: "09121234567", token: "123456" })
      .then(() => {
        resolved = true;
      })
      .catch(() => {});
    expect(resolved).toBe(false);
  });
});
