"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import * as Popover from "@radix-ui/react-popover";
import { format } from "date-fns";
import { labelClass } from "./Field";

/**
 * Themed replacement for `<input type="date">` — same treatment as
 * `DateTimePicker` (admin's event/ticket scheduling), minus the time row: a
 * date of birth doesn't have a time component. Pairs `react-day-picker`
 * with a Radix `Popover` for the floating panel, wrapped in the same
 * trigger chrome every themed control in the app uses.
 *
 * Keeps the exact same value contract as the input it replaces
 * (`"YYYY-MM-DD"`, no time/offset), so every call site's existing
 * `onChange={(event) => setX(event.target.value)}` wiring needed zero
 * changes beyond swapping the import.
 */
export default function DatePicker({
  label,
  value,
  onChange,
  required,
  hint,
  error,
  placeholder = "Select date",
  fieldClassName = "",
  disabled,
}: {
  label: string;
  value: string;
  /** Synthetic-event shape, matching `TextField`'s `onChange` — every call site keeps its
   * existing `onChange={(event) => setX(event.target.value)}` handler unchanged. */
  onChange: (event: { target: { value: string } }) => void;
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  fieldClassName?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const date = parseLocalValue(value);
  const display = date ? format(date, "MMM d, yyyy") : "";

  function handleSelect(nextDate: Date | undefined) {
    onChange({ target: { value: toLocalValue(nextDate) } });
    setOpen(false);
  }

  return (
    <label className={`flex flex-col gap-1.5 ${fieldClassName}`}>
      <span className={labelClass}>{label}</span>
      <Popover.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            data-required={required || undefined}
            data-invalid={error ? true : undefined}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-primary/15 bg-white px-4 py-3 text-left text-base text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-primary/30 focus:border-secondary focus:ring-4 focus:ring-secondary/12 disabled:cursor-not-allowed disabled:bg-primary/4 disabled:text-muted data-[invalid=true]:border-red-400 data-[invalid=true]:ring-4 data-[invalid=true]:ring-red-500/10 sm:text-sm"
          >
            <span className={display ? "" : "text-muted/60"}>{display || placeholder}</span>
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={8}
            className="admin-datepicker z-[70] w-[19rem] rounded-2xl border border-hairline-strong bg-white p-4 shadow-[var(--elev-3)] animate-pop-in"
          >
            <DayPicker
              mode="single"
              selected={date}
              onSelect={handleSelect}
              showOutsideDays
              className="!m-0 !p-0"
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {error ? (
        <span role="alert" className="animate-shake text-xs font-medium text-red-600">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

function parseLocalValue(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toLocalValue(date: Date | undefined): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}
