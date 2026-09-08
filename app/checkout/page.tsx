import type { Metadata } from "next";
import { resolveEvent } from "@/lib/resolve-event";
import EventNotFound from "@/components/event/EventNotFound";
import CheckoutPage from "@/components/booking/CheckoutPage";

export async function generateMetadata(): Promise<Metadata> {
  const { event } = await resolveEvent();
  if (!event) return { title: "Event Not Found" };
  return { title: `Complete Booking — ${event.title}` };
}

export default async function Page() {
  const { subdomain, event } = await resolveEvent();

  if (!event) {
    return <EventNotFound subdomain={subdomain} />;
  }

  return <CheckoutPage event={event} />;
}
