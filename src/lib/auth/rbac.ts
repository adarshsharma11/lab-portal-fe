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

const ALL: readonly UserRole[] = ["Administrator", "Pathologist", "Technician", "Admin", "Receptionist", "Doctor"] as const;
const ADMIN: readonly UserRole[] = ["Administrator", "Admin"] as const;
const LAB: readonly UserRole[] = ["Administrator", "Admin", "Technician", "Pathologist"] as const;
const REPORTING: readonly UserRole[] = ["Administrator", "Admin", "Pathologist", "Technician", "Doctor"] as const;
const OPS: readonly UserRole[] = ["Administrator", "Admin", "Receptionist"] as const;
const QUALITY: readonly UserRole[] = ["Administrator", "Admin", "Pathologist"] as const;
const RECEPTION: readonly UserRole[] = ["Administrator", "Admin", "Receptionist"] as const;
const DOCTOR_VIEW: readonly UserRole[] = ["Administrator", "Admin", "Doctor"] as const;

export const NAVIGATION: readonly NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ALL },
    ],
  },
  {
    label: "Laboratory",
    items: [
      { label: "Patients", href: "/patients", icon: "Users", roles: ["Administrator", "Admin", "Technician", "Receptionist", "Doctor", "Pathologist"] },
      { label: "Samples", href: "/samples", icon: "TestTube2", roles: LAB },
      { label: "Tests", href: "/tests", icon: "ClipboardList", roles: LAB },
      { label: "Hematology", href: "/hematology", icon: "Droplets", roles: LAB },
      { label: "Biochemistry", href: "/biochemistry", icon: "FlaskConical", roles: LAB },
      { label: "Urine Analysis", href: "/urine-analysis", icon: "Activity", roles: LAB },
      { label: "Electrolytes", href: "/electrolytes", icon: "Gauge", roles: LAB },
    ],
  },
  {
    label: "Reporting",
    items: [
      { label: "Results", href: "/results", icon: "FileBarChart", roles: REPORTING },
      { label: "Reports", href: "/reports", icon: "ReceiptText", roles: REPORTING },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Appointments", href: "/appointments", icon: "CalendarDays", roles: RECEPTION },
      { label: "Billing", href: "/billing", icon: "IndianRupee", roles: OPS },
      { label: "Inventory", href: "/inventory", icon: "Package", roles: OPS },
      { label: "Suppliers", href: "/suppliers", icon: "Truck", roles: OPS },
    ],
  },
  {
    label: "Quality",
    items: [
      { label: "Quality Control", href: "/quality-control", icon: "ShieldCheck", roles: QUALITY },
      { label: "Instruments", href: "/instruments", icon: "Cpu", roles: LAB },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Doctors", href: "/doctors", icon: "Stethoscope", roles: DOCTOR_VIEW },
      { label: "Users", href: "/users", icon: "UserCog", roles: ADMIN },
      { label: "Settings", href: "/settings", icon: "Settings", roles: ADMIN },
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

export function getLandingPageForRole(role: UserRole | undefined): string {
  const normalized = (role === "Administrator" ? "Admin" : role) as UserRole | undefined;
  switch (normalized) {
    case "Technician": return "/samples";
    case "Pathologist": return "/reports";
    case "Receptionist": return "/patients";
    case "Doctor": return "/reports";
    default: return "/dashboard";
  }
}
