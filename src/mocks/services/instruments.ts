import { apiClient } from "@/lib/api/client";
import type { Instrument } from "@/types/domain";

const delay = <T,>(data: T): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(data), 260));

const instrumentsSeed: readonly Instrument[] = [
  { id: "Ins-001", name: "Sysmex Hematology 1", manufacturer: "Sysmex", model: "XN-1000", serialNumber: "XN1000-2401-8821", department: "Hematology", instrumentType: "Hematology Analyzer", status: "Online", installationDate: "2024-03-15", lastMaintenance: "2026-07-20", nextMaintenance: "2026-09-20", connectionStatus: "Connected", lastCommunication: "2026-08-22T10:50:00Z", ipAddress: "192.168.1.101", location: "Hematology Lab, Bay 1", description: "5-part differential hematology analyzer with auto-loader" },
  { id: "Ins-002", name: "Beckman Chemistry 1", manufacturer: "Beckman Coulter", model: "AU5800", serialNumber: "AU5800-2311-4412", department: "Biochemistry", instrumentType: "Biochemistry Analyzer", status: "Online", installationDate: "2023-11-08", lastMaintenance: "2026-08-01", nextMaintenance: "2026-09-01", connectionStatus: "Connected", lastCommunication: "2026-08-22T10:52:00Z", ipAddress: "192.168.1.102", location: "Biochemistry Lab, Central", description: "High-throughput clinical chemistry analyzer" },
  { id: "Ins-003", name: "Roche Electrolyte 1", manufacturer: "Roche Diagnostics", model: "Cobas c501", serialNumber: "C501-2402-1108", department: "Electrolytes", instrumentType: "Electrolyte Analyzer", status: "Online", installationDate: "2024-01-22", lastMaintenance: "2026-07-28", nextMaintenance: "2026-09-28", connectionStatus: "Connected", lastCommunication: "2026-08-22T10:51:00Z", ipAddress: "192.168.1.103", location: "Biochemistry Lab, Bay 3", description: "ISE module for Na/K/Cl/CO2/Ca analysis" },
  { id: "Ins-004", name: "Urine Analyzer 1", manufacturer: "Siemens", model: "Clinitek Advantus", serialNumber: "CLN-2308-7734", department: "Urine", instrumentType: "Urine Analyzer", status: "Maintenance", installationDate: "2023-06-12", lastMaintenance: "2026-08-20", nextMaintenance: "2026-08-23", connectionStatus: "Disconnected", lastCommunication: "2026-08-20T18:15:00Z", ipAddress: "192.168.1.104", location: "Urine Lab", description: "Automated urine chemistry strip reader" },
  { id: "Ins-005", name: "ELISA Reader 1", manufacturer: "BioTek", model: "Synergy HTX", serialNumber: "SYN-2405-3322", department: "Serology", instrumentType: "ELISA Reader", status: "Online", installationDate: "2024-05-10", lastMaintenance: "2026-06-15", nextMaintenance: "2026-09-15", connectionStatus: "Connected", lastCommunication: "2026-08-22T09:30:00Z", ipAddress: "192.168.1.105", location: "Serology Lab", description: "Multi-mode microplate reader" },
  { id: "Ins-006", name: "PCR Thermal Cycler", manufacturer: "Applied Biosystems", model: "QuantStudio 5", serialNumber: "QS5-2403-9917", department: "Molecular", instrumentType: "PCR Machine", status: "Error", installationDate: "2024-04-02", lastMaintenance: "2026-05-10", nextMaintenance: "2026-08-10", connectionStatus: "Error", lastCommunication: "2026-08-21T22:40:00Z", ipAddress: "192.168.1.106", location: "Molecular Lab", description: "Real-time PCR system with 96-well block" },
  { id: "Ins-007", name: "Sysmex Hematology 2", manufacturer: "Sysmex", model: "XS-1000i", serialNumber: "XS1000-2210-5560", department: "Hematology", instrumentType: "Hematology Analyzer", status: "Offline", installationDate: "2022-10-05", lastMaintenance: "2026-04-18", nextMaintenance: "2026-07-18", connectionStatus: "Disconnected", lastCommunication: "2026-07-30T14:22:00Z", ipAddress: "192.168.1.107", location: "Hematology Lab, Bay 2", description: "3-part differential backup analyzer" },
  { id: "Ins-008", name: "Benchtop Centrifuge", manufacturer: "Eppendorf", model: "5810 R", serialNumber: "EPP-2301-2210", department: "Sample Processing", instrumentType: "Centrifuge", status: "Online", installationDate: "2023-02-14", lastMaintenance: "2026-06-30", nextMaintenance: "2026-10-30", connectionStatus: "Disconnected", ipAddress: "", location: "Processing Room", description: "Refrigerated benchtop centrifuge, 4x750 mL" },
];

let instrumentsState = [...instrumentsSeed];

export const instrumentApi = {
  list: (filters: Readonly<Record<string, unknown>> = {}) => apiClient.request(() => {
    let result = [...instrumentsState];
    if (filters.search && typeof filters.search === "string") {
      const s = filters.search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(s) || i.manufacturer.toLowerCase().includes(s) || i.model.toLowerCase().includes(s) || i.serialNumber.toLowerCase().includes(s));
    }
    if (filters.status && filters.status !== "All") result = result.filter((i) => i.status === filters.status);
    if (filters.department && filters.department !== "All") result = result.filter((i) => i.department === filters.department);
    return delay(result);
  }),
  getById: (id: string) => apiClient.request(() => delay(instrumentsState.find((i) => i.id === id) ?? null)),
  create: (input: Omit<Instrument, "id">) => apiClient.request(() => {
    const nextId = `Ins-${(Number(instrumentsState[instrumentsState.length - 1]?.id.split("-")[1]) + 1).toString().padStart(3, "0")}`;
    const created: Instrument = { ...input, id: nextId };
    instrumentsState = [created, ...instrumentsState];
    return delay(created);
  }),
  update: (id: string, input: Partial<Omit<Instrument, "id">>) => apiClient.request(() => {
    const current = instrumentsState.find((i) => i.id === id);
    if (!current) throw new Error("Instrument not found");
    const updated = { ...current, ...input };
    instrumentsState = instrumentsState.map((i) => (i.id === id ? updated : i));
    return delay(updated);
  }),
  delete: (id: string) => apiClient.request(() => {
    instrumentsState = instrumentsState.filter((i) => i.id !== id);
    return delay(undefined);
  }),
};
