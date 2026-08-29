"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Event } from "@/lib/types";
import type { AuthUser } from "@/lib/types";
import { ADMIN_NAV, type AdminSectionId } from "./nav";
import { AdminIcon } from "./icons";
import { Select } from "@/components/ui/Select";

/**
 * Console chrome: a dark fixed sidebar (the admin surface deliberately breaks
 * from the public site's light/blueprint look, so staff always know they're
 * in the management plane, not on the event site) plus a light content well
 * that keeps the rest of the design system — cards, hairlines, badges — so
 * every section still feels like this product.
 */
export default function AdminShell({
  user,
  events,
  selectedEventId,
  onSelectEvent,
  active,
  onSelectSection,
  onLogout,
  children,
}: {
  user: AuthUser;
  events: Event[];
  selectedEventId: number | string | null;
  onSelectEvent: (eventId: number | string | null) => void;
  active: AdminSectionId;
  onSelectSection: (section: AdminSectionId) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const selectedEvent = events.find((event) => String(event.id) === String(selectedEventId)) ?? null;

  return (
    <div className="min-h-screen bg-tint-cool">
      {/* -- Sidebar --------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col gap-6 bg-surface px-5 py-6 text-on-surface transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-1">
          <Link href="/" className="focus-ring flex items-center gap-2 rounded-md">
            <span className="font-boldonse text-lg uppercase tracking-tight text-on-surface">Otomatiks</span>
            <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="focus-ring press flex h-8 w-8 items-center justify-center rounded-full text-on-surface/70 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <label className="flex flex-col gap-1.5 px-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface/40">Event</span>
          <Select
            variant="dark"
            value={selectedEventId ? String(selectedEventId) : ""}
            onChange={(event) => onSelectEvent(event.target.value || null)}
            placeholder="— Select an event —"
            className="py-2.5 text-sm font-medium"
          >
            <option value="">— Select an event —</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} {event.status !== "published" ? `(${event.status})` : ""}
              </option>
            ))}
          </Select>
        </label>

        <nav className="admin-scroll-dark flex flex-1 flex-col gap-1 overflow-y-auto px-1">
          {ADMIN_NAV.filter((item) => !item.adminOnly || user.role === "admin").map((item) => {
            const disabled = item.needsEvent && !selectedEvent;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onSelectSection(item.id);
                  setMobileNavOpen(false);
                }}
                title={disabled ? "Select an event first" : undefined}
                className={`focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors duration-[var(--dur-fast)] disabled:cursor-not-allowed disabled:opacity-35 ${
                  isActive ? "bg-secondary text-white shadow-[0_6px_18px_-6px_rgba(0,0,0,0.4)]" : "text-on-surface/70 hover:bg-white/8 hover:text-on-surface"
                }`}
              >
                <AdminIcon id={item.id} className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/20 font-boldonse text-xs uppercase text-secondary">
            {(user.full_name || user.email).slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-on-surface">{user.full_name || user.email}</p>
            <p className="truncate text-[11px] text-on-surface/45">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Log out"
            className="focus-ring press flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface/60 hover:bg-white/10 hover:text-on-surface"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
      )}

      {/* -- Content ----------------------------------------------------------- */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-hairline bg-tint-cool/85 px-6 py-4 backdrop-blur-md lg:px-10">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="focus-ring press flex h-9 w-9 items-center justify-center rounded-full border border-hairline-strong text-primary lg:hidden"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              {ADMIN_NAV.find((item) => item.id === active)?.label}
            </p>
            <h1 className="truncate font-display text-lg font-bold text-primary sm:text-xl">
              {selectedEvent ? selectedEvent.title : "Select an event to get started"}
            </h1>
          </div>
        </header>

        <main className="route-transition mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
