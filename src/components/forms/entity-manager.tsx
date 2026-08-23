"use client";
import React, { useMemo, useState, useEffect } from "react";
import { Field, Form, Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { createColumnHelper } from "@tanstack/react-table";
import { AlertTriangle, Edit3, Trash2, Eye, Plus, Shield } from "lucide-react";
import { PageHeader, StatusBadge, Button, Input, Select, Textarea, Field as UIField, Grid2, Card, Tabs, cn } from "@/components/ui/index";
import { DataTable } from "@/components/tables/DataTable";
import { useEntity, useEntityList, useEntityMutations } from "@/features/crud/hooks";
import { authService } from "@/lib/auth/auth-service";
import type { Doctor, Patient, Supplier, User, UserRole } from "@/types/domain";

type Kind = "patients" | "doctors" | "suppliers" | "users";
type Entity = Patient | Doctor | Supplier | User;

interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "select" | "date" | "number" | "textarea";
  placeholder?: string;
  options?: readonly { label: string; value: string }[];
  colSpan?: 1 | 2;
  required?: boolean;
  hint?: string;
}

const patientFields: readonly FieldConfig[] = [
  { name: "name", label: "Full Name", type: "text", placeholder: "e.g. Maya Sharma", required: true },
  { name: "patientCode", label: "Patient Code", type: "text", placeholder: "e.g. PT-82910 (auto-generated if left blank)" },
  {
    name: "sex",
    label: "Gender",
    type: "select",
    required: true,
    options: [
      { label: "Select gender", value: "" },
      { label: "Female", value: "Female" },
      { label: "Male", value: "Male" },
      { label: "Other", value: "Other" },
    ],
  },
  { name: "dateOfBirth", label: "Date of Birth", type: "date", placeholder: "YYYY-MM-DD" },
  { name: "age", label: "Age", type: "number", placeholder: "e.g. 32", required: true },
  {
    name: "bloodGroup",
    label: "Blood Group",
    type: "select",
    options: [
      { label: "Select blood group (optional)", value: "" },
      { label: "A+", value: "A+" },
      { label: "A-", value: "A-" },
      { label: "B+", value: "B+" },
      { label: "B-", value: "B-" },
      { label: "AB+", value: "AB+" },
      { label: "AB-", value: "AB-" },
      { label: "O+", value: "O+" },
      { label: "O-", value: "O-" },
    ],
  },
  { name: "phone", label: "Phone Number", type: "text", placeholder: "e.g. +91 9876543210", required: true },
  { name: "email", label: "Email Address", type: "text", placeholder: "e.g. maya.sharma@example.com" },
  { name: "city", label: "City", type: "text", placeholder: "e.g. Bangalore" },
  { name: "state", label: "State", type: "text", placeholder: "e.g. Karnataka" },
  { name: "pincode", label: "Pincode", type: "text", placeholder: "e.g. 560001" },
  { name: "emergencyContact", label: "Emergency Contact Phone", type: "text", placeholder: "e.g. +91 9811122334" },
  { name: "referringDoctorId", label: "Referring Doctor Code / ID", type: "text", placeholder: "e.g. doc-01 or Dr. Menon" },
  {
    name: "status",
    label: "Patient Status",
    type: "select",
    options: [
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" },
    ],
  },
  { name: "address", label: "Residential Address", type: "textarea", placeholder: "e.g. #42, 3rd Cross, Indiranagar", colSpan: 2 },
];

const doctorFields: readonly FieldConfig[] = [
  { name: "name", label: "Doctor Full Name", type: "text", placeholder: "e.g. Dr. Rajesh Verma", required: true },
  { name: "specialty", label: "Specialty / Department", type: "text", placeholder: "e.g. Pathology, Hematology, Internal Medicine", required: true },
  {
    name: "gender",
    label: "Gender",
    type: "select",
    options: [
      { label: "Select gender (optional)", value: "" },
      { label: "Female", value: "Female" },
      { label: "Male", value: "Male" },
      { label: "Other", value: "Other" },
    ],
  },
  { name: "phone", label: "Phone Number", type: "text", placeholder: "e.g. +91 9822012345", required: true },
  { name: "email", label: "Email Address", type: "text", placeholder: "e.g. dr.verma@hospital.org", required: true },
  { name: "city", label: "City / Hospital Branch", type: "text", placeholder: "e.g. Bangalore" },
  { name: "experience", label: "Years of Experience", type: "text", placeholder: "e.g. 12 years" },
  { name: "dateOfJoining", label: "Date of Joining", type: "date", placeholder: "YYYY-MM-DD" },
  { name: "description", label: "Professional Notes & Affiliations", type: "textarea", placeholder: "e.g. Head of Diagnostic Services, MBBS MD (Pathology)", colSpan: 2 },
];

