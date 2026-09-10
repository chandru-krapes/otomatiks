"use client";

import { useCart } from "./CartProvider";
import Button, { type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { TicketIcon } from "@/components/event/TicketButton";
import type { TicketType } from "@/lib/types";

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
  const { lines, addTicket, addAttendeeToLine, removeAttendeeFromLine, open } = useCart();
  const isTeam = ticket.kind === "team";

  const addIcon = (
    <TicketIcon className="h-4 w-4 transition-transform duration-[var(--dur-fast)] group-hover:-rotate-12" />
  );

  if (isTeam) {
    const teamCount = lines.filter((line) => line.ticket.id === ticket.id).length;
    return (
      <div className={`flex flex-col items-start gap-1.5 ${className}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant={variant} size={size} onClick={() => addTicket(ticket)} icon={addIcon}>
            {teamCount > 0 ? "Add Another Ticket" : (label ?? "Add Ticket")}
          </Button>
          {teamCount > 0 && (
            <Badge tone="success" className="animate-pop-in" key={teamCount}>
              {teamCount} {teamCount === 1 ? "team" : "teams"} added
            </Badge>
          )}
        </div>
        {teamCount > 0 && <CheckoutNudge onClick={open} />}
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
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      <div className="inline-flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full border border-primary/15 bg-white/70 px-3 py-1.5 shadow-[var(--elev-1)]">
        <button
          type="button"
          onClick={() => removeAttendeeFromLine(line.id, line.attendees.length - 1)}
          aria-label={`Remove one ${ticket.name}`}
          className="focus-ring press flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/15 text-primary transition-colors hover:border-primary/35"
        >
          <MinusIcon />
        </button>
        <span key={line.attendees.length} className="animate-pop-in flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-primary">
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
      <CheckoutNudge onClick={open} />
    </div>
  );
}

// Small nudge shown under a ticket that's already in the cart for the event website
function CheckoutNudge({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring group animate-pop-in flex items-center gap-1 rounded-full px-1 text-xs font-semibold text-secondary transition-colors hover:text-primary"
    >
      Ready to pay? View cart
      <span aria-hidden="true" className="animate-nudge-x inline-block">
        &rarr;
      </span>
    </button>
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
