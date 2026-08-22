"use client";
import {
  Activity, CalendarDays, ChevronDown, ChevronRight, ClipboardList, Cpu, Droplets, FileBarChart, FlaskConical,
  Gauge, IndianRupee, LayoutDashboard, LogOut, Package, ReceiptText, Search, Settings as SettingsIcon,
  ShieldCheck, Stethoscope, TestTube2, Truck, User, UserCog, Users, X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { authService } from "@/lib/auth/auth-service";
import type { UserRole } from "@/types/domain";
import { getFilteredNavigation, type NavItem } from "@/lib/auth/rbac";
import { Avatar, Breadcrumb, cn, Dot, StatusBadge } from "@/components/ui";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, Users, TestTube2, ClipboardList, Droplets, FlaskConical, Activity, Gauge,
  FileBarChart, ReceiptText, CalendarDays, IndianRupee, Package, Truck, ShieldCheck, Cpu, Stethoscope, UserCog, Settings: SettingsIcon,
};

export function Sidebar({
  mobileOpen,
  onClose,
  role,
  userInitials,
  userName,
  collapsed,
}: Readonly<{
  mobileOpen: boolean;
  onClose: () => void;
  role?: UserRole;
  userInitials: string;
  userName: string;
  collapsed: boolean;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = useMemo(() => getFilteredNavigation(role), [role]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const logout = () => {
    authService.logout();
    router.replace("/login");
  };

  return (
    <>
      <button
        onClick={onClose}
        className={cn("fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm transition-opacity lg:hidden", mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
        aria-label="Close navigation"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[color:var(--line)] bg-[color:var(--surface)] transition-all duration-200",
          collapsed ? "w-[72px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
        <div className={cn("flex items-center border-b border-[color:var(--line)] px-4", collapsed ? "h-16 justify-center" : "h-16 justify-between")}>
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 min-w-0">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[color:var(--brand-600)] to-[color:var(--brand)] text-white shadow-[var(--shadow)]">
              <FlaskConical size={18} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-[color:var(--foreground)]">Pathology LIS</p>
                <p className="truncate text-[11px] text-[color:var(--muted)]">Laboratory workspace</p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button className="rounded-lg p-1.5 text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] lg:hidden" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-2 py-4">
          {nav.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--muted-2)]">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item: NavItem) => {
                  const Icon = iconMap[item.icon] ?? LayoutDashboard;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-[10px] text-sm transition-colors",
                          collapsed ? "h-10 w-10 justify-center mx-auto" : "px-3 h-10",
                          active
                            ? "bg-[color:var(--brand-50)] text-[color:var(--brand-600)] font-semibold"
                            : "text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--foreground)]",
                        )}
                      >
                        {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-[color:var(--brand-600)] hidden" />}
                        <Icon size={collapsed ? 18 : 17} className="shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && active && <ChevronRight size={14} className="ml-auto text-[color:var(--brand-600)]" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-[color:var(--line)] p-3">
          <Link
            href="/profile"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-[10px] p-2 transition-colors hover:bg-[color:var(--surface-2)]",
              pathname === "/profile" && "bg-[color:var(--brand-50)]",
              collapsed && "justify-center",
            )}
          >
            <Avatar initials={userInitials} size="sm" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[color:var(--foreground)]">{userName}</p>
                <p className="truncate text-[11px] text-[color:var(--muted)]">{role === "Administrator" ? "Admin" : role}</p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={logout}
              className="mt-1.5 flex w-full items-center gap-3 rounded-[10px] px-3 h-9 text-xs font-medium text-[color:var(--muted)] transition-colors hover:bg-[color:var(--danger-bg)] hover:text-[color:var(--danger)]"
            >
              <LogOut size={15} /> Log out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

const crumbTitles: Readonly<Record<string, string>> = {
  dashboard: "Dashboard", patients: "Patients", samples: "Samples", tests: "Tests",
  hematology: "Hematology", biochemistry: "Biochemistry", "urine-analysis": "Urine Analysis", electrolytes: "Electrolytes",
  results: "Results", reports: "Reports", appointments: "Appointments", billing: "Billing",
  inventory: "Inventory", suppliers: "Suppliers", "quality-control": "Quality Control", instruments: "Instruments",
  doctors: "Doctors", users: "Users", settings: "Settings", profile: "Profile",
};

function buildCrumbs(pathname: string): readonly Readonly<{ label: string; href?: string }>[] {
  const parts = pathname.split("/").filter(Boolean);
  const result: { label: string; href?: string }[] = [{ label: "LIS", href: "/dashboard" }];
  if (parts[0] && parts[0] !== "dashboard") {
    result.push({ label: crumbTitles[parts[0]] ?? parts[0].replace(/-/g, " "), href: `/${parts[0]}` });
  }
  if (parts[1] && parts[1] !== "new") {
    const hasId = parts.length >= 2 && parts[1] !== "edit" && parts[1] !== "pending" && parts[1] !== "templates";
    result.push({ label: hasId ? parts[1].slice(0, 1).toUpperCase() + parts[1].slice(1, 8) : parts[1][0]?.toUpperCase() + parts[1].slice(1).replace(/-/g, " ") });
  } else if (parts[1] === "new") {
    result.push({ label: "New" });
  }
  return result;
}

export function Header({
  onToggleMobile,
  onToggleSidebar,
  dark,
  onToggleDark,
  userName,
  userRole,
  userInitials,
  collapsed,
}: Readonly<{
  onToggleMobile: () => void;
  onToggleSidebar: () => void;
  dark: boolean;
  onToggleDark: () => void;
  userName: string;
  userRole?: UserRole;
  userInitials: string;
  collapsed: boolean;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmdKOpen, setCmdKOpen] = useState(false);
  const [search, setSearch] = useState("");
  const nav = useMemo(() => getFilteredNavigation(userRole), [userRole]);
  const items = useMemo(() => nav.flatMap((g) => g.items), [nav]);
  const filtered = useMemo(() => {
    if (!search.trim()) return items.slice(0, 6);
    const s = search.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(s)).slice(0, 8);
  }, [items, search]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdKOpen((v) => !v);
      }
      if (e.key === "Escape") setCmdKOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const logout = () => { authService.logout(); router.replace("/login"); };

  return (
    <>
      <header className="sticky top-0 z-20 h-16 border-b border-[color:var(--line)] bg-[color:var(--surface)]/90 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-4 lg:px-6 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onToggleMobile}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] lg:hidden"
              aria-label="Open navigation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {collapsed
                  ? <><line x1="3" y1="12" x2="21" y2="12" /><polyline points="14 5 21 12 14 19" /></>
                  : <><line x1="21" y1="12" x2="3" y2="12" /><polyline points="10 19 3 12 10 5" /></>}
              </svg>
            </button>
            <div className="hidden sm:block min-w-0">
              <Breadcrumb items={buildCrumbs(pathname)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCmdKOpen(true)}
              className="hidden md:inline-flex h-9 w-72 items-center gap-2 rounded-[10px] border border-[color:var(--line)] bg-[color:var(--surface-2)]/60 px-3 text-xs text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] transition-colors"
            >
              <Search size={14} />
              <span className="flex-1 text-left">Search modules, actions…</span>
              <kbd className="rounded border border-[color:var(--line)] bg-[color:var(--surface)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--muted)]">⌘K</kbd>
            </button>
            <button
              type="button"
              className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-[10px] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]"
              onClick={() => setCmdKOpen(true)}
              aria-label="Open command palette"
            ><Search size={16} /></button>

            <button
              type="button"
              onClick={onToggleDark}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]"
              aria-label="Toggle color scheme"
            >
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m4.93 19.07 1.41-1.41" /><path d="m17.66 6.34 1.41-1.41" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <button type="button" className="relative inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]" aria-label="Notifications">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span className="absolute right-2 top-2 size-2 rounded-full bg-[color:var(--danger)] ring-2 ring-[color:var(--surface)]" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="hidden sm:inline-flex items-center gap-2.5 h-9 pr-2 pl-1 rounded-[10px] hover:bg-[color:var(--surface-2)] transition-colors"
              >
                <Avatar initials={userInitials} size="sm" />
                <div className="hidden xl:block text-left leading-tight">
                  <p className="text-xs font-semibold text-[color:var(--foreground)] truncate max-w-[140px]">{userName}</p>
                  <p className="text-[11px] text-[color:var(--muted)]">{userRole === "Administrator" ? "Admin" : userRole}</p>
                </div>
                <ChevronDown size={14} className="text-[color:var(--muted)] hidden xl:block" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[color:var(--surface)] py-2 shadow-[var(--shadow-lg)]">
                    <div className="px-3 py-2.5 border-b border-[color:var(--line)]">
                      <p className="text-sm font-semibold text-[color:var(--foreground)]">{userName}</p>
                      <p className="text-xs text-[color:var(--muted)] mt-0.5">{userRole}</p>
                    </div>
                    <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 h-9 text-sm text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)]">
                      <User size={15} /> Profile
                    </Link>
                    <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 h-9 text-sm text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)]">
                      <SettingsIcon size={15} /> Settings
                    </Link>
                    <div className="my-1 h-px bg-[color:var(--line)]" />
                    <button type="button" onClick={logout} className="flex w-full items-center gap-2.5 px-3 h-9 text-sm text-[color:var(--danger)] hover:bg-[color:var(--danger-bg)]">
                      <LogOut size={15} /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {cmdKOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/40 backdrop-blur-sm p-4 pt-[15vh]" onClick={() => setCmdKOpen(false)}>
          <div
            className="w-full max-w-xl rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[color:var(--surface)] shadow-[var(--shadow-lg)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[color:var(--line)] px-4 h-14">
              <Search size={17} className="text-[color:var(--muted)]" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items or type to go to a page…"
                className="flex-1 bg-transparent text-sm outline-none text-[color:var(--foreground)] placeholder:text-[color:var(--muted-2)]"
              />
              <kbd className="rounded border border-[color:var(--line)] bg-[color:var(--surface-2)] px-1.5 py-0.5 text-[10px] text-[color:var(--muted)]">Esc</kbd>
            </div>
            <ul className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-[color:var(--muted)]">No matches for "{search}".</li>
              ) : filtered.map((item) => {
                const Icon = iconMap[item.icon] ?? Activity;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => { setCmdKOpen(false); setSearch(""); }}
                      className="flex items-center gap-3 px-4 h-10 text-sm hover:bg-[color:var(--brand-50)] hover:text-[color:var(--brand-600)] transition-colors"
                    >
                      <Icon size={15} className="text-[color:var(--muted)]" />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-xs text-[color:var(--muted)]">{item.href}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between border-t border-[color:var(--line)] px-4 h-9 text-[11px] text-[color:var(--muted)] bg-[color:var(--surface-2)]/60">
              <span className="inline-flex items-center gap-1.5"><Dot tone="success" /> Connected to mock workspace</span>
              <span>Navigate · ↑/↓ · Enter to open</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
