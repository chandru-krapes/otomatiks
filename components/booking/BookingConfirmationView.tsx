"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AttendeeHistoryItem, BookingResponse, Event } from "@/lib/types";
import { formatCurrency } from "@/lib/pricing";
import { createPaymentOrder, simulateZohoPayMock } from "@/lib/api";
import { extractRegistrationId, RELATIONSHIP_OPTIONS } from "@/lib/booking";
import { formatDate, formatGender } from "@/lib/format";
import { trackFunnelStep } from "@/lib/funnel";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button, { Spinner } from "@/components/ui/Button";

function relationshipLabel(value: string): string {
  return RELATIONSHIP_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function groupByCompetition(attendees: AttendeeHistoryItem[]): [string, AttendeeHistoryItem[]][] {
  const groups = new Map<string, AttendeeHistoryItem[]>();
  for (const attendee of attendees) {
    const key = attendee.competition ?? "Attendee";
    const existing = groups.get(key);
    if (existing) existing.push(attendee);
    else groups.set(key, [attendee]);
  }
  return Array.from(groups.entries());
}

function AttendeeRow({ attendee }: { attendee: AttendeeHistoryItem }) {
  const gender = formatGender(attendee.gender);
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-white/70 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
        {initials(attendee.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-bold text-primary">{attendee.name}</p>
        <p className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted">
          {attendee.grade && <span>Grade {attendee.grade}</span>}
          {gender && <span>&middot; {gender}</span>}
          {attendee.school && <span>&middot; {attendee.school}</span>}
        </p>
        {(attendee.email || attendee.phone) && (
          <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted/80">
            {attendee.email && <span>{attendee.email}</span>}
            {attendee.phone && <span>{attendee.phone}</span>}
          </p>
        )}
      </div>
    </div>
  );
}


export default function BookingConfirmationView({
  event,
  booking,
  accountNote,
  accessToken,
}: {
  event: Event;
  booking: BookingResponse;
  accountNote?: string | null;
  accessToken?: string | null;
}) {
  const router = useRouter();
  const needsPayment = booking.status === "pending_payment";
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState<"succeeded" | "failed" | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySession, setPaySession] = useState<{ sessionId: string; amount: string; currency: string } | null>(null);

  const registrationId = extractRegistrationId(booking.booking_reference);
  const attendeeGroups = groupByCompetition(booking.attendees);

  async function handlePayNow() {
    if (!accessToken || registrationId == null) return;
    trackFunnelStep(event.id, "entered_payment");
    setPayError(null);
    setPaying(true);

    const result = await createPaymentOrder(registrationId, accessToken);
    setPaying(false);

    if (!result.ok) {
      setPayError(result.message);
      return;
    }
    setPaySession({ sessionId: result.data.payments_session_id, amount: result.data.amount, currency: result.data.currency });
  }

  const startedRef = useRef(false);
  useEffect(() => {
    if (!needsPayment || !accessToken || registrationId == null) return;
    if (startedRef.current) return;
    startedRef.current = true;
    handlePayNow();
  }, [needsPayment, accessToken, registrationId]);

  async function handleConfirmPayment(outcome: "succeeded" | "failed") {
    if (!paySession) return;
    setPayError(null);
    setConfirming(outcome);

    const result = await simulateZohoPayMock({ payments_session_id: paySession.sessionId, outcome });
    setConfirming(null);

    if (!result.ok) {
      setPayError(
        result.status === 404
          ? "Mock payments aren't enabled in this environment — there's no live Zoho Pay checkout wired up yet either."
          : result.message,
      );
      return;
    }

    trackFunnelStep(event.id, outcome === "succeeded" ? "paid" : "payment_failed");
    router.push(`/payment/${outcome === "succeeded" ? "success" : "failure"}?reference=${booking.booking_reference}`);
  }

  return (
    <div className="route-transition relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden sm:block" aria-hidden="true">
        <div className="animate-blob-1 absolute -left-16 top-[10%] h-72 w-72 bg-accent/10 blur-xl" style={{ willChange: "transform", contain: "strict" }} />
        <div className="animate-blob-3 absolute right-[8%] top-[55%] h-80 w-80 bg-secondary/10 blur-xl" style={{ willChange: "transform", contain: "strict" }} />
        <div className="animate-blob-2 absolute left-[15%] top-[80%] h-64 w-64 bg-primary/8 blur-xl" style={{ willChange: "transform", contain: "strict" }} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 py-10 sm:px-6">
        <div className="relative w-full overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_70px_-20px_rgba(6,106,171,0.35)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary px-6 py-8 text-white sm:px-10 sm:py-10">
            {event.banner_url && (
              <img src={event.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            )}
            <div className="tech-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-4 top-0 hidden h-full w-16 opacity-20 sm:block"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, white 0, white 2px, transparent 2px, transparent 5px, white 5px, white 6px, transparent 6px, transparent 10px)",
              }}
            />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">E-Ticket</p>
                <h1 className="mt-2 font-boldonse text-2xl font-extrabold uppercase leading-tight sm:text-4xl">
                  {event.title}
                </h1>
                {(event.venue_name || event.start_date) && (
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-white/80">
                    {formatDate(event.start_date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    {event.venue_name && event.start_date && <span aria-hidden="true">&middot;</span>}
                    {event.venue_name}
                  </p>
                )}
              </div>
              <Badge tone="onDark" className="shrink-0">
                {needsPayment ? <ClockIcon /> : <CheckIcon />}
                {needsPayment ? "Reserved" : "Confirmed"}
              </Badge>
            </div>
          </div>
          <div className="ticket-notch h-4" aria-hidden="true" />

          <div className="flex flex-col gap-8 p-6 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Booking reference</p>
                <p className="mt-1.5 font-mono text-2xl font-extrabold tracking-[0.1em] text-primary sm:text-3xl">
                  {booking.booking_reference}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{needsPayment ? "Total due" : "Total paid"}</p>
                <p className="mt-1.5 font-display text-2xl font-extrabold text-primary sm:text-3xl">
                  {formatCurrency(Number(booking.total_amount) || 0)}
                </p>
              </div>
            </div>

            {/* Purchaser + booking facts */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl border border-primary/10 bg-primary/[0.03] p-5 text-sm sm:grid-cols-4">
              {booking.primary_name && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Booked by</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{booking.primary_name}</dd>
                </div>
              )}
              {booking.relationship && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">As</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{relationshipLabel(booking.relationship)}</dd>
                </div>
              )}
              {booking.primary_email && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Email</dt>
                  <dd className="mt-0.5 truncate font-semibold text-foreground">{booking.primary_email}</dd>
                </div>
              )}
              {booking.primary_phone && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Phone</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{booking.primary_phone}</dd>
                </div>
              )}
              {booking.created_at && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Booked on</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{formatDate(booking.created_at)}</dd>
                </div>
              )}
            </dl>
            {attendeeGroups.length > 0 && (
              <div className="flex flex-col gap-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  Attendees ({booking.attendees.length})
                </p>
                <div className="flex flex-col gap-5">
                  {attendeeGroups.map(([competition, attendees]) => (
                    <div key={competition} className="flex flex-col gap-2.5">
                      {competition !== "Attendee" && <p className="text-xs font-semibold text-muted">{competition}</p>}
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {attendees.map((attendee) => (
                          <AttendeeRow key={attendee.id} attendee={attendee} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {needsPayment && (
              <div className="flex flex-col gap-3 border-t border-hairline pt-6">
                {!accessToken ? (
                  <Alert tone="warning" className="w-full text-left">
                    This booking is reserved but not yet paid. Log in to the account that made this booking to complete
                    payment — keep your reference handy either way.
                  </Alert>
                ) : paySession ? (
                  <>
                    <Alert tone="info" className="w-full text-left">
                      Payment session ready — {formatCurrency(Number(paySession.amount) || 0)}. In production this
                      hands off to Zoho Pay&rsquo;s own checkout; here it completes against the backend&rsquo;s mock
                      gateway.
                    </Alert>
                    <Button
                      type="button"
                      variant="primary"
                      loading={confirming === "succeeded"}
                      loadingLabel="Completing payment…"
                      disabled={confirming !== null}
                      onClick={() => handleConfirmPayment("succeeded")}
                      className="w-full"
                    >
                      Pay {formatCurrency(Number(paySession.amount) || 0)} Now
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleConfirmPayment("failed")}
                      disabled={confirming !== null}
                      className="focus-ring press self-center rounded-md text-xs font-semibold text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {confirming === "failed" ? "Simulating failure…" : "Simulate a failed payment (test)"}
                    </button>
                  </>
                ) : paying ? (
                  <div className="flex items-center justify-center gap-2.5 py-2 text-sm font-semibold text-muted">
                    <Spinner className="h-4 w-4 text-secondary" />
                    Preparing payment…
                  </div>
                ) : (
                  <>
                    <Alert tone="warning" className="w-full text-left">
                      This booking is reserved but not yet paid.
                    </Alert>
                    <Button
                      type="button"
                      variant="primary"
                      loading={paying}
                      loadingLabel="Starting payment…"
                      onClick={handlePayNow}
                      disabled={registrationId == null}
                      className="w-full"
                    >
                      Try again
                    </Button>
                  </>
                )}
                {payError && (
                  <Alert tone="error" emphasize>
                    {payError}
                  </Alert>
                )}
              </div>
            )}

            {accountNote && <Alert tone="info">{accountNote}</Alert>}

            <Link
              href="/"
              className="focus-ring group inline-flex items-center gap-1.5 self-center rounded-md text-sm font-semibold text-secondary transition-colors hover:text-primary"
            >
              <span aria-hidden="true" className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:-translate-x-1">
                &larr;
              </span>
              Back to {event.title}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
