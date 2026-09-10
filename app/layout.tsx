import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Baloo_2 } from "next/font/google";
import { CartProvider } from "@/components/booking/CartProvider";
import PwaServiceWorker from "@/components/PwaServiceWorker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// A bold, rounded display face for headings — gives the site a distinct,
// friendly personality (this audience skews toward student/youth events)
// without touching body-copy legibility.
const displayFont = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  // Both routes override these via `generateMetadata` once the subdomain's
  // event resolves; this is only the fallback for a request that never gets
  // that far (an unmatched path, or an unresolvable subdomain).
  title: "Otomatiks Events",
  description: "Robotics and technology events, workshops and competitions by Otomatiks.",
  // `app/manifest.ts` is auto-linked by Next.js (no explicit `manifest:` field needed) — this
  // covers Android/Chrome's "Install app" prompt. iOS Safari doesn't support that manifest at
  // all for its own "Add to Home Screen": it only ever reads `apple-touch-icon` (below) and the
  // `appleWebApp` block. `generateMetadata` on the event page overrides `apple` with the
  // resolved event's own logo when it has one — this generic icon only shows for the apex
  // domain or an event with no logo uploaded yet.
  icons: { icon: "/icons/app-icon.svg", apple: "/icons/app-icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Otomatiks Events" },
};

/** Tints mobile browser chrome to the brand blue (`--primary`). */
export const viewport: Viewport = {
  themeColor: "#066aab",
  colorScheme: "light",
  // Without this, Android Chrome's default is `resizes-content`: opening the on-screen keyboard
  // shrinks the actual layout viewport (`window.innerHeight`), not just the visible area. Every
  // floating/positioned element on the page (any `components/ui/Select.tsx` search-filter
  // dropdown, DatePicker, ...) uses floating-ui under the hood, which watches for exactly that
  // resize and recomputes position/collision against the new, keyboard-shrunk boundary — with a
  // fixed-height panel and a trigger low on the page, that recompute routinely finds nowhere
  // sane to fit and the panel collapses/moves off-screen, reading as "the dropdown closed" even
  // though nothing ever set its React `open` state to false (iOS Safari never had this problem:
  // it always overlays the keyboard instead of resizing the layout viewport). `overlays-content`
  // opts into that same overlay behavior on Android too, so the layout viewport — and therefore
  // every floating element's positioning math — stays untouched by the keyboard opening at all.
  interactiveWidget: "overlays-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Root layout, not the event page — so cart state survives
            client-side navigation between the event page and /checkout
            without a localStorage round-trip (see CartProvider). */}
        <CartProvider>{children}</CartProvider>
        <PwaServiceWorker />
      </body>
    </html>
  );
}