const supplierFields: readonly FieldConfig[] = [
  { name: "name", label: "Supplier / Company Name", type: "text", placeholder: "e.g. Roche Diagnostics India", required: true },
  { name: "phone", label: "Contact Phone", type: "text", placeholder: "e.g. +91 22 67890000", required: true },
  { name: "emergencyContact", label: "Support / Emergency Line", type: "text", placeholder: "e.g. +91 1800 200 4000" },
  {
    name: "country",
    label: "Country",
    type: "select",
    required: true,
    options: [
      { label: "Select country", value: "" },
      { label: "India", value: "India" },
      { label: "United States", value: "United States" },
      { label: "Germany", value: "Germany" },
      { label: "Japan", value: "Japan" },
      { label: "United Kingdom", value: "United Kingdom" },
      { label: "Other", value: "Other" },
    ],
  },
  { name: "city", label: "City", type: "text", placeholder: "e.g. Pune", required: true },
  { name: "state", label: "State / Province", type: "text", placeholder: "e.g. Maharashtra" },
  { name: "pincode", label: "Pincode / Postal Code", type: "text", placeholder: "e.g. 411001" },
  { name: "address", label: "Office Address", type: "textarea", placeholder: "e.g. Plot 14, MIDC Industrial Area", colSpan: 2 },
  { name: "description", label: "Supply Categories & Delivery Terms", type: "textarea", placeholder: "e.g. Primary vendor for hematology reagents and control serums", colSpan: 2 },
];

const userFields: readonly FieldConfig[] = [
  { name: "name", label: "Staff Full Name", type: "text", placeholder: "e.g. Priya Nair", required: true },
  { name: "email", label: "Official Email Address", type: "text", placeholder: "e.g. priya.nair@lis.local", required: true },
  {
    name: "role",
    label: "System Role",
    type: "select",
    required: true,
    options: [
      { label: "Select user role", value: "" },
      { label: "Admin - Full System Access", value: "Admin" },
      { label: "Pathologist - Sign-off & Reports", value: "Pathologist" },
      { label: "Technician - Samples & Results", value: "Technician" },
      { label: "Doctor - Clinical Review & Referrals", value: "Doctor" },
      { label: "Receptionist - Patient Registration", value: "Receptionist" },
      { label: "Billing Staff - Invoices & Payments", value: "Billing" },
    ],
  },
  {
    name: "permissions",
    label: "Permissions Scope",
    type: "select",
    required: true,
    options: [
      { label: "Select permission scope", value: "" },
      { label: "All Permissions (*)", value: "*" },
      { label: "Laboratory & Samples (samples:write, results:write)", value: "samples:write,results:write" },
      { label: "Patient Management (patients:write)", value: "patients:write" },
      { label: "Reports & Approval (reports:approve)", value: "reports:approve" },
      { label: "Billing & Operations (billing:write)", value: "billing:write" },
      { label: "Read Only (reports:read, samples:read)", value: "read:all" },
    ],
  },
  {
    name: "status",
    label: "Account Status",
    type: "select",
    options: [
      { label: "Active (Permitted)", value: "Active" },
      { label: "Inactive (Disabled)", value: "Inactive" },
    ],
  },
  { name: "mobile", label: "Mobile Number", type: "text", placeholder: "e.g. +91 98450 33445" },
  { name: "location", label: "Assigned Facility / Lab Location", type: "text", placeholder: "e.g. Main Central Laboratory, Bengaluru" },
];

