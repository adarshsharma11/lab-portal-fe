"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { authService } from "@/lib/auth/auth-service";
import { canAccessRoute } from "@/lib/auth/rbac";
import { Header, Sidebar } from "@/components/navigation/navigation";
import { FranchiseProvider } from "@/lib/context/franchise-context";
import type { UserRole } from "@/types/domain";
import { cn } from "@/components/ui";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [session, setSession] = useState<{ name: string; initials: string; role?: UserRole; avatar?: string } | null>(null);

  useEffect(() => {
    const syncSession = () => {
      const s = authService.getSession();
      if (!s) {
        router.replace("/login");
        return;
      }
      setSession({
        name: s.name,
        initials: s.initials,
        role: (s.role as UserRole) ?? "Admin",
        avatar: s.avatar,
      });
    };

    syncSession();
    window.addEventListener("auth-session-update", syncSession);
    return () => window.removeEventListener("auth-session-update", syncSession);
  }, [router]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-[color:var(--muted)]">
        Preparing your workspace…
      </div>
    );
  }

  const baseRoute = "/" + pathname.split("/").filter(Boolean)[0];
  const accessGranted = canAccessRoute(session.role, pathname === "/" ? "/dashboard" : (baseRoute === "/undefined" ? "/dashboard" : baseRoute));

  if (!accessGranted) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-[color:var(--muted)] mb-4">You do not have permission to view this page.</p>
          <button onClick={() => router.replace("/dashboard")} className="text-[color:var(--brand-600)] hover:underline text-sm font-medium">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <FranchiseProvider>
      <div className={cn("min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)] sidebar-layout")}>
        <Sidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          role={session.role}
          userInitials={session.initials}
          userName={session.name}
          userAvatar={session.avatar}
          collapsed={collapsed}
        />

        <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]")}>
          <Header
            onToggleMobile={() => setMobileOpen(true)}
            onToggleSidebar={() => setCollapsed((v) => !v)}
            dark={dark}
            onToggleDark={() => setDark((v) => !v)}
            userName={session.name}
            userRole={session.role}
            userInitials={session.initials}
            userAvatar={session.avatar}
            collapsed={collapsed}
          />
          <main className="px-4 py-6 lg:px-8 lg:py-8 no-print-children">
            {children}
          </main>
        </div>
      </div>
    </FranchiseProvider>
  );
}
