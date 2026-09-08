import { headers } from "next/headers";
import { extractSubdomain } from "./subdomain";
import { getEventBySlug } from "./api";

/**
 * Hosts with no per-event subdomain of their own — the apex/main domain,
 * plus its local-dev and Vercel-preview equivalents. None of these have an
 * event to resolve, so they all get "not found" without ever calling the
 * backend.
 *
 * `otomatiks-six.vercel.app` is listed explicitly (rather than matched by
 * pattern) because it parses as if "otomatiks-six" were a subdomain —
 * same three-label shape as `robotica.otomatiks.app` — even though no event
 * will ever resolve for it.
 *
 * Every real subdomain (`robotica.otomatiks.app`, `robotica.localhost`,
 * `novaris.otomatiks.app`, …) is untouched — `extractSubdomain` reads a
 * genuine subdomain off those, so they never reach this set and keep
 * hitting `getEventBySlug` exactly as before.
 */
const MAIN_DOMAIN_HOSTS = new Set([
  "otomatiks.app",
  "www.otomatiks.app",
  "otomatiks-six.vercel.app",
  "localhost",
]);

/** Shared hostname → subdomain → event resolution used by every route. */
export async function resolveEvent() {
  const headersList = await headers();
  const host = headersList.get("host");
  const hostname = host?.split(":")[0].trim().toLowerCase();
  const subdomain = extractSubdomain(host);

  if (!subdomain || MAIN_DOMAIN_HOSTS.has(hostname ?? "")) {
    // No per-event subdomain here — no backend call, no event.
    return { subdomain: null, event: null };
  }

  const event = await getEventBySlug(subdomain);
  return { subdomain, event };
}