const patientSchema = Yup.object({
  name: Yup.string().trim().required("Full name is required").min(2, "Name must be at least 2 characters"),
  patientCode: Yup.string().trim(),
  sex: Yup.string().required("Please select gender").oneOf(["Female", "Male", "Other"], "Invalid gender option"),
  age: Yup.number().typeError("Age must be a valid number").required("Age is required").min(0, "Age cannot be negative").max(130, "Please enter a valid age"),
  phone: Yup.string().trim().required("Phone number is required"),
  email: Yup.string().trim().email("Please enter a valid email address"),
  city: Yup.string().trim(),
  state: Yup.string().trim(),
  pincode: Yup.string().trim(),
  emergencyContact: Yup.string().trim(),
  bloodGroup: Yup.string(),
  status: Yup.string(),
  address: Yup.string().trim(),
});

const doctorSchema = Yup.object({
  name: Yup.string().trim().required("Doctor name is required").min(2, "Name must be at least 2 characters"),
  specialty: Yup.string().trim().required("Specialty is required (e.g. Pathology, Hematology)"),
  phone: Yup.string().trim().required("Phone number is required"),
  email: Yup.string().trim().email("Please enter a valid email address").required("Email is required"),
  city: Yup.string().trim(),
  gender: Yup.string(),
  experience: Yup.string().trim(),
  dateOfJoining: Yup.string(),
  description: Yup.string().trim(),
});

const supplierSchema = Yup.object({
  name: Yup.string().trim().required("Supplier company name is required").min(2, "Name must be at least 2 characters"),
  phone: Yup.string().trim().required("Contact phone is required"),
  emergencyContact: Yup.string().trim(),
  country: Yup.string().required("Please select country"),
  city: Yup.string().trim().required("City is required"),
  state: Yup.string().trim(),
  pincode: Yup.string().trim(),
  address: Yup.string().trim(),
  description: Yup.string().trim(),
});

const userSchema = Yup.object({
  name: Yup.string().trim().required("Staff name is required").min(2, "Name must be at least 2 characters"),
  email: Yup.string().trim().email("Please enter a valid email address").required("Email is required"),
  role: Yup.string().required("Please select a system role").oneOf(["Admin", "Pathologist", "Technician", "Doctor", "Receptionist", "Billing", "Other"], "Invalid role"),
  permissions: Yup.string().required("Please select permission scope"),
  status: Yup.string(),
  mobile: Yup.string().trim(),
  location: Yup.string().trim(),
});

const schemas = {
  patients: patientSchema,
  doctors: doctorSchema,
  suppliers: supplierSchema,
  users: userSchema,
};

