export type AdminSectionId =
  | "overview"
  | "events"
  | "media"
  | "tickets"
  | "gallery"
  | "speakers"
  | "sponsors"
  | "registrations"
  | "payments"
  | "attendance"
  | "team"
  | "batching"
  | "certificates"
  | "notifications"
  | "reports";

export interface AdminNavItem {
  id: AdminSectionId;
  label: string;
  /** Sections that operate on one event at a time need one selected before they can load data. */
  needsEvent: boolean;
  /** Gated server-side to platform admins only (e.g. the R2 media library, which isn't
   * tagged by event so an organizer has no scoped view of it) — hidden from anyone else
   * rather than shown and left to 403. */
  adminOnly?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { id: "overview", label: "Overview", needsEvent: true },
  { id: "events", label: "Events", needsEvent: false },
  { id: "media", label: "Media library", needsEvent: false, adminOnly: true },
  { id: "tickets", label: "Tickets & promos", needsEvent: true },
  { id: "gallery", label: "Gallery", needsEvent: true },
  { id: "speakers", label: "Speakers", needsEvent: true },
  { id: "sponsors", label: "Sponsors", needsEvent: true },
  { id: "registrations", label: "Registrations", needsEvent: true },
  { id: "payments", label: "Payments", needsEvent: true },
  { id: "attendance", label: "Attendance", needsEvent: true },
  { id: "team", label: "Team", needsEvent: true },
  { id: "batching", label: "Batching", needsEvent: true },
  { id: "certificates", label: "Certificates", needsEvent: true },
  { id: "notifications", label: "Notifications", needsEvent: true },
  { id: "reports", label: "Reports", needsEvent: true },
];
