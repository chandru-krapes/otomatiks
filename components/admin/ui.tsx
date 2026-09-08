"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "brand" | "accent" | "warning";
}) {
  const toneClass: Record<string, string> = {
    neutral: "text-primary",
    brand: "text-secondary",
    accent: "text-accent",
    warning: "text-amber-600",
  };
  return (
    <div className="card relative overflow-hidden rounded-2xl p-5">
      <div className="tech-grid-fine pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden="true" />
      <p className="relative text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`relative mt-2 font-display text-2xl font-extrabold sm:text-3xl ${toneClass[tone]}`}>{value}</p>
      {hint && <p className="relative mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-bold text-primary sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700",
  generated: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  pending_payment: "border-amber-200 bg-amber-50 text-amber-700",
  queued: "border-amber-200 bg-amber-50 text-amber-700",
  processing: "border-amber-200 bg-amber-50 text-amber-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  refunded: "border-sky-200 bg-sky-50 text-sky-700",
  partially_refunded: "border-sky-200 bg-sky-50 text-sky-700",
  initiated: "border-sky-200 bg-sky-50 text-sky-700",
};

export function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? "border-primary/15 bg-primary/5 text-primary";
  return (
    <span className={`inline-flex w-fit shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="admin-scroll-light card overflow-x-auto rounded-2xl">
      <table className="w-full min-w-[38rem] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Thead({ columns }: { columns: string[] }) {
  return (
    <thead>
      <tr className="border-b border-hairline bg-primary/[0.03]">
        {columns.map((column) => (
          <th key={column} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted">
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle text-foreground ${className}`}>{children}</td>;
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="border-b border-hairline last:border-0 hover:bg-primary/[0.02]">{children}</tr>;
}
export function Modal({
  title,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="admin-scroll-dark fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10 animate-pop-in"
      style={{ contain: "layout paint" }}
    >
      <div className={`animate-pop-in relative w-full overflow-hidden rounded-3xl border border-hairline-strong bg-background p-6 shadow-[var(--elev-3)] sm:p-8 ${maxWidth}`}>
        <div className="tech-grid-fine pointer-events-none absolute inset-0 opacity-[0.25]" aria-hidden="true" />
        <div className="relative mb-5 flex items-center justify-between gap-4">
          <h3 className="font-display text-lg font-bold text-primary">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring press flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-primary/8 hover:text-primary"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="relative">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-secondary transition-[width] duration-500 ease-[var(--ease-out)]" style={{ width: `${pct}%` }} />
    </div>
  );
}
