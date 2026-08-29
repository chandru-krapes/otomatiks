import type { Metadata } from "next";
import { resolveEvent } from "@/lib/resolve-event";
import EventNotFound from "@/components/event/EventNotFound";
import AddToCartAndRedirect from "@/components/booking/AddToCartAndRedirect";
import Button from "@/components/ui/Button";
import { TicketStubIcon } from "@/components/ui/EmptyState";

export async function generateMetadata(): Promise<Metadata> {
  const { event } = await resolveEvent();
  if (!event) return { title: "Event Not Found" };
  return { title: `Book Tickets — ${event.title}` };
}

export default async function Page({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const { subdomain, event } = await resolveEvent();

  if (!event) {
    return <EventNotFound subdomain={subdomain} />;
  }

  const ticket = event.ticket_types?.find((candidate) => String(candidate.id) === ticketId);

  if (!ticket) {
    return (
      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 overflow-hidden px-6 text-center">
        <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
          <TicketStubIcon />
        </div>
        <h1 className="relative font-boldonse text-2xl font-extrabold uppercase tracking-tight text-primary">
          Ticket not found
        </h1>
        <p className="relative text-balance leading-relaxed text-muted">
          This ticket type isn&rsquo;t available for {event.title}. It may have been withdrawn, or
          the link may be out of date.
        </p>
        <div className="relative mt-2">
          <Button href="/#tickets" variant="primary">
            See available tickets
          </Button>
        </div>
      </div>
    );
  }

  return <AddToCartAndRedirect ticket={ticket} />;
}
