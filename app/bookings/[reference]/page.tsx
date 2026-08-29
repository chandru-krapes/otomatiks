import type { Metadata } from "next";
import { resolveEvent } from "@/lib/resolve-event";
import EventNotFound from "@/components/event/EventNotFound";
import BookingConfirmationClient from "@/components/booking/BookingConfirmationClient";

export async function generateMetadata(): Promise<Metadata> {
  const { event } = await resolveEvent();
  if (!event) return { title: "Event Not Found" };
  return { title: `Booking Confirmation — ${event.title}` };
}

export default async function Page({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const { subdomain, event } = await resolveEvent();

  if (!event) {
    return <EventNotFound subdomain={subdomain} />;
  }

  return <BookingConfirmationClient event={event} reference={reference} />;
}
