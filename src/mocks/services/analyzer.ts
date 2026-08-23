import { apiClient } from "@/lib/api/client";
import type { AnalyzerIntegrationError, AnalyzerOrder, AnalyzerResult, IAnalyzerAdapter } from "@/types/domain";

class AnalyzerAdapter implements IAnalyzerAdapter {
  constructor(public readonly id: string, public readonly name: string) {}
  async connect(): Promise<boolean> {
    await apiClient.put(`/instruments/${this.id}`, { connectionStatus: "Connected", status: "Online" }).catch(() => {});
    return true;
  }
  async disconnect(): Promise<boolean> {
    await apiClient.put(`/instruments/${this.id}`, { connectionStatus: "Disconnected", status: "Offline" }).catch(() => {});
    return true;
  }
  async getStatus() {
    const res = await apiClient.get<any[]>(`/analyzer/status`, { instrumentId: this.id });
    return res.data?.[0] || { connected: true, pendingResults: 0, pendingOrders: 0 };
  }
  async receiveResults() {
    const res = await apiClient.get<AnalyzerResult[]>("/analyzer/results");
    return (res.data || []).filter((r) => r.instrumentId === this.id);
  }
  async sendOrders(_orders: readonly { sampleId: string; barcode: string; testCodes: readonly string[] }[]): Promise<boolean> {
    return true;
  }
}

export const analyzerApi = {
  getStatus: (instrumentId?: string) =>
    apiClient.get<any[]>("/analyzer/status", instrumentId ? { instrumentId } : undefined),
  listResults: () =>
    apiClient.get<readonly AnalyzerResult[]>("/analyzer/results"),
  listOrders: () =>
    apiClient.get<readonly AnalyzerOrder[]>("/analyzer/orders"),
  listErrors: () =>
    apiClient.get<readonly AnalyzerIntegrationError[]>("/analyzer/errors"),
  acknowledgeError: (id: string) =>
    apiClient.post<boolean>(`/analyzer/errors/${id}/acknowledge`),
  getAdapter: (id: string, name: string): IAnalyzerAdapter => new AnalyzerAdapter(id, name),
};
