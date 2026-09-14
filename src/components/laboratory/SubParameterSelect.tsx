"use client";
import React, { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Filter, Sparkles, X } from "lucide-react";
import { Button, cn } from "@/components/ui/index";
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const mainConfig = useMemo(() => resolveMainParameter(testName), [testName]);
  const availableSubParameters = useMemo(() => getSubParametersForTest(testName), [testName]);

  const activeSelection = useMemo(() => {
    return selectedSubParameters ?? availableSubParameters;
  }, [selectedSubParameters, availableSubParameters]);

  if (!mainConfig || availableSubParameters.length === 0) {
    return null;
  }

  const filteredList = availableSubParameters.filter(sp =>
    sp.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const isAllSelected = availableSubParameters.length > 0 && activeSelection.length === availableSubParameters.length;
  const isNoneSelected = activeSelection.length === 0;

  const handleToggle = (paramName: string) => {
    if (activeSelection.includes(paramName)) {
      onChange(activeSelection.filter(p => p !== paramName));
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

  return (
    <div className={cn("rounded-xl border border-[#176b87]/20 bg-[#f0f9fa]/70 p-3 text-xs transition-all", className)}>
      {/* Header bar */}
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
              {activeSelection.length === 0
                ? "No sub-parameters selected (all will be omitted)"
                : activeSelection.length === availableSubParameters.length
                ? `All ${availableSubParameters.length} sub-parameters active`
                : `${activeSelection.length} of ${availableSubParameters.length} sub-parameters selected for report`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={isAllSelected}
            className="rounded px-2 py-1 text-[11px] font-semibold text-[#176b87] hover:bg-[#176b87]/10 disabled:opacity-40"
          >
            Select All
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={isNoneSelected}
            className="rounded px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40"
          >
            Clear
          </button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-1 h-7 text-xs"
            onClick={() => setIsOpen(!isOpen)}
            rightIcon={isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          >
            {isOpen ? "Hide List" : "Customize"}
          </Button>
        </div>
      </div>

      {/* Selected Pills Summary (when collapsed) */}
      {!isOpen && activeSelection.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1 border-t border-[#176b87]/10 pt-2">
          {activeSelection.map((param) => (
            <span
              key={param}
              className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-xs border border-slate-200"
            >
              {param}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(param);
                }}
                className="text-slate-400 hover:text-rose-600"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Expanded Multi-select Grid */}
      {isOpen && (
        <div className="mt-3 space-y-2.5 border-t border-[#176b87]/15 pt-3">
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
              const isChecked = activeSelection.includes(param);
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
      )}
    </div>
  );
}
