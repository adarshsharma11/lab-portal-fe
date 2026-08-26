import type { UserRole } from "@/types/domain";

export type NavGroup = Readonly<{
  label: string;
  items: readonly NavItem[];
}>;

export type NavItem = Readonly<{
  label: string;
  href: string;
  icon: string;
  roles: readonly UserRole[];
}>;

const ALL: readonly UserRole[] = ["Administrator", "Admin", "Pathologist", "Technician", "Doctor", "Receptionist", "Franchise"] as const;
const ADMIN: readonly UserRole[] = ["Administrator", "Admin"] as const;
const TECH_ROLES: readonly UserRole[] = ["Administrator", "Admin", "Technician", "Franchise"] as const;
const PATH_ROLES: readonly UserRole[] = ["Administrator", "Admin", "Pathologist"] as const;
const LAB_PROCESS: readonly UserRole[] = ["Administrator", "Admin", "Technician", "Pathologist", "Franchise"] as const;
const REPORT_ROLES: readonly UserRole[] = ["Administrator", "Admin", "Pathologist", "Doctor", "Technician", "Franchise"] as const;

export const NAVIGATION: readonly NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ALL },
    ],
  },
  {
    label: "Laboratory & Testing",
    items: [
      { label: "Patients", href: "/patients", icon: "Users", roles: ["Administrator", "Admin", "Technician", "Pathologist", "Doctor", "Receptionist", "Franchise"] },
      { label: "Samples", href: "/samples", icon: "TestTube2", roles: LAB_PROCESS },
      { label: "Tests Master", href: "/tests", icon: "ClipboardList", roles: LAB_PROCESS },
      { label: "Hematology", href: "/hematology", icon: "Droplets", roles: TECH_ROLES },
      { label: "Biochemistry", href: "/biochemistry", icon: "FlaskConical", roles: TECH_ROLES },
      { label: "Urine Analysis", href: "/urine-analysis", icon: "Activity", roles: TECH_ROLES },
      { label: "Electrolytes", href: "/electrolytes", icon: "Gauge", roles: TECH_ROLES },
    ],
  },
  {
    label: "Diagnostic Reports",
    items: [
      { label: "Test Results", href: "/results", icon: "FileBarChart", roles: REPORT_ROLES },
      { label: "Reports Workflow", href: "/reports", icon: "ReceiptText", roles: ["Administrator", "Admin", "Pathologist", "Doctor", "Franchise"] },
    ],
  },
  {
    label: "Clinical & Operations",
    items: [
      { label: "Appointments", href: "/appointments", icon: "CalendarDays", roles: ["Administrator", "Admin", "Doctor", "Receptionist", "Franchise"] },
      { label: "Billing & Invoices", href: "/billing", icon: "IndianRupee", roles: ["Administrator", "Admin", "Doctor", "Receptionist", "Franchise"] },
      { label: "Inventory Stock", href: "/inventory", icon: "Package", roles: ["Administrator", "Admin", "Franchise"] },
      { label: "Suppliers", href: "/suppliers", icon: "Package", roles: ADMIN },
    ],
  },
  {
    label: "Quality & Equipment",
    items: [
      { label: "Quality Control", href: "/quality-control", icon: "ShieldCheck", roles: PATH_ROLES },
      { label: "Instruments", href: "/instruments", icon: "Cpu", roles: ["Administrator", "Admin", "Technician", "Pathologist"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Franchises", href: "/franchises", icon: "Building2", roles: ADMIN },
      { label: "Doctors Directory", href: "/doctors", icon: "Stethoscope", roles: ["Administrator", "Admin", "Doctor"] },
      { label: "Pathologist", href: "/pathologists", icon: "Microscope", roles: ADMIN },
      { label: "Technician", href: "/technicians", icon: "TestTube2", roles: ADMIN },
      { label: "User Management", href: "/users", icon: "UserCog", roles: ADMIN },
      { label: "System Settings", href: "/settings", icon: "Settings", roles: ADMIN },
    ],
  },
];

export function canAccessRoute(role: UserRole | undefined, href: string): boolean {
  if (!role) return true;
  const normalized = role === "Administrator" ? "Admin" : role;
  if (normalized === "Admin") return true;
  const item = NAVIGATION.flatMap((g) => g.items).find((i) => i.href === href);
  if (!item) return true;
  const roles = item.roles.map((r) => (r === "Administrator" ? "Admin" : r));
  return roles.includes(normalized);
}

export function getFilteredNavigation(role: UserRole | undefined): readonly NavGroup[] {
  const normalized = (role === "Administrator" ? "Admin" : role) as UserRole | undefined;
  if (normalized === "Admin") return NAVIGATION;
  return NAVIGATION
    .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.some((r) => (r === "Administrator" ? "Admin" : r) === normalized)) }))
    .filter((g) => g.items.length > 0);
}

export function getLandingPageForRole(_role: UserRole | undefined): string {
  return "/dashboard";
}
