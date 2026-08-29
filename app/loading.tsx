import { EventPageSkeleton } from "@/components/ui/Skeleton";

/**
 * Streamed while the root page resolves its event.
 *
 * `resolveEvent()` reads the Host header and fetches the event from the
 * Django API on every request (AGENTS.md "Server-Side Rendering
 * Requirement"), so there is a real round trip here — this stands in for the
 * page's actual layout rather than showing a blank screen or a spinner.
 */
export default function Loading() {
  return <EventPageSkeleton />;
}
