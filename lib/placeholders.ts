/**
 * Static copy and decorative content taken from the eVentes reference
 * screens. Used only when the backend has not supplied a real field —
 * event title, dates, speakers, tickets, etc. still come from the API.
 */

export const PLACEHOLDER = {
  eyebrow: "WHY JOIN EVENT",
  heroSubhead: "Shift your perspective on digital business",
  aboutEyebrow: "WHY JOIN EVENT",
  aboutTitle: "Why You Should Join Event",
  aboutLead: "Shift your perspective on digital business",
  aboutBody:
    "The issue with any content strategy is time. Time to sit down and think about what kind of content should be created, time to stop and write, or record, edit and publish, and time to engage with your audience to promote the content you created.",
  aboutBody2:
    "Berlin is the largest city in Germany by both area and population. Its 3,748,148 inhabitants make it the most populous city of the European Union.",
  speakersEyebrow: "THE SPEAKERS",
  speakersTitle: "Meet Our Speakers",
  sponsorsEyebrow: "OUR SPONSORS",
  sponsorsTitle: "Happy Sponsors",
  plansEyebrow: "OUR PLANS",
  plansTitle: "Get Your Ticket",
  plansBanner: "EXCLUSIVE AUTHOR",
  vatNote: "All prices exclude 25% VAT",
  ticketCta: "Buy Ticket",
  readMore: "Read More",
  sessionLorem:
    "The issue with any content strategy is time. Time to sit down and think about what kind of content should be created, time to stop and write, or record, edit and publish.",
  amenityCoffee: "Coffee & Snacks",
  amenityStream: "video Streaming",
  roleFallback: "Content Writer",
  testimonialsEyebrow: "Testimonials",
  testimonialsTitle: "Our Clients Say",
} as const;

export const DEFAULT_HIGHLIGHTS = [
  { id: "ph-1", title: "Networking", description: "Meet peers, mentors, and partners." },
  { id: "ph-2", title: "New Speaker", description: "Fresh voices and unexpected talks." },
  { id: "ph-3", title: "Food Court", description: "Coffee, snacks, and a place to recharge." },
  { id: "ph-4", title: "Have Fun", description: "Celebrate ideas with energy and play." },
] as const;
