import { headers } from "next/headers";
import { extractSubdomain } from "./subdomain";
import { getEventBySlug } from "./api";
import { STATIC_EVENT, STATIC_TESTIMONIALS } from "./static-events/robotica";

/**
 * Hosts with no per-event subdomain of their own — the apex/main domain,
 * plus its local-dev and Vercel-preview equivalents. These get a frozen
 * snapshot of the real "robotica" event (`lib/static-events/robotica.ts`)
 * instead of ever calling the backend — this is what lets the main domain be
 * demoed on Vercel (or shown to a client) with zero dependency on the Django
 * server being reachable at all.
 *
 * `otomatiks-six.vercel.app` is listed explicitly (rather than matched by
 * pattern) because it parses as if "otomatiks-six" were a subdomain —
 * same three-label shape as `robotica.otomatiks.app` — even though no event
 * will ever resolve for it.
 *
 * Every real subdomain (`robotica.otomatiks.app`, `robotica.localhost`,
 * `novaris.otomatiks.app`, …) is completely untouched — `extractSubdomain`
 * reads a genuine subdomain off those, so they never reach this set and keep
 * hitting `getEventBySlug` live exactly as before, static Robotica snapshot
 * or not.
 */
const MAIN_DOMAIN_HOSTS = new Set([
  "otomatiks.app",
  "www.otomatiks.app",
  "otomatiks-six.vercel.app",
  "localhost",
]);

/**
 * Shared hostname → subdomain → event resolution used by every route.
 * `testimonials` is only ever set (to the static snapshot's own) for the
 * main-domain/static-event path above — `null` on every real subdomain,
 * telling `EventWebsite` to fetch them live from the backend itself, exactly
 * as it always has.
 */
export async function resolveEvent() {
  const headersList = await headers();
  const host = headersList.get("host");
  const hostname = host?.split(":")[0].trim().toLowerCase();
  const subdomain = extractSubdomain(host);

  if (!subdomain || MAIN_DOMAIN_HOSTS.has(hostname ?? "")) {
    return { subdomain: null, event: STATIC_EVENT, testimonials: STATIC_TESTIMONIALS };
  }

  const event = await getEventBySlug(subdomain);
  return { subdomain, event, testimonials: null };
}
