/**
 * Data shapes for the admin/organizer surface (`/admin`), sourced from the
 * "Admin & organizer API endpoints" reference doc. Kept separate from
 * lib/types.ts, which is the public-site/booking-flow vocabulary — this file
 * is the management-plane vocabulary, and the two only overlap on `Event`/
 * `TicketType`, which are imported from there rather than redeclared.
 */

/**
 * `apps/common` — the platform-wide Cloudflare R2 object store, independent of any single
 * event (unlike the per-event `GalleryItem` gallery in lib/types.ts, which is really a
 * Django-tracked record that happens to point at an R2 URL). `IsAdmin`-gated: R2 keys aren't
 * tagged by event, so an organizer scoped to one event has no business browsing the whole
 * bucket.
 */
export interface MediaObject {
  /** Full R2 key including its folder, e.g. "gallery_media/3fae2199a1.jpg" — the identifier
   * `deleteMedia` takes, not `url`. */
  key: string;
  url: string;
  folder: string;
  size?: number;
  last_modified?: string;
}

/** `GET /api/v1/media/` — cursor-paginated (R2/S3 listing has no total count to page by). */
export interface MediaListResponse {
  results: MediaObject[];
  next_cursor: string | null;
  has_more: boolean;
}

/** The well-known folders every upload flow elsewhere in the admin panel writes into —
 * offered as the folder filter/picker rather than a free-text guess, though the upload
 * endpoint accepts any folder string. */
export const MEDIA_FOLDERS = [
  "gallery_media",
  "event_banners",
  "event_about",
  "speaker_photos",
  "sponsor_logos",
  "ticket_gallery_media",
  "certificate_templates",
  "media_library",
] as const;

export type MembershipRole = "organizer" | "volunteer";

export interface Membership {
  id: number;
  event: number;
  user: { id: number; email: string; full_name: string; role: string };
  role: MembershipRole;
  invited_by?: number;
  created_at?: string;
}

export interface PromoCode {
  id: number | string;
  event?: number;
  code: string;
  discount_type: "percentage" | "flat" | string;
  discount_value: string;
  max_uses?: number | null;
  used_count?: number;
  valid_from?: string | null;
  valid_until?: string | null;
  /** True until either a Celery beat job flips it once `valid_until` passes, or an organizer
   * PATCHes it to `false` to kill the code early — both land here the same way. */
  is_active?: boolean;
  applicable_ticket_types?: (number | string)[];
}

export interface SubUnit {
  id: number | string;
  kind: "zone" | "session" | "competition" | string;
  name: string;
  capacity?: number | null;
  scheduled_at?: string | null;
  ticket_types?: (number | string)[];
}

/** One row of `GET /api/v1/registrations/` seen from the staff side — a superset of the
 * booking-account shape in lib/types.ts RegistrationHistoryItem (adds `user`/onsite fields
 * relevant to management, not shown on the account dashboard). */
/** Nested event summary carried on a registration's detail response — a subset of `Event`
 * (lib/types.ts), same shape as `EventSummary` on the booking-account side. */
export interface AdminRegistrationEventSummary {
  id: number;
  title: string;
  slug: string;
  start_date?: string | null;
  end_date?: string | null;
  venue_name?: string;
  banner_url?: string | null;
}

export interface AdminRegistrationTicket {
  id: number;
  registration: number;
  ticket_type: number;
  qr_token: string;
  is_empty_ticket: boolean;
  status: string;
  qr_purpose: string;
  created_at?: string;
}

export interface AdminRegistrationAttendee {
  id: number;
  name: string;
  grade?: string;
  date_of_birth?: string | null;
  email?: string;
  phone?: string;
  school?: string;
  student_display_id?: string | null;
  competition?: string | null;
}

/**
 * `GET /api/v1/registrations/` (list) returns a thinner row than `GET
 * /api/v1/registrations/<pk>/` (detail) — the list doesn't carry `primary_name`/
 * `primary_email`/`primary_phone`, `discount_amount`, `promo_code`, `cancellation_reason`,
 * `event_detail`, or full ticket/attendee records, so a detail view built straight from a list
 * row shows blanks for all of those even though the backend has the data — it just wasn't
 * fetched. Every field below is optional for exactly that reason: which ones are present
 * depends on which endpoint populated this object (see `getRegistration` in lib/adminApi.ts,
 * which callers should use for a detail view rather than reusing a list row).
 */
export interface AdminRegistration {
  id: number;
  event: number;
  event_detail?: AdminRegistrationEventSummary;
  user?: number | null;
  status: "pending_payment" | "confirmed" | "cancelled" | string;
  booking_reference: string | null;
  relationship: string;
  unit_price: string | null;
  discount_amount?: string;
  total_amount: string | null;
  promo_code?: string | null;
  currency: string;
  is_onsite?: boolean;
  form_data?: Record<string, unknown>;
  primary_name?: string;
  primary_email?: string;
  primary_phone?: string;
  created_at: string;
  cancelled_at?: string | null;
  cancellation_reason?: string;
  attendees?: AdminRegistrationAttendee[];
  tickets?: AdminRegistrationTicket[];
}

