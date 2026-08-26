"use client";
import React, { useMemo, useState } from "react";
import { Form, Formik, Field } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Download, Edit3, Eye, Mail, MessageCircle, Plus, Printer, QrCode, Share2, Trash2 } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { PageHeader, StatusBadge, Button, Input, Select, Textarea, Field as UIField, Grid2, Card, cn } from "@/components/ui/index";
import { DataTable } from "@/components/tables/DataTable";
import { ResultTable } from "@/components/laboratory/result-engine";
import { useResults } from "@/features/laboratory/hooks";
import { useCreateTemplate, useDeleteTemplate, useReport, useReportActions, useReports, useReportTemplate, useReportTemplates, useUpdateTemplate } from "@/features/reports/hooks";
import type { Report, ReportTemplate } from "@/types/domain";

const templateSchema = Yup.object({
  name: Yup.string().trim().required("Template name is required (. Hematology Complete Blood Count)").min(2, "Template name must be at least 2 characters"),
  department: Yup.string().required("Please select a laboratory department"),
  tests: Yup.string().trim().required("Included test codes are required (. CBC, ESR, Hemoglobin)"),
  header: Yup.string().trim().required("Report header title is required (. BLDignostics Clinical Laboratory)"),
  footer: Yup.string().trim().required("Report footer disclaimer is required"),
  signatory: Yup.string().trim().required("Signatory pathologist name is required (. Dr. Ananya Rao, MD)"),
  referenceRanges: Yup.string().trim(),
  notes: Yup.string().trim(),
});

