import { apiClient } from "@/lib/api/client";
import type { Instrument } from "@/types/domain";

export const instrumentApi = {
  list: (filters: Readonly<Record<string, unknown>> = {}) =>
    apiClient.get<readonly Instrument[]>("/instruments", filters as Record<string, any>),
  getById: (id: string) =>
    apiClient.get<Instrument | null>(`/instruments/${id}`),
  create: (input: Omit<Instrument, "id">) =>
    apiClient.post<Instrument>("/instruments", input),
  update: (id: string, input: Partial<Omit<Instrument, "id">>) =>
    apiClient.put<Instrument>(`/instruments/${id}`, input),
  delete: (id: string) =>
    apiClient.delete<void>(`/instruments/${id}`),
};
