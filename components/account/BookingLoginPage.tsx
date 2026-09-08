"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { requestLoginOtp, verifyLoginOtp } from "@/lib/api";
import { maskEmail } from "@/lib/format";
import { saveSession } from "@/lib/auth";
import AccountShell from "./AccountShell";
import OtpInput from "@/components/booking/OtpInput";
import { TextField, labelClass } from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

const RESEND_COOLDOWN_SECONDS = 30;

function MailIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export default function BookingLoginPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resentNotice, setResentNotice] = useState(false);

  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  async function requestCode() {
    setError(null);
    try {
      const result = await requestLoginOtp({ email: email.trim() });
      if (!result.ok) {
        console.warn("auth/otp/request failed:", result.status, result.message);
        setError(result.message);
        return false;
      }
      setPhase("code");
      startCooldown();
      return true;
    } catch (err) {
      console.error("auth/otp/request threw unexpectedly:", err);
      setError("Something went wrong sending the code. Please try again.");
      return false;
    }
  }

  async function handleSendCode(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSending(true);
    try {
      await requestCode();
    } finally {
      setSending(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResentNotice(false);
    try {
      const ok = await requestCode();
      if (ok) {
        setCode("");
        setResentNotice(true);
      }
    } finally {
      setResending(false);
    }
  }

  async function verifyCode(candidate: string) {
    setError(null);
    setVerifying(true);
    try {
      const result = await verifyLoginOtp({ email: email.trim(), code: candidate });
      if (!result.ok) {
        console.warn("auth/otp/login failed:", result.status, result.message);
        setError(result.message);
        return;
      }
      saveSession("booking", { accessToken: result.data.access, refreshToken: result.data.refresh, user: result.data.user });
      router.push("/dashboard");
    } catch (err) {
      console.error("auth/otp/login threw unexpectedly:", err);
      setError("Something went wrong verifying the code. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  function handleVerifySubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (code.length === 6) verifyCode(code);
  }

  function handleChangeEmail() {
    setPhase("email");
    setCode("");
    setError(null);
    setResentNotice(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setCooldown(0);
  }

  const cooldownLabel = cooldown > 0 ? `Resend in 00:${String(cooldown).padStart(2, "0")}` : "Resend code";

  return (
    <AccountShell
      eyebrow="Booking account"
      title="Log in to your booking account"
      description="For parents, students, and training institutes booking event tickets."
    >
      <div className="glass-panel relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl p-8 sm:p-10">
        <div className="tech-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
          <MailIcon />
        </div>

        {phase === "email" ? (
          <form onSubmit={handleSendCode} className="relative flex w-full flex-col gap-5">
            <div className="text-center">
              <h2 className="font-display text-xl font-bold text-primary">Welcome back</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                No password needed — enter your email and we&rsquo;ll send you a one-time code to log in.
              </p>
            </div>

            <TextField
              label="Email"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="jane@email.com"
            />

            {error && (
              <Alert tone="error" emphasize>
                {error}
              </Alert>
            )}

            <Button type="submit" variant="primary" size="lg" loading={sending} loadingLabel="Sending code…" className="w-full">
              Send login code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="relative flex w-full flex-col items-center gap-5">
            <div className="text-center">
              <h2 className="font-display text-xl font-bold text-primary">Enter your code</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                We sent a 6-digit code to <span className="font-semibold text-primary">{maskEmail(email)}</span>.
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className={labelClass}>Verification code</span>
              <OtpInput value={code} onChange={setCode} onComplete={verifyCode} disabled={verifying} error={Boolean(error)} />
            </div>

            {error && (
              <Alert tone="error" emphasize className="w-full">
                {error}
              </Alert>
            )}
            {resentNotice && !error && (
              <Alert tone="success" className="w-full">
                New code sent.
              </Alert>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={verifying}
              loadingLabel="Verifying…"
              disabled={code.length < 6}
              className="w-full"
              icon={code.length === 6 && !verifying ? <CheckIcon /> : undefined}
            >
              Verify and log in
            </Button>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="focus-ring press rounded-md text-xs font-semibold text-secondary transition-colors hover:text-primary disabled:cursor-not-allowed disabled:text-muted"
              >
                {resending ? "Resending…" : cooldownLabel}
              </button>
              <span className="h-3 w-px bg-primary/15" aria-hidden="true" />
              <button
                type="button"
                onClick={handleChangeEmail}
                className="focus-ring press rounded-md text-xs font-semibold text-muted transition-colors hover:text-primary"
              >
                Change email
              </button>
            </div>
          </form>
        )}
      </div>
    </AccountShell>
  );
}
