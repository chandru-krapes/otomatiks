"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommunityProfileResponse, Event } from "@/lib/types";
import { getCommunityProfile, listPublishedEvents } from "@/lib/api";
import { clearSession, loadSession, type StoredSession } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import AccountShell from "./AccountShell";
import UpcomingEvents from "./UpcomingEvents";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";

function ticketStatusClass(status: string) {
  if (status === "valid") return "border-emerald-100 bg-emerald-50 text-emerald-600";
  if (status === "cancelled") return "border-red-100 bg-red-50 text-red-600";
  return "border-amber-100 bg-amber-50 text-amber-600";
}

export default function CommunityDashboard() {
  const router = useRouter();
  // `undefined` = "haven't checked storage yet", distinct from `null` ("checked, no session") —
  // see BookingDashboard for why this can't be read synchronously in useState's initializer
  // (this "use client" component is still server-rendered for the initial HTML, where
  // `localStorage` doesn't exist, so the client's first hydration-matching render can't
  // already know the session either — it has to come from an effect, which only runs client-side).
  const [session, setSession] = useState<StoredSession | null | undefined>(undefined);
  useEffect(() => {
    // Deliberate exception to react-hooks/set-state-in-effect — see BookingDashboard for why.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(loadSession("community"));
  }, []);
  const [profile, setProfile] = useState<CommunityProfileResponse | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session === undefined) return; // storage not checked yet (see the useEffect above)
    if (!session) {
      router.replace("/community/login");
      return;
    }
    Promise.all([getCommunityProfile(session.accessToken), listPublishedEvents()]).then(
      ([profileResult, publishedEvents]) => {
        if (profileResult.ok) {
          setProfile(profileResult.data);
        } else {
          setError(profileResult.message);
        }
        setEvents(publishedEvents);
        setLoading(false);
      },
    );
  }, [session, router]);

  function handleLogout() {
    clearSession("community");
    router.replace("/community/login");
  }

  // Two different moments, both of which used to render nothing at all — a
  // real blank white page, not a hypothetical one, since checking
  // `localStorage` for a session happens in an effect and can never be
  // known on the very first render (see the comment above `useState`):
  // storage not checked yet, or checked-and-empty with the redirect effect
  // about to fire. Generic copy either way — this must never say
  // "Signed in as…" before it's confirmed there's actually a session.
  if (!session) {
    return (
      <AccountShell eyebrow="Community account" title="Loading your profile…" maxWidth="max-w-4xl">
        <ListSkeleton rows={2} label="Loading your profile" />
      </AccountShell>
    );
  }

  return (
    <AccountShell eyebrow="Community account" title="Your community profile" maxWidth="max-w-4xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {/* `session.user.email` is a community_student account's internal
              placeholder address (`community-student-N@accounts.internal`),
              never a real one the child chose or would recognize — the
              display id (or, once loaded, their own name) is what actually
              identifies them to themselves. */}
          Signed in as{" "}
          <span className="font-semibold text-primary">{profile?.full_name ?? session.user.full_name}</span>
        </p>
        <Button type="button" variant="tertiary" size="sm" onClick={handleLogout} className="text-xs">
          Log out
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <div className="flex flex-col gap-8">
          <section className="glass-panel flex flex-col gap-5 rounded-3xl p-8">
            <h2 className="font-display text-lg font-bold text-primary">Profile</h2>
            {loading ? (
              <div role="status" aria-busy="true" className="grid gap-4 sm:grid-cols-2">
                <span className="sr-only">Loading your profile</span>
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <Alert tone="error">{error}</Alert>
            ) : (
              profile && (
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Name</dt>
                    <dd className="mt-1 text-sm font-semibold text-primary">{profile.full_name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Display ID</dt>
                    <dd className="mt-1 text-sm font-semibold text-primary">{profile.display_id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Date of birth</dt>
                    <dd className="mt-1 text-sm font-semibold text-primary">{formatDate(profile.date_of_birth) ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">School</dt>
                    <dd className="mt-1 text-sm font-semibold text-primary">{profile.school || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Grade</dt>
                    <dd className="mt-1 text-sm font-semibold text-primary">{profile.grade || "—"}</dd>
                  </div>
                </dl>
              )
            )}
          </section>

          <section className="glass-panel flex flex-col gap-4 rounded-3xl p-8">
            <h2 className="font-display text-lg font-bold text-primary">Event history & certificates</h2>
            {profile && profile.history.length > 0 ? (
              // Scoped server-side to this claimed Student's own attendee_entries —
              // never a sibling's or the parent's (see CommunityProfileResponse).
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-primary/10 text-xs font-semibold uppercase tracking-wide text-muted">
                      <th className="py-2 pr-4">Event</th>
                      <th className="py-2 pr-4">Competition</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Booking ref</th>
                      <th className="py-2">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.history.map((item, index) => (
                      <tr key={index} className="border-b border-primary/5 last:border-0">
                        <td className="py-2.5 pr-4 font-semibold text-primary">{item.event}</td>
                        <td className="py-2.5 pr-4 text-muted">{item.competition}</td>
                        <td className="py-2.5 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${ticketStatusClass(item.ticket_status)}`}
                          >
                            {item.ticket_status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-muted">{item.booking_reference}</td>
                        <td className="py-2.5 text-muted">{formatDate(item.registered_at) ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No results yet"
                description="Register for an event through the booking system, then use the claim link on your ID card to bring your results and certificates into this profile."
              />
            )}
          </section>
        </div>

        <UpcomingEvents events={events} />
      </div>
    </AccountShell>
  );
}
