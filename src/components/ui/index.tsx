import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BadgeTone } from "@/types/domain";
import { AlertCircle, CheckCircle2, Info, Loader2, Search, SlidersHorizontal, XCircle } from "lucide-react";

export const cn = (...classes: readonly (string | false | null | undefined)[]): string => twMerge(clsx(classes));

export function PageHeader({ eyebrow = "Laboratory operations", title, description, action }: Readonly<{ eyebrow?: string; title: string; description: string; action?: ReactNode }>) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-600)]">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-[28px] leading-tight">{title}</h1>
        {description && <p className="mt-2 text-sm text-[color:var(--muted)] max-w-2xl">{description}</p>}
      </div>
      {action && <div className="shrink-0 flex gap-2 flex-wrap">{action}</div>}
    </div>
  );
}

export function SectionHeader({ title, description, action }: Readonly<{ title: string; description?: string; action?: ReactNode }>) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-[color:var(--foreground)]">{title}</h2>
        {description && <p className="mt-1 text-xs text-[color:var(--muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ children, tone = "neutral", size = "sm" }: Readonly<{ children: ReactNode; tone?: BadgeTone; size?: "sm" | "md" | "lg" }>) {
  const styles: Record<BadgeTone, string> = {
    success: "border-[color:var(--success-line)] text-[color:var(--success)] bg-[color:var(--success-bg)]",
    warning: "border-[color:var(--warning-line)] text-[color:var(--warning)] bg-[color:var(--warning-bg)]",
    danger: "border-[color:var(--danger-line)] text-[color:var(--danger)] bg-[color:var(--danger-bg)]",
    info: "border-[color:var(--info-line)] text-[color:var(--info)] bg-[color:var(--info-bg)]",
    pending: "border-[color:var(--pending-line)] text-[color:var(--pending)] bg-[color:var(--pending-bg)]",
    neutral: "border-[color:var(--line)] text-[color:var(--muted)] bg-[color:var(--surface-2)]",
  };
  const sizeClass = size === "lg" ? "px-3.5 py-1 text-sm" : size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border font-semibold", sizeClass, styles[tone])}>
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral" }: Readonly<{ tone?: BadgeTone }>) {
  const dot: Record<BadgeTone, string> = {
    success: "bg-[color:var(--success)]",
    warning: "bg-[color:var(--warning)]",
    danger: "bg-[color:var(--danger)]",
    info: "bg-[color:var(--info)]",
    pending: "bg-[color:var(--pending)]",
    neutral: "bg-[color:var(--muted-2)]",
  };
  return <span className={cn("inline-block size-2 rounded-full", dot[tone])} />;
}

export function Card({ children, className, padding = true }: Readonly<{ children: ReactNode; className?: string; padding?: boolean }>) {
  return (
    <div className={cn("rounded-[var(--radius-lg)] border bg-[color:var(--surface)] shadow-[var(--shadow-sm)]", padding && "p-5", className)}>
      {children}
    </div>
  );
}

export function KPICard({
  label,
  value,
  trend,
  icon: Icon,
  iconTone = "info",
  supportingText,
  isLoading,
}: Readonly<{
  label: string;
  value?: string | number;
  trend?: { direction: "up" | "down" | "flat"; value: string; tone?: BadgeTone };
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  iconTone?: BadgeTone;
  supportingText?: string;
  isLoading?: boolean;
}>) {
  const iconBg: Record<BadgeTone, string> = {
    success: "bg-[color:var(--success-bg)] text-[color:var(--success)]",
    warning: "bg-[color:var(--warning-bg)] text-[color:var(--warning)]",
    danger: "bg-[color:var(--danger-bg)] text-[color:var(--danger)]",
    info: "bg-[color:var(--brand-50)] text-[color:var(--brand-600)]",
    pending: "bg-[color:var(--pending-bg)] text-[color:var(--pending)]",
    neutral: "bg-[color:var(--surface-2)] text-[color:var(--muted)]",
  };
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[color:var(--muted)] uppercase tracking-wide">{label}</p>
          <div className="mt-2.5">
            {isLoading ? (
              <div className="skeleton h-8 w-24 rounded-md" />
            ) : (
              <p className="text-[28px] font-bold tracking-tight text-[color:var(--foreground)] leading-none">{value}</p>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {trend && (
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                trend.tone === "danger" ? "bg-[color:var(--danger-bg)] text-[color:var(--danger)]"
                : trend.tone === "warning" ? "bg-[color:var(--warning-bg)] text-[color:var(--warning)]"
                : "bg-[color:var(--success-bg)] text-[color:var(--success)]")}>
                {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.value}
              </span>
            )}
            {supportingText && <span className="text-[11px] text-[color:var(--muted)]">{supportingText}</span>}
          </div>
        </div>
        {Icon && (
          <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", iconBg[iconTone])}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </Card>
  );
}

export function ChartCard({ title, description, children, action }: Readonly<{ title: string; description?: string; children: ReactNode; action?: ReactNode }>) {
  return (
    <Card>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[color:var(--foreground)]">{title}</h3>
          {description && <p className="mt-1 text-xs text-[color:var(--muted)]">{description}</p>}
        </div>
        {action}
      </div>
      <div className="h-[260px] w-full">{children}</div>
    </Card>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "danger-outline";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
}

export function Button({ children, variant = "primary", size = "md", loading, fullWidth, leftIcon, rightIcon, className, disabled, ...rest }: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[color:var(--brand-600)] text-white hover:bg-[color:var(--brand)] active:bg-[color:var(--brand)] shadow-[var(--shadow-sm)]",
    secondary: "bg-[color:var(--surface-2)] text-[color:var(--foreground)] hover:bg-[color:var(--line-2)] border border-[color:var(--line)]",
    ghost: "text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)]",
    outline: "border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)]",
    danger: "bg-[color:var(--danger)] text-white hover:bg-[#b91c1c] shadow-[var(--shadow-sm)]",
    "danger-outline": "border border-[color:var(--danger-line)] bg-[color:var(--danger-bg)] text-[color:var(--danger)] hover:bg-[#fee2e2]",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs rounded-[var(--radius)]",
    md: "h-10 px-4 text-sm rounded-[var(--radius)]",
    lg: "h-11 px-5 text-sm rounded-[var(--radius)]",
  };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-500)] focus:ring-offset-2 focus:ring-offset-[color:var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant], sizes[size], fullWidth && "w-full", className,
      )}
    >
      {loading ? <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

const baseField = "w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--surface)] px-3.5 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-2)] transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-500)]/30 focus:border-[color:var(--brand-600)] disabled:opacity-50 disabled:cursor-not-allowed";

export function Input({ className, value, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseField, "h-10", className)} value={value ?? ""} {...rest} />;
}

