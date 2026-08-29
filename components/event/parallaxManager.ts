"use client";

/**
 * Shared scroll-parallax scheduler.
 *
 * Every <Parallax> instance used to add its own `scroll` listener and call
 * `getBoundingClientRect()` inside its own rAF callback. With several ghost
 * headings + background flourishes on one page that meant many independent
 * listeners each forcing a layout read on every scroll tick (read/write
 * interleaved across components), which is what made scrolling feel janky.
 *
 * This module keeps one scroll listener and one rAF loop for the whole page,
 * skips elements that are nowhere near the viewport (via IntersectionObserver),
 * and batches all `getBoundingClientRect()` reads before writing any
 * `transform`, so layout is read once per frame instead of thrashing.
 */

type Anchor = "top" | "center";

type ParallaxItem = {
  speed: number;
  anchor: Anchor;
};

const items = new Map<HTMLElement, ParallaxItem>();
const active = new Set<HTMLElement>();
let observer: IntersectionObserver | null = null;
let ticking = false;
let bound = false;

function applyFrame() {
  ticking = false;
  if (active.size === 0) return;

  const viewportHeight = window.innerHeight;

  // Batch all reads first to avoid forced-reflow thrashing.
  const writes: { node: HTMLElement; offset: number }[] = [];
  active.forEach((node) => {
    const item = items.get(node);
    if (!item) return;
    const rect = node.getBoundingClientRect();
    const rest = item.anchor === "center" ? (viewportHeight - rect.height) / 2 : 0;
    const offset = (rect.top - rest) * item.speed;
    writes.push({ node, offset });
  });

  // Then batch all writes.
  for (const { node, offset } of writes) {
    node.style.transform = `translate3d(0, ${offset}px, 0)`;
  }
}

function requestFrame() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(applyFrame);
}

function ensureObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) active.add(entry.target as HTMLElement);
        else active.delete(entry.target as HTMLElement);
      }
      requestFrame();
    },
    { rootMargin: "25% 0px" }
  );
  return observer;
}

function bindListeners() {
  if (bound) return;
  bound = true;
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame, { passive: true });
}

export function registerParallax(node: HTMLElement, speed: number, anchor: Anchor) {
  items.set(node, { speed, anchor });
  bindListeners();
  ensureObserver()!.observe(node);
  requestFrame();

  return () => {
    items.delete(node);
    active.delete(node);
    observer?.unobserve(node);
  };
}
