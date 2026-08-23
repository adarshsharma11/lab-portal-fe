"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Activity, AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, 
  Clock3, Cpu, Droplets, FileCheck2, FileSignature, FileText, FlaskConical, 
  Gauge, IndianRupee, Plus, ShieldCheck, Stethoscope, TestTube2, UserCog, 
  Users, Zap
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataTable } from "@/components/tables/DataTable";
import { Button, ChartCard, Grid2, Grid4, KPICard, PageHeader, StatusBadge, Card } from "@/components/ui/index";
import { 
  useCriticalResults, useDashboardStats, useDepartmentDistribution, 
  usePendingWork, useRecentActivity, useRevenue, useSampleStatistics, 
  useTestVolume, useTurnaround 
} from "@/features/dashboard/hooks";
import { useSamples, useTests } from "@/features/laboratory/hooks";
import { useReports } from "@/features/reports/hooks";
import { useAppointments, useInvoices } from "@/features/operations/hooks";
import { useInstruments } from "@/features/instruments/hooks";
import { useEntityList } from "@/features/crud/hooks";
import { authService } from "@/lib/auth/auth-service";
import { createColumnHelper } from "@tanstack/react-table";
import type { Patient, PendingWork, Report, Sample, UserRole } from "@/types/domain";

const brandColor = "#2563eb";
const brandPalette = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"];

