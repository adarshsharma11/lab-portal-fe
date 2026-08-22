import { apiClient } from "@/lib/api/client";
import type { AppSettings, LaboratoryInfo, NotificationSettings, ReferenceRange, ReportSettings, SystemPreferences, UnitDefinition, User } from "@/types/domain";
import { users } from "@/mocks/data";

const delay = <T,>(data: T): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(data), 240));

const defaultLaboratory: LaboratoryInfo = {
  name: "Pathology LIS Reference Laboratory",
  address: "142, Healthcare Avenue, Bengaluru, Karnataka 560001, India",
  phone: "+91 80 4455 6677",
  email: "lab@pathologylis.example",
  website: "https://pathologylis.example",
  accreditation: "NABL Accredited ISO 15189:2012",
  licenseNumber: "KAR-LAB-2024-1482",
};

const defaultReport: ReportSettings = {
  header: "Pathology LIS Reference Laboratory",
  footer: "This is a computer-generated report and does not require manual signature. Interpret clinically.",
  signature: "Dr. Ananya Rao, MD (Pathology)\nConsultant Pathologist",
  reportNumberingPrefix: "RPT-",
  reportNumberingNext: 260822020,
  dateFormat: "DD/MM/YYYY",
  showLogo: true,
  showSignatory: true,
  autoApprovePathologist: false,
};

const defaultReferenceRanges: readonly ReferenceRange[] = [
  { id: "rr-001", testCode: "CBC", testName: "Complete Blood Count", parameter: "Hemoglobin", gender: "Male", ageMin: 18, ageMax: 65, minimum: 13.0, maximum: 17.0, unit: "g/dL", criticalLow: 7.0, criticalHigh: 20.0 },
  { id: "rr-002", testCode: "CBC", testName: "Complete Blood Count", parameter: "Hemoglobin", gender: "Female", ageMin: 18, ageMax: 65, minimum: 12.0, maximum: 15.5, unit: "g/dL", criticalLow: 6.5, criticalHigh: 19.0 },
  { id: "rr-003", testCode: "CBC", testName: "Complete Blood Count", parameter: "RBC Count", gender: "Both", minimum: 4.2, maximum: 5.9, unit: "M/uL" },
  { id: "rr-004", testCode: "GLU", testName: "Glucose (Fasting)", parameter: "Glucose", gender: "Both", ageMin: 18, minimum: 70, maximum: 110, unit: "mg/dL", criticalLow: 40, criticalHigh: 400 },
  { id: "rr-005", testCode: "LFT", testName: "Liver Function Test", parameter: "SGPT (ALT)", gender: "Both", minimum: 7, maximum: 55, unit: "U/L", criticalHigh: 400 },
  { id: "rr-006", testCode: "RFT", testName: "Renal Function Test", parameter: "Creatinine", gender: "Male", minimum: 0.6, maximum: 1.3, unit: "mg/dL", criticalHigh: 6.0 },
  { id: "rr-007", testCode: "RFT", testName: "Renal Function Test", parameter: "Creatinine", gender: "Female", minimum: 0.5, maximum: 1.1, unit: "mg/dL", criticalHigh: 5.5 },
  { id: "rr-008", testCode: "ELECT", testName: "Electrolyte Panel", parameter: "Sodium", gender: "Both", minimum: 135, maximum: 145, unit: "mmol/L", criticalLow: 120, criticalHigh: 160 },
  { id: "rr-009", testCode: "ELECT", testName: "Electrolyte Panel", parameter: "Potassium", gender: "Both", minimum: 3.5, maximum: 5.1, unit: "mmol/L", criticalLow: 2.5, criticalHigh: 6.5 },
  { id: "rr-010", testCode: "LIPID", testName: "Lipid Profile", parameter: "Total Cholesterol", gender: "Both", minimum: 100, maximum: 200, unit: "mg/dL", criticalHigh: 350 },
];

const defaultUnits: readonly UnitDefinition[] = [
  { id: "u-001", code: "g/dL", name: "grams per deciliter", category: "Hematology" },
  { id: "u-002", code: "mg/dL", name: "milligrams per deciliter", category: "Biochemistry" },
  { id: "u-003", code: "mmol/L", name: "millimoles per liter", category: "Electrolytes" },
  { id: "u-004", code: "mEq/L", name: "milliequivalents per liter", category: "Electrolytes" },
  { id: "u-005", code: "U/L", name: "units per liter", category: "Enzymes" },
  { id: "u-006", code: "M/uL", name: "millions per microliter", category: "Hematology" },
  { id: "u-007", code: "K/uL", name: "thousands per microliter", category: "Hematology" },
  { id: "u-008", code: "%", name: "percent", category: "General" },
  { id: "u-009", code: "ng/mL", name: "nanograms per milliliter", category: "Immunology" },
  { id: "u-010", code: "pg/mL", name: "picograms per milliliter", category: "Immunology" },
];

