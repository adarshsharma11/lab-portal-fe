"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { instrumentApi } from "@/mocks/services/instruments";
import type { Instrument } from "@/types/domain";

export const useInstruments = (filters: Readonly<Record<string, unknown>> = {}) => useQuery<ApiResponse<readonly Instrument[]>, Error, readonly Instrument[]>({
  queryKey: queryKeys.instruments.list(filters),
  queryFn: () => instrumentApi.list(filters),
  select: (r) => r.data,
});

export const useInstrument = (id: string) => useQuery<ApiResponse<Instrument | null>, Error, Instrument | null>({
  queryKey: queryKeys.instruments.detail(id),
  queryFn: () => instrumentApi.getById(id),
  select: (r) => r.data,
  enabled: !!id,
});

export const useInstrumentMutations = () => {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.instruments.all });
  return {
    create: useMutation({
      mutationFn: (input: Omit<Instrument, "id">) => instrumentApi.create(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<Omit<Instrument, "id">> }) => instrumentApi.update(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => instrumentApi.delete(id),
      onSuccess: invalidate,
    }),
  };
};
