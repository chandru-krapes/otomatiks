"use client";

import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";

/**
 * Form primitives.
 *
 * These replace the `inputClass`/`labelClass` string constants that were
 * copy-pasted into BookingForm, BookingLoginPage and CommunityLoginPage —
 * three separate definitions that had already started to drift. Exported as
 * constants too, so a call site that needs to style a bare `<input>` itself
 * still gets the same treatment.
 */

export const inputClass =
  // `text-base` (16px) below `sm`, dropping to `text-sm` at desktop widths:
  // iOS Safari zooms the whole page in on focus for any input under 16px,
  // which on a form this long (checkout, attendee cards) meant every tap
  // into a field yanked the viewport around. `py-3` (up from `py-2.5`)
  // keeps every control at a ~44px tap target, the minimum both Apple's and
  // Google's mobile guidelines call for.
  "w-full rounded-xl border border-primary/15 bg-white px-4 py-3 text-base text-foreground sm:text-sm " +
  "shadow-[inset_0_1px_2px_rgba(6,106,171,0.04)] outline-none " +
  "transition-[border-color,box-shadow,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] " +
  "placeholder:text-muted/60 " +
  "hover:border-primary/30 " +
  "focus:border-secondary focus:bg-white focus:ring-4 focus:ring-secondary/12 " +
  "disabled:cursor-not-allowed disabled:bg-primary/4 disabled:text-muted " +
  // `aria-invalid` drives the error treatment, so styling and assistive tech
  // never disagree about whether a field is in an error state.
  "aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-red-500/10";

export const labelClass = "text-xs font-semibold uppercase tracking-wide text-muted";

/** Multi-line variant — same treatment as `inputClass`, minus the fixed height. */
export const textareaClass = `${inputClass} resize-none`;

/**
 * Native `<select>` — kept native rather than a hand-rolled listbox: on a
 * phone that hands off to the OS's own picker wheel/sheet, which is both
 * the fastest control to use one-handed and the one thing a from-scratch
 * dropdown (this project has no headless-UI dependency to build one on)
 * can't beat on performance or familiarity. The redesign is entirely in the
 * chrome around it — a tinted fill and a bolder brand-coloured chevron so a
 * dropdown reads as its own kind of control at a glance, not a text field
 * that happens to be readonly.
 */
export const selectClass =
  `${inputClass} cursor-pointer appearance-none bg-[length:1.35rem] bg-[right_0.75rem_center] bg-no-repeat pr-11 font-medium ` +
  "bg-primary/[0.035] hover:bg-primary/[0.06] focus:bg-white " +
  "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%23066aab%22 stroke-width=%222.3%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M6 9l6 6 6-6%22/%3E%3C/svg%3E')]";

export function Field({
  label,
  children,
  hint,
  error,
  className = "",
}: {
  label: string;
  children: ReactNode;
  /** Quiet helper text under the control. Hidden while `error` is showing. */
  hint?: string;
  /** Validation message. Announced politely rather than interrupting. */
  error?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
      {error ? (
        <span
          role="alert"
          className="animate-shake text-xs font-medium text-red-600"
        >
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

/** Convenience wrapper: a `Field` and its `<input>` in one call. */
export function TextField({
  label,
  hint,
  error,
  fieldClassName,
  ...inputProps
}: {
  label: string;
  hint?: string;
  error?: string;
  fieldClassName?: string;
} & Omit<ComponentProps<"input">, "className">) {
  return (
    <Field label={label} hint={hint} error={error} className={fieldClassName}>
      <input className={inputClass} aria-invalid={error ? true : undefined} {...inputProps} />
    </Field>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    // Open eye — password currently shown.
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    // Closed/slashed eye — password currently hidden.
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

/**
 * Convenience wrapper: a `Field` and a masked `<input type="password">`, with a trailing
 * eye toggle to reveal/hide what's typed. Every password field in the app (booking-account
 * signup, community signup, admin sign-in, password reset) renders through this rather than
 * a bare `TextField[type=password]`, so the toggle — and the show/hide state driving it —
 * is one implementation, not six copies that could drift.
 */
export function PasswordField({
  label,
  hint,
  error,
  fieldClassName,
  inputClassName,
  ...inputProps
}: {
  label: string;
  hint?: string;
  error?: string;
  fieldClassName?: string;
  /** Extra classes merged onto the `<input>` itself — AdminLogin's dark-theme override needs this
   * since it restyles inputs via a `[&_input]` selector on the field's own className instead. */
  inputClassName?: string;
} & Omit<ComponentProps<"input">, "className" | "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} hint={hint} error={error} className={fieldClassName}>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          className={`${inputClass} pr-11 ${inputClassName ?? ""}`}
          aria-invalid={error ? true : undefined}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          tabIndex={-1}
          className="focus-ring absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition-colors hover:text-primary"
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </Field>
  );
}

/** Convenience wrapper: a `Field` and its `<textarea>` in one call. */
export function TextareaField({
  label,
  hint,
  error,
  fieldClassName,
  ...textareaProps
}: {
  label: string;
  hint?: string;
  error?: string;
  fieldClassName?: string;
} & Omit<ComponentProps<"textarea">, "className">) {
  return (
    <Field label={label} hint={hint} error={error} className={fieldClassName}>
      <textarea className={textareaClass} aria-invalid={error ? true : undefined} {...textareaProps} />
    </Field>
  );
}

/** Convenience wrapper: a `Field` and its `<select>` in one call. */
export function SelectField({
  label,
  hint,
  error,
  fieldClassName,
  children,
  ...selectProps
}: {
  label: string;
  hint?: string;
  error?: string;
  fieldClassName?: string;
  children: ReactNode;
} & Omit<ComponentProps<"select">, "className" | "children">) {
  return (
    <Field label={label} hint={hint} error={error} className={fieldClassName}>
      <select className={selectClass} aria-invalid={error ? true : undefined} {...selectProps}>
        {children}
      </select>
    </Field>
  );
}
