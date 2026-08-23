import { apiClient } from "@/lib/api/client";
import type { QCDashboardStats, QCParameter, QCRun, QCViolation } from "@/types/domain";

export const qcApi = {
  getDashboard: () =>
    apiClient.get<QCDashboardStats>("/qc/dashboard"),
  listRuns: (filters: Readonly<Record<string, unknown>> = {}) =>
    apiClient.get<readonly QCRun[]>("/qc/runs", filters as Record<string, any>),
  getRun: (id: string) =>
    apiClient.get<QCRun | null>(`/qc/runs/${id}`),
  listParameters: () =>
    apiClient.get<readonly QCParameter[]>("/qc/parameters"),
  getParameter: (id: string) =>
    apiClient.get<QCParameter | null>(`/qc/parameters/${id}`),
  listViolations: () =>
    apiClient.get<readonly QCViolation[]>("/qc/violations"),
  reviewViolation: (id: string, action: { correctiveAction: string; resolve?: boolean }) =>
    apiClient.post<boolean>(`/qc/violations/${id}/review`, action),
  getChartData: (parameterId: string) =>
    apiClient.get<readonly QCRun[]>(`/qc/chart/${parameterId}`),
};
