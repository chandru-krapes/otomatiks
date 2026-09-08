"use client";

import { useEffect } from "react";

/**
 * Registers the install-only service worker (public/sw.js) once on mount. Renders nothing —
 * this is pure side effect, mounted once in the root layout so it runs on every route, not
 * just the event page (the account/admin/checkout routes are just as installable).
 *
 * Feature-detected and best-effort: an older browser with no `serviceWorker` API, or a
 * registration that fails for any reason, just means no install prompt — never a broken site.
 */
export default function PwaServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  }, []);

  return null;
}