export type PaymentStatus = "pending" | "success" | "failed" | "refunded" | "partially_refunded" | string;

export interface Payment {
  id: number;
  registration: number;
  amount: string;
  currency: string;
  method: string;
  status: PaymentStatus;
  verified_by?: number | null;
  created_at?: string;
}

export interface Refund {
  id: number;
  payment: number;
  amount: string;
  reason: string;
  status: "initiated" | string;
  gateway_refund_id: string | null;
}

export interface AttendanceLogItem {
  id: number;
  ticket: number;
  check_in_at: string | null;
  check_out_at: string | null;
  method: "qr" | "manual" | string;
  qr_purpose?: string;
}

export interface RegistrantSearchResult {
  id: number;
  user?: number;
  status: string;
  form_data?: Record<string, unknown>;
}

export interface Batch {
  id: number;
  event: number;
  name: string;
  capacity?: number | null;
}

export interface BatchAssignment {
  id: number;
  batch: number;
  registration: number;
  assigned_via: "manual" | "import" | string;
}

export interface CertificateTemplate {
  id: number;
  event: number;
  name: string;
  kind: "certificate" | "badge" | string;
  dynamic_fields?: string[];
}

export interface CertificateTaskStatus {
  status: "PENDING" | "STARTED" | "SUCCESS" | "FAILURE" | string;
  progress?: number | null;
  results?: { registration_id: number; certificate_id: number }[];
}

export interface CertificateRecord {
  id: number;
  registration: number;
  template: number;
  status: string;
  emailed_at: string | null;
}

export type EmailTrigger =
  | "registration_confirmation"
  | "cancellation"
  | "refund_processed"
  | "payment_reminder"
  | "event_reminder"
  | "schedule_update"
  | "venue_update"
  | "certificate_ready"
  | "feedback_request"
  | "otp_verification";

/** One insertable token for a trigger's editor — `key`/`label` populate the "Insert placeholder"
 * dropdown, `sample` fills the client-side live-preview substitution (see `applyPlaceholderSamples`
 * in EmailTemplatesSection). Sourced from `GET /email-triggers/`, not hardcoded, since the set of
 * placeholders is a backend concern (a trigger gaining a field shouldn't need a frontend release). */
export interface EmailPlaceholder {
  key: string;
  label: string;
  sample: string;
}

/** One row of the trigger catalogue (`GET /email-triggers/`) — not event-scoped, so it's fetched
 * once and cached for every event's settings page. */
export interface EmailTriggerCatalogEntry {
  trigger: EmailTrigger | string;
  label: string;
  placeholders: EmailPlaceholder[];
}

/** Static grouping for the settings-page sidebar. The catalogue itself (labels + placeholders)
 * comes from the server via `listEmailTriggers`; this just controls how those triggers cluster
 * on screen, matching the categories in the "Configurable Email Templates API" doc. */
export const EMAIL_TRIGGER_GROUPS: { label: string; triggers: EmailTrigger[] }[] = [
  { label: "Registration & tickets", triggers: ["registration_confirmation", "cancellation", "refund_processed"] },
  { label: "Reminders", triggers: ["payment_reminder", "event_reminder", "feedback_request"] },
  { label: "Event changes", triggers: ["schedule_update", "venue_update"] },
  { label: "Certificates", triggers: ["certificate_ready"] },
  { label: "Account", triggers: ["otp_verification"] },
];

export interface EmailTemplate {
  id: number;
  /** `null` for a platform-default row returned against an event that hasn't customized this
   * trigger — same row shape either way, just not this event's own record yet. */
  event: number | null;
  trigger: EmailTrigger | string;
  subject: string;
  body_html: string;
  available_placeholders: EmailPlaceholder[];
  /** `true` when this event has no override and the row is the platform-wide default. */
  is_platform_default: boolean;
  updated_at: string;
}

export interface EmailLog {
  id: number;
  recipient: number;
  recipient_email: string;
  registration?: number | null;
  /** Exactly one of `template` (a trigger-driven `EmailTemplate`) / `custom_template` (a
   * free-form `CustomEmailTemplate`) is set per row — which kind sent this email. */
  template: number | null;
  custom_template?: number | null;
  status: "queued" | "sent" | "failed" | string;
  sent_at?: string | null;
  celery_task_id?: string;
  created_at?: string;
}

/** A free-form, event-scoped announcement template — unlike `EmailTemplate`, it has no
 * automated trigger; it's named by the organizer and sent manually to a chosen audience via
 * `sendCustomEmailTemplate`. Placeholders are the smaller registrant-broadcast set
 * (name/email/event/booking reference), not a trigger's event-specific fields. */
