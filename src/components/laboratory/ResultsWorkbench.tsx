"use client";
import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Activity, AlertTriangle, CheckCircle2, ChevronRight, FileText, 
  FlaskConical, Plus, Search, Calendar, UserCheck, Clock, ShieldAlert, Sparkles, Receipt
} from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { PageHeader, StatusBadge, Button, Input, Select, Card, cn, SearchableCombobox } from "@/components/ui/index";
import { DataTable } from "@/components/tables/DataTable";
import { usePatients } from "@/features/crud/hooks";
import { useReports } from "@/features/reports/hooks";
import { useTests, useSamples } from "@/features/laboratory/hooks";
import { useInvoices } from "@/features/operations/hooks";
import { authService } from "@/lib/auth/auth-service";
import type { Patient, Report, Test, Sample, Invoice, UserRole } from "@/types/domain";

export function ResultsWorkbench() {
  const router = useRouter();
  const patientsQuery = usePatients();
  const reportsQuery = useReports();
  const testsQuery = useTests();
  const samplesQuery = useSamples();
  const invoicesQuery = useInvoices();

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>("");
  const [currentSession, setCurrentSession] = useState<{ role?: UserRole; franchiseId?: string } | null>(null);

  useEffect(() => {
    const s = authService.getSession();
    if (s) {
      setCurrentSession({ role: s.role, franchiseId: s.franchiseId });
    }
  }, []);

  const isAdmin = currentSession?.role === "Admin" || currentSession?.role === "Administrator";

  const allPatients = (patientsQuery.data ?? []) as Patient[];
  const allReports = (reportsQuery.data ?? []) as Report[];
  const allInvoices = (invoicesQuery.data ?? []) as Invoice[];
  const allTests = (testsQuery.data ?? []) as Test[];

  // Filter patients by franchise tenancy
  const tenantPatients = useMemo(() => {
    if (!isAdmin && currentSession?.franchiseId) {
      return allPatients.filter(p => !p.franchiseId || p.franchiseId === currentSession.franchiseId);
    }
    return allPatients;
  }, [allPatients, isAdmin, currentSession]);

  // Build pending queue: patients with pending tests/billing/reports (omit completely finished ones)
  const pendingPatientsQueue = useMemo(() => {
    return tenantPatients.filter(patient => {
      // Check date filter if selected (past dates and today only)
      if (selectedDate) {
        const pDate = patient.createdAt ? new Date(patient.createdAt).toISOString().slice(0, 10) : "";
        if (pDate !== selectedDate) return false;
      }

      // Check patient specific search/combobox filter
      if (selectedPatientFilter && patient.id !== selectedPatientFilter && patient.patientCode !== selectedPatientFilter) {
        return false;
      }

      // Check completion status: if patient has approved report and paid invoice, check if fully completed
      const patientReports = allReports.filter(r => r.patientId === patient.id);
      const hasApprovedReport = patientReports.some(r => r.status === "Approved");
      
      const patientInvoices = allInvoices.filter(inv => inv.patientId === patient.id || inv.patientId === patient.patientCode);
      const hasPaidInvoice = patientInvoices.some(inv => inv.paymentStatus === "Paid");

      // Patients whose test, billing, and report are ALL completed are omitted from pending queue
      const isFullyCompleted = hasApprovedReport && hasPaidInvoice && patientReports.length > 0;
      return !isFullyCompleted;
    });
  }, [tenantPatients, selectedDate, selectedPatientFilter, allReports, allInvoices]);

  // Patient dropdown options for quick search
  const patientComboboxOptions = useMemo(() => {
    let list = tenantPatients;
    if (selectedDate) {
      list = list.filter(p => {
        const pDate = p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : "";
        return pDate === selectedDate;
      });
    }
    return list.map(p => ({
      value: p.id,
      label: p.name,
      secondary: `Code: ${p.patientCode || p.id} · Registered: ${p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "Recent"}`,
      badge: p.phone,
      extra: p,
    }));
  }, [tenantPatients, selectedDate]);

  const columns = useMemo(() => {
    const h = createColumnHelper<Patient>();
    return [
      h.accessor("patientCode", {
        header: "Patient Code",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-bold text-[#176b87] bg-[#e8f4f7] px-2 py-0.5 rounded border border-[#176b87]/20">
            {getValue()}
          </span>
        ),
      }),
      h.accessor("name", {
        header: "Patient Details",
        cell: ({ row, getValue }) => (
          <div>
            <span className="font-bold text-[color:var(--foreground)] block">{getValue()}</span>
            <span className="text-xs text-[color:var(--muted)]">
              {row.original.age} Yrs · {row.original.sex || "—"} {row.original.bloodGroup ? `· ${row.original.bloodGroup}` : ""}
            </span>
          </div>
        ),
      }),
      h.accessor("phone", {
        header: "Contact Phone",
        cell: ({ getValue }) => <span className="font-mono text-xs text-[color:var(--foreground)]">{getValue() || "—"}</span>,
      }),
      h.accessor("createdAt", {
        header: "Registered Date",
        cell: ({ getValue }) => (
          <span className="text-xs text-[color:var(--muted)] font-medium">
            {getValue() ? new Date(getValue() as any).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today"}
          </span>
        ),
      }),
      h.display({
        id: "status",
        header: "Pending Status",
        cell: ({ row }) => {
          const patientId = row.original.id;
          const patientCode = row.original.patientCode;
          const patientReports = allReports.filter(r => r.patientId === patientId);
          const patientInvoices = allInvoices.filter(inv => inv.patientId === patientId || inv.patientId === patientCode);
          const patientTests = allTests.filter(t => t.patientId === patientId);

          const hasReport = patientReports.length > 0;
          const hasInvoice = patientInvoices.length > 0;

          if (!hasReport && !hasInvoice) {
            return <StatusBadge tone="danger" size="sm">Report & Billing Pending</StatusBadge>;
          }
          if (!hasReport) {
            return <StatusBadge tone="warning" size="sm">Report Pending</StatusBadge>;
          }
          if (!hasInvoice) {
            return <StatusBadge tone="warning" size="sm">Billing Pending</StatusBadge>;
          }
          return <StatusBadge tone="info" size="sm">Report In Review</StatusBadge>;
        },
      }),
      h.display({
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const p = row.original;
          const patientInvoices = allInvoices.filter(inv => inv.patientId === p.id || inv.patientId === p.patientCode);
          let testsQueryParam = "";
          if (patientInvoices.length > 0) {
            const rawItems: any = patientInvoices[0].items;
            let itemsList: any[] = [];
            if (typeof rawItems === "string") {
              try { itemsList = JSON.parse(rawItems); } catch {}
            } else if (Array.isArray(rawItems)) {
              itemsList = rawItems;
            }
            if (itemsList.length > 0) {
              const testCodes = itemsList.map(it => it.code || it.description);
              testsQueryParam = `&tests=${encodeURIComponent(JSON.stringify(testCodes))}`;
            }
          }

          return (
            <div className="flex items-center justify-center gap-2">
              <Link href={`/reports/new?patientId=${p.id}&patientCode=${encodeURIComponent(p.patientCode)}${testsQueryParam}`}>
                <Button size="sm" variant="primary" leftIcon={<FileText size={13} />}>
                  Generate Report
                </Button>
              </Link>
            </div>
          );
        },
      }),
    ];
  }, [allReports, allInvoices, allTests]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Results & Report Generation Queue"
        description="Patients awaiting laboratory test reports, results entry, or diagnostic verification. Generate reports directly from queue."
        action={
          <div className="flex items-center gap-3">
            <Link href="/reports">
              <Button variant="outline">View All Reports</Button>
            </Link>
            <Link href="/reports/new">
              <Button variant="primary" leftIcon={<Plus size={16} />}>
                Direct Report Form
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 border border-rose-200 bg-rose-50/40">
          <span className="text-xs text-rose-700 font-semibold flex items-center gap-1.5">
            <Clock size={14} /> Total Patients Pending Action
          </span>
          <p className="text-2xl font-black text-rose-800 mt-1">{pendingPatientsQueue.length}</p>
        </Card>
        <Card className="p-4 border border-amber-200 bg-amber-50/40">
          <span className="text-xs text-amber-700 font-semibold flex items-center gap-1.5">
            <FileText size={14} /> Reports Awaiting Generation
          </span>
          <p className="text-2xl font-black text-amber-800 mt-1">
            {pendingPatientsQueue.filter(p => !allReports.some(r => r.patientId === p.id)).length}
          </p>
        </Card>
        <Card className="p-4 border border-emerald-200 bg-emerald-50/40">
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Total Registered Patients
          </span>
          <p className="text-2xl font-black text-emerald-800 mt-1">{tenantPatients.length}</p>
        </Card>
      </div>

      {/* Dynamic Date & Patient Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[color:var(--surface)] border border-[color:var(--line)] rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Date Filter: Today and Past Dates only */}
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-[#176b87]" />
            <span className="text-xs font-bold text-[color:var(--foreground)]">Filter by Date:</span>
            <Input
              type="date"
              max={todayStr}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedPatientFilter("");
              }}
              className="h-8 text-xs w-44 font-medium"
            />
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2 text-rose-600"
                onClick={() => {
                  setSelectedDate("");
                  setSelectedPatientFilter("");
                }}
              >
                Clear Date
              </Button>
            )}
          </div>

          {/* Patient Filter Combobox */}
          <div className="min-w-[260px] flex-1 max-w-md">
            <SearchableCombobox
              options={patientComboboxOptions}
              value={selectedPatientFilter}
              onChange={(val) => setSelectedPatientFilter(val)}
              placeholder={selectedDate ? `Search patients registered on ${selectedDate}...` : "Select / search patient..."}
              searchPlaceholder="Search by name, code, phone..."
            />
          </div>
        </div>

        <span className="text-xs font-medium text-[color:var(--muted)]">
          Showing <b>{pendingPatientsQueue.length}</b> pending patients
        </span>
      </div>

      {/* Main Pending Patients Table */}
      <DataTable
        columns={columns}
        data={pendingPatientsQueue}
        isLoading={patientsQuery.isLoading}
        isError={patientsQuery.isError}
        searchable
        searchPlaceholder="Search patient code, name, phone..."
      />
    </div>
  );
}
