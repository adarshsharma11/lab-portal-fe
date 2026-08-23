import { apiClient } from "@/lib/api/client";
import type { Appointment, InventoryItem, Invoice } from "@/types/domain";

const apiStore = <T extends { id: string }>(resource: string) => ({
  list: () => apiClient.get<T[]>(`/${resource}`),
  getById: (id: string) => apiClient.get<T | null>(`/${resource}/${id}`),
  create: (input: Omit<T, "id">) => apiClient.post<T>(`/${resource}`, input),
  update: (id: string, input: Partial<T>) => apiClient.put<T>(`/${resource}/${id}`, input),
  delete: (id: string) => apiClient.delete<void>(`/${resource}/${id}`),
});

export const appointmentApi = apiStore<Appointment>("appointments");
export const billingApi = apiStore<Invoice>("billing");
export const inventoryApi = apiStore<InventoryItem>("inventory");
