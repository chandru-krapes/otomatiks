import { API_BASE_URL, NGROK_SKIP_HEADER, type ApiResult } from "./api";
import type { Event, EventListResponse, GalleryItem, PaginatedResponse, Speaker, Sponsor, TicketType } from "./types";
import type {
  AdminRegistration,
  AnalyticsAttendance,
  AnalyticsDemographics,
  AnalyticsSummary,
  AttendanceLogItem,
  Batch,
  BatchAssignment,
  CertificateRecord,
  CertificateTaskStatus,
  CertificateTemplate,
  EmailLog,
  EmailTemplate,
  EmailTrigger,
  Membership,
  MembershipRole,
  MediaListResponse,
  MediaObject,
  Payment,
  PromoCode,
  Refund,
  RegistrantSearchResult,
  ReportKind,
  SubUnit,
  TicketSalesRow,
} from "./adminTypes";

/**
 * Thin client for every authenticated management endpoint in the "Admin &
 * organizer API endpoints" reference doc. Mirrors the request/parse pattern
 * already established in lib/api.ts (`ApiResult<T>`, DRF's two error shapes)
 * but keeps its own small fetch helpers rather than reaching into that
 * file's private functions — this is a separate surface (staff-only reads
 * and writes across 11 apps) with its own auth story, not another booking-flow
 * call site.
 */

const V1 = `${API_BASE_URL}/api/v1`;

function authHeaders(token: string, hasBody: boolean): Record<string, string> {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    // Only actually set when API_BASE_URL is an ngrok host — see its
    // definition in lib/api.ts. A local Django backend's CORS allowlist
    // rejects the preflight outright if this is sent to it unconditionally.
    ...NGROK_SKIP_HEADER,
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
  };
}

function parseError(status: number, body: unknown): ApiResult<never> {
  const errorBody = (body ?? {}) as { detail?: string; code?: string; [k: string]: unknown };
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

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  url: string,
  token: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: authHeaders(token, body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (error) {
    console.warn(`Failed to ${method} ${url}:`, error);
    return { ok: false, status: null, message: "Couldn't reach the server. Check your connection and try again." };
  }

  let parsed: unknown = null;
  if (response.status !== 204) {
    try {
      parsed = await response.json();
    } catch {
      // No/invalid JSON body — fine for e.g. a 200 with nothing.
    }
  }

  if (!response.ok) return parseError(response.status, parsed);
  return { ok: true, data: parsed as T };
}

/** Multipart counterpart to `request` — for the file-upload endpoints (banners, speaker
 * photos, sponsor logos, gallery media). No `Content-Type` header: the browser sets
 * `multipart/form-data` with the correct boundary itself, and setting it manually drops that
 * boundary. DRF parses multipart bodies on PATCH the same as POST, so this covers both. */
async function requestMultipart<T>(
  method: "POST" | "PATCH",
  url: string,
  token: string,
  formData: FormData,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...NGROK_SKIP_HEADER },
      body: formData,
    });
  } catch (error) {
    console.warn(`Failed to ${method} ${url}:`, error);
    return { ok: false, status: null, message: "Couldn't reach the server. Check your connection and try again." };
  }

  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    // No/invalid JSON body.
  }

  if (!response.ok) return parseError(response.status, parsed);
  return { ok: true, data: parsed as T };
}

const get = <T>(url: string, token: string): Promise<ApiResult<T>> => request<T>("GET", url, token);
const post = <T>(url: string, token: string, body?: unknown): Promise<ApiResult<T>> => request<T>("POST", url, token, body ?? {});
const patch = <T>(url: string, token: string, body: unknown): Promise<ApiResult<T>> => request<T>("PATCH", url, token, body);
const put = <T>(url: string, token: string, body: unknown): Promise<ApiResult<T>> => request<T>("PUT", url, token, body);
const del = <T>(url: string, token: string): Promise<ApiResult<T>> => request<T>("DELETE", url, token);

