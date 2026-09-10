"use client";

import { useEffect } from "react";

/**
 * Restores "scroll the focused field into view when the keyboard opens" — a trade-off of
 * `interactiveWidget: "overlays-content"` (app/layout.tsx): that setting keeps the on-screen
 * keyboard from resizing the layout viewport (which used to break every floating dropdown's
 * position — see components/ui/Select.tsx), but the browser's own "auto-scroll the focused input
 * above the keyboard" behavior is tied to *that same* layout-viewport resize. With it disabled,
 * nothing scrolls the page at all when the keyboard covers whatever the visitor just tapped into
 * — it just sits there hidden behind the keyboard with no way to see what's being typed.
 *
 * The Visual Viewport API still fires a `resize` event when the keyboard opens/closes (it's the
 * *visual* viewport shrinking, even though the *layout* viewport isn't) — this listens for that
 * and, if a text field currently has focus, scrolls it back into the now-smaller visible area.
 */

const FOCUSABLE_SELECTOR = "input, textarea, select, [contenteditable='true']";

function scrollFocusedIntoView(target: EventTarget | null) {
  if (!(target instanceof HTMLElement) || !target.matches(FOCUSABLE_SELECTOR)) return;
  target.scrollIntoView({ block: "center", behavior: "smooth" });
}

export default function KeyboardScrollFix() {
  useEffect(() => {
    const viewport = window.visualViewport;

    // Two independent triggers, not one — relying on `visualViewport.resize` alone missed cases
    // where the field was already scrolled near-correctly (a small viewport shrink can fire a
    // negligible resize) or where a browser fires it later than the keyboard's own animation, so
    // the field visibly sat behind the keyboard for a beat before catching up. `focusin` fires the
    // instant the tap lands — before the keyboard has even started animating in — so it's paired
    // with a delay long enough to clear most on-screen-keyboard open animations; the
    // `visualViewport` listener then re-corrects afterwards for whatever that first guess missed
    // (keyboard height varies by device/app, e.g. with predictive text bars).
    function handleFocusIn(event: FocusEvent) {
      const target = event.target;
      window.setTimeout(() => scrollFocusedIntoView(target), 300);
    }

    function handleViewportResize() {
      // A beat after the resize event, not synchronously with it — the keyboard's own show
      // animation is still mid-flight when `resize` first fires, and scrolling immediately
      // measures the field's position against a viewport that hasn't finished settling yet.
      requestAnimationFrame(() => scrollFocusedIntoView(document.activeElement));
    }

    document.addEventListener("focusin", handleFocusIn);
    viewport?.addEventListener("resize", handleViewportResize);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      viewport?.removeEventListener("resize", handleViewportResize);
    };
  }, []);

  return null;
}
