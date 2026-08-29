import { Suspense } from "react";
import type { Metadata } from "next";
import { resolveEvent } from "@/lib/resolve-event";
import EventNotFound from "@/components/event/EventNotFound";
import PaymentFailureClient from "@/components/booking/PaymentFailureClient";
import { BookingPageSkeleton } from "@/components/ui/Skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const { event } = await resolveEvent();
  if (!event) return { title: "Event Not Found" };
  return { title: `Payment Failed — ${event.title}` };
}

export default async function Page() {
  const { subdomain, event } = await resolveEvent();

  if (!event) {
    return <EventNotFound subdomain={subdomain} />;
  }

  return (
    <Suspense fallback={<BookingPageSkeleton />}>
      <PaymentFailureClient event={event} />
    </Suspense>
  );
}
