import type { AdminSectionId } from "./nav";

/** One small line-icon per nav item — kept in a single lookup so AdminShell's sidebar stays
 * a plain map over ADMIN_NAV rather than a long JSX switch. */
const PATHS: Record<AdminSectionId, string> = {
  overview: "M4 19V5m6 14V9m6 10V13m6 6V3",
  events: "M4 5h16M4 5v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5M8 3v4M16 3v4M4 10h16",
  media: "M7 18a4 4 0 0 1-1-7.87A5.5 5.5 0 0 1 16.6 8.02 4.5 4.5 0 0 1 17.5 17H7Zm5-6v6m0-6-2.5 2.5M12 12l2.5 2.5",
  gallery: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 12 5-6 4 4 3-3 5 5M9 9a1.3 1.3 0 1 0 0-2.6A1.3 1.3 0 0 0 9 9Z",
  speakers: "M9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 12c0-3.3 2.7-6 6-6s6 2.7 6 6M16 3.3a3 3 0 0 1 0 5.7M18.5 20c0-2.5-1.4-4.6-3.5-5.6",
  sponsors: "M11 17l2 2 4-4 3 3V9l-4-4H8L4 9v9l3-3 4 2Z",
  registrations: "M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm3 6h6m-6 4h8",
  payments: "M3 7h18v10H3zM3 10h18M7 15h3",
  tickets: "M4 9V7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V9a2 2 0 1 0 0 6v1.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V15a2 2 0 1 0 0-6Z",
  attendance: "M9 12l2 2 4-4M4 5h16v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Z",
  team: "M9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 12c0-3.3 2.7-6 6-6s6 2.7 6 6M17 9a2.2 2.2 0 1 0 0-4.4M15.6 14.2c2.2.4 3.9 2.3 3.9 4.6",
  batching: "M4 6h16M4 12h16M4 18h7",
  certificates: "M12 2l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 15l-5.2 3 1-5.8L3.5 8.1l5.9-.8Z",
  notifications: "M4 6h16v10H8l-4 4V6Z",
  reports: "M4 20V10m6 10V4m6 16v-7m6 7V8",
};

export function AdminIcon({ id, className = "h-5 w-5" }: { id: AdminSectionId; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[id]} />
    </svg>
  );
}