/** Walks every page of a DRF-paginated list, up to a safety cap — same shape as lib/api.ts's
 * own list walkers, duplicated here since this module doesn't share its private helpers. */
async function getAllPages<T>(url: string, token: string, maxPages = 20): Promise<T[]> {
  const items: T[] = [];
  let next: string | null = url;
  for (let page = 0; next && page < maxPages; page++) {
    const result: ApiResult<PaginatedResponse<T>> = await get(next, token);
    if (!result.ok) break;
    items.push(...(result.data.results ?? []));
    next = result.data.next;
  }
  return items;
}

/** Streams an authenticated file response (xlsx report, QR PNG, certificate) to a browser
 * download — plain `<a href>` can't attach the Bearer header these all require. */
export async function downloadAuthedFile(url: string, token: string, fallbackName: string): Promise<ApiResult<null>> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, ...NGROK_SKIP_HEADER },
    });
  } catch (error) {
    console.warn(`Failed to download ${url}:`, error);
    return { ok: false, status: null, message: "Couldn't reach the server. Check your connection and try again." };
  }
  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // no body
    }
    return parseError(response.status, body);
  }
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const nameMatch = /filename="?([^";]+)"?/.exec(disposition);
  const filename = nameMatch?.[1] ?? fallbackName;
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
  return { ok: true, data: null };
}

/* -- apps/common: platform-wide media library ------------------------------ */

/**
 * Browses the whole Cloudflare R2 bucket — every folder every upload flow in this admin
 * panel writes into, not just one event's gallery. `IsAdmin`-only (see `MediaObject` in
 * lib/adminTypes.ts), so this call 403s for an organizer/volunteer session; callers should
 * treat that the same as any other permission error, not a bug.
 */
export function listMedia(
  token: string,
  options: { folder?: string; cursor?: string; pageSize?: number } = {},
): Promise<ApiResult<MediaListResponse>> {
  const params = new URLSearchParams();
  if (options.folder) params.set("folder", options.folder);
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.pageSize) params.set("page_size", String(options.pageSize));
  const query = params.toString();
  return get<MediaListResponse>(`${V1}/media/${query ? `?${query}` : ""}`, token);
}

/** Uploads straight into the bucket without attaching to any record — the returned `url`
 * is then dropped into whatever field wanted it (`banner_url`, a gallery item's `media_url`, …). */
export function uploadMedia(token: string, file: File, folder?: string): Promise<ApiResult<MediaObject>> {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) formData.append("folder", folder);
  return requestMultipart<MediaObject>("POST", `${V1}/media/upload/`, token, formData);
}

/** `key` is the full R2 key including its folder (e.g. "gallery_media/3fae2199a1.jpg") — sent
 * as a literal path segment, not URI-encoded, since the backend route expects the slash. */
export const deleteMedia = (token: string, key: string) => del<null>(`${V1}/media/${key}/`, token);

/* -- apps/events ---------------------------------------------------------- */

/** Every event visible to the signed-in staff member (organizer/admin see drafts too, unlike
 * the public site's status=published filter) — walks pagination like lib/api.ts's own list. */
export async function listAllEvents(token: string): Promise<Event[]> {
  const events: Event[] = [];
  let url: string | null = `${V1}/events/`;
  for (let page = 0; url && page < 20; page++) {
    const result: ApiResult<EventListResponse> = await get(url, token);
    if (!result.ok) break;
    events.push(...(result.data.results ?? []));
    url = result.data.next;
  }
  return events;
}

export interface EventCreatePayload {
  title: string;
  /** One-line summary — distinct from `description`, the long-form "about" copy. */
  short_description?: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  venue_name?: string;
  venue_address?: string;
  contact_email?: string;
  contact_phone?: string;
  /** Already-hosted banner — mutually exclusive with uploading a `banner_image` file, which
   * requires `createEventMultipart`/`updateEventMultipart` instead. */
  banner_url?: string;
  /** Already-hosted secondary image for the "Why join event" section — mutually exclusive
   * with uploading an `about_image` file, same either/or as the banner above. */
  about_image_url?: string;
}