export function Textarea({ className, value, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(baseField, "min-h-[88px] py-2.5 resize-y", className)} value={value ?? ""} {...rest} />;
}

export function Select({ className, children, value, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(baseField, "h-10 pr-8", className)} value={value ?? ""} {...rest}>
      {children}
    </select>
  );
}

export interface FieldProps {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, required, error, children, className }: FieldProps) {
  return (
    <div className={cn(className)}>
      <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-[color:var(--foreground)]">
        {label}
        {required && <span className="text-[color:var(--danger)]">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-[color:var(--danger)] flex items-center gap-1"><AlertCircle size={12} />{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[color:var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function SearchField({ placeholder = "Search...", value, onChange, className }: Readonly<{ placeholder?: string; value: string; onChange: (v: string) => void; className?: string }>) {
  return (
    <div className={cn("relative", className)}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(baseField, "h-10 pl-9 pr-3")}
      />
    </div>
  );
}

export function FilterButton({ label, onClick, active }: Readonly<{ label: string; onClick?: () => void; active?: boolean }>) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-[var(--radius)] border px-3 text-xs font-medium transition-colors",
        active ? "border-[color:var(--brand-600)] bg-[color:var(--brand-50)] text-[color:var(--brand-600)]"
               : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:bg-[color:var(--surface-2)]",
      )}
    >
      <SlidersHorizontal size={14} />
      {label}
    </button>
  );
}

export function Alert({ children, tone = "info", title }: Readonly<{ children: ReactNode; tone?: Exclude<BadgeTone, "neutral" | "pending">; title?: string }>) {
  const map: Record<string, { bg: string; line: string; text: string; Icon: typeof Info }> = {
    info: { bg: "bg-[color:var(--info-bg)]", line: "border-[color:var(--info-line)]", text: "text-[color:var(--info)]", Icon: Info },
    success: { bg: "bg-[color:var(--success-bg)]", line: "border-[color:var(--success-line)]", text: "text-[color:var(--success)]", Icon: CheckCircle2 },
    warning: { bg: "bg-[color:var(--warning-bg)]", line: "border-[color:var(--warning-line)]", text: "text-[color:var(--warning)]", Icon: AlertCircle },
    danger: { bg: "bg-[color:var(--danger-bg)]", line: "border-[color:var(--danger-line)]", text: "text-[color:var(--danger)]", Icon: XCircle },
  };
  const s = map[tone];
  return (
    <div className={cn("rounded-[var(--radius)] border-l-4 p-4", s.bg, s.line)}>
      <div className="flex gap-3">
        <s.Icon size={18} className={cn("mt-0.5 shrink-0", s.text)} />
        <div className="min-w-0">
          {title && <p className={cn("text-sm font-semibold", s.text)}>{title}</p>}
          <p className="text-sm mt-0.5">{children}</p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon, action }: Readonly<{ title: string; description?: string; icon?: React.ComponentType<{ size?: number; className?: string }>; action?: ReactNode }>) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] p-8 text-center">
      {Icon && (
        <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-[color:var(--surface-2)] text-[color:var(--muted)]">
          <Icon size={24} />
        </div>
      )}
      <p className="text-sm font-semibold text-[color:var(--foreground)]">{title}</p>
      {description && <p className="mt-1.5 max-w-md text-xs text-[color:var(--muted)]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="size-1 animate-pulse rounded-full bg-[color:var(--muted)]" style={{ animationDelay: "0ms" }} />
      <span className="size-1 animate-pulse rounded-full bg-[color:var(--muted)]" style={{ animationDelay: "150ms" }} />
      <span className="size-1 animate-pulse rounded-full bg-[color:var(--muted)]" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

export function Skeleton({ className }: Readonly<{ className?: string }>) {
  return <div className={cn("skeleton rounded-[var(--radius)]", className)} />;
}

export function TableSkeleton({ rows = 5, cols = 6 }: Readonly<{ rows?: number; cols?: number }>) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, ri) => (
        <div key={ri} className="grid gap-3 py-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {Array.from({ length: cols }, (_, ci) => <Skeleton key={ci} className={cn("h-4", ci === 0 ? "w-2/3" : "w-1/2")} />)}
        </div>
      ))}
    </div>
  );
}

