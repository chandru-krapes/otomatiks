import type { Event } from "@/lib/types";
import { formatDateRange } from "@/lib/format";
import { resolveBannerUrl } from "@/lib/api";
import { getRegistrationCta } from "@/lib/registration";
import { PLACEHOLDER } from "@/lib/placeholders";
import TicketButton from "./TicketButton";

function SmallCalIcon() {
  return (
    <svg className="h-3.5 w-3.5 animate-icon-float" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function SmallPinIcon() {
  return (
    <svg className="h-3.5 w-3.5 animate-icon-float" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg className={`${className || ""} animate-sparkle-float`} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 4 L22 18 L36 20 L22 22 L20 36 L18 22 L4 20 L18 18 Z" fill="currentColor" />
    </svg>
  );
}

function Squiggle({ className }: { className?: string }) {
  return (
    <svg className={`${className || ""} animate-squiggle-float`} viewBox="0 0 60 30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <path d="M4 15 Q14 4 24 15 Q34 26 44 15 Q54 4 58 15" />
    </svg>
  );
}

export default function EventDetails({ event }: { event: Event }) {
  const dateRange = formatDateRange(event.start_date, event.end_date);
  // No invented fallback: the venue line is simply omitted when the
  // backend has no venue set, rather than naming a hotel that has nothing
  // to do with this event.
  const venue = event.venue_name;
  // The "Why join event" section gets its own secondary image (uploaded separately in the
  // admin panel) so it isn't just repeating the hero banner already shown up top — falls back
  // to the banner for events that haven't set one yet, rather than showing nothing.
  const banner = event.about_image_url || resolveBannerUrl(event);
  const cta = getRegistrationCta(event);

  const titleWords = event.title.split(" ");
  const half = Math.ceil(titleWords.length / 2);
  const titleMain = titleWords.slice(0, half).join(" ");
  const titleAccent = titleWords.slice(half).join(" ");
  return (
    <section id="event-details" className="section-glow relative px-6 py-24 lg:px-10">
      {/* Decorative doodles */}
      <Sparkle className="pointer-events-none absolute left-[38%] top-8 h-8 w-8 text-accent/50" />
      <Sparkle className="pointer-events-none absolute bottom-12 right-[12%] h-6 w-6 text-secondary/40" />
      <Sparkle className="pointer-events-none absolute right-[32%] top-10 h-5 w-5 text-accent/30" />
      <Squiggle className="pointer-events-none absolute right-[5%] top-16 h-8 w-16 text-accent/40" />
      <Squiggle className="pointer-events-none absolute bottom-14 left-[4%] h-8 w-16 text-secondary/30 rotate-12" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">

        {/* ── Left: Event image ── */}
        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-accent/20 to-secondary/15 blur-xl" />
          <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl shadow-accent/20">
            {banner ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner}
                  alt={event.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:scale-105"
                />
                {/* Slight bottom vignette, so the image reads as a composed
                    plate rather than a raw upload. */}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/25 to-transparent"
                  aria-hidden="true"
                />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/30 to-secondary/20">
                <span className="font-boldonse text-4xl uppercase text-white/60">
                  {event.title.slice(0, 2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Content ── */}
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent">
            {event.tagline || PLACEHOLDER.eyebrow}
          </p>

          <h2 className="mt-3 font-boldonse text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
            {titleMain}
            {titleAccent && (
              <>{" "}<span className="text-accent">{titleAccent}</span></>
            )}
          </h2>

          <p className="mt-5 max-w-md leading-relaxed text-muted">
            {event.about_description || event.description || PLACEHOLDER.aboutBody.slice(0, 130) + "…"}
          </p>

          {/* Pill CTA card */}
          <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl bg-white/85 p-5 shadow-lg shadow-accent/10 backdrop-blur-sm sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="font-display text-base font-bold leading-snug text-primary">
                {event.tagline || "Unleashing the Power of Change"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                {dateRange && (
                  <span className="flex items-center gap-1 text-xs font-medium text-muted">
                    <SmallCalIcon />
                    {dateRange}
                  </span>
                )}
                {venue && (
                  <span className="flex items-center gap-1 text-xs font-medium text-muted">
                    <SmallPinIcon />
                    {venue}
                  </span>
                )}
              </div>
            </div>
            {cta && (
              <TicketButton
                href={cta.href}
                label={PLACEHOLDER.ticketCta}
                external={cta.external}
                className="w-full shrink-0 sm:w-auto"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
