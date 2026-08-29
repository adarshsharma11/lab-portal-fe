"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@/components/ui/index";

export interface ComboboxOption {
  value: string;
  label: string;
  secondary?: string;
  badge?: string;
  extra?: any;
}

interface SearchableComboboxProps {
  options: readonly ComboboxOption[];
  value: string;
  onChange: (value: string, option?: ComboboxOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
  className?: string;
  onSearchChange?: (query: string) => void;
  allowClear?: boolean;
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  emptyText = "No matching records found.",
  disabled = false,
  required = false,
  loading = false,
  className,
  onSearchChange,
  allowClear = true,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      return (
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.secondary && opt.secondary.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q))
      );
    });
  }, [options, searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight on search change
  useEffect(() => {
    setHighlightedIndex(0);
    if (onSearchChange) {
      onSearchChange(searchQuery);
    }
  }, [searchQuery, onSearchChange]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value, option);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", undefined);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        break;
      case "Tab":
        setIsOpen(false);
        setSearchQuery("");
        break;
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-sm transition-all focus:border-[color:var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-500)]/20 cursor-pointer select-none",
          disabled && "cursor-not-allowed opacity-50 bg-[color:var(--surface-2)]",
          isOpen && "border-[color:var(--brand-500)] ring-2 ring-[color:var(--brand-500)]/20"
        )}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-[color:var(--foreground)] truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="inline-flex shrink-0 items-center rounded-md bg-[#e8f4f7] px-1.5 py-0.5 text-[11px] font-semibold text-[#176b87]">
                  {selectedOption.badge}
                </span>
              )}
              {selectedOption.secondary && (
                <span className="text-xs text-[color:var(--muted)] truncate">({selectedOption.secondary})</span>
              )}
            </div>
          ) : (
            <span className="text-[color:var(--muted)]">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {loading && <Loader2 size={15} className="animate-spin text-[color:var(--muted)]" />}
          {allowClear && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--foreground)]"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={cn("text-[color:var(--muted)] transition-transform duration-200", isOpen && "rotate-180")}
          />
        </div>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] max-w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--surface)] p-2 shadow-xl animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Field */}
          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8.5 w-full rounded-[calc(var(--radius)-2px)] border border-[color:var(--line)] bg-[color:var(--surface-2)] pl-8 pr-3 text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:border-[color:var(--brand-500)] focus:bg-[color:var(--surface)] focus:outline-none"
            />
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto overflow-x-hidden space-y-0.5 text-sm"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <li className="py-4 text-center text-xs text-[color:var(--muted)]">{emptyText}</li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "flex items-center justify-between rounded-[calc(var(--radius)-2px)] px-2.5 py-1.5 cursor-pointer text-xs transition-colors",
                      isHighlighted && "bg-[color:var(--surface-2)] text-[color:var(--foreground)]",
                      isSelected && "bg-[#176b87]/10 text-[#176b87] font-semibold"
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="inline-flex items-center rounded bg-[#e8f4f7] px-1.5 py-0.2 text-[10px] font-bold text-[#176b87]">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.secondary && (
                        <span className="text-[11px] text-[color:var(--muted)] truncate">{opt.secondary}</span>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="shrink-0 text-[#176b87]" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
