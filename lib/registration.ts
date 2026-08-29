import type { Event } from "./types";

export interface RegistrationCta {
  href: string;
  label: string;
  external: boolean;
}

/**
 * Where the "Register"/"Get Tickets" buttons across the site should
 * point. Prefers the on-page ticket pricing section when the backend has
 * ticket types, falling back to an external `registration_url` if the
 * event configured one instead. Returns `null` when neither exists, so
 * callers can hide the button entirely.
 */
export function getRegistrationCta(event: Event): RegistrationCta | null {
  if (event.ticket_types && event.ticket_types.length > 0) {
    return { href: "#tickets", label: event.registration_label || "Get Tickets", external: false };
  }
  if (event.registration_url) {
    return { href: event.registration_url, label: event.registration_label || "Register Now", external: true };
  }
  return null;
}
