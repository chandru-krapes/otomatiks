import { headers } from "next/headers";
import { extractSubdomain } from "./subdomain";
import { getEventBySlug } from "./api";

/**
 * Shared hostname → subdomain → event resolution used by every route.
 *
 * `pathSlug`, when given, is a TEMPORARY test-only fallback: a deployment
 * that can't give itself a real subdomain (a bare Vercel preview URL,
 * `localhost:3000`) has no subdomain to resolve, so `app/[slug]/page.tsx`
 * passes the `/robotica`-style path segment here instead and this tries it
 * as an event slug once the subdomain lookup comes up empty. Remove that
 * param (and `app/[slug]/page.tsx`) once the test deployment is torn down —
 * every other caller of `resolveEvent()` is unaffected.
 */
export async function resolveEvent(pathSlug?: string) {
  const headersList = await headers();
  const host = headersList.get("host");
  const subdomain = extractSubdomain(host);
  let event = subdomain ? await getEventBySlug(subdomain) : null;

  if (!event && pathSlug) {
    event = await getEventBySlug(pathSlug);
  }

  return { subdomain, event };
}
