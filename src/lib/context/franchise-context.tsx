"use client";
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useEntityList } from "@/features/crud/hooks";
import { authService } from "@/lib/auth/auth-service";
import type { Franchise, UserRole } from "@/types/domain";

interface FranchiseContextType {
  selectedFranchiseId: string | "all";
  selectedFranchise: Franchise | null;
  franchises: readonly Franchise[];
  isLoading: boolean;
  isFranchiseUser: boolean;
  activeFranchiseName: string;
  setSelectedFranchiseId: (id: string | "all") => void;
}

const FranchiseContext = createContext<FranchiseContextType | undefined>(undefined);

export function FranchiseProvider({ children }: { children: React.ReactNode }) {
  const [selectedFranchiseId, setSelectedIdState] = useState<string | "all">("all");
  const [currentRole, setCurrentRole] = useState<UserRole | undefined>(undefined);
  const [userFranchiseId, setUserFranchiseId] = useState<string | null>(null);

  const franchiseList = useEntityList<Franchise>("franchises");
  const franchises = useMemo(() => franchiseList.data ?? [], [franchiseList.data]);

  useEffect(() => {
    const session = authService.getSession();
    if (session) {
      setCurrentRole(session.role);
      if (session.role === "Franchise" && (session as any).franchiseId) {
        setUserFranchiseId((session as any).franchiseId);
        setSelectedIdState((session as any).franchiseId);
        return;
      }
    }

    const saved = localStorage.getItem("active_franchise_id");
    if (saved) {
      setSelectedIdState(saved);
    }
  }, []);

  const setSelectedFranchiseId = (id: string | "all") => {
    // If franchise user, locked to their own franchise
    if (currentRole === "Franchise" && userFranchiseId) {
      setSelectedIdState(userFranchiseId);
      return;
    }
    setSelectedIdState(id);
    localStorage.setItem("active_franchise_id", id);
  };

  const isFranchiseUser = currentRole === "Franchise";

  const selectedFranchise = useMemo(() => {
    if (selectedFranchiseId === "all") return null;
    return franchises.find((f) => f.id === selectedFranchiseId) ?? null;
  }, [franchises, selectedFranchiseId]);

  const activeFranchiseName = useMemo(() => {
    if (selectedFranchise) return `${selectedFranchise.name} (${selectedFranchise.city})`;
    if (selectedFranchiseId === "all") return "All Franchises (Global HQ)";
    return "All Franchises";
  }, [selectedFranchise, selectedFranchiseId]);

  const value = useMemo(
    () => ({
      selectedFranchiseId,
      selectedFranchise,
      franchises,
      isLoading: franchiseList.isLoading,
      isFranchiseUser,
      activeFranchiseName,
      setSelectedFranchiseId,
    }),
    [selectedFranchiseId, selectedFranchise, franchises, franchiseList.isLoading, isFranchiseUser, activeFranchiseName]
  );

  return <FranchiseContext.Provider value={value}>{children}</FranchiseContext.Provider>;
}

export function useFranchise() {
  const context = useContext(FranchiseContext);
  if (!context) {
    throw new Error("useFranchise must be used within a FranchiseProvider");
  }
  return context;
}
