import { PLACEHOLDER } from "@/lib/placeholders";
import Button, { type ButtonSize, type ButtonVariant } from "@/components/ui/Button";

/**
 * The ticket/registration CTA — a thin preset over the shared `Button`
 * (components/ui/Button.tsx) rather than its own set of styles, so the
 * primary action on the site can never drift from the button system.
 *
 * The public props are unchanged, so every existing call site (Header,
 * MobileNav, Hero, EventDetails, Sponsors, Registration, Tickets) keeps
 * working as-is; `variant` is mapped onto the shared vocabulary below.
 */
type Variant = "solid" | "outline" | "light";

const VARIANT_MAP: Record<Variant, ButtonVariant> = {
  // The one action we actually want pressed.
  solid: "primary",
  outline: "secondary",
  // Sits on a photographic/coloured ground (header bar, hero overlay).
  light: "light",
};

export default function TicketButton({
  href,
  label = PLACEHOLDER.ticketCta,
  variant = "solid",
  external,
  className = "",
  size = "md",
}: {
  href: string;
  label?: string;
  variant?: Variant;
  external?: boolean;
  className?: string;
  size?: ButtonSize;
}) {
  return (
    <Button
      href={href}
      external={external}
      variant={VARIANT_MAP[variant]}
      size={size}
      className={className}
      icon={<TicketIcon className="h-4 w-4 transition-transform duration-[var(--dur-fast)] group-hover:-rotate-12" />}
    >
      {label}
    </Button>
  );
}

export function TicketIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9V7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V9a2 2 0 1 0 0 6v1.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V15a2 2 0 1 0 0-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M10 6v12" stroke="currentColor" strokeWidth="1.8" strokeDasharray="2.2 2.4" />
    </svg>
  );
}
