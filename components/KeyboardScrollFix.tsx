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

export default function KeyboardScrollFix() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function handleResize() {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !active.matches(FOCUSABLE_SELECTOR)) return;
      // A beat after the resize event, not synchronously with it — the keyboard's own show
      // animation is still mid-flight when `resize` first fires, and scrolling immediately
      // measures the field's position against a viewport that hasn't finished settling yet.
      requestAnimationFrame(() => {
        active.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    }

    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

  return null;
}
