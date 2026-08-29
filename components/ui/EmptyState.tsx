import type { ReactNode } from "react";

/**
 * Shown when a section has nothing to render — no speakers announced yet, no
 * sponsors, an empty registration history. Replaces the bare
 * `<p className="text-center text-muted">Lineup coming soon.</p>` lines that
 * were scattered through the event sections.
 *
 * A section with no content is a normal state here (the backend fills these
 * in over time as an event is built up), so the tone is "not yet", not
 * "something went wrong".
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: {
  /** Defaults to a neutral mark. Pass a section-specific glyph where one helps. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Optional CTA — only include one if there is genuinely something to do. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-dashed border-primary/15 bg-white/50 px-6 py-14 text-center ${className}`}
    >
      {/* Faint blueprint ground, so an empty panel still reads as designed
          rather than unfinished. */}
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
        {icon ?? <DefaultIcon />}
      </div>
      <p className="relative font-display text-base font-bold text-primary">{title}</p>
      {description && (
        <p className="relative max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="relative mt-2">{action}</div>}
    </div>
  );
}

function DefaultIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18M9 16h6" />
    </svg>
  );
}

/** Speaker-lineup glyph. */
export function PeopleIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M15.6 14.2c2.2.4 3.9 2.3 3.9 4.6" />
    </svg>
  );
}

/** Sponsor/partner glyph. */
export function HandshakeIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m11 17 2 2 4-4 3 3V9l-4-4H8L4 9v9l3-3 4 2Z" />
    </svg>
  );
}

/** Ticket glyph, for an empty ticket/booking list. */
export function TicketStubIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 9V7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V9a2 2 0 1 0 0 6v1.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V15a2 2 0 1 0 0-6Z" />
      <path d="M10 6v12" strokeDasharray="2.2 2.4" />
    </svg>
  );
}
