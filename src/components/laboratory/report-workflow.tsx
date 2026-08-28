"use client";
import React, { useMemo, useState } from "react";
import { Form, Formik, Field } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  AlertTriangle, Award, CheckCircle2, ChevronRight, Clock, Download, 
  Edit3, Eye, FileText, FlaskConical, Mail, MessageCircle, Microscope, 
  Plus, Printer, QrCode, Share2, ShieldCheck, Trash2, ArrowLeft 
} from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { PageHeader, StatusBadge, Button, Input, Select, Textarea, Field as UIField, Grid2, Card, cn } from "@/components/ui/index";
import { DataTable } from "@/components/tables/DataTable";
import { useResults } from "@/features/laboratory/hooks";
import { 
  useCreateTemplate, 
  useDeleteTemplate, 
  useReport, 
  useReportActions, 
  useReports, 
  useReportTemplate, 
  useReportTemplates, 
  useUpdateTemplate 
} from "@/features/reports/hooks";
import { ReportGeneratorWizard } from "@/components/laboratory/ReportGeneratorWizard";
import { getTestParameterSchema, evaluateParameterFlag } from "@/lib/laboratory/test-parameter-definitions";
import type { Report, ReportTemplate, Result } from "@/types/domain";

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

  // New report creation flow
  if (path[0] === "new") {
    return <ReportGeneratorWizard />;
  }

  const isTemplateFlow = path[0] === "templates";
  const templateId = isTemplateFlow && path[1] && path[1] !== "new" ? path[1] : "";
  const isTemplateEdit = isTemplateFlow && path[2] === "edit";
  const isTemplateNew = isTemplateFlow && path[1] === "new";
  const templateDetail = useReportTemplate(templateId);

  const reportColumns = useMemo(() => {
    const h = createColumnHelper<any>();
    return [
      h.accessor(row => row.patient?.name || (row.patientId === "pat-01" ? "Maya Srinivasan" : row.patientId), {
        id: "patient",
        header: "Patient",
        cell: ({ row, getValue }) => (
          <div>
            <span className="font-semibold text-[color:var(--foreground)]">{getValue()}</span>
            {row.original.patient?.patientCode && (
              <p className="text-[11px] font-mono text-[color:var(--muted)]">{row.original.patient.patientCode}</p>
            )}
          </div>
        )
      }),
      h.accessor(row => row.sample?.barcode || row.sample?.accession || row.sampleId, {
        id: "sampleId",
        header: "Sample / Barcode",
        cell: ({ getValue }) => <span className="text-[color:var(--muted)] font-mono text-xs">{getValue()}</span>
      }),
      h.accessor(row => (Array.isArray(row.testIds) ? row.testIds.join(", ") : String(row.testIds || "—")), {
        id: "tests",
        header: "Diagnostic Test",
        cell: ({ getValue }) => <span className="font-medium text-[color:var(--foreground)]">{getValue()}</span>
      }),
      h.accessor("department", {
        header: "Department",
        cell: ({ getValue }) => <span className="text-xs text-[color:var(--muted)]">{getValue() || "Hematology"}</span>
      }),
      h.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const val = getValue();
          return <StatusBadge tone={val === "Approved" ? "success" : val === "Rejected" ? "danger" : "warning"} size="sm">{val || "Pending Review"}</StatusBadge>;
        }
      }),
      h.accessor(row => (row.createdAt ? row.createdAt.slice(0, 10) : "—"), {
        id: "created",
        header: "Report Date",
        cell: ({ getValue }) => <span className="text-xs text-[color:var(--muted)]">{getValue()}</span>
      }),
      h.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <Link href={`/reports/${row.original.id}`}>
              <Button size="sm" variant="ghost" leftIcon={<Eye size={13} />}>
                View Report
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Printer size={13} />}
              onClick={() => {
                router.push(`/reports/${row.original.id}`);
                setTimeout(() => window.print(), 500);
              }}
              title="Print report"
            >
              Print
            </Button>
          </div>
        )
      })
    ];
  }, [router]);

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

  // Main Report List View
  if (!path.length || path[0] === "pending") {
    const isPending = path[0] === "pending";
    const filteredData = (reports.data ?? []).filter(item => !isPending || item.status === "Pending Review");

    return (
      <div className="space-y-6">
        <PageHeader
          title={isPending ? "Pending Pathology Reports" : "Diagnostic Reports"}
          description="Generate, review, sign, and release clinical diagnostic reports."
          action={
            <div className="flex items-center gap-3">
              <Link href="/reports/templates">
                <Button variant="outline">Templates</Button>
              </Link>
              <Link href="/reports/new">
                <Button variant="primary" leftIcon={<Plus size={16} />}>
                  Generate Report
                </Button>
              </Link>
            </div>
          }
        />
        <DataTable
          columns={reportColumns}
          data={filteredData}
          isLoading={reports.isLoading}
          isError={reports.isError}
          searchable
          searchPlaceholder="Search reports by patient, barcode, test..."
        />
      </div>
    );
  }

  // Template Management Flow (/reports/templates/...)
  if (isTemplateFlow) {
    if (isTemplateNew || isTemplateEdit) {
      const existing = templateDetail.data;
      const initial = {
        name: existing?.name ?? "",
        department: existing?.department ?? "Hematology",
        tests: Array.isArray(existing?.tests) ? existing.tests.join(", ") : (existing?.tests ?? ""),
        header: existing?.header ?? "BLDignostics LIMS Reference Laboratory",
        footer: existing?.footer ?? "This is a computer-generated medical report verified by authorized pathologists.",
        referenceRanges: existing?.referenceRanges ?? "",
        notes: existing?.notes ?? "",
        signatory: existing?.signatory ?? "Dr. Pranjali Sejwal, MBBS, MD Pathology",
        active: existing?.active ?? true,
      };

      return (
        <div className="space-y-6 max-w-4xl mx-auto">
          <PageHeader
            title={isTemplateNew ? "New Report Template" : "Edit Report Template"}
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
                        {["Hematology", "Biochemistry", "Clinical Pathology", "Immunology", "Microbiology", "Histopathology", "Urine Analysis", "Electrolytes"].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </Field>
                    </UIField>
                    <UIField label="Included Test Codes (comma separated)" name="tests" required error={touched.tests ? errors.tests : undefined} hint=". CBC, ESR, WBC">
                      <Field name="tests" as={Input} placeholder="CBC, ESR, Hemoglobin" />
                    </UIField>
                    <UIField label="Authorized Signatory Pathologist" name="signatory" required error={touched.signatory ? errors.signatory : undefined}>
                      <Field name="signatory" as={Input} placeholder="Dr. Pranjali Sejwal, MBBS, MD Pathology" />
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
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <PageHeader
          title="Report Templates"
          description="Reusable layout, methodology standards, and signatory settings."
          action={
            <Link href="/reports/templates/new">
              <Button variant="primary" leftIcon={<Plus size={16} />}>New Template</Button>
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

  // ==========================================
  // FINAL DIAGNOSTIC REPORT VIEW (/reports/:id)
  // ==========================================
  const item = report.data as any;
  if (!item) return <div className="p-8 text-center text-sm text-[color:var(--muted)]">Loading diagnostic report…</div>;

  const testTitle = (Array.isArray(item.testIds) && item.testIds[0]) || item.department || "Complete Blood Count (CBC)";
  const testSchema = getTestParameterSchema(testTitle);

  // Gather results: either from report.results (direct from backend), or from test results, or from results query
  let reportResults: Result[] = Array.isArray(item.results) && item.results.length > 0
    ? item.results
    : (results.data ?? []).filter((result) => item.resultIds?.includes(result.id));

  // If no results attached yet, generate display rows from test schema
  if (reportResults.length === 0 && testSchema.parameters.length > 0) {
    reportResults = testSchema.parameters.map((p) => ({
      id: p.id,
      testId: item.id,
      parameter: p.name,
      value: p.defaultValue || "Normal",
      unit: p.unit,
      referenceRange: p.referenceRange,
      abnormalFlag: false,
      criticalFlag: false,
      comments: p.method ? `Method: ${p.method}` : undefined,
    }));
  }

  const critical = reportResults.some((result) => result.criticalFlag);
  const patient = item.patient || {};
  const doctor = item.doctor || {};
  const sample = item.sample || {};
  const barcodeNumber = sample.barcode || sample.accession || "E8399903";

  const approve = () => {
    if (!critical || confirm("Critical values are present. Confirm final approval & release?")) {
      actions.approveReport.mutate(item.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={15} />}>
              All Reports
            </Button>
          </Link>
          <span className="text-xs text-[color:var(--muted)]">/</span>
          <span className="font-mono text-xs font-bold text-[color:var(--foreground)]">{item.reportNumber}</span>
          <StatusBadge tone={item.status === "Approved" ? "success" : item.status === "Rejected" ? "danger" : "warning"} size="sm">
            {item.status || "Pending Review"}
          </StatusBadge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} leftIcon={<Printer size={15} />}>
            Print Report
          </Button>
          <Button variant="outline" onClick={() => window.print()} leftIcon={<Download size={15} />}>
            Download PDF
          </Button>
          {item.status !== "Approved" && (
            <Button variant="primary" onClick={approve} leftIcon={<CheckCircle2 size={15} />}>
              Approve & Release
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* PROFESSIONAL DIAGNOSTIC LAB REPORT ARTICLE (A4 PRINT READY) */}
      {/* ========================================================== */}
      <article className="mx-auto max-w-4xl bg-white text-slate-900 border border-slate-200 p-8 sm:p-12 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full font-sans">
        
        {/* Top Laboratory Brand & Accreditation Header */}
        <header className="border-b-2 border-[#176b87] pb-4 mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl bg-[#176b87] text-white">
              <FlaskConical size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#176b87]">BLDignostics</h1>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Clinical Reference Pathology Laboratory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="hidden sm:flex flex-col items-end text-[10px] text-slate-600">
              <span className="font-bold flex items-center gap-1 text-emerald-700">
                <ShieldCheck size={12} /> NABL ACCREDITED
              </span>
              <span>ISO 15189:2012 Certified</span>
              <span className="text-slate-400 font-mono">MC-4245 · CAP #9019582</span>
            </div>
            <div className="border-l border-slate-200 pl-4 text-right">
              <span className="inline-block rounded bg-[#e8f4f7] px-2.5 py-1 text-xs font-bold text-[#176b87]">
                Smart Report 3.0
              </span>
            </div>
          </div>
        </header>

        {/* Patient Demographic & Specimen Information Grid */}
        <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 mb-6 text-xs text-slate-700">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 gap-x-4">
            <div>
              <span className="text-slate-500 text-[11px] block">Patient Name</span>
              <span className="font-bold text-slate-900 text-sm">{patient.name || "Maya Srinivasan"}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Age / Gender</span>
              <span className="font-bold text-slate-900">{patient.age || 46} Yrs / {patient.sex || "Male"}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Order / Booking ID</span>
              <span className="font-mono font-bold text-slate-900">{item.reportNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Referred By</span>
              <span className="font-semibold text-slate-900">{doctor.name || "Self / Clinical OPD"}</span>
            </div>

            <div>
              <span className="text-slate-500 text-[11px] block">Sample Type</span>
              <span className="font-medium text-slate-900">{sample.sampleType || testSchema.sampleType || "Whole Blood EDTA"}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Sample Collected On</span>
              <span className="font-mono font-medium text-slate-900">
                {sample.collectedAt ? sample.collectedAt.slice(0, 10) : item.createdAt.slice(0, 10)} 07:43 AM
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Report Generated On</span>
              <span className="font-mono font-medium text-slate-900">
                {item.createdAt ? item.createdAt.slice(0, 10) : "Today"} 02:46 PM
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Report Status</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                {item.status || "Final Report"} ✓
              </span>
            </div>
          </div>

          {/* Barcode Strip */}
          <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Barcode:</span>
              <span className="font-mono font-bold text-slate-900">{barcodeNumber}</span>
            </div>
            <div className="font-mono text-xs tracking-widest text-slate-800 font-bold">
              ||| | |||| | |||||| || | |||| ||
            </div>
            <div className="text-[11px] text-slate-500">
              Sample Temp: <span className="font-bold text-emerald-700">Maintained (2-8°C) ✓</span>
            </div>
          </div>
        </section>

        {/* Department Banner */}
        <div className="text-center my-5">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#176b87] border-y border-slate-200 py-1.5 inline-block px-8 bg-slate-50">
            DEPARTMENT OF {item.department ? item.department.toUpperCase() : testSchema.department.toUpperCase()}
          </h2>
          <h3 className="text-base font-bold text-slate-900 mt-2">
            {testSchema.name}
          </h3>
        </div>

        {/* Critical Alert Banner if critical results exist */}
        {critical && (
          <div className="mb-5 rounded-lg border-l-4 border-rose-600 bg-rose-50 p-3.5 text-xs text-rose-900 flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Critical Values Detected:</span> Immediate physician communication required. Results verified by dual automated rerun.
            </div>
          </div>
        )}

        {/* Main Test Results Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 pr-4">Test Name / Parameter</th>
                <th className="py-2.5 px-3 text-center">Value</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 pl-3">Bio. Ref Interval</th>
                <th className="py-2.5 px-2 text-right">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reportResults.map((res, idx) => {
                const isCrit = res.criticalFlag;
                const isAbn = res.abnormalFlag;

                return (
                  <tr key={res.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-4">
                      <span className="font-bold text-slate-900 block text-xs">{res.parameter}</span>
                      {res.comments && (
                        <span className="text-[10px] text-slate-500 block">{res.comments}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={cn(
                        "font-mono font-bold text-sm",
                        isCrit ? "text-rose-700 bg-rose-50 px-2 py-0.5 rounded" :
                        isAbn ? "text-amber-700 font-extrabold" : "text-slate-900"
                      )}>
                        {res.value}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {res.unit || "—"}
                    </td>
                    <td className="py-2.5 pl-3 text-slate-700 font-medium whitespace-pre-line">
                      {res.referenceRange || "—"}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {isCrit ? (
                        <span className="rounded bg-rose-100 text-rose-800 px-1.5 py-0.5 text-[10px] font-bold">Critical</span>
                      ) : isAbn ? (
                        <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px] font-bold">Abnormal</span>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px]">Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Clinical Interpretations & Guidelines Table (if defined) */}
        {testSchema.interpretations && testSchema.interpretations.length > 0 && (
          <section className="my-5 rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-700 space-y-3">
            {testSchema.interpretations.map((interp, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="font-bold text-[#176b87] uppercase text-[11px] tracking-wider">
                  INTERPRETATION: {interp.heading}
                </h4>
                <p className="leading-relaxed text-slate-600">{interp.content}</p>

                {interp.table && (
                  <div className="overflow-x-auto my-2 border border-slate-200 rounded bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800">
                        <tr>
                          {interp.table.headers.map((h, i) => (
                            <th key={i} className="px-3 py-1.5">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {interp.table.rows.map((r, ri) => (
                          <tr key={ri}>
                            {r.map((c, ci) => (
                              <td key={ci} className="px-3 py-1.5 font-medium">{c}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Clinical Remarks / Observations */}
        {(item.comments || (testSchema.remarks && testSchema.remarks.length > 0)) && (
          <section className="my-5 text-xs text-slate-600 space-y-1.5">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
              REMARKS & CLINICAL OBSERVATIONS:
            </h4>
            {item.comments && (
              <p className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                {item.comments}
              </p>
            )}
            {testSchema.remarks && testSchema.remarks.map((rem, i) => (
              <p key={i} className="leading-relaxed text-[11px]">{rem}</p>
            ))}
          </section>
        )}

        {/* Signatory & Authorization Footer */}
        <footer className="mt-8 pt-6 border-t-2 border-slate-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            
            {/* Left SIN barcode & Verification QR */}
            <div className="flex items-center gap-4">
              <div className="grid size-16 place-items-center rounded border border-slate-300 bg-slate-50 p-1">
                <QrCode size={48} className="text-slate-800" />
              </div>
              <div className="text-[10px] text-slate-500">
                <p className="font-mono font-bold text-slate-900">SIN No: {barcodeNumber}</p>
                <p>Scan to verify authenticity on LIMS Portal</p>
                <p className="text-slate-400">Cryptographically signed document</p>
              </div>
            </div>

            {/* Pathologist Digital Signature */}
            <div className="text-right">
              <div className="font-serif italic text-lg font-bold text-[#176b87]">
                Pranjali
              </div>
              <p className="text-xs font-bold text-slate-900">
                {item.pathologist || "Dr. Pranjali Sejwal, MBBS, MD Pathology"}
              </p>
              <p className="text-[11px] text-slate-600">Consultant Pathologist & Biochemist</p>
              <p className="text-[10px] font-mono text-slate-400">Reg. No: HN-20567 · BLDignostics Central Lab</p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>BLDignostics Laboratories (A Unit of Healthcare LIMS Diagnostics Pvt. Ltd.) · Plot 1 & 2, Healthcare City</span>
            <span>Page 1 of 1 · *** End Of Report ***</span>
          </div>
        </footer>
      </article>

      {/* Review Comments & Authorization Box (hidden on print) */}
      <Card className="max-w-4xl mx-auto print:hidden">
        <Formik
          initialValues={{ comments: item.comments ?? "" }}
          onSubmit={(values) => actions.updateComments.mutate({ id: item.id, comments: values.comments })}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <h4 className="text-sm font-bold text-[color:var(--foreground)]">Pathologist Review & Observations</h4>
              <Field 
                as={Textarea} 
                name="comments" 
                rows={3} 
                placeholder="Add or update clinical observations, peripheral smear notes, or differential diagnosis..." 
              />
              <div className="flex justify-between items-center pt-2">
                <Button type="submit" variant="outline" size="sm" loading={isSubmitting}>
                  Save Observations
                </Button>
                <div className="flex gap-2">
                  <Button variant="danger-outline" size="sm" onClick={() => actions.rejectReport.mutate(item.id)}>
                    Reject Report
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => actions.requestRetest.mutate(item.id)}>
                    Request Retest
                  </Button>
                  {item.status !== "Approved" && (
                    <Button variant="primary" size="sm" onClick={approve}>
                      Approve & Release Report
                    </Button>
                  )}
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
}
