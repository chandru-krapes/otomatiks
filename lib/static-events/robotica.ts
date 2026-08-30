import type { Event, Testimonial } from "@/lib/types";

/**
 * One-time frozen snapshot of the real "robotica" event (fetched from the
 * live backend on 2026-08-30 — `GET /events/1/`, `/events/1/ticket-types/`,
 * `/events/1/testimonials/`), used ONLY as a placeholder for a host that
 * has no subdomain of its own to resolve an event from — a bare Vercel
 * preview URL, `localhost`, or the apex `otomatiks.app` before it's wired
 * up to a real per-event subdomain. Real subdomains
 * (`robotica.otomatiks.app`, `novaris.otomatiks.app`, …) are completely
 * unaffected by this file — `lib/resolve-event.ts` only reaches for it once
 * it's already established the request isn't one of those, and every such
 * request keeps hitting the live backend via `getEventBySlug` exactly as
 * before.
 *
 * Every image/video URL below is copied verbatim from that live response
 * (R2-hosted uploads, plus whichever stock URLs were configured on the
 * ticket types) — nothing here is re-fetched or proxied at request time.
 *
 * Remove this file (and its use in `lib/resolve-event.ts`) once the bare/
 * apex domain has a real backend-resolvable event of its own.
 */
export const STATIC_EVENT: Event = {
  id: 1,
  title: "Robotica",
  slug: "robotica",
  short_description: "",
  description:
    "Robotica is a national-level robotics competition organized by Otomatiks, aimed at fostering innovation in robotics and AI among students. Participants compete in various events like Robo Race, Robo Sumo, working model exhibitions, and workshops. The event provides hands-on learning, expert talks, and networking opportunities for budding engineers.",
  status: "published",
  start_date: "2026-09-04T00:00:00+05:30",
  end_date: "2026-11-10T00:00:00+05:30",
  venue_name: "VIT University, Chennai",
  venue_address: "VIT Chennai Campus, Vandalur-Kelambakkam Road, Chennai-600127, Tamil Nadu, India",
  banner_url: "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/event_banners/6c248187c69b4324a3b713f250b9a75a.png",
  about_image_url:
    "https://img.magnific.com/free-photo/group-teens-doing-experiments-robotics-laboratory-boys-girls-protective-vr_1268-23742.jpg?semt=ais_test_b&w=740&q=80",
  contact_email: "robotica26@otomatiks.in",
  contact_phone: "+91 8148518703",
  speakers: [
    {
      id: 7,
      name: "Dr. Meera Iyer",
      bio: "Google Head from India",
      designation: "Head of Google-India",
      photo_url:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwYdkfz3k4fhflaCI_w7AUITjkg-n27rKVM6BpF1pMnKMxt8VkjkhZTy4&s=10",
    },
    {
      id: 2,
      name: "Vikram Shah",
      bio: "Industry expert focused on robotics, autonomous systems, and technology innovation, with experience helping organizations adopt next-generation automation.",
      designation: "CEO of FutureBots Technologies",
      photo_url:
        "https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cG9ydHJhaXR8ZW58MHx8MHx8fDA%3D",
    },
    {
      id: 3,
      name: "Dr. Kavya Raman",
      bio: "Researcher and educator specializing in machine learning, computer vision, and intelligent robotic systems.",
      designation: "Director of AI & Robotics Research",
      photo_url:
        "https://img.magnific.com/free-photo/indian-woman-posing-cute-stylish-outfit-camera-smiling_482257-122351.jpg?semt=ais_hybrid&w=740&q=80",
    },
    {
      id: 1,
      name: "James D. Franklin",
      bio: "We promote interactions, production of most relevant ideas and we act to create high quality documents that sustain ideas with strength. Our Design Suite has been designed to allow each and every kind of skills and expertise to express themselves together, serving a common purpose. Simplicity and quality are truly our keywords to deliver a never lived before experience. We design with main focus, quick and natural handling by our users.We promote interactions, production of most relevant ideas and we act to create high quality documents that sustain ideas with strength. Our Design Suite has been designed to allow each and every kind of skills and expertise to express themselves together, serving a common purpose. Simplicity and quality",
      designation: "Founder & CEO of RoboNext Labs",
      photo_url:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT74oeO7Y0SqUiKLQmbfnSuVyslIb4VQu0VHAgBVQFejchf1jZSMjO77eE&s=10",
    },
    {
      id: 5,
      name: "Priya Nair",
      bio: "Technology leader passionate about AI-driven automation, robotics education, and building innovative solutions for the next generation of engineers.",
      designation: "CTO of Innovate Robotics",
      photo_url:
        "https://assets.vogue.in/photos/67ce902f46c728b63d8eb6c7/master/w_1600%2Cc_limit/KeerthanaKunnath.jpg",
    },
    {
      id: 6,
      name: "Dr. Arjun Mehta",
      bio: "Robotics and AI researcher focused on autonomous systems, intelligent machines, and emerging robotic technologies.",
      designation: "CEO of Fire Epic",
      photo_url:
        "https://img.magnific.com/free-psd/smiley-old-man-posing_23-2151880042.jpg?semt=ais_hybrid&w=740&q=80",
    },
    {
      id: 4,
      name: "Rohan Kapoor",
      bio: "Entrepreneur and robotics enthusiast working at the intersection of artificial intelligence, automation, and real-world robotic applications.",
      designation: "Co-Founder of AutomataX",
      photo_url:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREE3lXIdzOK2Rh2fBAIM2KIt1qO9RanHuUQCm8hUc9_tMfgyXWWsR6ivRG&s=10",
    },
  ],
  sponsors: [
    { id: 6, name: "Sega", type: "sponsor", website_url: "https://sega.com", logo_url: "https://images.seeklogo.com/logo-png/12/2/sega-logo-png_seeklogo-124470.png" },
    { id: 1, name: "Adobe", type: "sponsor", website_url: "https://www.adobe.com/", logo_url: "https://blog.logomaster.ai/assets/site/6e/6e23e5cbae493125f6770620c0ce31e1559a1bbd189aaad4f910e5e8f36a7851.jpg" },
    { id: 2, name: "Qualcomm", type: "sponsor", website_url: "https://www.qualcomm.com/", logo_url: "https://1000logos.net/wp-content/uploads/2020/08/Qualcomm-Logo.png" },
    { id: 3, name: "RTX", type: "sponsor", website_url: "https://www.rtx.com/https://www.rtx.com/", logo_url: "https://images.seeklogo.com/logo-png/35/1/nvidia-rtx-logo-png_seeklogo-356758.png" },
    { id: 4, name: "GMR Aerocity Hyderabad", type: "sponsor", website_url: "https://www.gmraerocity.com/", logo_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTs-sXYE9hehQTwR9qwskuiJ1RYV5HDozsiniaNuVNmFTg1_vtzB0I07sk-&s=10" },
    { id: 5, name: "PTC", type: "sponsor", website_url: "https://www.ptc.com/", logo_url: "https://i.pinimg.com/564x/e5/ac/01/e5ac013ed118e8cd326ac07e4d0dd6e5.jpg" },
  ],
  gallery_items: [
    { id: 7, caption: "", media_type: "image", media_url: "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/gallery_media/4ab3e49761cd4f62b52cdd394b05fc5d.jpg" },
    { id: 8, caption: "", media_type: "image", media_url: "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/gallery_media/f7f92a3691f14231aa5eb9c37bd9c209.jpg" },
    { id: 9, caption: "", media_type: "image", media_url: "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/gallery_media/7e6ee96111ca452cb569dd94aae24e42.jpg" },
    { id: 10, caption: "", media_type: "image", media_url: "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/gallery_media/01003d8083ad4b1aaf1218d81802d91a.jpg" },
    { id: 11, caption: "", media_type: "image", media_url: "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/gallery_media/8e9d695233394cc584f47dbf125b2db8.jpg" },
    { id: 12, caption: "", media_type: "image", media_url: "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/gallery_media/5fc603afa38f4af2872c28b3c8f798b5.jpg" },
  ],
  ticket_types: [
    {
      id: 3,
      event: 1,
      name: "Buddy Bot Assembly",
      short_description: "",
      description: "",
      start_time: null,
      end_time: null,
      venue: "",
      price: "499.00",
      is_sponsored: false,
      capacity: 50,
      sold_count: 8,
      sales_start: null,
      sales_end: null,
      is_registration_paused: false,
      is_sold_out: false,
      is_available: true,
      access: [],
      kind: "individual",
      max_team_size: null,
      gallery_items: [
        { id: 5, caption: "Crowd cheering", media_type: "image", media_url: "https://picsum.photos/seed/robotica3/1200/800" },
      ],
      zones: [],
    },
    {
      id: 2,
      event: 1,
      name: "Rover Bot Workshop",
      short_description: "",
      description: "",
      start_time: null,
      end_time: null,
      venue: "",
      price: "1000.00",
      is_sponsored: false,
      capacity: undefined,
      sold_count: 1,
      sales_start: null,
      sales_end: null,
      is_registration_paused: false,
      is_sold_out: false,
      is_available: true,
      access: [{ id: 1, kind: "workshop" }],
      kind: "team",
      max_team_size: 3,
      gallery_items: [
        { id: 4, caption: "Behind the scenes", media_type: "video", media_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
      ],
      zones: [],
    },
    {
      id: 1,
      event: 1,
      name: "UX Design Trend Party 2019",
      short_description: "Full access to the UX Design Trend Party track",
      description:
        "Join us for a deep dive into 2019 UX design trends. This ticket includes entry to all talks, hands-on workshops, networking sessions, and a swag bag. Light refreshments provided.",
      start_time: "2026-08-28T15:18:23.768621+05:30",
      end_time: "2026-08-28T23:18:23.768630+05:30",
      venue: "Innovation Hall, Block B",
      price: "1000.00",
      is_sponsored: true,
      capacity: 100,
      sold_count: 18,
      sales_start: "2026-08-01T00:00:00+05:30",
      sales_end: "2026-12-01T00:00:00+05:30",
      is_registration_paused: false,
      is_sold_out: false,
      is_available: true,
      access: [],
      kind: "individual",
      max_team_size: null,
      gallery_items: [
        { id: 1, caption: "Stage setup", media_type: "image", media_url: "https://picsum.photos/seed/ticket1a/1200/800" },
        { id: 2, caption: "Workshop table", media_type: "image", media_url: "https://picsum.photos/seed/ticket1b/1200/800" },
        { id: 3, caption: "Session teaser", media_type: "video", media_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
      ],
      zones: [],
    },
  ],
};

/** Same snapshot's `GET /events/1/testimonials/` response — see `STATIC_EVENT`'s doc comment. */
export const STATIC_TESTIMONIALS: Testimonial[] = [
  { id: 6, user_name: "Chandru J", rating: 5, message: "Nice Event!", created_at: "2026-08-27T14:29:49.781565+05:30" },
  { id: 3, user_name: "Chandru J", rating: 5, message: "My kid had a blast building and competing. Will definitely be back next year.", created_at: "2026-08-27T12:45:56.082380+05:30" },
  { id: 1, user_name: "chandru", rating: 5, message: "Robotica was an incredible experience - well organized from start to finish!", created_at: "2026-08-27T12:45:56.078479+05:30" },
];