export const createEvent = (token: string, payload: EventCreatePayload) => post<Event>(`${V1}/events/`, token, payload);
export const updateEvent = (token: string, eventId: number | string, payload: Partial<EventCreatePayload>) =>
  patch<Event>(`${V1}/events/${eventId}/`, token, payload);

/** Builds the multipart body shared by create/update — every text field plus the event's
 * two single-image slots (as opposed to the many-item gallery below): `banner_image` (hero)
 * and `about_image` (the "Why join event" section's secondary image). Both can be sent in
 * the same request; each uploads to its own R2 folder. */
function eventFormData(payload: Partial<EventCreatePayload>, bannerFile?: File | null, aboutImageFile?: File | null): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  }
  if (bannerFile) formData.append("banner_image", bannerFile);
  if (aboutImageFile) formData.append("about_image", aboutImageFile);
  return formData;
}

export const createEventMultipart = (token: string, payload: EventCreatePayload, bannerFile?: File | null, aboutImageFile?: File | null) =>
  requestMultipart<Event>("POST", `${V1}/events/`, token, eventFormData(payload, bannerFile, aboutImageFile));
export const updateEventMultipart = (
  token: string,
  eventId: number | string,
  payload: Partial<EventCreatePayload>,
  bannerFile?: File | null,
  aboutImageFile?: File | null,
) => requestMultipart<Event>("PATCH", `${V1}/events/${eventId}/`, token, eventFormData(payload, bannerFile, aboutImageFile));

export const publishEvent = (token: string, eventId: number | string) => post<Event>(`${V1}/events/${eventId}/publish/`, token);
export const duplicateEvent = (token: string, eventId: number | string) => post<Event>(`${V1}/events/${eventId}/duplicate/`, token);
export const deleteEvent = (token: string, eventId: number | string) => del<null>(`${V1}/events/${eventId}/`, token);

/* -- apps/events: gallery, speakers, sponsors ------------------------------ */

/** Event media library. Read is a plain array (not DRF-paginated, unlike most list
 * endpoints here). `media_url`-from-URL and file-upload share the same endpoint — see
 * `createEventGalleryFiles`/`createEventGalleryFromUrls` below for the two write shapes. */
export const listEventGallery = (token: string, eventId: number | string) =>
  get<GalleryItem[]>(`${V1}/events/${eventId}/gallery/`, token);

/** Bulk-from-URL (or a single item, as a one-element array) — no file involved. */
export const createEventGalleryFromUrls = (
  token: string,
  eventId: number | string,
  items: { media_url: string; caption?: string; media_type: "image" | "video" }[],
) => post<GalleryItem[]>(`${V1}/events/${eventId}/gallery/`, token, items);

/** Bulk file upload — one shared caption/type for the whole batch (the API also supports
 * setting them per-file with repeated `caption`/`media_type` fields, but the admin UI only
 * offers one for the whole batch at a time, to keep the upload form simple). */
export function createEventGalleryFiles(
  token: string,
  eventId: number | string,
  files: File[],
  caption: string,
  mediaType: "image" | "video",
): Promise<ApiResult<GalleryItem[] | GalleryItem>> {
  const formData = new FormData();
  for (const file of files) formData.append("media", file);
  if (caption) formData.append("caption", caption);
  formData.append("media_type", mediaType);
  return requestMultipart("POST", `${V1}/events/${eventId}/gallery/`, token, formData);
}

export const deleteEventGalleryItem = (token: string, eventId: number | string, itemId: number | string) =>
  del<null>(`${V1}/events/${eventId}/gallery/${itemId}/`, token);

