import { cookies, headers } from "next/headers";
import { extractSubdomain } from "./subdomain";
import { getEventBySlug } from "./api";

// TEMPORARY, see the fallback chain below and middleware.ts.
const TEST_SLUG_COOKIE = "otm_test_slug";

/**
 * Shared hostname → subdomain → event resolution used by every route.
 *
 * `pathSlug`, when given, is a TEMPORARY test-only fallback: a deployment
 * that can't give itself a real subdomain (a bare Vercel preview URL,
 * `localhost:3000`) has no subdomain to resolve, so `app/[slug]/page.tsx`
 * passes the `/robotica`-style path segment here instead and this tries it
 * as an event slug once the subdomain lookup comes up empty.
 *
 * Failing that, it falls back to the `otm_test_slug` cookie that
 * `middleware.ts` stamps when you land on `/robotica` — so pages reached by
 * an in-app link rather than a URL that carries the slug (`/checkout`,
 * `/book/[ticketId]`, `/bookings/[reference]`, …) keep resolving the same
 * test event. Remove `pathSlug`, this cookie fallback, `middleware.ts`, and
 * `app/[slug]/page.tsx` together once the test deployment is torn down —
 * every real (subdomain) request is untouched by any of this.
 */
export async function resolveEvent(pathSlug?: string) {
  const headersList = await headers();
  const host = headersList.get("host");
  const subdomain = extractSubdomain(host);
  let event = subdomain ? await getEventBySlug(subdomain) : null;

  if (!event && pathSlug) {
    event = await getEventBySlug(pathSlug);
  }

  if (!event && !subdomain && !pathSlug) {
    const cookieSlug = (await cookies()).get(TEST_SLUG_COOKIE)?.value;
    if (cookieSlug) event = await getEventBySlug(cookieSlug);
  }

  return { subdomain, event };
}
