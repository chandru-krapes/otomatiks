import type { Event } from "@/lib/types";
import { resolveBannerUrl } from "@/lib/api";
import { formatDateRange } from "@/lib/format";
import EmptyState from "@/components/ui/EmptyState";

/**
 * Shared "upcoming events" section on both account dashboards — a
 * cross-event view (lib/api.ts listPublishedEvents), unlike the rest of
 * this site which only ever renders the one event its subdomain resolves
 * to. Each event links out to its own subdomain, since that's still where
 * the actual event website/ticket purchase lives.
 */
export default function UpcomingEvents({ events }: { events: Event[] }) {
  // `listPublishedEvents()` already filters to `status=published`; sorted
  // soonest-first here rather than also filtering on end_date client-side
  // (the backend has no date-based filter to match against, and calling
  // `Date.now()` during render would make this impure — see React's rules
  // on component purity).
  const upcoming = [...events].sort(
    (a, b) => new Date(a.start_date ?? 0).getTime() - new Date(b.start_date ?? 0).getTime(),
  );

  return (
    <section className="glass-panel flex flex-col gap-5 rounded-3xl p-8">
      <h2 className="font-display text-lg font-bold text-primary">Upcoming events</h2>

      {upcoming.length === 0 ? (
        <EmptyState
          title="No upcoming events"
          description="Published events will appear here as they are announced."
          className="py-10"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {upcoming.map((event) => {
            const banner = resolveBannerUrl(event);
            return (
              <li key={event.id}>
                <EventLink event={event} banner={banner} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function EventLink({ event, banner }: { event: Event; banner: string | null }) {
  // Local-testing subdomain scheme only (AGENTS.md "Current Local Testing")
  // — deliberately not a hard-coded production domain.
  const href =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${event.slug}.${window.location.host.replace(/^[^.]+\./, "")}`
      : `/`;

  return (
    <a
      href={href}
      className="card card-interactive focus-ring group flex items-center gap-4 rounded-2xl p-4"
    >
      {banner ? (
        // eslint-disable-next-line @next/next/no-img-element -- cross-origin event banners, arbitrary hosts.
        <img
          src={banner}
          alt=""
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-xl object-cover transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover:scale-105"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-lg font-bold text-secondary">
          {event.title.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-primary">{event.title}</p>
        <p className="text-xs text-muted">{formatDateRange(event.start_date, event.end_date) ?? "Dates TBA"}</p>
      </div>
      <svg
        className="arrow-slide h-4 w-4 shrink-0 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </a>
  );
}