const emptyInitialValues = {
  patients: { patientCode: "", name: "", sex: "", dateOfBirth: "", age: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", emergencyContact: "", bloodGroup: "", status: "Active" },
  doctors: { name: "", specialty: "", gender: "", phone: "", email: "", city: "", experience: "", dateOfJoining: "", description: "" },
  suppliers: { name: "", phone: "", emergencyContact: "", country: "", address: "", state: "", city: "", pincode: "", description: "" },
  users: { name: "", email: "", role: "", permissions: "", status: "Active", mobile: "", location: "" },
};

const configs = {
  patients: { singular: "Patient", fields: patientFields },
  doctors: { singular: "Doctor", fields: doctorFields },
  suppliers: { singular: "Supplier", fields: supplierFields },
  users: { singular: "User", fields: userFields },
} as const;

export function EntityManager({ kind, path }: Readonly<{ kind: Kind; path: readonly string[] }>) {
  const config = configs[kind];
  const schema = schemas[kind];
  const router = useRouter();
  const isNew = path[0] === "new";
  const id = isNew ? "" : path[0];
  const edit = path[1] === "edit";

  const [currentRole, setCurrentRole] = useState<UserRole | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const s = authService.getSession();
    if (s?.role) setCurrentRole(s.role);
  }, []);

  const isAdmin = currentRole === "Admin" || currentRole === "Administrator";

  const list = useEntityList<Entity>(kind);
  const detail = useEntity<Entity>(kind, id);
  const mutations = useEntityMutations<Entity>(kind);

  const columns = useMemo(() => {
    const h = createColumnHelper<Entity>();
    return [
      h.accessor(row => ("name" in row ? row.name : "—"), {
        id: "name",
        header: "Name",
        cell: ({ getValue }) => <span className="font-semibold text-[color:var(--foreground)]">{getValue()}</span>
      }),
      h.accessor(row => ("email" in row && row.email ? row.email : "phone" in row ? row.phone : "—"), {
        id: "contact",
        header: "Contact",
        cell: ({ getValue }) => <span className="text-[color:var(--muted)] text-xs">{getValue()}</span>
      }),
      h.accessor(row => {
        if ("role" in row && row.role) return row.role;
        if ("specialty" in row && row.specialty) return row.specialty;
        if ("city" in row && row.city) return row.city;
        if ("patientCode" in row && row.patientCode) return row.patientCode;
        return "—";
      }, {
        id: "location_role",
        header: kind === "users" ? "Role" : kind === "doctors" ? "Specialty" : kind === "patients" ? "Patient Code" : "Location",
        cell: ({ getValue }) => {
          const val = getValue();
          if (kind === "users") {
            const roleTone = val === "Admin" ? "danger" : val === "Pathologist" ? "info" : val === "Technician" ? "warning" : "success";
            return <StatusBadge tone={roleTone} size="sm">{val}</StatusBadge>;
          }
          return <span className="text-xs font-medium">{val}</span>;
        }
      }),
      h.accessor(row => ("status" in row && row.status) || (("active" in row && row.active === false) ? "Inactive" : "Active"), {
        id: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return <StatusBadge tone={val === "Inactive" ? "warning" : "success"} size="sm">{val}</StatusBadge>;
        }
      }),
      h.display({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Link href={`/${kind}/${row.original.id}`}>
              <Button size="sm" variant="ghost" leftIcon={<Eye size={13} />}>
                View
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link href={`/${kind}/${row.original.id}/edit`}>
                  <Button size="sm" variant="secondary" leftIcon={<Edit3 size={13} />}>
                    Edit
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="danger-outline" 
                  leftIcon={<Trash2 size={13} />}
                  onClick={() => setConfirmDeleteId(row.original.id)}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        )
      })
    ];
  }, [kind, isAdmin]);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    await mutations.remove.mutateAsync(confirmDeleteId);
    setConfirmDeleteId(null);
    if (id && !isNew) {
      router.push(`/${kind}`);
    }
  };

  if (!path.length) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title={config.singular + "s"} 
          description={kind === "users" ? "Manage user accounts, credentials, permissions, and role-based access." : `Manage laboratory ${kind}.`} 
          action={
            isAdmin ? (
              <Link href={`/${kind}/new`}>
                <Button variant="primary" leftIcon={<Plus size={16} />}>Add {config.singular}</Button>
              </Link>
            ) : undefined
          } 
        />

        <DataTable
          columns={columns}
          data={list.data}
          isLoading={list.isLoading}
          isError={list.isError}
          searchable
          searchPlaceholder={`Search ${kind}...`}
          emptyTitle={`No ${kind} found`}
        />

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-lg)]">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="grid size-10 place-items-center rounded-xl bg-rose-50">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[color:var(--foreground)]">Confirm Permanent Delete</h3>
                  <p className="text-xs text-[color:var(--muted)]">This action will delete the record from database.</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-[color:var(--muted)] leading-relaxed">
                Are you sure you want to permanently delete this {config.singular.toLowerCase()}? All associated records will be removed and this operation cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-2 border-t border-[color:var(--line)] pt-4">
                <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </Button>
                <Button variant="danger" loading={mutations.remove.isPending} onClick={handleDelete}>
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const record = isNew ? emptyInitialValues[kind] : detail.data;
  const editable = isNew || edit;

  if (!record && !isNew) return <p className="text-sm text-[color:var(--muted)]">Loading record…</p>;

  if (!editable && record) {
    const raw = record as Record<string, unknown>;
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader 
          title={(record as { name?: string }).name ?? config.singular} 
          description={`${config.singular} record details and history.`} 
          action={
            <div className="flex items-center gap-2">
              <Link href={`/${kind}`}>
                <Button variant="ghost">← Back to {config.singular}s</Button>
              </Link>
              {isAdmin && (
                <>
                  <Link href={`/${kind}/${id}/edit`}>
                    <Button variant="outline" leftIcon={<Edit3 size={15} />}>Edit {config.singular}</Button>
                  </Link>
                  <Button 
                    variant="danger-outline" 
                    leftIcon={<Trash2 size={15} />}
                    onClick={() => setConfirmDeleteId(id)}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          } 
        />
        
        <Card padding={false} className="overflow-hidden">
          <dl className="grid gap-px bg-[color:var(--line)] sm:grid-cols-2">
            {Object.entries(raw).filter(([key]) => key !== "id" && key !== "passwordHash").map(([key, value]) => (
              <div className="bg-[color:var(--surface)] p-4" key={key}>
                <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">{key.replace(/([A-Z])/g, " $1")}</dt>
                <dd className="mt-1 text-sm font-medium">
                  {typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Delete Confirmation Modal in Detail View */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-lg)]">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="grid size-10 place-items-center rounded-xl bg-rose-50">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[color:var(--foreground)]">Confirm Permanent Delete</h3>
                  <p className="text-xs text-[color:var(--muted)]">This action will delete the record from database.</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-[color:var(--muted)] leading-relaxed">
                Are you sure you want to permanently delete this {config.singular.toLowerCase()}?
              </p>
              <div className="mt-6 flex justify-end gap-2 border-t border-[color:var(--line)] pt-4">
                <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </Button>
                <Button variant="danger" loading={mutations.remove.isPending} onClick={handleDelete}>
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit or Create Form
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title={isNew ? `Register new ${config.singular.toLowerCase()}` : `Edit ${config.singular.toLowerCase()}`} 
        description={`Complete all required fields below. Validation is performed before saving.`} 
        action={
          <Link href={`/${kind}`}>
            <Button variant="ghost">← Back to {config.singular}s</Button>
          </Link>
        }
      />
      <Card>
        <Formik 
          initialValues={record as Record<string, unknown>} 
          validationSchema={schema} 
          enableReinitialize
          validateOnMount={false}
          validateOnChange={true}
          validateOnBlur={true}
          onSubmit={async (values) => {
            const input = { ...values };
            if (kind === "users") {
              input.initials = String(values.name ?? "").split(" ").map((part) => part[0]).join("").toUpperCase();
              input.active = values.status !== "Inactive";
            }
            if (kind === "patients" && values.age) {
              input.age = Number(values.age);
            }
            
            if (isNew) {
              await mutations.create.mutateAsync(input as never);
            } else {
              await mutations.update.mutateAsync({ id, input });
            }
            router.push(`/${kind}`);
          }}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-6">
              <Grid2>
                {config.fields.map((field) => {
                  const errorMsg = touched[field.name as keyof typeof touched] ? (errors[field.name as keyof typeof errors] as string) : undefined;
                  return (
                    <UIField 
                      key={field.name} 
                      label={field.label} 
                      name={field.name} 
                      required={field.required}
                      hint={field.hint}
                      className={field.colSpan === 2 ? "sm:col-span-2" : ""}
                      error={errorMsg}
                    >
                      {field.type === "select" ? (
                        <Field name={field.name} as={Select}>
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value} disabled={opt.value === "" && field.required}>
                              {opt.label}
                            </option>
                          ))}
                        </Field>
                      ) : field.type === "textarea" ? (
                        <Field 
                          name={field.name} 
                          as={Textarea} 
                          placeholder={field.placeholder} 
                        />
                      ) : (
                        <Field 
                          name={field.name} 
                          type={field.type} 
                          as={Input} 
                          placeholder={field.placeholder} 
                        />
                      )}
                    </UIField>
                  );
                })}
              </Grid2>
              <div className="flex gap-3 pt-4 border-t border-[color:var(--line)]">
                <Button type="submit" variant="primary" loading={isSubmitting || mutations.create.isPending || mutations.update.isPending}>
                  Save {config.singular}
                </Button>
                <Link href={`/${kind}`}>
                  <Button type="button" variant="ghost">Cancel</Button>
                </Link>
                {!isNew && isAdmin && (
                  <Button 
                    type="button" 
                    variant="danger-outline"
                    className="ml-auto"
                    onClick={() => setConfirmDeleteId(id)}
                  >
                    Delete {config.singular}
                  </Button>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
}
