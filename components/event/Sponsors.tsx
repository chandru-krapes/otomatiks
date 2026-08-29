import type { Event, Sponsor } from "@/lib/types";
import { getRegistrationCta } from "@/lib/registration";
import { PLACEHOLDER } from "@/lib/placeholders";
import SectionHeading from "./SectionHeading";
import TicketButton from "./TicketButton";
import EmptyState, { HandshakeIcon } from "@/components/ui/EmptyState";

/**
 * Sponsors, all in one continuously scrolling marquee — no tier grouping or
 * row labels. Every logo gets the same card treatment (grayscale, lifting
 * to full colour on hover) regardless of `Sponsor.tier`; scale/prominence
 * isn't used to imply a hierarchy here.
 */
function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const src = sponsor.logo_url;

  const className =
    "card card-interactive group flex h-16 w-36 shrink-0 items-center justify-center rounded-2xl px-6 sm:h-20 sm:w-44";

  const inner = src ? (
    // eslint-disable-next-line @next/next/no-img-element -- sponsor logos are R2 URLs on arbitrary hosts.
    <img
      src={src}
      alt={sponsor.name}
      loading="lazy"
      className="max-h-10 w-auto object-contain grayscale transition-all duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover:grayscale-0 group-hover:scale-105 sm:max-h-12"
    />
  ) : (
    <span className="text-center text-sm font-bold uppercase leading-tight tracking-wider text-primary/70 transition-colors duration-[var(--dur-med)] group-hover:text-primary">
      {sponsor.name}
    </span>
  );

  return sponsor.website_url ? (
    <a
      href={sponsor.website_url}
      target="_blank"
      rel="noopener noreferrer"
      // The logo is the accessible name; without this a screen reader hears
      // only "link".
      aria-label={`${sponsor.name} (opens in a new tab)`}
      className={`${className} focus-ring`}
    >
      {inner}
    </a>
  ) : (
    <div className={className}>{inner}</div>
  );
}

export default function Sponsors({ event }: { event: Event }) {
  const sponsors = event.sponsors;
  const cta = getRegistrationCta(event);

  return (
    <section id="sponsors" className="section-tint relative px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          ghost="SPONSORS"
          eyebrow={PLACEHOLDER.sponsorsEyebrow}
          title={PLACEHOLDER.sponsorsTitle}
        />

        {!sponsors || sponsors.length === 0 ? (
          <EmptyState
            icon={<HandshakeIcon />}
            title="Partners to be announced"
            description="Sponsors and partners for this event will be listed here once confirmed."
          />
        ) : (
          /* Marquee wrapper — the hover-pause is handled in CSS via
             `.marquee-wrapper:hover .animate-marquee`. */
          <div className="marquee-wrapper relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-tint-cool to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-tint-cool to-transparent" />

            <div className="animate-marquee flex w-max gap-4">
              {sponsors.map((sponsor) => (
                <SponsorCard key={`a-${sponsor.id}`} sponsor={sponsor} />
              ))}
              {/* Duplicate copy for the seamless loop. Hidden from assistive
                  tech so every sponsor isn't announced twice. */}
              <div className="flex gap-4" aria-hidden="true">
                {sponsors.map((sponsor) => (
                  <SponsorCard key={`b-${sponsor.id}`} sponsor={sponsor} />
                ))}
              </div>
            </div>
          </div>
        )}

        {cta && (
          <div className="mt-12 flex justify-center">
            <TicketButton href={cta.href} label={PLACEHOLDER.ticketCta} external={cta.external} />
          </div>
        )}
      </div>
    </section>
  );
}
