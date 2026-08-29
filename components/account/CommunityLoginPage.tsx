"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { claimCommunityAccount } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import AccountShell from "./AccountShell";
import { TextField } from "@/components/ui/Field";
import DatePicker from "@/components/ui/DatePicker";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

/**
 * A registered child's entire community account lifecycle in one screen.
 *
 * There is no email/password and no separate "create account" step — a
 * community_student account never has its own credentials. The parent or
 * institute's own confirmation email carries one `child_claim_link` per
 * booking (`/community/claim?token=<Registration.access_token>` — the same
 * token every child on that booking shares), and this page is what it
 * points at, reached here either at `/community/claim` or `/community/login`.
 *
 * `POST /api/v1/community/claim/<token>/` with just name + date of birth
 * (school as an optional tie-breaker) both creates the account on first use
 * and logs it in on every use after — matched against that specific
 * booking's attendees server-side, so no two children ever collide. Without
 * a token in the URL there's nothing to match against, so no form is shown
 * at all — just a pointer back to the email.
 */
export default function CommunityLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [school, setSchool] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);

    const result = await claimCommunityAccount(token, {
      name,
      date_of_birth: dateOfBirth,
      school: school || undefined,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(
        result.code === "child_claim_invalid"
          ? "That name and date of birth don't match a registrant on this booking. Double-check the spelling and try again."
          : result.status === 404
            ? "This link isn't valid anymore. Ask your parent or institute to forward the latest confirmation email."
            : result.message,
      );
      return;
    }

    saveSession("community", {
      accessToken: result.data.access,
      refreshToken: result.data.refresh,
      user: result.data.user,
    });
    router.push("/community/dashboard");
  }

  return (
    <AccountShell
      eyebrow="Community account"
      title="Your community profile"
      description="Your own event history, results, and certificates — separate from the booking system."
      maxWidth="max-w-xl"
    >
      <div className="glass-panel animate-pop-in relative flex flex-col gap-6 overflow-hidden rounded-3xl p-8 sm:p-10">
        {/* Ambient brand glow — purely decorative, matches AccountShell's own blob treatment. */}
        <div
          className="animate-blob-slow pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-secondary/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-center gap-3 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary shadow-[0_8px_24px_-8px_color-mix(in_srgb,var(--secondary)_45%,transparent)]"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
            </svg>
          </span>
        </div>

        {token ? (
          <form onSubmit={handleSubmit} className="relative flex flex-col gap-6">
            <p className="text-center text-sm text-muted">
              Enter your name and date of birth exactly as your parent or institute registered you.
            </p>

            <div className="flex flex-col gap-5">
              <TextField
                label="Full name"
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="As registered on your booking"
              />
              <DatePicker
                label="Date of birth"
                required
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
              />
              <TextField
                label="School"
                value={school}
                onChange={(event) => setSchool(event.target.value)}
                placeholder="Optional — helps us find the right match"
                hint="Only needed if your name and date of birth match more than one registrant."
              />
            </div>

            {error && <Alert tone="error" emphasize>{error}</Alert>}

            <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
              Continue
            </Button>
          </form>
        ) : (
          <div className="relative flex flex-col items-center gap-4 text-center">
            <p className="text-sm leading-relaxed text-muted">
              There&apos;s no separate community login — open the personal link from your booking confirmation
              email to get to your profile. Every registered child on a booking gets the same link; your name
              and date of birth are what tell it apart.
            </p>
            <p className="text-xs text-muted">
              Can&apos;t find the email? Ask whoever made the booking (a parent, or your institute) to forward
              their confirmation — it contains your link.
            </p>
          </div>
        )}
      </div>
    </AccountShell>
  );
}
