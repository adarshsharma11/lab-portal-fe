"use client";
import React, { useMemo } from "react";
import { Form, Formik, Field } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Mail, MessageCircle, Printer, QrCode, Share2 } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { PageHeader, StatusBadge, Button, Input, Select, Textarea, Field as UIField, Grid2, Card, cn } from "@/components/ui/index";
import { DataTable } from "@/components/tables/DataTable";
import { ResultTable } from "@/components/laboratory/result-engine";
import { useResults } from "@/features/laboratory/hooks";
import { useCreateTemplate, useReport, useReportActions, useReports, useReportTemplates } from "@/features/reports/hooks";
import type { Report, ReportTemplate } from "@/types/domain";

const templateSchema = Yup.object({
  name: Yup.string().trim().required("Template name is required (e.g. Hematology Complete Blood Count)").min(2, "Template name must be at least 2 characters"),
  department: Yup.string().required("Please select a laboratory department"),
  tests: Yup.string().trim().required("Included test codes are required (e.g. CBC, ESR, Hemoglobin)"),
  header: Yup.string().trim().required("Report header title is required (e.g. BLDignostics Clinical Laboratory)"),
  footer: Yup.string().trim().required("Report footer disclaimer is required"),
  signatory: Yup.string().trim().required("Signatory pathologist name is required (e.g. Dr. Ananya Rao, MD)"),
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
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
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
        header: "Name",
        cell: ({ getValue }) => <span className="font-semibold text-[color:var(--foreground)]">{getValue()}</span>
      }),
      h.accessor("department", {
        header: "Department"
      }),
      h.accessor("signatory", {
        header: "Signatory",
        cell: ({ getValue }) => <span className="text-[color:var(--muted)]">{getValue()}</span>
      })
    ];
  }, []);

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

  if (path[0] === "templates") {
    if (path[1] === "new") {
      const initial = { name: "", department: "", tests: "", header: "BLDignostics LIMS", footer: "This is a computer-generated medical report verified by authorized pathologists.", referenceRanges: "", notes: "", signatory: "", active: true };
      return (
        <div className="space-y-6 max-w-4xl mx-auto">
          <PageHeader
            title="New report template"
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
              validateOnMount={false}
              validateOnChange={true}
              validateOnBlur={true}
              onSubmit={(values) => createTemplate.mutateAsync({ ...values, tests: values.tests.split(",").map(t => t.trim()) }).then(() => router.push("/reports/templates"))}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-6">
                  <Grid2>
                    <UIField label="Template Name" name="name" required error={touched.name ? errors.name : undefined}>
                      <Field name="name" as={Input} placeholder="e.g. Routine Hematology & Differential Report" />
                    </UIField>
                    <UIField label="Department" name="department" required error={touched.department ? errors.department : undefined}>
                      <Field name="department" as={Select}>
                        <option value="" disabled>Select department</option>
                        {["Hematology", "Biochemistry", "Microbiology", "Immunology", "Pathology", "Histopathology", "Urine Analysis", "Electrolytes", "Other"].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </Field>
                    </UIField>
                    <UIField label="Included Test Codes (comma separated)" name="tests" required error={touched.tests ? errors.tests : undefined} hint="e.g. CBC, ESR, WBC">
                      <Field name="tests" as={Input} placeholder="CBC, ESR, Hemoglobin" />
                    </UIField>
                    <UIField label="Authorized Signatory Pathologist" name="signatory" required error={touched.signatory ? errors.signatory : undefined}>
                      <Field name="signatory" as={Input} placeholder="e.g. Dr. Ananya Rao, MD (Pathology)" />
                    </UIField>
                    <UIField label="Report Header Title" name="header" required error={touched.header ? errors.header : undefined}>
                      <Field name="header" as={Input} placeholder="e.g. BLDignostics Clinical Laboratory" />
                    </UIField>
                    <UIField label="Report Footer / Disclaimer" name="footer" required error={touched.footer ? errors.footer : undefined}>
                      <Field name="footer" as={Input} placeholder="e.g. Electronic validated diagnostic laboratory report" />
                    </UIField>
                    <UIField label="Default Reference Range Notes" name="referenceRanges" className="sm:col-span-2">
                      <Field name="referenceRanges" as={Textarea} placeholder="e.g. Standard reference values based on adult male & female reference populations." />
                    </UIField>
                    <UIField label="Standard Report Notes / Instructions" name="notes" className="sm:col-span-2">
                      <Field name="notes" as={Textarea} placeholder="e.g. Clinical correlation is recommended. Values exceeding reference limits are flagged." />
                    </UIField>
                  </Grid2>
                  <div className="flex gap-3 pt-4 border-t border-[color:var(--line)]">
                    <Button type="submit" variant="primary" loading={isSubmitting || createTemplate.isPending}>Save template</Button>
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

    return (
      <div className="space-y-6">
        <PageHeader
          title="Report templates"
          description="Reusable layout and signatory settings."
          action={
            <Link href="/reports/templates/new">
              <Button variant="primary">New template</Button>
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
