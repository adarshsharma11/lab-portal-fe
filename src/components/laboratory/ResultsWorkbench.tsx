"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Activity, AlertTriangle, CheckCircle2, ChevronRight, Download, 
  Eye, FileBarChart, FileText, Filter, FlaskConical, Plus, Search, ShieldAlert, Sparkles 
} from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { PageHeader, StatusBadge, Button, Input, Select, Card, cn } from "@/components/ui/index";
import { DataTable } from "@/components/tables/DataTable";
import { useResults, useSamples } from "@/features/laboratory/hooks";
import { usePatients } from "@/features/crud/hooks";
import type { Result, Patient, Sample } from "@/types/domain";

export function ResultsWorkbench() {
  const router = useRouter();
  const resultsQuery = useResults();
  const patientsQuery = usePatients();
  const samplesQuery = useSamples();

  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedFlag, setSelectedFlag] = useState<"All" | "Critical" | "Abnormal" | "Normal">("All");

  const patientsMap = useMemo(() => {
    const map = new Map<string, Patient>();
    (patientsQuery.data ?? []).forEach((p: Patient) => map.set(p.id, p));
    return map;
  }, [patientsQuery.data]);

  const rawResults = resultsQuery.data ?? [];

  const filteredResults = useMemo(() => {
    return rawResults.filter(r => {
      const test = (r as any).test;
      const dept = test?.department || "General";
      if (selectedDept !== "All" && dept !== selectedDept) return false;
      if (selectedFlag === "Critical" && !r.criticalFlag) return false;
      if (selectedFlag === "Abnormal" && (!r.abnormalFlag || r.criticalFlag)) return false;
      if (selectedFlag === "Normal" && (r.abnormalFlag || r.criticalFlag)) return false;
      return true;
    });
  }, [rawResults, selectedDept, selectedFlag]);

  const columns = useMemo(() => {
    const h = createColumnHelper<Result>();
    return [
      h.accessor("parameter", {
        header: "Parameter / Analyte",
        cell: ({ row, getValue }) => {
          const test = (row.original as any).test;
          return (
            <div>
              <span className="font-bold text-[color:var(--foreground)]">{getValue()}</span>
              {test?.name && (
                <p className="text-[11px] text-[color:var(--muted)]">{test.name}</p>
              )}
            </div>
          );
        }
      }),
      h.accessor(row => (row as any).test?.department || "Hematology", {
        id: "department",
        header: "Department",
        cell: ({ getValue }) => <span className="text-xs text-[color:var(--muted)]">{getValue()}</span>
      }),
      h.accessor("value", {
        header: "Observed Value",
        cell: ({ row, getValue }) => {
          const isCrit = row.original.criticalFlag;
          const isAbn = row.original.abnormalFlag;
          return (
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "font-mono font-bold text-sm",
                isCrit ? "text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200" :
                isAbn ? "text-amber-700 font-extrabold" : "text-[color:var(--foreground)]"
              )}>
                {getValue()}
              </span>
              <span className="text-xs text-[color:var(--muted)] font-mono">{row.original.unit}</span>
            </div>
          );
        }
      }),
      h.accessor("referenceRange", {
        header: "Bio. Ref Interval",
        cell: ({ getValue }) => <span className="text-xs font-medium text-[color:var(--muted)]">{getValue() || "—"}</span>
      }),
      h.display({
        id: "status",
        header: "Flag / Status",
        cell: ({ row }) => {
          const isCrit = row.original.criticalFlag;
          const isAbn = row.original.abnormalFlag;
          if (isCrit) return <StatusBadge tone="danger" size="sm">Critical</StatusBadge>;
          if (isAbn) return <StatusBadge tone="warning" size="sm">Abnormal</StatusBadge>;
          return <StatusBadge tone="success" size="sm">Normal</StatusBadge>;
        }
      }),
      h.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const test = (row.original as any).test;
          const testCode = test?.code || "CBC";

          return (
            <div className="flex items-center justify-center gap-2">
              <Link href={`/reports/new?testCode=${testCode}`}>
                <Button size="sm" variant="primary" leftIcon={<FileText size={13} />}>
                  Generate Report
                </Button>
              </Link>
            </div>
          );
        }
      })
    ];
  }, []);

  const criticalCount = rawResults.filter(r => r.criticalFlag).length;
  const abnormalCount = rawResults.filter(r => r.abnormalFlag && !r.criticalFlag).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laboratory Test Results Workbench"
        description="Review analyzer-verified parameters, track clinical abnormalities, and generate test-specific diagnostic reports."
        action={
          <div className="flex items-center gap-3">
            <Link href="/reports">
              <Button variant="outline">Diagnostic Reports</Button>
            </Link>
            <Link href="/reports/new">
              <Button variant="primary" leftIcon={<Plus size={16} />}>
                Generate Report
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 border border-[color:var(--line)]">
          <span className="text-xs text-[color:var(--muted)] font-medium">Total Parameters Verified</span>
          <p className="text-2xl font-black text-[color:var(--foreground)] mt-1">{rawResults.length}</p>
        </Card>
        <Card className="p-4 border border-rose-200 bg-rose-50/40">
          <span className="text-xs text-rose-700 font-semibold flex items-center gap-1.5">
            <ShieldAlert size={14} /> Critical Values
          </span>
          <p className="text-2xl font-black text-rose-800 mt-1">{criticalCount}</p>
        </Card>
        <Card className="p-4 border border-amber-200 bg-amber-50/40">
          <span className="text-xs text-amber-700 font-semibold flex items-center gap-1.5">
            <AlertTriangle size={14} /> Abnormal Values
          </span>
          <p className="text-2xl font-black text-amber-800 mt-1">{abnormalCount}</p>
        </Card>
        <Card className="p-4 border border-emerald-200 bg-emerald-50/40">
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Within Normal Range
          </span>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {Math.max(0, rawResults.length - criticalCount - abnormalCount)}
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[color:var(--surface)] border border-[color:var(--line)] rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[color:var(--muted)]">Department:</span>
            <Select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-8 text-xs w-44"
            >
              <option value="All">All Departments</option>
              <option value="Hematology">Hematology</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Immunology">Immunology</option>
              <option value="Clinical Pathology">Clinical Pathology</option>
              <option value="Electrolytes">Electrolytes</option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[color:var(--muted)]">Flag Filter:</span>
            <Select
              value={selectedFlag}
              onChange={(e) => setSelectedFlag(e.target.value as any)}
              className="h-8 text-xs w-36"
            >
              <option value="All">All Flags</option>
              <option value="Critical">Critical Only</option>
              <option value="Abnormal">Abnormal Only</option>
              <option value="Normal">Normal Only</option>
            </Select>
          </div>
        </div>

        <span className="text-xs font-medium text-[color:var(--muted)]">
          Showing <b>{filteredResults.length}</b> verified results
        </span>
      </div>

      {/* Main Results Table */}
      <DataTable
        columns={columns}
        data={filteredResults}
        isLoading={resultsQuery.isLoading}
        isError={resultsQuery.isError}
        searchable
        searchPlaceholder="Search parameters, tests, units..."
      />
    </div>
  );
}
