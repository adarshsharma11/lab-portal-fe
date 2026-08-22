"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { analyzerApi } from "@/mocks/services/analyzer";
import type { AnalyzerIntegrationError, AnalyzerOrder, AnalyzerResult, IAnalyzerAdapter } from "@/types/domain";

export type AnalyzerStatusItem = Readonly<{ instrumentId: string; connected: boolean; lastSync?: string; pendingResults: number; pendingOrders: number }>;

export const useAnalyzerStatus = (instrumentId?: string) => useQuery<ApiResponse<readonly AnalyzerStatusItem[]>, Error, readonly AnalyzerStatusItem[]>({
  queryKey: queryKeys.analyzer.status(instrumentId),
  queryFn: () => analyzerApi.getStatus(instrumentId),
  select: (r) => r.data,
  refetchInterval: 15_000,
});

export const useAnalyzerResults = () => useQuery<ApiResponse<readonly AnalyzerResult[]>, Error, readonly AnalyzerResult[]>({
  queryKey: queryKeys.analyzer.results(),
  queryFn: analyzerApi.listResults,
  select: (r) => r.data,
});

export const useAnalyzerOrders = () => useQuery<ApiResponse<readonly AnalyzerOrder[]>, Error, readonly AnalyzerOrder[]>({
  queryKey: queryKeys.analyzer.orders(),
  queryFn: analyzerApi.listOrders,
  select: (r) => r.data,
});

export const useAnalyzerErrors = () => useQuery<ApiResponse<readonly AnalyzerIntegrationError[]>, Error, readonly AnalyzerIntegrationError[]>({
  queryKey: queryKeys.analyzer.errors(),
  queryFn: analyzerApi.listErrors,
  select: (r) => r.data,
});

export const useAnalyzerMutations = () => {
  const client = useQueryClient();
  return {
    acknowledgeError: useMutation({
      mutationFn: (id: string) => analyzerApi.acknowledgeError(id),
      onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.analyzer.errors() }),
    }),
  };
};

export const getAnalyzerAdapter = (id: string, name: string): IAnalyzerAdapter => analyzerApi.getAdapter(id, name);
