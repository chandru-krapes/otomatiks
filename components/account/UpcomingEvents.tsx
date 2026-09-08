import type { Event } from "@/lib/types";
import { resolveBannerUrl } from "@/lib/api";
import { formatDateRange } from "@/lib/format";
import EmptyState from "@/components/ui/EmptyState";

export default function UpcomingEvents({ events }: { events: Event[] }) {

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
