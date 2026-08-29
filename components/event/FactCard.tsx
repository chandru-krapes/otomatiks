"use client";

import type { ReactNode, MouseEvent } from "react";

export default function FactCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      onMouseMove={handleMove}
      className="glass-panel group relative overflow-hidden rounded-2xl p-7 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/5 border border-transparent hover:border-secondary/35"
    >
      <div className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 animate-blob rounded-full bg-accent/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-6 h-24 w-24 animate-blob-slow rounded-full bg-secondary/15 blur-2xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(180px circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,0.7), transparent 70%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-secondary/15 to-primary/10 text-secondary shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:from-secondary/25 group-hover:to-primary/20 ring-4 ring-secondary/5">
          {icon}
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">{label}</p>
        <p className="mt-2.5 font-display text-base font-bold leading-snug text-primary">{value}</p>
      </div>
    </div>
  );
}
