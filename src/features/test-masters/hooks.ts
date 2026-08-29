"use client";
import { useQuery } from "@tanstack/react-query";
import { testMasterApi } from "@/mocks/services/resources";
import type { TestMaster } from "@/types/domain";

export function useTestMasters(search?: string, department?: string, limit: number = 200) {
  return useQuery({
    queryKey: ["test-masters", search, department, limit],
    queryFn: async () => {
      const res = await testMasterApi.list({ search, department, limit });
      return (res.data || []) as TestMaster[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTestMaster(idOrCode: string) {
  return useQuery({
    queryKey: ["test-masters", "detail", idOrCode],
    queryFn: async () => {
      if (!idOrCode) return null;
      const res = await testMasterApi.getById(idOrCode);
      return (res.data || null) as TestMaster | null;
    },
    enabled: Boolean(idOrCode && idOrCode !== "new"),
  });
}
