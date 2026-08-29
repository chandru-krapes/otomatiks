import type { BookingAttendeeInput, TicketType } from "./types";

/**
 * Whether a ticket type is actually purchasable right now.
 *
 * `is_available` (the paused / sold-out / sales-window check, computed
 * server-side per request — see updates.txt §14) is the field to gate a Buy
 * button on. The narrower sold-out/paused check is only a fallback for when
 * the backend didn't send it. Shared by the ticket cards and the event
 * categories explorer, so the two views can never disagree about whether a
 * given ticket is open.
 */
export function isTicketAvailable(ticket: TicketType): boolean {
  return ticket.is_available != null
    ? ticket.is_available
    : !(ticket.is_sold_out || ticket.is_registration_paused);
}

/**
 * Shape of the ticket-booking form (see components/booking).
 *
 * "Relationship" is who the primary account is booking on behalf of, set
 * via the dropdown on the booking page:
 *  - "parent" / "training_institute": the primary account is an adult
 *    (parent or training institute) and each attendee is a separate
 *    child/trainee with their own name/grade/date of birth.
 *  - "student": the attendee *is* the primary account, so each attendee
 *    entry instead carries the extended student profile (grade, email,
 *    phone, school) requested for that case.
 *
 * Values match the backend's `Registration.relationship` choices exactly
 * (`apps/registration/models.py`) — this is sent verbatim as the
 * `relationship` field in the booking-create request body.
 */
export type Relationship = "parent" | "training_institute" | "student";

export const RELATIONSHIP_OPTIONS: { value: Relationship; label: string }[] = [
  { value: "parent", label: "Parent" },
  { value: "training_institute", label: "Training Institute" },
  { value: "student", label: "Student" },
];

export interface PrimaryContact {
  name: string;
  email: string;
  phone: string;
}

/**
 * flow.pdf "Parent registers" step 1: booking starts with account
 * registration ("Email — enters email and sets a password"), not a
 * separate signup page. "create" registers a new account with `relationship`
 * as its role (they line up 1:1 — see RegisterPayload); "login" is for a
 * returning purchaser (flow.pdf's second-event example: "Ramesh logs into
 * his booking account").
 */
export type AccountMode = "create" | "login";

export interface Attendee {
  name: string;
  grade: string;
  /** parent/institute attendees only. */
  dob: string;
  /** student attendees only. */
  email: string;
  /** student attendees only. */
  phone: string;
  /** student attendees only. */
  school: string;
}

export function emptyAttendee(): Attendee {
  return { name: "", grade: "", dob: "", email: "", phone: "", school: "" };
}

/**
 * Attendee fields the backend expects for the current `relationship`.
 * `school` is sent for every relationship now — it used to be a
 * student-only field, but the backend requires it on every attendee
 * regardless of who's booking on their behalf.
 */
export function attendeeToPayload(attendee: Attendee, relationship: Relationship): BookingAttendeeInput {
  if (relationship === "student") {
    return { name: attendee.name, grade: attendee.grade, email: attendee.email, phone: attendee.phone, school: attendee.school };
  }
  return { name: attendee.name, grade: attendee.grade, date_of_birth: attendee.dob, school: attendee.school };
}

/**
 * Recovers the numeric registration id from a booking reference, for the
 * payment-order call (`POST /api/v1/payments/zohopay/create-order/`), which
 * needs `registration_id` — a field the booking-creation and GET-by-reference
 * responses never actually return (verified against the live backend; see
 * lib/api.ts `createPaymentOrder`).
 *
 * FRAGILE, TEMPORARY: this assumes the reference's trailing digits *are*
 * the registration's primary key (e.g. "ROBOTI-2026-000011" → 11), which
 * held for every booking created against the dev backend while this was
 * built, but is an implementation detail of how references happen to be
 * generated today, not a documented contract. The real fix is the backend
 * returning `registration_id` directly in the booking response — ask for
 * that, then delete this and every caller of it.
 */
export function extractRegistrationId(bookingReference: string): number | null {
  const match = /(\d+)$/.exec(bookingReference);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

/**
 * Display label for a `TicketAccess.kind` value. Access is a fixed
 * property of the ticket type (what it grants — food/workshop/others),
 * not something the buyer chooses at booking time: `TicketAccessSerializer`
 * is nested read-only on `TicketTypeSerializer.access`, and there is no
 * request field for it anywhere in the booking-create payload (updates.txt
 * §6, §15, §25). The booking UI only ever displays it.
 */
const ACCESS_LABELS: Record<string, string> = { food: "Food", workshop: "Workshop", others: "Others" };

export function accessLabel(kind: string): string {
  return ACCESS_LABELS[kind] ?? kind.charAt(0).toUpperCase() + kind.slice(1);
}
