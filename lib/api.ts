import type {
  ApiErrorDetail,
  AuthTokens,
  AuthUser,
  BookingCreatePayload,
  BookingResponse,
  ChildClaimPayload,
  CommunityProfileResponse,
  Event,
  EventListResponse,
  LoginPayload,
  PaginatedResponse,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
  PaymentOrderResponse,
  RegisterPayload,
  RegistrationHistoryItem,
  SavedStudent,
  Testimonial,
  TestimonialInput,
  TicketType,
  VerifyEmailPayload,
} from "./types";

/** `banner_url` is always a full URL — the backend uploads it to Cloudflare R2
 * (apps.common.services.upload_to_r2) rather than storing a local media path. */
export function resolveBannerUrl(event: Pick<Event, "banner_url">): string | null {
  return event.banner_url ?? null;
}

/**
 * Base URL of the Django REST API. Deployment-specific, so it comes from
 * an environment variable rather than being hard-coded (AGENTS.md
 * "Keep infrastructure configuration separate"). Falls back to the
 * current local test backend.
 */
/**
 * `NEXT_PUBLIC_EVENTS_API_URL` is read too (and preferred) because this
 * value also needs to be available client-side, for the booking-submission
 * fetch in components/booking/BookingPage.tsx — `EVENTS_API_URL` alone is
 * server-only and would be `undefined` in the browser bundle.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_EVENTS_API_URL ??
  process.env.EVENTS_API_URL ??
  "https://aurea-nonpatterned-nonsymphoniously.ngrok-free.dev"
).replace(/\/$/, "");

const EVENTS_ENDPOINT = `${API_BASE_URL}/api/v1/events/`;

/**
 * Only ngrok's own tunnels understand `ngrok-skip-browser-warning` (it opts
 * a request out of the free-tier "you're about to visit…" interstitial,
 * which otherwise serves an HTML page with no CORS headers in place of the
 * real response — see the ngrok-tunnel case this was added for).
 *
 * Sending it unconditionally broke the *other* common case: a local Django
 * backend (`http://localhost:8000`) with a normal `django-cors-headers`
 * allowlist rejects the preflight outright because it's never heard of this
 * header. So this only gets added when `API_BASE_URL` is actually an ngrok
 * host — every other backend never sees it.
 */
export const NGROK_SKIP_HEADER: Record<string, string> = /(^|\.)ngrok(-free)?\.(app|dev)$/.test(
  (() => {
    try {
      return new URL(API_BASE_URL).hostname;
    } catch {
      return "";
    }
  })(),
)
  ? { "ngrok-skip-browser-warning": "true" }
  : {};

// Safety cap on pagination pages walked while searching for a slug match,
// in case the API paginates and a `next` link loops back on itself.
const MAX_PAGES = 10;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        ...NGROK_SKIP_HEADER,
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`Failed to fetch ${url}:`, error);
    return null;
  }
}

/**
 * Finds the base event record for a slug via the list endpoint.
 *
 * Sends `?slug=` so the backend can filter server-side once it supports
 * it (AGENTS.md "Backend Event Resolution"), but also matches by slug in
 * the returned results and follows pagination — the list endpoint
 * doesn't filter on `slug` yet and may return every event.
 */
async function findEventInList(slug: string): Promise<Event | null> {
  let url: string | null = `${EVENTS_ENDPOINT}?slug=${encodeURIComponent(slug)}`;

  for (let page = 0; url && page < MAX_PAGES; page++) {
    const data: EventListResponse | null = await fetchJson<EventListResponse>(url);
    if (!data) return null;

    const match = data.results?.find((event) => event.slug === slug);
    if (match) return match;

    url = data.next;
  }

  return null;
}

