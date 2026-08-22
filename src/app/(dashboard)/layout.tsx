import { AppShell } from "@/components/layout/app-shell";
import type { ReactNode } from "react";
export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) { return <AppShell>{children}</AppShell>; }
