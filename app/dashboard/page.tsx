import type { Metadata } from "next";
import BookingDashboard from "@/components/account/BookingDashboard";

export const metadata: Metadata = { title: "Your bookings" };

export default function Page() {
  return <BookingDashboard />;
}
