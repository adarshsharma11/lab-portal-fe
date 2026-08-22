import type { Doctor, Patient, Report, Sample, Test, User } from "@/types/domain";

export const users: readonly User[] = [{ id: "usr-01", name: "Dr. Ananya Rao", email: "admin@lis.local", role: "Admin", initials: "AR", active: true, permissions: ["patients:write", "reports:approve", "users:manage"] }, { id: "usr-02", name: "Rohan Iyer", email: "rohan@lis.local", role: "Technician", initials: "RI", active: true, permissions: ["samples:write", "tests:write"] }];
export const patients: readonly Patient[] = [
  { id: "pat-01", patientCode: "PT-24018", name: "Maya Srinivasan", age: 36, sex: "Female", phone: "+91 98765 20318", createdAt: "2026-08-22", email: "maya@example.com", city: "Bengaluru", status: "Active", bloodGroup: "B+", referringDoctorId: "doc-01", dateOfBirth: "1990-04-12" },
  { id: "pat-02", patientCode: "PT-24019", name: "Arjun Mehta", age: 52, sex: "Male", phone: "+91 98765 20319", createdAt: "2026-08-22", city: "Bengaluru", status: "Active", bloodGroup: "O+", referringDoctorId: "doc-01", dateOfBirth: "1974-10-03" },
];
export const doctors: readonly Doctor[] = [{ id: "doc-01", name: "Dr. K. Menon", specialty: "Internal Medicine", phone: "+91 98470 11223", email: "kmenon@clinic.com", city: "Bengaluru", experience: "14 years" }];
export const samples: readonly Sample[] = [
  { id: "smp-01", accession: "LIS-260822-041", barcode: "LIS260822041", patientId: "pat-01", sampleType: "Blood", collectedAt: "2026-08-22T08:45:00Z", priority: "STAT", status: "Processing" },
  { id: "smp-02", accession: "LIS-260822-042", barcode: "LIS260822042", patientId: "pat-02", sampleType: "Serum", collectedAt: "2026-08-22T09:10:00Z", priority: "Routine", status: "Collected" },
];
export const tests: readonly Test[] = [{ id: "tst-01", code: "CBC", name: "Complete Blood Count", department: "Hematology", sampleId: "smp-01", sampleType: "Blood", price: 450, referenceRange: "See parameters", unit: "", turnaroundHours: 4, status: "Active" }];
export const reports: readonly Report[] = [{ id: "rpt-01", reportNumber: "RPT-260822-018", patientId: "pat-01", sampleId: "smp-01", doctorId: "doc-01", testIds: ["tst-01"], resultIds: ["res-01"], department: "Hematology", priority: "STAT", status: "Pending Review", createdAt: "2026-08-22T10:25:00Z" }];