export const listSpeakers = (token: string, eventId: number | string) =>
  get<Speaker[] | PaginatedResponse<Speaker>>(`${V1}/events/${eventId}/speakers/`, token);

export interface SpeakerPayload {
  name: string;
  bio?: string;
  designation?: string;
  photo_url?: string;
}

export const createSpeaker = (token: string, eventId: number | string, payload: SpeakerPayload) =>
  post<Speaker>(`${V1}/events/${eventId}/speakers/`, token, payload);
export function createSpeakerMultipart(token: string, eventId: number | string, payload: SpeakerPayload, photoFile: File): Promise<ApiResult<Speaker>> {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) formData.append(key, String(value));
  }
  formData.append("photo", photoFile);
  return requestMultipart("POST", `${V1}/events/${eventId}/speakers/`, token, formData);
}
export const updateSpeaker = (token: string, eventId: number | string, speakerId: number | string, payload: Partial<SpeakerPayload>) =>
  patch<Speaker>(`${V1}/events/${eventId}/speakers/${speakerId}/`, token, payload);
export const deleteSpeaker = (token: string, eventId: number | string, speakerId: number | string) =>
  del<null>(`${V1}/events/${eventId}/speakers/${speakerId}/`, token);

export const listSponsors = (token: string, eventId: number | string) =>
  get<Sponsor[] | PaginatedResponse<Sponsor>>(`${V1}/events/${eventId}/sponsors/`, token);

export interface SponsorPayload {
  name: string;
  type?: string;
  tier?: string;
  website_url?: string;
  logo_url?: string;
}

export const createSponsor = (token: string, eventId: number | string, payload: SponsorPayload) =>
  post<Sponsor>(`${V1}/events/${eventId}/sponsors/`, token, payload);
export function createSponsorMultipart(token: string, eventId: number | string, payload: SponsorPayload, logoFile: File): Promise<ApiResult<Sponsor>> {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) formData.append(key, String(value));
  }
  formData.append("logo", logoFile);
  return requestMultipart("POST", `${V1}/events/${eventId}/sponsors/`, token, formData);
}
export const updateSponsor = (token: string, eventId: number | string, sponsorId: number | string, payload: Partial<SponsorPayload>) =>
  patch<Sponsor>(`${V1}/events/${eventId}/sponsors/${sponsorId}/`, token, payload);
export const deleteSponsor = (token: string, eventId: number | string, sponsorId: number | string) =>
  del<null>(`${V1}/events/${eventId}/sponsors/${sponsorId}/`, token);

/* -- apps/accounts (memberships) ------------------------------------------ */

export const listMemberships = (token: string, eventId: number | string) =>
  getAllPages<Membership>(`${V1}/events/${eventId}/memberships/`, token);

export const inviteMembership = (token: string, eventId: number | string, userEmail: string, role: MembershipRole) =>
  post<Membership>(`${V1}/events/${eventId}/memberships/`, token, { user_email: userEmail, role });

export const removeMembership = (token: string, eventId: number | string, membershipId: number | string) =>
  del<null>(`${V1}/events/${eventId}/memberships/${membershipId}/`, token);

/* -- apps/tickets ----------------------------------------------------------*/

export const listTicketTypes = (token: string, eventId: number | string) =>
  get<TicketType[] | PaginatedResponse<TicketType>>(`${V1}/events/${eventId}/ticket-types/`, token);

export interface TicketTypeCreatePayload {
  name: string;
  /** One-line summary — distinct from `description`, the long-form "what's included" copy. */
  short_description?: string;
  description?: string;
  price: string;
  is_sponsored?: boolean;
  capacity?: number;
  start_time?: string;
  end_time?: string;
  sales_start?: string;
  sales_end?: string;
  kind?: string;
  max_team_size?: number;
}

export const createTicketType = (token: string, eventId: number | string, payload: TicketTypeCreatePayload) =>
  post<TicketType>(`${V1}/events/${eventId}/ticket-types/`, token, payload);
