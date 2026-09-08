import type { Event, TicketType } from "@/lib/types";
import { PLACEHOLDER } from "@/lib/placeholders";
import { accessLabel, isTicketAvailable } from "@/lib/booking";
import { formatCurrency } from "@/lib/pricing";
import AddToCartButton from "@/components/booking/AddToCartButton";
import Parallax from "./Parallax";
import Badge from "@/components/ui/Badge";
import Stagger from "@/components/ui/Stagger";
import EmptyState, { TicketStubIcon } from "@/components/ui/EmptyState";

function formatPrice(price: string) {
  const value = Number(price);
  if (Number.isNaN(value)) return price;
  return formatCurrency(value);
}

function TeamIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.5 14.2c2.3.4 4 2.3 4 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// One ticket card for every ticket kind for the event website
function TicketCard({ ticket, featured }: { ticket: TicketType; featured?: boolean }) {
  const soldOut = !isTicketAvailable(ticket);
  const isTeam = ticket.kind === "team";
  const maxTeamSize = ticket.max_team_size ?? 3;

  const sold = ticket.sold_count;
  const capacity = ticket.capacity;
  const hasCapacityData = !isTeam && sold != null && capacity != null && capacity > 0;
  const percentSold = hasCapacityData ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;
  const remaining = hasCapacityData ? Math.max(0, capacity - sold) : null;
  const scarce = remaining != null && remaining > 0 && percentSold >= 85;

  const description = ticket.short_description || ticket.description;

  return (
    <article
      // `h-full` — a team ticket's card has less content above the button (no capacity/"tickets
      // sold" block, since that's tracked per-attendee, not per-team) than an individual
      // ticket's does, so without an explicit full-height flex column here the team card just
      // shrinks to its own shorter content instead of matching its row-mates, leaving its
      // "Add Team" button sitting higher than every other card's button in the same row. The
      // variable-length middle block below is a `flex-1 justify-center` region rather than a
      // plain stack, so that same slack collects as breathing room *around* the description
      // instead of one dead gap stranded right above the button.
      className={`card group relative flex h-full flex-col items-center gap-5 overflow-hidden rounded-[1.75rem] px-7 pb-8 pt-8 text-center transition-all duration-[var(--dur-med)] ease-[var(--ease-out)] sm:px-8 ${
        soldOut
          ? "opacity-75"
          : "hover:-translate-y-2 hover:shadow-[var(--elev-3)] focus-within:-translate-y-2"
      } ${featured && !soldOut ? "ring-2 ring-secondary/30" : ""}`}
    >
      <div
        className="tech-grid-fine pointer-events-none absolute -right-6 -top-6 h-28 w-28 opacity-30 transition-opacity duration-[var(--dur-med)] group-hover:opacity-60"
        aria-hidden="true"
      />

      {featured && !soldOut && (
        <span className="absolute right-0 top-6 rounded-l-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-md">
          Popular
        </span>
      )}

      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent via-secondary to-secondary text-white shadow-[var(--elev-2)] transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover:scale-105">
        {isTeam ? <TeamIcon className="h-6 w-6" /> : <UserIcon className="h-6 w-6" />}
      </div>

      {(soldOut || scarce) && (
        <div className="relative -mt-1 flex flex-wrap items-center justify-center gap-2">
          {soldOut && <Badge tone="neutral">Unavailable</Badge>}
          {scarce && !soldOut && <Badge tone="warning">Almost gone</Badge>}
        </div>
      )}

      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-secondary">{ticket.name}</p>
        <p className="mt-2 font-display text-5xl font-extrabold leading-none text-primary sm:text-6xl">
          {formatPrice(ticket.price)}
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {isTeam ? `Team ticket · up to ${maxTeamSize} members` : "Individual ticket"}
        </p>
      </div>

      <div className="relative flex flex-1 flex-col justify-center gap-4">
        {description && <p className="text-sm leading-relaxed text-muted">{description}</p>}

        {ticket.access && ticket.access.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {ticket.access.map((item) => (
              <Badge key={item.id} tone="accent">
                {accessLabel(item.kind)}
              </Badge>
            ))}
          </div>
        )}

        {isTeam && (
          <p className="text-xs leading-relaxed text-muted">
            Charged once for the whole team, whatever the final member count.
          </p>
        )}
      </div>

      <div className="relative flex w-full flex-col items-center gap-4">
        {hasCapacityData && (
          <div className="w-full">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10"
              role="progressbar"
              aria-valuenow={percentSold}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${percentSold}% of ${ticket.name} tickets sold`}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out)] ${
                  scarce ? "bg-amber-500" : "bg-secondary"
                }`}
                style={{ width: `${percentSold}%` }}
              />
            </div>
            <p className={`mt-2.5 font-display text-sm font-extrabold ${scarce ? "text-amber-600" : "text-secondary"}`}>
              {soldOut ? "Sold out" : `${sold} / ${capacity}`}
            </p>
          </div>
        )}

        {soldOut ? (
          <span className="inline-flex items-center justify-center rounded-full border border-primary/10 bg-primary/5 px-6 py-3 text-sm font-semibold text-muted">
            Unavailable
          </span>
        ) : (
          <AddToCartButton ticket={ticket} variant="secondary" />
        )}
      </div>
    </article>
  );
}

export default function Tickets({ event }: { event: Event }) {
  // Paused/sold-out/closed tickets are left off the page entirely rather than shown with a
  // disabled "Unavailable" pill — nothing purchasable here anyway.
  const tickets = event.ticket_types?.filter(isTicketAvailable);

  return (
    <section id="tickets" className="relative overflow-hidden px-6 py-24 lg:px-10">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent via-secondary to-secondary" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
        }}
        aria-hidden="true"
      />
      <Parallax speed={0.08} className="pointer-events-none absolute inset-x-0 top-10 z-0">
        <p
          aria-hidden="true"
          className="select-none text-center text-[5rem] font-extrabold uppercase tracking-tight text-white/15 sm:text-[8rem]"
        >
          TICKETS
        </p>
      </Parallax>

      <div className="relative mx-auto max-w-6xl">
        <p className="text-center text-xs font-bold uppercase tracking-[0.28em] text-white/80">
          {PLACEHOLDER.plansEyebrow}
        </p>
        <h2 className="mt-3 text-center font-boldonse text-4xl font-extrabold uppercase leading-tight text-white sm:text-5xl">
          {PLACEHOLDER.plansTitle}
        </h2>
        <p className="mx-auto mt-5 w-fit rounded-full bg-sky-300 px-6 py-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
          {PLACEHOLDER.plansBanner}
        </p>

        {!tickets || tickets.length === 0 ? (
          <div className="mt-14">
            <EmptyState
              icon={<TicketStubIcon />}
              title="Tickets not on sale yet"
              description="Registration opens closer to the event. Check back soon for pricing and passes."
              className="border-white/30 bg-white/90"
            />
          </div>
        ) : (
          <Stagger className="mt-14 grid items-stretch gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket, index) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                featured={index === Math.floor(tickets.length / 2) || tickets.length === 1}
              />
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}
