import { BookingPageSkeleton } from "@/components/ui/Skeleton";

/** Streamed while the booking route resolves its event and ticket. */
export default function Loading() {
  return <BookingPageSkeleton />;
}
