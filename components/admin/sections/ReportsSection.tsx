"use client";

import { useState } from "react";
import type { Event } from "@/lib/types";
import { downloadAuthedFile, reportUrl } from "@/lib/adminApi";
import type { ReportKind } from "@/lib/adminTypes";
import type { useAdminSession } from "../useAdminSession";
import { SectionHeader } from "../ui";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

const REPORTS: { kind: ReportKind; title: string; description: string }[] = [
  { kind: "attendance", title: "Attendance report", description: "Every check-in/out record for this event." },
  { kind: "revenue", title: "Revenue report", description: "Payments and revenue breakdown." },
  { kind: "tickets", title: "Ticket report", description: "Sales by ticket type." },
  { kind: "registrants", title: "Registrants report", description: "Every registration and its attendees." },
];

/** All four exports resolve to `.xlsx` today — `?format=pdf` is accepted by the backend
 * but returns 501, so it isn't offered here. */
export default function ReportsSection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [downloadingKind, setDownloadingKind] = useState<ReportKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(kind: ReportKind) {
    setDownloadingKind(kind);
    setError(null);
    const result = await withAuth((token) => downloadAuthedFile(reportUrl(event.id, kind), token, `${kind}-event-${event.id}.xlsx`));
    setDownloadingKind(null);
    if (!result.ok) setError(result.message);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Reports" description="Download .xlsx exports for this event." />
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((report) => (
          <div key={report.kind} className="card flex flex-col gap-3 rounded-2xl p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-primary">{report.title}</h3>
              <p className="mt-1 text-sm text-muted">{report.description}</p>
            </div>
            <Button size="sm" variant="secondary" loading={downloadingKind === report.kind} onClick={() => handleDownload(report.kind)} className="w-fit">
              Download .xlsx
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
