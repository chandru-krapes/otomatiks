"use client";

import { useState } from "react";
import type { TicketType } from "@/lib/types";
import { useCart } from "./CartProvider";
import Button, { type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { TicketIcon } from "@/components/event/TicketButton";

/**
 * The purchase action everywhere a ticket type is shown (ticket cards,
 * the event-categories explorer) — adds one attendee slot to the cart
 * instead of navigating to a per-ticket booking page. Every ticket type on
 * this event's page shares one cart (see CartProvider), so adding a second
 * ticket type here doesn't reset or replace the first.
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
  const { addTicket } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    addTicket(ticket);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  }

  const isTeam = ticket.kind === "team";
  const defaultLabel = isTeam ? "Add Team to Cart" : "Add to Cart";

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      icon={
        justAdded ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <TicketIcon className="h-4 w-4 transition-transform duration-[var(--dur-fast)] group-hover:-rotate-12" />
        )
      }
    >
      {justAdded ? "Added" : (label ?? defaultLabel)}
    </Button>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-pop-in ${className}`}
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
