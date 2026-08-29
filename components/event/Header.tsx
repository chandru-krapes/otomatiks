import type { Event } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/api";
import { getRegistrationCta } from "@/lib/registration";
import { PLACEHOLDER } from "@/lib/placeholders";
import MobileNav from "./MobileNav";
import TicketButton from "./TicketButton";
import StickyHeaderShell from "./StickyHeaderShell";
import HeaderNav from "./HeaderNav";

export default function Header({ event, navLinks }: { event: Event; navLinks: import("@/lib/types").NavLink[] }) {
  const logo = resolveMediaUrl(event.logo);
  const cta = getRegistrationCta(event);
  const ctaLabel =
    cta && (cta.label === "Get Tickets" || cta.label === "Register Now")
      ? PLACEHOLDER.ticketCta
      : cta?.label;

  return (
    <StickyHeaderShell>
      {/* Keyboard users get past the nav in one keystroke instead of tabbing
          through every section link on every page. */}
      <a href="#main" className="skip-link rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary shadow-lg">
        Skip to content
      </a>

      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-10">
        <a
          href="#top"
          className="focus-ring group flex min-w-0 shrink items-center gap-3 rounded-lg"
          aria-label={`${event.title} — back to top`}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={event.title}
              className="h-8 w-auto shrink-0 object-contain transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover:scale-105"
            />
          ) : (
            <span className="truncate font-bartle text-xl font-extrabold tracking-tight text-white transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover:scale-[1.02] sm:text-2xl">
              <span className="bg-gradient-to-r from-yellow-300 to-secondary bg-clip-text text-transparent">
                {event.title.slice(0, 1)}
              </span>
              {event.title.slice(1)}
              <span className="text-secondary">.</span>
            </span>
          )}
        </a>

        <HeaderNav links={navLinks} />

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {cta && (
            <TicketButton
              href={cta.href}
              label={ctaLabel}
              external={cta.external}
              size="sm"
              className="hidden md:inline-flex"
            />
          )}
          <MobileNav links={navLinks} cta={cta} />
        </div>
      </div>
    </StickyHeaderShell>
  );
}
