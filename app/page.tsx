import type { Metadata } from "next";
import { resolveEvent } from "@/lib/resolve-event";
import EventWebsite from "@/components/event/EventWebsite";
import EventNotFound from "@/components/event/EventNotFound";

export async function generateMetadata(): Promise<Metadata> {
  const { event } = await resolveEvent();
  if (!event) return { title: "Event Not Found" };

  return {
    title: event.title,
    description: event.description || event.tagline || undefined,
  };
}

export default async function Page() {
  const { subdomain, event } = await resolveEvent();

  if (!event) {
    return <EventNotFound subdomain={subdomain} />;
  }

  return <EventWebsite event={event} />;
}
