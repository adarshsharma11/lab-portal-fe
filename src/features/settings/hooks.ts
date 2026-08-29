"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { settingsApi, profileApi } from "@/mocks/services/settings";
import { authService } from "@/lib/auth/auth-service";
import type { LaboratoryInfo, NotificationSettings, ReferenceRange, ReportSettings, SystemPreferences, UnitDefinition, User } from "@/types/domain";

export const useLaboratorySettings = () => useQuery<ApiResponse<LaboratoryInfo>, Error, LaboratoryInfo>({
  queryKey: queryKeys.settings.laboratory(),
  queryFn: settingsApi.getLaboratory,
  select: (r) => r.data,
});

export const useUpdateLaboratory = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<LaboratoryInfo>) => settingsApi.updateLaboratory(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.settings.laboratory() }),
  });
};

export const useReportSettings = () => useQuery<ApiResponse<ReportSettings>, Error, ReportSettings>({
  queryKey: queryKeys.settings.report(),
  queryFn: settingsApi.getReportSettings,
  select: (r) => r.data,
});

export const useUpdateReportSettings = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ReportSettings>) => settingsApi.updateReportSettings(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.settings.report() }),
  });
};

export const useReferenceRanges = () => useQuery<ApiResponse<readonly ReferenceRange[]>, Error, readonly ReferenceRange[]>({
  queryKey: queryKeys.settings.referenceRanges(),
  queryFn: settingsApi.listReferenceRanges,
  select: (r) => r.data,
});

export const useReferenceRangeMutations = () => {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.settings.referenceRanges() });
  return {
    create: useMutation({ mutationFn: (input: Omit<ReferenceRange, "id">) => settingsApi.createReferenceRange(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<ReferenceRange> }) => settingsApi.updateReferenceRange(id, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => settingsApi.deleteReferenceRange(id), onSuccess: invalidate }),
  };
};

export const useUnits = () => useQuery<ApiResponse<readonly UnitDefinition[]>, Error, readonly UnitDefinition[]>({
  queryKey: queryKeys.settings.units(),
  queryFn: settingsApi.listUnits,
  select: (r) => r.data,
});

export const useUnitMutations = () => {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.settings.units() });
  return {
    create: useMutation({ mutationFn: (input: Omit<UnitDefinition, "id">) => settingsApi.createUnit(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<UnitDefinition> }) => settingsApi.updateUnit(id, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => settingsApi.deleteUnit(id), onSuccess: invalidate }),
  };
};

export const useNotificationSettings = () => useQuery<ApiResponse<NotificationSettings>, Error, NotificationSettings>({
  queryKey: queryKeys.settings.notifications(),
  queryFn: settingsApi.getNotifications,
  select: (r) => r.data,
});

export const useUpdateNotificationSettings = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<NotificationSettings>) => settingsApi.updateNotifications(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.settings.notifications() }),
  });
};

export const useSystemPreferences = () => useQuery<ApiResponse<SystemPreferences>, Error, SystemPreferences>({
  queryKey: queryKeys.settings.system(),
  queryFn: settingsApi.getSystem,
  select: (r) => r.data,
});

export const useUpdateSystemPreferences = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<SystemPreferences>) => settingsApi.updateSystem(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.settings.system() }),
  });
};

export const useProfile = () => useQuery<ApiResponse<User>, Error, User>({
  queryKey: queryKeys.profile.me(),
  queryFn: profileApi.getProfile,
  select: (r) => r.data,
});

export const useUpdateProfile = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<User>) => profileApi.updateProfile(input),
    onSuccess: (response) => {
      if (response?.data) {
        authService.updateSession(response.data);
      }
      client.invalidateQueries({ queryKey: queryKeys.profile.me() });
    },
  });
};
