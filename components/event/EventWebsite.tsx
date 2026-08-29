import type { CSSProperties } from "react";
import type { Event } from "@/lib/types";
import { buildNavLinks } from "@/lib/nav";
import { listTestimonials } from "@/lib/api";
import Header from "./Header";
import Hero from "./Hero";
import About from "./About";
import EventCategories from "./EventCategories";
import EventDetails from "./EventDetails";
import Gallery from "./Gallery";
import Schedule from "./Schedule";
import Speakers from "./Speakers";
import Sponsors from "./Sponsors";
import Testimonials from "./Testimonials";
import Tickets from "./Tickets";
import Venue from "./Venue";
import Registration from "./Registration";
import Footer from "./Footer";
import Reveal from "./Reveal";
import BackToTop from "./BackToTop";
import CartDrawer from "@/components/booking/CartDrawer";

/**
 * Section order and page rhythm.
 *
 * The sections alternate ground colour (see `.section-tint` / `.section-warm`
 * in globals.css, applied inside each section) so the page reads as a
 * sequence of bands rather than one continuous white field. Reveal variants
 * alternate direction for the same reason — a page where every section
 * arrives from below feels mechanical by the third one.
 */
export default async function EventWebsite({ event }: { event: Event }) {
  // Not part of the resolved `Event` payload — a separate endpoint (see
  // lib/api.ts `listTestimonials`). Fetched here (not inside
  // Testimonials.tsx itself) so buildNavLinks can also see whether there's
  // anything to link to.
  const testimonials = await listTestimonials(event.id);
  const navLinks = buildNavLinks(event, testimonials.length > 0);
  const style = event.theme_color ? ({ "--accent": event.theme_color } as CSSProperties) : undefined;

  return (
    <div style={style} className="flex min-h-screen flex-col bg-background">
      <Header event={event} navLinks={navLinks} />
      {/* `id` is the skip link's target (see Header.tsx). */}
      <main id="main" className="route-transition relative flex-1 overflow-x-hidden">
        {/*
          Global background blobs — fixed, so they stay compositor-only and
          never repaint on scroll. Ambient depth only, so it doesn't need
          many of them: this used to be six, running for the entire page's
          lifetime regardless of scroll position — six permanently-animated,
          permanently-composited large blurred layers is real, constant GPU
          work that adds up on anything but a high-end device, and was a
          steady contributor to the site feeling hangy. Three covers the
          same visual intent (top/middle/bottom of the page) at half the
          cost, with a lighter blur radius so each one is cheaper to
          rasterize too. Hidden below `sm` outright — a phone is the
          device this permanently-animated cost hits hardest (weaker GPU,
          battery-constrained), and there's no spare whitespace on that
          layout for "ambient depth" to register in anyway.
        */}
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
      <BackToTop />
      {/* Only on the main event page — a floating "your ticket cart"
          control has no place on /checkout (it *is* the cart) or the
          account routes. Same precedent as BackToTop above. */}
      <CartDrawer />
    </div>
  );
}
