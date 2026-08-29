"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import * as Popover from "@radix-ui/react-popover";
import { format } from "date-fns";
import { labelClass } from "@/components/ui/Field";

/**
 * Themed replacement for `<input type="datetime-local">` — every browser renders that with
 * its own OS chrome (the "cheap"-looking native picker), which can't be restyled to match
 * the rest of the console. This pairs `react-day-picker` (calendar) with a native `<input
 * type="time">` for the clock — both wrapped in the same `inputClass` trigger the rest of the
 * form uses, inside a Radix `Popover` for the floating panel.
 *
 * Keeps the exact same value contract as the input it replaces (`"YYYY-MM-DDTHH:mm"`, local
 * time, no seconds/offset) so every call site's `toLocalInput`/`new Date(value).toISOString()`
 * plumbing needed zero changes.
 */
export default function DateTimePicker({
  label,
  value,
  onChange,
  required,
  hint,
  placeholder = "Select date & time",
  fieldClassName = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  fieldClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const { date, time } = splitLocalValue(value);

  const display = date ? `${format(date, "MMM d, yyyy")} · ${formatTimeLabel(time)}` : "";

  function handleSelectDate(nextDate: Date | undefined) {
    onChange(toLocalValue(nextDate, time || "09:00"));
  }

  function handleTimeChange(nextTime: string) {
    onChange(toLocalValue(date ?? new Date(), nextTime));
  }

  return (
    <label className={`flex flex-col gap-1.5 ${fieldClassName}`}>
      <span className={labelClass}>{label}</span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            data-required={required || undefined}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-primary/15 bg-white px-4 py-3 text-left text-base text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-primary/30 focus:border-secondary focus:ring-4 focus:ring-secondary/12 sm:text-sm"
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
              onSelect={handleSelectDate}
              showOutsideDays
              className="!m-0 !p-0"
            />
            <div className="mt-3 flex items-center gap-2 border-t border-hairline pt-3">
              <ClockIcon className="h-4 w-4 shrink-0 text-muted" />
              <input
                type="time"
                value={time}
                onChange={(event) => handleTimeChange(event.target.value)}
                className="w-full rounded-lg border border-primary/15 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/12"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="focus-ring press shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-white"
              >
                Done
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

function splitLocalValue(value: string): { date: Date | undefined; time: string } {
  if (!value) return { date: undefined, time: "" };
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = (datePart ?? "").split("-").map(Number);
  if (!year || !month || !day) return { date: undefined, time: "" };
  return { date: new Date(year, month - 1, day), time: timePart ?? "" };
}

function toLocalValue(date: Date | undefined, time: string): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const [hours, minutes] = (time || "00:00").split(":").map(Number);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hours ?? 0)}:${pad(minutes ?? 0)}`;
}

function formatTimeLabel(time: string): string {
  if (!time) return "—";
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes ?? 0).padStart(2, "0")} ${suffix}`;
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}
