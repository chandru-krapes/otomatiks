"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { confirmPasswordReset } from "@/lib/api";
import AccountShell from "./AccountShell";
import { PasswordField } from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

/**
 * Step 2 of the shared password-reset flow — `POST
 * /api/v1/auth/password-reset/confirm/` with the `token` from the emailed
 * link. Not account-type-specific (see ForgotPasswordPage's doc comment),
 * so on success this can't know whether the visitor holds a booking or
 * community account — it offers both login destinations rather than
 * guessing.
 */
export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }

    setSubmitting(true);
    const result = await confirmPasswordReset({ token: token as string, new_password: password });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <AccountShell eyebrow="Reset password" title="Reset your password">
        <EmptyState
          title="This reset link is invalid"
          description="The link is missing its token — it may have been copied incorrectly. Request a new one to try again."
          action={
            <Button href="/forgot-password" variant="primary">
              Request a new link
            </Button>
          }
        />
      </AccountShell>
    );
  }

  if (done) {
    return (
      <AccountShell eyebrow="Reset password" title="Password updated">
        <div className="glass-panel flex flex-col gap-6 rounded-3xl p-8">
          <Alert tone="success">Your password has been reset. You can now log in with your new password.</Alert>
          <div className="flex flex-wrap items-center gap-3">
            <Button href="/login" variant="primary">
              Log in to booking account
            </Button>
            <Button href="/community/login" variant="secondary">
              Log in to community account
            </Button>
          </div>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell eyebrow="Reset password" title="Choose a new password" description="Make it at least 8 characters.">
      <form onSubmit={handleSubmit} className="glass-panel flex flex-col gap-6 rounded-3xl p-8">
        <PasswordField
          label="New password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
        />
        <PasswordField
          label="Confirm new password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Retype your new password"
        />

        {error && <Alert tone="error" emphasize>{error}</Alert>}

        <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
          Reset password
        </Button>
      </form>
    </AccountShell>
  );
}
