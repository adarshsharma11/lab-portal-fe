import { apiClient } from "@/lib/api/client";
import type { AnalyzerIntegrationError, AnalyzerOrder, AnalyzerResult, IAnalyzerAdapter } from "@/types/domain";

const delay = <T,>(data: T): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(data), 220));

const analyzerResultsSeed: readonly AnalyzerResult[] = [
  { id: "ar-001", instrumentId: "Ins-001", instrumentName: "Sysmex XN-1000", receivedAt: "2026-08-22T10:50:00Z", sampleId: "smp-01", barcode: "LIS260822041", testCode: "HB", testName: "Hemoglobin", value: "11.2", unit: "g/dL", status: "Matched" },
  { id: "ar-002", instrumentId: "Ins-001", instrumentName: "Sysmex XN-1000", receivedAt: "2026-08-22T10:50:00Z", sampleId: "smp-01", barcode: "LIS260822041", testCode: "RBC", testName: "RBC Count", value: "4.1", unit: "M/uL", status: "Matched" },
  { id: "ar-003", instrumentId: "Ins-002", instrumentName: "Beckman AU5800", receivedAt: "2026-08-22T10:48:00Z", sampleId: "smp-02", barcode: "LIS260822042", testCode: "GLU", testName: "Glucose", value: "105", unit: "mg/dL", status: "Matched" },
  { id: "ar-004", instrumentId: "Ins-003", instrumentName: "Roche Cobas c501", receivedAt: "2026-08-22T10:45:00Z", sampleId: "smp-01", barcode: "LIS260822041", testCode: "NA", testName: "Sodium", value: "140", unit: "mmol/L", status: "Matched" },
  { id: "ar-005", instrumentId: "Ins-003", instrumentName: "Roche Cobas c501", receivedAt: "2026-08-22T10:45:00Z", barcode: "LIS260822099", testCode: "K", testName: "Potassium", value: "4.8", unit: "mmol/L", status: "Unmatched" },
  { id: "ar-006", instrumentId: "Ins-002", instrumentName: "Beckman AU5800", receivedAt: "2026-08-22T10:30:00Z", sampleId: "smp-02", barcode: "LIS260822042", testCode: "CRE", testName: "Creatinine", value: "0.85", unit: "mg/dL", status: "Matched" },
];

const analyzerOrdersSeed: readonly AnalyzerOrder[] = [
  { id: "ao-001", instrumentId: "Ins-001", instrumentName: "Sysmex XN-1000", sentAt: "2026-08-22T09:40:00Z", sampleId: "smp-01", barcode: "LIS260822041", testCodes: ["CBC"], status: "Acknowledged" },
  { id: "ao-002", instrumentId: "Ins-002", instrumentName: "Beckman AU5800", sentAt: "2026-08-22T10:00:00Z", sampleId: "smp-02", barcode: "LIS260822042", testCodes: ["LFT", "RFT", "LIPID"], status: "Acknowledged" },
  { id: "ao-003", instrumentId: "Ins-003", instrumentName: "Roche Cobas c501", sentAt: "2026-08-22T10:10:00Z", sampleId: "smp-01", barcode: "LIS260822041", testCodes: ["ELECT"], status: "Acknowledged" },
  { id: "ao-004", instrumentId: "Ins-001", instrumentName: "Sysmex XN-1000", sentAt: "2026-08-22T10:55:00Z", sampleId: "smp-03", barcode: "LIS260822047", testCodes: ["CBC"], status: "Sent" },
  { id: "ao-005", instrumentId: "Ins-002", instrumentName: "Beckman AU5800", sentAt: "2026-08-22T11:00:00Z", sampleId: "smp-04", barcode: "LIS260822049", testCodes: ["GLU"], status: "Pending" },
];

const analyzerErrorsSeed: readonly AnalyzerIntegrationError[] = [
  { id: "ae-001", instrumentId: "Ins-006", instrumentName: "QuantStudio 5", timestamp: "2026-08-21T22:40:00Z", errorType: "ConnectionError", message: "Lost connection to instrument: socket closed unexpectedly", acknowledged: false },
  { id: "ae-002", instrumentId: "Ins-006", instrumentName: "QuantStudio 5", timestamp: "2026-08-22T08:15:00Z", errorType: "ParseError", message: "Result packet 0x4E8C: unable to parse channel data at offset 128", acknowledged: false },
  { id: "ae-003", instrumentId: "Ins-004", instrumentName: "Clinitek Advantus", timestamp: "2026-08-20T06:02:00Z", errorType: "Maintenance", message: "Instrument entered maintenance mode; orders held", acknowledged: true },
];

let resultsState = [...analyzerResultsSeed];
let ordersState = [...analyzerOrdersSeed];
let errorsState = [...analyzerErrorsSeed];
let connectionState: Record<string, boolean> = { "Ins-001": true, "Ins-002": true, "Ins-003": true, "Ins-004": false, "Ins-005": true, "Ins-006": false, "Ins-007": false, "Ins-008": false };

const instrumentStatuses = (instrumentId?: string) => {
  const ids = instrumentId ? [instrumentId] : Object.keys(connectionState);
  return ids.map((id) => ({
    instrumentId: id,
    connected: connectionState[id] ?? false,
    lastSync: connectionState[id] ? new Date().toISOString() : undefined,
    pendingResults: resultsState.filter((r) => r.instrumentId === id && r.status === "Received").length,
    pendingOrders: ordersState.filter((o) => o.instrumentId === id && (o.status === "Pending" || o.status === "Sent")).length,
  }));
};

class MockAnalyzerAdapter implements IAnalyzerAdapter {
  constructor(public readonly id: string, public readonly name: string) {}
  async connect(): Promise<boolean> { await delay(true); connectionState[this.id] = true; return true; }
  async disconnect(): Promise<boolean> { await delay(true); connectionState[this.id] = false; return true; }
  async getStatus() { await delay(true); return instrumentStatuses(this.id)[0]; }
  async receiveResults() { await delay(true); return resultsState.filter((r) => r.instrumentId === this.id); }
  async sendOrders(orders: readonly { sampleId: string; barcode: string; testCodes: readonly string[] }[]): Promise<boolean> {
    await delay(true);
    orders.forEach((o, idx) => {
      ordersState.push({ id: `ao-auto-${Date.now()}-${idx}`, instrumentId: this.id, instrumentName: this.name, sentAt: new Date().toISOString(), sampleId: o.sampleId, barcode: o.barcode, testCodes: o.testCodes, status: "Sent" });
    });
    return true;
  }
}

export const analyzerApi = {
  getStatus: (instrumentId?: string) => apiClient.request(() => delay(instrumentStatuses(instrumentId))),
  listResults: () => apiClient.request(() => delay([...resultsState])),
  listOrders: () => apiClient.request(() => delay([...ordersState])),
  listErrors: () => apiClient.request(() => delay([...errorsState])),
  acknowledgeError: (id: string) => apiClient.request(() => {
    errorsState = errorsState.map((e) => (e.id === id ? { ...e, acknowledged: true } : e));
    return delay(true);
  }),
  getAdapter: (id: string, name: string): IAnalyzerAdapter => new MockAnalyzerAdapter(id, name),
};
