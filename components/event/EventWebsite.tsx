import type { CSSProperties } from "react";
import type { Event, Testimonial } from "@/lib/types";
import { buildNavLinks } from "@/lib/nav";
import { listTestimonials } from "@/lib/api";
import Header from "./Header";
import Hero from "./Hero";
import About from "./About";
import FounderMessage from "./FounderMessage";
import EventCategories from "./EventCategories";
import EventDetails from "./EventDetails";
import Gallery from "./Gallery";
import Schedule from "./Schedule";
import Speakers from "./Speakers";
import Sponsors from "./Sponsors";
import Testimonials from "./Testimonials";
import WhatYouGet from "./WhatYouGet";
import Tickets from "./Tickets";
import Venue from "./Venue";
import Registration from "./Registration";
import Footer from "./Footer";
import Reveal from "./Reveal";
import FunnelViewTracker from "./FunnelViewTracker";
import CartDrawer from "@/components/booking/CartDrawer";

// Section order and page rhythm for the event website
export default async function EventWebsite({
  event,
  testimonials: testimonialsOverride,
}: {
  event: Event;
  /** Set by the static-snapshot path (lib/resolve-event.ts, the main/apex domain) to skip the
   * live fetch below entirely — `null`/`undefined` (every real subdomain) fetches as before. */
  testimonials?: Testimonial[] | null;
}) {
  const testimonials = testimonialsOverride ?? (await listTestimonials(event.id));
  const navLinks = buildNavLinks(event, testimonials.length > 0);
  const style = event.theme_color ? ({ "--accent": event.theme_color } as CSSProperties) : undefined;

  return (
    <div style={style} className="flex min-h-screen flex-col bg-background">
      <FunnelViewTracker eventId={event.id} />
      <Header event={event} navLinks={navLinks} />
      <main id="main" className="route-transition relative flex-1 overflow-x-hidden">
      {/* Global background blobs for the event website */}
        <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden sm:block" aria-hidden="true">
          <div className="animate-blob-1 absolute -left-20 top-[10%] h-64 w-64 bg-accent/10 blur-xl will-change-transform" style={{ contain: "strict" }} />
          <div className="animate-blob-3 absolute left-[10%] top-[45%] h-72 w-72 bg-primary/8 blur-xl will-change-transform" style={{ contain: "strict" }} />
          <div className="animate-blob-2 absolute -right-16 top-[80%] h-64 w-64 bg-secondary/8 blur-xl will-change-transform" style={{ contain: "strict" }} />
        </div>

        <div className="relative z-10">
          <Hero event={event} />

          <Reveal variant="fade">
            <EventDetails event={event} />
          </Reveal>

          <Reveal>
            <EventCategories event={event} />
          </Reveal>

          <Reveal variant="left">
            <About />
          </Reveal>

          <Reveal variant="right">
            <FounderMessage founderMessage={event.founder_message} />
          </Reveal>

          <Reveal variant="scale">
            <Gallery event={event} />
          </Reveal>

          <Reveal>
            <Schedule event={event} />
          </Reveal>

          <Reveal>
            <Speakers event={event} />
          </Reveal>

          <Reveal variant="fade">
            <Sponsors event={event} />
          </Reveal>

          <Reveal>
            <Testimonials testimonials={testimonials} />
          </Reveal>

          <Reveal variant="scale">
            <WhatYouGet event={event} />
          </Reveal>

          <Reveal>
            <Tickets event={event} />
          </Reveal>

          <Reveal variant="right">
            <Venue event={event} />
          </Reveal>

          <Reveal variant="scale">
            <Registration event={event} />
          </Reveal>
        </div>
      </main>
      <Footer event={event} navLinks={navLinks} />
      <CartDrawer />
    </div>
  );
}
