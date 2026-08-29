"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthTokens, AuthUser, BookingCreatePayload, Event, SavedStudent } from "@/lib/types";
import { createBooking, getMyStudents, loginAccount, registerAccount } from "@/lib/api";
import { attendeeToPayload, type AccountMode, type Attendee, type PrimaryContact, type Relationship } from "@/lib/booking";
import { rememberLastBooking } from "@/lib/lastBooking";
import { saveSession } from "@/lib/auth";
import { useCart } from "./CartProvider";
import CartSummaryPanel from "./CartSummaryPanel";
import CheckoutForm from "./CheckoutForm";
import Button from "@/components/ui/Button";
import EmptyState, { TicketStubIcon } from "@/components/ui/EmptyState";

/**
 * flow.pdf "Parent registers": booking starts with account
 * registration/login, then the booking itself. Returns the full auth
 * payload (not just the access token) whenever one was actually obtained —
 * `/bookings/[reference]` needs a persisted session to offer "Pay Now"
 * (`POST /api/v1/payments/zohopay/create-order/` requires an authenticated
 * owner, unlike booking creation itself, which is guest-accessible), so a
 * successful checkout that did authenticate should leave the buyer signed
 * in on this browser afterward, not just holding a one-shot in-memory token.
 *
 * One deliberate exception: a *freshly registered* training-institute
 * account can't log in yet (email verification is mandatory) even though
 * registration itself succeeded. Rather than blocking the whole booking on
 * a verify-email step this UI doesn't have, that specific case falls
 * through to a guest booking with a note explaining why — and, since there's
 * no session in that case, the confirmation page will ask them to log in
 * before paying.
 */
async function authenticate(
  mode: AccountMode,
  relationship: Relationship,
  primary: PrimaryContact,
  password: string,
): Promise<{ auth?: AuthTokens & { user: AuthUser }; note?: string; error?: string }> {
  if (mode === "login") {
    const result = await loginAccount({ email: primary.email, password });
    if (!result.ok) return { error: result.message };
    return { auth: result.data };
  }

  const registerResult = await registerAccount({
    email: primary.email, password, full_name: primary.name, phone: primary.phone, role: relationship,
  });
  if (!registerResult.ok) return { error: registerResult.message };

  const loginResult = await loginAccount({ email: primary.email, password });
  if (!loginResult.ok) {
    if (loginResult.code === "email_not_verified") {
      return {
        note:
          "Account created — check your email to verify it before logging in next time. " +
          "Continuing this booking as a guest for now.",
      };
    }
    return { error: loginResult.message };
  }
  return { auth: loginResult.data };
}

/**
 * flow.pdf "The second event": pre-fill an attendee card from a saved
 * student instead of retyping. Only overwrites fields the saved record
 * actually has a value for.
 */
function applySavedStudent(attendee: Attendee, saved: SavedStudent): Attendee {
  return {
    ...attendee,
    name: saved.name || attendee.name,
    grade: saved.grade || attendee.grade,
    dob: saved.date_of_birth || attendee.dob,
    email: saved.email || attendee.email,
    phone: saved.phone || attendee.phone,
    school: saved.school || attendee.school,
  };
}

/**
 * Frames a backend error so an availability problem (sold out, sales not
 * open, team size out of range, a ticket no longer belonging to this event)
 * doesn't read like a form-validation mistake the buyer made — see the
 * backend→frontend handoff doc's "Error responses to handle" section.
 */
function frameSubmitError(message: string, code: string | undefined): string {
  if (code === "registration_unavailable" || code === "ticket_not_found") {
    return `Availability changed while you were checking out: ${message}`;
  }
  if (code === "team_size_invalid") {
    return `Team size problem: ${message}`;
  }
  return message;
}

