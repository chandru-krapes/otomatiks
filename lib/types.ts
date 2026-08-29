/**
 * Event data shapes returned by the Django REST API.
 *
 * Only `id`, `title`, `slug`, and `status` are guaranteed to exist today
 * (see AGENTS.md "Backend Event Resolution"). Every other field is
 * optional/config-driven so the reusable components can render a
 * professional site even before the backend grows richer content, and so
 * new fields can be adopted without frontend code changes breaking.
 */

export type EventStatus = "draft" | "published" | "archived" | string;

export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface Speaker {
  id: number | string;
  name: string;
  designation?: string;
  /** Uploaded via the backend's Cloudflare R2 upload flow — always a full URL, never a local path. */
  photo_url?: string | null;
  bio?: string;
}

export interface ScheduleItem {
  id: number | string;
  title: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  speaker?: string;
  track?: string;
}

export interface ScheduleDay {
  id?: number | string;
  label?: string;
  date?: string;
  items: ScheduleItem[];
}

export interface Sponsor {
  id: number | string;
  name: string;
  type?: string;
  tier?: string;
  website_url?: string;
  /** Uploaded via the backend's Cloudflare R2 upload flow — always a full URL, never a local path. */
  logo_url?: string | null;
}

/** `TicketAccess` — read-only, fixed per ticket type (what it grants), not buyer-selectable. */
export interface TicketAccess {
  id: number | string;
  kind: "food" | "workshop" | "others" | string;
}

/**
 * `TicketType.kind` (`apps/tickets/models.py TicketType.Kind`) — the booking-unit shape this
 * ticket represents:
 *  - "individual" (default): one ticket per attendee, price scales with the attendee list.
 *  - "team": one ticket = one booking for a team of up to `max_team_size` members — price is
 *    charged once per booking regardless of team size (see lib/pricing.ts computeBookingTotal).
 */
export type TicketKind = "individual" | "team" | string;

/**
 * A ticket type's own zone/session/competition links (`EventSubUnit`,
 * `apps/tickets/models.py` — see updates.txt "Zone/Session/Competition").
 * Not yet surfaced anywhere in the UI: every ticket type observed so far has
 * returned an empty list, so this is typed defensively (all optional, best
 * guess at field names from the model docs) rather than built against.
 */
export interface TicketZone {
  id: number | string;
  kind?: "zone" | "session" | "competition" | string;
  name?: string;
  capacity?: number;
  scheduled_at?: string | null;
}

export interface TicketType {
  id: number | string;
  event?: number;
  name: string;
  /**
   * One-line summary — e.g. for a compact card. Distinct from `description`,
   * which is the long-form copy for a detail view.
   */
  short_description?: string;
  description?: string;
  /** This ticket/category's own session time — separate from the parent
   * event's `start_date`/`end_date` (lib/types.ts `Event`), which cover the
   * whole event rather than one track within it. */
  start_time?: string | null;
  end_time?: string | null;
  /** This ticket/category's own location — separate from the parent event's
   * `venue_name` for the same reason as `start_time`/`end_time` above. */
  venue?: string;
  /** Decimal string from DRF, e.g. "1000.00". */
  price: string;
  is_sponsored?: boolean;
  capacity?: number;
  sold_count?: number;
  sales_start?: string | null;
  sales_end?: string | null;
  is_registration_paused?: boolean;
  is_sold_out?: boolean;
  is_available?: boolean;
  /** Nested read-only, `source="access_items"` on the backend serializer. */
  access?: TicketAccess[];
  kind?: TicketKind;
  /** Only meaningful when `kind === "team"`. */
  max_team_size?: number | null;
  /** Same shape as `Event.gallery_items` (see `GalleryItem` below) — photos/
   * clips for this specific ticket/category, not the whole event. */
  gallery_items?: GalleryItem[];
  zones?: TicketZone[];
}

/**
 * `POST /api/v1/events/{event_id}/bookings/` request body. `quantity`,
 * `unit_price`, `total_amount`, `status`, and `booking_reference` are all
 * server-derived — the client cannot set them (see updates.txt §25).
 */
export interface BookingAttendeeInput {
  name: string;
  grade?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  /** Required by the backend on every attendee now, regardless of `relationship` — kept
   * optional here only because this type is shared with older/partial call sites. */
  school?: string;
}

/**
 * One selected ticket type's worth of attendees within a booking — a "cart
 * line". `ticket_id` can repeat across entries in `BookingCreatePayload
 * .competitions` (the backend merges repeats for pricing/capacity, e.g. two
 * separate teams registering for the same team ticket as two entries).
 */
export interface BookingLineInput {
  ticket_id: number | string;
  attendees: BookingAttendeeInput[];
}

