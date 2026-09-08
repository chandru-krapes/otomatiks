"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthTokens, AuthUser, BookingCreatePayload, Event, SavedStudent } from "@/lib/types";
import { createBooking, getMyStudents } from "@/lib/api";
import { attendeeToPayload, type PrimaryContact, type Relationship } from "@/lib/booking";
import { rememberLastBooking } from "@/lib/lastBooking";
import { saveSession } from "@/lib/auth";
import { useCart } from "./CartProvider";
import CartSummaryPanel from "./CartSummaryPanel";
import CheckoutForm from "./CheckoutForm";
import MobileOrderSheet from "./MobileOrderSheet";
import OtherTicketsSection from "./OtherTicketsSection";
import type { AppliedPromo } from "./PromoCodeField";
import Button from "@/components/ui/Button";
import EmptyState, { TicketStubIcon } from "@/components/ui/EmptyState";

// Frames a backend error for the event website
function frameSubmitError(message: string, code: string | undefined): string {
  if (code === "registration_unavailable" || code === "ticket_not_found") {
    return `Availability changed while you were booking: ${message}`;
  }
  if (code === "team_size_invalid") {
    return `Team size problem: ${message}`;
  }
  return message;
}

// Checkout for the event website
export default function CheckoutPage({ event }: { event: Event }) {
  const router = useRouter();
  const { lines, clear } = useCart();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [auth, setAuth] = useState<(AuthTokens & { user: AuthUser }) | null>(null);
  const [relationship, setRelationship] = useState<Relationship>("parent");
  const [primary, setPrimary] = useState<PrimaryContact>({ name: "", email: "", phone: "" });
  const [savedStudents, setSavedStudents] = useState<SavedStudent[]>([]);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleVerified(result: AuthTokens & { user: AuthUser }) {
    setAuth(result);
    setPrimary((current) => ({
      name: current.name || result.user.full_name,
      email: result.user.is_phone_verified ? current.email : result.user.email,
      phone: current.phone || result.user.phone || "",
    }));
    saveSession("booking", { accessToken: result.access, refreshToken: result.refresh, user: result.user });
    setStep(2);

    const studentsResult = await getMyStudents(result.access);
    if (studentsResult.ok) setSavedStudents(studentsResult.data);
  }

  function handleContinueToAttendees() {
    if (!primary.name.trim() || !primary.phone.trim() || !primary.email.trim()) {
      setDetailsError("Please fill in your name, email, and phone number.");
      return;
    }
    setDetailsError(null);
    setStep(3);
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!auth) return;
    setSubmitError(null);
    setSubmitting(true);

    const payload: BookingCreatePayload = {
      relationship,
      primary_account: primary,
      competitions: lines.map((line) => ({
        ticket_id: line.ticket.id,
        attendees: line.attendees.map((attendee) => attendeeToPayload(attendee, relationship)),
      })),
      ...(promo ? { promo_code: promo.code } : {}),
    };

    const result = await createBooking(event.id, payload, auth.access);
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(frameSubmitError(result.message, result.code));
      return;
    }

    rememberLastBooking(result.data);
    clear();
    router.push(`/bookings/${result.data.booking_reference}`);
  }

  if (lines.length === 0) {
    return (
      <div className="route-transition mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <EmptyState
          icon={<TicketStubIcon />}
          title="No tickets selected yet"
          description="Add a ticket from the event page to start a booking."
        />
        <Button href="/#tickets" variant="primary">
          Browse tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden sm:block" aria-hidden="true">
        <div className="animate-blob-1 absolute -left-16 top-[8%] h-64 w-64 bg-accent/10 blur-xl" style={{ willChange: "transform", contain: "strict" }} />
        <div className="animate-blob-3 absolute left-[10%] top-[60%] h-72 w-72 bg-primary/8 blur-xl" style={{ willChange: "transform", contain: "strict" }} />
      </div>

      <div className="relative z-10">
        <CartSummaryPanel
          step={step}
          eventId={event.id}
          promo={promo}
          onApplyPromo={setPromo}
          onRemovePromo={() => setPromo(null)}
          submitting={submitting}
        />
        <MobileOrderSheet
          step={step}
          eventId={event.id}
          promo={promo}
          onApplyPromo={setPromo}
          onRemovePromo={() => setPromo(null)}
          submitting={submitting}
        />

        <div className="route-transition mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <div className="flex flex-col gap-8 sm:mr-[24rem]">
            <div>
              <Link
                href="/#tickets"
                className="focus-ring group inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-secondary transition-colors hover:text-primary"
              >
                <span aria-hidden="true" className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:-translate-x-1">
                  &larr;
                </span>
                Back to {event.title}
              </Link>
              <h1 className="mt-3 font-boldonse text-3xl font-extrabold uppercase leading-tight tracking-tight text-primary sm:text-4xl">
                Confirm Your Booking
              </h1>
              <p className="mt-2 text-sm text-muted">
                Verify with email or phone, add your details, then who&rsquo;s attending for each ticket — one step at a time.
              </p>
            </div>

            <CheckoutForm
              step={step}
              onStepChange={setStep}
              onVerified={handleVerified}
              relationship={relationship}
              onRelationshipChange={setRelationship}
              primary={primary}
              onPrimaryChange={setPrimary}
              verifiedUser={auth?.user ?? null}
              detailsError={detailsError}
              onContinueToAttendees={handleContinueToAttendees}
              savedStudents={savedStudents}
              onSubmit={handleSubmit}
              submitError={submitError}
            />

            {step === 3 && <OtherTicketsSection event={event} />}
            {step === 3 && <div className="h-20 sm:hidden" aria-hidden="true" />}
          </div>
        </div>
      </div>
    </div>
  );
}
