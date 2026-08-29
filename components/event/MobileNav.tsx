"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { NavLink } from "@/lib/types";
import type { RegistrationCta } from "@/lib/registration";
import { PLACEHOLDER } from "@/lib/placeholders";
import TicketButton from "./TicketButton";

/**
 * Mobile hamburger menu.
 *
 * The CTA is hidden from the header row below `md` (see Header.tsx), so it's
 * repeated here inside the panel — otherwise mobile visitors would have no
 * way to reach it from the nav at all.
 *
 * Behaviour this needs beyond "show a list":
 *  - It stays mounted while closed so it can animate out as well as in. A
 *    conditionally-rendered panel can only ever animate one direction.
 *  - `inert` (not just `hidden`) while closed, so the links aren't reachable
 *    by tab or exposed to a screen reader while invisible.
 *  - Escape closes it and returns focus to the toggle, which is what a
 *    keyboard user expects from any disclosure.
 *  - Body scroll is locked while open, so scrolling the menu doesn't scroll
 *    the page underneath it.
 */
export default function MobileNav({ links, cta }: { links: NavLink[]; cta?: RegistrationCta | null }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (nativeEvent: KeyboardEvent) => {
      if (nativeEvent.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    // Preserve whatever overflow the document already had rather than
    // assuming "visible" — restoring the wrong value would break scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (links.length === 0 && !cta) return null;

  const ctaLabel =
    cta && (cta.label === "Get Tickets" || cta.label === "Register Now")
      ? PLACEHOLDER.ticketCta
      : cta?.label;

  return (
    <div className="md:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((value) => !value)}
        className="focus-ring press flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-colors duration-[var(--dur-fast)] hover:border-white/60 hover:bg-white/10"
      >
        {/* Two bars that cross into an X, rather than swapping icons — the
            transition is what makes the control feel responsive. */}
        <span className="relative block h-4 w-[18px]" aria-hidden="true">
          <span
            className={`absolute left-0 block h-[1.6px] w-full rounded-full bg-current transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] ${
              open ? "top-1/2 rotate-45" : "top-[3px]"
            }`}
          />
          <span
            className={`absolute left-0 top-1/2 block h-[1.6px] w-full -translate-y-1/2 rounded-full bg-current transition-opacity duration-[var(--dur-fast)] ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 block h-[1.6px] w-full rounded-full bg-current transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] ${
              open ? "top-1/2 -rotate-45" : "bottom-[3px]"
            }`}
          />
        </span>
      </button>

      {/* Scrim. Tapping outside the panel closes it. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-x-0 bottom-0 top-16 -z-10 bg-primary/40 backdrop-blur-[2px] transition-opacity duration-[var(--dur-med)] ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        id={panelId}
        // Stays mounted so it can animate both directions; `inert` keeps the
        // closed panel out of the tab order and the accessibility tree.
        inert={!open}
        className={`absolute inset-x-0 top-full max-h-[calc(100svh-4rem)] origin-top overflow-y-auto border-t border-white/10 bg-primary/95 px-6 py-6 text-white shadow-2xl backdrop-blur-xl transition-[opacity,transform] duration-[var(--dur-med)] ease-[var(--ease-out)] ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        {links.length > 0 && (
          <nav aria-label="Section navigation" className="flex flex-col gap-1">
            {links.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                // Links cascade in behind the panel itself. The delay is
                // driven by the open state so it doesn't replay on close.
                style={{ transitionDelay: open ? `${60 + index * 35}ms` : "0ms" }}
                className={`focus-ring rounded-lg px-3 py-3 text-sm font-medium text-white/90 transition-[background-color,color,transform,opacity] duration-[var(--dur-med)] ease-[var(--ease-out)] hover:bg-white/10 hover:text-white ${
                  open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}
        {cta && (
          <TicketButton
            href={cta.href}
            label={ctaLabel}
            external={cta.external}
            className={`w-full ${links.length > 0 ? "mt-4" : ""}`}
          />
        )}
      </div>
    </div>
  );
}
