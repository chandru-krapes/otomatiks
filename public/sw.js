// Minimal service worker — exists purely to satisfy the "installable" criteria browsers check
// before offering an Add to Home Screen / Install app prompt (Chrome in particular requires a
// registered service worker with a fetch handler). See components/PwaServiceWorker.tsx for
// where this gets registered, and app/manifest.ts for the rest of the install identity.
//
// Deliberately no caching strategy: this is a live booking site — ticket availability, pricing,
// and account state all need to be current every time, so a service worker that cached
// responses would risk showing stale data instead of speeding anything up meaningfully. Every
// request is just passed straight through to the network.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