/**
 * Resolves the full event for a subdomain-derived slug.
 *
 * The list endpoint only carries the base fields; `speakers`, `sponsors`,
 * and richer detail live behind `/events/{id}/`, and ticket tiers behind
 * `/events/{id}/ticket-types/`. Both extra fetches are best-effort — if
 * either fails, the page still renders with whatever the list endpoint
 * gave us instead of failing outright. Returns `null` when the event
 * doesn't exist, isn't published, or the list lookup itself fails.
 */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  if (!slug) return null;

  const base = await findEventInList(slug);
  if (!base || base.status !== "published") return null;

  const [detail, ticketTypes] = await Promise.all([
    fetchJson<Event>(`${EVENTS_ENDPOINT}${base.id}/`),
    fetchJson<TicketType[]>(`${EVENTS_ENDPOINT}${base.id}/ticket-types/`),
  ]);

  return {
    ...base,
    ...(detail ?? {}),
    ticket_types: ticketTypes ?? undefined,
  };
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number | null; message: string; fieldErrors?: Record<string, string[]>; code?: string };

/**
 * Turns a non-2xx response body into an `ApiResult` error, handling DRF's two
 * error shapes uniformly: structured `{detail, code}` (capacity/not-found/
 * account-gating/"already submitted" errors) and the default
 * `{field: [errors]}` validation-error shape. Shared by every write below —
 * `postJson` and `sendAuthedJson`.
 */
function parseErrorResult(status: number, body: unknown): ApiResult<never> {
  const errorBody = (body ?? {}) as ApiErrorDetail;
  if (typeof errorBody.detail === "string") {
    return { ok: false, status, message: errorBody.detail, code: errorBody.code };
  }
  const fieldErrors: Record<string, string[]> = {};
  for (const [field, value] of Object.entries(errorBody)) {
    if (Array.isArray(value)) fieldErrors[field] = value.map(String);
  }
  const firstMessage = Object.values(fieldErrors)[0]?.[0];
  return {
    ok: false,
    status,
    message: firstMessage ?? `Request failed (${status}).`,
    fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
  };
}

/** Shared POST-and-parse for the small JSON API calls below (booking, register, login, OTP). */
async function postJson<T>(url: string, payload: unknown, headers: Record<string, string> = {}): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...NGROK_SKIP_HEADER,
        ...headers,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn(`Failed to POST ${url}:`, error);
    return { ok: false, status: null, message: "Couldn't reach the server. Check your connection and try again." };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // No/invalid JSON body — fall through with body left null.
  }

  if (!response.ok) return parseErrorResult(response.status, body);
  return { ok: true, data: body as T };
}

/**
 * Shared write for the authenticated one-owner-record endpoints below
 * (a booking account's own testimonial for an event). Unlike `postJson`,
 * this always attaches the caller's access token, and tolerates a body-less
 * response (DELETE typically comes back 204 No Content).
 */
async function sendAuthedJson<T>(
  method: "POST" | "PATCH" | "DELETE",
  url: string,
  accessToken: string,
  payload?: unknown,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        "Accept": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...NGROK_SKIP_HEADER,
        ...(payload !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
    });
  } catch (error) {
    console.warn(`Failed to ${method} ${url}:`, error);
    return { ok: false, status: null, message: "Couldn't reach the server. Check your connection and try again." };
  }

  let body: unknown = null;
  if (response.status !== 204) {
    try {
      body = await response.json();
    } catch {
      // No/invalid JSON body — fine for e.g. a DELETE that returned 200 with nothing.
    }
  }

  if (!response.ok) return parseErrorResult(response.status, body);
  return { ok: true, data: body as T };
}

export type CreateBookingResult = ApiResult<BookingResponse>;

/**
 * Submits the whole cart in one call — `POST /api/v1/events/{event_id}/bookings/`
 * with every selected ticket type's attendees under `competitions` (see the
 * backend→frontend "multi-ticket cart" handoff doc). Atomic: either every
 * line succeeds or none of it does. Still guest checkout (no auth required),
 * but when `accessToken` is passed the booking is linked to that account
 * server-side. Every derived field (`quantity`/`unit_price`/`total_amount`/
 * `status`/`booking_reference`) is computed server-side.
 */
export async function createBooking(
  eventId: number | string,
  payload: BookingCreatePayload,
  accessToken?: string,
): Promise<CreateBookingResult> {
  return postJson<BookingResponse>(
    `${EVENTS_ENDPOINT}${eventId}/bookings/`,
    payload,
    accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  );
}

