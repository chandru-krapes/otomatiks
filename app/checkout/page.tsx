import type { Metadata } from "next";
import { resolveEvent } from "@/lib/resolve-event";
import EventNotFound from "@/components/event/EventNotFound";
// Real checkout flow — left fully intact, just not mounted below for now.
// Swap CheckoutComingSoon back out for this once bookings go live.
// import CheckoutPage from "@/components/booking/CheckoutPage";
import CheckoutComingSoon from "@/components/booking/CheckoutComingSoon";

export async function generateMetadata(): Promise<Metadata> {
  const { event } = await resolveEvent();
  if (!event) return { title: "Event Not Found" };
  return { title: `Checkout — ${event.title}` };
}

export default async function Page() {
  const { subdomain, event } = await resolveEvent();

  if (!event) {
    return <EventNotFound subdomain={subdomain} />;
  }

  return <CheckoutComingSoon event={event} />;
}
