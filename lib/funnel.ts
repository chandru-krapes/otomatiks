import type { FunnelStep } from "./types";
import { trackFunnelEvent } from "./api";
import { loadSession } from "./auth";

/**
 * Frontend half of `apps.analytics.models.FunnelEvent` (see lib/api.ts
 * `trackFunnelEvent`) — generates/persists the `session_id` every step is
 * tagged with, and a fire-and-forget wrapper around the track call so
 * callers never have to think about analytics failing or being slow.
 */

const STORAGE_KEY = "otomatiks:funnel-session";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * One UUID per browser, persisted in `localStorage` (not `sessionStorage`)
 * so a visitor who leaves mid-funnel and comes back later — closing the tab,
 * or just navigating around the site for a while — still ties back to the
 * same funnel session rather than starting a fresh one on every tab. Falls
 * back to a fresh in-memory id (never persisted) if storage is unavailable
 * — a private-mode browser or blocked storage shouldn't crash tracking, it
 * should just degrade to "this step's session id won't match a later one".
 */
export function getFunnelSessionId(): string {
  if (typeof window === "undefined") return generateId();
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const fresh = generateId();
    window.localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return generateId();
  }
}

/**
 * Fires one funnel step. Never throws, never returns anything callers need
 * to check — a dropped or slow analytics beacon must never block or error
 * out the real user action it's reporting on (adding a ticket, starting
 * payment, …), so this deliberately doesn't return the underlying promise.
 *
 * `accessToken` is best-effort: pass the current booking session's token
 * when one's available (see lib/auth.ts `loadSession`) so a step that fires
 * after OTP verification attaches to `request.user` immediately; omitted
 * automatically for an anonymous visitor.
 */
export function trackFunnelStep(eventId: number | string, step: FunnelStep, ticketTypeId?: number | string): void {
  if (typeof window === "undefined") return;
  const accessToken = loadSession("booking")?.accessToken;
  trackFunnelEvent(
    {
      event_id: eventId,
      session_id: getFunnelSessionId(),
      step,
      ...(ticketTypeId != null ? { ticket_type_id: ticketTypeId } : {}),
    },
    accessToken,
  ).catch((error) => {
    console.warn(`Failed to track funnel step "${step}":`, error);
  });
}
