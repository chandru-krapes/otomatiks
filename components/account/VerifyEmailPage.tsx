"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/api";
import AccountShell from "./AccountShell";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

/**
 * Lands on `/verify-email?token=...` from the link in the verification
 * email (sent on `registerAccount()` — see BookingLoginPage's
 * `email_not_verified` handling). Fires `POST /api/v1/auth/verify-email/`
 * with the `token` on mount and, once it succeeds, forwards the same
 * `token` on to `/my-registration` — the account's booking, viewable right
 * away with no separate login step — rather than lingering here.
 */
export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    verifyEmail({ token }).then((result) => {
      if (!result.ok) {
        setStatus("error");
        setError(result.message);
        return;
      }
      router.replace(`/my-registration?token=${encodeURIComponent(token)}`);
    });
  }, [token, router]);

  if (!token) {
    return (
      <AccountShell eyebrow="Verify email" title="Verify your email">
        <EmptyState
          title="This verification link is invalid"
          description="The link is missing its token — it may have been copied incorrectly. Log in and request a new one to try again."
          action={
            <Button href="/login" variant="primary">
              Go to login
            </Button>
          }
        />
      </AccountShell>
    );
  }

  if (status === "error") {
    return (
      <AccountShell eyebrow="Verify email" title="Couldn't verify your email">
        <div className="glass-panel flex flex-col gap-6 rounded-3xl p-8">
          <Alert tone="error" emphasize>{error}</Alert>
          <div className="flex flex-wrap items-center gap-3">
            <Button href="/login" variant="primary">
              Go to login
            </Button>
          </div>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell eyebrow="Verify email" title="Verifying your email…" description="Just a moment.">
      <div className="glass-panel flex flex-col gap-6 rounded-3xl p-8">
        <p className="text-sm text-muted">Confirming your verification link — you&apos;ll be sent to log in once it&apos;s done.</p>
      </div>
    </AccountShell>
  );
}
