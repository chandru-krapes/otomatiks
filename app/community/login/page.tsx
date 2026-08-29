import type { Metadata } from "next";
import CommunityLoginPage from "@/components/account/CommunityLoginPage";

export const metadata: Metadata = { title: "Log in — Community account" };

export default function Page() {
  return <CommunityLoginPage />;
}
