import type { Event } from "@/lib/types";
import { formatDateRange } from "@/lib/format";
import { getRegistrationCta } from "@/lib/registration";
import { PLACEHOLDER } from "@/lib/placeholders";
import TicketButton from "./TicketButton";

/**
 * Closing call-to-action band.
 *
 * Only rendered for events that register through an *external* URL — an
 * event with on-page ticket types already ends on the Tickets section, and
 * a second CTA pointing back up the same page would be noise (see
 * lib/registration.ts `getRegistrationCta`).
 */
export default function Registration({ event }: { event: Event }) {
  const cta = getRegistrationCta(event);
  if (!cta || !cta.external) return null;

  const dateRange = formatDateRange(event.start_date, event.end_date);

  return (
    <section className="px-6 py-20 lg:px-10">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent px-6 py-16 text-center text-white sm:px-8">
        {/* Blueprint overlay, so the most saturated block on the page still
            carries the engineering motif. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "3rem 3rem",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[110px]"
          aria-hidden="true"
        />

        <div className="relative">
          <h2 className="text-balance font-boldonse text-2xl font-extrabold uppercase leading-tight tracking-tight sm:text-4xl">
            Ready to join {event.title}?
          </h2>
          {dateRange && (
            <p className="mt-4 text-sm text-white/85 sm:text-base">
              {dateRange}
              {event.venue_name ? ` · ${event.venue_name}` : ""}
            </p>
          )}
          <div className="mt-8 flex justify-center">
            <TicketButton
              href={cta.href}
              label={PLACEHOLDER.ticketCta}
              external={cta.external}
              variant="light"
              size="lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
