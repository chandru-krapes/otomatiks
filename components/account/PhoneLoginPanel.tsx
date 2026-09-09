"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ConfirmationResult } from "firebase/auth";
import { signInWithPhoneNumber } from "firebase/auth";
import type { AuthTokens, AuthUser } from "@/lib/types";
import { verifyPhoneLoginOtp } from "@/lib/api";
import { FirebaseNotConfiguredError, RecaptchaVerifier, getFirebaseAuth } from "@/lib/firebase";
import { TextField, labelClass } from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import OtpInput from "@/components/booking/OtpInput";

const RESEND_COOLDOWN_SECONDS = 30;
const RECAPTCHA_CONTAINER_ID = "login-phone-recaptcha";

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function toE164(raw: string): string | null {
  const trimmed = raw.replace(/[\s()-]/g, "");
  const withCountryCode = trimmed.startsWith("+") ? trimmed : trimmed.startsWith("91") ? `+${trimmed}` : `+91${trimmed}`;
  return /^\+[1-9]\d{7,14}$/.test(withCountryCode) ? withCountryCode : null;
}

function firebaseErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? "";
  if (code === "auth/invalid-phone-number") return "That doesn't look like a valid phone number.";
  if (code === "auth/too-many-requests") return "Too many attempts — please wait a while before trying again.";
  if (code === "auth/code-expired") return "This code has expired. Request a new one.";
  if (code === "auth/invalid-verification-code") return "That code isn't right. Check it and try again.";
  if (error instanceof FirebaseNotConfiguredError) return error.message;
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

/**
 * `/login`'s phone-based counterpart to the page's default email-OTP flow — shown instead of (or
 * alongside, as a toggle) email when `VerificationPolicy.signup_verification` makes phone the
 * (or an) accepted login method. See BookingLoginPage and lib/useVerificationPolicy.
 *
 * Unlike components/booking/PhoneVerifyStep (checkout), this never creates an account — only an
 * existing phone-verified one can log in this way (services.login_with_verified_phone on the
 * backend), so there's no full-name field to collect.
 */
export default function PhoneLoginPanel({ onLoggedIn }: { onLoggedIn: (auth: AuthTokens & { user: AuthUser }) => void }) {
  const [phase, setPhase] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resentNotice, setResentNotice] = useState(false);

  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      verifierRef.current?.clear();
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

  function getVerifier(): RecaptchaVerifier {
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(getFirebaseAuth(), RECAPTCHA_CONTAINER_ID, { size: "invisible" });
    }
    return verifierRef.current;
  }

  async function requestCode() {
    setError(null);
    const e164 = toE164(phone);
    if (!e164) {
      setError("Enter a valid phone number, with country code if it's not Indian.");
      return false;
    }
    try {
      const confirmation = await signInWithPhoneNumber(getFirebaseAuth(), e164, getVerifier());
      confirmationRef.current = confirmation;
      setPhase("code");
      startCooldown();
      return true;
    } catch (err) {
      console.warn("Firebase signInWithPhoneNumber failed:", err);
      setError(firebaseErrorMessage(err));
      verifierRef.current?.clear();
      verifierRef.current = null;
      return false;
    }
  }

  async function handleSendCode(event: FormEvent) {
    event.preventDefault();
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
      const confirmation = confirmationRef.current;
      if (!confirmation) {
        setError("That code expired — request a new one.");
        setPhase("phone");
        return;
      }
      const credential = await confirmation.confirm(candidate);
      const idToken = await credential.user.getIdToken();
      await getFirebaseAuth().signOut();

      const result = await verifyPhoneLoginOtp({ id_token: idToken });
      if (!result.ok) {
        console.warn("auth/otp/phone/login failed:", result.status, result.message);
        setError(result.message);
        return;
      }
      onLoggedIn(result.data);
    } catch (err) {
      console.warn("Phone login code verification failed:", err);
      setError(firebaseErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  }

  function handleVerifySubmit(event: FormEvent) {
    event.preventDefault();
    if (code.length === 6) verifyCode(code);
  }

  const cooldownLabel = cooldown > 0 ? `Resend in 00:${String(cooldown).padStart(2, "0")}` : "Resend code";

  return (
    <>
      {phase === "phone" ? (
        <form onSubmit={handleSendCode} className="relative flex w-full flex-col gap-5">
          <div className="text-center">
            <h2 className="font-display text-xl font-bold text-primary">Welcome back</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              No password needed — enter your phone number and we&rsquo;ll text you a one-time code to log in.
            </p>
          </div>

          <TextField
            label="Phone"
            required
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+91 90000 00000"
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
              We sent a 6-digit code to <span className="font-semibold text-primary">{toE164(phone) ?? phone}</span>.
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
              onClick={() => {
                setPhase("phone");
                setCode("");
                setError(null);
                setResentNotice(false);
                if (timerRef.current) clearInterval(timerRef.current);
                setCooldown(0);
              }}
              className="focus-ring press rounded-md text-xs font-semibold text-muted transition-colors hover:text-primary"
            >
              Change number
            </button>
          </div>
        </form>
      )}
      <div id={RECAPTCHA_CONTAINER_ID} />
    </>
  );
}
