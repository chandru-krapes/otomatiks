import { Suspense } from "react";
import type { Metadata } from "next";
import MyRegistrationPage from "@/components/account/MyRegistrationPage";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Your registration" };

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-10"><Skeleton className="h-72 w-full rounded-3xl" /></div>}>
      <MyRegistrationPage />
    </Suspense>
  );
}
