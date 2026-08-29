"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/lib/types";
import { listAllEvents } from "@/lib/adminApi";
import { useAdminSession } from "./useAdminSession";
import AdminLogin from "./AdminLogin";
import AdminShell from "./AdminShell";
import type { AdminSectionId } from "./nav";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { EventPageSkeleton } from "@/components/ui/Skeleton";

import OverviewSection from "./sections/OverviewSection";
import EventsSection from "./sections/EventsSection";
import MediaLibrarySection from "./sections/MediaLibrarySection";
import GallerySection from "./sections/GallerySection";
import SpeakersSection from "./sections/SpeakersSection";
import SponsorsSection from "./sections/SponsorsSection";
import RegistrationsSection from "./sections/RegistrationsSection";
import PaymentsSection from "./sections/PaymentsSection";
import TicketsSection from "./sections/TicketsSection";
import AttendanceSection from "./sections/AttendanceSection";
import TeamSection from "./sections/TeamSection";
import BatchingSection from "./sections/BatchingSection";
import CertificatesSection from "./sections/CertificatesSection";
import NotificationsSection from "./sections/NotificationsSection";
import ReportsSection from "./sections/ReportsSection";

/**
 * Root of the `/admin` staff console. Gates on a login (see AdminLogin),
 * then loads every event the signed-in user can see and renders one of the
 * eleven management sections against whichever event is currently selected.
 *
 * There's no server-side role check available here — "organizer" and
 * "volunteer" are per-event memberships rather than a field on the user
 * record — so `listAllEvents` returning an empty/forbidden result is treated
 * as "this account has no staff access" rather than crashing the page.
 */
export default function AdminApp() {
  const { session, loading, expired, withAuth, logout, setSession } = useAdminSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | string | null>(null);
  const [section, setSection] = useState<AdminSectionId>("events");

  function reloadEvents() {
    setEventsLoading(true);
    setEventsError(null);
    withAuth<Event[]>((token) => listAllEvents(token).then((data) => ({ ok: true as const, data }))).then((result) => {
      if (result.ok) {
        setEvents(result.data);
        if (!selectedEventId && result.data[0]) {
          setSelectedEventId(result.data[0].id);
          setSection("overview");
        }
      } else {
        setEventsError(result.message);
      }
      setEventsLoading(false);
    });
  }

  useEffect(() => {
    async function init() {
      if (session === undefined) return;
      if (!session) {
        setEventsLoading(false);
        return;
      }
      reloadEvents();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (loading) return <EventPageSkeleton />;

  if (!session || expired) {
    return (
      <AdminLogin
        onSignedIn={(newSession) => {
          setSession(newSession);
        }}
      />
    );
  }

  const selectedEvent = events.find((event) => String(event.id) === String(selectedEventId)) ?? null;

  return (
    <AdminShell
      user={session.user}
      events={events}
      selectedEventId={selectedEventId}
      onSelectEvent={(id) => {
        setSelectedEventId(id);
        setSection(id ? "overview" : "events");
      }}
      active={section}
      onSelectSection={setSection}
      onLogout={logout}
    >
      {eventsLoading ? (
        <EventPageSkeleton />
      ) : eventsError ? (
        <EmptyState
          title="Couldn't load your events"
          description={eventsError}
          action={<Button size="sm" onClick={reloadEvents}>Try again</Button>}
        />
      ) : section === "events" ? (
        <EventsSection
          events={events}
          onEventsChanged={reloadEvents}
          onSelect={(id) => {
            setSelectedEventId(id);
            setSection("overview");
          }}
          withAuth={withAuth}
        />
      ) : section === "media" ? (
        // Platform-wide, not scoped to the selected event — the whole reason it's branched
        // here, ahead of the `!selectedEvent` gate below, same as "events" above.
        <MediaLibrarySection withAuth={withAuth} />
      ) : !selectedEvent ? (
        <EmptyState title="No event selected" description="Pick an event from the sidebar, or create one under Events." />
      ) : section === "overview" ? (
        <OverviewSection event={selectedEvent} withAuth={withAuth} />
      ) : section === "gallery" ? (
        <GallerySection event={selectedEvent} withAuth={withAuth} />
      ) : section === "speakers" ? (
        <SpeakersSection event={selectedEvent} withAuth={withAuth} />
      ) : section === "sponsors" ? (
        <SponsorsSection event={selectedEvent} withAuth={withAuth} />
      ) : section === "registrations" ? (
        <RegistrationsSection event={selectedEvent} withAuth={withAuth} />
      ) : section === "payments" ? (
        <PaymentsSection event={selectedEvent} withAuth={withAuth} />
      ) : section === "tickets" ? (
        <TicketsSection event={selectedEvent} withAuth={withAuth} />
      ) : section === "attendance" ? (
        <AttendanceSection event={selectedEvent} withAuth={withAuth} />
      ) : section === "team" ? (
        <TeamSection event={selectedEvent} withAuth={withAuth} />
      ) : section === "batching" ? (
        <BatchingSection event={selectedEvent} withAuth={withAuth} />
      ) : section === "certificates" ? (
        <CertificatesSection event={selectedEvent} withAuth={withAuth} />
      ) : section === "notifications" ? (
        <NotificationsSection event={selectedEvent} withAuth={withAuth} />
      ) : section === "reports" ? (
        <ReportsSection event={selectedEvent} withAuth={withAuth} />
      ) : null}
    </AdminShell>
  );
}
