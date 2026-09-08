"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ConfirmationResult } from "firebase/auth";
import { signInWithPhoneNumber } from "firebase/auth";
import type { AuthTokens, AuthUser } from "@/lib/types";
import { verifyCheckoutPhone } from "@/lib/api";
import { FirebaseNotConfiguredError, RecaptchaVerifier, getFirebaseAuth } from "@/lib/firebase";
import { TextField, labelClass } from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import OtpInput from "./OtpInput";

const RESEND_COOLDOWN_SECONDS = 30;
const RECAPTCHA_CONTAINER_ID = "checkout-phone-recaptcha";

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

export default function PhoneVerifyStep({ onVerified }: { onVerified: (auth: AuthTokens & { user: AuthUser }) => void }) {
  const [phase, setPhase] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
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

      const result = await verifyCheckoutPhone({ id_token: idToken, full_name: fullName.trim() });
      if (!result.ok) {
        console.warn("checkout/phone/verify failed:", result.status, result.message);
        setError(result.message);
        return;
      }
      onVerified(result.data);
    } catch (err) {
      console.warn("Phone code verification failed:", err);
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
        <form onSubmit={handleSendCode} className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed text-muted">
            No password needed — we&rsquo;ll text you a one-time code to verify it&rsquo;s really you.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Full name"
              required
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Jane Doe"
            />
            <TextField
              label="Phone"
              required
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 90000 00000"
            />
          </div>
          {error && (
            <Alert tone="error" emphasize>
              {error}
            </Alert>
          )}
          <Button type="submit" loading={sending} loadingLabel="Sending code…" className="w-fit">
            Send verification code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifySubmit} className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed text-muted">
            We sent a 6-digit code to <span className="font-semibold text-primary">{toE164(phone) ?? phone}</span>. Enter it
            below to continue.
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
