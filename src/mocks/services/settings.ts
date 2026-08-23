import { apiClient } from "@/lib/api/client";
import type { LaboratoryInfo, NotificationSettings, ReferenceRange, ReportSettings, SystemPreferences, UnitDefinition, User } from "@/types/domain";

export const settingsApi = {
  getLaboratory: () =>
    apiClient.get<LaboratoryInfo>("/settings/laboratory"),
  updateLaboratory: (input: Partial<LaboratoryInfo>) =>
    apiClient.put<LaboratoryInfo>("/settings/laboratory", input),

  getReportSettings: () =>
    apiClient.get<ReportSettings>("/settings/report"),
  updateReportSettings: (input: Partial<ReportSettings>) =>
    apiClient.put<ReportSettings>("/settings/report", input),

  listReferenceRanges: () =>
    apiClient.get<readonly ReferenceRange[]>("/settings/reference-ranges"),
  createReferenceRange: (input: Omit<ReferenceRange, "id">) =>
    apiClient.post<ReferenceRange>("/settings/reference-ranges", input),
  updateReferenceRange: (id: string, input: Partial<ReferenceRange>) =>
    apiClient.put<ReferenceRange>(`/settings/reference-ranges/${id}`, input),
  deleteReferenceRange: (id: string) =>
    apiClient.delete<void>(`/settings/reference-ranges/${id}`),

  listUnits: () =>
    apiClient.get<readonly UnitDefinition[]>("/settings/units"),
  createUnit: (input: Omit<UnitDefinition, "id">) =>
    apiClient.post<UnitDefinition>("/settings/units", input),
  updateUnit: (id: string, input: Partial<UnitDefinition>) =>
    apiClient.put<UnitDefinition>(`/settings/units/${id}`, input),
  deleteUnit: (id: string) =>
    apiClient.delete<void>(`/settings/units/${id}`),

  getNotifications: () =>
    apiClient.get<NotificationSettings>("/settings/notifications"),
  updateNotifications: (input: Partial<NotificationSettings>) =>
    apiClient.put<NotificationSettings>("/settings/notifications", input),

  getSystem: () =>
    apiClient.get<SystemPreferences>("/settings/system"),
  updateSystem: (input: Partial<SystemPreferences>) =>
    apiClient.put<SystemPreferences>("/settings/system", input),
};

export const profileApi = {
  getProfile: () =>
    apiClient.get<User>("/profile"),
  updateProfile: (input: Partial<User>) =>
    apiClient.put<User>("/profile", input),
};
