"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Event, RegistrationHistoryItem, SavedStudent } from "@/lib/types";
import { type ApiResult, getMyRegistrations, getMyStudents, listPublishedEvents, refreshAccessToken } from "@/lib/api";
import { clearSession, loadSession, updateTokens, type StoredSession } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/format";
import AccountShell from "./AccountShell";
import UpcomingEvents from "./UpcomingEvents";
import TestimonialManager from "./TestimonialManager";
import Button from "@/components/ui/Button";
import EmptyState, { TicketStubIcon } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "finished",
  pending_payment: "Payment pending",
  cancelled: "Cancelled",
};

function statusClass(status: string) {
  if (status === "confirmed") return "border-emerald-100 bg-emerald-50 text-emerald-600";
  if (status === "cancelled") return "border-red-100 bg-red-50 text-red-600";
  return "border-amber-100 bg-amber-50 text-amber-600";
}

function formatBookingCurrency(amountStr: string | null | undefined, currencyCode?: string) {
  if (!amountStr) return "Free";
  const value = Number(amountStr);
  if (Number.isNaN(value)) return amountStr;
  if (value === 0) return "Free";
  const currency = currencyCode || "INR";
  try {
    return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}

export default function BookingDashboard() {
  const router = useRouter();
  // `undefined` = "haven't checked storage yet" — deliberately distinct from `null` ("checked,
  // no session"). This "use client" component still gets server-rendered for the initial HTML,
  // where `localStorage` doesn't exist, so the very first client render (used for hydration)
  // must produce the *same* output as the server — i.e. it can't already know the session.
  // Reading it lazily in useState (as this used to) reads localStorage during that first
  // client render too, before hydration reconciles, so client and server disagree and React
  // throws them away and re-renders — the "Hydration failed" error. Populating it from a
  // useEffect instead (which only ever runs client-side, after hydration) avoids that.
  const [session, setSession] = useState<StoredSession | null | undefined>(undefined);
  useEffect(() => {
    // Deliberate exception to react-hooks/set-state-in-effect: this reads a browser-only API
    // (localStorage) once, right after mount, specifically so the client's first render matches
    // the server's (see the comment above) — there is no other way to get this value in without
    // reintroducing the hydration mismatch this is fixing.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(loadSession("booking"));
  }, []);
  const [registrations, setRegistrations] = useState<RegistrationHistoryItem[]>([]);
  const [savedStudents, setSavedStudents] = useState<SavedStudent[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (session === undefined) return; // storage not checked yet (see the useEffect above)
    if (!session) {
      router.replace("/login");
      return;
    }
    let cancelled = false;

    function isUnauthorized(result: ApiResult<unknown>): boolean {
      return !result.ok && result.status === 401;
    }

    // Fetches both dashboard lists with the given access token. If either comes back
    // unauthorized (the 30-minute access token expired — see lib/auth.ts StoredSession), this
    // refreshes it once via the refresh token and retries, instead of silently rendering an
    // empty dashboard as if the account genuinely had no bookings/saved students. Only when the
    // refresh token itself is invalid/expired does this fall back to a real re-login prompt.
    async function load(accessToken: string, refreshToken: string, alreadyRetried: boolean) {
      const [registrationsResult, studentsResult] = await Promise.all([
        getMyRegistrations(accessToken),
        getMyStudents(accessToken),
      ]);
      if (cancelled) return;

      if (!alreadyRetried && (isUnauthorized(registrationsResult) || isUnauthorized(studentsResult))) {
        const refreshed = await refreshAccessToken(refreshToken);
        if (cancelled) return;
        if (refreshed.ok) {
          updateTokens("booking", session!, refreshed.data);
          // Also push the refreshed token into React state, not just
          // localStorage — TestimonialManager below reads `session.accessToken`
          // directly for its own, later, independent requests (create/edit/
          // delete a review), so it needs the current token, not whatever
          // was in state when the page first loaded.
          setSession((current) => (current ? { ...current, accessToken: refreshed.data.access, refreshToken: refreshed.data.refresh } : current));
          return load(refreshed.data.access, refreshed.data.refresh, true);
        }
        // Refresh token is also invalid/expired — genuinely logged out, not "no bookings".
        clearSession("booking");
        setSessionExpired(true);
        setLoading(false);
        return;
      }

      if (registrationsResult.ok) setRegistrations(registrationsResult.data);
      if (studentsResult.ok) setSavedStudents(studentsResult.data);
      setLoading(false);
    }

    load(session.accessToken, session.refreshToken, false);
    listPublishedEvents().then((publishedEvents) => {
      if (!cancelled) setEvents(publishedEvents);
    });

    return () => {
      cancelled = true;
    };
  }, [session, router]);

  function handleLogout() {
    clearSession("booking");
    router.replace("/login");
  }

  // Covers two different moments, both of which used to render nothing at
  // all — a real blank white page, not a hypothetical one, since checking
  // `localStorage` for a session happens in an effect (see the comment
  // above `useState<StoredSession | ...>`), so it can never be known on the
  // very first render:
  //  1. `session === undefined` — storage hasn't been checked yet. Brief,
  //     but real, on every single visit.
  //  2. `session === null` — checked, there isn't one, and the redirect
  //     effect is about to fire (it can't happen synchronously in render).
  // Deliberately generic copy in both cases, rather than the authenticated
  // shell below — this must never say "Welcome back" before it's confirmed
  // there's actually a session to welcome back.
  if (!session) {
    return (
      <AccountShell eyebrow="Booking account" title="Loading your account…" maxWidth="max-w-4xl">
        <ListSkeleton rows={2} label="Loading your account" />
      </AccountShell>
    );
  }

  if (sessionExpired) {
    return (
      <AccountShell eyebrow="Booking account" title="Your session has expired" maxWidth="max-w-4xl">
        <p className="text-sm text-muted">
          Please log in again to see your bookings and saved students.
        </p>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="w-fit rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-secondary/30 transition hover:scale-[1.02]"
        >
          Log in again
        </button>
      </AccountShell>
    );
  }

  // One review per (account, event) — a distinct list of events this
  // account has ever registered for, deduped by id in case of multiple
  // bookings for the same event, for the "Your reviews" section below.
  const reviewableEvents = Array.from(
    new Map(registrations.map((registration) => [registration.event_detail.id, registration.event_detail])).values(),
  );

  return (
    <AccountShell
      eyebrow="Booking account"
      title={`Welcome back, ${session.user.full_name || session.user.email}`}
      maxWidth="max-w-4xl"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Signed in as <span className="font-semibold text-primary">{session.user.email}</span>
        </p>
        <Button type="button" variant="tertiary" size="sm" onClick={handleLogout} className="text-xs">
          Log out
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <section className="glass-panel flex flex-col gap-5 rounded-3xl p-8">
          <h2 className="font-display text-lg font-bold text-primary">Your bookings</h2>

          {loading ? (
            <ListSkeleton rows={2} label="Loading your bookings" />
          ) : registrations.length === 0 ? (
            <EmptyState
              icon={<TicketStubIcon />}
              title="No bookings yet"
              description="Tickets you book will appear here, with their reference and status."
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {registrations.map((registration) => (
                <li key={registration.id} className="card card-interactive rounded-3xl p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-left">
                      {/* Left Image */}
                      <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center">
                        {registration.event_detail.banner_url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- event banners are R2 URLs on arbitrary hosts.
                          <img
                            src={registration.event_detail.banner_url}
                            alt={registration.event_detail.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/10 font-boldonse text-xl text-primary uppercase">
                            {registration.event_detail.title.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      {/* Title and Subtitle */}
                      <div>
                        <h3 className="font-display text-base sm:text-lg font-bold text-primary leading-tight">
                          {registration.event_detail.title}
                        </h3>
                        {registration.event_detail.venue_name && (
                          <p className="mt-1 text-xs text-muted sm:text-sm">
                            {registration.event_detail.venue_name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(registration.status)}`}
                    >
                      {STATUS_LABELS[registration.status] ?? registration.status}
                    </span>
                  </div>

                  {/* Horizontal Line Divider */}
                  <div className="my-5 border-t border-gray-100" />

                  {/* Bottom Details Section */}
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    {/* Time and Date */}
                    <div className="text-left">
                      {/* Only what the backend actually returned. These used to
                          fall back to a fixed "08:00 AM - 04:00 PM" on
                          "Friday, October 25th 2024", which showed every user
                          invented times and dates on their own booking. */}
                      {formatTime(registration.event_detail.start_date) &&
                        formatTime(registration.event_detail.end_date) && (
                          <p className="text-xs font-semibold text-primary sm:text-sm">
                            {formatTime(registration.event_detail.start_date)} &ndash;{" "}
                            {formatTime(registration.event_detail.end_date)}
                          </p>
                        )}
                      <p className="mt-1 text-xs text-muted">
                        {formatDate(registration.event_detail.start_date, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }) ?? "Dates to be announced"}
                      </p>
                    </div>

                    {/* Total Payment Info */}
                    <div className="text-right">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Payment</dt>
                      <dd className="mt-1 font-display text-lg sm:text-xl font-bold text-sky-500">
                        {formatBookingCurrency(registration.total_amount, registration.currency)}
                      </dd>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-8">
          {savedStudents.length > 0 && (
            <section className="glass-panel flex flex-col gap-4 rounded-3xl p-8">
              <h2 className="font-display text-lg font-bold text-primary">Saved students</h2>
              <ul className="flex flex-col gap-2">
                {savedStudents.map((student) => (
                  <li key={student.student_display_id} className="text-sm text-muted">
                    <span className="font-semibold text-primary">{student.name}</span>
                    {student.school ? ` — ${student.school}` : ""}
                    {student.grade ? ` (Grade ${student.grade})` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <UpcomingEvents events={events} />
        </div>
      </div>

      {/* Full width rather than squeezed into the sidebar column above — a
          rating picker plus a review textarea needs more breathing room
          than a short list does. One card per distinct event the account
          has ever registered for; each manages its own review state (see
          TestimonialManager) since a review is scoped to one (account,
          event) pair, independent of the others. */}
      {reviewableEvents.length > 0 && (
        <section className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-lg font-bold text-primary">Your reviews</h2>
            <p className="mt-1 text-sm text-muted">
              Share feedback on the events you&rsquo;ve registered for.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {reviewableEvents.map((event) => (
              <TestimonialManager key={event.id} event={event} accessToken={session.accessToken} />
            ))}
          </div>
        </section>
      )}
    </AccountShell>
  );
}
