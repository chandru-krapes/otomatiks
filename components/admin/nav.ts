export type AdminSectionId =
  | "overview"
  | "events"
  | "founder-message"
  | "perks"
  | "verification-policy"
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

/** Groups the sidebar into labelled clusters */
export type AdminNavGroup = "manage" | "other";

export const ADMIN_NAV_GROUP_LABELS: Record<AdminNavGroup, string> = {
  manage: "Manage",
  other: "Other",
};

export interface AdminNavItem {
  id: AdminSectionId;
  label: string;
  /** Sections that operate on one event at a time need one selected before they can load data. */
  needsEvent: boolean;
  adminOnly?: boolean;
  group?: AdminNavGroup;
}

export function withGroupHeadings(items: AdminNavItem[]): { item: AdminNavItem; showHeading: boolean }[] {
  let lastGroup: AdminNavGroup | undefined;
  return items.map((item) => {
    const showHeading = Boolean(item.group) && item.group !== lastGroup;
    lastGroup = item.group;
    return { item, showHeading };
  });
}

export const ADMIN_NAV: AdminNavItem[] = [
  { id: "overview", label: "Dashboard", needsEvent: true },
  { id: "events", label: "Events", needsEvent: false, group: "manage" },
  { id: "founder-message", label: "Founder message", needsEvent: false, group: "manage" },
  // Not `needsEvent`: a perk can be platform-wide or scoped to one event, chosen per-row
  // inside the section itself (see PerksSection), the same "global content, own picker"
  // shape as founder-message above rather than the sidebar's per-event selector.
  { id: "perks", label: "What you get", needsEvent: false, group: "manage" },
  // `adminOnly` because the backend's PATCH is genuinely platform-admin-only (ReadOnlyOrAdmin,
  // not IsEventOrganizerOrAdmin) — this isn't scoped to one event's staff to begin with.
  { id: "verification-policy", label: "Verification policy", needsEvent: false, adminOnly: true, group: "manage" },
  { id: "media", label: "Media library", needsEvent: false, adminOnly: true, group: "other" },
  { id: "tickets", label: "Tickets & promos", needsEvent: true, group: "other" },
  { id: "gallery", label: "Gallery", needsEvent: true, group: "other" },
  { id: "speakers", label: "Speakers", needsEvent: true, group: "other" },
  { id: "sponsors", label: "Sponsors", needsEvent: true, group: "other" },
  { id: "registrations", label: "Registrations", needsEvent: true, group: "other" },
  { id: "payments", label: "Payments", needsEvent: true, group: "other" },
  { id: "attendance", label: "Attendance", needsEvent: true, group: "other" },
  { id: "team", label: "Team", needsEvent: true, group: "other" },
  { id: "batching", label: "Batching", needsEvent: true, group: "other" },
  { id: "certificates", label: "Certificates", needsEvent: true, group: "other" },
  { id: "notifications", label: "Email templates", needsEvent: true, group: "other" },
  { id: "reports", label: "Reports", needsEvent: true, group: "other" },
];
