import { apiClient } from "@/lib/api/client";
import type { QCDashboardStats, QCParameter, QCRun, QCViolation } from "@/types/domain";

const delay = <T,>(data: T): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(data), 260));

const generateRuns = (): readonly QCRun[] => {
  const analytes = [
    { analyte: "Hemoglobin", mean: 13.5, sd: 0.8, unit: "g/dL" },
    { analyte: "Glucose", mean: 95, sd: 5, unit: "mg/dL" },
    { analyte: "Sodium", mean: 140, sd: 2, unit: "mmol/L" },
    { analyte: "Potassium", mean: 4.2, sd: 0.3, unit: "mmol/L" },
    { analyte: "Cholesterol", mean: 185, sd: 12, unit: "mg/dL" },
    { analyte: "Creatinine", mean: 0.9, sd: 0.08, unit: "mg/dL" },
  ];
  const levels: readonly ("Normal" | "Low" | "High")[] = ["Normal", "Low", "High"];
  const instruments = ["Ins-001", "Ins-002", "Ins-003"];
  const instrumentNames = { "Ins-001": "Sysmex XN-1000", "Ins-002": "Beckman AU5800", "Ins-003": "Roche Cobas c501" } as const;
  const statuses: readonly ("Passed" | "Failed" | "Warning" | "Pending")[] = ["Passed", "Passed", "Passed", "Passed", "Warning", "Failed", "Pending"];
  const runs: QCRun[] = [];
  let runCounter = 1;
  const now = new Date();
  analytes.forEach((a, aIdx) => {
    levels.forEach((level, lIdx) => {
      for (let i = 0; i < 8; i++) {
        const zScore = (Math.random() - 0.5) * 5;
        const value = a.mean + zScore * a.sd;
        let status: "Passed" | "Failed" | "Warning" | "Pending" = statuses[Math.floor(Math.random() * statuses.length)];
        if (Math.abs(zScore) > 3) status = "Failed";
        else if (Math.abs(zScore) > 2) status = "Warning";
        else if (Math.abs(zScore) <= 2) status = "Passed";
        const dt = new Date(now);
        dt.setHours(dt.getHours() - i * 6 - aIdx - lIdx);
        runs.push({
          id: `qcr-${runCounter.toString().padStart(3, "0")}`,
          runNumber: `QC-${(260822 * 1000) + runCounter}`,
          runDate: dt.toISOString(),
          analyte: a.analyte,
          instrumentId: instruments[aIdx % 3],
          instrumentName: instrumentNames[instruments[aIdx % 3] as keyof typeof instrumentNames],
          controlLevel: level,
          parameterId: `qcp-${aIdx}${lIdx}`,
          value: Number(value.toFixed(2)),
          mean: a.mean,
          sd: a.sd,
          unit: a.unit,
          status,
          zScore: Number(zScore.toFixed(2)),
          operatorName: ["R. Iyer", "S. Das", "A. Shah"][runCounter % 3],
          notes: i === 0 ? "Morning QC run" : undefined,
        });
        runCounter++;
      }
    });
  });
  return runs.sort((a, b) => b.runDate.localeCompare(a.runDate));
};

const qcRunsSeed = generateRuns();

