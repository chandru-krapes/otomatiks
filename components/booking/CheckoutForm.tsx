"use client";

import type { FormEvent } from "react";
import type { SavedStudent } from "@/lib/types";
import { RELATIONSHIP_OPTIONS, type AccountMode, type PrimaryContact, type Relationship } from "@/lib/booking";
import { useCart } from "./CartProvider";
import CartLineAttendees from "./CartLineAttendees";
import { PasswordField, TextField } from "@/components/ui/Field";
import { SelectField } from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

function StepMarker({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
        {step}
      </span>
      <h3 className="font-display text-lg font-bold text-primary">{label}</h3>
    </div>
  );
}

/**
 * The whole checkout form: one purchaser section (step 1), then one
 * attendee section per cart line (step 2, 3, 4…) — see CartLineAttendees.
 * Reads `lines` straight from `useCart()`; the caller (CheckoutPage) only
 * owns the purchaser-account state, since that's the one part of this form
 * that isn't cart data.
 */
export default function CheckoutForm({
  mode,
  onModeChange,
  relationship,
  onRelationshipChange,
  primary,
  onPrimaryChange,
  password,
  onPasswordChange,
  authError,
  authNote,
  isLoggedIn,
  loggingIn,
  onLoginNow,
  savedStudents,
  onFillFromSavedStudent,
  onSubmit,
  submitting,
  submitError,
  className = "",
}: {
  mode: AccountMode;
  onModeChange: (mode: AccountMode) => void;
  relationship: Relationship;
  onRelationshipChange: (value: Relationship) => void;
  primary: PrimaryContact;
  onPrimaryChange: (next: PrimaryContact) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  authError: string | null;
  authNote: string | null;
  isLoggedIn: boolean;
  loggingIn: boolean;
  onLoginNow: () => void;
  savedStudents: SavedStudent[];
  onFillFromSavedStudent: (lineId: string, attendeeIndex: number, student: SavedStudent) => void;
  onSubmit: (event: FormEvent) => void;
  submitting: boolean;
  submitError: string | null;
  className?: string;
}) {
  const { lines } = useCart();
  const isCreating = mode === "create";
  const isLogging = mode === "login";

  return (
    <form onSubmit={onSubmit} className={`glass-panel flex flex-col gap-10 rounded-3xl p-6 sm:p-8 ${className}`}>
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StepMarker step={1} label={isCreating ? "Create your booking account" : "Log in to your booking account"} />
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            onClick={() => onModeChange(isCreating ? "login" : "create")}
            className="shrink-0 text-xs"
          >
            {isCreating ? "Already registered? Log in" : "New here? Create an account"}
          </Button>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          {isCreating
            ? "Every booking starts with an account, so you can come back and see it later."
            : "Log in with your existing booking account to continue."}
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Email"
            required
            type="email"
            autoComplete="email"
            value={primary.email}
            onChange={(event) => onPrimaryChange({ ...primary, email: event.target.value })}
            placeholder="jane@email.com"
          />
          <PasswordField
            label="Password"
            required
            minLength={8}
            autoComplete={isCreating ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="At least 8 characters"
            hint={isCreating ? "At least 8 characters." : undefined}
          />
        </div>

        {isLogging && (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onLoginNow}
              disabled={isLoggedIn}
              loading={loggingIn}
              loadingLabel="Logging in…"
            >
              {isLoggedIn ? "Logged in ✓" : "Log in"}
            </Button>
            {isLoggedIn && (
              <p className="text-xs text-muted" role="status">
                {savedStudents.length > 0
                  ? `${savedStudents.length} saved student${savedStudents.length === 1 ? "" : "s"} found below.`
                  : "No saved students on this account yet."}
              </p>
            )}
          </div>
        )}

        {/* "I am a" + name/phone stay visible in both modes — see the
            single-ticket flow's original note: `relationship` is
            per-booking, not stored on the account. */}
        <SelectField
          label="I am a"
          value={relationship}
          onChange={(event) => onRelationshipChange(event.target.value as Relationship)}
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
            value={primary.name}
            onChange={(event) => onPrimaryChange({ ...primary, name: event.target.value })}
            placeholder="Jane Doe"
          />
          <TextField
            label="Phone"
            required
            type="tel"
            autoComplete="tel"
            value={primary.phone}
            onChange={(event) => onPrimaryChange({ ...primary, phone: event.target.value })}
            placeholder="+91 90000 00000"
          />
        </div>

        {authError && (
          <Alert tone="error" emphasize>
            {authError}
          </Alert>
        )}
        {authNote && <Alert tone="warning">{authNote}</Alert>}
      </section>

      {/* One section per cart line — a "UX Design Trend Party" attendee
          block, then a "Rover Bot Workshop" team block, etc., each stepped
          on from where the purchaser section left off. A top border on every
          line but the first keeps each section visually self-contained, so
          a section's own "Add Attendee"/"Add Team Member" button doesn't
          read as floating in the whitespace ahead of the next section. */}
      {lines.map((line, index) => (
        <div key={line.id} className={index > 0 ? "border-t border-primary/10 pt-10" : undefined}>
          <CartLineAttendees
            line={line}
            step={index + 2}
            relationship={relationship}
            savedStudents={savedStudents}
            onFillFromSaved={onFillFromSavedStudent}
          />
        </div>
      ))}

      {submitError && (
        <Alert tone="error" emphasize>
          {submitError}
        </Alert>
      )}

      <Button type="submit" variant="primary" size="lg" loading={submitting} loadingLabel="Please wait…" className="w-full">
        Confirm and Book
      </Button>
    </form>
  );
}