export function Toolbar({ children, className }: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <div className={cn("mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      {children}
    </div>
  );
}

export function ToolbarLeft({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function ToolbarRight({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function Divider({ className }: Readonly<{ className?: string }>) {
  return <div className={cn("h-px w-full bg-[color:var(--line)]", className)} />;
}

export function Tag({ children, tone = "neutral" }: Readonly<{ children: ReactNode; tone?: BadgeTone }>) {
  const map: Record<BadgeTone, string> = {
    success: "bg-[color:var(--success-bg)] text-[color:var(--success)]",
    warning: "bg-[color:var(--warning-bg)] text-[color:var(--warning)]",
    danger: "bg-[color:var(--danger-bg)] text-[color:var(--danger)]",
    info: "bg-[color:var(--brand-50)] text-[color:var(--brand-600)]",
    pending: "bg-[color:var(--pending-bg)] text-[color:var(--pending)]",
    neutral: "bg-[color:var(--surface-2)] text-[color:var(--muted)]",
  };
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium", map[tone])}>{children}</span>;
}

export function Avatar({ initials, size = "md", src }: Readonly<{ initials: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; src?: string }>) {
  const sizes = { xs: "size-7 text-[10px]", sm: "size-8 text-[11px]", md: "size-9 text-xs", lg: "size-11 text-sm", xl: "size-14 text-base" } as const;
  if (src) return <img src={src} alt="" className={cn("rounded-full object-cover", sizes[size])} />;
  return (
    <div className={cn("grid place-items-center rounded-full font-semibold", sizes[size],
      "bg-[color:var(--brand-100)] text-[color:var(--brand-600)]")}>
      {initials}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }: Readonly<{ tabs: readonly Readonly<{ key: string; label: string; badge?: string; tone?: BadgeTone }>[]; active: string; onChange: (key: string) => void }>) {
  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-[color:var(--line)]">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              isActive ? "border-[color:var(--brand-600)] text-[color:var(--brand-600)]" : "border-transparent text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
            )}
          >
            {tab.label}
            {tab.badge && <StatusBadge size="sm" tone={tab.tone ?? "neutral"}>{tab.badge}</StatusBadge>}
          </button>
        );
      })}
    </div>
  );
}

export function FormSection({ title, description, children }: Readonly<{ title: string; description?: string; children: ReactNode }>) {
  return (
    <Card>
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-[color:var(--foreground)]">{title}</h3>
        {description && <p className="mt-1 text-xs text-[color:var(--muted)]">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

export function Grid2({ children, className }: Readonly<{ children: ReactNode; className?: string }>) {
  return <div className={cn("grid gap-5 sm:grid-cols-2", className)}>{children}</div>;
}

export function Grid3({ children, className }: Readonly<{ children: ReactNode; className?: string }>) {
  return <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>;
}

export function Grid4({ children, className }: Readonly<{ children: ReactNode; className?: string }>) {
  return <div className={cn("grid gap-5 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}

export function Checkbox({ checked, onChange, label, id }: Readonly<{ checked: boolean; onChange: (v: boolean) => void; label?: string; id?: string }>) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2.5 text-sm text-[color:var(--foreground)] cursor-pointer select-none">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded-[4px] border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--brand-600)] focus:ring-[color:var(--brand-500)]/30"
      />
      {label}
    </label>
  );
}

export function Switch({ checked, onChange, label }: Readonly<{ checked: boolean; onChange: (v: boolean) => void; label?: string }>) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-500)]/30",
          checked ? "bg-[color:var(--brand-600)]" : "bg-[color:var(--line)]")}
      >
        <span className={cn("pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition-transform", checked ? "translate-x-5" : "translate-x-0")} />
      </button>
      {label && <span className="text-sm text-[color:var(--foreground)]">{label}</span>}
    </label>
  );
}

export function Breadcrumb({ items }: Readonly<{ items: readonly Readonly<{ label: string; href?: string }>[] }>) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-[color:var(--muted)]">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="text-[color:var(--line-2)]">/</span>}
          {item.href && i < items.length - 1 ? (
            <a href={item.href} className="hover:text-[color:var(--foreground)]">{item.label}</a>
          ) : (
            <span className={i === items.length - 1 ? "text-[color:var(--foreground)] font-medium" : ""}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export { SearchableCombobox } from "./searchable-combobox";
export type { ComboboxOption } from "./searchable-combobox";

