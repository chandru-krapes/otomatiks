"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Event } from "@/lib/types";
import {
  getAnalyticsAttendance,
  getAnalyticsDemographics,
  getAnalyticsFunnel,
  getAnalyticsSummary,
  getAnalyticsTicketSales,
} from "@/lib/adminApi";
import type { AnalyticsAttendance, AnalyticsDemographics, AnalyticsSummary, FunnelStep, TicketSalesRow } from "@/lib/adminTypes";
import type { useAdminSession } from "../useAdminSession";
import { ProgressBar, SectionHeader, StatCard } from "../ui";
import { ListSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

function formatCurrency(amount: string | number) {
  const value = Number(amount);
  if (Number.isNaN(value)) return String(amount);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

const FUNNEL_ICONS: Record<string, ReactNode> = {
  viewed_event: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  selected_ticket: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9V7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V9a2 2 0 1 0 0 6v1.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V15a2 2 0 1 0 0-6Z" />
    </svg>
  ),
  added_to_cart: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M2.5 3h2.4l2.2 11.3a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.96-1.6L20.5 7H6" />
    </svg>
  ),
  entered_payment: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
  paid: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  ),
};

/**
 * Checkout drop-off funnel — one bar per step, in the order the backend already returns them
 * (`FunnelEvent.ORDER`), each bar's width scaled against the first step's session count so the
 * shape itself reads as "how many people made it this far" at a glance. The step-to-step
 * conversion percentage is the number that actually matters to an organizer (where's the
 * biggest drop?), so it's called out between bars rather than left for someone to compute from
 * two raw counts. "Payment failed" is a real outcome worth surfacing but isn't part of this
 * descending chain (see FunnelStep's own doc comment) — it gets its own callout underneath
 * instead of a bar that would misleadingly suggest it comes "after" paid.
 */
