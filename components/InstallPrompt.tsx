"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";

/**
 * The visible "Install this app" call-to-action — separate from PwaServiceWorker.tsx (which
 * only registers the service worker; installability is a *prerequisite* for this, not the
 * thing that shows a prompt).
 *
 * Chrome no longer shows its own automatic install banner for most sites on its own — as of
 * Chrome 105+, a site has to capture `beforeinstallprompt` itself and drive the native install
 * dialog from its own UI, or a mobile visitor gets no visible install affordance at all beyond
 * the browser's own 3-dot menu ("Install app"), which almost nobody finds unprompted. This is
 * that UI: it captures the deferred event, shows a small branded banner, and calls `.prompt()`
 * (the actual OS-level "Install this app?" dialog) only when the visitor taps "Install".
 *
 * iOS Safari has no `beforeinstallprompt` API at all — there is no programmatic way to trigger
 * its "Add to Home Screen" from a website. The best this can do there is a one-time instructional
 * nudge toward the manual Share-sheet flow, shown instead of an "Install" button.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_STORAGE_KEY = "otomatiks:install-prompt-dismissed-at";
// A visitor who dismisses this shouldn't see it again on every single page load for a while —
// but should eventually see it again (a new feature, a returning visitor weeks later), rather
// than being permanently opted out from one tap.
const DISMISS_COOLDOWN_DAYS = 14;
// The console/portal routes have their own audience (staff, onboarded institutes) — nudging them
// to "install our ticket-booking site" reads as noise there, not a courtesy.
const EXCLUDED_PATH_PREFIXES = ["/admin", "/institute"];

function recentlyDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (Number.isNaN(dismissedAt)) return false;
    return (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24) < DISMISS_COOLDOWN_DAYS;
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
  } catch {
    // Storage unavailable (private mode, blocked) — the banner just reappears next load, no crash.
  }
}

function isStandalone(): boolean {
  // `navigator.standalone` is iOS Safari's own non-standard flag — not in the DOM lib types,
  // hence the cast — for when the site is already running as an installed home-screen app there.
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function InstallPrompt() {
  const pathname = usePathname();

  // Computed once, lazily, on mount rather than inside an effect — matchMedia/localStorage
  // aren't available during server rendering, and their result for a given device doesn't
  // change over this component's lifetime, so there's nothing to keep re-checking.
  const [skipEntirely] = useState(() => {
    try {
      return isStandalone() || recentlyDismissed();
    } catch {
      // matchMedia/localStorage threw (very old browser, locked-down environment) — skip
      // entirely rather than risk a crash over a non-essential banner.
      return true;
    }
  });
  const [showIOSHint] = useState(() => !skipEntirely && isIOS());

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (skipEntirely) return;
    let cancelled = false;

    function handleBeforeInstallPrompt(event: Event) {
      // Stops Chrome's own (easy-to-miss, timing-controlled-by-the-browser) mini-infobar from
      // appearing on top of this — this component is now what decides when/how to ask.
      event.preventDefault();
      if (!cancelled) setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    function handleAppInstalled() {
      if (cancelled) return;
      setDeferredPrompt(null);
      markDismissed();
    }
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [skipEntirely]);

  function handleDismiss() {
    setDismissed(true);
    markDismissed();
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }

  const excluded = EXCLUDED_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
  if (excluded || dismissed || (!deferredPrompt && !showIOSHint)) return null;

  return (
    <div
      role="dialog"
      aria-label="Install this app"
      className="animate-pop-in fixed inset-x-4 bottom-4 z-[80] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-hairline-strong bg-white px-4 py-3 shadow-[var(--elev-3)] sm:inset-x-auto sm:right-4"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a small, already-optimized local
          asset, not a page-content image next/image's loader pipeline is meant for. */}
      <img src="/icons/icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-primary">Install this app</p>
        <p className="mt-0.5 text-xs text-muted">
          {deferredPrompt
            ? "Add it to your home screen for quick, full-screen access."
            : 'Tap the Share icon, then "Add to Home Screen".'}
        </p>
      </div>
      {deferredPrompt && (
        <Button size="sm" variant="primary" loading={installing} onClick={handleInstall} className="shrink-0">
          Install
        </Button>
      )}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="focus-ring press flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary/8 hover:text-primary"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
