/**
 * Social links for the event.
 *
 * Two behaviours worth knowing about, both changed from the previous version:
 *
 *  1. It renders nothing when the backend supplied no links. It used to fall
 *     back to four hard-coded icons pointing at `#`, which put dead links to
 *     nonexistent accounts in the footer of every event that hadn't set any.
 *
 *  2. The glyph is matched to the link's own label rather than to its index
 *     in the list. Previously the first link always drew the Facebook mark,
 *     the second always Twitter, and so on — so an event whose only link was
 *     Instagram was shown a Facebook icon. Unrecognised platforms get a
 *     neutral link glyph instead of a wrong one.
 */
const ICON_PATHS: Record<string, string> = {
  facebook:
    "M15 8h-2a1 1 0 0 0-1 1v2h3l-.4 3H12v7H9v-7H7v-3h2V8.6A3.6 3.6 0 0 1 12.6 5H15v3Z",
  twitter:
    "M19 7.3c-.6.3-1.2.4-1.9.5a3.1 3.1 0 0 0 1.4-1.7 6.3 6.3 0 0 1-2 .8A3.1 3.1 0 0 0 12 9.3a8.9 8.9 0 0 1-7.2-3.7 3.1 3.1 0 0 0 1 4.2 3 3 0 0 1-1.4-.4v.1a3.1 3.1 0 0 0 2.5 3 3.2 3.2 0 0 1-1.4.1 3.1 3.1 0 0 0 2.9 2.2A6.3 6.3 0 0 1 5 16.6 8.8 8.8 0 0 0 9.8 18c5.8 0 9-4.8 9-9v-.4A6.4 6.4 0 0 0 19 7.3Z",
  instagram:
    "M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Zm8 1.8H8A2.2 2.2 0 0 0 5.8 8v8A2.2 2.2 0 0 0 8 18.2h8A2.2 2.2 0 0 0 18.2 16V8A2.2 2.2 0 0 0 16 5.8ZM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm5-1.2a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Z",
  youtube:
    "M21 8.2a2.4 2.4 0 0 0-1.7-1.7C17.8 6.1 12 6.1 12 6.1s-5.8 0-7.3.4A2.4 2.4 0 0 0 3 8.2 25 25 0 0 0 2.6 12 25 25 0 0 0 3 15.8a2.4 2.4 0 0 0 1.7 1.7c1.5.4 7.3.4 7.3.4s5.8 0 7.3-.4a2.4 2.4 0 0 0 1.7-1.7 25 25 0 0 0 .4-3.8 25 25 0 0 0-.4-3.8ZM10.2 14.6V9.4l4.6 2.6-4.6 2.6Z",
  linkedin:
    "M7 9.5H4.5V20H7V9.5ZM5.7 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM20 13.9c0-2.9-1.6-4.3-3.6-4.3a3.1 3.1 0 0 0-2.8 1.5V9.5H11V20h2.5v-5.5c0-1.3.5-2.2 1.7-2.2s1.6.9 1.6 2.2V20H20v-6.1Z",
  // Neutral fallback: a link glyph, for anything not listed above.
  link: "M10.6 13.4a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7l-1.3 1.3M13.4 10.6a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.3-1.3",
};

/** Matches on the label first, then on the URL's host, then gives up. */
function iconFor(label: string, url: string): { path: string; filled: boolean } {
  const haystack = `${label} ${url}`.toLowerCase();

  for (const key of Object.keys(ICON_PATHS)) {
    if (key === "link") continue;
    if (haystack.includes(key)) return { path: ICON_PATHS[key], filled: true };
  }
  // "X" is hard to match on substring, so it's checked explicitly.
  if (/\bx\.com\b/.test(haystack)) return { path: ICON_PATHS.twitter, filled: true };

  return { path: ICON_PATHS.link, filled: false };
}

export default function SocialIcons({
  links,
  light,
}: {
  links?: { label: string; url: string }[];
  light?: boolean;
}) {
  if (!links || links.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3">
      {links.map((link, index) => {
        const icon = iconFor(link.label, link.url);
        const external = link.url.startsWith("http");

        return (
          <a
            key={`${link.label}-${index}`}
            href={link.url}
            aria-label={link.label}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className={`focus-ring press flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:-translate-y-0.5 sm:h-9 sm:w-9 ${
              light
                ? "border-white/40 text-white hover:border-white hover:bg-white/20"
                : "border-foreground/15 text-muted hover:border-secondary hover:bg-secondary/8 hover:text-secondary"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={icon.filled ? "currentColor" : "none"}
              stroke={icon.filled ? "none" : "currentColor"}
              strokeWidth={icon.filled ? undefined : 1.8}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d={icon.path} />
            </svg>
          </a>
        );
      })}
    </div>
  );
}
