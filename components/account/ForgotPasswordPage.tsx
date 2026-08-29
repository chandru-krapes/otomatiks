"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset } from "@/lib/api";
import AccountShell from "./AccountShell";
import { TextField } from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

/**
 * Step 1 of the shared password-reset flow — `POST /api/v1/auth/password-reset/`.
 * Not scoped to booking vs. community accounts (the endpoint lives under the
 * generic `/auth/` namespace, and both login pages send buyers here), so this
 * only branches on `?from=` to send "Back to login" to wherever the visitor
 * actually came from.
 *
 * The backend returns the same generic response whether or not the email is
 * registered (so this can't be used to enumerate accounts) — the UI mirrors
 * that: submitting always ends on the same "check your inbox" state, never a
 * "no account found" error.
 */
export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const loginHref = from === "community" ? "/community/login" : "/login";

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await requestPasswordReset({ email });
    setSubmitting(false);

    // A failure here means the request itself didn't go through (network,
    // malformed input) — not that the email is unknown, which the backend
    // deliberately doesn't distinguish.
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSubmitted(true);
  }

  return (
    <AccountShell
      eyebrow="Reset password"
      title="Forgot your password?"
      description="Enter the email on your account and we'll send you a link to reset your password."
      backHref={loginHref}
      backLabel="Back to login"
    >
      <div className="glass-panel flex flex-col gap-6 rounded-3xl p-8">
        {submitted ? (
          <>
            <Alert tone="success">
              If an account exists for <strong>{email}</strong>, we&rsquo;ve sent a link to reset your password.
              Check your inbox (and spam folder) — the link expires after a while, so use it soon.
            </Alert>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSubmitted(false);
                  setError(null);
                }}
              >
                Use a different email
              </Button>
              <Button href={loginHref} variant="tertiary">
                Back to login
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <TextField
              label="Email"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
            />

            {error && <Alert tone="error" emphasize>{error}</Alert>}

            <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
              Send reset link
            </Button>

            <p className="text-center text-sm text-muted">
              Remembered it?{" "}
              <Link href={loginHref} className="focus-ring rounded-md font-semibold text-secondary hover:text-primary">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </AccountShell>
  );
}
