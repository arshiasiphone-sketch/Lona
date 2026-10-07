/**
 * LONA — ورود با شماره موبایل و کد پیامکی.
 *
 * Convex Auth owns authentication. This page only:
 *   1. normalizes the entered number to the canonical `+98…` form,
 *   2. asks Convex Auth to send a code (delivered via Kavenegar),
 *   3. submits the code back to Convex Auth for verification.
 *
 * There is no client-side session, token or OTP storage of any kind.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  ArrowRight,
  KeyRound,
  Loader2,
  Pencil,
  Phone as PhoneIcon,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { LonaLogo } from "@/components/brand/LonaLogo";
import {
  formatIranianMobileFa,
  maskIranianMobileFa,
  normalizeIranianMobile,
  toAsciiDigits,
  toPersianDigits,
} from "@/convex/auth/phoneNumber";
import { PHONE_AUTH_ERRORS } from "@/convex/auth/phoneErrors";

const OTP_LENGTH = 6;
/** Mirrors the backend window in `convex/auth/otpThrottle.ts`. */
const RESEND_COOLDOWN_SECONDS = 60;
/** Mirrors the provider's `maxAge` in `convex/auth/phoneOtp.ts`. */
const CODE_TTL_SECONDS = 5 * 60;

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/account") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

/** Remove Convex's transport prefix so only our stable code remains. */
function extractErrorCode(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const withoutPrefix = raw.includes("Uncaught Error:")
    ? raw.split("Uncaught Error:").pop()!.trim()
    : raw;
  return withoutPrefix;
}

/**
 * Map a failure to a safe Persian message. No provider internals, no
 * HTTP status codes, no Kavenegar payloads ever reach the customer.
 */
