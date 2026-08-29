"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/lib/types";
import {
  getAnalyticsAttendance,
  getAnalyticsDemographics,
  getAnalyticsSummary,
  getAnalyticsTicketSales,
} from "@/lib/adminApi";
import type { AnalyticsAttendance, AnalyticsDemographics, AnalyticsSummary, TicketSalesRow } from "@/lib/adminTypes";
import type { useAdminSession } from "../useAdminSession";
import { ProgressBar, SectionHeader, StatCard } from "../ui";
import { ListSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

function formatCurrency(amount: string | number) {
  const value = Number(amount);
  if (Number.isNaN(value)) return String(amount);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

/**
 * Dashboard landing page for a selected event — the four read-only
 * `apps/analytics` endpoints rendered as stat tiles, a ticket-sales table,
 * a check-in gauge, and a top-schools breakdown.
 */
export default function OverviewSection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [attendance, setAttendance] = useState<AnalyticsAttendance | null>(null);
  const [ticketSales, setTicketSales] = useState<TicketSalesRow[]>([]);
  const [demographics, setDemographics] = useState<AnalyticsDemographics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [summaryResult, attendanceResult, ticketSalesResult, demographicsResult] = await Promise.all([
        withAuth((token) => getAnalyticsSummary(token, event.id)),
        withAuth((token) => getAnalyticsAttendance(token, event.id)),
        withAuth((token) => getAnalyticsTicketSales(token, event.id)),
        withAuth((token) => getAnalyticsDemographics(token, event.id)),
      ]);
      if (cancelled) return;
      if (summaryResult.ok) setSummary(summaryResult.data);
      else setError(summaryResult.message);
      if (attendanceResult.ok) setAttendance(attendanceResult.data);
      if (ticketSalesResult.ok) setTicketSales(ticketSalesResult.data);
      if (demographicsResult.ok) setDemographics(demographicsResult.data);
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
      <SectionHeader title="Overview" description="Live registration, revenue and check-in numbers for this event." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total registrations" value={summary?.total_registrations ?? "—"} hint={`${summary?.today_registrations ?? 0} today`} tone="brand" />
        <StatCard label="Total revenue" value={summary ? formatCurrency(summary.total_revenue) : "—"} tone="accent" />
        <StatCard label="Pending payments" value={summary?.pending_payments ?? "—"} tone="warning" />
        <StatCard label="Failed payments" value={summary?.cancelled_payments ?? "—"} hint="Counts payment failures, not cancellations" />
      </div>

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
