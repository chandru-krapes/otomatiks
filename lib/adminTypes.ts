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
  | "payment_reminder"
  | "event_reminder"
  | "schedule_update"
  | "venue_update"
  | "cancellation"
  | "certificate_ready"
  | "feedback_request";

export const EMAIL_TRIGGERS: { value: EmailTrigger; label: string }[] = [
  { value: "registration_confirmation", label: "Registration confirmation" },
  { value: "payment_reminder", label: "Payment reminder" },
  { value: "event_reminder", label: "Event reminder" },
  { value: "schedule_update", label: "Schedule update" },
  { value: "venue_update", label: "Venue update" },
  { value: "cancellation", label: "Cancellation" },
  { value: "certificate_ready", label: "Certificate ready" },
  { value: "feedback_request", label: "Feedback request" },
];

export interface EmailTemplate {
  id: number;
  event: number;
  trigger: EmailTrigger | string;
  subject: string;
  body_html: string;
}

export interface EmailLog {
  id: number;
  recipient: string;
  template: number;
  status: "queued" | "sent" | "failed" | string;
  sent_at?: string | null;
}

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

export type ReportKind = "attendance" | "revenue" | "tickets" | "registrants";
