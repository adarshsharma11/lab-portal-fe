"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentApi, billingApi, inventoryApi } from "@/mocks/services/operations";
import type { Appointment, InventoryItem, Invoice } from "@/types/domain";
export const useAppointments = () => useQuery({ queryKey: ["appointments"], queryFn: appointmentApi.list, select: (r) => r.data }); export const useAppointment = (id: string) => useQuery({ queryKey: ["appointments", id], queryFn: () => appointmentApi.getById(id), select: (r) => r.data });
export const useInvoices = () => useQuery({ queryKey: ["billing"], queryFn: billingApi.list, select: (r) => r.data }); export const useInvoice = (id: string) => useQuery({ queryKey: ["billing", id], queryFn: () => billingApi.getById(id), select: (r) => r.data });
export const useInventory = () => useQuery({ queryKey: ["inventory"], queryFn: inventoryApi.list, select: (r) => r.data });
const mutation = <T,>(key: string, fn: (input: T) => Promise<unknown>) => { const c = useQueryClient(); return useMutation({ mutationFn: fn, onSuccess: () => c.invalidateQueries({ queryKey: [key] }) }); };
export const useCreateAppointment = () => mutation<Omit<Appointment,"id">>("appointments", appointmentApi.create); export const useCreateInvoice = () => mutation<Omit<Invoice,"id">>("billing", billingApi.create); export const useCreateInventory = () => mutation<Omit<InventoryItem,"id">>("inventory", inventoryApi.create); export const useDeleteInventory = () => mutation<string>("inventory", inventoryApi.delete);
