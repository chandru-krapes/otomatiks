"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { loginAccount } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { PasswordField, TextField } from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import type { StoredSession } from "@/lib/auth";

/**
 * Sign-in for the staff console (`/admin`). No self-signup here — every role
 * that can reach this screen (admin, organizer, volunteer) is provisioned or
 * invited elsewhere (POST .../accounts/schools/ for admin-provisioned
 * accounts, POST .../memberships/ for organizer/volunteer invites), not
 * created from this form.
 *
 * This screen can't tell in advance whether an authenticated user actually
 * holds any staff role — "organizer" and "volunteer" are per-event
 * memberships, not a field on the user record — so it accepts any successful
 * login and lets the first admin API call's 403 be the real gate (see
 * AdminApp's empty/unauthorized state).
 */
export default function AdminLogin({ onSignedIn }: { onSignedIn: (session: StoredSession) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await loginAccount({ email, password });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const session: StoredSession = { accessToken: result.data.access, refreshToken: result.data.refresh, user: result.data.user };
    saveSession("admin", session);
    onSignedIn(session);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-6 py-16">
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div
        className="animate-blob-slow pointer-events-none absolute -left-24 top-1/3 hidden h-80 w-80 rounded-full bg-primary/20 blur-3xl sm:block"
        aria-hidden="true"
      />
      <div
        className="animate-blob pointer-events-none absolute -right-16 bottom-0 hidden h-72 w-72 rounded-full bg-secondary/20 blur-3xl sm:block"
        aria-hidden="true"
      />

      <form
        onSubmit={handleSubmit}
        className="route-transition relative z-10 flex w-full max-w-md flex-col gap-6 rounded-3xl border border-white/10 bg-on-surface/[0.04] p-8 shadow-[var(--elev-3)] backdrop-blur-xl sm:p-10"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-secondary">Staff console</p>
          <h1 className="mt-2 font-boldonse text-2xl font-extrabold uppercase leading-tight text-on-surface">Admin sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-on-surface/60">
            For platform admins, event organizers, and volunteers. New staff are invited by an
            existing organizer or provisioned by an admin — there&rsquo;s no self-signup here.
          </p>
        </div>

        <div
          // `!` on the input overrides: Field.tsx's base `inputClass` hard-codes `bg-white`
          // for the light-themed forms it's shared with, which otherwise beats this dark-theme
          // override on specificity, leaving light text sitting on a white fill — invisible.
          // The `:-webkit-autofill` pair does the same for Chrome/Safari's own forced
          // autofill fill (a pale, opaque white the moment a saved credential is suggested,
          // not just accepted): an inset `box-shadow` the size of the field paints straight
          // over it, and pinning `-webkit-text-fill-color` keeps the typed text light-on-dark
          // instead of light-on-(browser's)-white.
          className="flex flex-col gap-5 [&_label>span]:text-on-surface/50 [&_input]:!border-white/15 [&_input]:!bg-white/[0.06] [&_input]:!text-on-surface [&_input]:placeholder:!text-on-surface/30 [&_input:-webkit-autofill]:![-webkit-text-fill-color:var(--on-surface)] [&_input:-webkit-autofill]:![box-shadow:0_0_0_1000px_var(--surface)_inset] [&_button]:text-on-surface/40 [&_button:hover]:text-on-surface"
        >
          <TextField
            label="Email"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@otomatiks.com"
          />
          <PasswordField
            label="Password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <Alert tone="error" emphasize>{error}</Alert>}

        <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  );
}
