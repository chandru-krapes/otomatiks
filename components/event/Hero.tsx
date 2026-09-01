import type { CSSProperties } from "react";
import Image from "next/image";
import type { Event } from "@/lib/types";
import { resolveBannerUrl } from "@/lib/api";
import { getRegistrationCta } from "@/lib/registration";
import { formatDateRange } from "@/lib/format";
import { PLACEHOLDER } from "@/lib/placeholders";
import Countdown from "./Countdown";
import TicketButton from "./TicketButton";
import Badge from "@/components/ui/Badge";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

/** Index for the `.hero-stagger` entrance (see globals.css). */
const step = (index: number) => ({ ["--i" as string]: index } as CSSProperties);

/*
 * Hero stat circles: platform-level marketing figures, not per-event counts
 * — the same kind of static claim as About.tsx's "14+ Years of Experience" /
 * "100,000+ Students Trained", true regardless of which event site this is,
 * rather than anything derived from `event.speakers`/`event.sponsors`/etc.
 * Static, so update the numbers here if they change; nothing computes them.
 */
const HERO_STATS = [
  {
    id: "participants",
    value: 5000,
    label: "Participants",
    className: "left-[6%] top-[4%] h-36 w-36 bg-accent/85 sm:h-44 sm:w-44",
    float: "animate-float",
  },
  {
    id: "chief-guests",
    value: 10,
    label: "Chief Guests",
    className: "right-[4%] top-[2%] h-28 w-28 bg-primary/85 sm:h-36 sm:w-36",
    float: "animate-float-slow",
  },
  {
    // Largest of the three, and centred between the other two — the
    // headline figure the other two flank.
    id: "awards",
    value: 1000,
    label: "Awards",
    className: "left-[27%] top-[34%] z-[5] h-44 w-44 bg-secondary/90 sm:h-56 sm:w-56",
    float: "animate-float-slow",
  },
] as const;

export default function Hero({ event }: { event: Event }) {
  const banner = resolveBannerUrl(event);
  const cta = getRegistrationCta(event);
  const dateRange = formatDateRange(event.start_date, event.end_date);

  return (
    <section
      id="top"
      className="relative isolate min-h-[100svh] overflow-hidden bg-background px-6 pb-16 pt-24 sm:min-h-screen lg:px-10 lg:pb-24 lg:pt-20"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {banner ? (
          <>
            {/*
              Static, not wrapped in <Parallax> — the scroll-driven translate
              it applies would slide real image content past this box's
              clipped edges, re-introducing the top/bottom cropping that was
              fixed previously.
            */}
            <div className="absolute inset-0 h-full w-full">
              <Image
                src={banner}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
            {/*
              Legibility scrim. The banner is an arbitrary organiser upload —
              it can be light, busy, or have its subject exactly where the
              headline goes. These two passes guarantee the hero copy has
              something to sit on regardless: a horizontal wash behind the
              text column, and a vertical one so the countdown row and the
              section boundary below stay clean.
            */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/35 lg:via-white/70 lg:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
          </>
        ) : (
          // No banner: a blueprint ground rather than flat white, so an event
          // that hasn't uploaded artwork still has a designed hero.
          <div className="tech-grid absolute inset-0 opacity-70" />
        )}
        {/* Hidden below `sm`: these run a compositor animation forever, and
            on the very first fold every mobile visitor loads, that's a
            permanent GPU/battery cost for a purely decorative flourish. */}
        <div className="animate-blob absolute -left-10 top-10 hidden h-64 w-64 bg-accent/15 blur-3xl sm:block" />
        <div className="animate-blob-slow absolute -right-8 bottom-0 hidden h-72 w-72 bg-secondary/10 blur-3xl sm:block" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div className="hero-stagger">
          <div style={step(0)} className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent">
              {event.tagline || PLACEHOLDER.eyebrow}
            </p>
            {/* Only claims "on sale" when the backend says a ticket is actually
                purchasable — never a decorative live indicator. */}
            {event.ticket_types?.some((ticket) => ticket.is_available !== false) && (
              <Badge tone="brand" pulse>
                Registration open
              </Badge>
            )}
          </div>

          <h1
            style={step(1)}
            className="mt-4 font-boldonse text-balance text-4xl font-extrabold uppercase leading-tight tracking-tight text-primary sm:text-5xl lg:text-6xl"
          >
            {event.title}
          </h1>

          <p style={step(2)} className="mt-4 max-w-lg text-lg font-medium text-sky-600">
            {PLACEHOLDER.heroSubhead}
          </p>

          {event.description && (
            <p style={step(3)} className="mt-4 max-w-lg text-sm leading-relaxed text-foreground/70">
              {event.description}
            </p>
          )}

          {/* Date and venue promoted into the hero: for an event site these
              are the two facts a visitor is looking for first, and they were
              previously only available further down the page. */}
          {(dateRange || event.venue_name) && (
            <div
              style={step(4)}
              className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-primary"
            >
              {dateRange && (
                <span className="flex items-center gap-2">
                  <CalendarIcon />
                  {dateRange}
                </span>
              )}
              {event.venue_name && (
                <span className="flex items-center gap-2">
                  <PinIcon />
                  {event.venue_name}
                </span>
              )}
            </div>
          )}

          {cta && (
            <div style={step(5)} className="mt-8">
              <TicketButton href={cta.href} label={PLACEHOLDER.ticketCta} external={cta.external} size="lg" />
            </div>
          )}

          {event.start_date && (
            <div style={step(6)} className="mt-10">
              <Countdown target={event.start_date} />
            </div>
          )}
        </div>

        {/*
          The stat circles are sized and positioned for the two-column desktop
          layout. Below `sm` this column stacks under the hero copy instead of
          sitting beside it, and the circles no longer have room to spread
          out — they just pile up on each other and the section below. So they
          aren't rendered on mobile at all.
        */}
        <div className="relative mx-auto hidden h-[340px] w-full max-w-lg sm:block sm:h-[420px]">
          {HERO_STATS.map((stat) => (
            <div
              key={stat.id}
              className={`absolute flex flex-col items-center justify-center rounded-full text-center text-white shadow-xl backdrop-blur-md ${stat.className} ${stat.float}`}
            >
              <span className="text-2xl font-extrabold sm:text-3xl">
                <AnimatedNumber value={stat.value} />+
              </span>
              <span className="px-3 text-[11px] font-semibold uppercase tracking-wide">{stat.label}</span>
            </div>
          ))}
          {/* Sits in the gap between Participants and Chief Guests, above the
              Awards circle's top edge — its old position (48%, 42%) now
              lands inside that circle, since Awards is the new, larger one. */}
          <span className="animate-bounce-y absolute left-[52%] top-[14%] z-10 h-3 w-3 rounded-full bg-accent" />
          <span className="animate-float absolute bottom-[22%] right-[18%] z-10 h-3 w-3 rounded-full bg-secondary" />
          <span className="animate-float-slow absolute bottom-[30%] left-[6%] z-10 h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
      </div>

      {/* Scroll affordance — the hero is a full viewport tall, so it needs to
          say that there is more below it. */}
      <a
        href="#event-details"
        aria-label="Scroll to event details"
        className="focus-ring absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/50 transition-colors hover:text-primary sm:flex"
      >
        Scroll
        <span className="animate-bounce-y" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12l7 7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </a>
    </section>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-secondary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-secondary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
