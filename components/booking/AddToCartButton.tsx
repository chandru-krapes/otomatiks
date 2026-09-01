"use client";

import { useCart } from "./CartProvider";
import Button, { type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { TicketIcon } from "@/components/event/TicketButton";
import type { TicketType } from "@/lib/types";

/**
 * The purchase action everywhere a ticket type is shown (ticket cards,
 * the event-categories explorer) — adds one attendee slot to the cart
 * instead of navigating to a per-ticket booking page. Every ticket type on
 * this event's page shares one cart (see CartProvider), so adding a second
 * ticket type here doesn't reset or replace the first.
 *
 * Quantity-aware: once a ticket is already in the booking, this swaps
 * itself for an in-place stepper (individual tickets) or an "Add Another
 * Team" button with a running count (team tickets) — richer feedback than
 * a plain button flashing "Added" and reverting, and it means adding a
 * second/third ticket no longer has to reopen the cart drawer to be seen.
 */
export default function AddToCartButton({
  ticket,
  label,
  variant = "primary",
  size = "md",
  className = "",
}: {
  ticket: TicketType;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const { lines, addTicket, addAttendeeToLine, removeAttendeeFromLine } = useCart();
  const isTeam = ticket.kind === "team";

  const addIcon = (
    <TicketIcon className="h-4 w-4 transition-transform duration-[var(--dur-fast)] group-hover:-rotate-12" />
  );

  if (isTeam) {
    // Every click starts a fresh team line (see CartProvider.addTicket), so
    // there's no single "quantity" to step — just a running count of teams.
    const teamCount = lines.filter((line) => line.ticket.id === ticket.id).length;
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <Button type="button" variant={variant} size={size} onClick={() => addTicket(ticket)} icon={addIcon}>
          {teamCount > 0 ? "Add Another Team" : (label ?? "Add Team")}
        </Button>
        {teamCount > 0 && (
          <Badge tone="success" className="animate-pop-in" key={teamCount}>
            {teamCount} {teamCount === 1 ? "team" : "teams"} added
          </Badge>
        )}
      </div>
    );
  }

  const line = lines.find((current) => current.ticket.id === ticket.id);

  if (!line) {
    return (
      <Button type="button" variant={variant} size={size} className={className} onClick={() => addTicket(ticket)} icon={addIcon}>
        {label ?? "Add Ticket"}
      </Button>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full border border-primary/15 bg-white/70 px-3 py-1.5 shadow-[var(--elev-1)] ${className}`}
    >
      <button
        type="button"
        onClick={() => removeAttendeeFromLine(line.id, line.attendees.length - 1)}
        aria-label={`Remove one ${ticket.name}`}
        className="focus-ring press flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/15 text-primary transition-colors hover:border-primary/35"
      >
        <MinusIcon />
      </button>
      <span key={line.attendees.length} className="animate-pop-in flex items-center gap-1.5 text-sm font-bold text-primary">
        <CheckIcon />
        {line.attendees.length} in your booking
      </span>
      <button
        type="button"
        onClick={() => addAttendeeToLine(line.id)}
        aria-label={`Add another ${ticket.name}`}
        className="focus-ring press flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/15 text-primary transition-colors hover:border-primary/35"
      >
        <PlusIcon />
      </button>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 text-secondary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