// ==========================================
// 1. ADMIN DASHBOARD
// ==========================================
function AdminDashboard() {
  const stats = useDashboardStats();
  const volume = useTestVolume();
  const departments = useDepartmentDistribution();
  const samples = useSampleStatistics();
  const revenue = useRevenue();
  const turnaround = useTurnaround();
  const activity = useRecentActivity();
  const pending = usePendingWork();
  const critical = useCriticalResults();

  const pendingCols = useMemo(() => {
    const h = createColumnHelper<PendingWork>();
    return [
      h.accessor("patient", { header: "Patient", cell: ({ getValue }) => <span className="font-semibold">{getValue()}</span> }),
      h.accessor("sampleId", { header: "Sample ID", cell: ({ getValue }) => <span className="text-[color:var(--muted)] font-mono text-xs">{getValue()}</span> }),
      h.accessor("test", { header: "Test" }),
      h.accessor("department", { header: "Department", cell: ({ getValue }) => <span className="text-[color:var(--muted)]">{getValue()}</span> }),
      h.accessor("priority", { header: "Priority", cell: ({ getValue }) => <StatusBadge tone={getValue() === "STAT" ? "warning" : "neutral"} size="sm">{getValue()}</StatusBadge> }),
      h.accessor("status", { header: "Status", cell: ({ getValue }) => <StatusBadge tone={getValue() === "Processing" ? "warning" : "success"} size="sm">{getValue()}</StatusBadge> }),
      h.display({ 
        id: "action", 
        header: "", 
        cell: () => (
          <Link href="/samples">
            <Button size="sm" variant="ghost">Review</Button>
          </Link>
        ) 
      })
    ];
  }, []);

  const icons = [Users, TestTube2, Clock3, CheckCircle2, FileCheck2, FileCheck2, AlertTriangle, IndianRupee];
  const labels = ["Total patients", "Samples today", "Pending tests", "Completed tests", "Pending reports", "Reports today", "Critical results", "Revenue"] as const;

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
        eyebrow="Administrator Workspace"
        title="Laboratory Operations & Control"
        description="Comprehensive diagnostic metrics, patient throughput, and system operations."
        action={
          <div className="flex items-center gap-2">
            <Link href="/users">
              <Button variant="outline" leftIcon={<UserCog size={16} />}>User Management</Button>
            </Link>
            <Link href="/patients/new">
              <Button variant="primary" leftIcon={<Plus size={16} />}>Register Patient</Button>
            </Link>
          </div>
        }
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
              supportingText={label === "Critical results" ? "Requires pathologist review" : "Updated live"}
            />
          );
        })}
      </Grid4>

      {critical.data && critical.data.length > 0 && (
        <section className="rounded-[var(--radius-lg)] border-l-4 border-[color:var(--danger)] bg-[color:var(--danger-bg)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[color:var(--danger)]">
              <AlertTriangle size={18} />
              <h2 className="font-semibold">Critical Diagnostic Alerts Needing Immediate Attention</h2>
            </div>
            <Link href="/reports">
              <span className="text-xs font-semibold text-[color:var(--danger)] hover:underline flex items-center gap-1">
                View All Reports <ArrowRight size={13} />
              </span>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {critical.data.map((item) => (
              <div className="flex items-start justify-between border-t border-[color:var(--danger-line)] pt-3" key={item.id}>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--danger)]">{item.patient} · {item.test}</p>
                  <p className="mt-1 text-xs text-[color:var(--danger)]/80">{item.result} · critical {item.criticalValue} · {item.time}</p>
                </div>
                <Link href="/reports">
                  <Button size="sm" variant="danger-outline">Review</Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <Grid2>
        <ChartCard title="Test Volume" description="Daily completed diagnostic tests">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volume.data}>
              <defs>
                <linearGradient id="volume" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={brandColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={brandColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} tickMargin={8} />
              <YAxis hide />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Area type="monotone" dataKey="value" stroke={brandColor} fill="url(#volume)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Department Distribution" description="Tests processed across disciplines">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={departments.data} dataKey="value" nameKey="label" innerRadius={60} outerRadius={85} paddingAngle={2} stroke="none">
                {(departments.data ?? []).map((_, index) => <Cell key={index} fill={brandPalette[index]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sample Processing" description="Current laboratory queue status">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={samples.data} margin={{ top: 10 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={11} tickMargin={8} />
              <YAxis hide />
              <Tooltip cursor={{ fill: "var(--surface-2)" }} />
              <Bar dataKey="value" fill={brandColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue Stream" description="Monthly revenue collection · ₹ thousands">
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
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[color:var(--foreground)]">Pending Work Queue</h2>
              <p className="mt-0.5 text-xs text-[color:var(--muted)]">Specimens awaiting technician & analyzer processing.</p>
            </div>
            <Link href="/samples">
              <Button size="sm" variant="ghost">View All Samples →</Button>
            </Link>
          </div>
          <DataTable 
            columns={pendingCols} 
            data={pending.data} 
            isLoading={pending.isLoading} 
            isError={pending.isError} 
            pageSize={5}
            searchable
            searchPlaceholder="Search queue..."
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[var(--radius-lg)] border bg-[color:var(--surface)] p-5">
            <h2 className="font-semibold text-sm mb-4">Audit Activity Stream</h2>
            <div className="space-y-4">
              {(activity.data ?? []).map((item) => (
                <div className="flex gap-3" key={item.id}>
                  <div className={`mt-1.5 size-2 shrink-0 rounded-full ${item.type === "Critical result" ? "bg-[color:var(--danger)]" : "bg-[color:var(--brand-600)]"}`} />
                  <div>
                    <div className="flex gap-2">
                      <p className="text-sm font-semibold">{item.type}</p>
                      <span className="text-xs text-[color:var(--muted)]">{item.time}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium">{item.subject}</p>
                    <p className="mt-0.5 text-xs text-[color:var(--muted)]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border bg-[color:var(--surface)] p-5">
            <h3 className="text-sm font-semibold mb-4">Turnaround Time (TAT) by Department</h3>
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

// ==========================================
// 2. TECHNICIAN DASHBOARD
// ==========================================
function TechnicianDashboard() {
  const samples = useSamples();
  const pending = usePendingWork();
  const instruments = useInstruments();

  const allSamples = samples.data ?? [];
  const statCount = allSamples.filter((s) => s.priority === "STAT").length;
  const urgentCount = allSamples.filter((s) => s.priority === "Urgent").length;
  const processingCount = allSamples.filter((s) => s.status === "Processing" || s.status === "Received").length;
  const completedToday = allSamples.filter((s) => s.status === "Completed").length;

  const onlineInstruments = (instruments.data ?? []).filter((i) => i.status === "Online").length;

  const sampleCols = useMemo(() => {
    const h = createColumnHelper<Sample>();
    return [
      h.accessor("accession", { 
        header: "Accession ID", 
        cell: ({ getValue }) => <span className="font-mono font-semibold text-xs text-[color:var(--brand-600)]">{getValue()}</span> 
      }),
      h.accessor("sampleType", { header: "Specimen", cell: ({ getValue }) => <span>{getValue() || "Blood"}</span> }),
      h.accessor("patientId", { header: "Patient", cell: ({ getValue }) => <span className="text-xs text-[color:var(--muted)]">{getValue()}</span> }),
      h.accessor("priority", { 
        header: "Priority", 
        cell: ({ getValue }) => <StatusBadge tone={getValue() === "STAT" ? "danger" : getValue() === "Urgent" ? "warning" : "neutral"} size="sm">{getValue() || "Routine"}</StatusBadge> 
      }),
      h.accessor("status", { 
        header: "Status", 
        cell: ({ getValue }) => <StatusBadge tone={getValue() === "Completed" ? "success" : getValue() === "Processing" ? "warning" : "neutral"} size="sm">{getValue()}</StatusBadge> 
      }),
      h.display({
        id: "action",
        header: "",
        cell: ({ row }) => (
          <Link href={`/samples/${row.original.id}`}>
            <Button size="sm" variant="outline">Process</Button>
          </Link>
        )
      })
    ];
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Technician Laboratory Workspace"
        title="Specimen Accessioning & Analyzer Queue"
        description="Monitor active collection batches, analyzer runs, and enter specimen test findings."
        action={
          <div className="flex items-center gap-2">
            <Link href="/results">
              <Button variant="outline" leftIcon={<FileText size={16} />}>Enter Test Results</Button>
            </Link>
            <Link href="/samples/new">
              <Button variant="primary" leftIcon={<Plus size={16} />}>Collect New Sample</Button>
            </Link>
          </div>
        }
      />

      <Grid4>
        <KPICard label="Active In Queue" value={processingCount} icon={TestTube2} iconTone="info" supportingText="Awaiting completion" />
        <KPICard label="STAT Emergency" value={statCount} icon={Zap} iconTone="danger" supportingText="High priority urgent" />
        <KPICard label="Urgent Batches" value={urgentCount} icon={Clock3} iconTone="warning" supportingText="Expedited TAT" />
        <KPICard label="Completed Today" value={completedToday} icon={CheckCircle2} iconTone="success" supportingText="Sent to Pathologist" />
      </Grid4>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Department Quick Workbenches */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-base">Laboratory Department Workbenches</h3>
                <p className="text-xs text-[color:var(--muted)]">Access specialized testing benches directly.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href="/hematology" className="p-3.5 rounded-xl border border-[color:var(--line)] bg-slate-50 hover:bg-white hover:border-[#176b87] transition group">
                <Droplets size={22} className="text-rose-500 mb-2 group-hover:scale-110 transition" />
                <p className="font-bold text-sm text-[color:var(--foreground)]">Hematology</p>
                <p className="text-[11px] text-[color:var(--muted)] mt-0.5">CBC & Blood cells</p>
              </Link>
              <Link href="/biochemistry" className="p-3.5 rounded-xl border border-[color:var(--line)] bg-slate-50 hover:bg-white hover:border-[#176b87] transition group">
                <FlaskConical size={22} className="text-blue-500 mb-2 group-hover:scale-110 transition" />
                <p className="font-bold text-sm text-[color:var(--foreground)]">Biochemistry</p>
                <p className="text-[11px] text-[color:var(--muted)] mt-0.5">LFT, KFT, Lipids</p>
              </Link>
              <Link href="/urine-analysis" className="p-3.5 rounded-xl border border-[color:var(--line)] bg-slate-50 hover:bg-white hover:border-[#176b87] transition group">
                <Activity size={22} className="text-amber-500 mb-2 group-hover:scale-110 transition" />
                <p className="font-bold text-sm text-[color:var(--foreground)]">Urine Analysis</p>
                <p className="text-[11px] text-[color:var(--muted)] mt-0.5">Microscopy & strips</p>
              </Link>
              <Link href="/electrolytes" className="p-3.5 rounded-xl border border-[color:var(--line)] bg-slate-50 hover:bg-white hover:border-[#176b87] transition group">
                <Gauge size={22} className="text-emerald-500 mb-2 group-hover:scale-110 transition" />
                <p className="font-bold text-sm text-[color:var(--foreground)]">Electrolytes</p>
                <p className="text-[11px] text-[color:var(--muted)] mt-0.5">Na, K, Cl, Ca, Mg</p>
              </Link>
            </div>
          </Card>

          <Card padding={false} className="overflow-hidden">
            <div className="p-5 border-b border-[color:var(--line)] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">Active Sample Processing Queue</h3>
                <p className="text-xs text-[color:var(--muted)]">All accessioned samples in laboratory pipeline.</p>
              </div>
              <Link href="/samples">
                <Button size="sm" variant="ghost">View All Samples →</Button>
              </Link>
            </div>
            <DataTable
              columns={sampleCols}
              data={allSamples}
              isLoading={samples.isLoading}
              pageSize={6}
              searchable
              searchPlaceholder="Filter specimens..."
            />
          </Card>
        </div>

        {/* Analyzer & Instrument Live Status */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-[color:var(--brand-600)]" />
                <h3 className="font-semibold text-sm">Analyzer Connectivity</h3>
              </div>
              <StatusBadge tone="success" size="sm">{onlineInstruments} Online</StatusBadge>
            </div>
            <div className="space-y-3">
              {(instruments.data ?? []).slice(0, 5).map((inst) => (
                <div className="p-3 rounded-lg border border-[color:var(--line)] bg-slate-50 flex items-center justify-between text-xs" key={inst.id}>
                  <div>
                    <p className="font-bold text-[color:var(--foreground)]">{inst.name}</p>
                    <p className="text-[10px] text-[color:var(--muted)]">{inst.department} · {inst.model}</p>
                  </div>
                  <StatusBadge tone={inst.status === "Online" ? "success" : inst.status === "Maintenance" ? "warning" : "danger"} size="sm">
                    {inst.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
            <Link href="/instruments" className="mt-4 block text-center text-xs font-semibold text-[#176b87] hover:underline">
              Manage Instruments & Interfaces →
            </Link>
          </Card>

          <Card>
            <h3 className="font-semibold text-sm mb-3">Pending Analyzer Batches</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-blue-900">Hematology Sysmex XN-550</p>
                  <p className="text-blue-700/80 text-[11px]">8 CBC tests pending matching</p>
                </div>
                <Link href="/results">
                  <Button size="sm" variant="primary">Match</Button>
                </Link>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-emerald-900">Biochemistry Cobas 6000</p>
                  <p className="text-emerald-700/80 text-[11px]">14 chemistry panels running</p>
                </div>
                <Link href="/results">
                  <Button size="sm" variant="outline">View</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. PATHOLOGIST DASHBOARD
// ==========================================
function PathologistDashboard() {
  const reports = useReports();
  const critical = useCriticalResults();
  const turnaround = useTurnaround();

  const allReports = reports.data ?? [];
  const pendingReview = allReports.filter((r) => r.status === "Pending Review" || r.status === "Draft").length;
  const approvedCount = allReports.filter((r) => r.status === "Approved").length;
  const criticalCount = critical.data?.length ?? 0;

  const reportCols = useMemo(() => {
    const h = createColumnHelper<Report>();
    return [
      h.accessor("reportNumber", { 
        header: "Report No.", 
        cell: ({ getValue }) => <span className="font-mono font-semibold text-xs text-[color:var(--brand-600)]">{getValue()}</span> 
      }),
      h.accessor("patientId", { header: "Patient", cell: ({ getValue }) => <span className="font-semibold text-xs">{getValue()}</span> }),
      h.accessor("department", { header: "Department", cell: ({ getValue }) => <span className="text-xs text-[color:var(--muted)]">{getValue() || "Clinical Pathology"}</span> }),
      h.accessor("status", { 
        header: "Status", 
        cell: ({ getValue }) => <StatusBadge tone={getValue() === "Approved" ? "success" : getValue() === "Pending Review" ? "warning" : "danger"} size="sm">{getValue()}</StatusBadge> 
      }),
      h.display({
        id: "action",
        header: "",
        cell: ({ row }) => (
          <Link href={`/reports/${row.original.id}`}>
            <Button size="sm" variant="primary" leftIcon={<FileSignature size={13} />}>
              Sign-Off
            </Button>
          </Link>
        )
      })
    ];
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Pathologist Diagnostic Workspace"
        title="Diagnostic Report Sign-Off & QC Validation"
        description="Verify laboratory findings, sign diagnostic reports, and monitor analytical quality."
        action={
          <div className="flex items-center gap-2">
            <Link href="/quality-control">
              <Button variant="outline" leftIcon={<ShieldCheck size={16} />}>QC Levey-Jennings</Button>
            </Link>
            <Link href="/reports">
              <Button variant="primary" leftIcon={<FileCheck2 size={16} />}>Review Reports ({pendingReview})</Button>
            </Link>
          </div>
        }
      />

      <Grid4>
        <KPICard label="Pending Sign-Off" value={pendingReview} icon={FileSignature} iconTone="warning" supportingText="Awaiting pathologist approval" />
        <KPICard label="Critical Flags" value={criticalCount} icon={AlertTriangle} iconTone="danger" supportingText="High-risk panic values" />
        <KPICard label="Approved Reports" value={approvedCount} icon={CheckCircle2} iconTone="success" supportingText="Delivered to patient & doctor" />
        <KPICard label="QC Compliance" value="99.4%" icon={ShieldCheck} iconTone="info" supportingText="Westgard rules verified" />
      </Grid4>

      {/* Critical Panic Value Review */}
      {critical.data && critical.data.length > 0 && (
        <section className="rounded-[var(--radius-lg)] border-l-4 border-rose-600 bg-rose-50 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-800">
              <AlertTriangle size={18} />
              <h2 className="font-bold text-sm">Critical Panic Values Requiring Pathologist Intervention</h2>
            </div>
            <Link href="/reports">
              <span className="text-xs font-semibold text-rose-700 hover:underline">Review All Flags →</span>
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {critical.data.map((item) => (
              <div className="bg-white p-3.5 rounded-xl border border-rose-200 flex items-center justify-between" key={item.id}>
                <div>
                  <p className="font-bold text-xs text-rose-900">{item.patient} · {item.test}</p>
                  <p className="text-xs text-rose-700 font-semibold mt-0.5">Value: {item.result} (Critical: {item.criticalValue})</p>
                  <p className="text-[10px] text-rose-500 mt-0.5">{item.time}</p>
                </div>
                <Link href="/reports">
                  <Button size="sm" variant="danger">Authorize</Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card padding={false} className="overflow-hidden">
            <div className="p-5 border-b border-[color:var(--line)] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">Diagnostic Reports Awaiting Authorization</h3>
                <p className="text-xs text-[color:var(--muted)]">Review clinical values, reference ranges, and approve with digital signatory.</p>
              </div>
              <Link href="/reports">
                <Button size="sm" variant="ghost">All Reports →</Button>
              </Link>
            </div>
            <DataTable
              columns={reportCols}
              data={allReports}
              isLoading={reports.isLoading}
              pageSize={6}
              searchable
              searchPlaceholder="Search reports..."
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-sm mb-4">Quality Control (QC) Health</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg border border-[color:var(--line)] bg-slate-50">
                <div>
                  <p className="font-semibold">Hematology Control (XN-550)</p>
                  <p className="text-[10px] text-[color:var(--muted)]">Normal Level · Mean 14.2 g/dL</p>
                </div>
                <StatusBadge tone="success" size="sm">Passed</StatusBadge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-[color:var(--line)] bg-slate-50">
                <div>
                  <p className="font-semibold">Biochemistry Control (Cobas)</p>
                  <p className="text-[10px] text-[color:var(--muted)]">Glucose & Urea · Mean 98 mg/dL</p>
                </div>
                <StatusBadge tone="success" size="sm">Passed</StatusBadge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-[color:var(--line)] bg-slate-50">
                <div>
                  <p className="font-semibold">Electrolyte ISE Control</p>
                  <p className="text-[10px] text-[color:var(--muted)]">Na/K/Cl · Level 2</p>
                </div>
                <StatusBadge tone="success" size="sm">Passed</StatusBadge>
              </div>
            </div>
            <Link href="/quality-control" className="mt-4 block text-center text-xs font-semibold text-[#176b87] hover:underline">
              Open Levey-Jennings Charts →
            </Link>
          </Card>

          <Card>
            <h3 className="font-semibold text-sm mb-3">Diagnostic Turnaround (TAT)</h3>
            <div className="space-y-2 text-xs">
              {(turnaround.data ?? []).map((t) => (
                <div key={t.label} className="flex justify-between items-center py-1.5 border-b border-[color:var(--line)] last:border-b-0">
                  <span className="text-[color:var(--muted)]">{t.label}</span>
                  <span className="font-bold text-[color:var(--foreground)]">{t.value} hours</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. DOCTOR DASHBOARD
// ==========================================
function DoctorDashboard() {
  const patients = useEntityList<Patient>("patients");
  const reports = useReports();
  const appointments = useAppointments();
  const invoices = useInvoices();

  const allPatients = patients.data ?? [];
  const allReports = reports.data ?? [];
  const allAppointments = appointments.data ?? [];

  const appointmentCols = useMemo(() => {
    const h = createColumnHelper<any>();
    return [
      h.accessor("patientId", { header: "Patient", cell: ({ getValue }) => <span className="font-semibold">{getValue()}</span> }),
      h.accessor("date", { header: "Date / Time", cell: ({ row }) => <span>{row.original.date} · {row.original.time}</span> }),
      h.accessor("type", { header: "Type", cell: ({ getValue }) => <span className="text-xs text-[color:var(--muted)]">{getValue()}</span> }),
      h.accessor("status", { 
        header: "Status", 
        cell: ({ getValue }) => <StatusBadge tone={getValue() === "Upcoming" || getValue() === "Completed" ? "success" : "warning"} size="sm">{getValue()}</StatusBadge> 
      }),
      h.display({
        id: "action",
        header: "",
        cell: ({ row }) => (
          <Link href={`/appointments/${row.original.id}`}>
            <Button size="sm" variant="ghost">View</Button>
          </Link>
        )
      })
    ];
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Physician Clinical Workspace"
        title="Patient Consultations & Diagnostics"
        description="Track your referred clinical patients, lab test results, and consultation appointments."
        action={
          <div className="flex items-center gap-2">
            <Link href="/appointments/new">
              <Button variant="outline" leftIcon={<CalendarDays size={16} />}>Book Appointment</Button>
            </Link>
            <Link href="/patients/new">
              <Button variant="primary" leftIcon={<Plus size={16} />}>Register Patient</Button>
            </Link>
          </div>
        }
      />

      <Grid4>
        <KPICard label="My Patients" value={allPatients.length} icon={Users} iconTone="info" supportingText="Registered clinical patients" />
        <KPICard label="Appointments Today" value={allAppointments.length} icon={CalendarDays} iconTone="warning" supportingText="Consultations scheduled" />
        <KPICard label="Lab Reports Ready" value={allReports.filter((r) => r.status === "Approved").length} icon={FileText} iconTone="success" supportingText="Verified by Pathologist" />
        <KPICard label="Pending Lab Orders" value={allReports.filter((r) => r.status !== "Approved").length} icon={Clock3} iconTone="neutral" supportingText="In laboratory processing" />
      </Grid4>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card padding={false} className="overflow-hidden">
            <div className="p-5 border-b border-[color:var(--line)] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">Upcoming Clinical Consultations</h3>
                <p className="text-xs text-[color:var(--muted)]">Scheduled visits, health reviews, and sample collections.</p>
              </div>
              <Link href="/appointments">
                <Button size="sm" variant="ghost">All Appointments →</Button>
              </Link>
            </div>
            <DataTable
              columns={appointmentCols}
              data={allAppointments}
              isLoading={appointments.isLoading}
              pageSize={5}
              searchable
              searchPlaceholder="Search visits..."
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Verified Diagnostic Reports</h3>
              <Link href="/reports" className="text-xs font-semibold text-[#176b87] hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {allReports.slice(0, 4).map((r) => (
                <div key={r.id} className="p-3 rounded-lg border border-[color:var(--line)] bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[color:var(--foreground)]">{r.reportNumber}</p>
                    <p className="text-[10px] text-[color:var(--muted)]">Patient: {r.patientId}</p>
                  </div>
                  <Link href={`/reports/${r.id}`}>
                    <Button size="sm" variant="outline">View Report</Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Recent Invoices & Billing</h3>
              <Link href="/billing" className="text-xs font-semibold text-[#176b87] hover:underline">
                Billing →
              </Link>
            </div>
            <div className="space-y-2 text-xs">
              {(invoices.data ?? []).slice(0, 3).map((inv) => (
                <div key={inv.id} className="flex justify-between items-center py-2 border-b border-[color:var(--line)] last:border-b-0">
                  <div>
                    <p className="font-semibold">{inv.billNumber}</p>
                    <p className="text-[10px] text-[color:var(--muted)]">{inv.patientId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono">₹{inv.total}</p>
                    <StatusBadge tone={inv.paymentStatus === "Paid" ? "success" : "warning"} size="sm">{inv.paymentStatus}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ROOT DASHBOARD ROUTER BY ROLE
// ==========================================
export default function DashboardPage() {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const s = authService.getSession();
    if (s?.role) {
      setRole(s.role);
    } else {
      setRole("Admin");
    }
  }, []);

  if (!role) {
    return (
      <div className="grid min-h-[400px] place-items-center text-sm text-[color:var(--muted)]">
        Loading dashboard workspace…
      </div>
    );
  }

  const normalized = role === "Administrator" ? "Admin" : role;

  switch (normalized) {
    case "Technician":
      return <TechnicianDashboard />;
    case "Pathologist":
      return <PathologistDashboard />;
    case "Doctor":
      return <DoctorDashboard />;
    case "Admin":
    default:
      return <AdminDashboard />;
  }
}
