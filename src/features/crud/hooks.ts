"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import { doctorApi, patientApi, supplierApi, userApi } from "@/mocks/services/resources";
import type { Doctor, Patient, Supplier, User } from "@/types/domain";
type Entity = Patient | Doctor | Supplier | User; type Kind = "patients" | "doctors" | "suppliers" | "users";
const api = { patients: patientApi, doctors: doctorApi, suppliers: supplierApi, users: userApi } as const;
const keys = { patients: queryKeys.patients.all, doctors: queryKeys.doctors.all, suppliers: queryKeys.suppliers.all, users: queryKeys.users.all } as const;
const serviceFor = <T extends Entity>(kind: Kind) => api[kind] as unknown as { list: () => Promise<ApiResponse<T[]>>; getById: (id: string) => Promise<ApiResponse<T | null>>; create: (input: Omit<T, "id">) => Promise<ApiResponse<T>>; update: (id: string, input: Partial<Omit<T, "id">>) => Promise<ApiResponse<T>>; delete: (id: string) => Promise<ApiResponse<void>> };
export function useEntityList<T extends Entity>(kind: Kind) { const service = serviceFor<T>(kind); return useQuery<ApiResponse<T[]>, Error, T[]>({ queryKey: keys[kind], queryFn: service.list, select: (result) => result.data }); }
export function useEntity<T extends Entity>(kind: Kind, id: string) { const service = serviceFor<T>(kind); return useQuery<ApiResponse<T | null>, Error, T | null>({ queryKey: [...keys[kind], id], queryFn: () => service.getById(id), select: (result) => result.data }); }
export function useEntityMutations<T extends Entity>(kind: Kind) { const client = useQueryClient(); const service = serviceFor<T>(kind); const invalidate = () => client.invalidateQueries({ queryKey: keys[kind] }); return { create: useMutation({ mutationFn: service.create, onSuccess: invalidate }), update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<Omit<T, "id">> }) => service.update(id, input), onSuccess: invalidate }), remove: useMutation({ mutationFn: service.delete, onSuccess: invalidate }) }; }
