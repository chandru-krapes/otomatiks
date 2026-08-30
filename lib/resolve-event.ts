import { headers } from "next/headers";
import { extractSubdomain } from "./subdomain";
import { getEventBySlug } from "./api";
import { STATIC_EVENT } from "./static-events/robotica";

/**
 * TEMPORARY: hosts that have no subdomain of their own to resolve a real
 * event from — a bare Vercel preview URL, local dev, and (until it gets a
 * real per-event subdomain wired up) the apex `otomatiks.app` itself. These
 * get `STATIC_EVENT` (see `lib/static-events/robotica.ts`) without ever
 * calling the backend. Every real subdomain (`robotica.otomatiks.app`,
 * `novaris.otomatiks.app`, …) is untouched — `extractSubdomain` reads a
 * genuine subdomain off those, so they never reach this list and keep
 * hitting `getEventBySlug` exactly as before.
 *
 * `otomatiks-six.vercel.app` is listed explicitly (rather than matched by
 * pattern) because it parses as if "otomatiks-six" were a subdomain —
 * same three-label shape as `robotica.otomatiks.app` — even though no event
 * will ever resolve for it.
 *
 * Remove this whole mechanism (this set, the branch below, and
 * `lib/static-events/robotica.ts`) once the apex domain has a real
 * backend-resolvable event of its own.
 */
const MAIN_DOMAIN_HOSTS = new Set(["otomatiks.app", "www.otomatiks.app", "otomatiks-six.vercel.app"]);

/** Shared hostname → subdomain → event resolution used by every route. */
export async function resolveEvent() {
  const headersList = await headers();
  const host = headersList.get("host");
  const hostname = host?.split(":")[0].trim().toLowerCase();
  const subdomain = extractSubdomain(host);

  if (!subdomain || MAIN_DOMAIN_HOSTS.has(hostname ?? "")) {
    // TEMPORARY, see MAIN_DOMAIN_HOSTS above — no backend call here at all.
    return { subdomain: null, event: STATIC_EVENT, isStatic: true as const };
  }

  const event = await getEventBySlug(subdomain);
  return { subdomain, event, isStatic: false as const };
}
