"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { qcApi } from "@/mocks/services/qc";
import type { QCDashboardStats, QCParameter, QCRun, QCViolation } from "@/types/domain";

export const useQCDashboard = () => useQuery<ApiResponse<QCDashboardStats>, Error, QCDashboardStats>({
  queryKey: queryKeys.qc.dashboard(),
  queryFn: qcApi.getDashboard,
  select: (r) => r.data,
});

export const useQCRuns = (filters: Readonly<Record<string, unknown>> = {}) => useQuery<ApiResponse<readonly QCRun[]>, Error, readonly QCRun[]>({
  queryKey: queryKeys.qc.runs(filters),
  queryFn: () => qcApi.listRuns(filters),
  select: (r) => r.data,
});

export const useQCParameter = (id: string) => useQuery<ApiResponse<QCParameter | null>, Error, QCParameter | null>({
  queryKey: [...queryKeys.qc.parameters(), id],
  queryFn: () => qcApi.getParameter(id),
  select: (r) => r.data,
  enabled: Boolean(id && id !== "new"),
});

export const useQCParameters = () => useQuery<ApiResponse<readonly QCParameter[]>, Error, readonly QCParameter[]>({
  queryKey: queryKeys.qc.parameters(),
  queryFn: qcApi.listParameters,
  select: (r) => r.data,
});

export const useQCViolations = () => useQuery<ApiResponse<readonly QCViolation[]>, Error, readonly QCViolation[]>({
  queryKey: queryKeys.qc.violations(),
  queryFn: qcApi.listViolations,
  select: (r) => r.data,
});

export const useQCViolationActions = () => {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.qc.violations() });
  return {
    review: useMutation({
      mutationFn: ({ id, correctiveAction, resolve }: { id: string; correctiveAction: string; resolve?: boolean }) => qcApi.reviewViolation(id, { correctiveAction, resolve }),
      onSuccess: invalidate,
    }),
  };
};

export const useQCChartData = (parameterId: string) => useQuery<ApiResponse<readonly QCRun[]>, Error, readonly QCRun[]>({
  queryKey: queryKeys.qc.chart(parameterId),
  queryFn: () => qcApi.getChartData(parameterId),
  select: (r) => r.data,
  enabled: Boolean(parameterId && parameterId !== "new"),
});
