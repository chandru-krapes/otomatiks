import { NextResponse, type NextRequest } from "next/server";

/**
 * TEMPORARY test-only middleware. On a real deployment the event comes from
 * the subdomain, so a page like `/checkout` doesn't need to know which
 * event it's for — `resolveEvent()` gets it from the `Host` header. A
 * subdomain-less test host (`localhost:3000`, a bare Vercel preview URL)
 * has no way to do that, which is what `app/[slug]/page.tsx` and
 * `resolveEvent`'s `pathSlug` param work around for the event's own page —
 * but `/checkout`, `/book/[ticketId]`, `/bookings/[reference]` etc. are
 * reached by an in-app link, not a URL that carries the slug.
 *
 * So: whenever a subdomain-less request hits a bare top-level path that
 * isn't one of this app's real static routes, treat it as `/<eventSlug>`
 * and remember that slug in a cookie. `resolveEvent()` reads the cookie as
 * a last-resort fallback, so the rest of the site keeps working once
 * you've landed on `/robotica` once.
 *
 * Delete this file (and the cookie fallback in `lib/resolve-event.ts`) once
 * the test deployment is torn down — every real (subdomain) request is
 * untouched by this.
 *
 * Deliberately doesn't gate on `extractSubdomain()` being null: a bare
 * Vercel preview URL (`otomatiks-six.vercel.app`) has three dot-separated
 * labels just like a real `robotica.otomatiks.com` would, so
 * `extractSubdomain` reads "otomatiks-six" back as if it were a subdomain
 * even though no event will ever resolve for it. Stamping the cookie
 * unconditionally is harmless either way — `resolveEvent()` only reads it
 * once its own subdomain lookup has already come up empty.
 */
const RESERVED_TOP_LEVEL_PATHS = new Set([
  "admin", "book", "bookings", "checkout", "community", "dashboard",
  "forgot-password", "login", "my-registration", "payment",
  "reset-password", "verify-email", "favicon.ico",
]);

const TEST_SLUG_COOKIE = "otm_test_slug";

export function middleware(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  if (segments.length === 1 && !RESERVED_TOP_LEVEL_PATHS.has(segments[0])) {
    const response = NextResponse.next();
    response.cookies.set(TEST_SLUG_COOKIE, segments[0], { path: "/", sameSite: "lax" });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static assets — no point stamping the cookie
  // (or even running this) for them.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
