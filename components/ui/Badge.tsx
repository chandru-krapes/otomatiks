import type { ReactNode } from "react";

/**
 * Small status/category pill. Covers the ticket-kind chips, access chips,
 * sponsor tiers, schedule tracks and availability indicators — all of which
 * were previously separate inline pill classNames with slightly different
 * padding, tracking and radii.
 */
export type BadgeTone =
  | "brand"
  | "accent"
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "onDark";

const TONES: Record<BadgeTone, string> = {
  brand: "border-secondary/25 bg-secondary/10 text-secondary",
  accent: "border-accent/25 bg-accent/10 text-accent",
  neutral: "border-primary/15 bg-primary/5 text-primary",
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700",
  warning: "border-amber-500/30 bg-amber-500/12 text-amber-700",
  danger: "border-red-500/25 bg-red-500/10 text-red-600",
  onDark: "border-white/30 bg-white/15 text-white backdrop-blur-sm",
};

export default function Badge({
  children,
  tone = "brand",
  icon,
  className = "",
  /** Adds a soft pulsing dot — for genuinely live status only (e.g. on sale now). */
  pulse = false,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${TONES[tone]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {icon}
      {children}
    </span>
  );
}
