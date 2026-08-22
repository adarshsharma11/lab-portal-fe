"use client";
import React, { useMemo } from "react";
import { Field, Form, Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { createColumnHelper } from "@tanstack/react-table";
import { PageHeader, StatusBadge, Button, Input, Textarea, Field as UIField, Grid2, Card, Tabs, cn } from "@/components/ui/index";
import { DataTable } from "@/components/tables/DataTable";
import { useEntity, useEntityList, useEntityMutations } from "@/features/crud/hooks";
import type { Doctor, Patient, Supplier, User } from "@/types/domain";

type Kind = "patients" | "doctors" | "suppliers" | "users";
type Entity = Patient | Doctor | Supplier | User;

const configs = {
  patients: {
    singular: "Patient",
    fields: ["patientCode", "name", "sex", "dateOfBirth", "phone", "email", "address", "city", "state", "pincode", "emergencyContact", "bloodGroup"],
    initial: { patientCode: "PT-", name: "", sex: "Female", dateOfBirth: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", emergencyContact: "", bloodGroup: "", age: 0, createdAt: "2026-08-22", status: "Active" },
  },
  doctors: {
    singular: "Doctor",
    fields: ["name", "specialty", "gender", "phone", "email", "city", "experience", "dateOfJoining", "description"],
    initial: { name: "", specialty: "", gender: "", phone: "", email: "", city: "", experience: "", dateOfJoining: "", description: "" },
  },
  suppliers: {
    singular: "Supplier",
    fields: ["name", "phone", "emergencyContact", "country", "address", "state", "city", "pincode", "description"],
    initial: { name: "", phone: "", emergencyContact: "", country: "India", address: "", state: "", city: "", pincode: "", description: "" },
  },
  users: {
    singular: "User",
    fields: ["name", "email", "role", "permissions"],
    initial: { name: "", email: "", role: "Technician", permissions: "samples:write", initials: "", active: true },
  }
} as const;

const schema = Yup.object({
  name: Yup.string().required("Required"),
  phone: Yup.string(),
  email: Yup.string().email("Invalid email"),
  pincode: Yup.string().matches(/^\d*$/, "Pincode must be numeric"),
  patientCode: Yup.string(),
  role: Yup.string(),
  specialty: Yup.string()
});

export function EntityManager({ kind, path }: Readonly<{ kind: Kind; path: readonly string[] }>) {
  const config = configs[kind];
  const router = useRouter();
  const isNew = path[0] === "new";
  const id = isNew ? "" : path[0];
  const edit = path[1] === "edit";

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
      h.accessor(row => ("email" in row ? row.email : "phone" in row ? row.phone : ""), {
        id: "contact",
        header: "Contact",
        cell: ({ getValue }) => <span className="text-[color:var(--muted)]">{getValue()}</span>
      }),
      h.accessor(row => ("role" in row ? row.role : "city" in row ? row.city : ""), {
        id: "location_role",
        header: "Location / Role",
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
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Link href={`/${kind}/${row.original.id}`}>
              <Button size="sm" variant="ghost">View</Button>
            </Link>
          </div>
        )
      })
    ];
  }, [kind]);

  if (!path.length) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title={config.singular + "s"} 
          description={`Manage laboratory ${kind}.`} 
          action={
            <Link href={`/${kind}/new`}>
              <Button variant="primary">Add {config.singular}</Button>
            </Link>
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
      </div>
    );
  }

  const record = isNew ? config.initial : detail.data;
  const editable = isNew || edit;

  if (!record) return <p className="text-sm text-[color:var(--muted)]">Loading record…</p>;

  if (!editable) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader 
          title={(record as { name?: string }).name ?? config.singular} 
          description={`${config.singular} record and connected laboratory history.`} 
          action={
            <Link href={`/${kind}/${id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
          } 
        />
        
        {kind === "patients" && (
          <Tabs
            active="overview"
            onChange={() => {}}
            tabs={[
              { key: "overview", label: "Overview" },
              { key: "samples", label: "Samples" },
              { key: "tests", label: "Tests" },
              { key: "reports", label: "Reports" },
              { key: "billing", label: "Billing" },
              { key: "history", label: "History" }
            ]}
          />
        )}
        
        <Card padding={false} className="overflow-hidden">
          <dl className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[color:var(--line)]">
            {Object.entries(record).filter(([key]) => key !== "id").map(([key, value], i) => (
              <div className={cn("p-4", i > 1 && "sm:border-t border-[color:var(--line)]")} key={key}>
                <dt className="text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">{key.replace(/([A-Z])/g, " $1")}</dt>
                <dd className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">{Array.isArray(value) ? value.join(", ") : String(value || "—")}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title={`${isNew ? "New" : "Edit"} ${config.singular}`} 
        description="Complete the required information and save the record." 
      />
      <Card>
        <Formik 
          initialValues={record as Record<string, unknown>} 
          validationSchema={schema} 
          enableReinitialize
          onSubmit={async (values) => {
            const input = { ...values };
            if (kind === "users") input.initials = String(values.name ?? "").split(" ").map((part) => part[0]).join("");
            if (kind === "patients") input.age = 30; // mock calculation
            
            if (isNew) {
              await mutations.create.mutateAsync(input as never);
            } else {
              await mutations.update.mutateAsync({ id, input });
            }
            router.push(`/${kind}`);
          }}
        >
          {({ errors, touched }) => (
            <Form className="space-y-6">
              <Grid2>
                {config.fields.map((field) => (
                  <UIField 
                    key={field} 
                    label={field.replace(/([A-Z])/g, " $1")} 
                    name={field} 
                    className={field === "address" || field === "description" || field === "permissions" ? "sm:col-span-2" : ""}
                    error={touched[field] ? errors[field] as string : undefined}
                  >
                    <Field 
                      name={field} 
                      as={field === "description" || field === "address" ? Textarea : Input} 
                    />
                  </UIField>
                ))}
              </Grid2>
              <div className="flex gap-3 pt-4 border-t border-[color:var(--line)]">
                <Button type="submit" variant="primary" loading={mutations.create.isPending || mutations.update.isPending}>
                  Save {config.singular}
                </Button>
                {!isNew && (
                  <Button 
                    type="button" 
                    variant="danger-outline"
                    onClick={() => mutations.remove.mutate(id, { onSuccess: () => router.push(`/${kind}`) })}
                  >
                    Delete
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
