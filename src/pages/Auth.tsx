import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, Loader2, Mail, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Reveal } from "@/components/motion/Reveal";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/account"
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
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again."
      );
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
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(
        `Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Atmospheric background */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[640px] w-[640px] rounded-full bg-accent/40 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[640px] w-[640px] rounded-full bg-rose-quartz/30 blur-[160px] opacity-50" />

      <Link
        to="/"
        className="absolute left-6 top-6 z-10 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        The House
      </Link>

      <p className="absolute right-6 top-6 z-10 font-display text-lg tracking-[0.36em] text-ink">
        ÆON
      </p>

      <div className="relative grid min-h-screen place-items-center px-6 py-32">
        <Reveal className="w-full max-w-md">
          <div className="glass-strong relative overflow-hidden rounded-3xl p-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />

            <div className="relative">
              <p className="type-eyebrow text-ink-muted">
                The Atelier Workspace
              </p>
              <h1 className="mt-3 font-display text-3xl leading-[1.05] text-ink">
                {step === "signIn" ? "Enter the atelier." : "A letter has arrived."}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {step === "signIn"
                  ? "Sign in or create an account with your email. We send a six-letter code."
                  : `Enter the six-letter code we sent to ${(step as { email: string }).email}.`}
              </p>

              {error && (
                <p className="mt-4 text-sm text-destructive">{error}</p>
              )}

              {step === "signIn" ? (
                <form onSubmit={handleEmailSubmit} className="mt-7 space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                    <Input
                      name="email"
                      placeholder="name@example.com"
                      type="email"
                      className="h-12 rounded-full border-edge bg-canvas/60 pl-10 text-sm text-ink placeholder:text-ink-muted"
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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <div className="relative py-3">
                    <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-edge" />
                    <span className="relative mx-auto block w-fit bg-canvas-soft px-3 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                      Or
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-full hairline text-[11px] font-medium uppercase tracking-[0.18em] text-ink hover:bg-white/60"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Continue as Guest
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} className="mt-7 space-y-4">
                  <input type="hidden" name="email" value={(step as { email: string }).email} />
                  <input type="hidden" name="code" value={otp} />
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                          const form = (e.target as HTMLElement).closest("form");
                          if (form) form.requestSubmit();
                        }
                      }}
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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying
                      </>
                    ) : (
                      <>
                        Enter the Atelier
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("signIn")}
                    className="w-full text-[11px] uppercase tracking-[0.18em] text-ink-soft"
                  >
                    Use a different email
                  </Button>
                </form>
              )}

              <p className="mt-8 text-xs leading-relaxed text-ink-muted">
                By signing in you accept our quiet privacy notice. No marketing.
                No re-targeting.
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
