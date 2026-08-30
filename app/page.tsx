import type { Metadata } from "next";
import { resolveEvent } from "@/lib/resolve-event";
import EventWebsite from "@/components/event/EventWebsite";
import EventNotFound from "@/components/event/EventNotFound";
import { STATIC_TESTIMONIALS } from "@/lib/static-events/robotica";

export async function generateMetadata(): Promise<Metadata> {
  const { event } = await resolveEvent();
  if (!event) return { title: "Event Not Found" };

  return {
    title: event.title,
    description: event.description || event.tagline || undefined,
  };
}

export default async function Page() {
  const { subdomain, event, isStatic } = await resolveEvent();

  if (!event) {
    return <EventNotFound subdomain={subdomain} />;
  }

  // TEMPORARY: STATIC_EVENT has no backend id to fetch testimonials for —
  // see lib/resolve-event.ts and EventWebsite's `testimonials` prop.
  return <EventWebsite event={event} testimonials={isStatic ? STATIC_TESTIMONIALS : undefined} />;
}
