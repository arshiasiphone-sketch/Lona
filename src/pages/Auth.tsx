import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Reveal } from "@/components/motion/Reveal";
import { LonaLogo } from "@/components/brand/LonaLogo";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard"
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
    } catch (error) {
      // Convex wraps server throws — surface the real message
      const raw = error instanceof Error ? error.message : String(error);
      // Extract the server message after the Convex prefix
      const msg = raw.includes("Uncaught Error:") ? raw.split("Uncaught Error:").pop()!.trim() : raw;
      setError(msg || "ارسال کد تأیید با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      const msg = raw.includes("Uncaught Error:") ? raw.split("Uncaught Error:").pop()!.trim() : raw;
      // Invalid OTP from Convex Auth usually contains "Invalid" / "expired" / "code"
      if (/invalid|expired|code/i.test(msg)) {
        setError("کد تأیید وارد شده نادرست یا منقضی شده است.");
      } else {
        setError(msg || "کد تأیید وارد شده نادرست است.");
      }
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

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
              <p className="type-eyebrow text-ink-muted">
                بوتیک لونا
              </p>
              <h1 className="mt-3 font-display text-3xl leading-[1.05] text-ink">
                {step === "signIn" ? "به بوتیک خوش آمدید." : "نامه‌ای برای شما رسید."}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {step === "signIn"
                  ? "با ایمیل خود وارد شوید یا حساب جدید بسازید. یک کد شش‌رقمی برایتان ارسال می‌شود."
                  : `کد شش‌رقمی ارسال‌شده به ${(step as { email: string }).email} را وارد کنید.`}
              </p>

              {error && (
                <p className="mt-4 text-sm text-destructive">{error}</p>
              )}

              {step === "signIn" ? (
                <form onSubmit={handleEmailSubmit} className="mt-7 space-y-4">
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                    <Input
                      name="email"
                      placeholder="name@example.com"
                      type="email"
                      dir="ltr"
                      className="h-12 rounded-full border-edge bg-canvas/60 pr-10 pl-4 text-sm text-ink placeholder:text-ink-muted"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full bg-ink text-[11px] font-medium uppercase tracking-[0.22em] text-canvas hover:bg-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال ارسال
                      </>
                    ) : (
                      <>
                        ادامه
                        <ArrowRight className="mr-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} className="mt-7 space-y-4">
                  <input type="hidden" name="email" value={(step as { email: string }).email} />
                  <input type="hidden" name="code" value={otp} />
                  <div className="flex justify-center" dir="ltr">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="h-12 w-10 rounded-xl border-edge bg-canvas/60 text-base font-medium text-ink sm:h-14"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full bg-ink text-[11px] font-medium uppercase tracking-[0.22em] text-canvas hover:bg-primary"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال بررسی
                      </>
                    ) : (
                      <>
                        ورود به بوتیک
                        <ArrowRight className="mr-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("signIn")}
                    className="w-full text-[11px] uppercase tracking-[0.18em] text-ink-soft"
                  >
                    استفاده از ایمیل دیگر
                  </Button>
                </form>
              )}

              <p className="mt-8 text-xs leading-relaxed text-ink-muted">
                با ورود، شرایط حریم خصوصی و بازگشت کالا را می‌پذیرید. هیچ ایمیل
                تبلیغاتی برای شما ارسال نخواهد شد.
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
