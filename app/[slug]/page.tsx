import type { Metadata } from "next";
import { resolveEvent } from "@/lib/resolve-event";
import EventWebsite from "@/components/event/EventWebsite";
import EventNotFound from "@/components/event/EventNotFound";

/**
 * TEMPORARY test route: mirrors `app/page.tsx` but resolves the event from
 * the path segment (`/robotica`) instead of a subdomain, for deployments
 * that don't have one to resolve (a Vercel preview URL, `localhost:3000`).
 * Next.js only falls through to this dynamic segment when nothing else
 * matches, so it never shadows the real static routes (`/checkout`,
 * `/book`, `/community`, `/admin`, …). Delete this file (and the
 * `pathSlug` param on `resolveEvent`) once the test deployment goes away.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { event } = await resolveEvent(slug);
  if (!event) return { title: "Event Not Found" };

  return {
    title: event.title,
    description: event.description || event.tagline || undefined,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { subdomain, event } = await resolveEvent(slug);

  if (!event) {
    return <EventNotFound subdomain={subdomain ?? slug} />;
  }

  return <EventWebsite event={event} />;
}
