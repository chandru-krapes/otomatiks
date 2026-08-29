import type { Event, NavLink } from "@/lib/types";
import { PLACEHOLDER } from "@/lib/placeholders";
import { formatDateRange } from "@/lib/format";
import SocialIcons from "./SocialIcons";

export default function Footer({ event, navLinks }: { event: Event; navLinks: NavLink[] }) {
  const blurb = event.footer_note || event.short_description || PLACEHOLDER.aboutBody;
  const dateRange = formatDateRange(event.start_date, event.end_date);
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-secondary px-6 py-20 text-white lg:px-10">
      <div className="animate-blob pointer-events-none absolute -left-16 top-0 hidden h-56 w-56 bg-white/10 blur-3xl sm:block" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "3rem 3rem",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="font-display text-3xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
            {event.title.slice(0, 1)}
          </span>
          {event.title.slice(1)}
          <span className="text-white/80">.</span>
        </p>

        {(dateRange || event.venue_name) && (
          <p className="mt-3 text-sm font-semibold text-white/80">
            {[dateRange, event.venue_name].filter(Boolean).join(" · ")}
          </p>
        )}

        <p className="mt-6 max-w-xl text-balance leading-relaxed text-white/90">{blurb}</p>

        {/* Renders nothing unless the event actually has social links —
            see SocialIcons. */}
        <div className="mt-8 empty:mt-0">
          <SocialIcons links={event.social_links} light />
        </div>

        {navLinks.length > 0 && (
          <nav
            aria-label="Footer navigation"
            className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-medium text-white/90"
          >
            {navLinks.map((link, index) => (
              <span key={link.href} className="flex items-center gap-3">
                {index > 0 && (
                  <span aria-hidden="true" className="text-white/40">
                    |
                  </span>
                )}
                <a
                  href={link.href}
                  className="focus-ring rounded-sm transition-colors duration-[var(--dur-fast)] hover:text-white"
                >
                  {link.label}
                </a>
              </span>
            ))}
          </nav>
        )}

        <div className="mt-10 flex w-full flex-col items-center gap-4">
          <span className="h-px w-full max-w-xs bg-white/20" aria-hidden="true" />
          <p className="text-xs text-white/60">
            © {year} {event.title}. Presented by Otomatiks.
          </p>
        </div>
      </div>
    </footer>
  );
}