function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const ordered = steps.filter((step) => step.step !== "payment_failed");
  const failed = steps.find((step) => step.step === "payment_failed");
  const viewed = ordered[0]?.sessions ?? 0;

  if (viewed === 0) {
    return <p className="text-sm text-muted">No checkout activity recorded yet — this fills in as visitors move through the event page.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {ordered.map((step, index) => {
          const previous = ordered[index - 1];
          const widthPercent = viewed > 0 ? Math.max((step.sessions / viewed) * 100, step.sessions > 0 ? 4 : 0) : 0;
          const conversion = previous && previous.sessions > 0 ? Math.round((step.sessions / previous.sessions) * 100) : null;

          return (
            <div key={step.step} className="flex flex-col gap-1.5">
              {conversion !== null && (
                <div className="flex items-center gap-2 pl-1 text-[11px] font-semibold text-muted">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M6 13l6 6 6-6" />
                  </svg>
                  {conversion}% continued
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  {FUNNEL_ICONS[step.step]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-primary">{step.label}</span>
                    <span className="font-display text-lg font-extrabold text-primary">{step.sessions}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-primary/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-[width] duration-500 ease-out"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {failed && failed.sessions > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5" />
            <path d="M12 16.2v.2" strokeWidth="2.4" />
          </svg>
          <p className="text-sm font-semibold text-amber-800">
            {failed.sessions} {failed.sessions === 1 ? "session" : "sessions"} reached payment but failed to complete it.
          </p>
        </div>
      )}
    </div>
  );
}

export default function OverviewSection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [attendance, setAttendance] = useState<AnalyticsAttendance | null>(null);
  const [ticketSales, setTicketSales] = useState<TicketSalesRow[]>([]);
  const [demographics, setDemographics] = useState<AnalyticsDemographics | null>(null);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [summaryResult, attendanceResult, ticketSalesResult, demographicsResult, funnelResult] = await Promise.all([
        withAuth((token) => getAnalyticsSummary(token, event.id)),
        withAuth((token) => getAnalyticsAttendance(token, event.id)),
        withAuth((token) => getAnalyticsTicketSales(token, event.id)),
        withAuth((token) => getAnalyticsDemographics(token, event.id)),
        withAuth((token) => getAnalyticsFunnel(token, event.id)),
      ]);
      if (cancelled) return;
      if (summaryResult.ok) setSummary(summaryResult.data);
      else setError(summaryResult.message);
      if (attendanceResult.ok) setAttendance(attendanceResult.data);
      if (ticketSalesResult.ok) setTicketSales(ticketSalesResult.data);
      if (demographicsResult.ok) setDemographics(demographicsResult.data);
      if (funnelResult.ok) setFunnel(funnelResult.data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [event.id, withAuth]);

  if (loading) return <ListSkeleton rows={3} label="Loading analytics" />;

  if (error) {
    return (
      <EmptyState
        title="Couldn't load analytics"
        description={error}
      />
    );
  }

  const topSchools = Object.entries(demographics?.by_school ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxSchoolCount = topSchools[0]?.[1] ?? 1;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title="Dashboard" description="Live registration, revenue and check-in numbers for this event." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total registrations" value={summary?.total_registrations ?? "—"} hint={`${summary?.today_registrations ?? 0} today`} tone="brand" />
        <StatCard label="Total revenue" value={summary ? formatCurrency(summary.total_revenue) : "—"} tone="accent" />
        <StatCard label="Pending payments" value={summary?.pending_payments ?? "—"} tone="warning" />
        <StatCard label="Failed payments" value={summary?.cancelled_payments ?? "—"} hint="Counts payment failures, not cancellations" />
      </div>

      <section className="card flex flex-col gap-5 rounded-2xl p-6">
        <div>
          <h3 className="font-display text-base font-bold text-primary">Checkout funnel</h3>
          <p className="mt-1 text-sm text-muted">Where visitors drop off between viewing this event and completing payment.</p>
        </div>
        <FunnelChart steps={funnel} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <section className="card flex flex-col gap-4 rounded-2xl p-6">
          <h3 className="font-display text-base font-bold text-primary">Ticket sales</h3>
          {ticketSales.length === 0 ? (
            <p className="text-sm text-muted">No ticket sales yet.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {ticketSales.map((row) => {
                const maxSold = Math.max(...ticketSales.map((r) => r.sold), 1);
                return (
                  <li key={row.ticket_type} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-primary">{row.ticket_type}</span>
                      <span className="text-muted">{row.sold} sold · {formatCurrency(row.revenue)}</span>
                    </div>
                    <ProgressBar value={row.sold} max={maxSold} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card flex flex-col gap-4 rounded-2xl p-6">
          <h3 className="font-display text-base font-bold text-primary">Check-in progress</h3>
          {attendance ? (
            <>
              <div className="flex items-end justify-between">
                <span className="font-display text-3xl font-extrabold text-secondary">{attendance.checked_in}</span>
                <span className="text-sm text-muted">of {attendance.total} registered</span>
              </div>
              <ProgressBar value={attendance.checked_in} max={attendance.total} />
              {Object.keys(attendance.by_purpose).length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(attendance.by_purpose).map(([purpose, count]) => (
                    <li key={purpose} className="rounded-full border border-hairline bg-primary/[0.03] px-3 py-1 text-xs font-semibold text-primary">
                      {purpose}: {count}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">No check-ins recorded yet.</p>
          )}
        </section>
      </div>

      <section className="card flex flex-col gap-4 rounded-2xl p-6">
        <h3 className="font-display text-base font-bold text-primary">Top schools</h3>
        {topSchools.length === 0 ? (
          <p className="text-sm text-muted">
            No school breakdown yet — this reads the registration form&rsquo;s <code>school</code> field.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {topSchools.map(([school, count]) => (
              <li key={school} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-primary">{school}</span>
                  <span className="text-muted">{count}</span>
                </div>
                <ProgressBar value={count} max={maxSchoolCount} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
