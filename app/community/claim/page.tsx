import type { Metadata } from "next";
import CommunityLoginPage from "@/components/account/CommunityLoginPage";

export const metadata: Metadata = { title: "Claim your profile — Community account" };

// The parent/institute confirmation email's child_claim_link points here as
// `/community/claim?token=<Registration.access_token>` — a query param, not
// a path segment, since the token identifies the booking, not one specific
// child. CommunityLoginPage itself reads `token` from the URL and renders
// the name/date-of-birth form when present.
export default function Page() {
  return <CommunityLoginPage />;
}
