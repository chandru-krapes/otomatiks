"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { RegistrationHistoryItem } from "@/lib/types";
import { RELATIONSHIP_OPTIONS } from "@/lib/booking";
import { formatDate, formatGender } from "@/lib/format";
import Badge, { type BadgeTone } from "@/components/ui/Badge";

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Finished",
  pending_payment: "Payment pending",
  cancelled: "Cancelled",
};

const STATUS_TONES: Record<string, BadgeTone> = {
  confirmed: "success",
  pending_payment: "warning",
  cancelled: "danger",
};

function relationshipLabel(value: string): string {
  return RELATIONSHIP_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function formatMoney(amountStr: string | null | undefined, currencyCode: string): string {
  if (!amountStr) return "Free";
  const value = Number(amountStr);
  if (Number.isNaN(value)) return amountStr;
  if (value === 0) return "Free";
  try {
    return new Intl.NumberFormat(currencyCode === "IDR" ? "id-ID" : "en-IN", {
      style: "currency",
      currency: currencyCode || "INR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currencyCode} ${value}`;
  }
}

export default function BookingDetailDialog({
  registration,
  onClose,
}: {
  registration: RegistrationHistoryItem;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // One group per ticket type/competition, in the order attendees were
  // returned — mirrors how CartLineAttendees groups them at checkout, so a
  // "team" booking's members read as one block rather than an undifferentiated
  // flat list once there's more than one ticket type on the same booking.
  const groups = new Map<string, typeof registration.attendees>();
  for (const attendee of registration.attendees) {
    const key = attendee.competition ?? "Attendee";
    const existing = groups.get(key);
    if (existing) existing.push(attendee);
    else groups.set(key, [attendee]);
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${registration.event_detail.title} booking details`}
      className="fixed inset-0 z-[60] overflow-y-auto bg-primary/40 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
        <div className="card animate-pop-in relative w-full max-w-lg overflow-hidden rounded-3xl">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring press absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-muted backdrop-blur-sm transition-colors hover:bg-white hover:text-primary"
          >
            <CloseIcon />
          </button>

          <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
                <div>
                  <h3 className="font-display text-xl font-bold leading-snug text-primary">
                    {registration.event_detail.title}
                  </h3>
                  {registration.event_detail.venue_name && (
                    <p className="mt-1 text-sm text-muted">{registration.event_detail.venue_name}</p>
                  )}
                </div>
                <Badge tone={STATUS_TONES[registration.status] ?? "neutral"}>
                  {STATUS_LABELS[registration.status] ?? registration.status}
                </Badge>
              </div>

              <div className="rounded-2xl border border-dashed border-primary/25 bg-white/70 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Booking reference</p>
                <p className="mt-1.5 font-mono text-lg font-extrabold tracking-[0.1em] text-primary">
                  {registration.booking_reference ?? "Not available for this booking"}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Booked as</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{relationshipLabel(registration.relationship)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Booked on</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{formatDate(registration.created_at) ?? "—"}</dd>
                </div>
                {registration.is_onsite && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Check-in</dt>
                    <dd className="mt-0.5 font-semibold text-foreground">Checked in onsite</dd>
                  </div>
                )}
                {registration.promo_code && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Promo code</dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 font-mono font-bold text-emerald-700">
                      {registration.promo_code}
                      {registration.discount_amount && (
                        <span className="font-sans text-xs font-semibold text-emerald-600">
                          (-{formatMoney(registration.discount_amount, registration.currency)})
                        </span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>

              {registration.cancelled_at && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <p className="font-semibold">Cancelled {formatDate(registration.cancelled_at)}</p>
                  {registration.cancellation_reason && <p className="mt-0.5">{registration.cancellation_reason}</p>}
                </div>
              )}

              {registration.attendees.length > 0 && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                    Attendees ({registration.attendees.length})
                  </p>
                  {Array.from(groups.entries()).map(([competition, attendees]) => (
                    <div key={competition} className="flex flex-col gap-2">
                      {competition !== "Attendee" && (
                        <p className="text-xs font-semibold text-muted">{competition}</p>
                      )}
                      <div className="flex flex-col gap-2">
                        {attendees.map((attendee) => (
                          <div key={attendee.id} className="rounded-xl border border-primary/10 bg-white/60 px-4 py-3">
                            <p className="font-semibold text-foreground">{attendee.name}</p>
                            <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted">
                              {attendee.grade && <span>Grade {attendee.grade}</span>}
                              {formatGender(attendee.gender) && <span>&middot; {formatGender(attendee.gender)}</span>}
                              {attendee.school && <span>&middot; {attendee.school}</span>}
                              {attendee.email && <span>&middot; {attendee.email}</span>}
                              {attendee.phone && <span>&middot; {attendee.phone}</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-hairline pt-5">
                <span className="text-sm font-semibold uppercase tracking-[0.1em] text-muted">
                  Total &middot; {registration.currency}
                </span>
                <span className="font-display text-2xl font-extrabold text-primary">
                  {formatMoney(registration.total_amount, registration.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
