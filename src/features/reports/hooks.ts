"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { reportApi, reportTemplateApi } from "@/mocks/services/resources";
import type { ReportTemplate } from "@/types/domain";

export const useReports = () =>
  useQuery({
    queryKey: queryKeys.reports.all,
    queryFn: reportApi.list,
    select: (response) => response.data,
  });

export const useReport = (id: string) =>
  useQuery({
    queryKey: queryKeys.reports.detail(id),
    queryFn: () => reportApi.getById(id),
    select: (response) => response.data,
    enabled: Boolean(id && id !== "new" && id !== "templates"),
  });

export const useReportTemplates = () =>
  useQuery({
    queryKey: queryKeys.reports.templates,
    queryFn: reportTemplateApi.list,
    select: (response) => response.data,
  });

export const useReportTemplate = (id: string) =>
  useQuery({
    queryKey: ["reports", "templates", id],
    queryFn: () => reportTemplateApi.getById(id),
    select: (response) => response.data,
    enabled: Boolean(id && id !== "new" && id !== "templates"),
  });

export function useReportActions() {
  const client = useQueryClient();
  const done = () => client.invalidateQueries({ queryKey: queryKeys.reports.all });
  const approveReport = useMutation({
    mutationFn: (id: string) => reportApi.update(id, { status: "Approved", pathologist: "Dr. Ananya Rao" }),
    onSuccess: done,
  });
  const rejectReport = useMutation({
    mutationFn: (id: string) => reportApi.update(id, { status: "Rejected", pathologist: "Dr. Ananya Rao" }),
    onSuccess: done,
  });
  const requestRetest = useMutation({
    mutationFn: (id: string) => reportApi.update(id, { status: "Retest Requested" }),
    onSuccess: done,
  });
  const updateComments = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) => reportApi.update(id, { comments }),
    onSuccess: done,
  });
  return { approveReport, rejectReport, requestRetest, updateComments };
}

export const useCreateTemplate = () => {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<ReportTemplate, "id">) => reportTemplateApi.create(input),
    onSuccess: () => c.invalidateQueries({ queryKey: queryKeys.reports.templates }),
  });
};

export const useUpdateTemplate = () => {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Omit<ReportTemplate, "id">> }) =>
      reportTemplateApi.update(id, input),
    onSuccess: () => {
      c.invalidateQueries({ queryKey: queryKeys.reports.templates });
      c.invalidateQueries({ queryKey: ["reports", "templates"] });
    },
  });
};

export const useDeleteTemplate = () => {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportTemplateApi.delete(id),
    onSuccess: () => c.invalidateQueries({ queryKey: queryKeys.reports.templates }),
  });
};
