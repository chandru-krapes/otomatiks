// Minimal service worker — exists purely to satisfy the "installable" criteria browsers check
// before offering an Add to Home Screen / Install app prompt (Chrome in particular requires a
// registered service worker with a *registered* fetch handler — it doesn't need to actually do
// anything with each event). See components/PwaServiceWorker.tsx for where this gets registered,
// and app/manifest.ts for the rest of the install identity.
//
// Deliberately no caching strategy: this is a live booking site — ticket availability, pricing,
// and account state all need to be current every time, so a service worker that cached
// responses would risk showing stale data instead of speeding anything up meaningfully.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Deliberately does *not* call `event.respondWith(fetch(event.request))` — that used to be here,
// re-issuing every request through the service worker for no functional benefit (no caching, no
// modification), and it's strictly *less* reliable than doing nothing: that extra fetch() call
// can itself fail independently of the original request (a dev-server HMR reload mid-request, a
// flaky mobile connection, a request whose body already got consumed) and rejects the promise
// `respondWith` was given, which the browser then renders as a hard page-load network error -
// "The FetchEvent ... resulted in a network error response" - instead of the transient hiccup it
// actually was. Registering the listener with an empty body is enough to satisfy installability;
// every request then falls through to the browser's own normal, already-in-flight handling.
self.addEventListener("fetch", () => {});