const generateParameters = (): readonly QCParameter[] => [
  { id: "qcp-0N", analyte: "Hemoglobin", instrumentId: "Ins-001", instrumentName: "Sysmex XN-1000", controlLevel: "Normal", mean: 13.5, sd: 0.8, acceptableMin: 11.1, acceptableMax: 15.9, unit: "g/dL", lotNumber: "HB-N-2408", effectiveDate: "2026-08-01", active: true },
  { id: "qcp-0L", analyte: "Hemoglobin", instrumentId: "Ins-001", instrumentName: "Sysmex XN-1000", controlLevel: "Low", mean: 8.2, sd: 0.5, acceptableMin: 6.7, acceptableMax: 9.7, unit: "g/dL", lotNumber: "HB-L-2408", effectiveDate: "2026-08-01", active: true },
  { id: "qcp-0H", analyte: "Hemoglobin", instrumentId: "Ins-001", instrumentName: "Sysmex XN-1000", controlLevel: "High", mean: 18.4, sd: 1.0, acceptableMin: 15.4, acceptableMax: 21.4, unit: "g/dL", lotNumber: "HB-H-2408", effectiveDate: "2026-08-01", active: true },
  { id: "qcp-1N", analyte: "Glucose", instrumentId: "Ins-002", instrumentName: "Beckman AU5800", controlLevel: "Normal", mean: 95, sd: 5, acceptableMin: 80, acceptableMax: 110, unit: "mg/dL", lotNumber: "GLU-N-2408", effectiveDate: "2026-08-01", active: true },
  { id: "qcp-1H", analyte: "Glucose", instrumentId: "Ins-002", instrumentName: "Beckman AU5800", controlLevel: "High", mean: 320, sd: 15, acceptableMin: 275, acceptableMax: 365, unit: "mg/dL", lotNumber: "GLU-H-2408", effectiveDate: "2026-08-01", active: true },
  { id: "qcp-2N", analyte: "Sodium", instrumentId: "Ins-003", instrumentName: "Roche Cobas c501", controlLevel: "Normal", mean: 140, sd: 2, acceptableMin: 134, acceptableMax: 146, unit: "mmol/L", lotNumber: "NA-N-2408", effectiveDate: "2026-08-01", active: true },
  { id: "qcp-3N", analyte: "Potassium", instrumentId: "Ins-003", instrumentName: "Roche Cobas c501", controlLevel: "Normal", mean: 4.2, sd: 0.3, acceptableMin: 3.3, acceptableMax: 5.1, unit: "mmol/L", lotNumber: "K-N-2408", effectiveDate: "2026-08-01", active: true },
  { id: "qcp-4N", analyte: "Cholesterol", instrumentId: "Ins-002", instrumentName: "Beckman AU5800", controlLevel: "Normal", mean: 185, sd: 12, acceptableMin: 149, acceptableMax: 221, unit: "mg/dL", lotNumber: "CHOL-N-2408", effectiveDate: "2026-08-01", active: true },
  { id: "qcp-5N", analyte: "Creatinine", instrumentId: "Ins-002", instrumentName: "Beckman AU5800", controlLevel: "Normal", mean: 0.9, sd: 0.08, acceptableMin: 0.66, acceptableMax: 1.14, unit: "mg/dL", lotNumber: "CRE-N-2408", effectiveDate: "2026-08-01", active: true },
];

const qcParametersSeed = generateParameters();

const qcViolationsSeed: readonly QCViolation[] = [
  { id: "qcviol-001", qcRunId: "qcr-001", runDate: "2026-08-22T06:15:00Z", analyte: "Glucose", instrumentId: "Ins-002", instrumentName: "Beckman AU5800", controlLevel: "Normal", value: 112, expectedRange: "80 – 110 mg/dL", mean: 95, sd: 5, violationType: "1_2S", status: "Open", correctiveAction: "" },
  { id: "qcviol-002", qcRunId: "qcr-017", runDate: "2026-08-22T05:30:00Z", analyte: "Potassium", instrumentId: "Ins-003", instrumentName: "Roche Cobas c501", controlLevel: "Normal", value: 5.3, expectedRange: "3.3 – 5.1 mmol/L", mean: 4.2, sd: 0.3, violationType: "1_3S", status: "Reviewed", reviewedBy: "Dr. Ananya Rao", reviewedAt: "2026-08-22T06:45:00Z", correctiveAction: "Recalibrated electrode; new control passed" },
  { id: "qcviol-003", qcRunId: "qcr-025", runDate: "2026-08-22T04:00:00Z", analyte: "Hemoglobin", instrumentId: "Ins-001", instrumentName: "Sysmex XN-1000", controlLevel: "High", value: 21.9, expectedRange: "15.4 – 21.4 g/dL", mean: 18.4, sd: 1.0, violationType: "1_3S", status: "Open" },
  { id: "qcviol-004", qcRunId: "qcr-033", runDate: "2026-08-21T23:15:00Z", analyte: "Creatinine", instrumentId: "Ins-002", instrumentName: "Beckman AU5800", controlLevel: "Normal", value: 1.17, expectedRange: "0.66 – 1.14 mg/dL", mean: 0.9, sd: 0.08, violationType: "1_2S", status: "Resolved", reviewedBy: "S. Das", reviewedAt: "2026-08-21T23:50:00Z", resolvedAt: "2026-08-22T00:30:00Z", correctiveAction: "Repeated run after 10 min warm-up; values within limits" },
  { id: "qcviol-005", qcRunId: "qcr-041", runDate: "2026-08-21T20:00:00Z", analyte: "Sodium", instrumentId: "Ins-003", instrumentName: "Roche Cobas c501", controlLevel: "Normal", value: 147, expectedRange: "134 – 146 mmol/L", mean: 140, sd: 2, violationType: "1_2S", status: "Acknowledged", reviewedBy: "R. Iyer", reviewedAt: "2026-08-21T20:25:00Z", correctiveAction: "Dilution verified; results within range on rerun" },
  { id: "qcviol-006", qcRunId: "qcr-049", runDate: "2026-08-21T18:45:00Z", analyte: "Cholesterol", instrumentId: "Ins-002", instrumentName: "Beckman AU5800", controlLevel: "Normal", value: 230, expectedRange: "149 – 221 mg/dL", mean: 185, sd: 12, violationType: "2_2S", status: "Open" },
];