export function ReportWorkflow({ path }: Readonly<{ path: readonly string[] }>) {
  const router = useRouter();
  const reports = useReports();
  const templates = useReportTemplates();
  const report = useReport(path[0] && path[0] !== "new" && path[0] !== "templates" ? path[0] : "");
  const results = useResults();
  const actions = useReportActions();
  
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);

  const isTemplateFlow = path[0] === "templates";
  const templateId = isTemplateFlow && path[1] && path[1] !== "new" ? path[1] : "";
  const isTemplateEdit = isTemplateFlow && path[2] === "edit";
  const isTemplateNew = isTemplateFlow && path[1] === "new";
  const templateDetail = useReportTemplate(templateId);

  const reportColumns = useMemo(() => {
    const h = createColumnHelper<Report>();
    return [
      h.accessor(row => row.patientId === "pat-01" ? "Maya Srinivasan" : row.patientId, {
        id: "patient",
        header: "Patient",
        cell: ({ getValue }) => <span className="font-semibold text-[color:var(--foreground)]">{getValue()}</span>
      }),
      h.accessor("sampleId", {
        header: "Sample ID",
        cell: ({ getValue }) => <span className="text-[color:var(--muted)] font-mono text-xs">{getValue()}</span>
      }),
      h.accessor(row => row.testIds.join(", "), {
        id: "tests",
        header: "Tests"
      }),
      h.accessor("department", {
        header: "Department",
        cell: ({ getValue }) => <span className="text-[color:var(--muted)]">{getValue()}</span>
      }),
      h.accessor("priority", {
        header: "Priority"
      }),
      h.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const val = getValue();
          return <StatusBadge tone={val === "Approved" ? "success" : "warning"} size="sm">{val}</StatusBadge>;
        }
      }),
      h.accessor(row => row.createdAt.slice(0, 10), {
        id: "created",
        header: "Created",
        cell: ({ getValue }) => <span className="text-[color:var(--muted)]">{getValue()}</span>
      }),
      h.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Link href={`/reports/${row.original.id}`}>
              <Button size="sm" variant="ghost">Review</Button>
            </Link>
          </div>
        )
      })
    ];
  }, []);

  const templateColumns = useMemo(() => {
    const h = createColumnHelper<ReportTemplate>();
    return [
      h.accessor("name", {
        header: "Template Name",
        cell: ({ getValue }) => <span className="font-semibold text-[color:var(--foreground)]">{getValue()}</span>
      }),
      h.accessor("department", {
        header: "Department",
        cell: ({ getValue }) => <span className="text-xs font-medium">{getValue()}</span>
      }),
      h.accessor(row => (Array.isArray(row.tests) ? row.tests.join(", ") : String(row.tests || "—")), {
        id: "tests",
        header: "Included Tests",
        cell: ({ getValue }) => <span className="text-xs text-[color:var(--muted)]">{getValue()}</span>
      }),
      h.accessor("signatory", {
        header: "Signatory",
        cell: ({ getValue }) => <span className="text-xs text-[color:var(--muted)]">{getValue()}</span>
      }),
      h.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <Link href={`/reports/templates/${row.original.id}`}>
              <Button size="sm" variant="ghost" leftIcon={<Eye size={13} />}>
                View
              </Button>
            </Link>
            <Link href={`/reports/templates/${row.original.id}/edit`}>
              <Button size="sm" variant="secondary" leftIcon={<Edit3 size={13} />}>
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="danger-outline"
              leftIcon={<Trash2 size={13} />}
              onClick={() => setConfirmDeleteTemplateId(row.original.id)}
            >
              Delete
            </Button>
          </div>
        )
      })
    ];
  }, []);

  const handleDeleteTemplate = async () => {
    if (!confirmDeleteTemplateId) return;
    await deleteTemplate.mutateAsync(confirmDeleteTemplateId);
    setConfirmDeleteTemplateId(null);
    if (templateId) {
      router.push("/reports/templates");
    }
  };

  if (!path.length || path[0] === "pending") {
    const isPending = path[0] === "pending";
    const filteredData = (reports.data ?? []).filter(item => !isPending || item.status === "Pending Review");

    return (
      <div className="space-y-6">
        <PageHeader
          title={isPending ? "Pending reports" : "Reports"}
          description="Review, approve, and release verified pathology reports."
          action={
            <Link href="/reports/templates">
              <Button variant="outline">Templates</Button>
            </Link>
          }
        />
        <DataTable
          columns={reportColumns}
          data={filteredData}
          isLoading={reports.isLoading}
          isError={reports.isError}
          searchable
          searchPlaceholder="Search reports..."
        />
      </div>
    );
  }

  // Template Flow (/reports/templates/...)
  if (isTemplateFlow) {
    if (isTemplateNew || isTemplateEdit) {
      const existing = templateDetail.data;
      const initial = {
        name: existing?.name ?? "",
        department: existing?.department ?? "",
        tests: Array.isArray(existing?.tests) ? existing.tests.join(", ") : (existing?.tests ?? ""),
        header: existing?.header ?? "BLDignostics LIMS",
        footer: existing?.footer ?? "This is a computer-generated medical report verified by authorized pathologists.",
        referenceRanges: existing?.referenceRanges ?? "",
        notes: existing?.notes ?? "",
        signatory: existing?.signatory ?? "",
        active: existing?.active ?? true,
      };

      return (
        <div className="space-y-6 max-w-4xl mx-auto">
          <PageHeader
            title={isTemplateNew ? "New report template" : "Edit report template"}
            description="Configure reusable departmental report layout, test inclusions, and signatory settings."
            action={
              <Link href="/reports/templates">
                <Button variant="ghost">← Back to templates</Button>
              </Link>
            }
          />
          <Card>
            <Formik
              initialValues={initial}
              validationSchema={templateSchema}
              enableReinitialize
              validateOnMount={false}
              validateOnChange={true}
              validateOnBlur={true}
              onSubmit={async (values) => {
                const rawTests = values.tests;
                const testList = Array.isArray(rawTests)
                  ? (rawTests as string[])
                  : typeof rawTests === "string"
                  ? rawTests.split(",").map((t: string) => t.trim()).filter(Boolean)
                  : [];
                const payload = {
                  ...values,
                  tests: testList,
                };
                if (isTemplateNew) {
                  await createTemplate.mutateAsync(payload);
                } else {
                  await updateTemplate.mutateAsync({ id: templateId, input: payload });
                }
                router.push("/reports/templates");
              }}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-6">
                  <Grid2>
                    <UIField label="Template Name" name="name" required error={touched.name ? errors.name : undefined}>
                      <Field name="name" as={Input} placeholder="Routine Hematology & Differential Report" />
                    </UIField>
                    <UIField label="Department" name="department" required error={touched.department ? errors.department : undefined}>
                      <Field name="department" as={Select}>
                        <option value="" disabled>Select department</option>
                        {["Hematology", "Biochemistry", "Microbiology", "Immunology", "Pathology", "Histopathology", "Urine Analysis", "Electrolytes", "Other"].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </Field>
                    </UIField>
                    <UIField label="Included Test Codes (comma separated)" name="tests" required error={touched.tests ? errors.tests : undefined} hint=". CBC, ESR, WBC">
                      <Field name="tests" as={Input} placeholder="CBC, ESR, Hemoglobin" />
                    </UIField>
                    <UIField label="Authorized Signatory Pathologist" name="signatory" required error={touched.signatory ? errors.signatory : undefined}>
                      <Field name="signatory" as={Input} placeholder="Dr. Ananya Rao, MD (Pathology)" />
                    </UIField>
                    <UIField label="Report Header Title" name="header" required error={touched.header ? errors.header : undefined}>
                      <Field name="header" as={Input} placeholder="BLDignostics Clinical Laboratory" />
                    </UIField>
                    <UIField label="Report Footer / Disclaimer" name="footer" required error={touched.footer ? errors.footer : undefined}>
                      <Field name="footer" as={Input} placeholder="Electronic validated diagnostic laboratory report" />
                    </UIField>
                    <UIField label="Default Reference Range Notes" name="referenceRanges" className="sm:col-span-2">
                      <Field name="referenceRanges" as={Textarea} placeholder="Standard reference values based on adult male & female reference populations." />
                    </UIField>
                    <UIField label="Standard Report Notes / Instructions" name="notes" className="sm:col-span-2">
                      <Field name="notes" as={Textarea} placeholder="Clinical correlation is recommended. Values exceeding reference limits are flagged." />
                    </UIField>
                  </Grid2>
                  <div className="flex gap-3 pt-4 border-t border-[color:var(--line)]">
                    <Button type="submit" variant="primary" loading={isSubmitting || createTemplate.isPending || updateTemplate.isPending}>
                      {isTemplateNew ? "Save template" : "Update template"}
                    </Button>
                    <Link href="/reports/templates">
                      <Button type="button" variant="ghost">Cancel</Button>
                    </Link>
                  </div>
                </Form>
              )}
            </Formik>
          </Card>
        </div>
      );
    }

    if (templateId && !isTemplateEdit) {
      const tmpl = templateDetail.data;
      if (!tmpl) return <p className="text-sm text-[color:var(--muted)]">Loading template…</p>;

      return (
        <div className="space-y-6 max-w-4xl mx-auto">
          <PageHeader
            title={tmpl.name}
            description="Report layout specification and signature profile."
            action={
              <div className="flex items-center gap-2">
                <Link href="/reports/templates">
                  <Button variant="ghost">← Back to templates</Button>
                </Link>
                <Link href={`/reports/templates/${tmpl.id}/edit`}>
                  <Button variant="outline" leftIcon={<Edit3 size={15} />}>Edit Template</Button>
                </Link>
                <Button
                  variant="danger-outline"
                  leftIcon={<Trash2 size={15} />}
                  onClick={() => setConfirmDeleteTemplateId(tmpl.id)}
                >
                  Delete
                </Button>
              </div>
            }
          />
          <Card padding={false} className="overflow-hidden">
            <dl className="grid gap-px bg-[color:var(--line)] sm:grid-cols-2">
              <div className="bg-[color:var(--surface)] p-4">
                <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">Department</dt>
                <dd className="mt-1 text-sm font-medium">{tmpl.department}</dd>
              </div>
              <div className="bg-[color:var(--surface)] p-4">
                <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">Signatory</dt>
                <dd className="mt-1 text-sm font-medium">{tmpl.signatory}</dd>
              </div>
              <div className="bg-[color:var(--surface)] p-4 sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">Included Test Codes</dt>
                <dd className="mt-1 text-sm font-mono">{Array.isArray(tmpl.tests) ? tmpl.tests.join(", ") : String(tmpl.tests)}</dd>
              </div>
              <div className="bg-[color:var(--surface)] p-4">
                <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">Header Title</dt>
                <dd className="mt-1 text-sm font-medium">{tmpl.header}</dd>
              </div>
              <div className="bg-[color:var(--surface)] p-4">
                <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">Footer Disclaimer</dt>
                <dd className="mt-1 text-sm font-medium">{tmpl.footer}</dd>
              </div>
              {tmpl.referenceRanges && (
                <div className="bg-[color:var(--surface)] p-4 sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">Reference Ranges</dt>
                  <dd className="mt-1 text-sm font-medium">{tmpl.referenceRanges}</dd>
                </div>
              )}
              {tmpl.notes && (
                <div className="bg-[color:var(--surface)] p-4 sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">Report Notes</dt>
                  <dd className="mt-1 text-sm font-medium">{tmpl.notes}</dd>
                </div>
              )}
            </dl>
          </Card>

          {confirmDeleteTemplateId && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-lg)]">
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="grid size-10 place-items-center rounded-xl bg-rose-50">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[color:var(--foreground)]">Confirm Delete Template</h3>
                    <p className="text-xs text-[color:var(--muted)]">This action will remove the report template.</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-[color:var(--muted)] leading-relaxed">
                  Are you sure you want to delete this template? This cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-2 border-t border-[color:var(--line)] pt-4">
                  <Button variant="ghost" onClick={() => setConfirmDeleteTemplateId(null)}>
                    Cancel
                  </Button>
                  <Button variant="danger" loading={deleteTemplate.isPending} onClick={handleDeleteTemplate}>
                    Confirm Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <PageHeader
          title="Report templates"
          description="Reusable layout and signatory settings."
          action={
            <Link href="/reports/templates/new">
              <Button variant="primary" leftIcon={<Plus size={16} />}>New template</Button>
            </Link>
          }
        />
        <DataTable
          columns={templateColumns}
          data={templates.data}
          isLoading={templates.isLoading}
          isError={templates.isError}
          searchable
          searchPlaceholder="Search templates..."
        />

        {confirmDeleteTemplateId && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-lg)]">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="grid size-10 place-items-center rounded-xl bg-rose-50">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[color:var(--foreground)]">Confirm Delete Template</h3>
                  <p className="text-xs text-[color:var(--muted)]">This action will remove the report template.</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-[color:var(--muted)] leading-relaxed">
                Are you sure you want to delete this template? This cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-2 border-t border-[color:var(--line)] pt-4">
                <Button variant="ghost" onClick={() => setConfirmDeleteTemplateId(null)}>
                  Cancel
                </Button>
                <Button variant="danger" loading={deleteTemplate.isPending} onClick={handleDeleteTemplate}>
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const item = report.data;
  if (!item) return <p className="text-sm text-[color:var(--muted)]">Loading report…</p>;

  const reportResults = (results.data ?? []).filter((result) => item.resultIds.includes(result.id));
  const critical = reportResults.some((result) => result.criticalFlag);

  const approve = () => {
    if (!critical || confirm("Critical values are present. Confirm final approval?")) {
      actions.approveReport.mutate(item.id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.reportNumber}
        description="Review and validate this pathology report."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()} title="Print"><Printer size={15} /></Button>
            <Button variant="outline" title="Download"><Download size={15} /></Button>
            <Button variant="outline" title="Share"><Share2 size={15} /></Button>
          </div>
        }
      />
      <article className="mx-auto max-w-4xl border border-[color:var(--line)] bg-[color:var(--surface)] p-8 shadow-sm rounded-2xl print:border-0 print:shadow-none print:p-0">
        <header className="flex justify-between border-b border-[color:var(--line)] pb-6">
          <div>
            <p className="text-2xl font-bold text-[color:var(--brand-600)]">BLDignostics LIMS</p>
            <p className="text-sm text-[color:var(--muted)] mt-1">Clinical laboratory report</p>
          </div>
          <StatusBadge tone={item.status === "Approved" ? "success" : "warning"} size="lg">{item.status}</StatusBadge>
        </header>

        <section className="grid gap-6 py-6 text-sm sm:grid-cols-3">
          <p><span className="text-[color:var(--muted)] block mb-1">Patient</span><b className="text-[color:var(--foreground)]">{item.patientId === "pat-01" ? "Maya Srinivasan" : item.patientId}</b></p>
          <p><span className="text-[color:var(--muted)] block mb-1">Sample ID</span><b className="text-[color:var(--foreground)]">{item.sampleId}</b></p>
          <p><span className="text-[color:var(--muted)] block mb-1">Referring doctor</span><b className="text-[color:var(--foreground)]">Dr. K. Menon</b></p>
          <p><span className="text-[color:var(--muted)] block mb-1">Collection date</span><b className="text-[color:var(--foreground)]">22 Aug 2026</b></p>
          <p><span className="text-[color:var(--muted)] block mb-1">Report date</span><b className="text-[color:var(--foreground)]">{item.createdAt.slice(0, 10)}</b></p>
          <p><span className="text-[color:var(--muted)] block mb-1">Pathologist</span><b className="text-[color:var(--foreground)]">{item.pathologist ?? "Pending approval"}</b></p>
        </section>

        {critical && (
          <div className="mb-6 rounded-lg border-l-4 border-[color:var(--danger)] bg-[color:var(--danger-bg)] p-4 text-sm text-[color:var(--danger)]">
            <p className="font-semibold flex items-center gap-2">Critical result detected</p>
            <p className="mt-1 opacity-90">Confirmation is required before approval.</p>
          </div>
        )}

        <div className="py-4">
          <ResultTable results={reportResults} />
        </div>

        <Formik
          initialValues={{ comments: item.comments ?? "" }}
          onSubmit={(values) => actions.updateComments.mutate({ id: item.id, comments: values.comments })}
        >
          {({ isSubmitting }) => (
            <Form className="mt-8 pt-6 border-t border-[color:var(--line)] print:hidden">
              <label className="text-sm font-semibold mb-3 block">Review comments</label>
              <Field as="textarea" name="comments" className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3 text-sm focus:border-[color:var(--brand-500)] outline-none min-h-[100px]" placeholder="Add your clinical observations..." />
              <Button type="submit" variant="outline" className="mt-3" loading={isSubmitting}>Save comments</Button>
            </Form>
          )}
        </Formik>

        <footer className="mt-8 flex flex-wrap gap-3 border-t border-[color:var(--line)] pt-6 print:hidden">
          <Button variant="primary" onClick={approve}>Approve report</Button>
          <Button variant="danger-outline" onClick={() => actions.rejectReport.mutate(item.id)}>Reject</Button>
          <Button variant="outline" onClick={() => actions.requestRetest.mutate(item.id)}>Request retest</Button>
          <div className="ml-auto flex gap-3 text-[color:var(--muted)]">
            <div className="grid size-9 place-items-center rounded-lg bg-[color:var(--surface-2)]"><Mail size={16} /></div>
            <div className="grid size-9 place-items-center rounded-lg bg-[color:var(--surface-2)]"><MessageCircle size={16} /></div>
            <div className="grid size-9 place-items-center rounded-lg bg-[color:var(--surface-2)]"><QrCode size={16} /></div>
          </div>
        </footer>
      </article>
    </div>
  );
}
