import { Suspense } from "react";
import type { Metadata } from "next";
import VerifyEmailPage from "@/components/account/VerifyEmailPage";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Verify email" };

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-10"><Skeleton className="h-72 w-full rounded-3xl" /></div>}>
      <VerifyEmailPage />
    </Suspense>
  );
}
