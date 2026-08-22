"use client";
import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import {
  AlertTriangle, CheckCircle2, Clock, FileText, FlaskConical, Layers, Plus, ShieldAlert, ShieldCheck, TrendingDown, TrendingUp, XCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { DataTable } from "@/components/tables/DataTable";
import {
  Alert, Button, Card, Dot, Field, Grid4, Input, KPICard, PageHeader, Select, StatusBadge, Tabs, Tag, Textarea, cn
} from "@/components/ui";
import {
  useQCChartData, useQCDashboard, useQCParameters, useQCRuns, useQCViolations, useQCViolationActions
} from "@/features/qc/hooks";
import type { QCRun, QCViolation } from "@/types/domain";

const runStatusTone = (s: string) =>
  s === "Passed" ? "success" : s === "Failed" ? "danger" : s === "Warning" ? "warning" : "pending";

const violationLabels: Record<string, string> = {
  "1_2S": "1-2S (1 × 2 SD)",
  "1_3S": "1-3S (1 × 3 SD)",
  "2_2S": "2-2S (2 consecutive × 2 SD)",
  "R_4S": "R-4S (4 SD range)",
  "4_1S": "4-1S (4 × 1 SD)",
  "10_X": "10-X (10 same side)",
  Shift: "Systematic shift",
  Trend: "Progressive trend",
  "Out of range": "Outside acceptable limits",
};

const violationTone = (type: string): "danger" | "warning" | "info" =>
  type === "1_3S" || type === "Out of range" ? "danger" : type === "Shift" || type === "Trend" ? "warning" : "warning";

export function QualityControlPage() {
  const [tab, setTab] = useState("dashboard");
  const [filters, setFilters] = useState({ search: "", status: "All", controlLevel: "All", analyte: "All", instrumentId: "All" });
  const [selectedParam, setSelectedParam] = useState<string>("qcp-0N");

  const dashboard = useQCDashboard();
  const runs = useQCRuns(filters);
  const parameters = useQCParameters();
  const violations = useQCViolations();
  const chartData = useQCChartData(selectedParam);
  const actions = useQCViolationActions();
  const [reviewViolation, setReviewViolation] = useState<QCViolation | null>(null);
  const [reviewAction, setReviewAction] = useState("");
  const [reviewResolve, setReviewResolve] = useState(false);

  const openViolations = violations.data?.filter((v) => v.status === "Open" || v.status === "Reviewed").length ?? 0;

  const kpis = dashboard.data ? [
    { label: "QC Runs Today", value: dashboard.data.totalRunsToday, icon: FlaskConical, tone: "info" as const, support: `${dashboard.data.passedRuns} passed · ${dashboard.data.failedRuns} failed` },
    { label: "Passed", value: dashboard.data.passedRuns, icon: CheckCircle2, tone: "success" as const, support: `${dashboard.data.totalRunsToday ? Math.round((dashboard.data.passedRuns / dashboard.data.totalRunsToday) * 100) : 0}% pass rate` },
    { label: "Failed", value: dashboard.data.failedRuns, icon: XCircle, tone: "danger" as const, support: "Requires immediate review" },
    { label: "Pending Review", value: dashboard.data.pendingReview, icon: Clock, tone: "warning" as const, support: "Awaiting pathologist sign-off" },
  ] : [];

  const runColumns = useMemo(() => {
    const h = createColumnHelper<QCRun>();
    return [
      h.accessor("runNumber", { header: "Run #", cell: ({ getValue }) => <span className="font-mono text-xs font-semibold">{getValue()}</span> }),
      h.accessor("runDate", { header: "Run Date", cell: ({ getValue }) => format(new Date(getValue()), "dd MMM HH:mm") }),
      h.accessor("analyte", { header: "Analyte", cell: ({ getValue }) => <span className="font-semibold">{getValue()}</span> }),
      h.accessor("controlLevel", { header: "Level", cell: ({ getValue }) => <Tag tone={getValue() === "High" ? "warning" : getValue() === "Low" ? "info" : "neutral"}>{getValue()}</Tag> }),
      h.accessor("instrumentName", { header: "Instrument" }),
      h.accessor("value", {
        header: "Value",
        cell: ({ row }) => {
          const { value, mean, sd, unit } = row.original;
          const z = Math.abs(row.original.zScore);
          const abnormal = z > 2;
          const critical = z > 3;
          return (
            <div>
              <span className={cn("font-bold", critical ? "text-[color:var(--danger)]" : abnormal ? "text-[color:var(--warning)]" : "text-[color:var(--foreground)]")}>
                {value.toFixed(2)}
              </span>
              <span className="ml-1 text-xs text-[color:var(--muted)]">{unit}</span>
              <div className="text-[11px] text-[color:var(--muted)]">z = {row.original.zScore.toFixed(2)}</div>
            </div>
          );
        },
      }),
      h.accessor("mean", {
        header: "Mean ± SD",
        cell: ({ row }) => <span className="text-xs">{row.original.mean} ± {row.original.sd} {row.original.unit}</span>,
      }),
      h.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => <StatusBadge tone={runStatusTone(getValue())}>{getValue()}</StatusBadge>,
      }),
      h.accessor("operatorName", { header: "Operator" }),
    ] as const;
  }, []);

  const violationColumns = useMemo(() => {
    const h = createColumnHelper<QCViolation>();
    return [
      h.accessor("runDate", { header: "Date", cell: ({ getValue }) => format(new Date(getValue()), "dd MMM HH:mm") }),
      h.accessor("analyte", { header: "Analyte", cell: ({ getValue }) => <span className="font-semibold">{getValue()}</span> }),
      h.accessor("controlLevel", { header: "Level" }),
      h.accessor("instrumentName", { header: "Instrument" }),
      h.accessor("value", {
        header: "Value / Range",
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-semibold text-[color:var(--danger)]">{row.original.value} {row.original.expectedRange.split(" ").pop()}</div>
            <div className="text-[color:var(--muted)]">Expected {row.original.expectedRange}</div>
          </div>
        ),
      }),
      h.accessor("violationType", {
        header: "Rule",
        cell: ({ getValue }) => {
          const key = getValue();
          return (
            <StatusBadge tone={violationTone(key)} size="sm">
              {violationLabels[key] ?? key}
            </StatusBadge>
          );
        },
      }),
      h.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const s = getValue();
          const tone = s === "Open" ? "danger" : s === "Reviewed" ? "warning" : s === "Acknowledged" ? "info" : "success";
          return <StatusBadge tone={tone}>{s}</StatusBadge>;
        },
      }),
      h.display({
        id: "action",
        header: "",
        cell: ({ row }) => (
          <div className="text-right">
            <Button size="sm" variant="outline" onClick={() => { setReviewViolation(row.original); setReviewAction(row.original.correctiveAction ?? ""); setReviewResolve(row.original.status === "Resolved"); }}>
              Review
            </Button>
          </div>
        ),
      }),
    ] as const;
  }, [actions]);

  const chartSeries = useMemo(() => {
    const param = parameters.data?.find((p) => p.id === selectedParam);
    if (!param || !chartData.data?.length) return { series: [], param };
    const series = chartData.data.map((r, idx) => ({
      idx,
      time: format(new Date(r.runDate), "HH:mm"),
      value: r.value,
      mean: r.mean,
      "1SD+": r.mean + r.sd,
      "1SD-": r.mean - r.sd,
      "2SD+": r.mean + 2 * r.sd,
      "2SD-": r.mean - 2 * r.sd,
      "3SD+": r.mean + 3 * r.sd,
      "3SD-": r.mean - 3 * r.sd,
      abnormal: Math.abs(r.zScore) > 2,
      critical: Math.abs(r.zScore) > 3,
    }));
    return { series, param };
  }, [chartData.data, parameters.data, selectedParam]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quality Assurance"
        title="Quality Control"
        description="Monitor control materials, detect QC violations, and review Levey-Jennings trending across the entire laboratory."
        action={openViolations > 0 ? <Button variant="danger-outline" leftIcon={<ShieldAlert size={16} />}>{openViolations} Open Violations</Button> : undefined}
      />

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: "dashboard", label: "Dashboard", badge: dashboard.data?.recentViolations ? String(dashboard.data.recentViolations) : undefined, tone: dashboard.data && dashboard.data.recentViolations > 0 ? "danger" : "neutral" },
          { key: "runs", label: "QC Runs", badge: runs.data ? String(runs.data.length) : undefined },
          { key: "parameters", label: "Control Levels", badge: parameters.data ? String(parameters.data.filter(p => p.active).length) : undefined },
          { key: "violations", label: "Violations", badge: openViolations ? String(openViolations) : undefined, tone: openViolations > 0 ? "danger" : "neutral" },
          { key: "chart", label: "Levey-Jennings" },
        ]}
      />

      {tab === "dashboard" && (
        <div className="space-y-6">
          {kpis.length > 0 && (
            <Grid4>
              {kpis.map((k, i) => (
                <KPICard key={i} label={k.label} value={k.value} icon={k.icon} iconTone={k.tone} supportingText={k.support} isLoading={dashboard.isLoading} />
              ))}
              <KPICard
                label="Active Controls"
                value={dashboard.data?.activeControls}
                icon={Layers}
                iconTone="info"
                supportingText={`${parameters.data?.length ?? 0} parameters defined`}
                isLoading={dashboard.isLoading || parameters.isLoading}
              />
            </Grid4>
          )}

          {openViolations > 0 && (
            <Alert tone="danger" title={`${openViolations} violations require attention`}>
              {violations.data?.find((v) => v.status === "Open")?.violationType} and other Westgard rules triggered — confirm corrective action before releasing clinical results.
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Recent Violations</h3>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">Latest QC discrepancies across all departments.</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setTab("violations")}>View all</Button>
              </div>
              <ul className="divide-y divide-[color:var(--line)]">
                {(violations.data ?? []).slice(0, 6).map((v) => (
                  <li key={v.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl",
                      v.status === "Open" ? "bg-[color:var(--danger-bg)] text-[color:var(--danger)]"
                      : v.status === "Resolved" ? "bg-[color:var(--success-bg)] text-[color:var(--success)]"
                      : "bg-[color:var(--warning-bg)] text-[color:var(--warning)]")}>
                      {v.status === "Resolved" ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{v.analyte} · {v.controlLevel}</p>
                        <StatusBadge tone={runStatusTone(v.status === "Open" ? "Failed" : v.status === "Resolved" ? "Passed" : "Warning")} size="sm">{v.status}</StatusBadge>
                      </div>
                      <p className="mt-0.5 text-xs text-[color:var(--muted)]">
                        {v.instrumentName} · {format(new Date(v.runDate), "dd MMM HH:mm")} · {violationLabels[v.violationType] ?? v.violationType}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[color:var(--danger)]">{v.value}</p>
                      <p className="text-[11px] text-[color:var(--muted)]">{v.expectedRange}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="space-y-6">
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Daily run status</h3>
                  <StatusBadge size="sm" tone="success">On track</StatusBadge>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Hematology", value: 18, total: 20, tone: "success" as const, up: true },
                    { label: "Biochemistry", value: 26, total: 28, tone: "success" as const, up: true },
                    { label: "Electrolytes", value: 12, total: 14, tone: "warning" as const, up: false },
                    { label: "Urinalysis", value: 8, total: 10, tone: "info" as const, up: true },
                  ].map((row) => {
                    const pct = Math.round((row.value / row.total) * 100);
                    return (
                      <div key={row.label}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium text-[color:var(--foreground)]">{row.label}</span>
                          <span className="inline-flex items-center gap-1 text-[color:var(--muted)]">
                            <Tag tone={row.tone}>{row.value}/{row.total}</Tag>
                            {row.up ? <TrendingUp size={12} className="text-[color:var(--success)]" /> : <TrendingDown size={12} className="text-[color:var(--warning)]" />}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--line-2)]">
                          <div className={cn("h-full rounded-full",
                            row.tone === "success" ? "bg-[color:var(--success)]"
                            : row.tone === "warning" ? "bg-[color:var(--warning)]"
                            : "bg-[color:var(--info)]")} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <h3 className="mb-4 text-sm font-semibold">Active Controls</h3>
                <ul className="space-y-2">
                  {(parameters.data ?? []).filter((p) => p.active).slice(0, 6).map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-lg bg-[color:var(--surface-2)] px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[color:var(--foreground)]">{p.analyte}</p>
                        <p className="text-[11px] text-[color:var(--muted)]">{p.controlLevel} · Lot {p.lotNumber} · {p.instrumentName}</p>
                      </div>
                      <span className="text-right">
                        <span className="text-xs font-mono font-semibold">{p.mean} ± {p.sd}</span>
                        <p className="text-[10px] text-[color:var(--muted)]">{p.unit}</p>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      )}

      {tab === "runs" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search analyte, run #, instrument…" className="h-9 w-64 pl-9" />
              <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
            </div>
            <Select className="h-9 w-36" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="All">All statuses</option>
              <option>Passed</option><option>Warning</option><option>Failed</option><option>Pending</option>
            </Select>
            <Select className="h-9 w-32" value={filters.controlLevel} onChange={(e) => setFilters({ ...filters, controlLevel: e.target.value })}>
              <option value="All">All levels</option>
              <option>Normal</option><option>Low</option><option>High</option>
            </Select>
            <Select className="h-9 w-44" value={filters.analyte} onChange={(e) => setFilters({ ...filters, analyte: e.target.value })}>
              <option value="All">All analytes</option>
              {(parameters.data ?? []).map((p) => <option key={p.id}>{p.analyte}</option>)}
            </Select>
            <Button size="sm" variant="outline" onClick={() => setFilters({ search: "", status: "All", controlLevel: "All", analyte: "All", instrumentId: "All" })}>Clear</Button>
          </div>
          <DataTable
            columns={[...runColumns]}
            data={runs.data}
            isLoading={runs.isLoading}
            isError={runs.isError}
            pageSize={12}
            emptyTitle="No QC runs match"
            emptyDescription="Try different search or filter criteria to locate runs."
            emptyIcon={FlaskConical}
          />
        </div>
      )}

      {tab === "parameters" && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {(parameters.data ?? []).map((p) => (
            <Card key={p.id} className={cn(!p.active && "opacity-60")}>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{p.analyte}</h4>
                  <p className="mt-0.5 text-xs text-[color:var(--muted)]">{p.instrumentName} · {p.controlLevel}</p>
                </div>
                <StatusBadge tone={p.active ? "success" : "neutral"} size="sm">{p.active ? "Active" : "Inactive"}</StatusBadge>
              </div>
              <div className="rounded-xl bg-[color:var(--surface-2)] p-3 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[color:var(--muted)]">Mean</p>
                    <p className="mt-0.5 font-bold text-[color:var(--foreground)]">{p.mean}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[color:var(--muted)]">SD</p>
                    <p className="mt-0.5 font-bold text-[color:var(--info)]">{p.sd}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[color:var(--muted)]">Unit</p>
                    <p className="mt-0.5 font-bold text-[color:var(--foreground)]">{p.unit}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[color:var(--line)] pt-2">
                  <span className="font-semibold text-[color:var(--muted)]">Acceptable</span>
                  <span className="font-mono font-semibold">{p.acceptableMin} – {p.acceptableMax}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[color:var(--muted)]">
                <span>Lot {p.lotNumber}</span>
                <span>Eff. {p.effectiveDate}</span>
              </div>
              <Button size="sm" variant="outline" className="mt-4 w-full" leftIcon={<FileText size={14} />} onClick={() => { setSelectedParam(p.id); setTab("chart"); }}>
                View chart
              </Button>
            </Card>
          ))}
        </div>
      )}

      {tab === "violations" && (
        <DataTable
          columns={[...violationColumns]}
          data={violations.data}
          isLoading={violations.isLoading}
          isError={violations.isError}
          pageSize={10}
          emptyTitle="No QC violations"
          emptyDescription="Great — no Westgard rules or out-of-range results detected."
          emptyIcon={ShieldCheck}
        />
      )}

      {tab === "chart" && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <div>
              <p className="mb-1 text-xs font-medium text-[color:var(--muted)]">Analyte / Level</p>
              <Select className="h-10 w-80" value={selectedParam} onChange={(e) => setSelectedParam(e.target.value)}>
                {(parameters.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.analyte} · {p.controlLevel} · {p.instrumentName}
                  </option>
                ))}
              </Select>
            </div>
            {chartSeries.param && (
              <div className="flex gap-3">
                <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-[color:var(--muted)]">Mean</p>
                  <p className="text-sm font-bold">{chartSeries.param.mean} <span className="text-[color:var(--muted)]">{chartSeries.param.unit}</span></p>
                </div>
                <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-[color:var(--muted)]">± 1 SD</p>
                  <p className="text-sm font-bold text-[color:var(--info)]">{(chartSeries.param.mean - chartSeries.param.sd).toFixed(2)} – {(chartSeries.param.mean + chartSeries.param.sd).toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-[color:var(--muted)]">± 2 SD</p>
                  <p className="text-sm font-bold text-[color:var(--warning)]">{(chartSeries.param.mean - 2 * chartSeries.param.sd).toFixed(2)} – {(chartSeries.param.mean + 2 * chartSeries.param.sd).toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-[color:var(--muted)]">± 3 SD</p>
                  <p className="text-sm font-bold text-[color:var(--danger)]">{(chartSeries.param.mean - 3 * chartSeries.param.sd).toFixed(2)} – {(chartSeries.param.mean + 3 * chartSeries.param.sd).toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          <Card>
            <div className="h-[380px] w-full">
              {chartSeries.series.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-[color:var(--muted)]">No QC data for this parameter yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartSeries.series} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
                      labelStyle={{ color: "var(--muted)", fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={chartSeries.param?.mean} stroke="var(--brand-600)" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Mean", position: "right", fill: "var(--brand-600)", fontSize: 10 }} />
                    <ReferenceLine y={chartSeries.param && chartSeries.param.mean + chartSeries.param.sd} stroke="var(--info)" strokeDasharray="2 2" strokeWidth={1} />
                    <ReferenceLine y={chartSeries.param && chartSeries.param.mean - chartSeries.param.sd} stroke="var(--info)" strokeDasharray="2 2" strokeWidth={1} />
                    <ReferenceLine y={chartSeries.param && chartSeries.param.mean + 2 * chartSeries.param.sd} stroke="var(--warning)" strokeDasharray="2 2" strokeWidth={1} />
                    <ReferenceLine y={chartSeries.param && chartSeries.param.mean - 2 * chartSeries.param.sd} stroke="var(--warning)" strokeDasharray="2 2" strokeWidth={1} />
                    <ReferenceLine y={chartSeries.param && chartSeries.param.mean + 3 * chartSeries.param.sd} stroke="var(--danger)" strokeDasharray="1 4" strokeWidth={1.2} label={{ value: "+3SD", position: "right", fill: "var(--danger)", fontSize: 10 }} />
                    <ReferenceLine y={chartSeries.param && chartSeries.param.mean - 3 * chartSeries.param.sd} stroke="var(--danger)" strokeDasharray="1 4" strokeWidth={1.2} label={{ value: "-3SD", position: "right", fill: "var(--danger)", fontSize: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="QC Value"
                      stroke="var(--brand-600)"
                      strokeWidth={2}
                      dot={(props: Record<string, unknown>) => {
                        const payload = props.payload as { critical?: boolean; abnormal?: boolean };
                        const r = payload?.critical ? 7 : payload?.abnormal ? 6 : 4;
                        const fill = payload?.critical ? "var(--danger)" : payload?.abnormal ? "var(--warning)" : "var(--brand-600)";
                        return (
                          <circle cx={Number(props.cx)} cy={Number(props.cy)} r={r} fill={fill} stroke="white" strokeWidth={2} />
                        );
                      }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-5">
              <div className="inline-flex items-center gap-2"><Dot tone="info" /> ± 1 SD range</div>
              <div className="inline-flex items-center gap-2"><Dot tone="warning" /> ± 2 SD (Warning)</div>
              <div className="inline-flex items-center gap-2"><Dot tone="danger" /> ± 3 SD (Reject)</div>
              <div className="inline-flex items-center gap-2"><span className="h-0.5 w-5 bg-[color:var(--brand-600)]" style={{ borderStyle: "dashed" }} /> Target mean</div>
              <div className="inline-flex items-center gap-2"><AlertTriangle size={12} className="text-[color:var(--warning)]" /> Westgard 1-2S / 1-3S applied</div>
            </div>
          </Card>
        </div>
      )}

      {reviewViolation && (
        <div className="fixed inset-0 z-[55] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setReviewViolation(null)}>
          <div className="w-full max-w-lg rounded-[var(--radius-xl)] border bg-[color:var(--surface)] p-6 shadow-[var(--shadow-lg)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[color:var(--danger-bg)] text-[color:var(--danger)]"><ShieldAlert size={20} /></div>
              <div>
                <h3 className="text-base font-semibold">Review QC Violation</h3>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  {reviewViolation.analyte} · {reviewViolation.controlLevel} · {reviewViolation.instrumentName}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-[color:var(--surface-2)] p-3 text-xs">
              <div>
                <p className="text-[10px] uppercase text-[color:var(--muted)]">Value</p>
                <p className="mt-0.5 font-bold text-[color:var(--danger)]">{reviewViolation.value}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[color:var(--muted)]">Expected</p>
                <p className="mt-0.5 font-semibold">{reviewViolation.expectedRange}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[color:var(--muted)]">Rule</p>
                <p className="mt-0.5 font-semibold">{violationLabels[reviewViolation.violationType] ?? reviewViolation.violationType}</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <Field label="Corrective action" name="corrective" required>
                <Textarea rows={4} value={reviewAction} onChange={(e) => setReviewAction(e.target.value)} placeholder="Describe the troubleshooting, recalibration, reagent change, or remedial steps taken…" />
              </Field>
              <label className="inline-flex items-center gap-2 text-xs text-[color:var(--foreground)]">
                <input type="checkbox" checked={reviewResolve} onChange={(e) => setReviewResolve(e.target.checked)} className="rounded border-[color:var(--line)] text-[color:var(--brand-600)]" />
                Mark violation as fully resolved and close it
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReviewViolation(null)}>Cancel</Button>
              <Button
                variant={reviewResolve ? "primary" : "outline"}
                leftIcon={reviewResolve ? <CheckCircle2 size={15} /> : <Plus size={15} />}
                loading={actions.review.isPending}
                onClick={() => actions.review.mutateAsync({ id: reviewViolation.id, correctiveAction: reviewAction, resolve: reviewResolve }).then(() => { setReviewViolation(null); setReviewAction(""); })}
                disabled={!reviewAction.trim()}
              >
                {reviewResolve ? "Acknowledge & Resolve" : "Save action"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