export interface CustomEmailTemplate {
  id: number;
  event: number;
  name: string;
  subject: string;
  body_html: string;
  available_placeholders: EmailPlaceholder[];
  updated_at: string;
}

/** Registration statuses selectable as a custom announcement's audience. `cancelled` is never
 * pre-selected — see `sendCustomEmailTemplate`'s default. */
export const CUSTOM_EMAIL_AUDIENCE_STATUSES: { value: "confirmed" | "pending_payment" | "cancelled"; label: string }[] = [
  { value: "confirmed", label: "Confirmed registrations" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "cancelled", label: "Cancelled" },
];

export interface AnalyticsSummary {
  today_registrations: number;
  total_registrations: number;
  total_revenue: string;
  pending_payments: number;
  cancelled_payments: number;
}

export interface AnalyticsAttendance {
  checked_in: number;
  total: number;
  by_purpose: Record<string, number>;
}

export interface TicketSalesRow {
  ticket_type: string;
  sold: number;
  revenue: string;
}

export interface AnalyticsDemographics {
  by_school: Record<string, number>;
  by_batch: Record<string, number>;
}

/** `GET /api/v1/events/{id}/analytics/funnel/` response row — one checkout-funnel step, in
 * funnel order (see apps.analytics.services.funnel_summary). `sessions` is a distinct-session
 * count, not a raw event count, so revisiting a step (e.g. going back to change a ticket) never
 * inflates it. The trailing "payment_failed" row is an alternate outcome of the last step, not
 * part of the descending viewed→...→paid chain — display it separately, not as one more bar. */
export interface FunnelStep {
  step: "viewed_event" | "selected_ticket" | "added_to_cart" | "entered_payment" | "paid" | "payment_failed" | string;
  label: string;
  sessions: number;
}

export type ReportKind = "attendance" | "revenue" | "tickets" | "registrants";

/** One shared row governing every self-signup/login/checkout flow platform-wide (see the
 * backend's `VerificationPolicy.get_solo()`) — not event-scoped, same singleton shape as
 * `FounderMessage`. Every existing flow defaults to `"none"`/`false` (fully backward
 * compatible) until an admin actively opts into a stronger requirement here. */
export type VerificationRequirement = "none" | "email" | "phone" | "either" | "both";

export interface VerificationPolicy {
  phone_required_at_signup: boolean;
  signup_verification: VerificationRequirement;
  checkout_verification: VerificationRequirement;
}

/**
 * `GET/POST /api/v1/accounts/schools/` — an admin-created school/institute account (see the
 * "Schools" admin section). `account_status` starts `"pending"`; approving one
 * (`POST /accounts/schools/{id}/approve/`) flips it to `"approved"`, which is what actually
 * lets it log in to `/institute` — the same passwordless email-OTP flow every other
 * booking-system account uses, not a password invite (see the backend's
 * `apps.accounts.services.schools.approve_school_account`).
 */
export interface SchoolAccount {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  account_status: "pending" | "approved";
  is_email_verified: boolean;
  is_phone_verified: boolean;
}

/** `POST /api/v1/accounts/schools/` request body. */
export interface SchoolAccountPayload {
  email: string;
  full_name: string;
  phone?: string;
}

/** Which payment gateway checkout uses platform-wide, and which instruments it advertises to
 * buyers — one shared row (see the backend's `PaymentGatewayConfig.get_solo()`), not scoped to
 * any one event. `credentials` only comes back for an admin caller (masked — see
 * `PaymentGatewayCredentialStatus`); a non-admin's GET has no `credentials` key at all. */
export type PaymentGateway = "zohopay" | "razorpay";

export interface PaymentGatewayCredentialStatus {
  zohopay_account_id: string | null;
  zohopay_client_id: string | null;
  zohopay_client_secret_configured: boolean;
  zohopay_api_domain: string | null;
  razorpay_key_id: string | null;
  razorpay_key_secret_configured: boolean;
}

export interface PaymentGatewayConfig {
  active_gateway: PaymentGateway;
  accept_cards: boolean;
  accept_upi: boolean;
  accept_netbanking: boolean;
  accept_manual: boolean;
  /** Admin-only — absent from a non-admin caller's GET. */
  credentials?: PaymentGatewayCredentialStatus;
}

/** PATCH payload — every credential field is write-only on the backend (never echoed back, see
 * `PaymentGatewayCredentialStatus`): omit a field to leave that stored value untouched, or send
 * `""` to explicitly clear it. Never send a value read from `credentials` back as one of these —
 * that's a masked display string, not the real secret. */
export interface PaymentGatewayConfigPayload {
  active_gateway?: PaymentGateway;
  accept_cards?: boolean;
  accept_upi?: boolean;
  accept_netbanking?: boolean;
  accept_manual?: boolean;
  zohopay_account_id?: string;
  zohopay_client_id?: string;
  zohopay_client_secret?: string;
  zohopay_api_domain?: string;
  razorpay_key_id?: string;
  razorpay_key_secret?: string;
}
