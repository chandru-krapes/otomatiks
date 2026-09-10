import type { MetadataRoute } from "next";
import { resolveEvent } from "@/lib/resolve-event";
import { resolveMediaUrl } from "@/lib/api";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { event } = await resolveEvent();

  const name = event?.title ?? "Otomatiks Events";
  const logo = event ? resolveMediaUrl(event.logo) : null;

  return {
    name,
    short_name: name.length > 12 ? `${name.slice(0, 11)}…` : name,
    description:
      event?.description || event?.tagline || "Robotics and technology events, workshops and competitions by Otomatiks.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: event?.theme_color || "#066aab",
    icons: [
      ...(logo ? [{ src: logo, sizes: "any" as const }] : []),
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/app-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
