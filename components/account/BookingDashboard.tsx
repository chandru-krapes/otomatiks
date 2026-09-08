"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Event, RegistrationHistoryItem, SavedStudent } from "@/lib/types";
import { type ApiResult, getMyRegistrations, getMyStudents, listPublishedEvents, refreshAccessToken } from "@/lib/api";
import { clearSession, loadSession, updateTokens, type StoredSession } from "@/lib/auth";
import { formatDate, formatGender, formatTime } from "@/lib/format";
import AccountShell from "./AccountShell";
import BookingDetailDialog from "./BookingDetailDialog";
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

function ChevronIcon() {
  return (
    <svg className="arrow-slide h-4 w-4 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function RegistrationCard({ registration, onOpen }: { registration: RegistrationHistoryItem; onOpen: () => void }) {
  const content = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-1 items-center gap-4 text-left">
          <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center">
            {registration.event_detail.banner_url ? (
              <img
                src={registration.event_detail.banner_url}
                alt={registration.event_detail.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 font-boldonse text-xl text-primary uppercase">
                {registration.event_detail.title.slice(0, 2)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base sm:text-lg font-bold text-primary leading-tight">
              {registration.event_detail.title}
            </h3>
            {registration.event_detail.venue_name && (
              <p className="mt-1 truncate text-xs text-muted sm:text-sm">
                {registration.event_detail.venue_name}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(registration.status)}`}>
            {STATUS_LABELS[registration.status] ?? registration.status}
          </span>
          <ChevronIcon />
        </div>
      </div>

      <div className="my-5 border-t border-gray-100" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="text-left">
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

        <div className="text-right">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Payment</dt>
          <dd className="mt-1 font-display text-lg sm:text-xl font-bold text-sky-500">
            {formatBookingCurrency(registration.total_amount, registration.currency)}
          </dd>
        </div>
      </div>
    </>
  );

  return (
    <button type="button" onClick={onOpen} className="card card-interactive focus-ring group block w-full rounded-3xl p-6 text-left">
      {content}
    </button>
  );
}

export default function BookingDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null | undefined>(undefined);
  useEffect(() => {
    // Reads localStorage once on mount — this can't happen in useState's initializer since that
    // would also run during server rendering, where localStorage doesn't exist and would
    // desync the client's first hydration render from the server's.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(loadSession("booking"));
  }, []);
  const [registrations, setRegistrations] = useState<RegistrationHistoryItem[]>([]);
  const [savedStudents, setSavedStudents] = useState<SavedStudent[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [openRegistration, setOpenRegistration] = useState<RegistrationHistoryItem | null>(null);

  useEffect(() => {
    if (session === undefined) return;
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


  const reviewableEvents = Array.from(
    new Map(registrations.map((registration) => [registration.event_detail.id, registration.event_detail])).values(),
  );

  return (
    <AccountShell
      eyebrow="Booking account"
      title={`Welcome back, ${session.user.full_name || session.user.email}`}
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 pb-6">
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
                <li key={registration.id}>
                  <RegistrationCard registration={registration} onOpen={() => setOpenRegistration(registration)} />
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
                    {formatGender(student.gender) ? ` · ${formatGender(student.gender)}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <UpcomingEvents events={events} />
        </div>
      </div>

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

      {openRegistration && (
        <BookingDetailDialog registration={openRegistration} onClose={() => setOpenRegistration(null)} />
      )}
    </AccountShell>
  );
}
