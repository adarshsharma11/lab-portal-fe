"use client";
import React from "react";
import { AlertTriangle, CheckCircle2, Clock3, FileCheck2, IndianRupee, Plus, TestTube2, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataTable } from "@/components/tables/DataTable";
import { Button, ChartCard, Grid2, Grid4, KPICard, PageHeader, StatusBadge } from "@/components/ui/index";
import { useCriticalResults, useDashboardStats, useDepartmentDistribution, usePendingWork, useRecentActivity, useRevenue, useSampleStatistics, useTestVolume, useTurnaround } from "@/features/dashboard/hooks";
import { createColumnHelper } from "@tanstack/react-table";
import type { PendingWork } from "@/types/domain";

const icons = [Users, TestTube2, Clock3, CheckCircle2, FileCheck2, FileCheck2, AlertTriangle, IndianRupee];
const labels = ["Total patients", "Samples today", "Pending tests", "Completed tests", "Pending reports", "Reports today", "Critical results", "Revenue"] as const;
const color = "#2563eb"; // brand-600
const palette = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"];

export default function DashboardPage() {
  const stats = useDashboardStats();
  const volume = useTestVolume();
  const departments = useDepartmentDistribution();
  const samples = useSampleStatistics();
  const revenue = useRevenue();
  const turnaround = useTurnaround();
  const activity = useRecentActivity();
  const pending = usePendingWork();
  const critical = useCriticalResults();

  const pendingCols = React.useMemo(() => {
    const h = createColumnHelper<PendingWork>();
    return [
      h.accessor("patient", { header: "Patient", cell: ({ getValue }) => <span className="font-semibold">{getValue()}</span> }),
      h.accessor("sampleId", { header: "Sample ID", cell: ({ getValue }) => <span className="text-[color:var(--muted)] font-mono text-xs">{getValue()}</span> }),
      h.accessor("test", { header: "Test" }),
      h.accessor("department", { header: "Department", cell: ({ getValue }) => <span className="text-[color:var(--muted)]">{getValue()}</span> }),
      h.accessor("priority", { header: "Priority", cell: ({ getValue }) => <StatusBadge tone={getValue() === "STAT" ? "warning" : "neutral"} size="sm">{getValue()}</StatusBadge> }),
      h.accessor("status", { header: "Status", cell: ({ getValue }) => <StatusBadge tone={getValue() === "Processing" ? "warning" : "success"} size="sm">{getValue()}</StatusBadge> }),
      h.display({ id: "action", header: "", cell: () => <Button size="sm" variant="ghost">Review</Button> })
    ];
  }, []);

  const values = stats.data ? [
    stats.data.totalPatients,
    stats.data.samplesToday,
    stats.data.pendingTests,
    stats.data.completedTests,
    stats.data.pendingReports,
    stats.data.reportsToday,
    stats.data.criticalResults,
    `₹${(stats.data.revenue / 1000).toFixed(1)}k`
  ] : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Laboratory overview"
        description="Live operational status for Friday, 22 August."
        action={<Button variant="primary" leftIcon={<Plus size={16} />}>Register patient</Button>}
      />

      <Grid4>
        {labels.map((label, index) => {
          const value = values[index];
          const tone = label === "Critical results" ? "danger" : "info";
          return (
            <KPICard
              key={label}
              label={label}
              value={value}
              icon={icons[index]}
              iconTone={tone}
              isLoading={stats.isLoading}
              supportingText={label === "Critical results" ? "Requires review" : "Updated moments ago"}
            />
          );
        })}
      </Grid4>

      {critical.data && critical.data.length > 0 && (
        <section className="rounded-[var(--radius-lg)] border-l-4 border-[color:var(--danger)] bg-[color:var(--danger-bg)] p-5">
          <div className="mb-4 flex items-center gap-2 text-[color:var(--danger)]">
            <AlertTriangle size={18} />
            <h2 className="font-semibold">Critical results requiring attention</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {critical.data.map((item) => (
              <div className="flex items-start justify-between border-t border-[color:var(--danger-line)] pt-3" key={item.id}>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--danger)]">{item.patient} · {item.test}</p>
                  <p className="mt-1 text-xs text-[color:var(--danger)]/80">{item.result} · critical {item.criticalValue} · {item.time}</p>
                </div>
                <Button size="sm" variant="danger-outline">Review</Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <Grid2>
        <ChartCard title="Test volume" description="Daily completed tests">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volume.data}>
              <defs>
                <linearGradient id="volume" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} tickMargin={8} />
              <YAxis hide />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Area type="monotone" dataKey="value" stroke={color} fill="url(#volume)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Department distribution" description="Tests received today">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={departments.data} dataKey="value" nameKey="label" innerRadius={60} outerRadius={85} paddingAngle={2} stroke="none">
                {(departments.data ?? []).map((_, index) => <Cell key={index} fill={palette[index]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sample processing" description="Current sample state">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={samples.data} margin={{ top: 10 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={11} tickMargin={8} />
              <YAxis hide />
              <Tooltip cursor={{ fill: "var(--surface-2)" }} />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue" description="Monthly collection · ₹ thousands">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenue.data}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} tickMargin={8} />
              <YAxis hide />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Area type="monotone" dataKey="value" stroke="#60a5fa" fill="#dbeafe" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </Grid2>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">Pending work</h2>
            <p className="mt-1 text-xs text-[color:var(--muted)]">Samples requiring laboratory action.</p>
          </div>
          <DataTable 
            columns={pendingCols} 
            data={pending.data} 
            isLoading={pending.isLoading} 
            isError={pending.isError} 
            pageSize={5}
            searchable
            searchPlaceholder="Search work..."
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[var(--radius-lg)] border bg-[color:var(--surface)] p-5">
            <h2 className="font-semibold text-sm mb-4">Recent activity</h2>
            <div className="space-y-4">
              {(activity.data ?? []).map((item) => (
                <div className="flex gap-3" key={item.id}>
                  <div className={`mt-1.5 size-2 shrink-0 rounded-full ${item.type === "Critical result" ? "bg-[color:var(--danger)]" : "bg-[color:var(--brand-600)]"}`} />
                  <div>
                    <div className="flex gap-2">
                      <p className="text-sm font-semibold">{item.type}</p>
                      <span className="text-xs text-[color:var(--muted)]">{item.time}</span>
                    </div>
                    <p className="mt-1 text-sm">{item.subject}</p>
                    <p className="mt-0.5 text-xs text-[color:var(--muted)]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border bg-[color:var(--surface)] p-5">
            <h3 className="text-sm font-semibold mb-4">Average turnaround time</h3>
            {(turnaround.data ?? []).map((item) => (
              <div className="mt-3 flex items-center justify-between text-sm" key={item.label}>
                <span className="text-[color:var(--foreground)]">{item.label}</span>
                <StatusBadge tone="success">{item.value} hrs</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
