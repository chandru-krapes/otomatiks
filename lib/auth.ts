import type { AuthUser } from "./types";

/**
 * Lightweight client-side session storage for the account dashboards
 * (components/account/*). The booking flow (components/booking) keeps its
 * token in-memory only, for the duration of one submit — that's not enough
 * here, since a dashboard page needs to survive reloads/navigation.
 *
 * Two separate storage keys, not one, because a booking account and a
 * community account are genuinely separate accounts (flow.pdf "Two separate
 * systems") — being logged into one says nothing about the other, so a
 * visitor can be logged into both at once without either clobbering the
 * other. "admin" is a third, independent slot for the staff console
 * (app/admin) — an admin/organizer/volunteer login has nothing to do with
 * either booking or community accounts either.
 */

export type SessionKind = "booking" | "community" | "admin";

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

function storageKey(kind: SessionKind): string {
  return `otomatiks:${kind}-session`;
}

/** All storage access is guarded — SSR has no `window`, and a private-mode
 * browser or blocked storage can throw even client-side. Every caller
 * degrades to "no session" rather than crashing the page either way.
 */
export function saveSession(kind: SessionKind, session: StoredSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(kind), JSON.stringify(session));
  } catch (error) {
    console.warn(`Failed to save ${kind} session:`, error);
  }
}

export function loadSession(kind: SessionKind): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(kind));
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch (error) {
    console.warn(`Failed to read ${kind} session:`, error);
    return null;
  }
}

/** Persists a refreshed access (and rotated refresh) token from lib/api.ts refreshAccessToken
 * back into storage — everything else about the session (the user info) stays as-is. */
export function updateTokens(kind: SessionKind, session: StoredSession, tokens: { access: string; refresh: string }): void {
  saveSession(kind, { ...session, accessToken: tokens.access, refreshToken: tokens.refresh });
}

export function clearSession(kind: SessionKind): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(kind));
  } catch (error) {
    console.warn(`Failed to clear ${kind} session:`, error);
  }
}
