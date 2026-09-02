import { apiClient } from "@/lib/api/client";
import type { Activity, ChartPoint, CriticalResult, DashboardStats, PendingWork, ProfitLossReport } from "@/types/domain";

export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>("/dashboard/stats"),
  getTestVolume: () => apiClient.get<readonly ChartPoint[]>("/dashboard/test-volume"),
  getDepartmentDistribution: () => apiClient.get<readonly ChartPoint[]>("/dashboard/department-distribution"),
  getSampleStatistics: () => apiClient.get<readonly ChartPoint[]>("/dashboard/sample-statistics"),
  getRevenue: () => apiClient.get<readonly ChartPoint[]>("/dashboard/revenue"),
  getTurnaround: () => apiClient.get<readonly ChartPoint[]>("/dashboard/turnaround"),
  getRecentActivity: () => apiClient.get<readonly Activity[]>("/dashboard/recent-activity"),
  getPendingWork: () => apiClient.get<readonly PendingWork[]>("/dashboard/pending-work"),
  getCriticalResults: () => apiClient.get<readonly CriticalResult[]>("/dashboard/critical-results"),
  getProfitLoss: (year?: number, franchiseId?: string) =>
    apiClient.get<ProfitLossReport>("/dashboard/profit-loss", {
      year,
      franchiseId: franchiseId && franchiseId !== "all" ? franchiseId : undefined,
    }),
};