const defaultNotifications: NotificationSettings = {
  criticalResultAlerts: true,
  pendingReportAlerts: true,
  qcAlerts: true,
  inventoryAlerts: true,
  appointmentReminders: true,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
};

const defaultSystem: SystemPreferences = {
  timezone: "Asia/Kolkata",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",
  language: "English",
  theme: "light",
  defaultLandingPage: "/dashboard",
  resultsPerPage: 25,
};

let settings: AppSettings = {
  laboratory: defaultLaboratory,
  report: defaultReport,
  referenceRanges: defaultReferenceRanges,
  units: defaultUnits,
  notifications: defaultNotifications,
  system: defaultSystem,
};

let profile: User = {
  ...users[0],
  avatar: undefined,
  mobile: "+91 98800 11223",
  dateOfBirth: "1985-04-12",
  gender: "Female",
  location: "Bengaluru, Karnataka",
};

let referenceRangesState = [...defaultReferenceRanges];
let unitsState = [...defaultUnits];

export const settingsApi = {
  getLaboratory: () => apiClient.request(() => delay({ ...settings.laboratory })),
  updateLaboratory: (input: Partial<LaboratoryInfo>) => apiClient.request(() => {
    settings = { ...settings, laboratory: { ...settings.laboratory, ...input } };
    return delay(settings.laboratory);
  }),
  getReportSettings: () => apiClient.request(() => delay({ ...settings.report })),
  updateReportSettings: (input: Partial<ReportSettings>) => apiClient.request(() => {
    settings = { ...settings, report: { ...settings.report, ...input } };
    return delay(settings.report);
  }),
  listReferenceRanges: () => apiClient.request(() => delay([...referenceRangesState])),
  createReferenceRange: (input: Omit<ReferenceRange, "id">) => apiClient.request(() => {
    const created: ReferenceRange = { ...input, id: `rr-${Date.now()}` };
    referenceRangesState = [created, ...referenceRangesState];
    return delay(created);
  }),
  updateReferenceRange: (id: string, input: Partial<ReferenceRange>) => apiClient.request(() => {
    referenceRangesState = referenceRangesState.map((r) => (r.id === id ? { ...r, ...input } : r));
    return delay(referenceRangesState.find((r) => r.id === id) as ReferenceRange);
  }),
  deleteReferenceRange: (id: string) => apiClient.request(() => {
    referenceRangesState = referenceRangesState.filter((r) => r.id !== id);
    return delay(undefined);
  }),
  listUnits: () => apiClient.request(() => delay([...unitsState])),
  createUnit: (input: Omit<UnitDefinition, "id">) => apiClient.request(() => {
    const created: UnitDefinition = { ...input, id: `u-${Date.now()}` };
    unitsState = [created, ...unitsState];
    return delay(created);
  }),
  updateUnit: (id: string, input: Partial<UnitDefinition>) => apiClient.request(() => {
    unitsState = unitsState.map((u) => (u.id === id ? { ...u, ...input } : u));
    return delay(unitsState.find((u) => u.id === id) as UnitDefinition);
  }),
  deleteUnit: (id: string) => apiClient.request(() => {
    unitsState = unitsState.filter((u) => u.id !== id);
    return delay(undefined);
  }),
  getNotifications: () => apiClient.request(() => delay({ ...settings.notifications })),
  updateNotifications: (input: Partial<NotificationSettings>) => apiClient.request(() => {
    settings = { ...settings, notifications: { ...settings.notifications, ...input } };
    return delay(settings.notifications);
  }),
  getSystem: () => apiClient.request(() => delay({ ...settings.system })),
  updateSystem: (input: Partial<SystemPreferences>) => apiClient.request(() => {
    settings = { ...settings, system: { ...settings.system, ...input } };
    return delay(settings.system);
  }),
};

export const profileApi = {
  getProfile: () => apiClient.request(() => delay({ ...profile })),
  updateProfile: (input: Partial<User>) => apiClient.request(() => {
    profile = { ...profile, ...input, initials: input.name ? String(input.name).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() : profile.initials };
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("pathology-lis-session") : null;
    if (stored && typeof window !== "undefined") {
      try {
        const session = JSON.parse(stored);
        window.localStorage.setItem("pathology-lis-session", JSON.stringify({ ...session, ...profile }));
      } catch { /* ignore */ }
    }
    return delay(profile);
  }),
};
