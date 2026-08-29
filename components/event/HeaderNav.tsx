"use client";

import { useEffect, useState } from "react";
import type { NavLink } from "@/lib/types";

/**
 * Desktop nav with a live active indicator.
 *
 * The nav is entirely in-page anchors (`#tickets`, `#speakers`, … — see
 * lib/nav.ts), so "active" means "which section is currently under the
 * header", not which route is mounted. One IntersectionObserver watches
 * every section that a nav link points at and reports the topmost visible
 * one; the underline itself is CSS (`.underline-grow[data-active]`).
 *
 * `rootMargin` compensates for the sticky header: without the top inset, a
 * section would register as active while still hidden behind the bar.
 */
export default function HeaderNav({ links }: { links: NavLink[] }) {
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    // Only hash links map to a section on this page.
    const hashLinks = links.filter((link) => link.href.startsWith("#"));
    if (hashLinks.length === 0) return;

    const sections = hashLinks
      .map((link) => {
        const element = document.getElementById(link.href.slice(1));
        return element ? { href: link.href, element } : null;
      })
      .filter((entry): entry is { href: string; element: HTMLElement } => entry !== null);

    if (sections.length === 0) return;

    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const href = `#${entry.target.id}`;
          if (entry.isIntersecting) visible.add(href);
          else visible.delete(href);
        }

        // Several sections can be on screen at once; the one nearest the top
        // of the viewport is the one the reader is actually in.
        const topmost = sections
          .filter((section) => visible.has(section.href))
          .sort(
            (a, b) =>
              a.element.getBoundingClientRect().top - b.element.getBoundingClientRect().top,
          )[0];

        setActiveHref(topmost ? topmost.href : null);
      },
      { rootMargin: "-88px 0px -55% 0px", threshold: 0 },
    );

    for (const section of sections) observer.observe(section.element);
    return () => observer.disconnect();
  }, [links]);

  if (links.length === 0) return null;

  return (
    <nav aria-label="Section navigation" className="hidden items-center gap-7 md:flex">
      {links.map((link) => {
        const isActive = activeHref === link.href;
        return (
          <a
            key={link.href}
            href={link.href}
            data-active={isActive}
            aria-current={isActive ? "true" : undefined}
            className={`underline-grow focus-ring rounded-sm text-[13px] font-medium capitalize transition-colors duration-[var(--dur-fast)] ${
              isActive ? "text-white" : "text-white/75 hover:text-white"
            }`}
          >
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