export const updateTicketType = (token: string, eventId: number | string, ticketId: number | string, payload: Partial<TicketTypeCreatePayload>) =>
  patch<TicketType>(`${V1}/events/${eventId}/ticket-types/${ticketId}/`, token, payload);
export const deleteTicketType = (token: string, eventId: number | string, ticketId: number | string) =>
  del<null>(`${V1}/events/${eventId}/ticket-types/${ticketId}/`, token);
export const pauseTicketType = (token: string, eventId: number | string, ticketId: number | string) =>
  post<TicketType>(`${V1}/events/${eventId}/ticket-types/${ticketId}/pause/`, token);
export const resumeTicketType = (token: string, eventId: number | string, ticketId: number | string) =>
  post<TicketType>(`${V1}/events/${eventId}/ticket-types/${ticketId}/resume/`, token);

/** Ticket-type media library — identical file/URL/bulk semantics to the event gallery above,
 * just scoped to one ticket type (and, unlike the event gallery, the list itself is staff-only). */
export const listTicketGallery = (token: string, eventId: number | string, ticketTypeId: number | string) =>
  get<GalleryItem[]>(`${V1}/events/${eventId}/ticket-types/${ticketTypeId}/gallery/`, token);

export const createTicketGalleryFromUrls = (
  token: string,
  eventId: number | string,
  ticketTypeId: number | string,
  items: { media_url: string; caption?: string; media_type: "image" | "video" }[],
) => post<GalleryItem[]>(`${V1}/events/${eventId}/ticket-types/${ticketTypeId}/gallery/`, token, items);

export function createTicketGalleryFiles(
  token: string,
  eventId: number | string,
  ticketTypeId: number | string,
  files: File[],
  caption: string,
  mediaType: "image" | "video",
): Promise<ApiResult<GalleryItem[] | GalleryItem>> {
  const formData = new FormData();
  for (const file of files) formData.append("media", file);
  if (caption) formData.append("caption", caption);
  formData.append("media_type", mediaType);
  return requestMultipart("POST", `${V1}/events/${eventId}/ticket-types/${ticketTypeId}/gallery/`, token, formData);
}

export const deleteTicketGalleryItem = (token: string, eventId: number | string, ticketTypeId: number | string, itemId: number | string) =>
  del<null>(`${V1}/events/${eventId}/ticket-types/${ticketTypeId}/gallery/${itemId}/`, token);

/** Plain array response (not DRF-paginated), same as the event/ticket galleries above —
 * `getAllPages` expects a `{results, next}` envelope, which this endpoint doesn't return, so
 * using it here silently produced an empty list (`.results` on a bare array is `undefined`)
 * even when the backend had codes to show. */
export const listPromoCodes = async (token: string, eventId: number | string): Promise<PromoCode[]> => {
  const result = await get<PromoCode[]>(`${V1}/events/${eventId}/promo-codes/`, token);
  return result.ok ? result.data : [];
};

export interface PromoCodeCreatePayload {
  code: string;
  discount_type: "percentage" | "flat";
  discount_value: string;
  max_uses?: number;
  valid_from?: string;
  valid_until?: string;
  applicable_ticket_types?: (number | string)[];
}

export const createPromoCode = (token: string, eventId: number | string, payload: PromoCodeCreatePayload) =>
  post<PromoCode>(`${V1}/events/${eventId}/promo-codes/`, token, payload);
/** Covers both an edit and "kill a code early" — the latter is just `{ is_active: false }`,
 * the same PATCH an organizer would use to change any other field. A code otherwise
 * deactivates on its own (Celery beat) once `valid_until` passes. */
export const updatePromoCode = (
  token: string,
  eventId: number | string,
  promoId: number | string,
  payload: Partial<PromoCodeCreatePayload> & { is_active?: boolean },
) => patch<PromoCode>(`${V1}/events/${eventId}/promo-codes/${promoId}/`, token, payload);
export const deletePromoCode = (token: string, eventId: number | string, promoId: number | string) =>
  del<null>(`${V1}/events/${eventId}/promo-codes/${promoId}/`, token);

