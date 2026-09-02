"use client";
import React, { useState } from "react";
import { 
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from "recharts";
import { 
  Building2, Calendar, TrendingUp, TrendingDown, IndianRupee, Layers, CheckCircle2 
} from "lucide-react";
import { Card, StatusBadge, cn } from "@/components/ui/index";
import { useProfitLoss } from "@/features/dashboard/hooks";
import { useFranchise } from "@/lib/context/franchise-context";
import type { Franchise } from "@/types/domain";

interface ProfitLossSectionProps {
  isAdmin?: boolean;
  franchiseId?: string | "all";
  onFranchiseChange?: (franchiseId: string | "all") => void;
}

export function ProfitLossSection({
  isAdmin = false,
  franchiseId: propFranchiseId,
  onFranchiseChange,
}: ProfitLossSectionProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const { franchises, selectedFranchiseId, setSelectedFranchiseId, activeFranchiseName, isFranchiseUser } = useFranchise();

  // Active franchise scope
  const activeFranchiseId = propFranchiseId !== undefined 
    ? propFranchiseId 
    : (isFranchiseUser ? undefined : selectedFranchiseId);

  const { data: pnlReport, isLoading, isError } = useProfitLoss(
    selectedYear,
    activeFranchiseId === "all" ? undefined : activeFranchiseId
  );

  const handleFranchiseSelect = (val: string) => {
    if (onFranchiseChange) {
      onFranchiseChange(val as string | "all");
    } else {
      setSelectedFranchiseId(val as string | "all");
    }
  };

  const monthlyData = pnlReport?.monthlyData ?? [];
  const totalSale = pnlReport?.totalSale ?? 0;
  const totalCost = pnlReport?.totalCost ?? 0;
  const netProfitLoss = pnlReport?.netProfitLoss ?? 0;
  const overallMargin = pnlReport?.overallMargin ?? 0;
  const isProfitable = netProfitLoss >= 0;

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <Card className="border border-[color:var(--line)] shadow-sm overflow-hidden p-0">
      {/* 1. Header Banner */}
      <div className="bg-[#1e293b] text-white px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-base font-bold tracking-tight">Monthly Profit & Loss Report</h3>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            {isAdmin 
              ? (activeFranchiseId === "all" || !activeFranchiseId 
                  ? "Consolidated financial performance across all diagnostic franchises." 
                  : `Filtered view for ${pnlReport?.franchiseName || "selected franchise"}.`)
              : "Financial performance, operating costs, and net diagnostic margins."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Admin Franchise Dropdown */}
          {isAdmin && !isFranchiseUser && (
            <div className="flex items-center gap-2">
              <label htmlFor="pnl-franchise-select" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Building2 size={13} />
                Franchise:
              </label>
              <select
                id="pnl-franchise-select"
                value={activeFranchiseId || "all"}
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

          {/* Year Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="pnl-year-select" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Calendar size={13} />
              Select Year:
            </label>
            <select
              id="pnl-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#176b87] cursor-pointer"
            >
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* 2. Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[color:var(--muted)]">Total Annual Sale</span>
              <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <IndianRupee size={15} />
              </span>
            </div>
            <p className="mt-2 text-xl font-bold font-mono text-[color:var(--foreground)]">
              ₹{totalSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[color:var(--muted)] mt-1">Gross diagnostic revenue</p>
          </div>

          <div className="p-4 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[color:var(--muted)]">Total Operating Cost</span>
              <span className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <Layers size={15} />
              </span>
            </div>
            <p className="mt-2 text-xl font-bold font-mono text-[color:var(--foreground)]">
              ₹{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[color:var(--muted)] mt-1">Reagents & test consumables</p>
          </div>

          <div className={cn(
            "p-4 rounded-xl border shadow-2xs",
            isProfitable ? "bg-emerald-50/60 border-emerald-200" : "bg-rose-50/60 border-rose-200"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[color:var(--muted)]">Net Profit / Loss</span>
              <span className={cn(
                "grid size-7 place-items-center rounded-lg",
                isProfitable ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                {isProfitable ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
              </span>
            </div>
            <p className={cn(
              "mt-2 text-xl font-bold font-mono",
              isProfitable ? "text-emerald-700" : "text-rose-700"
            )}>
              {isProfitable ? "+" : ""}₹{netProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[color:var(--muted)] mt-1">Net profit after direct costs</p>
          </div>

          <div className="p-4 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[color:var(--muted)]">Net Profit Margin</span>
              <StatusBadge tone={isProfitable ? "success" : "danger"} size="sm">
                {overallMargin}%
              </StatusBadge>
            </div>
            <p className="mt-2 text-xl font-bold font-mono text-[color:var(--foreground)]">
              {overallMargin}%
            </p>
            <p className="text-[11px] text-[color:var(--muted)] mt-1">Overall margin percentage</p>
          </div>
        </div>

        {/* 3. Graphical Chart */}
        <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-[color:var(--foreground)]">Monthly Profit / Loss Trend ({selectedYear})</h4>
              <p className="text-xs text-[color:var(--muted)]">Monthly dynamic profit and loss distribution.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-emerald-600 inline-block" />
                Profit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-rose-600 inline-block" />
                Loss
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12} 
                  tickMargin={8}
                  stroke="var(--muted)" 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={11} 
                  tickMargin={8}
                  stroke="var(--muted)"
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip 
                  cursor={{ fill: "var(--surface-2)", opacity: 0.5 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0].payload;
                    const pnl = item.profitLoss;
                    const positive = pnl >= 0;
                    return (
                      <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3 shadow-lg text-xs space-y-1.5 min-w-[170px]">
                        <p className="font-bold text-sm text-[color:var(--foreground)] border-b border-[color:var(--line)] pb-1">
                          {item.month} {selectedYear}
                        </p>
                        <div className="flex justify-between text-[color:var(--muted)]">
                          <span>Total Sale:</span>
                          <span className="font-mono font-semibold text-[color:var(--foreground)]">₹{item.totalSale.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-[color:var(--muted)]">
                          <span>Total Cost:</span>
                          <span className="font-mono font-semibold text-[color:var(--foreground)]">₹{item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-[color:var(--line)] font-bold">
                          <span>Profit / Loss:</span>
                          <span className={cn("font-mono", positive ? "text-emerald-600" : "text-rose-600")}>
                            {positive ? "+" : ""}₹{pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-[color:var(--muted)]">
                          <span>Margin:</span>
                          <span>{item.marginPercentage}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="profitLoss" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.profitLoss >= 0 ? "#16a34a" : "#dc2626"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Month-Wise Breakdown Table */}
        <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[color:var(--line)] bg-slate-50/80 text-[color:var(--muted)] uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-right">Total Sale</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4 text-right">Profit / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--line)]">
                {monthlyData.map((row) => {
                  const positive = row.profitLoss >= 0;
                  return (
                    <tr key={row.month} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[color:var(--foreground)]">
                        {row.month}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[color:var(--foreground)]">
                        ₹{row.totalSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[color:var(--muted)]">
                        ₹{row.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={cn(
                        "py-3 px-4 text-right font-mono font-bold",
                        positive ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {positive ? "+" : ""}₹{row.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[color:var(--line)] bg-slate-100/70 font-bold text-xs">
                  <td className="py-3.5 px-4 text-[color:var(--foreground)] uppercase">
                    Total ({selectedYear})
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[color:var(--foreground)]">
                    ₹{totalSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[color:var(--foreground)]">
                    ₹{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={cn(
                    "py-3.5 px-4 text-right font-mono font-bold text-sm",
                    isProfitable ? "text-emerald-700" : "text-rose-700"
                  )}>
                    {isProfitable ? "+" : ""}₹{netProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
}
