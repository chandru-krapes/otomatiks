import type { BookingAttendeeInput, SavedStudent, TicketType } from "./types";

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
  { value: "training_institute", label: "Tutor" },
  { value: "student", label: "Student" },
];

/** An attendee's grade, offered as a fixed dropdown rather than free text —
 * every value the booking form actually needs to distinguish between. */
export const GRADE_OPTIONS: string[] = Array.from({ length: 10 }, (_, i) => String(i + 3));

/** Sentinel `School` option value that swaps the dropdown for a manual text
 * field — for a school that isn't on the list, or (per the field's hint)
 * typing its full address instead of just picking a name. */
export const OTHER_SCHOOL_VALUE = "__other__";

/**
 * A pick-list of well-known Chennai schools, so most attendees can select
 * rather than type — "most common schools currently in Chennai" per the
 * request that added this. Not exhaustive: `OTHER_SCHOOL_VALUE` covers
 * everyone else.
 */
export const CHENNAI_SCHOOLS: string[] = [
  "DAV Boys Senior Secondary School",
  "PSBB Senior Secondary School",
  "Chettinad Vidyashram",
  "Vidya Mandir Senior Secondary School",
  "Sishya School",
  "The Hindu Senior Secondary School",
  "Bala Vidya Mandir",
  "Chinmaya Vidyalaya",
  "Velammal Vidyalaya",
  "St. Bede's Anglo Indian Higher Secondary School",
  "Don Bosco Matriculation Higher Secondary School",
  "SBOA School and Junior College",
  "Lady Andal Venkatasubba Rao School",
  "Good Shepherd Matriculation Higher Secondary School",
  "Sri Sankara Senior Secondary School",
];

/** Every district in Tamil Nadu — a fixed, exhaustive government list, so unlike
 * `CHENNAI_SCHOOLS` this needs no "Other" fallback. */
export const TAMIL_NADU_DISTRICTS: string[] = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kanchipuram",
  "Kanyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupathur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
];

export interface PrimaryContact {
  name: string;
  email: string;
  phone: string;
}

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
  /** The school's district — see TAMIL_NADU_DISTRICTS. Not a documented backend
   * field; included in the payload only when set (see `attendeeToPayload`). */
  district: string;
}

export function emptyAttendee(): Attendee {
  return { name: "", grade: "", dob: "", email: "", phone: "", school: "", district: "" };
}

/**
 * flow.pdf "The second event": pre-fill an attendee card from a saved
 * student instead of retyping. Only overwrites fields the saved record
 * actually has a value for. `SavedStudent` has no `district` of its own, so
 * that field is left exactly as `applySavedStudent` found it.
 */
export function applySavedStudent(attendee: Attendee, saved: SavedStudent): Attendee {
  return {
    ...attendee,
    name: saved.name || attendee.name,
    grade: saved.grade || attendee.grade,
    dob: saved.date_of_birth || attendee.dob,
    email: saved.email || attendee.email,
    phone: saved.phone || attendee.phone,
    school: saved.school || attendee.school,
  };
}

/**
 * Copies another cart line's already-filled attendee onto this one — the
 * "same as Ticket 1?" suggestion on a second/third ticket's attendee section
 * (see CartLineAttendees). Same only-overwrite-what's-present shape as
 * `applySavedStudent`, just from an `Attendee` already in this booking
 * instead of a saved student from a past one.
 */
export function copyAttendeeDetails(attendee: Attendee, source: Attendee): Attendee {
  return {
    ...attendee,
    name: source.name || attendee.name,
    grade: source.grade || attendee.grade,
    dob: source.dob || attendee.dob,
    email: source.email || attendee.email,
    phone: source.phone || attendee.phone,
    school: source.school || attendee.school,
    district: source.district || attendee.district,
  };
}

/**
 * Attendee fields the backend expects for the current `relationship`.
 * `school` is sent for every relationship now — it used to be a
 * student-only field, but the backend requires it on every attendee
 * regardless of who's booking on their behalf. `district` is UI-only
 * convenience alongside it, so it's only included when actually set —
 * never sent as an empty string.
 */
export function attendeeToPayload(attendee: Attendee, relationship: Relationship): BookingAttendeeInput {
  const district = attendee.district ? { district: attendee.district } : {};
  if (relationship === "student") {
    return { name: attendee.name, grade: attendee.grade, email: attendee.email, phone: attendee.phone, school: attendee.school, ...district };
  }
  return { name: attendee.name, grade: attendee.grade, date_of_birth: attendee.dob, school: attendee.school, ...district };
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
