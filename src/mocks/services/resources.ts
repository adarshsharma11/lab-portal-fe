import { apiClient } from "@/lib/api/client";
import type { Doctor, Patient, Report, ReportTemplate, Result, Sample, Supplier, Test, User } from "@/types/domain";

const apiCrud = <T extends { id: string }>(resource: string) => ({
  list: (params?: Record<string, any>) => apiClient.get<T[]>(`/${resource}`, params),
  getById: (id: string) => apiClient.get<T | null>(`/${resource}/${id}`),
  create: (input: Omit<T, "id">) => apiClient.post<T>(`/${resource}`, input),
  update: (id: string, input: Partial<Omit<T, "id">>) => apiClient.put<T>(`/${resource}/${id}`, input),
  delete: (id: string) => apiClient.delete<void>(`/${resource}/${id}`),
});

export const patientApi = apiCrud<Patient>("patients");
export const doctorApi = apiCrud<Doctor>("doctors");
export const userApi = apiCrud<User>("users");
export const supplierApi = apiCrud<Supplier>("suppliers");
export const sampleApi = apiCrud<Sample>("samples");
export const testApi = apiCrud<Test>("tests");
export const resultApi = apiCrud<Result>("results");
export const reportApi = apiCrud<Report>("reports");

export const reportTemplateApi = {
  list: () => apiClient.get<ReportTemplate[]>("/reports/templates"),
  getById: (id: string) => apiClient.get<ReportTemplate | null>(`/reports/templates/${id}`),
  create: (input: Omit<ReportTemplate, "id">) => apiClient.post<ReportTemplate>("/reports/templates", input),
  update: (id: string, input: Partial<Omit<ReportTemplate, "id">>) => apiClient.put<ReportTemplate>(`/reports/templates/${id}`, input),
  delete: (id: string) => apiClient.delete<void>(`/reports/templates/${id}`),
};