/**
 * `POST /api/v1/events/{event_id}/bookings/` request body — one call books
 * every selected ticket type at once (the "multi-ticket cart" flow; see the
 * backend→frontend handoff doc). `quantity`, `unit_price`, `total_amount`,
 * `status`, and `booking_reference` are all server-derived — the client
 * cannot set them.
 */
export interface BookingCreatePayload {
  relationship: "parent" | "training_institute" | "student";
  primary_account: { name: string; email: string; phone: string };
  competitions: BookingLineInput[];
}

/** One `competitions[]` entry in the booking response — a priced line for one ticket type. */
export interface BookingCompetitionSummary {
  ticket_type: { id: number | string; name: string };
  /** Raw attendee count on this line, not the billed multiplier — a team-kind
   * ticket bills once regardless of how many members are on its line. Don't
   * recompute a total from `quantity * unit_price` per line; use
   * `BookingResponse.total_amount`, which already accounts for that. */
  quantity: number;
  unit_price: string;
}

/** `BookingSerializer` response shape (`apps/registration/serializers.py`). */
export interface BookingResponse {
  booking_reference: string;
  status: "pending_payment" | "confirmed" | "cancelled" | string;
  /** Legacy single-ticket field, still present alongside `competitions` —
   * kept typed as optional since `competitions` is the authoritative,
   * multi-line source of truth for what was actually booked. */
  ticket?: { id: number | string; name: string };
  competitions: BookingCompetitionSummary[];
  /** Total attendees across every line. */
  quantity: number;
  /** `null` whenever the booking spans more than one distinct unit price
   * (see the live example in the handoff doc) — there's no single
   * "the" unit price to report in that case. */
  unit_price: string | null;
  total_amount: string;
  currency: string;
  relationship: string;
  primary_name?: string;
  primary_email?: string;
  primary_phone?: string;
  /** Every attendee across every line, in one flat list — each carries its
   * own `competition` name to say which line it belongs to. Read shape
   * (has `id`/`student_display_id`), not the write shape sent in the
   * request. */
  attendees: AttendeeHistoryItem[];
  created_at?: string;
}

/** `POST /api/v1/payments/zohopay/create-order/` response — a payment session
 * to hand off to Zoho's checkout. */
export interface PaymentOrderResponse {
  payments_session_id: string;
  amount: string;
  account_id: string;
  api_domain: string;
}

/** `{"detail": "...", "code": "..."}` shape used for capacity/availability errors (§21). */
export interface ApiErrorDetail {
  detail?: string;
  code?: string;
  [field: string]: unknown;
}

/**
 * Booking-account roles (flow.pdf "Account types") — the same three the booking flow's
 * `relationship` selector already offers, since they're the account type *and* the relationship
 * in one step ("I am a" — see components/booking/AccountStep.tsx).
 */
export type AccountRole = "parent" | "student" | "training_institute";

export interface AuthUser {
  id: number | string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  account_status?: string;
  is_email_verified?: boolean;
}

/** `POST /api/v1/auth/register/` request body. */
export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: AccountRole;
}

/** `POST /api/v1/auth/login/` request body. */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Shared response shape of `/auth/register/` (minus tokens) and `/auth/login/`. */
export interface AuthTokens {
  access: string;
  refresh: string;
}

/**
 * `POST /api/v1/auth/password-reset/` request body. One shared reset flow
 * for every account type (booking or community) — the endpoint lives under
 * the generic `/auth/` namespace, not scoped to either.
 */
export interface PasswordResetRequestPayload {
  email: string;
}

/** `POST /api/v1/auth/password-reset/confirm/` request body — `token` from the emailed link. */
export interface PasswordResetConfirmPayload {
  token: string;
  new_password: string;
}

/** `POST /api/v1/auth/verify-email/` request body — `token` from the emailed verification link. */
export interface VerifyEmailPayload {
  token: string;
}

/**
 * `GET /api/v1/my-students/` — one row per distinct Student the logged-in
 * account has ever entered as an attendee (flow.pdf "The second event").
 * `name`/`date_of_birth`/`school` are the Student's permanent identity;
 * `grade`/`email`/`phone` are from that Student's most recent Attendee
 * entry, since those can change booking to booking.
 */
export interface SavedStudent {
  student_display_id: string;
  name: string;
  date_of_birth: string | null;
  school: string;
  grade: string;
  email: string;
  phone: string;
}

/** Nested event summary on a registration-history row — deliberately a subset of `Event`, not
 * the full shape (this is a cross-event dashboard, not a single event's own page).
 */
export interface EventSummary {
  id: number;
  title: string;
  slug: string;
  start_date?: string | null;
  end_date?: string | null;
  venue_name?: string;
  banner_url?: string | null;
}

