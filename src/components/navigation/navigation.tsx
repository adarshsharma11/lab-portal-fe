"use client";
import {
  Activity, Building2, CalendarDays, ChevronDown, ChevronRight, ClipboardList, Cpu, Droplets, FileBarChart, FlaskConical,
  Gauge, IndianRupee, LayoutDashboard, LogOut, Microscope, Package, Plus, ReceiptText, Search, Settings as SettingsIcon,
  ShieldCheck, Stethoscope, TestTube2, User, UserCog, Users, X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { authService } from "@/lib/auth/auth-service";
import { useFranchise } from "@/lib/context/franchise-context";
import type { UserRole } from "@/types/domain";
import { getFilteredNavigation, type NavItem } from "@/lib/auth/rbac";
import { Avatar, Breadcrumb, cn, Dot, StatusBadge } from "@/components/ui";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, Users, TestTube2, ClipboardList, Droplets, FlaskConical, Activity, Gauge,
  FileBarChart, ReceiptText, CalendarDays, IndianRupee, Package, ShieldCheck, Cpu, Stethoscope, UserCog, Microscope, Building2, Settings: SettingsIcon,
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
  const navigation = useMemo(() => getFilteredNavigation(role), [role]);

  const logout = () => {
    authService.logout();
    router.replace("/login");
  };

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-label="Close navigation"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[color:var(--line)] bg-[color:var(--surface)] transition-all duration-200",
          collapsed ? "w-[72px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-[color:var(--line)]">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0" onClick={onClose}>
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[color:var(--brand-600)] text-white shadow-sm">
              <FlaskConical size={18} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-[color:var(--foreground)]">
                  BLDignostics LIMS
                </p>
                <p className="truncate text-[11px] font-medium text-[color:var(--muted)]">
                  Diagnostic Platform
                </p>
              </div>
            )}
          </Link>
          <button
            type="button"
            className="p-1.5 text-[color:var(--muted)] hover:text-[color:var(--foreground)] lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Main Navigation">
          {navigation.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = iconMap[item.icon] ?? Activity;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-[10px] px-3 h-9 text-xs font-medium transition-colors",
                          active
                            ? "bg-[color:var(--brand-50)] text-[color:var(--brand-700)] font-semibold shadow-xs"
                            : "text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--foreground)]",
                          collapsed && "justify-center px-0",
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
  doctors: "Doctors", franchises: "Franchises", users: "Users", settings: "Settings", profile: "Profile",
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
  const [franchiseDropdownOpen, setFranchiseDropdownOpen] = useState(false);
  const [cmdKOpen, setCmdKOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { selectedFranchiseId, selectedFranchise, franchises, setSelectedFranchiseId, isFranchiseUser, activeFranchiseName } = useFranchise();

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

  const isAdmin = userRole === "Admin" || userRole === "Administrator";

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
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
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

          <div className="flex items-center gap-2.5">
            {/* Franchise Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => !isFranchiseUser && setFranchiseDropdownOpen((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-2 h-9 px-3 rounded-[10px] border border-[color:var(--line)] bg-[color:var(--surface)] text-xs font-semibold transition-colors shadow-xs",
                  isFranchiseUser ? "cursor-default text-[#176b87] bg-[#e8f4f7]" : "hover:bg-[color:var(--surface-2)] text-[color:var(--foreground)]"
                )}
                title={isFranchiseUser ? "Franchise Locked Context" : "Switch active franchise view"}
              >
                <Building2 size={15} className="text-[#176b87] shrink-0" />
                <span className="max-w-[150px] sm:max-w-[200px] truncate">
                  {selectedFranchise ? selectedFranchise.name : (isFranchiseUser ? activeFranchiseName : "All Franchises (HQ)")}
                </span>
                {!isFranchiseUser && <ChevronDown size={13} className="text-[color:var(--muted)] shrink-0" />}
              </button>

              {franchiseDropdownOpen && !isFranchiseUser && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFranchiseDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[color:var(--surface)] py-2 shadow-[var(--shadow-lg)]">
                    <div className="px-3 py-2 border-b border-[color:var(--line)]">
                      <p className="text-xs font-bold text-[color:var(--foreground)] uppercase tracking-wider">Select Active Franchise</p>
                      <p className="text-[11px] text-[color:var(--muted)] mt-0.5">Filter all reports, samples & dashboard data</p>
                    </div>

                    <div className="py-1 max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFranchiseId("all");
                          setFranchiseDropdownOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-left hover:bg-[color:var(--surface-2)] transition-colors",
                          selectedFranchiseId === "all" ? "bg-[color:var(--brand-50)] text-[color:var(--brand-700)] font-semibold" : "text-[color:var(--foreground)]"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🌐</span>
                          <span>All Franchises (Global HQ)</span>
                        </div>
                        {selectedFranchiseId === "all" && <span className="size-1.5 rounded-full bg-[color:var(--brand-600)]" />}
                      </button>

                      {franchises.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setSelectedFranchiseId(f.id);
                            setFranchiseDropdownOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-left hover:bg-[color:var(--surface-2)] transition-colors",
                            selectedFranchiseId === f.id ? "bg-[color:var(--brand-50)] text-[color:var(--brand-700)] font-semibold" : "text-[color:var(--foreground)]"
                          )}
                        >
                          <div>
                            <p className="font-semibold">{f.name}</p>
                            <p className="text-[10px] text-[color:var(--muted)]">{f.code} · {f.city}</p>
                          </div>
                          {selectedFranchiseId === f.id && <span className="size-1.5 rounded-full bg-[color:var(--brand-600)]" />}
                        </button>
                      ))}

                      {franchises.length === 0 && (
                        <p className="px-3 py-3 text-center text-xs text-[color:var(--muted)]">No franchises registered yet.</p>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="border-t border-[color:var(--line)] pt-1 px-1">
                        <Link
                          href="/franchises/new"
                          onClick={() => setFranchiseDropdownOpen(false)}
                          className="flex items-center justify-center gap-1.5 w-full rounded-md px-3 py-1.5 text-xs font-semibold text-[#176b87] hover:bg-[#e8f4f7] transition-colors"
                        >
                          <Plus size={13} />
                          Register New Franchise
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Quick Search Button in Header */}
            <button
              type="button"
              onClick={() => setCmdKOpen(true)}
              className="hidden md:inline-flex h-9 w-44 lg:w-52 items-center gap-2 rounded-[10px] border border-[color:var(--line)] bg-[color:var(--surface-2)]/60 px-3 text-xs text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] transition-colors"
            >
              <Search size={14} className="shrink-0" />
              <span className="flex-1 text-left truncate">Search…</span>
              <kbd className="rounded border border-[color:var(--line)] bg-[color:var(--surface)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--muted)] shrink-0">⌘K</kbd>
            </button>
            <button
              type="button"
              className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-[10px] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]"
              onClick={() => setCmdKOpen(true)}
              aria-label="Open search palette"
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
                      <User size={15} /> Profile & Settings
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2.5 px-3 h-9 text-sm text-[color:var(--danger)] hover:bg-[color:var(--danger-bg)]"
                    >
                      <LogOut size={15} /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Command Palette / Search Modal */}
      {cmdKOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setCmdKOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[color:var(--surface)] shadow-[var(--shadow-lg)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 px-4 border-b border-[color:var(--line)]">
              <Search size={16} className="text-[color:var(--muted)] shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search modules or actions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 bg-transparent text-sm text-[color:var(--foreground)] placeholder-[color:var(--muted)] outline-none"
              />
              <kbd className="hidden sm:inline-block rounded border border-[color:var(--line)] bg-[color:var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--muted)]">ESC</kbd>
              <button
                type="button"
                onClick={() => setCmdKOpen(false)}
                className="grid size-7 place-items-center rounded-lg text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--foreground)] transition-colors shrink-0"
                aria-label="Close search"
                title="Close (ESC)"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[color:var(--muted)]">Navigation</p>
              {filtered.map((item) => {
                const Icon = iconMap[item.icon] ?? Activity;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setCmdKOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)]"
                  >
                    <Icon size={16} className="text-[color:var(--muted)] shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-[color:var(--muted)]">No matching modules found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
