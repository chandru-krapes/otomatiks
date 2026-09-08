import type { Metadata } from "next";
import { resolveEvent } from "@/lib/resolve-event";
import { resolveMediaUrl } from "@/lib/api";
import EventWebsite from "@/components/event/EventWebsite";
import EventNotFound from "@/components/event/EventNotFound";

export async function generateMetadata(): Promise<Metadata> {
  const { event } = await resolveEvent();
  if (!event) return { title: "Event Not Found" };

  // iOS Safari's own "Add to Home Screen" reads `apple-touch-icon` directly, not
  // app/manifest.ts (which it ignores) — an event with its own uploaded logo gets that as its
  // install icon instead of the generic fallback set in the root layout.
  const logo = resolveMediaUrl(event.logo);

  return {
    title: event.title,
    description: event.description || event.tagline || undefined,
    ...(logo ? { icons: { apple: logo } } : {}),
  };
}

export default async function Page() {
  const { subdomain, event } = await resolveEvent();

  if (!event) {
    return <EventNotFound subdomain={subdomain} />;
  }

  return <EventWebsite event={event} />;
}