/** Read shape of one attendee within registration history — matches AttendeeSerializer
 * (apps/registration/serializers.py), distinct from BookingAttendeeInput's write-only shape.
 */
export interface AttendeeHistoryItem {
  id: number;
  name: string;
  grade: string;
  date_of_birth: string | null;
  email: string;
  phone: string;
  school: string;
  student_display_id: string | null;
  competition: string | null;
}

/** One row of `GET /api/v1/registrations/` — a booking account's own history
 * (components/account/BookingDashboard.tsx). Booking-flow-only fields
 * (`booking_reference`, `relationship`, pricing, `attendees`) are blank/empty
 * for a registration made through the legacy single-ticket flow.
 */
export interface RegistrationHistoryItem {
  id: number;
  event: number;
  event_detail: EventSummary;
  status: string;
  booking_reference: string | null;
  relationship: string;
  unit_price: string | null;
  total_amount: string | null;
  currency: string;
  is_onsite: boolean;
  cancelled_at: string | null;
  cancellation_reason: string;
  attendees: AttendeeHistoryItem[];
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** One row of `GET /api/v1/community/me/`'s `history` — the claimed Student's
 * own `attendee_entries` across every event they've ever been registered for
 * (not just the booking that was claimed), scoped server-side so a sibling's
 * or the parent's rows never appear here. */
export interface CommunityHistoryItem {
  event: string;
  competition: string;
  ticket_status: string;
  booking_reference: string;
  registered_at: string;
}

/** `GET /api/v1/community/me/` response. */
export interface CommunityProfileResponse {
  email: string;
  full_name: string;
  /** The permanent Student identity's display id (e.g. `ST-10241`) — the
   * same id generated at booking time (see `SavedStudent.student_display_id`),
   * now surfaced on the claimed account itself. */
  display_id: string;
  date_of_birth: string | null;
  school: string;
  grade: string;
  history: CommunityHistoryItem[];
}

/**
 * `POST /api/v1/community/claim/<token>/` request body — a registered
 * child's one and only way into their community account. `token` (in the
 * URL, not this body) is `Registration.access_token`, shared by every child
 * on that booking; `name`/`date_of_birth` (`school` as an optional
 * tie-breaker) is matched server-side against that booking's own attendees
 * only, to work out *which* child this is. There's no email/password —
 * a community_student account never has its own credentials. The same
 * request creates the account on first use and logs it in on every use
 * after, so there's no separate signup payload.
 */
export interface ChildClaimPayload {
  name: string;
  date_of_birth: string;
  school?: string;
}

export interface Highlight {
  id: number | string;
  title: string;
  description?: string;
  icon?: string;
}

export interface GalleryItem {
  id: number | string;
  caption?: string;
  media_type: "image" | "video" | string;
  /** Uploaded via the backend's Cloudflare R2 upload flow — always a full URL, never a local path. */
  media_url: string;
}

export interface Event {
  id: number;
  title: string;
  slug: string;
  status: EventStatus;

  start_date?: string | null;
  end_date?: string | null;

  venue_name?: string;
  venue_address?: string;
  venue_map_url?: string;

  /** Uploaded via the backend's Cloudflare R2 upload flow — always a full URL, never a local path. */
  banner_url?: string | null;
  logo?: string | null;
  theme_color?: string;

  tagline?: string;
  /** One-line summary — distinct from `description`, the long-form "about" copy below. */
  short_description?: string;
  description?: string;

  about_title?: string;
  about_description?: string;
  /** Secondary image for the "Why join event" section — distinct from `banner_url`
   * (the hero image), uploaded to its own `event_about` R2 folder. */
  about_image_url?: string | null;

  highlights?: Highlight[];
  speakers?: Speaker[];
  schedule?: ScheduleDay[];
  sponsors?: Sponsor[];
  ticket_types?: TicketType[];
  gallery_items?: GalleryItem[];

  contact_email?: string;
  contact_phone?: string;

  registration_url?: string;
  registration_label?: string;

  nav_links?: NavLink[];
  social_links?: SocialLink[];
  footer_note?: string;
}

export interface EventListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Event[];
}

/**
 * `GET /api/v1/events/{event_id}/testimonials/` — per-event client
 * feedback. One per (booking account, event): the write endpoints
 * (`POST .../testimonials/`, `.../testimonials/me/`) are scoped to "the
 * main account holder" (a booking account, not a community account) and the
 * backend rejects a second submission for the same event with a 400.
 */
export interface Testimonial {
  id: number | string;
  user_name: string;
  /** 1–5. Whole-star ratings only — the API has never returned a fraction. */
  rating: number;
  message: string;
  created_at: string;
}

/** `POST`/`PATCH .../testimonials/` request body. */
export interface TestimonialInput {
  rating: number;
  message: string;
}
