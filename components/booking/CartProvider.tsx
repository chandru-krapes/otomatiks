"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { TicketType } from "@/lib/types";
import { emptyAttendee, type Attendee } from "@/lib/booking";
import { clearStoredCart, loadCart, saveCart, type CartLine } from "@/lib/cart";

interface CartContextValue {
  lines: CartLine[];
  /** Total attendee slots across every line — what the floating cart badge counts. */
  count: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /**
   * Adds one attendee slot for this ticket. An individual ticket merges
   * into its existing line if there is one (one more attendee on the same
   * line) — a team ticket always starts a fresh line instead, so a second
   * "Add to cart" click registers a *second team*, each independently
   * capped at `max_team_size`, rather than overflowing one team past its
   * limit.
   */
  addTicket: (ticket: TicketType) => void;
  removeLine: (lineId: string) => void;
  /** No-ops past a team line's `max_team_size`. */
  addAttendeeToLine: (lineId: string) => void;
  /** Removes the whole line once its last attendee goes — an empty line
   * isn't a valid cart entry. */
  removeAttendeeFromLine: (lineId: string, index: number) => void;
  updateAttendee: (lineId: string, index: number, attendee: Attendee) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Mounted once, in the root layout — so cart state survives client-side
 * navigation between the event page and `/checkout` without a
 * localStorage round-trip, while still persisting across full page loads
 * via lib/cart.ts.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // Distinguishes "haven't read storage yet" from "read storage, it was
  // empty" — without this, the very first render's empty `lines` would get
  // written back to storage and silently wipe out whatever was actually
  // there before the read effect below has run.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Browser-only API, read once right after mount — see lib/cart.ts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCart(lines);
  }, [lines, hydrated]);

  function addTicket(ticket: TicketType) {
    setLines((current) => {
      const isTeam = ticket.kind === "team";
      if (!isTeam) {
        const existingIndex = current.findIndex((line) => line.ticket.id === ticket.id);
        if (existingIndex !== -1) {
          return current.map((line, index) =>
            index === existingIndex ? { ...line, attendees: [...line.attendees, emptyAttendee()] } : line,
          );
        }
      }
      return [...current, { id: uid(), ticket, attendees: [emptyAttendee()] }];
    });
    setIsOpen(true);
  }

  function removeLine(lineId: string) {
    setLines((current) => current.filter((line) => line.id !== lineId));
  }

  function addAttendeeToLine(lineId: string) {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) return line;
        const max = line.ticket.kind === "team" ? (line.ticket.max_team_size ?? 3) : Infinity;
        if (line.attendees.length >= max) return line;
        return { ...line, attendees: [...line.attendees, emptyAttendee()] };
      }),
    );
  }

  function removeAttendeeFromLine(lineId: string, index: number) {
    setLines((current) =>
      current
        .map((line) => (line.id === lineId ? { ...line, attendees: line.attendees.filter((_, i) => i !== index) } : line))
        .filter((line) => line.attendees.length > 0),
    );
  }

  function updateAttendee(lineId: string, index: number, attendee: Attendee) {
    setLines((current) =>
      current.map((line) =>
        line.id === lineId ? { ...line, attendees: line.attendees.map((a, i) => (i === index ? attendee : a)) } : line,
      ),
    );
  }

  function clear() {
    setLines([]);
    clearStoredCart();
  }

  const count = useMemo(() => lines.reduce((sum, line) => sum + line.attendees.length, 0), [lines]);

  const value: CartContextValue = {
    lines,
    count,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    addTicket,
    removeLine,
    addAttendeeToLine,
    removeAttendeeFromLine,
    updateAttendee,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
