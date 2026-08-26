"use client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from "lucide-react";
import { cn } from "@/components/ui";
import { EmptyState, Skeleton, StatusBadge } from "@/components/ui/index";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: readonly TData[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  pageSize?: number;
  searchable?: boolean;
  searchKeys?: (keyof TData)[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ComponentType<{ size?: number; className?: string }>;
  emptyAction?: ReactNode;
  errorMessage?: string;
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;
  showToolbar?: boolean;
  showPagination?: boolean;
  rowIdKey?: keyof TData;
  className?: string;
  enableSorting?: boolean;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  isError,
  pageSize = 10,
  searchable,
  searchKeys,
  searchPlaceholder = "Search...",
  emptyTitle = "No records",
  emptyDescription = "Create a new record to get started.",
  emptyIcon,
  emptyAction,
  errorMessage = "Unable to load data. Please try again.",
  toolbarLeft,
  toolbarRight,
  showToolbar = true,
  showPagination = true,
  rowIdKey = "id" as keyof TData,
  className,
  enableSorting = true,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [page, setPage] = useState(0);

  const safeData = useMemo(() => (Array.isArray(data) ? [...data] : []), [data]);

  const table = useReactTable<TData>({
    data: safeData,
    columns,
    state: { globalFilter, sorting, columnFilters, pagination: { pageIndex: page, pageSize } },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        setPage(updater({ pageIndex: page, pageSize }).pageIndex);
      } else {
        setPage(updater.pageIndex);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: searchable || columnFilters.length ? getFilteredRowModel() : undefined,
    getPaginationRowModel: showPagination ? getPaginationRowModel() : undefined,
    globalFilterFn: (row, _id, filterValue) => {
      if (!filterValue) return true;
      const value = String(filterValue).toLowerCase();
      const sample = safeData[0];
      const keys = searchKeys ?? (sample != null ? (Object.keys(sample as object) as (keyof TData)[]) : []);
      return keys.some((k) => {
        const v = row.getValue(String(k));
        return String(v ?? "").toLowerCase().includes(value);
      });
    },
    getRowId: (original, index) => {
      if (original && typeof original === "object" && rowIdKey in original) {
        const id = (original as Record<PropertyKey, unknown>)[rowIdKey as PropertyKey];
        if (id != null) return String(id);
      }
      return String(index);
    },
    enableSorting,
    manualPagination: false,
  });

  const rows = table.getRowModel().rows;
  const totalRows = table.getFilteredRowModel().rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  const handleSearch = (val: string) => {
    setGlobalFilter(val);
    setPage(0);
  };

  return (
    <div className={cn("rounded-[var(--radius-lg)] border bg-[color:var(--surface)]", className)}>
      {showToolbar && (
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {searchable && (
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  value={globalFilter}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 w-64 rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--surface)] pl-9 pr-3 text-sm outline-none placeholder:text-[color:var(--muted-2)] focus:ring-2 focus:ring-[color:var(--brand-500)]/30 focus:border-[color:var(--brand-600)]"
                />
              </div>
            )}
            {toolbarLeft}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {toolbarRight}
            {searchable && totalRows > 0 && (
              <StatusBadge size="sm" tone="neutral">{totalRows} items</StatusBadge>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-[color:var(--surface-2)]">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const colId = header.column.id.toLowerCase();
                  const isAction = colId === "action" || colId === "actions" || colId.endsWith("_action") || colId.endsWith("_actions");
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[color:var(--muted)]",
                        isAction ? "text-center" : "text-left",
                        canSort && "cursor-pointer select-none hover:text-[color:var(--foreground)]",
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className={cn("flex items-center gap-1.5", isAction ? "justify-center text-center" : "justify-start text-left")}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <ArrowUpDown size={12} className="text-[color:var(--muted-2)] shrink-0" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 5) }, (_, i) => (
                <tr key={i} className="border-b last:border-0">
                  {columns.map((_, ci) => (
                    <td key={ci} className="px-4 py-4">
                      <Skeleton className="h-4 w-[85%]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center">
                  <div className="text-[color:var(--danger)] text-sm font-medium">{errorMessage}</div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <div className="m-4">
                    <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} action={emptyAction} />
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0 transition-colors hover:bg-[color:var(--surface-2)]/60">
                  {row.getVisibleCells().map((cell) => {
                    const colId = cell.column.id.toLowerCase();
                    const isAction = colId === "action" || colId === "actions" || colId.endsWith("_action") || colId.endsWith("_actions");
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-4 py-3 align-middle text-[color:var(--foreground)]",
                          isAction && "text-center"
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && !isLoading && !isError && rows.length > 0 && (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-[color:var(--muted)]">
            Showing <b>{page * pageSize + 1}</b>–<b>{Math.min((page + 1) * pageSize, totalRows)}</b> of <b>{totalRows}</b>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--line)] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="First page"
            ><ChevronsLeft size={15} /></button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--line)] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            ><ChevronLeft size={15} /></button>
            <span className="mx-2 text-xs font-medium text-[color:var(--foreground)]">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--line)] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            ><ChevronRight size={15} /></button>
            <button
              type="button"
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--line)] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Last page"
            ><ChevronsRight size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