export const listSubUnits = (token: string, eventId: number | string) =>
  getAllPages<SubUnit>(`${V1}/events/${eventId}/sub-units/`, token);

export interface SubUnitCreatePayload {
  kind: "zone" | "session" | "competition";
  name: string;
  capacity?: number;
  scheduled_at?: string;
  ticket_types?: (number | string)[];
}

export const createSubUnit = (token: string, eventId: number | string, payload: SubUnitCreatePayload) =>
  post<SubUnit>(`${V1}/events/${eventId}/sub-units/`, token, payload);

/* -- apps/registration ------------------------------------------------------*/

export async function listRegistrations(
  token: string,
  eventId: number | string,
  status?: string,
): Promise<ApiResult<PaginatedResponse<AdminRegistration>>> {
  const params = new URLSearchParams({ event_id: String(eventId) });
  if (status) params.set("status", status);
  return get<PaginatedResponse<AdminRegistration>>(`${V1}/registrations/?${params.toString()}`, token);
}

export const getRegistration = (token: string, registrationId: number | string) =>
  get<AdminRegistration>(`${V1}/registrations/${registrationId}/`, token);

export const cancelRegistration = (token: string, registrationId: number | string, reason: string) =>
  post<AdminRegistration>(`${V1}/registrations/${registrationId}/cancel/`, token, { reason });

export const getRegistrationForm = (token: string, eventId: number | string, appliesTo: "primary" | "attendee" = "primary") =>
  get<{ applies_to: string; schema: unknown[] }>(`${V1}/events/${eventId}/registration-form/?applies_to=${appliesTo}`, token);

export const putRegistrationForm = (
  token: string,
  eventId: number | string,
  appliesTo: "primary" | "attendee",
  schema: unknown[],
) => put<{ applies_to: string; schema: unknown[] }>(`${V1}/events/${eventId}/registration-form/`, token, { applies_to: appliesTo, schema });

/* -- apps/payments ---------------------------------------------------------*/

export async function listPayments(
  token: string,
  eventId: number | string,
  status?: string,
): Promise<ApiResult<PaginatedResponse<Payment>>> {
  const params = new URLSearchParams({ event_id: String(eventId) });
  if (status) params.set("status", status);
  return get<PaginatedResponse<Payment>>(`${V1}/payments/?${params.toString()}`, token);
}

export const verifyPayment = (token: string, paymentId: number | string) => post<Payment>(`${V1}/payments/${paymentId}/verify/`, token);
export const refundPayment = (token: string, paymentId: number | string, amount: string, reason: string) =>
  post<Refund>(`${V1}/payments/${paymentId}/refund/`, token, { amount, reason });

/* -- apps/attendance ---------------------------------------------------------*/

export const checkIn = (token: string, qrToken: string, purpose = "entry") =>
  post<AttendanceLogItem>(`${V1}/attendance/check-in/`, token, { qr_token: qrToken, purpose });
export const checkOut = (token: string, qrToken: string, purpose = "entry") =>
  post<AttendanceLogItem>(`${V1}/attendance/check-out/`, token, { qr_token: qrToken, purpose });
export const manualCheckIn = (token: string, registrationId: number | string, purpose = "entry") =>
  post<AttendanceLogItem>(`${V1}/attendance/manual/`, token, { registration_id: registrationId, purpose });

export const searchRegistrants = (token: string, query: string) =>
  get<PaginatedResponse<RegistrantSearchResult>>(`${V1}/attendance/search/?q=${encodeURIComponent(query)}`, token);

export const listEventAttendance = (token: string, eventId: number | string) =>
  getAllPages<AttendanceLogItem>(`${V1}/events/${eventId}/attendance/`, token);

