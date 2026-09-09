/**
 * Shared date/time formatting for event content. Centralized so every
 * component renders backend dates consistently.
 */

/** "jane.doe@example.com" -> "j***@example.com" — for showing where a
 * verification code was sent without echoing the full address back. Falls
 * back to the raw string for anything that isn't shaped like an email. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local[0]}***@${domain}`;
}

/** Deliberately loose — one `@`, something on both sides, a dot somewhere in the domain —
 * this only catches obvious typos client-side (a missing "@", a bare "gmail" with no TLD).
 * It is not the source of truth for whether an address is real or deliverable; the OTP the
 * backend sends to it is. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/** Backend gender values are lowercase choice keys ("male"/"female"/"others" — see
 * `Attendee.Gender` in apps/registration/models.py) — this is the one place that turns
 * one into display copy ("Male"/"Female"/"Others"). `null` for blank/unset, same as
 * every other optional-field formatter here, so callers can `??` a fallback consistently. */
export function formatGender(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Tolerant time formatter for schedule rows.
 *
 * `ScheduleItem.start_time`/`end_time` can arrive either as a full ISO
 * datetime or as a bare `TimeField` value ("09:30:00") depending on how the
 * organiser entered it. `new Date("09:30:00")` is invalid, so `formatTime`
 * above silently returns null for the bare form — this handles both and
 * falls back to echoing the raw value rather than dropping the time from the
 * UI entirely.
 */
export function formatClockTime(value: string | null | undefined): string | null {
  if (!value) return null;

  const bareTime = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (bareTime) {
    const hours = Number(bareTime[1]);
    const minutes = bareTime[2];
    if (hours >= 0 && hours <= 23) {
      const suffix = hours < 12 ? "AM" : "PM";
      const hour12 = hours % 12 === 0 ? 12 : hours % 12;
      return `${hour12}:${minutes} ${suffix}`;
    }
  }

  return formatTime(value) ?? value;
}

/** Short weekday + day, for schedule day tabs. e.g. "Sat 12". */
export function formatDayTab(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric" }).format(date);
}

/** e.g. "January 1 – 2, 2025" or "January 1, 2025" when there's one day. */
export function formatDateRange(start: string | null | undefined, end: string | null | undefined): string | null {
  if (!start) return null;
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return null;

  if (!end) return formatDate(start);

  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime())) return formatDate(start);

  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) return formatDate(start);

  const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();
  if (sameMonth) {
    const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(startDate);
    return `${month} ${startDate.getDate()} – ${endDate.getDate()}, ${endDate.getFullYear()}`;
  }

  return `${formatDate(start)} – ${formatDate(end)}`;
}
