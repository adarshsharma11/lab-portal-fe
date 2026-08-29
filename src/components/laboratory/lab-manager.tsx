"use client";
import React, { useMemo, useState, useEffect } from "react";
import { Field, Form, Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { createColumnHelper } from "@tanstack/react-table";
import { AlertTriangle, Edit3, Eye, Plus, Trash2, Sparkles } from "lucide-react";
import { PageHeader, StatusBadge, Button, Input, Select, Textarea, Field as UIField, Grid2, Card, cn, SearchableCombobox, ComboboxOption } from "@/components/ui/index";
import { DataTable } from "@/components/tables/DataTable";
import { ResultSection, ResultTable } from "@/components/laboratory/result-engine";
import { useCreateSample, useCreateTest, useDeleteSample, useDeleteTest, useResults, useSample, useSamples, useTest, useTests, useUpdateSample, useUpdateTest } from "@/features/laboratory/hooks";
import { useTestMasters } from "@/features/test-masters/hooks";
import { useEntityList } from "@/features/crud/hooks";
import { authService } from "@/lib/auth/auth-service";
import type { Franchise, Patient, Sample, Test, TestMaster, UserRole } from "@/types/domain";

type Kind = "samples" | "tests";
type Entity = Sample | Test;

interface FormFieldDef {
  name: string;
  label: string;
  type: "text" | "select" | "textarea" | "number" | "datetime";
  placeholder?: string;
  required?: boolean;
  hint?: string;
  colSpan?: 1 | 2;
  options?: readonly { label: string; value: string }[];
}

const sampleFields: readonly FormFieldDef[] = [
  { name: "accession", label: "Accession Number", type: "text", placeholder: "LIS-240822 (auto-generated if empty)" },
  { name: "barcode", label: "Barcode ID", type: "text", placeholder: "BC902188 (auto-generated if empty)" },
  { name: "patientId", label: "Registered Patient", type: "text", placeholder: "Search patient by name, code, phone...", required: true, hint: "Select from registered patients list" },
  {
    name: "sampleType",
    label: "Specimen Type",
    type: "select",
    required: true,
    options: [
      { label: "Select specimen type", value: "" },
      { label: "Whole Blood (EDTA/Heparin)", value: "Blood" },
      { label: "Serum", value: "Serum" },
      { label: "Plasma", value: "Plasma" },
      { label: "Urine (Clean Catch/24h)", value: "Urine" },
      { label: "Cerebrospinal Fluid (CSF)", value: "CSF" },
      { label: "Synovial / Serous Fluid", value: "Fluid" },
      { label: "Stool Sample", value: "Stool" },
      { label: "Other Biopsy / Swab", value: "Other" },
    ],
  },
  { name: "collectedAt", label: "Collection Date & Time", type: "datetime", required: true },
  {
    name: "priority",
    label: "Processing Priority",
    type: "select",
    required: true,
    options: [
      { label: "Select priority", value: "" },
      { label: "Routine (Standard TAT)", value: "Routine" },
      { label: "Urgent (Priority processing)", value: "Urgent" },
      { label: "STAT (Emergency immediate)", value: "STAT" },
    ],
  },
  {
    name: "status",
    label: "Specimen Status",
    type: "select",
    required: true,
    options: [
      { label: "Select status", value: "" },
      { label: "Collected (Phlebotomy complete)", value: "Collected" },
      { label: "Received (In Laboratory)", value: "Received" },
      { label: "Processing (On Analyzer)", value: "Processing" },
      { label: "Completed (Results Ready)", value: "Completed" },
      { label: "Rejected (Hemolyzed/Clotted)", value: "Rejected" },
    ],
  },
  { name: "notes", label: "Phlebotomy / Clinical Notes", type: "textarea", placeholder: "Fasting sample, collected without hemolysis, stored at 2-8°C", colSpan: 2 },
];

const testFields: readonly FormFieldDef[] = [
  { name: "name", label: "Test Full Name (Master Database)", type: "text", placeholder: "Search by test name (e.g. Calcium, CBC, Bilirubin)...", required: true, hint: "Search test name from database catalog", colSpan: 2 },
  { name: "code", label: "Test Code", type: "text", placeholder: "e.g. HM001, BC001, CBC", required: true, hint: "Auto-populated from test master or search by code" },
  {
    name: "department",
    label: "Laboratory Department",
    type: "select",
    required: true,
    options: [
      { label: "Select department", value: "" },
      { label: "Biochemistry", value: "Biochemistry" },
      { label: "Clinical Pathology", value: "Clinical Pathology" },
      { label: "Cytogenetics", value: "Cytogenetics" },
      { label: "Cytology", value: "Cytology" },
      { label: "Flow Cytometry", value: "Flow Cytometry" },
      { label: "Hematology", value: "Hematology" },
      { label: "Histopathology", value: "Histopathology" },
      { label: "Immunology", value: "Immunology" },
      { label: "Maternal Marker", value: "Maternal Marker" },
      { label: "Microbiology", value: "Microbiology" },
      { label: "Molecular Biology", value: "Molecular Biology" },
      { label: "OPD Package", value: "OPD Package" },
      { label: "Serology", value: "Serology" },
      { label: "Special Tests", value: "Special Tests" },
    ],
  },
  {
    name: "sampleType",
    label: "Required Specimen",
    type: "select",
    required: true,
    options: [
      { label: "Select required specimen", value: "" },
      { label: "Whole Blood (EDTA)", value: "Blood" },
      { label: "Serum", value: "Serum" },
      { label: "Plasma", value: "Plasma" },
      { label: "Random / 24hr Urine", value: "Urine" },
      { label: "Body Fluid / CSF", value: "Fluid" },
      { label: "Stool Specimen", value: "Stool" },
      { label: "Other / Swab / Biopsy", value: "Other" },
    ],
  },
  { name: "price", label: "Test Price / MRP (₹)", type: "number", placeholder: "450", required: true, hint: "Auto-filled from test master MRP/Rate" },
  { name: "turnaroundHours", label: "Standard Turnaround Time (Hours)", type: "number", placeholder: "24", required: true },
  { name: "referenceRange", label: "Default Reference Range", type: "text", placeholder: "e.g. 13.0 - 17.0 g/dL" },
  { name: "unit", label: "Measurement Unit", type: "text", placeholder: "e.g. g/dL, mg/dL, mmol/L" },
  {
    name: "status",
    label: "Catalog Status",
    type: "select",
    required: true,
    options: [
      { label: "Active (Available for order)", value: "Active" },
      { label: "Inactive (Discontinued)", value: "Inactive" },
    ],
  },
];

const sampleSchema = Yup.object({
  patientId: Yup.string().trim().required("Registered patient selection is required"),
  sampleType: Yup.string().required("Please select specimen type").oneOf(["Blood", "Serum", "Plasma", "Urine", "CSF", "Fluid", "Stool", "Other"], "Invalid specimen type"),
  accession: Yup.string().trim(),
  barcode: Yup.string().trim(),
  collectedAt: Yup.string().required("Collection date and time is required"),
  priority: Yup.string().required("Please select priority level").oneOf(["Routine", "Urgent", "STAT"], "Invalid priority"),
  status: Yup.string().required("Please select initial sample status").oneOf(["Collected", "Received", "Processing", "Completed", "Rejected"], "Invalid status"),
  notes: Yup.string().trim(),
});

const testSchema = Yup.object({
  code: Yup.string().trim().required("Test code is required").min(2, "Test code must be at least 2 characters"),
  name: Yup.string().trim().required("Test full name is required from catalog").min(2, "Name must be at least 2 characters"),
  department: Yup.string().required("Please select a department"),
  sampleType: Yup.string().required("Please select required specimen type"),
  price: Yup.number().typeError("Price must be a valid number").required("Price is required").min(0, "Price cannot be negative"),
  turnaroundHours: Yup.number().typeError("Turnaround time must be a number").required("Turnaround time is required").min(1, "Turnaround time must be at least 1 hour"),
  referenceRange: Yup.string().trim(),
  unit: Yup.string().trim(),
  status: Yup.string().required("Please select catalog status").oneOf(["Active", "Inactive"], "Invalid status"),
});

export function LabManager({ kind, path }: Readonly<{ kind: Kind; path: readonly string[] }>) {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const s = authService.getSession();
    if (s?.role) setCurrentRole(s.role);
  }, []);

  const isAdmin = currentRole === "Admin" || currentRole === "Administrator";
  const franchisesList = useEntityList<Franchise>("franchises");
  const patientsList = useEntityList<Patient>("patients");
  const testMastersQuery = useTestMasters("", undefined, 500);

  const franchiseOptions = useMemo(() => {
    const franchises = (franchisesList.data ?? []) as Franchise[];
    return [
      { label: "Select Franchise (or leave empty for Central Lab)...", value: "" },
      ...franchises.map((f) => ({
        label: `${f.name} (${f.code || f.city || "Branch"})`,
        value: f.id,
      })),
      { label: "+ Other / Add New Franchise", value: "__add_franchise__" },
    ];
  }, [franchisesList.data]);

  const patientComboboxOptions = useMemo<ComboboxOption[]>(() => {
    const patients = (patientsList.data ?? []) as Patient[];
    return patients.map((p) => ({
      value: p.patientCode || p.id,
      label: p.name,
      secondary: `Code: ${p.patientCode || p.id} · Age: ${p.age} · ${p.sex || ""}`,
      badge: p.phone,
      extra: p,
    }));
  }, [patientsList.data]);

  const testMasterNameOptions = useMemo<ComboboxOption[]>(() => {
    const tests = testMastersQuery.data ?? [];
    return tests.map((t) => ({
      value: t.name,
      label: t.name,
      secondary: `Code: ${t.code} · Rate: ₹${t.rate} · MRP: ₹${t.mrp}`,
      badge: t.department,
      extra: t,
    }));
  }, [testMastersQuery.data]);

  const testMasterCodeOptions = useMemo<ComboboxOption[]>(() => {
    const tests = testMastersQuery.data ?? [];
    return tests.map((t) => ({
      value: t.code,
      label: t.code,
      secondary: t.name,
      badge: `₹${t.mrp || t.rate}`,
      extra: t,
    }));
  }, [testMastersQuery.data]);

  const sampleList = useSamples();
  const testList = useTests();
  const sampleDetail = useSample(kind === "samples" && path[0] && path[0] !== "new" ? path[0] : "");
  const testDetail = useTest(kind === "tests" && path[0] && path[0] !== "new" ? path[0] : "");
  
  const createSample = useCreateSample();
  const updateSample = useUpdateSample();
  const deleteSample = useDeleteSample();

  const createTest = useCreateTest();
  const updateTest = useUpdateTest();
  const deleteTest = useDeleteTest();

  const results = useResults();
  
  const isSample = kind === "samples";
  const list = isSample ? sampleList : testList;
  const detail = isSample ? sampleDetail : testDetail;
  const isNew = path[0] === "new";
  const id = isNew ? "" : path[0];
  const edit = path[1] === "edit";

  const columns = useMemo(() => {
    const h = createColumnHelper<Entity>();
    return [
      h.accessor(row => ("accession" in row ? row.accession : row.name), {
        id: "id_name",
        header: isSample ? "Sample ID / Barcode" : "Test Name",
        cell: ({ getValue }) => <span className="font-semibold text-[color:var(--foreground)]">{getValue()}</span>
      }),
      h.accessor(row => ("patientId" in row ? row.patientId : row.department), {
        id: "patient_dept",
        header: isSample ? "Patient" : "Department",
        cell: ({ getValue }) => <span className="text-[color:var(--muted)]">{getValue()}</span>
      }),
      ...(!isSample ? [
        h.accessor((row: any) => `₹${row.price || 0}`, {
          id: "price",
          header: "Price / MRP",
          cell: ({ getValue }) => <span className="font-semibold text-[color:var(--foreground)]">{getValue()}</span>
        })
      ] : []),
      ...(isAdmin
        ? [
            h.accessor((row: any) => row.franchise?.name || row.franchise?.code || "Central Lab", {
              id: "franchise",
              header: "Franchise",
              cell: ({ getValue }) => (
                <span className="inline-flex items-center rounded-md bg-[#e8f4f7] px-2 py-0.5 text-xs font-semibold text-[#176b87]">
                  {getValue()}
                </span>
              ),
            }),
          ]
        : []),
      h.accessor(row => row.status ?? "Active", {
        id: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const val = getValue();
          const tone = val === "Completed" || val === "Active" ? "success" : val === "Processing" ? "warning" : val === "Rejected" ? "danger" : "neutral";
          return <StatusBadge tone={tone} size="sm">{val}</StatusBadge>;
        }
      }),
      h.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
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
  }, [isSample, kind, isAdmin]);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    if (isSample) {
      await deleteSample.mutateAsync(confirmDeleteId);
    } else {
      await deleteTest.mutateAsync(confirmDeleteId);
    }
    setConfirmDeleteId(null);
    if (id && !isNew) {
      router.push(`/${kind}`);
    }
  };

  if (!path.length) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title={isSample ? "Samples" : "Tests Catalog"} 
          description={isSample ? "Track specimen collection, receipt, and laboratory processing." : "Manage catalogued and assigned laboratory diagnostic tests from Master Database."} 
          action={
            <Link href={`/${kind}/new`}>
              <Button variant="primary" leftIcon={<Plus size={16} />}>New {isSample ? "sample" : "test"}</Button>
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
                  <p className="text-xs text-[color:var(--muted)]">This will delete the {isSample ? "sample" : "test"} from the database.</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-[color:var(--muted)] leading-relaxed">
                Are you sure you want to delete this {isSample ? "sample record" : "test catalog entry"}? This action is permanent and cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-2 border-t border-[color:var(--line)] pt-4">
                <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  loading={isSample ? deleteSample.isPending : deleteTest.isPending} 
                  onClick={handleDelete}
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (path[0] === "new" || edit) {
    const rawRecord = detail.data as Record<string, any> | undefined;
    const initialValues = isNew
      ? isSample
        ? { accession: "", barcode: "", patientId: "", sampleType: "", collectedAt: new Date().toISOString().slice(0, 16), priority: "", status: "", notes: "", franchiseId: "" }
        : { code: "", name: "", department: "", sampleType: "", price: "", referenceRange: "", unit: "", turnaroundHours: "24", status: "Active", franchiseId: "" }
      : isSample
      ? {
          accession: rawRecord?.accession ?? "",
          barcode: rawRecord?.barcode ?? "",
          patientId: rawRecord?.patientId ?? "",
          sampleType: rawRecord?.sampleType ?? "",
          collectedAt: rawRecord?.collectedAt ? new Date(rawRecord.collectedAt).toISOString().slice(0, 16) : "",
          priority: rawRecord?.priority ?? "",
          status: rawRecord?.status ?? "",
          notes: rawRecord?.notes ?? "",
          franchiseId: rawRecord?.franchiseId ?? "",
        }
      : {
          code: rawRecord?.code ?? "",
          name: rawRecord?.name ?? "",
          department: rawRecord?.department ?? "",
          sampleType: rawRecord?.sampleType ?? "",
          price: rawRecord?.price ?? "",
          referenceRange: rawRecord?.referenceRange ?? "",
          unit: rawRecord?.unit ?? "",
          turnaroundHours: rawRecord?.turnaroundHours ?? "24",
          status: rawRecord?.status ?? "Active",
          franchiseId: rawRecord?.franchiseId ?? "",
        };

    const baseFields = isSample ? sampleFields : testFields;
    const fields: FormFieldDef[] = isAdmin
      ? [
          {
            name: "franchiseId",
            label: "Assign to Franchise",
            type: "select",
            options: franchiseOptions,
            hint: "Assign this record to a Franchise branch.",
            colSpan: 2,
          },
          ...baseFields,
        ]
      : [...baseFields];

    const schema = isSample ? sampleSchema : testSchema;

    const submit = async (values: typeof initialValues) => {
      if (values.franchiseId === "__add_franchise__") {
        router.push("/franchises/new");
        return;
      }

      if (isSample) {
        const payload = {
          ...values,
          accession: values.accession || `LIS-${Date.now().toString().slice(-6)}`,
          barcode: values.barcode || `BC${Date.now()}`,
          collectedAt: values.collectedAt || new Date().toISOString(),
          franchiseId: values.franchiseId || undefined,
        };
        if (isNew) {
          await createSample.mutateAsync(payload as Omit<Sample, "id">);
        } else {
          await updateSample.mutateAsync({ id, input: payload });
        }
      } else {
        const payload = {
          ...values,
          price: Number(values.price) || 0,
          turnaroundHours: Number(values.turnaroundHours) || 24,
          franchiseId: values.franchiseId || undefined,
        };
        if (isNew) {
          await createTest.mutateAsync(payload as Omit<Test, "id">);
        } else {
          await updateTest.mutateAsync({ id, input: payload });
        }
      }
      router.push(`/${kind}`);
    };

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader 
          title={isNew ? `New ${isSample ? "sample" : "test"}` : `Edit ${isSample ? "sample" : "test"}`} 
          description={
            !isSample 
              ? "Select any test from the Master Database catalog. Details, codes, and rates auto-populate dynamically."
              : "Complete the required fields below. Select registered patient to link diagnostic sample."
          }
          action={
            <Link href={`/${kind}`}>
              <Button variant="ghost">← Back to {isSample ? "samples" : "tests"}</Button>
            </Link>
          }
        />

        {!isSample && (
          <div className="flex items-center gap-2.5 rounded-[var(--radius)] border border-[#176b87]/20 bg-[#e8f4f7]/60 p-3 text-xs text-[#176b87]">
            <Sparkles size={16} className="shrink-0" />
            <span>
              <strong>Master Data Connected:</strong> Type test full name or code to autocomplete and auto-fetch official rates, MRP, and department from the database.
            </span>
          </div>
        )}

        <Card>
          <Formik 
            initialValues={initialValues} 
            validationSchema={schema}
            enableReinitialize
            validateOnMount={false}
            validateOnChange={true}
            validateOnBlur={true}
            onSubmit={submit}
          >
            {({ errors, touched, values, isSubmitting, setFieldValue }) => (
              <Form className="space-y-6">
                <Grid2>
                  {fields.map((field) => {
                    const errorMsg = touched[field.name as keyof typeof touched] ? (errors[field.name as keyof typeof errors] as string) : undefined;
                    
                    // 1. Patient selection for Sample Form (Searchable Autocomplete)
                    if (isSample && field.name === "patientId") {
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
                          <SearchableCombobox
                            options={patientComboboxOptions}
                            value={values.patientId}
                            onChange={(val) => setFieldValue("patientId", val)}
                            placeholder="Select registered patient (type name, code, phone)..."
                            searchPlaceholder="Search by name, patient code, phone..."
                            loading={patientsList.isLoading}
                          />
                        </UIField>
                      );
                    }

                    // 2. Test Full Name selection from Master Database (Searchable Autocomplete)
                    if (!isSample && field.name === "name") {
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
                          <SearchableCombobox
                            options={testMasterNameOptions}
                            value={values.name}
                            onChange={(val, opt) => {
                              setFieldValue("name", val);
                              if (opt?.extra) {
                                const tm = opt.extra as TestMaster;
                                setFieldValue("code", tm.code || "");
                                setFieldValue("department", tm.department || "Biochemistry");
                                setFieldValue("price", String(tm.mrp || tm.rate || 0));
                                if (tm.sampleType) setFieldValue("sampleType", tm.sampleType);
                                if (tm.unit) setFieldValue("unit", tm.unit);
                                if (tm.referenceRange) setFieldValue("referenceRange", tm.referenceRange);
                              }
                            }}
                            placeholder="Search & select test name from database (e.g. Calcium, CBC, Bilirubin)..."
                            searchPlaceholder="Type test name (e.g. Calcium, CBC, Blood Glucose)..."
                            loading={testMastersQuery.isLoading}
                          />
                        </UIField>
                      );
                    }

                    // 3. Test Code selection from Master Database (Searchable Autocomplete)
                    if (!isSample && field.name === "code") {
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
                          <SearchableCombobox
                            options={testMasterCodeOptions}
                            value={values.code}
                            onChange={(val, opt) => {
                              setFieldValue("code", val);
                              if (opt?.extra) {
                                const tm = opt.extra as TestMaster;
                                setFieldValue("name", tm.name || "");
                                setFieldValue("department", tm.department || "Biochemistry");
                                setFieldValue("price", String(tm.mrp || tm.rate || 0));
                                if (tm.sampleType) setFieldValue("sampleType", tm.sampleType);
                                if (tm.unit) setFieldValue("unit", tm.unit);
                                if (tm.referenceRange) setFieldValue("referenceRange", tm.referenceRange);
                              }
                            }}
                            placeholder="Search or enter test code (e.g. BC069, HM001)..."
                            searchPlaceholder="Type code (e.g. HM001, BC001)..."
                            loading={testMastersQuery.isLoading}
                          />
                        </UIField>
                      );
                    }

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
                          <Field 
                            name={field.name} 
                            as={Select}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                              const selected = e.target.value;
                              if (field.name === "franchiseId" && selected === "__add_franchise__") {
                                router.push("/franchises/new");
                                return;
                              }
                              setFieldValue(field.name, selected);
                            }}
                          >
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value} disabled={opt.value === "" && field.required}>
                                {opt.label}
                              </option>
                            ))}
                          </Field>
                        ) : field.type === "textarea" ? (
                          <Field name={field.name} as={Textarea} placeholder={field.placeholder} />
                        ) : field.type === "datetime" ? (
                          <Field name={field.name} type="datetime-local" as={Input} />
                        ) : (
                          <Field name={field.name} type={field.type} as={Input} placeholder={field.placeholder} />
                        )}
                      </UIField>
                    );
                  })}
                </Grid2>
                <div className="flex gap-3 pt-4 border-t border-[color:var(--line)]">
                  <Button type="submit" variant="primary" loading={isSubmitting || createSample.isPending || createTest.isPending || updateSample.isPending || updateTest.isPending}>
                    Save {isSample ? "Sample" : "Test"}
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
                      Delete {isSample ? "Sample" : "Test"}
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

  const item = detail.data;
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader 
        title={item && ("accession" in item ? item.accession : item.name) || "Loading..."} 
        description="Linked laboratory diagnostic record."
        action={
          <div className="flex items-center gap-2">
            <Link href={`/${kind}`}>
              <Button variant="ghost">← Back to {isSample ? "samples" : "tests"}</Button>
            </Link>
            {isAdmin && (
              <>
                <Link href={`/${kind}/${id}/edit`}>
                  <Button variant="outline" leftIcon={<Edit3 size={15} />}>Edit {isSample ? "Sample" : "Test"}</Button>
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
      {item && (
        <Card padding={false} className="overflow-hidden">
          <dl className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[color:var(--line)]">
            {Object.entries(item).filter(([key]) => key !== "id").map(([key, value], i) => (
              <div className={cn("p-4", i > 1 && "sm:border-t border-[color:var(--line)]")} key={key}>
                <dt className="text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">{key.replace(/([A-Z])/g, " $1")}</dt>
                <dd className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">{typeof value === "object" ? JSON.stringify(value) : String(value || "—")}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}
      {!isSample && (
        <div className="mt-8">
          <ResultSection title="Results">
            <ResultTable results={(results.data ?? []).filter((result) => result.testId === path[0])} />
          </ResultSection>
        </div>
      )}

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
                <p className="text-xs text-[color:var(--muted)]">This will delete the record from database.</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-[color:var(--muted)] leading-relaxed">
              Are you sure you want to permanently delete this {isSample ? "sample" : "test"}?
            </p>
            <div className="mt-6 flex justify-end gap-2 border-t border-[color:var(--line)] pt-4">
              <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                loading={isSample ? deleteSample.isPending : deleteTest.isPending} 
                onClick={handleDelete}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