/* -- apps/batching -----------------------------------------------------------*/

export const listBatches = (token: string, eventId: number | string) =>
  getAllPages<Batch>(`${V1}/events/${eventId}/batches/`, token);
export const createBatch = (token: string, eventId: number | string, name: string, capacity?: number) =>
  post<Batch>(`${V1}/events/${eventId}/batches/`, token, { name, capacity });
export const deleteBatch = (token: string, eventId: number | string, batchId: number | string) =>
  del<null>(`${V1}/events/${eventId}/batches/${batchId}/`, token);
export const assignToBatch = (token: string, batchId: number | string, registrationIds: (number | string)[]) =>
  post<BatchAssignment[]>(`${V1}/batches/${batchId}/assign/`, token, { registration_ids: registrationIds });

export function batchesExportUrl(eventId: number | string): string {
  return `${V1}/events/${eventId}/batches/export/`;
}

/* -- apps/certificates -------------------------------------------------------*/

export const listCertificateTemplates = (token: string, eventId: number | string) =>
  getAllPages<CertificateTemplate>(`${V1}/events/${eventId}/certificate-templates/`, token);

export const generateCertificates = (token: string, registrationIds: (number | string)[], templateId: number | string) =>
  post<{ task_id: string }>(`${V1}/certificates/generate/`, token, { registration_ids: registrationIds, template_id: templateId });

export const pollCertificateTask = (token: string, taskId: string) =>
  get<CertificateTaskStatus>(`${V1}/certificates/tasks/${taskId}/`, token);

export const listRegistrationCertificates = (token: string, registrationId: number | string) =>
  get<CertificateRecord[]>(`${V1}/registrations/${registrationId}/certificates/`, token);

export function certificateDownloadUrl(certificateId: number | string): string {
  return `${V1}/certificates/${certificateId}/download/`;
}

/* -- apps/notifications -------------------------------------------------------*/

export const getEmailTemplate = (token: string, eventId: number | string, trigger: EmailTrigger | string) =>
  get<EmailTemplate>(`${V1}/events/${eventId}/email-templates/${trigger}/`, token);

export const putEmailTemplate = (token: string, eventId: number | string, trigger: EmailTrigger | string, subject: string, bodyHtml: string) =>
  put<EmailTemplate>(`${V1}/events/${eventId}/email-templates/${trigger}/`, token, { subject, body_html: bodyHtml });

export const sendTestEmail = (token: string, eventId: number | string, trigger: EmailTrigger | string, toEmail: string) =>
  post<{ sent: boolean }>(`${V1}/events/${eventId}/email-templates/${trigger}/send-test/`, token, { to_email: toEmail });

export const listEmailLogs = (token: string, eventId: number | string, status?: string) =>
  getAllPages<EmailLog>(`${V1}/events/${eventId}/email-logs/${status ? `?status=${status}` : ""}`, token);

/* -- apps/analytics -------------------------------------------------------*/

export const getAnalyticsSummary = (token: string, eventId: number | string) =>
  get<AnalyticsSummary>(`${V1}/events/${eventId}/analytics/summary/`, token);
export const getAnalyticsAttendance = (token: string, eventId: number | string) =>
  get<AnalyticsAttendance>(`${V1}/events/${eventId}/analytics/attendance/`, token);
export const getAnalyticsTicketSales = (token: string, eventId: number | string) =>
  get<TicketSalesRow[]>(`${V1}/events/${eventId}/analytics/ticket-sales/`, token);
export const getAnalyticsDemographics = (token: string, eventId: number | string) =>
  get<AnalyticsDemographics>(`${V1}/events/${eventId}/analytics/demographics/`, token);

/* -- apps/reports -----------------------------------------------------------*/

export function reportUrl(eventId: number | string, kind: ReportKind): string {
  return `${V1}/events/${eventId}/reports/${kind}/`;
}