export default function CheckoutPage({ event }: { event: Event }) {
  const router = useRouter();
  const { lines, clear, updateAttendee } = useCart();

  const [mode, setMode] = useState<AccountMode>("create");
  const [relationship, setRelationship] = useState<Relationship>("parent");
  const [primary, setPrimary] = useState<PrimaryContact>({ name: "", email: "", phone: "" });
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNote, setAuthNote] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Full auth payload, not just the access token — needed to persist a real
  // session on successful checkout (see `authenticate`'s doc comment above).
  const [auth, setAuth] = useState<(AuthTokens & { user: AuthUser }) | null>(null);
  const [savedStudents, setSavedStudents] = useState<SavedStudent[]>([]);
  const [loggingIn, setLoggingIn] = useState(false);

  function handleModeChange(next: AccountMode) {
    setMode(next);
    setAuth(null);
    setSavedStudents([]);
    setAuthError(null);
    setAuthNote(null);
  }

  function fillAttendeeFromSavedStudent(lineId: string, attendeeIndex: number, saved: SavedStudent) {
    const line = lines.find((candidate) => candidate.id === lineId);
    const attendee = line?.attendees[attendeeIndex];
    if (!attendee) return;
    updateAttendee(lineId, attendeeIndex, applySavedStudent(attendee, saved));
  }

  async function handleLogin() {
    setAuthError(null);
    setAuthNote(null);
    setLoggingIn(true);

    const result = await loginAccount({ email: primary.email, password });
    if (!result.ok) {
      setAuthError(result.message);
      setLoggingIn(false);
      return;
    }
    setAuth(result.data);
    // An explicit "Log in" is a real login — persist it, same as the
    // standalone booking-login page does, not just an in-memory token for
    // this one submit.
    saveSession("booking", { accessToken: result.data.access, refreshToken: result.data.refresh, user: result.data.user });
    setPrimary((current) => ({
      ...current,
      name: current.name || result.data.user.full_name,
      phone: current.phone || result.data.user.phone || "",
    }));

    const studentsResult = await getMyStudents(result.data.access);
    if (studentsResult.ok) setSavedStudents(studentsResult.data);
    setLoggingIn(false);
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setAuthError(null);
    setSubmitError(null);
    setSubmitting(true);

    let resolvedAuth = auth;
    if (!resolvedAuth) {
      const authResult = await authenticate(mode, relationship, primary, password);
      if (authResult.error) {
        setAuthError(authResult.error);
        setSubmitting(false);
        return;
      }
      if (authResult.note) setAuthNote(authResult.note);
      if (authResult.auth) {
        resolvedAuth = authResult.auth;
        // Persist so /bookings/[reference] can offer "Pay Now" — payment
        // requires an authenticated owner (see `authenticate`'s doc comment).
        saveSession("booking", {
          accessToken: authResult.auth.access,
          refreshToken: authResult.auth.refresh,
          user: authResult.auth.user,
        });
      }
    }

    // One POST for the whole cart — every line's attendees under
    // `competitions`, quantity/pricing all computed server-side.
    const payload: BookingCreatePayload = {
      relationship,
      primary_account: primary,
      competitions: lines.map((line) => ({
        ticket_id: line.ticket.id,
        attendees: line.attendees.map((attendee) => attendeeToPayload(attendee, relationship)),
      })),
    };

    const result = await createBooking(event.id, payload, resolvedAuth?.access);
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(frameSubmitError(result.message, result.code));
      return;
    }

    // The confirmation page is built from this same response (see
    // app/bookings/[reference]/page.tsx) — stashed so the immediate
    // post-checkout view never has to re-fetch (and, for a guest with no
    // account, *can't* — GET /bookings/{reference}/ requires auth).
    rememberLastBooking(result.data);
    clear();
    router.push(`/bookings/${result.data.booking_reference}`);
  }

  if (lines.length === 0) {
    return (
      <div className="route-transition mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <EmptyState
          icon={<TicketStubIcon />}
          title="Your cart is empty"
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
      {/* Hidden below `sm`: purely ambient, and a continuously-animated
          blurred layer is a real, permanent GPU/battery cost on the device
          least able to spare it — checkout is exactly the flow that
          shouldn't feel sluggish on a mid-range phone. */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden sm:block" aria-hidden="true">
        <div className="animate-blob-1 absolute -left-16 top-[8%] h-64 w-64 bg-accent/10 blur-xl" style={{ willChange: "transform", contain: "strict" }} />
        <div className="animate-blob-3 absolute left-[10%] top-[60%] h-72 w-72 bg-primary/8 blur-xl" style={{ willChange: "transform", contain: "strict" }} />
      </div>

      <div className="relative z-10">
        <div className="route-transition mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10">
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
              Checkout
            </h1>
            <p className="mt-2 text-sm text-muted">
              Set up your account, add who&rsquo;s attending for each ticket, and you&rsquo;re done — one booking for
              everything in your cart.
            </p>
          </div>

          {/* Summary first in the DOM but second visually on desktop — a
              phone should see what it's paying for before a long form. */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
            <CartSummaryPanel className="lg:order-2" />
            <CheckoutForm
              className="lg:order-1"
              mode={mode}
              onModeChange={handleModeChange}
              relationship={relationship}
              onRelationshipChange={setRelationship}
              primary={primary}
              onPrimaryChange={setPrimary}
              password={password}
              onPasswordChange={setPassword}
              authError={authError}
              authNote={authNote}
              isLoggedIn={auth != null}
              loggingIn={loggingIn}
              onLoginNow={handleLogin}
              savedStudents={savedStudents}
              onFillFromSavedStudent={fillAttendeeFromSavedStudent}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitError={submitError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