let qcRunsState = [...qcRunsSeed];
let qcParametersState = [...qcParametersSeed];
let qcViolationsState = [...qcViolationsSeed];

const qcStats: QCDashboardStats = {
  totalRunsToday: 72,
  passedRuns: 64,
  failedRuns: 4,
  pendingReview: 4,
  activeControls: 9,
  recentViolations: 6,
};

const getChartData = (parameterId: string): readonly QCRun[] => {
  const param = qcParametersState.find((p) => p.id === parameterId);
  if (!param) return [];
  return qcRunsState
    .filter((r) => r.analyte === param.analyte && r.controlLevel === param.controlLevel && r.instrumentId === param.instrumentId)
    .sort((a, b) => a.runDate.localeCompare(b.runDate))
    .slice(-20);
};

export const qcApi = {
  getDashboard: () => apiClient.request(() => delay(qcStats)),
  listRuns: (filters: Readonly<Record<string, unknown>> = {}) => apiClient.request(() => {
    let result = [...qcRunsState];
    if (filters.search && typeof filters.search === "string") {
      const s = filters.search.toLowerCase();
      result = result.filter((r) => r.analyte.toLowerCase().includes(s) || r.runNumber.toLowerCase().includes(s) || (r.instrumentName ?? "").toLowerCase().includes(s));
    }
    if (filters.status && filters.status !== "All") result = result.filter((r) => r.status === filters.status);
    if (filters.controlLevel && filters.controlLevel !== "All") result = result.filter((r) => r.controlLevel === filters.controlLevel);
    if (filters.analyte && filters.analyte !== "All") result = result.filter((r) => r.analyte === filters.analyte);
    if (filters.instrumentId && filters.instrumentId !== "All") result = result.filter((r) => r.instrumentId === filters.instrumentId);
    return delay(result);
  }),
  getRun: (id: string) => apiClient.request(() => delay(qcRunsState.find((r) => r.id === id) ?? null)),
  listParameters: () => apiClient.request(() => delay([...qcParametersState])),
  getParameter: (id: string) => apiClient.request(() => delay(qcParametersState.find((p) => p.id === id) ?? null)),
  listViolations: () => apiClient.request(() => delay([...qcViolationsState])),
  reviewViolation: (id: string, action: { correctiveAction: string; resolve?: boolean }) => apiClient.request(() => {
    const now = new Date().toISOString();
    qcViolationsState = qcViolationsState.map((v) => v.id === id ? { ...v, correctiveAction: action.correctiveAction, status: action.resolve ? "Resolved" : "Acknowledged", reviewedBy: "Dr. Ananya Rao", reviewedAt: now, resolvedAt: action.resolve ? now : undefined } : v);
    return delay(true);
  }),
  getChartData: (parameterId: string) => apiClient.request(() => delay(getChartData(parameterId))),
};
