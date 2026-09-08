import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Real event uploads — Cloudflare R2 (see lib/api.ts resolveBannerUrl).
      { protocol: "https", hostname: "*.r2.dev", pathname: "/**" },
      // Hotlinked stock images used by real event records (e.g. the
      // "robotica" event's gallery/testimonials) that were authored by
      // pasting external image URLs rather than uploading to R2.
      { protocol: "https", hostname: "img.magnific.com", pathname: "/**" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com", pathname: "/**" },
      { protocol: "https", hostname: "plus.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "assets.vogue.in", pathname: "/**" },
      { protocol: "https", hostname: "images.seeklogo.com", pathname: "/**" },
      { protocol: "https", hostname: "blog.logomaster.ai", pathname: "/**" },
      { protocol: "https", hostname: "1000logos.net", pathname: "/**" },
      { protocol: "https", hostname: "i.pinimg.com", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "www.robotica.org.in", pathname: "/**" },
    ],
  },
};

export default nextConfig;
