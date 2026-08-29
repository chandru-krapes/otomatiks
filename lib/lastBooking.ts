import type { BookingResponse } from "./types";

const STORAGE_KEY_PREFIX = "otomatiks:last-booking:";

/**
 * Stashes a just-created booking's full response in `sessionStorage`, keyed
 * by its reference, so the confirmation page (`/bookings/[reference]`) can
 * render it immediately without a network round trip — and, for a guest
 * checkout with no account, without one it *can't* make: `GET
 * /api/v1/bookings/{booking_reference}/` requires auth even for the
 * account that created the booking (confirmed against the live backend —
 * see lib/api.ts `getBookingByReference`), which a guest simply has none
 * of. `sessionStorage`, not `localStorage`: this is scoped to the tab that
 * just booked, not a persistent "my bookings" cache.
 */
export function rememberLastBooking(booking: BookingResponse): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${booking.booking_reference}`, JSON.stringify(booking));
  } catch (error) {
    console.warn("Failed to remember last booking:", error);
  }
}

export function recallLastBooking(reference: string): BookingResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${reference}`);
    return raw ? (JSON.parse(raw) as BookingResponse) : null;
  } catch (error) {
    console.warn("Failed to recall last booking:", error);
    return null;
  }
}
