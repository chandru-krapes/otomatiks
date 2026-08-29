import type { Event, NavLink } from "./types";

/**
 * @param hasTestimonials Whether the platform-wide `/testimonials/` fetch
 * returned anything — not part of `Event`, so it can't be read off `event`
 * like the other section guards below, and has to be passed in.
 */
export function buildNavLinks(event: Event, hasTestimonials = false): NavLink[] {
  if (event.nav_links && event.nav_links.length > 0) return event.nav_links;

  // EventCategories.tsx (the "#event" section) and Tickets.tsx (the "#tickets"
  // section) are two different views of the same `ticket_types` array, so
  // they share this guard.
  const hasTickets = Boolean(event.ticket_types?.length);
  const hasSponsors = Boolean(event.sponsors?.length);
  const hasSpeakers = Boolean(event.speakers?.length);
  const hasGallery = Boolean(event.gallery_items?.length);
  // Matches the guard in components/event/Schedule.tsx: a day with no items
  // renders nothing, so it shouldn't earn a nav link either.
  const hasSchedule = Boolean(event.schedule?.some((day) => day.items && day.items.length > 0));

  return (
    [
      { label: "Home", href: "#top" },
      { label: "About", href: "#about" },
      hasTickets && { label: "Categories", href: "#event" },
      hasGallery && { label: "Gallery", href: "#gallery" },
      hasSchedule && { label: "Schedule", href: "#schedule" },
      hasSpeakers && { label: "Speakers", href: "#speakers" },
      hasSponsors && { label: "Sponsors", href: "#sponsors" },
      hasTestimonials && { label: "Testimonials", href: "#testimonials" },
      hasTickets && { label: "Tickets", href: "#tickets" },
      { label: "Venue", href: "#contact" },
    ] as (NavLink | false)[]
  ).filter((link): link is NavLink => Boolean(link));
}
