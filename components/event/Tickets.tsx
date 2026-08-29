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

/**
 * One ticket card for every ticket kind.
 *
 * This replaces the previous `TicketCard` / `TeamTicketCard` pair, which had
 * diverged into two ~90%-identical components: the same shell, badge, price
 * row, access chips and CTA, differing only in a label, an icon and whether
 * a capacity bar was drawn. Everything that actually differs between an
 * individual and a team ticket now branches on `ticket.kind` in one place —
 * never on the ticket's name (`TicketType.Kind`, apps/tickets/models.py).
 *
 * Price, access, capacity and availability all come straight from the
 * backend response; nothing here is hard-coded per ticket.
 */
function TicketCard({ ticket, featured }: { ticket: TicketType; featured?: boolean }) {
  const soldOut = !isTicketAvailable(ticket);
  const isTeam = ticket.kind === "team";
  const maxTeamSize = ticket.max_team_size ?? 3;

  /*
   * Only drawn when the backend actually reported both numbers. The previous
   * version defaulted to `350 / 500`, so an event that hadn't set a capacity
   * showed an invented 70%-sold scarcity bar to every visitor.
   */
  const sold = ticket.sold_count;
  const capacity = ticket.capacity;
  const hasCapacityData = !isTeam && sold != null && capacity != null && capacity > 0;
  const percentSold = hasCapacityData ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;
  const remaining = hasCapacityData ? Math.max(0, capacity - sold) : null;
  // "Almost gone" is a fact about the numbers, not a sales tactic.
  const scarce = remaining != null && remaining > 0 && percentSold >= 85;

  return (
    <article
      className={`card group relative flex flex-col overflow-hidden rounded-2xl p-8 transition-all duration-[var(--dur-med)] ease-[var(--ease-out)] ${
        soldOut
          ? "opacity-75"
          : "hover:-translate-y-2 hover:shadow-[var(--elev-3)] focus-within:-translate-y-2"
      } ${featured && !soldOut ? "ring-2 ring-secondary/30" : ""}`}
    >
      {/* Fine blueprint texture in the corner — the engineering motif, kept
          to a corner so it never sits behind the price. */}
      <div
        className="tech-grid-fine pointer-events-none absolute -right-4 -top-4 h-28 w-28 opacity-40 transition-opacity duration-[var(--dur-med)] group-hover:opacity-70"
        aria-hidden="true"
      />

      {featured && !soldOut && (
        <span className="absolute right-0 top-6 rounded-l-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-md">
          Popular
        </span>
      )}

      <div className="relative flex flex-wrap items-center gap-2">
        <Badge tone="brand" icon={isTeam ? <TeamIcon className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}>
          {isTeam ? "Team Ticket" : "Individual Ticket"}
        </Badge>
        {soldOut && <Badge tone="neutral">Unavailable</Badge>}
        {scarce && !soldOut && <Badge tone="warning">Almost gone</Badge>}
      </div>

      <h3 className="relative mt-4 font-display text-2xl font-bold leading-snug text-primary">
        {ticket.name}
      </h3>
      <p className="relative mt-1.5 text-sm font-semibold text-muted">
        {isTeam ? `Up to ${maxTeamSize} team members` : "Single attendee access"}
      </p>

      <dl className="relative mt-6 flex flex-col gap-4 border-y border-primary/10 py-6 text-sm">
        {ticket.access && ticket.access.length > 0 && (
          <div className="flex flex-col gap-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Access includes</dt>
            <dd className="flex flex-wrap gap-1.5">
              {ticket.access.map((item) => (
                <Badge key={item.id} tone="accent">
                  {accessLabel(item.kind)}
                </Badge>
              ))}
            </dd>
          </div>
        )}
        <div className="flex items-end justify-between gap-3">
          <dt className="text-muted">{isTeam ? "Price per team" : "Price"}</dt>
          <dd className="font-display text-3xl font-extrabold leading-none text-primary">
            {formatPrice(ticket.price)}
          </dd>
        </div>
        {isTeam && (
          <p className="text-xs leading-relaxed text-muted">
            Charged once for the whole team, whatever the final member count.
          </p>
        )}
      </dl>

      {hasCapacityData && (
        <div className="relative mt-6">
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
          <div className="mt-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-muted">Tickets sold</span>
            <span className={scarce ? "text-amber-600" : "text-secondary"}>
              {soldOut ? "Sold out" : `${sold} / ${capacity}`}
            </span>
          </div>
        </div>
      )}

      {/* `mt-auto` pins every CTA to the bottom, so cards of differing content
          length still line their buttons up across the row. */}
      <div className="relative mt-auto pt-6">
        {soldOut ? (
          <span className="inline-flex w-full items-center justify-center rounded-full border border-primary/10 bg-primary/5 px-6 py-3 text-sm font-semibold text-muted">
            Unavailable
          </span>
        ) : (
          <AddToCartButton ticket={ticket} variant="primary" className="w-full" />
        )}
      </div>
    </article>
  );
}

export default function Tickets({ event }: { event: Event }) {
  const tickets = event.ticket_types;

  return (
    <section id="tickets" className="relative overflow-hidden px-6 py-24 lg:px-10">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent via-secondary to-secondary" />
      {/* Blueprint overlay on the accent band, so the brightest section on the
          page still carries the technical motif. */}
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
          <Stagger className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