function authErrorMessage(error: unknown, stage: "phone" | "code"): string {
  const message = extractErrorCode(error);

  if (message.includes(PHONE_AUTH_ERRORS.invalidPhone)) {
    return "شماره موبایل واردشده معتبر نیست.";
  }
  if (message.includes(PHONE_AUTH_ERRORS.phoneMismatch)) {
    return "کد تأیید اشتباه است.";
  }
  if (message.includes(PHONE_AUTH_ERRORS.rateLimited)) {
    return "برای ارسال کد جدید کمی صبر کنید.";
  }
  if (message.includes(PHONE_AUTH_ERRORS.smsNotConfigured)) {
    return "سامانه پیامک در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید.";
  }
  // Configuration problem on the SMS side — retrying immediately would
  // only loop, so the copy says so instead of "try again".
  if (message.includes(PHONE_AUTH_ERRORS.smsNotReady)) {
    return "سامانه پیامک هنوز فعال نشده است. لطفاً بعداً تلاش کنید یا با پشتیبانی تماس بگیرید.";
  }
  if (message.includes(PHONE_AUTH_ERRORS.smsUnavailable)) {
    return "ارسال کد تأیید انجام نشد. لطفاً چند لحظه بعد دوباره تلاش کنید.";
  }
  if (/expired|منقضی/i.test(message)) {
    return "کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید.";
  }
  if (/too many|rate limit/i.test(message)) {
    return "تعداد تلاش‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره امتحان کنید.";
  }
  if (/invalid|incorrect|wrong|code/i.test(message)) {
    return "کد تأیید اشتباه است.";
  }
  return stage === "phone"
    ? "ارسال کد تأیید انجام نشد. لطفاً دوباره تلاش کنید."
    : "کد تأیید اشتباه است. لطفاً دوباره تلاش کنید.";
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth
  );

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [canonicalPhone, setCanonicalPhone] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [codeTtl, setCodeTtl] = useState(0);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  // Resend countdown. Purely presentational — the authoritative limit is
  // the server-side throttle in `convex/auth/otpThrottle.ts`.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  // Code validity countdown (advisory; Convex Auth enforces the real TTL).
  useEffect(() => {
    if (codeTtl <= 0) return;
    const timer = window.setTimeout(() => setCodeTtl(codeTtl - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [codeTtl]);

  const requestCode = async () => {
    const normalized = normalizeIranianMobile(phoneInput);
    if (!normalized) {
      setPhoneError("شماره موبایل واردشده معتبر نیست.");
      return;
    }
    setPhoneError(null);
    setError(null);
    setIsLoading(true);
    try {
      await signIn("phone", { phone: normalized });
      setCanonicalPhone(normalized);
      setOtp("");
      setStep("code");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setCodeTtl(CODE_TTL_SECONDS);
    } catch (signInError) {
      setError(authErrorMessage(signInError, "phone"));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!canonicalPhone || otp.length !== OTP_LENGTH) return;
    setError(null);
    setIsLoading(true);
    try {
      await signIn("phone", { phone: canonicalPhone, code: otp });
      navigate(redirect, { replace: true });
    } catch (verifyError) {
      setError(authErrorMessage(verifyError, "code"));
      setOtp("");
      setCodeTtl(0);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPhone = () => {
    setStep("phone");
    setOtp("");
    setError(null);
    setCooldown(0);
    setCodeTtl(0);
  };

  const handlePhoneSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    void requestCode();
  };

  const handleCodeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    void verifyCode();
  };

  const resendDisabled = isLoading || cooldown > 0;

  // Auto-submit once all six digits are entered. `otp.length !== 6` guards
  // against auto-submitting while a fresh code is still being typed.
  useEffect(() => {
    if (step !== "code" || otp.length !== OTP_LENGTH || isLoading) return;
    void verifyCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- verifyCode reads only otp/canonicalPhone/isLoading
  }, [otp, step, isLoading]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Atmospheric background */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[640px] w-[640px] rounded-full bg-accent/40 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[640px] w-[640px] rounded-full bg-rose-quartz/30 blur-[160px] opacity-50" />

      <Link
        to="/"
        className="absolute right-6 top-6 z-10 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-muted transition hover:text-ink"
      >
        خانه
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>

      <LonaLogo
        variant="default"
        size={48}
        title="لوگوی لونا"
        className="absolute left-6 top-6 z-10 h-12 w-12"
      />

      <div className="relative grid min-h-screen place-items-center px-6 py-32">
        <Reveal className="w-full max-w-md">
          <div className="glass-strong relative overflow-hidden rounded-3xl p-8">
            <div className="pointer-events-none absolute -left-20 -top-20 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />

            <div className="relative">
              <p className="type-eyebrow text-ink-muted">بوتیک لونا</p>
              <h1 className="mt-3 font-display text-3xl leading-[1.05] text-ink">
                {step === "phone" ? "ورود به لونا." : "کد تأیید را وارد کنید."}
              </h1>
              <p
                className="mt-3 text-sm leading-relaxed text-ink-soft"
                aria-live="polite"
              >
                {step === "phone" ? (
                  "شماره موبایل خود را وارد کنید. یک کد شش‌رقمی برایتان پیامک می‌شود و با آن وارد می‌شوید یا حساب می‌سازید."
                ) : (
                  <>
                    کد تأیید به شماره{" "}
                    <span className="text-ink" dir="rtl">
                      {canonicalPhone
                        ? formatIranianMobileFa(canonicalPhone)
                        : ""}
                    </span>{" "}
                    ارسال شد.
                  </>
                )}
              </p>

              <div
                role="alert"
                aria-live="assertive"
                className={error ? "mt-4 text-sm text-destructive" : "sr-only"}
              >
                {error ?? ""}
              </div>

              {step === "phone" ? (
                <form onSubmit={handlePhoneSubmit} className="mt-7 space-y-4">
                  <div>
                    <label
                      htmlFor="lona-phone"
                      className="type-eyebrow text-ink-muted"
                    >
                      شماره موبایل
                    </label>
                    <div className="relative mt-2">
                      <PhoneIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                      <Input
                        id="lona-phone"
                        name="phone"
                        value={phoneInput}
                        onChange={(event) => {
                          setPhoneInput(toAsciiDigits(event.target.value));
                          if (phoneError) setPhoneError(null);
                        }}
                        placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        autoFocus
                        dir="ltr"
                        aria-invalid={phoneError ? true : undefined}
                        aria-describedby={phoneError ? "lona-phone-error" : undefined}
                        disabled={isLoading}
                        className="h-12 rounded-full border-edge bg-canvas/60 pr-11 pl-4 text-left text-sm tracking-[0.08em] text-ink placeholder:text-ink-muted"
                      />
                    </div>
                    {phoneError ? (
                      <p
                        id="lona-phone-error"
                        className="mt-2 text-xs text-destructive"
                      >
                        {phoneError}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full bg-ink text-[11px] font-medium uppercase tracking-[0.22em] text-canvas hover:bg-primary"
                    disabled={isLoading || phoneInput.trim().length === 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال ارسال
                      </>
                    ) : (
                      <>
                        دریافت کد تأیید
                        <ArrowRight className="mr-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleCodeSubmit} className="mt-7 space-y-4">
                  <div>
                    <label
                      htmlFor="lona-otp"
                      className="type-eyebrow text-ink-muted"
                    >
                      کد تأیید
                    </label>
                    <div className="mt-3 flex justify-center" dir="ltr">
                      <InputOTP
                        id="lona-otp"
                        value={otp}
                        onChange={(value) => {
                          setError(null);
                          setOtp(toAsciiDigits(value).slice(0, OTP_LENGTH));
                        }}
                        maxLength={OTP_LENGTH}
                        pattern="[0-9\u06F0-\u06F9]*"
                        inputMode="numeric"
                        autoFocus
                        disabled={isLoading}
                        containerClassName="justify-center"
                        aria-label="کد تأیید شش‌رقمی"
                      >
                        <InputOTPGroup>
                          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className="h-12 w-10 rounded-xl border-edge bg-canvas/60 text-base font-medium text-ink sm:h-14"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full bg-ink text-[11px] font-medium uppercase tracking-[0.22em] text-canvas hover:bg-primary"
                    disabled={isLoading || otp.length !== OTP_LENGTH}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال بررسی
                      </>
                    ) : (
                      <>
                        تأیید و ورود
                        <ArrowRight className="mr-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <div className="flex flex-col items-center gap-2">
                    <p
                      className="text-[11px] text-ink-muted tabular-nums"
                      aria-live="off"
                    >
                      {codeTtl > 0
                        ? `اعتبار کد: ${toPersianDigits(
                            `${String(Math.floor(codeTtl / 60)).padStart(2, "0")}:${String(
                              codeTtl % 60
                            ).padStart(2, "0")}`
                          )}`
                        : "کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید."}
                    </p>
                    <button
                      type="button"
                      onClick={() => void requestCode()}
                      disabled={resendDisabled}
                      className="inline-flex min-h-11 items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-soft transition hover:text-ink disabled:opacity-50"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      {cooldown > 0
                        ? `ارسال مجدد تا ${toPersianDigits(
                            `${String(Math.floor(cooldown / 60)).padStart(2, "0")}:${String(
                              cooldown % 60
                            ).padStart(2, "0")}`
                          )}`
                        : "ارسال مجدد کد"}
                    </button>

                    <button
                      type="button"
                      onClick={resetPhone}
                      disabled={isLoading}
                      className="inline-flex min-h-11 items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-soft transition hover:text-ink disabled:opacity-50"
                    >
                      <Pencil className="h-3 w-3" />
                      ویرایش شماره موبایل
                    </button>
                  </div>

                  <p className="text-center text-[11px] text-ink-muted">
                    کد به شماره{" "}
                    {canonicalPhone ? maskIranianMobileFa(canonicalPhone) : ""}{" "}
                    ارسال شده است.
                  </p>
                </form>
              )}

              <p className="mt-8 text-xs leading-relaxed text-ink-muted">
                با ورود، شرایط استفاده، حریم خصوصی و سیاست بازگشت کالا را
                می‌پذیرید. شماره شما تنها برای ورود و پیگیری سفارش‌ها استفاده
                می‌شود و هیچ پیامک تبلیغاتی برای شما ارسال نخواهد شد.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
