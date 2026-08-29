import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Baloo_2 } from "next/font/google";
import { CartProvider } from "@/components/booking/CartProvider";
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
};

/** Tints mobile browser chrome to the brand blue (`--primary`). */
export const viewport: Viewport = {
  themeColor: "#066aab",
  colorScheme: "light",
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
      </body>
    </html>
  );
}
