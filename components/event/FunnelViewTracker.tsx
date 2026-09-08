"use client";

import { useEffect } from "react";
import { trackFunnelStep } from "@/lib/funnel";

// Fires the funnel's first step ("viewed_event") once per event-page mount for the event website
export default function FunnelViewTracker({ eventId }: { eventId: number | string }) {
  useEffect(() => {
    trackFunnelStep(eventId, "viewed_event");
  }, [eventId]);

  return null;
}
