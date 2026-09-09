/**
 * A frozen, point-in-time snapshot of the real "robotica" event, its ticket types, and its
 * testimonials -- copied verbatim from the live backend (GET /api/v1/events/, /events/1/,
 * /events/1/ticket-types/, /events/1/testimonials/) on 2026-09-09. Every image/video URL is used
 * directly (Cloudflare R2 / external hotlinks already used by the real event record) --
 * nothing here is proxied or refetched, so this renders with zero calls to the Django backend.
 *
 * Regenerating this snapshot: with the backend running locally, re-fetch the four endpoints
 * above for the real robotica event and paste the merged result back in below --
 * see lib/resolve-event.ts for how this is wired to MAIN_DOMAIN_HOSTS.
 */

import type { Event, Testimonial } from "../types";

export const STATIC_EVENT: Event = {
  "id": 1,
  "title": "Robotica",
  "slug": "robotica",
  "short_description": "Our robotics classes are designed to help you discover the potential of this exciting field with the guidance of our experienced instructors.",
  "description": "Robotica is a national-level robotics competition organized by Otomatiks, aimed at fostering innovation in robotics and AI among students. Participants compete in various events like Robo Race, Robo Sumo, working model exhibitions, and workshops. The event provides hands-on learning, expert talks, and networking opportunities for budding engineers.",
  "status": "published",
  "start_date": "2026-09-04T00:00:00+05:30",
  "end_date": "2026-11-10T00:00:00+05:30",
  "venue_name": "VIT University, Chennai",
  "venue_address": "VIT Chennai Campus, Vandalur-Kelambakkam Road, Chennai-600127, Tamil Nadu, India",
  "banner_url": "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/event_banners/6c248187c69b4324a3b713f250b9a75a.png",
  "about_image_url": "https://img.magnific.com/free-photo/group-teens-doing-experiments-robotics-laboratory-boys-girls-protective-vr_1268-23742.jpg?semt=ais_test_b&w=740&q=80",
  "founder_message": {
    "title": "Founder Message",
    "name": "Sathish S",
    "designation": "Founder & CEO, Otomatiks",
    "message": "To our extraordinary participants, esteemed parents, and forward-thinking school leaders—Robotica-26 is not just a stage for competition, it’s a platform for shaping the future. Students, you are the pioneers of tomorrow, redefining what’s possible through innovation. Parents, your belief and support are the foundation upon which great things are built. And to the visionary school leaders, your commitment to nurturing talent paves the way for breakthroughs that will change the world.",
    "photo_url": "https://www.robotica.org.in/assets/img/about/a-full-1.png"
  },
  "contact_email": "robotica26@otomatiks.in",
  "contact_phone": "+91 8148518703",
  "speakers": [
    {
      "id": 1,
      "name": "James D. Franklin",
      "bio": "We promote interactions, production of most relevant ideas and we act to create high quality documents that sustain ideas with strength. Our Design Suite has been designed to allow each and every kind of skills and expertise to express themselves together, serving a common purpose. Simplicity and quality are truly our keywords to deliver a never lived before experience. We design with main focus, quick and natural handling by our users.We promote interactions, production of most relevant ideas and we act to create high quality documents that sustain ideas with strength. Our Design Suite has been designed to allow each and every kind of skills and expertise to express themselves together, serving a common purpose. Simplicity and quality",
      "designation": "Founder & CEO of RoboNext Labs",
      "photo_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT74oeO7Y0SqUiKLQmbfnSuVyslIb4VQu0VHAgBVQFejchf1jZSMjO77eE&s=10"
    },
    {
      "id": 2,
      "name": "Vikram Shah",
      "bio": "Industry expert focused on robotics, autonomous systems, and technology innovation, with experience helping organizations adopt next-generation automation.",
      "designation": "CEO of FutureBots Technologies",
      "photo_url": "https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cG9ydHJhaXR8ZW58MHx8MHx8fDA%3D"
    },
    {
      "id": 3,
      "name": "Dr. Kavya Raman",
      "bio": "Researcher and educator specializing in machine learning, computer vision, and intelligent robotic systems.",
      "designation": "Director of AI & Robotics Research",
      "photo_url": "https://img.magnific.com/free-photo/indian-woman-posing-cute-stylish-outfit-camera-smiling_482257-122351.jpg?semt=ais_hybrid&w=740&q=80"
    },
    {
      "id": 4,
      "name": "Rohan Kapoor",
      "bio": "Entrepreneur and robotics enthusiast working at the intersection of artificial intelligence, automation, and real-world robotic applications.",
      "designation": "Co-Founder of AutomataX",
      "photo_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREE3lXIdzOK2Rh2fBAIM2KIt1qO9RanHuUQCm8hUc9_tMfgyXWWsR6ivRG&s=10"
    },
    {
      "id": 5,
      "name": "Priya Nair",
      "bio": "Technology leader passionate about AI-driven automation, robotics education, and building innovative solutions for the next generation of engineers.",
      "designation": "CTO of Innovate Robotics",
      "photo_url": "https://assets.vogue.in/photos/67ce902f46c728b63d8eb6c7/master/w_1600%2Cc_limit/KeerthanaKunnath.jpg"
    },
    {
      "id": 6,
      "name": "Dr. Arjun Mehta",
      "bio": "Robotics and AI researcher focused on autonomous systems, intelligent machines, and emerging robotic technologies.",
      "designation": "CEO of Fire Epic",
      "photo_url": "https://img.magnific.com/free-psd/smiley-old-man-posing_23-2151880042.jpg?semt=ais_hybrid&w=740&q=80"
    }
  ],
  "sponsors": [
    {
      "id": 6,
      "name": "Sega",
      "type": "sponsor",
      "website_url": "https://sega.com",
      "logo_url": "https://images.seeklogo.com/logo-png/12/2/sega-logo-png_seeklogo-124470.png"
    },
    {
      "id": 1,
      "name": "Adobe",
      "type": "sponsor",
      "website_url": "https://www.adobe.com/",
      "logo_url": "https://blog.logomaster.ai/assets/site/6e/6e23e5cbae493125f6770620c0ce31e1559a1bbd189aaad4f910e5e8f36a7851.jpg"
    },
    {
      "id": 2,
      "name": "Qualcomm",
      "type": "sponsor",
      "website_url": "https://www.qualcomm.com/",
      "logo_url": "https://1000logos.net/wp-content/uploads/2020/08/Qualcomm-Logo.png"
    },
    {
      "id": 3,
      "name": "RTX",
      "type": "sponsor",
      "website_url": "https://www.rtx.com/https://www.rtx.com/",
      "logo_url": "https://images.seeklogo.com/logo-png/35/1/nvidia-rtx-logo-png_seeklogo-356758.png"
    },
    {
      "id": 4,
      "name": "GMR Aerocity Hyderabad",
      "type": "sponsor",
      "website_url": "https://www.gmraerocity.com/",
      "logo_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTs-sXYE9hehQTwR9qwskuiJ1RYV5HDozsiniaNuVNmFTg1_vtzB0I07sk-&s=10"
    },
    {
      "id": 5,
      "name": "PTC",
      "type": "sponsor",
      "website_url": "https://www.ptc.com/",
      "logo_url": "https://i.pinimg.com/564x/e5/ac/01/e5ac013ed118e8cd326ac07e4d0dd6e5.jpg"
    }
  ],
  "gallery_items": [
    {
      "id": 7,
      "caption": "",
      "media_type": "image",
      "media_url": "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/gallery_media/4ab3e49761cd4f62b52cdd394b05fc5d.jpg"
    },
    {
      "id": 8,
      "caption": "",
      "media_type": "image",
      "media_url": "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/gallery_media/f7f92a3691f14231aa5eb9c37bd9c209.jpg"
    },
    {
      "id": 10,
      "caption": "",
      "media_type": "image",
      "media_url": "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/gallery_media/01003d8083ad4b1aaf1218d81802d91a.jpg"
    },
    {
      "id": 11,
      "caption": "",
      "media_type": "image",
      "media_url": "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/gallery_media/8e9d695233394cc584f47dbf125b2db8.jpg"
    },
    {
      "id": 12,
      "caption": "",
      "media_type": "image",
      "media_url": "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/gallery_media/5fc603afa38f4af2872c28b3c8f798b5.jpg"
    }
  ],
  "perks": [
    {
      "id": 2,
      "event": null,
      "title": "Trophy",
      "description": "Trophy based on the participant performance.",
      "icon_url": "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/perk_icons/700039f6ca1d486f8f02bc7a84070d67.gif",
      "order": 0
    },
    {
      "id": 3,
      "event": null,
      "title": "Medal",
      "description": "Medal based on the first and second to finish the competition",
      "icon_url": "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/perk_icons/0a9483ae144f44f4983e1f883e9a42f5.gif",
      "order": 1
    },
    {
      "id": 4,
      "event": null,
      "title": "Certificate",
      "description": "Certificate for all participants",
      "icon_url": "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/perk_icons/ad6a2c97fef043198adf7ae9c5d38b51.gif",
      "order": 2
    },
    {
      "id": 5,
      "event": null,
      "title": "Cash",
      "description": "Worth 20K",
      "icon_url": "https://pub-17ea7fc7c0c04d0a88e677d415eca0a1.r2.dev/perk_icons/bd0def2f6f5d4017998037f1d0958dc4.gif",
      "order": 3
    }
  ],
  "ticket_types": [
    {
      "id": 3,
      "event": 1,
      "name": "Buddy Bot Competition",
      "short_description": "Build, battle, and conquer! Compete with your buddy bot, showcase your skills, and race your way to victory.",
      "description": "Build, program, and compete with your very own buddy bot! This ticket gives you access to an exciting robotics challenge where participants design and operate bots through fun, skill-based competitions. Test your creativity, engineering, and teamwork as you take on other teams and battle for the top spot.",
      "start_time": "2026-09-30T09:00:00+05:30",
      "end_time": "2026-10-01T22:54:00+05:30",
      "venue": "Main Hall H",
      "price": "499.00",
      "is_sponsored": false,
      "capacity": 200,
      "sold_count": 68,
      "sales_start": null,
      "sales_end": null,
      "is_registration_paused": false,
      "is_sold_out": false,
      "is_available": true,
      "access": [],
      "kind": "individual",
      "max_team_size": null,
      "max_attendees_per_booking": null,
      "gallery_items": [
        {
          "id": 5,
          "caption": "Crowd cheering",
          "media_type": "image",
          "media_url": "https://picsum.photos/seed/robotica3/1200/800"
        }
      ],
      "zones": []
    },
    {
      "id": 2,
      "event": 1,
      "name": "Rover Bot Workshop",
      "short_description": "Build it. Program it. Drive it! Get hands-on experience building and controlling your own rover bot.",
      "description": "Get hands-on with robotics in the Rover Bot Workshop! Learn how to build, program, and control a rover bot while exploring the fundamentals of robotics, sensors, and automation. This workshop is designed to turn ideas into a working robot through practical learning and exciting challenges.",
      "start_time": "2026-09-30T23:00:00+05:30",
      "end_time": "2026-10-03T09:00:00+05:30",
      "venue": "Main Hall J",
      "price": "1000.00",
      "is_sponsored": false,
      "capacity": 100,
      "sold_count": 3,
      "sales_start": null,
      "sales_end": null,
      "is_registration_paused": false,
      "is_sold_out": false,
      "is_available": true,
      "access": [
        {
          "id": 1,
          "kind": "workshop"
        }
      ],
      "kind": "team",
      "max_team_size": 3,
      "max_attendees_per_booking": null,
      "gallery_items": [
        {
          "id": 4,
          "caption": "Behind the scenes",
          "media_type": "video",
          "media_url": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        }
      ],
      "zones": []
    },
    {
      "id": 1,
      "event": 1,
      "name": "Know about Bots Workshop",
      "short_description": "Full access to the Bots Assembly",
      "description": "Join us for a deep dive into Bots Workshop. This ticket includes entry to all talks, hands-on workshops, networking sessions, and assembly. Light refreshments provided.",
      "start_time": "2026-08-28T15:18:00+05:30",
      "end_time": "2026-08-28T23:18:00+05:30",
      "venue": "Innovation Hall, Block B",
      "price": "1000.00",
      "is_sponsored": true,
      "capacity": 100,
      "sold_count": 18,
      "sales_start": "2026-08-01T00:00:00+05:30",
      "sales_end": "2026-12-01T00:00:00+05:30",
      "is_registration_paused": false,
      "is_sold_out": false,
      "is_available": true,
      "access": [],
      "kind": "individual",
      "max_team_size": null,
      "max_attendees_per_booking": null,
      "gallery_items": [
        {
          "id": 1,
          "caption": "Stage setup",
          "media_type": "image",
          "media_url": "https://picsum.photos/seed/ticket1a/1200/800"
        },
        {
          "id": 2,
          "caption": "Workshop table",
          "media_type": "image",
          "media_url": "https://picsum.photos/seed/ticket1b/1200/800"
        },
        {
          "id": 3,
          "caption": "Session teaser",
          "media_type": "video",
          "media_url": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        }
      ],
      "zones": []
    }
  ]
};

export const STATIC_TESTIMONIALS: Testimonial[] = [
  {
    "id": 6,
    "user_name": "Chandru J",
    "rating": 5,
    "message": "Nice Event!",
    "created_at": "2026-08-27T14:29:49.781565+05:30"
  },
  {
    "id": 3,
    "user_name": "Chandru J",
    "rating": 5,
    "message": "My kid had a blast building and competing. Will definitely be back next year.",
    "created_at": "2026-08-27T12:45:56.082380+05:30"
  },
  {
    "id": 1,
    "user_name": "chandru",
    "rating": 5,
    "message": "Robotica was an incredible experience - well organized from start to finish!",
    "created_at": "2026-08-27T12:45:56.078479+05:30"
  }
];
