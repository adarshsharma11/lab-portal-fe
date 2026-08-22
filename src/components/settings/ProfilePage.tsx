"use client";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { useMemo } from "react";
import {
  Camera, CheckCircle2, ClipboardList, FileCheck2, Mail, MapPin, Phone, Shield, User as UserIcon, CalendarDays
} from "lucide-react";
import { Avatar, Button, Card, Divider, Field as UIField, FormSection, Grid2, Grid3, Input, KPICard, PageHeader, Select, StatusBadge, Tag, cn } from "@/components/ui";
import { useProfile, useUpdateProfile } from "@/features/settings/hooks";
import type { UserRole } from "@/types/domain";

const profileSchema = Yup.object({
  name: Yup.string().required("Full name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  mobile: Yup.string(),
  dateOfBirth: Yup.string(),
  gender: Yup.string(),
  location: Yup.string(),
});

const roleInfo: Record<UserRole | string, { description: string; tone: "info" | "success" | "warning" | "danger" | "neutral" }> = {
  Admin: { description: "Full access to all laboratory modules and administration.", tone: "info" },
  Administrator: { description: "Full access to all laboratory modules and administration.", tone: "info" },
  Pathologist: { description: "Results, validation, reports, and quality control.", tone: "success" },
  Technician: { description: "Patients, samples, tests, and daily result entry.", tone: "warning" },
  Receptionist: { description: "Patient registration, appointments, and billing.", tone: "neutral" },
  Doctor: { description: "Patients and released reports for reference.", tone: "info" },
};

const permissions = [
  { key: "patients:read", label: "View patients", default: true },
  { key: "patients:write", label: "Create / edit patients", default: true },
  { key: "samples:write", label: "Register samples & tests", default: true },
  { key: "results:write", label: "Enter laboratory results", default: true },
  { key: "reports:approve", label: "Approve & release reports", default: false },
  { key: "qc:manage", label: "Review QC violations", default: false },
  { key: "users:manage", label: "Manage users & roles", default: false },
  { key: "billing:manage", label: "Billing & invoices", default: true },
  { key: "inventory:manage", label: "Inventory & suppliers", default: false },
] as const;

export function ProfilePage() {
  const profile = useProfile();
  const update = useUpdateProfile();

  const granted = useMemo(() => {
    const role = profile.data?.role === "Administrator" ? "Admin" : profile.data?.role;
    if (role === "Admin") return new Set(permissions.map((p) => p.key));
    const perms = new Set<string>(["patients:read"]);
    if (role === "Technician" || role === "Pathologist") {
      perms.add("patients:write").add("samples:write").add("results:write");
    }
    if (role === "Pathologist") {
      perms.add("reports:approve").add("qc:manage");
    }
    if (role === "Receptionist") {
      perms.add("patients:write").add("billing:manage");
    }
    return perms;
  }, [profile.data?.role]);

  const info = profile.data?.role ? roleInfo[profile.data.role] ?? roleInfo["Technician"] : undefined;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        description="Manage your account information, preferences, and role-based permissions. Password and security settings are managed separately via your administrator."
      />

      {profile.data && (
        <>
          <Card padding={false} className="overflow-hidden">
            <div className="relative h-32 bg-gradient-to-r from-[color:var(--brand-600)] via-[color:var(--brand-500)] to-[#60a5fa]">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 30%, white 1px, transparent 1px)",
                backgroundSize: "32px 32px"
              }} />
            </div>
            <div className="px-6 pb-6">
              <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4">
                  <div className="relative">
                    <div className="rounded-full border-4 border-[color:var(--surface)] bg-[color:var(--surface)] shadow-[var(--shadow)] p-0.5">
                      <Avatar initials={profile.data.initials} size="xl" src={profile.data.avatar} />
                    </div>
                    <button type="button" className="absolute bottom-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[color:var(--surface)] bg-[color:var(--brand-600)] text-white shadow-[var(--shadow)]" title="Change avatar">
                      <Camera size={13} />
                    </button>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xl font-bold">{profile.data.name}</p>
                    <p className="text-sm text-[color:var(--muted)]">{profile.data.email}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <StatusBadge tone={info?.tone ?? "info"} size="md">{profile.data.role === "Administrator" ? "Admin" : profile.data.role}</StatusBadge>
                      {profile.data.active !== false ? (
                        <Tag tone="success">Active account</Tag>
                      ) : (
                        <Tag tone="warning">Account disabled</Tag>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-center sm:justify-end">
                  <Button variant="outline" leftIcon={<Shield size={15} />}>Security</Button>
                  <Button variant="primary" leftIcon={<FileCheck2 size={15} />} onClick={() => update.mutate({ ...profile.data! })}>Sync</Button>
                </div>
              </div>
            </div>
          </Card>

          <Grid3>
            <KPICard label="Reports Approved" value={312} icon={FileCheck2} iconTone="success" supportingText="Last 30 days" />
            <KPICard label="Samples Processed" value={846} icon={ClipboardList} iconTone="info" supportingText="Month to date" />
            <KPICard label="Role Permissions" value={granted.size} icon={Shield} iconTone="warning" supportingText={`of ${permissions.length} total`} />
          </Grid3>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-5">
              <FormSection title="Personal Information" description="This information is displayed on reports, audit logs, and internal communications.">
                <Formik initialValues={{ ...profile.data }} validationSchema={profileSchema} enableReinitialize onSubmit={(values) => update.mutate(values)}>
                  {({ errors, touched }) => (
                    <Form className="space-y-5">
                      <Grid2>
                        <UIField label="Full Name" name="name" required error={touched.name ? errors.name as string : undefined}>
                          <Field name="name" as={Input} />
                        </UIField>
                        <UIField label="Email" name="email" required error={touched.email ? errors.email as string : undefined}>
                          <Field name="email" type="email" as={Input} />
                        </UIField>
                        <UIField label="Mobile" name="mobile" hint="For shift alerts and critical result SMS">
                          <Field name="mobile" as={Input} placeholder="+91 98000 00000" />
                        </UIField>
                        <UIField label="Gender" name="gender">
                          <Field name="gender" as={Select}>
                            <option value="">Prefer not to say</option>
                            <option>Male</option><option>Female</option><option>Other</option>
                          </Field>
                        </UIField>
                        <UIField label="Date of Birth" name="dateOfBirth">
                          <Field name="dateOfBirth" type="date" as={Input} />
                        </UIField>
                        <UIField label="Location / Workstation" name="location" hint="Primary department or workstation">
                          <Field name="location" as={Input} placeholder="Central Processing / Hematology" />
                        </UIField>
                      </Grid2>
                      <Divider />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[color:var(--muted)] inline-flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-[color:var(--success)]" />
                          Changes are saved locally and synced to your workspace session.
                        </p>
                        <Button type="submit" variant="primary" loading={update.isPending} leftIcon={<UserIcon size={15} />}>
                          Save Profile
                        </Button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </FormSection>
            </div>

            <div className="space-y-5">
              <Card>
                <h3 className="mb-4 text-sm font-semibold">Role & Permissions</h3>
                <div className="rounded-xl bg-[color:var(--brand-50)] border border-[color:var(--brand-100)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color:var(--brand-600)] text-white"><Shield size={18} /></div>
                    <div>
                      <p className="font-semibold">{profile.data.role === "Administrator" ? "Admin" : profile.data.role}</p>
                      <p className="mt-1 text-xs text-[color:var(--muted)] leading-relaxed">{info?.description}</p>
                    </div>
                  </div>
                </div>
                <Divider className="my-4" />
                <ul className="space-y-2.5">
                  {permissions.map((p) => {
                    const on = granted.has(p.key);
                    return (
                      <li key={p.key} className={cn("flex items-center justify-between rounded-lg px-3 py-2.5 text-xs", on ? "bg-[color:var(--success-bg)]" : "bg-[color:var(--surface-2)] opacity-70")}>
                        <span className={cn("font-medium", on ? "text-[color:var(--foreground)]" : "text-[color:var(--muted)]")}>{p.label}</span>
                        {on ? <Tag tone="success">Granted</Tag> : <Tag tone="neutral">Denied</Tag>}
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <Card>
                <h3 className="mb-4 text-sm font-semibold">Contact</h3>
                <ul className="space-y-3 text-xs">
                  <li className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-[color:var(--surface-2)] text-[color:var(--brand-600)]"><Mail size={15} /></span>
                    <div>
                      <p className="text-[color:var(--muted)]">Email</p>
                      <p className="font-semibold text-[color:var(--foreground)]">{profile.data.email}</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-[color:var(--surface-2)] text-[color:var(--brand-600)]"><Phone size={15} /></span>
                    <div>
                      <p className="text-[color:var(--muted)]">Mobile</p>
                      <p className="font-semibold text-[color:var(--foreground)]">{profile.data.mobile ?? "Not provided"}</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-[color:var(--surface-2)] text-[color:var(--brand-600)]"><MapPin size={15} /></span>
                    <div>
                      <p className="text-[color:var(--muted)]">Location</p>
                      <p className="font-semibold text-[color:var(--foreground)]">{profile.data.location ?? "Not assigned"}</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-[color:var(--surface-2)] text-[color:var(--brand-600)]"><CalendarDays size={15} /></span>
                    <div>
                      <p className="text-[color:var(--muted)]">Date of Birth</p>
                      <p className="font-semibold text-[color:var(--foreground)]">{profile.data.dateOfBirth ?? "Not provided"}</p>
                    </div>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
