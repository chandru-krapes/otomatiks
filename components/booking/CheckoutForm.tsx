"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { AuthTokens, AuthUser, SavedStudent } from "@/lib/types";
import { RELATIONSHIP_OPTIONS, type PrimaryContact, type Relationship } from "@/lib/booking";
import { useCart } from "./CartProvider";
import CartLineAttendees from "./CartLineAttendees";
import EmailVerifyStep from "./EmailVerifyStep";
import PhoneVerifyStep from "./PhoneVerifyStep";
import { TextField, labelClass } from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

export const CHECKOUT_FORM_ID = "checkout-form";

export const CHECKOUT_STEPS = [
  { step: 1, label: "Verification" },
  { step: 2, label: "Your Details" },
  { step: 3, label: "Ticket Attendee Details" },
] as const;

type VerifyMethod = "email" | "phone";

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/**
 * Progress rail for the three checkout steps. A completed step is a real
 * button (jump back to fix something); the current step is highlighted;
 * anything still ahead is dimmed and inert — nothing past the step actually
 * in progress can be jumped to, since it hasn't been reached yet.
 */
function StepProgress({ step, onJump }: { step: 1 | 2 | 3; onJump: (target: 1 | 2 | 3) => void }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {CHECKOUT_STEPS.map(({ step: itemStep, label }, index) => {
        const complete = itemStep < step;
        const current = itemStep === step;
        return (
          <li key={itemStep} className="flex items-center gap-2">
            {index > 0 && <span className="h-px w-6 shrink-0 bg-primary/15 sm:w-10" aria-hidden="true" />}
            <button
              type="button"
              // Step 1 (email verification) is never re-openable once passed —
              // there'd be nothing to "go back to fix", just a fresh code
              // request against whatever's typed in by then.
              disabled={!complete || itemStep === 1}
              onClick={() => onJump(itemStep)}
              aria-current={current ? "step" : undefined}
              className={`focus-ring press flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-[var(--dur-fast)] ${
                current
                  ? "bg-secondary text-white"
                  : complete
                    ? "bg-secondary/10 text-secondary hover:bg-secondary/15"
                    : "cursor-default bg-primary/5 text-muted"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  current ? "bg-white/25 text-white" : complete ? "bg-secondary text-white" : "bg-primary/10 text-muted"
                }`}
              >
                {complete ? <CheckIcon /> : itemStep}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}


export default function CheckoutForm({
  step,
  onStepChange,
  onVerified,
  relationship,
  onRelationshipChange,
  primary,
  onPrimaryChange,
  verifiedUser,
  detailsError,
  onContinueToAttendees,
  savedStudents,
  onSubmit,
  submitError,
  className = "",
}: {
  step: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
  onVerified: (auth: AuthTokens & { user: AuthUser }) => void;
  relationship: Relationship;
  onRelationshipChange: (value: Relationship) => void;
  primary: PrimaryContact;
  onPrimaryChange: (next: PrimaryContact) => void;
  verifiedUser: AuthUser | null;
  detailsError: string | null;
  onContinueToAttendees: () => void;
  savedStudents: SavedStudent[];
  onSubmit: (event: FormEvent) => void;
  submitError: string | null;
  className?: string;
}) {
  const { lines } = useCart();
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>("email");

  return (
    <div className={`glass-panel flex flex-col gap-8 rounded-3xl p-6 sm:p-8 ${className}`}>
      <StepProgress step={step} onJump={onStepChange} />

      {step === 1 && (
        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold text-primary">
              Verify your {verifyMethod === "email" ? "email" : "phone"}
            </h3>
            <div role="tablist" aria-label="Verification method" className="flex w-fit rounded-full border border-primary/15 bg-primary/[0.03] p-1">
              {(["email", "phone"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  role="tab"
                  aria-selected={verifyMethod === method}
                  onClick={() => setVerifyMethod(method)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                    verifyMethod === method ? "bg-secondary text-white" : "text-muted hover:text-primary"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
          {verifyMethod === "email" ? (
            <EmailVerifyStep onVerified={onVerified} />
          ) : (
            <PhoneVerifyStep onVerified={onVerified} />
          )}
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-5">
          <h3 className="font-display text-lg font-bold text-primary">Your details</h3>

          {verifiedUser && (
            <p className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <CheckIcon />
              Verified: {verifiedUser.is_phone_verified && verifiedUser.phone ? verifiedUser.phone : verifiedUser.email}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>I am a</span>
            <div role="radiogroup" aria-label="I am a" className="flex flex-wrap gap-2">
              {RELATIONSHIP_OPTIONS.map((option) => {
                const selected = option.value === relationship;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onRelationshipChange(option.value)}
                    className={`focus-ring press rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-[var(--dur-fast)] ${
                      selected
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-primary/15 bg-white text-foreground hover:border-primary/30"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

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
              label="Email"
              required
              type="email"
              autoComplete="email"
              value={primary.email}
              onChange={(event) => onPrimaryChange({ ...primary, email: event.target.value })}
              placeholder="jane@email.com"
              hint={verifyMethod === "phone" ? "Your booking confirmation and tickets are sent here." : undefined}
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

          {detailsError && (
            <Alert tone="error" emphasize>
              {detailsError}
            </Alert>
          )}

          <Button type="button" onClick={onContinueToAttendees} className="w-fit">
            Continue to attendee details
          </Button>
        </section>
      )}

      {step === 3 && (
        <form id={CHECKOUT_FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-10">
          {lines.map((line, index) => {
            const previousLine = index > 0 ? lines[index - 1] : null;
            const previousFirstAttendee = previousLine?.attendees[0];
            const previousAttendeeSuggestion =
              previousLine && previousFirstAttendee?.name
                ? { name: previousFirstAttendee.name, ticketName: previousLine.ticket.name, source: previousFirstAttendee }
                : null;
            return (
              <div key={line.id} className={index > 0 ? "border-t border-primary/10 pt-10" : undefined}>
                <CartLineAttendees
                  line={line}
                  index={index}
                  total={lines.length}
                  relationship={relationship}
                  savedStudents={savedStudents}
                  previousAttendeeSuggestion={previousAttendeeSuggestion}
                />
              </div>
            );
          })}
          {submitError && (
            <Alert tone="error" emphasize>
              {submitError}
            </Alert>
          )}
        </form>
      )}
    </div>
  );
}