/**
 * Fetches a booking's confirmation payload for the standalone confirmation/
 * "view my booking" page — `GET /api/v1/bookings/{booking_reference}/`.
 * Confirmed against the live backend to require auth even for the account
 * that created the booking (401 without a token) — a guest checkout has no
 * token to offer, so this only ever succeeds for a booking-account holder
 * revisiting their own confirmation page. The immediate post-checkout
 * screen doesn't depend on this at all: it's built straight from the
 * `createBooking` response instead (see components/booking/CheckoutPage.tsx).
 */
export async function getBookingByReference(
  reference: string,
  accessToken: string,
): Promise<ApiResult<BookingResponse>> {
  return getJson<BookingResponse>(`${API_BASE_URL}/api/v1/bookings/${encodeURIComponent(reference)}/`, accessToken);
}

/**
 * Resolves a booking from a magic-link `token` alone — no login needed —
 * for the standalone `/my-registration?token=...` landing page. Reuses
 * `getBookingByReference`'s own endpoint shape (`GET /api/v1/bookings/{id}/`)
 * with the token taking the place of both the reference and the auth: no
 * `Authorization` header is sent, matching the `AllowAny`, token-in-the-URL
 * pattern the community claim link already uses
 * (`POST /api/v1/community/claim/<token>/`).
 *
 * UNVERIFIED against a dedicated backend contract for this exact shape — if
 * `/my-registration` 404s or comes back empty in practice, this URL is the
 * first thing to check with the backend team.
 */
export async function getMyRegistration(token: string): Promise<ApiResult<BookingResponse>> {
  return getJson<BookingResponse>(`${API_BASE_URL}/api/v1/bookings/${encodeURIComponent(token)}/`);
}

/**
 * Starts payment for a `pending_payment` booking — `POST
 * /api/v1/payments/zohopay/create-order/`. Confirmed working against the
 * live backend, which currently returns a stub session
 * (`payment_session_stub_<id>`) rather than a real Zoho session — so this is
 * verified to reach the right endpoint with the right shape, but the actual
 * hand-off into Zoho's checkout UI (their embeddable JS widget, typically)
 * still needs to be wired up once the backend returns a real session; see
 * the caller for exactly what's stubbed.
 */
export async function createPaymentOrder(
  registrationId: number,
  accessToken?: string,
): Promise<ApiResult<PaymentOrderResponse>> {
  return postJson<PaymentOrderResponse>(
    `${API_BASE_URL}/api/v1/payments/zohopay/create-order/`,
    { registration_id: registrationId },
    accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  );
}

const AUTH_ENDPOINT = `${API_BASE_URL}/api/v1/auth/`;

/**
 * flow.pdf "Parent registers" step 1: "Email — enters email and sets a
 * password" / "I am a — selects Parent" — the booking flow's first step is
 * account registration, not a separate signup page. Doesn't return tokens
 * (the backend's RegisterView never has) — call loginAccount() next.
 */
export async function registerAccount(payload: RegisterPayload): Promise<ApiResult<{ user: AuthUser }>> {
  return postJson<{ user: AuthUser }>(`${AUTH_ENDPOINT}register/`, payload);
}

export async function loginAccount(payload: LoginPayload): Promise<ApiResult<AuthTokens & { user: AuthUser }>> {
  return postJson<AuthTokens & { user: AuthUser }>(`${AUTH_ENDPOINT}login/`, payload);
}

/**
 * `POST /api/v1/auth/password-reset/` — kicks off a reset. The backend
 * always returns the same generic response whether or not `email` belongs
 * to an account, so it can't be used to probe which emails are registered —
 * callers should show one fixed "check your inbox" message on `result.ok`,
 * never anything derived from `result.data`. An `!ok` result here means the
 * request itself failed (network, malformed body), not "no such account".
 */
export async function requestPasswordReset(payload: PasswordResetRequestPayload): Promise<ApiResult<{ detail?: string }>> {
  return postJson<{ detail?: string }>(`${AUTH_ENDPOINT}password-reset/`, payload);
}

