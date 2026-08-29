import type { Attendee } from "./booking";
import type { TicketType } from "./types";

/**
 * One selected ticket type's worth of attendees — a "cart line". Maps
 * directly onto one `BookingLineInput` at checkout (`{ ticket_id, attendees
 * }`), but keeps the full `TicketType` (not just its id) so the cart and
 * checkout screens can show name/price/kind/access without re-fetching.
 *
 * `id` is a local-only identifier (never sent to the backend) — React key
 * and removal handle, since `ticket.id` alone isn't unique across lines
 * (the same ticket type can have more than one line — see CartProvider
 * `addTicket`, for a team ticket's "add another team").
 */
export interface CartLine {
  id: string;
  ticket: TicketType;
  attendees: Attendee[];
}

/**
 * One `localStorage` key, not one per event. This is a single-event-per-
 * subdomain app (AGENTS.md) — every route on a given subdomain deals with
 * exactly one event, so there's no realistic case of two different events'
 * tickets ending up in the same browser's cart for this key to need to
 * disambiguate.
 */
const STORAGE_KEY = "otomatiks:cart";

/** Guarded the same way as lib/auth.ts's session storage: SSR has no
 * `window`, and a private-mode browser or blocked storage can throw even
 * client-side — every caller degrades to an empty/no-op cart rather than
 * crashing the page. */
export function loadCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to read cart:", error);
    return [];
  }
}

export function saveCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch (error) {
    console.warn("Failed to save cart:", error);
  }
}

export function clearStoredCart(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear cart:", error);
  }
}
