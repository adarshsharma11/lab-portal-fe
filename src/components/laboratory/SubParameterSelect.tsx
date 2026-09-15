"use client";
import React, { useMemo, useState } from "react";
import { Filter, Sparkles } from "lucide-react";
import { cn } from "@/components/ui/index";
import { getSubParametersForTest, resolveMainParameter } from "@/lib/laboratory/test-parameter-definitions";

interface SubParameterSelectProps {
  testName: string;
  selectedSubParameters?: string[];
  onChange: (newSelection: string[]) => void;
  className?: string;
  label?: string;
}

export function SubParameterSelect({
  testName,
  selectedSubParameters,
  onChange,
  className = "",
  label = "Select Test Sub-Parameters",
}: SubParameterSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const mainConfig = useMemo(() => resolveMainParameter(testName), [testName]);
  const availableSubParameters = useMemo(() => getSubParametersForTest(testName), [testName]);

  const activeSelection = selectedSubParameters ?? [];
  const selectedSet = useMemo(() => new Set(activeSelection), [activeSelection]);

  if (!mainConfig || availableSubParameters.length === 0) {
    return null;
  }

  const filteredList = availableSubParameters.filter((sp) =>
    sp.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const isAllSelected =
    availableSubParameters.length > 0 && availableSubParameters.every((sp) => selectedSet.has(sp));
  const isNoneSelected = availableSubParameters.every((sp) => !selectedSet.has(sp));

  const handleToggle = (paramName: string) => {
    if (selectedSet.has(paramName)) {
      onChange(activeSelection.filter((p) => p !== paramName));
    } else {
      onChange([...activeSelection, paramName]);
    }
  };

  const handleSelectAll = () => {
    onChange([...availableSubParameters]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) handleSelectAll();
    else handleClearAll();
  };

  return (
    <div className={cn("rounded-xl border border-[#176b87]/20 bg-[#f0f9fa]/70 p-3 text-xs transition-all", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid size-6 place-items-center rounded-md bg-[#176b87] text-white">
            <Sparkles size={13} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[color:var(--foreground)]">{label}</span>
              <span className="inline-flex items-center rounded-md bg-[#176b87]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#176b87]">
                Main: {mainConfig.mainParameter}
              </span>
            </div>
            <p className="text-[11px] text-[color:var(--muted)]">
              {isNoneSelected
                ? "Tick the sub-parameters to include on the report"
                : isAllSelected
                ? `All ${availableSubParameters.length} sub-parameters selected`
                : `${activeSelection.length} of ${availableSubParameters.length} sub-parameters selected`}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2.5 border-t border-[#176b87]/15 pt-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#176b87]/25 bg-white px-2.5 py-2 text-xs font-semibold text-[#176b87] select-none">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = !isAllSelected && !isNoneSelected;
            }}
            onChange={(e) => handleSelectAllChange(e.target.checked)}
            className="size-3.5 rounded border-slate-300 text-[#176b87] focus:ring-0"
          />
          <span>Select all</span>
          <span className="ml-auto text-[11px] font-medium text-[color:var(--muted)]">
            {availableSubParameters.length} parameters
          </span>
        </label>

        {availableSubParameters.length > 8 && (
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sub-parameters..."
              className="w-full rounded-lg border border-slate-200 bg-white py-1 pl-7 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#176b87] focus:outline-hidden"
            />
            <Filter size={12} className="absolute left-2.5 top-2 text-slate-400" />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-56 overflow-y-auto pr-1">
          {filteredList.map((param) => {
            const isChecked = selectedSet.has(param);
            return (
              <label
                key={param}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs transition-all select-none",
                  isChecked
                    ? "border-[#176b87] bg-white font-semibold text-[#176b87] shadow-xs"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white"
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(param)}
                  className="size-3.5 rounded border-slate-300 text-[#176b87] focus:ring-0"
                />
                <span className="truncate">{param}</span>
              </label>
            );
          })}
        </div>

        {filteredList.length === 0 && (
          <p className="py-2 text-center text-xs text-slate-400">No matching sub-parameters found.</p>
        )}
      </div>
    </div>
  );
}