/**
 * `POST /api/v1/auth/password-reset/confirm/` — completes a reset with the
 * `token` from the emailed link plus a new password. Doesn't return tokens
 * (same as `registerAccount`) — call `loginAccount()` next.
 */
export async function confirmPasswordReset(payload: PasswordResetConfirmPayload): Promise<ApiResult<{ detail?: string }>> {
  return postJson<{ detail?: string }>(`${AUTH_ENDPOINT}password-reset/confirm/`, payload);
}

/**
 * `POST /api/v1/auth/verify-email/` — confirms the `token` from the emailed
 * verification link (sent on `registerAccount()`; see BookingLoginPage's
 * `email_not_verified` handling). Not account-type-specific, same as the
 * password-reset flow above. Doesn't return tokens — the verified visitor
 * still logs in normally afterward.
 */
export async function verifyEmail(payload: VerifyEmailPayload): Promise<ApiResult<{ message?: string }>> {
  return postJson<{ message?: string }>(`${AUTH_ENDPOINT}verify-email/`, payload);
}

/**
 * Exchanges a refresh token for a new access token (`POST /api/v1/auth/refresh/` — SimpleJWT's
 * `TokenRefreshView`). The backend has `ROTATE_REFRESH_TOKENS=True`, so a new `refresh` token
 * comes back too and must be persisted — the old one is blacklisted immediately, so calling
 * this twice with the original refresh token fails the second time.
 *
 * Used to recover a dashboard session whose 30-minute access token has expired (see
 * components/account/BookingDashboard.tsx) without forcing a fresh login unless the refresh
 * token itself is also invalid/expired.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<ApiResult<{ access: string; refresh: string }>> {
  return postJson<{ access: string; refresh: string }>(`${AUTH_ENDPOINT}refresh/`, { refresh: refreshToken });
}

/** Shared GET-and-parse for the authenticated dashboard reads below. */
async function getJson<T>(url: string, accessToken?: string): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        ...NGROK_SKIP_HEADER,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: "no-store",
    });
  } catch (error) {
    console.warn(`Failed to fetch ${url}:`, error);
    return { ok: false, status: null, message: "Couldn't reach the server. Check your connection and try again." };
  }
  if (!response.ok) {
    return { ok: false, status: response.status, message: `Request failed (${response.status}).` };
  }
  try {
    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (error) {
    console.warn(`Failed to parse JSON for ${url}:`, error);
    return { ok: false, status: response.status, message: "Invalid response format from the server." };
  }
}

/**
 * flow.pdf "The second event": "Ramesh logs into his booking account, sees
 * Ananya and Karthik saved, and registers them in a few clicks." — every
 * Student this account has ever entered as an attendee, for
 * BookingForm.tsx's saved-student picker to pre-fill from.
 */
export async function getMyStudents(accessToken: string): Promise<ApiResult<SavedStudent[]>> {
  return getJson<SavedStudent[]>(`${API_BASE_URL}/api/v1/my-students/`, accessToken);
}

/** A booking account's own booking history, for components/account/BookingDashboard.tsx.
 * Only the first page — dashboards showing "recent bookings" don't need full pagination UI.
 */
export async function getMyRegistrations(accessToken: string): Promise<ApiResult<RegistrationHistoryItem[]>> {
  const result = await getJson<PaginatedResponse<RegistrationHistoryItem>>(
    `${API_BASE_URL}/api/v1/registrations/`,
    accessToken,
  );
  return result.ok ? { ok: true, data: result.data.results } : result;
}

/** Published events across every subdomain/event, for the "upcoming events" section on both
 * account dashboards — a cross-event view, unlike getEventBySlug's single-subdomain lookup.
 */
export async function listPublishedEvents(): Promise<Event[]> {
  const events: Event[] = [];
  let url: string | null = `${EVENTS_ENDPOINT}?status=published`;
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const data: EventListResponse | null = await fetchJson<EventListResponse>(url);
    if (!data) break;
    events.push(...(data.results ?? []));
    url = data.next;
  }
  return events;
}

