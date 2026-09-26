"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, Calendar, IndianRupee, FileText, Users, ArrowUpRight, 
  CheckCircle2, Clock3, Filter, Download, Printer, Search, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from "recharts";
import { Card, Button, StatusBadge, cn } from "@/components/ui/index";
import { useSalesReport } from "@/features/dashboard/hooks";
import { useFranchise } from "@/lib/context/franchise-context";
import type { SalesReportInvoiceItem } from "@/types/domain";

interface MonthlySalesReportSectionProps {
  isAdmin?: boolean;
  franchiseId?: string | "all";
  onFranchiseChange?: (franchiseId: string | "all") => void;
  className?: string;
}

export function MonthlySalesReportSection({
  isAdmin = false,
  franchiseId: propFranchiseId,
  onFranchiseChange,
  className = "",
}: MonthlySalesReportSectionProps) {
  const { franchises, selectedFranchiseId, setSelectedFranchiseId, isFranchiseUser } = useFranchise();

  // Helper to format date as YYYY-MM-DD
  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Defaults to 1st of current month to today
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState<string>(formatYMD(firstDayOfMonth));
  const [endDate, setEndDate] = useState<string>(formatYMD(today));
  const [activePreset, setActivePreset] = useState<string>("this_month");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDetailedList, setShowDetailedList] = useState<boolean>(false);

  // Franchise Scoping
  const effectiveFranchiseId = propFranchiseId !== undefined 
    ? propFranchiseId 
    : (isFranchiseUser ? undefined : selectedFranchiseId);

  const queryFranchise = effectiveFranchiseId === "all" ? undefined : effectiveFranchiseId;

  const { data: report, isLoading, isFetching, refetch } = useSalesReport(
    startDate,
    endDate,
    queryFranchise
  );

  const handleFranchiseSelect = (val: string) => {
    if (onFranchiseChange) {
      onFranchiseChange(val as string | "all");
    } else {
      setSelectedFranchiseId(val as string | "all");
    }
  };

  // Quick Preset Handlers
  const handlePreset = (preset: string) => {
    setActivePreset(preset);
    const now = new Date();
    if (preset === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatYMD(start));
      setEndDate(formatYMD(now));
    } else if (preset === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(formatYMD(start));
      setEndDate(formatYMD(end));
    } else if (preset === "last_30_days") {
      const start = new Date();
      start.setDate(now.getDate() - 30);
      setStartDate(formatYMD(start));
      setEndDate(formatYMD(now));
    } else if (preset === "today") {
      setStartDate(formatYMD(now));
      setEndDate(formatYMD(now));
    } else if (preset === "all_time") {
      setStartDate("");
      setEndDate("");
    }
  };

  const summary = report?.summary || {
    totalSales: 0,
    paidAmount: 0,
    pendingAmount: 0,
    totalDiscount: 0,
    totalTax: 0,
    totalInvoices: 0,
    uniquePatients: 0,
    averageInvoiceValue: 0,
  };

  const dateWiseBreakdown = report?.dateWiseBreakdown || [];
  const rawInvoices = report?.invoices || [];

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return rawInvoices.filter((inv) => {
      if (statusFilter !== "all" && inv.paymentStatus !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          inv.billNumber.toLowerCase().includes(q) ||
          inv.patientName.toLowerCase().includes(q) ||
          inv.patientCode.toLowerCase().includes(q) ||
          (inv.doctorName && inv.doctorName.toLowerCase().includes(q)) ||
          (inv.itemsSummary && inv.itemsSummary.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [rawInvoices, statusFilter, searchTerm]);

  // Chart data for daily sales
  const chartData = useMemo(() => {
    return dateWiseBreakdown
      .slice()
      .reverse()
      .map((d) => ({
        date: d.date.length >= 10 ? d.date.slice(5) : d.date,
        fullDate: d.date,
        sales: d.totalSales,
        paid: d.paidAmount,
        pending: d.pendingAmount,
        invoices: d.invoiceCount,
      }));
  }, [dateWiseBreakdown]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <Card className={cn("border border-[color:var(--line)] shadow-sm overflow-hidden p-0", className)}>
      {/* 1. Top Header Banner */}
      <div className="bg-[#0f172a] text-white px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-[#38bdf8] animate-pulse" />
            <h3 className="text-base font-bold tracking-tight">Monthly Revenue & Sales Report</h3>
            {isFetching && <RefreshCw size={13} className="animate-spin text-slate-400" />}
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            {isAdmin && !isFranchiseUser
              ? (effectiveFranchiseId === "all" || !effectiveFranchiseId
                  ? "Consolidated date-range revenue analytics across all diagnostic hubs."
                  : `Filtered sales analytics for ${report?.franchiseName || "selected franchise"}.`)
              : `Sales and revenue performance for ${report?.franchiseName || "this franchise"}.`}
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Admin Franchise Filter */}
          {isAdmin && !isFranchiseUser && (
            <div className="flex items-center gap-1.5">
              <label htmlFor="sales-franchise-select" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Building2 size={13} />
                Franchise:
              </label>
              <select
                id="sales-franchise-select"
                value={effectiveFranchiseId || "all"}
                onChange={(e) => handleFranchiseSelect(e.target.value)}
                className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#176b87] cursor-pointer"
              >
                <option value="all">🌐 All Franchises (Combined)</option>
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
            <div className="flex items-center gap-1 px-1.5 text-slate-300">
              <Calendar size={13} />
              <span className="font-medium text-[11px]">From:</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset("custom");
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
            <span className="text-slate-400 text-xs px-0.5">–</span>
            <div className="flex items-center gap-1 px-1.5 text-slate-300">
              <span className="font-medium text-[11px]">To:</span>
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset("custom");
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 text-xs"
            leftIcon={<Printer size={13} />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </div>
      </div>

      {/* 2. Quick Preset Chips */}
      <div className="bg-slate-50 border-b border-[color:var(--line)] px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[color:var(--muted)] font-semibold text-[11px]">Date Presets:</span>
          <button
            type="button"
            onClick={() => handlePreset("this_month")}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition text-xs",
              activePreset === "this_month"
                ? "bg-[#176b87] text-white shadow-xs"
                : "bg-white border border-[color:var(--line)] text-[color:var(--foreground)] hover:bg-slate-100"
            )}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => handlePreset("last_month")}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition text-xs",
              activePreset === "last_month"
                ? "bg-[#176b87] text-white shadow-xs"
                : "bg-white border border-[color:var(--line)] text-[color:var(--foreground)] hover:bg-slate-100"
            )}
          >
            Last Month
          </button>
          <button
            type="button"
            onClick={() => handlePreset("last_30_days")}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition text-xs",
              activePreset === "last_30_days"
                ? "bg-[#176b87] text-white shadow-xs"
                : "bg-white border border-[color:var(--line)] text-[color:var(--foreground)] hover:bg-slate-100"
            )}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => handlePreset("today")}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition text-xs",
              activePreset === "today"
                ? "bg-[#176b87] text-white shadow-xs"
                : "bg-white border border-[color:var(--line)] text-[color:var(--foreground)] hover:bg-slate-100"
            )}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handlePreset("all_time")}
            className={cn(
              "px-2.5 py-1 rounded-md font-medium transition text-xs",
              activePreset === "all_time"
                ? "bg-[#176b87] text-white shadow-xs"
                : "bg-white border border-[color:var(--line)] text-[color:var(--foreground)] hover:bg-slate-100"
            )}
          >
            All Time
          </button>
        </div>

        <div className="text-[11px] text-[color:var(--muted)] font-medium">
          Period: <span className="font-bold text-[color:var(--foreground)]">{startDate || "Start"}</span> to{" "}
          <span className="font-bold text-[color:var(--foreground)]">{endDate || "Current"}</span>
        </div>
      </div>

      {/* 3. Executive KPI Metrics Grid */}
      <div className="p-5 border-b border-[color:var(--line)]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Total Sales */}
          <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-sky-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales</span>
              <IndianRupee size={15} />
            </div>
            <div className="mt-2">
              <p className="text-xl font-extrabold text-slate-900">₹{summary.totalSales.toLocaleString()}</p>
              <p className="text-[10px] text-[color:var(--muted)] mt-0.5">Gross Revenue for Period</p>
            </div>
          </div>

          {/* Card 2: Total Paid */}
          <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Collected / Paid</span>
              <CheckCircle2 size={15} />
            </div>
            <div className="mt-2">
              <p className="text-xl font-extrabold text-emerald-700">₹{summary.paidAmount.toLocaleString()}</p>
              <p className="text-[10px] text-[color:var(--muted)] mt-0.5">
                {summary.totalSales > 0 ? `${Math.round((summary.paidAmount / summary.totalSales) * 100)}% Realized` : "0% Realized"}
              </p>
            </div>
          </div>

          {/* Card 3: Total Pending / Due */}
          <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending / Due</span>
              <Clock3 size={15} />
            </div>
            <div className="mt-2">
              <p className="text-xl font-extrabold text-amber-700">₹{summary.pendingAmount.toLocaleString()}</p>
              <p className="text-[10px] text-[color:var(--muted)] mt-0.5">Outstanding Balance</p>
            </div>
          </div>

          {/* Card 4: Total Invoices */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Invoices</span>
              <FileText size={15} />
            </div>
            <div className="mt-2">
              <p className="text-xl font-extrabold text-slate-900">{summary.totalInvoices}</p>
              <p className="text-[10px] text-[color:var(--muted)] mt-0.5">Bills Generated</p>
            </div>
          </div>

          {/* Card 5: Unique Patients */}
          <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Patients</span>
              <Users size={15} />
            </div>
            <div className="mt-2">
              <p className="text-xl font-extrabold text-indigo-900">{summary.uniquePatients}</p>
              <p className="text-[10px] text-[color:var(--muted)] mt-0.5">Patients Served</p>
            </div>
          </div>

          {/* Card 6: Average Bill Value */}
          <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-purple-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Avg. Ticket</span>
              <ArrowUpRight size={15} />
            </div>
            <div className="mt-2">
              <p className="text-xl font-extrabold text-purple-900">₹{summary.averageInvoiceValue}</p>
              <p className="text-[10px] text-[color:var(--muted)] mt-0.5">Per Diagnostic Bill</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Chart & Date-wise Breakdown Section */}
      <div className="p-5 grid gap-6 lg:grid-cols-12">
        {/* Left Column: Daily Sales Trend Chart (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--foreground)]">
              Daily Sales Trend ({chartData.length} active dates)
            </h4>
            <span className="text-[11px] text-[color:var(--muted)]">Amounts in INR (₹)</span>
          </div>

          <div className="h-64 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#176b87" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#176b87" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-[color:var(--line)] bg-slate-900 p-2.5 text-xs text-white shadow-md">
                            <p className="font-bold text-sky-300">{data.fullDate}</p>
                            <p className="mt-1 font-semibold text-emerald-400">Total Sales: ₹{data.sales}</p>
                            <p className="text-[11px] text-slate-300">Paid: ₹{data.paid} · Invoices: {data.invoices}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#176b87"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-[color:var(--muted)]">
                No billing transactions recorded in selected date range.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Date-wise Sales Table (5 cols) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--foreground)]">
                Date-wise Sales Summary
              </h4>
              <span className="text-[11px] font-semibold text-[#176b87]">
                {dateWiseBreakdown.length} Dates Listed
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 text-[color:var(--muted)] border-b border-[color:var(--line)] font-semibold">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-2 text-right">Bills</th>
                    <th className="py-2 px-2 text-right">Paid (₹)</th>
                    <th className="py-2 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--line)]">
                  {dateWiseBreakdown.map((item) => (
                    <tr key={item.date} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 font-medium font-mono text-[11px]">{item.date}</td>
                      <td className="py-2 px-2 text-right text-[color:var(--muted)]">{item.invoiceCount}</td>
                      <td className="py-2 px-2 text-right text-emerald-700 font-semibold">₹{item.paidAmount}</td>
                      <td className="py-2 px-3 text-right font-bold text-[color:var(--foreground)]">₹{item.totalSales}</td>
                    </tr>
                  ))}
                  {dateWiseBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-[color:var(--muted)]">
                        No date-wise sales data available for this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Toggle Button for Detailed Invoices List */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetailedList(!showDetailedList)}
            className="w-full justify-between mt-2"
            rightIcon={showDetailedList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          >
            <span>{showDetailedList ? "Hide Date-wise Invoices List" : `View All Detailed Invoices (${rawInvoices.length})`}</span>
          </Button>
        </div>
      </div>

      {/* 5. Detailed Date-wise Invoices / Transactions Drawer / Table */}
      {showDetailedList && (
        <div className="border-t border-[color:var(--line)] bg-slate-50/50 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-[color:var(--foreground)]">
                Date-wise Detailed Billing Transactions ({filteredInvoices.length})
              </h4>
              <p className="text-xs text-[color:var(--muted)]">
                Complete line items and payment statuses for selected range.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search input */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-[color:var(--muted)]" />
                <input
                  type="text"
                  placeholder="Search patient, bill #, test..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg border border-[color:var(--line)] bg-white pl-8 pr-3 py-1.5 text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#176b87] w-56"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-[color:var(--line)] bg-white px-2.5 py-1.5 text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#176b87]"
              >
                <option value="all">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[color:var(--line)] bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[color:var(--muted)] border-b border-[color:var(--line)] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Bill Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Patient Details</th>
                  <th className="py-2.5 px-3">Referring Doctor</th>
                  <th className="py-2.5 px-3">Services / Tests</th>
                  {isAdmin && <th className="py-2.5 px-3">Franchise</th>}
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--line)]">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#176b87]">
                      {inv.billNumber}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[color:var(--muted)]">
                      {inv.billDate || inv.createdAt.slice(0, 10)}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-[color:var(--foreground)]">{inv.patientName}</p>
                      <p className="font-mono text-[10px] text-[color:var(--muted)]">{inv.patientCode}</p>
                    </td>
                    <td className="py-2.5 px-3 text-[color:var(--foreground)]">
                      {inv.doctorName || "—"}
                    </td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-[color:var(--muted)]" title={inv.itemsSummary}>
                      {inv.itemsSummary}
                    </td>
                    {isAdmin && (
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center rounded bg-[#e8f4f7] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#176b87]">
                          {inv.franchiseCode || inv.franchiseName || "HQ"}
                        </span>
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[color:var(--foreground)]">
                      ₹{inv.total}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge tone={inv.paymentStatus === "Paid" ? "success" : "warning"} size="sm">
                        {inv.paymentStatus}
                      </StatusBadge>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Link href={`/billing/${inv.id}`}>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} className="py-8 text-center text-xs text-[color:var(--muted)]">
                      No invoices found matching the current search / filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
