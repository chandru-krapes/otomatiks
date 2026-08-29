"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAccount, registerAccount } from "@/lib/api";
import { RELATIONSHIP_OPTIONS, type AccountMode, type Relationship } from "@/lib/booking";
import { saveSession } from "@/lib/auth";
import AccountShell from "./AccountShell";
import { PasswordField, TextField } from "@/components/ui/Field";
import { SelectField } from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

/**
 * Standalone login/signup for booking accounts (parent/student/training
 * institute) — the same account type the booking flow itself registers
 * (components/booking/BookingForm.tsx), but reachable directly rather than
 * only mid-booking, so a returning purchaser can get to their dashboard
 * without starting a new ticket purchase first.
 */
export default function BookingLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AccountMode>("login");
  const [role, setRole] = useState<Relationship>("parent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verified = searchParams.get("verified") === "1";
  const [note, setNote] = useState<string | null>(
    verified ? "Email verified — you can now log in." : null,
  );
  const [noteTone, setNoteTone] = useState<"warning" | "success">(verified ? "success" : "warning");

  const isCreating = mode === "create";

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setError(null);
    setNote(null);
    setSubmitting(true);

    if (isCreating) {
      const registerResult = await registerAccount({ email, password, full_name: fullName, phone, role });
      if (!registerResult.ok) {
        setError(registerResult.message);
        setSubmitting(false);
        return;
      }
    }

    const loginResult = await loginAccount({ email, password });
    setSubmitting(false);
    if (!loginResult.ok) {
      if (isCreating && loginResult.code === "email_not_verified") {
        setNote("Account created — check your email to verify it, then log in below.");
        setNoteTone("warning");
        setMode("login");
        return;
      }
      setError(loginResult.message);
      return;
    }

    saveSession("booking", {
      accessToken: loginResult.data.access,
      refreshToken: loginResult.data.refresh,
      user: loginResult.data.user,
    });
    router.push("/dashboard");
  }

  return (
    <AccountShell
      eyebrow="Booking account"
      title={isCreating ? "Create your booking account" : "Log in to your booking account"}
      description="For parents, students, and training institutes booking event tickets."
    >
      <form onSubmit={handleSubmit} className="glass-panel flex flex-col gap-6 rounded-3xl p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            {isCreating ? "New here? Set up an account to book tickets." : "Welcome back."}
          </p>
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            onClick={() => {
              setMode(isCreating ? "login" : "create");
              setError(null);
              setNote(null);
            }}
            className="shrink-0 text-xs"
          >
            {isCreating ? "Already registered? Log in" : "New here? Create an account"}
          </Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Email"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="jane@email.com"
          />
          <PasswordField
            label="Password"
            required
            minLength={8}
            autoComplete={isCreating ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        {!isCreating && (
          <Link
            href="/forgot-password?from=booking"
            className="focus-ring -mt-3 self-end rounded-md text-xs font-semibold text-secondary hover:text-primary"
          >
            Forgot password?
          </Link>
        )}

        {isCreating && (
          <>
            <SelectField
              label="I am a"
              value={role}
              onChange={(event) => setRole(event.target.value as Relationship)}
            >
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
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
          </>
        )}

        {error && <Alert tone="error" emphasize>{error}</Alert>}
        {note && <Alert tone={noteTone}>{note}</Alert>}

        <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
          {isCreating ? "Create account" : "Log in"}
        </Button>
      </form>
    </AccountShell>
  );
}