/**
 * An event's testimonials (see `Testimonial` in lib/types.ts). Best-effort:
 * an empty array on failure, same as the other purely-decorative list
 * fetches, so a broken testimonials endpoint doesn't take the rest of the
 * event page down with it.
 */
export async function listTestimonials(eventId: number | string): Promise<Testimonial[]> {
  const testimonials: Testimonial[] = [];
  let url: string | null = `${EVENTS_ENDPOINT}${eventId}/testimonials/`;
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const data: PaginatedResponse<Testimonial> | null = await fetchJson<PaginatedResponse<Testimonial>>(url);
    if (!data) break;
    testimonials.push(...(data.results ?? []));
    url = data.next;
  }
  return testimonials;
}

/**
 * The signed-in booking account's own testimonial for one event, or `null`
 * if they haven't left one (the backend 404s `.../testimonials/me/` in that
 * case) — used to decide whether the dashboard shows "write a review" or
 * the existing one with edit/delete. Best-effort like the read above: any
 * other failure also just falls back to `null`, which degrades to offering
 * "write a review" — the create call itself is the actual authority, and
 * will surface the real "you've already submitted one" error if that's
 * wrong.
 */
export async function getMyTestimonial(
  eventId: number | string,
  accessToken: string,
): Promise<Testimonial | null> {
  const result = await getJson<Testimonial>(`${EVENTS_ENDPOINT}${eventId}/testimonials/me/`, accessToken);
  return result.ok ? result.data : null;
}

/** Only "the main account holder" (a booking account) can post — see updates.txt-style
 * gating on `POST /api/v1/events/{event_id}/testimonials/`. Rejected with a 400 if this
 * account already has one for the event; the dashboard should offer edit/delete instead. */
export async function createTestimonial(
  eventId: number | string,
  payload: TestimonialInput,
  accessToken: string,
): Promise<ApiResult<Testimonial>> {
  return sendAuthedJson<Testimonial>("POST", `${EVENTS_ENDPOINT}${eventId}/testimonials/`, accessToken, payload);
}

export async function updateTestimonial(
  eventId: number | string,
  payload: TestimonialInput,
  accessToken: string,
): Promise<ApiResult<Testimonial>> {
  return sendAuthedJson<Testimonial>("PATCH", `${EVENTS_ENDPOINT}${eventId}/testimonials/me/`, accessToken, payload);
}

export async function deleteTestimonial(
  eventId: number | string,
  accessToken: string,
): Promise<ApiResult<null>> {
  return sendAuthedJson<null>("DELETE", `${EVENTS_ENDPOINT}${eventId}/testimonials/me/`, accessToken);
}

export async function getCommunityProfile(accessToken: string): Promise<ApiResult<CommunityProfileResponse>> {
  return getJson<CommunityProfileResponse>(`${API_BASE_URL}/api/v1/community/me/`, accessToken);
}

/**
 * A registered child (an attendee on a parent/institute booking) has no
 * email or password of their own — this single request both creates their
 * community_student account (first visit) and logs them in (every visit
 * after); there's no separate signup step. `token` is
 * `Registration.access_token`, shared by every child on that booking — the
 * same UUID that also backs the parent's own magic-link login — so
 * `name`/`date_of_birth` (plus `school` as a tie-breaker) is what
 * disambiguates *which* registered child this is, matched against that
 * booking's own attendees only. Returns tokens directly, same shape as
 * `loginAccount()` — no follow-up login call needed.
 */
export async function claimCommunityAccount(
  token: string,
  payload: ChildClaimPayload,
): Promise<ApiResult<AuthTokens & { user: AuthUser }>> {
  return postJson<AuthTokens & { user: AuthUser }>(
    `${API_BASE_URL}/api/v1/community/claim/${encodeURIComponent(token)}/`,
    payload,
  );
}

/**
 * Resolves a possibly-relative media path (e.g. Django `MEDIA_URL`
 * output like "/media/banners/x.png") against the API host so `<img>`
 * tags work regardless of environment.
 */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
