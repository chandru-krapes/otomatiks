import type { Event } from "@/lib/types";
import BookingNotOpenNotice from "./BookingNotOpenNotice";

/**
 * Full-page shell for `/checkout` itself — the fallback for anyone who
 * lands there directly (an old link, a bookmark, no JS). The in-app flow
 * (the cart drawer's "Continue Booking" button) no longer navigates here;
 * it opens `BookingNotOpenDialog` in place instead. See that component and
 * `BookingNotOpenNotice` (the shared content both render).
 */
export default function CheckoutComingSoon({ event }: { event: Event }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-6 py-16">
      {/* Ambient ground — same blob/tech-grid language used across the site,
          hidden below `sm` for the same battery/GPU reasons as the real
          checkout page. */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden sm:block" aria-hidden="true">
        <div className="animate-blob-1 absolute -left-16 top-[8%] h-72 w-72 bg-accent/10 blur-xl" style={{ willChange: "transform", contain: "strict" }} />
        <div className="animate-blob-3 absolute right-[6%] top-[55%] h-80 w-80 bg-secondary/8 blur-xl" style={{ willChange: "transform", contain: "strict" }} />
        <div className="animate-blob-2 absolute left-[35%] bottom-[-10%] h-64 w-64 bg-primary/8 blur-xl" style={{ willChange: "transform", contain: "strict" }} />
      </div>
      <div className="tech-grid pointer-events-none absolute inset-0 z-0 opacity-40" aria-hidden="true" />

      <BookingNotOpenNotice event={event} />
    </div>
  );
}
