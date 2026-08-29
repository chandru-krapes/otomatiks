import type { Metadata } from "next";
import CommunityDashboard from "@/components/account/CommunityDashboard";

export const metadata: Metadata = { title: "Your community profile" };

export default function Page() {
  return <CommunityDashboard />;
}
