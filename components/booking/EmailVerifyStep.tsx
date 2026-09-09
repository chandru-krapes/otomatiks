"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { AuthTokens, AuthUser } from "@/lib/types";
import { requestCheckoutOtp, verifyCheckoutOtp } from "@/lib/api";
import { isValidEmail, maskEmail } from "@/lib/format";
import { TextField, labelClass } from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import OtpInput from "./OtpInput";

const RESEND_COOLDOWN_SECONDS = 30;

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}


export default function EmailVerifyStep({ onVerified }: { onVerified: (auth: AuthTokens & { user: AuthUser }) => void }) {
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
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
      // `full_name` is best-effort account-creation seeding only (see CheckoutOtpRequestPayload)
      // — the backend falls back to the email's local part when it's blank, and "Your details"
      // (step 2) collects the real name right after this step anyway.
      const result = await requestCheckoutOtp({ email: email.trim(), full_name: "" });
      if (!result.ok) {
        console.warn("checkout/otp/request failed:", result.status, result.message);
        setError(result.message);
        return false;
      }
      setPhase("code");
      startCooldown();
      return true;
    } catch (err) {

      console.error("checkout/otp/request threw unexpectedly:", err);
      setError("Something went wrong sending the code. Please try again.");
      return false;
    }
  }

  async function handleSendCode(event: FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(null);
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
      const result = await verifyCheckoutOtp({ email: email.trim(), code: candidate });
      if (!result.ok) {
        console.warn("checkout/otp/verify failed:", result.status, result.message);
        setError(result.message);
        return;
      }
      onVerified(result.data);
    } catch (err) {
      console.error("checkout/otp/verify threw unexpectedly:", err);
      setError("Something went wrong verifying the code. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  function handleVerifySubmit(event: FormEvent) {
    event.preventDefault();
    if (code.length === 6) verifyCode(code);
  }

  const cooldownLabel = cooldown > 0 ? `Resend in 00:${String(cooldown).padStart(2, "0")}` : "Resend code";

  if (phase === "email") {
    return (
      <form onSubmit={handleSendCode} className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-muted">
          No password needed — we&rsquo;ll email you a one-time code to verify it&rsquo;s really you.
        </p>
        <TextField
          label="Email"
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (emailError) setEmailError(null);
          }}
          onBlur={() => {
            if (email.trim() && !isValidEmail(email)) setEmailError("Enter a valid email address.");
          }}
          error={emailError ?? undefined}
          placeholder="jane@email.com"
          fieldClassName="max-w-xs"
        />
        {error && (
          <Alert tone="error" emphasize>
            {error}
          </Alert>
        )}
        <Button type="submit" loading={sending} loadingLabel="Sending code…" className="w-fit">
          Send verification code
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifySubmit} className="flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-muted">
        We sent a 6-digit code to <span className="font-semibold text-primary">{maskEmail(email)}</span>. Enter it below to
        continue.
      </p>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Verification code</span>
        <OtpInput value={code} onChange={setCode} onComplete={verifyCode} disabled={verifying} error={Boolean(error)} />
      </div>

      {error && (
        <Alert tone="error" emphasize>
          {error}
        </Alert>
      )}
      {resentNotice && !error && <Alert tone="success">New code sent.</Alert>}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" loading={verifying} loadingLabel="Verifying…" disabled={code.length < 6} className="w-fit" icon={code.length === 6 && !verifying ? <CheckIcon /> : undefined}>
          Verify code
        </Button>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="focus-ring press rounded-md text-xs font-semibold text-secondary transition-colors hover:text-primary disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {resending ? "Resending…" : cooldownLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            setPhase("email");
            setCode("");
            setError(null);
            setResentNotice(false);
            if (timerRef.current) clearInterval(timerRef.current);
            setCooldown(0);
          }}
          className="focus-ring press rounded-md text-xs font-semibold text-muted transition-colors hover:text-primary"
        >
          Change email
        </button>
      </div>
    </form>
  );
}
