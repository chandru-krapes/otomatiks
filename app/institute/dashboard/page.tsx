import type { Metadata } from "next";
import InstituteDashboard from "@/components/account/InstituteDashboard";

export const metadata: Metadata = { title: "Institute dashboard" };

export default function Page() {
  return <InstituteDashboard />;
}
