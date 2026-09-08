import type { MetadataRoute } from "next";
import { resolveEvent } from "@/lib/resolve-event";
import { resolveMediaUrl } from "@/lib/api";

/**
 * Next.js's special `app/manifest.ts` convention: this is served at
 * `/manifest.webmanifest` and auto-linked into every page's `<head>` — no manual
 * `<link rel="manifest">` needed (see app/layout.tsx).
 *
 * Dynamic per subdomain, not a static file — `resolveEvent()` reads the request's host the
 * same way every page here does, so "Add to Home Screen" on `robotica.otomatiks.app` installs
 * an app named/coloured/iconed for Robotica, not a generic "Otomatiks" shell. This isn't the
 * "branching UI on which event resolved" AGENTS.md warns against — it's the same kind of
 * per-event content `generateMetadata` (app/page.tsx) already varies the page `<title>` on.
 *
 * Falls back to a generic identity for the main/apex domain (no event to resolve there) or any
 * subdomain that doesn't currently resolve to a published event.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { event } = await resolveEvent();

  const name = event?.title ?? "Otomatiks Events";
  const logo = event ? resolveMediaUrl(event.logo) : null;

  return {
    name,
    // Home-screen labels truncate hard past ~12 chars on Android - better a clean cut than the
    // OS deciding where to ellipsize.
    short_name: name.length > 12 ? `${name.slice(0, 11)}…` : name,
    description:
      event?.description || event?.tagline || "Robotics and technology events, workshops and competitions by Otomatiks.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: event?.theme_color || "#066aab",
    icons: [
      // The event's own uploaded logo, when there is one — omitting `sizes`/`type` since an
      // arbitrary upload's real dimensions and format aren't known here; browsers probe the
      // file itself rather than trusting a guessed value.
      ...(logo ? [{ src: logo, sizes: "any" as const }] : []),
      // Always included too, so an event with no logo yet (or a browser that skips the entry
      // above) still gets a real icon instead of a blank/default one.
      { src: "/icons/app-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
