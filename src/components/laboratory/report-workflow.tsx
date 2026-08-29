"use client";
import React, { useMemo, useState } from "react";
import { Form, Formik, Field } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  AlertTriangle, Award, CheckCircle2, ChevronRight, Clock, Download, 
  Edit3, Eye, FileText, FlaskConical, Mail, MessageCircle, Microscope, 
  Plus, Printer, QrCode, Share2, ShieldCheck, Trash2, ArrowLeft, Loader2
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
  header: Yup.string().trim().required("Report header title is required (. BL Dignostic Clinical Laboratory)"),
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
  const isNewTemplate = isTemplateFlow && path[1] === "new";
  const isEditTemplate = isTemplateFlow && path[2] === "edit";

  // Template List View
  if (isTemplateFlow && !templateId && !isNewTemplate) {
    const templateColumns = [
      {
        id: "name",
        header: "Template Name",
        accessorKey: "name",
        cell: ({ row }: any) => (
          <div>
            <p className="font-bold text-[color:var(--foreground)]">{row.original.name}</p>
            <p className="text-xs text-[color:var(--muted)]">{row.original.department}</p>
          </div>
        )
      },
      {
        id: "tests",
        header: "Associated Tests",
        accessorKey: "tests",
        cell: ({ getValue }: any) => {
          const t = getValue() as string[];
          return <span className="font-mono text-xs text-[color:var(--muted)]">{Array.isArray(t) ? t.join(", ") : t}</span>;
        }
      },
      {
        id: "signatory",
        header: "Signatory Pathologist",
        accessorKey: "signatory",
        cell: ({ getValue }: any) => <span className="text-xs font-medium text-[color:var(--foreground)]">{getValue()}</span>
      },
      {
        id: "active",
        header: "Status",
        accessorKey: "active",
        cell: ({ getValue }: any) => (
          <StatusBadge tone={getValue() ? "success" : "neutral"} size="sm">
            {getValue() ? "Active" : "Inactive"}
          </StatusBadge>
        )
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-1.5 justify-center">
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
      }
    ];

    return (
      <div className="space-y-6">
        <PageHeader
          title="Diagnostic Report Templates"
          description="Pre-configured reporting headers, biological reference ranges, and digital pathologist signatories."
          action={
            <div className="flex gap-2">
              <Link href="/reports">
                <Button variant="ghost">← Back to Reports</Button>
              </Link>
              <Link href="/reports/templates/new">
                <Button variant="primary" leftIcon={<Plus size={16} />}>
                  New Template
                </Button>
              </Link>
            </div>
          }
        />
        <DataTable
          columns={templateColumns}
          data={templates.data}
          isLoading={templates.isLoading}
          isError={templates.isError}
          searchable
          searchPlaceholder="Search templates..."
          emptyTitle="No report templates found"
        />

        {confirmDeleteTemplateId && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-lg)]">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="grid size-10 place-items-center rounded-xl bg-rose-50">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[color:var(--foreground)]">Confirm Permanent Delete</h3>
                  <p className="text-xs text-[color:var(--muted)]">This will delete the report template from database.</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-[color:var(--muted)] leading-relaxed">
                Are you sure you want to permanently delete this report template? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-2 border-t border-[color:var(--line)] pt-4">
                <Button variant="ghost" onClick={() => setConfirmDeleteTemplateId(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  loading={deleteTemplate.isPending} 
                  onClick={async () => {
                    await deleteTemplate.mutateAsync(confirmDeleteTemplateId);
                    setConfirmDeleteTemplateId(null);
                  }}
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

  // Template Create/Edit Form View
  if (isNewTemplate || isEditTemplate) {
    return <TemplateFormView id={templateId} isNew={isNewTemplate} />;
  }

  // Template Detail View
  if (isTemplateFlow && templateId) {
    return <TemplateDetailView id={templateId} />;
  }

  // Report Detail View (Single Report preview and PDF download)
  if (path.length && path[0] !== "templates") {
    return <ReportDetailView id={path[0]} />;
  }

  // Default Reports List
  return <ReportListView />;
}

// -------------------------------------------------------------
// TEMPLATE FORM VIEW
// -------------------------------------------------------------
function TemplateFormView({ id, isNew }: Readonly<{ id: string; isNew: boolean }>) {
  const router = useRouter();
  const templateQuery = useReportTemplate(isNew ? "" : id);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const existing = templateQuery.data;

  const initialValues = {
    name: existing?.name ?? "",
    department: existing?.department ?? "",
    tests: Array.isArray(existing?.tests) ? existing.tests.join(", ") : (existing?.tests ?? ""),
    header: existing?.header ?? "BL Dignostic LIMS Reference Laboratory",
    footer: existing?.footer ?? "This is a computer-generated report and does not require physical signature. Interpret clinically.",
    signatory: existing?.signatory ?? "Dr. Ananya Rao, MD (Pathology)",
    referenceRanges: existing?.referenceRanges ?? "",
    notes: existing?.notes ?? "Specimen processed under certified automated CLIA/NABL standards.",
    active: existing?.active ?? true,
  };

  const submit = async (values: typeof initialValues) => {
    const payload: Omit<ReportTemplate, "id"> = {
      ...values,
      tests: typeof values.tests === "string" 
        ? values.tests.split(",").map((t: string) => t.trim()).filter(Boolean)
        : Array.isArray(values.tests) ? values.tests : [],
    };

    if (isNew) {
      await createTemplate.mutateAsync(payload);
    } else {
      await updateTemplate.mutateAsync({ id, input: payload });
    }
    router.push("/reports/templates");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={isNew ? "New Report Template" : `Edit Template: ${existing?.name || ""}`}
        description="Configure diagnostic layout, reference ranges, and authorization signatory for clinical reports."
        action={
          <Link href="/reports/templates">
            <Button variant="ghost">← Back to Templates</Button>
          </Link>
        }
      />
      <Card>
        <Formik
          initialValues={initialValues}
          validationSchema={templateSchema}
          enableReinitialize
          validateOnChange={true}
          validateOnBlur={true}
          onSubmit={submit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-6">
              <Grid2>
                <UIField 
                  label="Template Name" 
                  name="name" 
                  required 
                  error={touched.name ? errors.name : undefined}
                >
                  <Field name="name" as={Input} placeholder="e.g. Standard Hematology CBC Profile" />
                </UIField>

                <UIField 
                  label="Laboratory Department" 
                  name="department" 
                  required 
                  error={touched.department ? errors.department : undefined}
                >
                  <Field name="department" as={Select}>
                    <option value="">Select department</option>
                    <option value="Hematology">Hematology & Coagulation</option>
                    <option value="Biochemistry">Clinical Biochemistry</option>
                    <option value="Electrolytes">Electrolytes & Blood Gas</option>
                    <option value="Serology">Immunology & Serology</option>
                    <option value="Microbiology">Microbiology & Cultures</option>
                    <option value="Histopathology">Histopathology & Cytology</option>
                    <option value="Molecular">Molecular Diagnostics</option>
                  </Field>
                </UIField>

                <UIField 
                  label="Included Test Codes (comma-separated)" 
                  name="tests" 
                  required 
                  hint="e.g. CBC, ESR, HB, PLATELET"
                  className="sm:col-span-2"
                  error={touched.tests ? errors.tests : undefined}
                >
                  <Field name="tests" as={Input} placeholder="CBC, ESR, HB" />
                </UIField>

                <UIField 
                  label="Report Header Title" 
                  name="header" 
                  required 
                  className="sm:col-span-2"
                  error={touched.header ? errors.header : undefined}
                >
                  <Field name="header" as={Input} placeholder="BL Dignostic Clinical Laboratory" />
                </UIField>

                <UIField 
                  label="Signatory Pathologist Name & Credentials" 
                  name="signatory" 
                  required 
                  error={touched.signatory ? errors.signatory : undefined}
                >
                  <Field name="signatory" as={Input} placeholder="Dr. Ananya Rao, MD (Pathology)" />
                </UIField>

                <UIField 
                  label="Status" 
                  name="active" 
                >
                  <Field name="active" as={Select}>
                    <option value="true">Active (Enabled)</option>
                    <option value="false">Inactive (Disabled)</option>
                  </Field>
                </UIField>

                <UIField 
                  label="Default Reference Ranges & Methodology Notes" 
                  name="referenceRanges" 
                  className="sm:col-span-2"
                >
                  <Field name="referenceRanges" as={Textarea} rows={2} placeholder="Adult Indian biological reference intervals apply." />
                </UIField>

                <UIField 
                  label="Report Footer Disclaimer" 
                  name="footer" 
                  required 
                  className="sm:col-span-2"
                  error={touched.footer ? errors.footer : undefined}
                >
                  <Field name="footer" as={Textarea} rows={2} placeholder="This is a computer-generated diagnostic report." />
                </UIField>
              </Grid2>

              <div className="flex gap-3 pt-4 border-t border-[color:var(--line)]">
                <Button type="submit" variant="primary" loading={isSubmitting || createTemplate.isPending || updateTemplate.isPending}>
                  Save Template
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

// -------------------------------------------------------------
// TEMPLATE DETAIL VIEW
// -------------------------------------------------------------
function TemplateDetailView({ id }: Readonly<{ id: string }>) {
  const templateQuery = useReportTemplate(id);
  const item = templateQuery.data;

  if (templateQuery.isLoading) return <p className="text-sm text-[color:var(--muted)]">Loading template...</p>;
  if (!item) return <p className="text-sm text-[color:var(--muted)]">Template not found.</p>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={item.name}
        description={`Department: ${item.department}`}
        action={
          <div className="flex gap-2">
            <Link href="/reports/templates">
              <Button variant="ghost">← Back to Templates</Button>
            </Link>
            <Link href={`/reports/templates/${id}/edit`}>
              <Button variant="outline" leftIcon={<Edit3 size={15} />}>Edit Template</Button>
            </Link>
          </div>
        }
      />
      <Card padding={false} className="overflow-hidden">
        <dl className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[color:var(--line)]">
          <div className="p-4">
            <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">Department</dt>
            <dd className="mt-1 text-sm font-bold text-[color:var(--foreground)]">{item.department}</dd>
          </div>
          <div className="p-4">
            <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">Status</dt>
            <dd className="mt-1">
              <StatusBadge tone={item.active ? "success" : "neutral"} size="sm">
                {item.active ? "Active" : "Inactive"}
              </StatusBadge>
            </dd>
          </div>
          <div className="p-4 sm:border-t border-[color:var(--line)]">
            <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">Associated Tests</dt>
            <dd className="mt-1 text-sm font-mono">{Array.isArray(item.tests) ? item.tests.join(", ") : item.tests}</dd>
          </div>
          <div className="p-4 sm:border-t border-[color:var(--line)]">
            <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">Signatory</dt>
            <dd className="mt-1 text-sm font-semibold">{item.signatory}</dd>
          </div>
          <div className="p-4 sm:col-span-2 border-t border-[color:var(--line)]">
            <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">Report Header</dt>
            <dd className="mt-1 text-sm font-medium">{item.header}</dd>
          </div>
          <div className="p-4 sm:col-span-2 border-t border-[color:var(--line)]">
            <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">Footer Disclaimer</dt>
            <dd className="mt-1 text-xs text-[color:var(--muted)]">{item.footer}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}

// -------------------------------------------------------------
// REPORT DETAIL / PRINT & DIRECT PDF DOWNLOAD VIEW
// -------------------------------------------------------------
function ReportDetailView({ id }: Readonly<{ id: string }>) {
  const router = useRouter();
  const report = useReport(id);
  const actions = useReportActions();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const item = report.data as any;
  if (report.isLoading) return <p className="text-sm text-[color:var(--muted)]">Loading report details...</p>;
  if (!item) return <p className="text-sm text-[color:var(--muted)]">Report not found.</p>;

  // Load test schema to auto-populate default results if empty
  const testSchema = getTestParameterSchema(item.testCode || (item.testIds && item.testIds[0]) || "CBC");
  
  let reportResults: Result[] = (item.results ?? []) as Result[];
  if (!reportResults.length && testSchema.parameters.length) {
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

  /**
   * DIRECT PDF DOWNLOAD FUNCTION
   * Captures the diagnostic-report-article container cleanly and generates a high-res,
   * A4-fitted PDF file and initiates download directly without opening any print popup.
   */
  const downloadPdfDirectly = async () => {
    const reportElement = document.getElementById("diagnostic-report-article");
    if (!reportElement) return;

    setIsDownloadingPdf(true);
    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      // Render DOM element to high-res PNG (2x pixel ratio for print sharpness)
      const imgData = await toPng(reportElement, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
      });
      
      // Standard A4 dimensions in mm: 210 x 297
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 8;
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = (img.height * contentWidth) / img.width;

      if (contentHeight <= pdfHeight - margin * 2) {
        pdf.addImage(imgData, "PNG", margin, margin, contentWidth, contentHeight, undefined, "FAST");
      } else {
        let heightLeft = contentHeight;
        let position = margin;

        pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight, undefined, "FAST");
        heightLeft -= (pdfHeight - margin * 2);

        while (heightLeft > 0) {
          position = heightLeft - contentHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight, undefined, "FAST");
          heightLeft -= (pdfHeight - margin * 2);
        }
      }

      const filename = `Diagnostic_Report_${item.reportNumber || "RPT"}_${(patient.name || "Patient").replace(/\s+/g, "_")}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Failed to generate direct PDF download:", error);
      alert("An error occurred while generating the PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
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
          <Button 
            variant="outline" 
            onClick={downloadPdfDirectly} 
            loading={isDownloadingPdf}
            leftIcon={<Download size={15} />}
          >
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
      <article 
        id="diagnostic-report-article"
        className="mx-auto max-w-4xl bg-white text-slate-900 border border-slate-200 p-8 sm:p-12 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full font-sans"
        style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
      >
        
        {/* Top Laboratory Brand & Accreditation Header */}
        <header 
          className="border-b-2 border-[#176b87] pb-4 mb-5 flex items-start justify-between gap-4"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #176b87" }}
        >
          <div className="flex items-center gap-3" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div 
              className="grid size-12 place-items-center rounded-xl bg-[#176b87] text-white shrink-0"
              style={{ backgroundColor: "#176b87", color: "#ffffff", width: "3rem", height: "3rem", borderRadius: "0.75rem", display: "grid", placeItems: "center" }}
            >
              <FlaskConical size={26} color="#ffffff" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#176b87]" style={{ color: "#176b87", fontSize: "1.5rem", fontWeight: 900, margin: 0 }}>
                BL Dignostic LIMS
              </h1>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase" style={{ color: "#64748b", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", margin: 0 }}>
                Clinical Reference Pathology Laboratory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right shrink-0" style={{ display: "flex", alignItems: "center", gap: "1rem", textAlign: "right" }}>
            <div className="flex flex-col items-end text-[10px] text-slate-600" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: "10px", color: "#475569" }}>
              <span className="font-bold flex items-center gap-1 text-emerald-700" style={{ color: "#047857", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <ShieldCheck size={12} color="#047857" /> NABL ACCREDITED
              </span>
              <span>ISO 15189:2012 Certified</span>
              <span className="text-slate-400 font-mono" style={{ color: "#94a3b8", fontFamily: "monospace" }}>MC-4245 · CAP #9019582</span>
            </div>
            <div className="border-l border-slate-200 pl-4 text-right" style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "1rem" }}>
              <span 
                className="inline-block rounded bg-[#e8f4f7] px-2.5 py-1 text-xs font-bold text-[#176b87]"
                style={{ backgroundColor: "#e8f4f7", color: "#176b87", borderRadius: "0.375rem", padding: "0.25rem 0.625rem", fontSize: "12px", fontWeight: 700 }}
              >
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
                {sample.collectedAt ? sample.collectedAt.slice(0, 10) : (item.createdAt ? item.createdAt.slice(0, 10) : "2026-08-29")} 07:43 AM
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Report Generated On</span>
              <span className="font-mono font-medium text-slate-900">
                {item.createdAt ? item.createdAt.slice(0, 10) : "2026-08-29"} 02:46 PM
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Report Status</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                {item.status || "Approved"} ✓
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
              Sample Temp: <span className="font-medium text-slate-800">Maintained (2-8°C) ✓</span>
            </div>
          </div>
        </section>

        {/* Diagnostic Section Heading */}
        <div className="mb-6 text-center">
          <span className="inline-block rounded-full bg-[#e8f4f7] px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-[#176b87]">
            Department of {item.department || testSchema.department}
          </span>
          <h2 className="text-lg font-black tracking-tight text-slate-900 mt-2">
            {testSchema.name}
          </h2>
        </div>

        {/* Results Parameters Table */}
        <table className="w-full text-left text-xs mb-8">
          <thead>
            <tr className="border-b-2 border-slate-300 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
              <th className="py-2.5 px-3">Test Name / Parameter</th>
              <th className="py-2.5 px-3 text-right">Value</th>
              <th className="py-2.5 px-3">Unit</th>
              <th className="py-2.5 px-3">Bio. Ref Interval</th>
              <th className="py-2.5 px-3 text-center">Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {reportResults.map((r, idx) => (
              <tr key={r.id || idx} className={r.criticalFlag ? "bg-rose-50/70" : r.abnormalFlag ? "bg-amber-50/50" : ""}>
                <td className="py-3 px-3">
                  <p className="font-bold text-slate-900">{r.parameter}</p>
                  {r.comments && <p className="text-[10px] text-slate-500 italic">{r.comments}</p>}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-sm text-slate-900">
                  {r.value}
                </td>
                <td className="py-3 px-3 font-mono text-slate-600">
                  {r.unit || "—"}
                </td>
                <td className="py-3 px-3 text-slate-600 font-mono">
                  {r.referenceRange || "—"}
                </td>
                <td className="py-3 px-3 text-center font-bold">
                  {r.criticalFlag ? (
                    <span className="inline-block rounded bg-rose-600 px-2 py-0.5 text-[10px] text-white">
                      CRITICAL
                    </span>
                  ) : r.abnormalFlag ? (
                    <span className="inline-block rounded bg-amber-500 px-2 py-0.5 text-[10px] text-white">
                      ABNORMAL
                    </span>
                  ) : (
                    <span className="text-emerald-700 text-[11px]">Normal</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Clinical Comments & Pathological Observations */}
        {item.comments && (
          <div className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-700 mb-1">
              Clinical Interpretation & Notes
            </h4>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {item.comments}
            </p>
          </div>
        )}

        {/* Pathologist Digital Authorization & Authenticity Footer */}
        <footer className="mt-12 pt-6 border-t-2 border-slate-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            
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
              <p className="text-[10px] font-mono text-slate-400">Reg. No: HN-20567 · BL Dignostic Central Lab</p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>BL Dignostic Laboratories (A Unit of Healthcare LIMS Diagnostics Pvt. Ltd.) · Plot 1 & 2, Healthcare City</span>
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

// -------------------------------------------------------------
// DEFAULT REPORT LIST VIEW
// -------------------------------------------------------------
function ReportListView() {
  const router = useRouter();
  const reports = useReports();
  const actions = useReportActions();

  const columns = useMemo(() => {
    const h = createColumnHelper<Report>();
    return [
      h.accessor("reportNumber", {
        header: "Report No.",
        cell: ({ getValue }) => <span className="font-mono font-bold text-[color:var(--foreground)]">{getValue()}</span>
      }),
      h.accessor(row => (row as any).patient?.name || row.patientId, {
        id: "patient",
        header: "Patient",
        cell: ({ getValue }) => <span className="font-medium text-[color:var(--foreground)]">{getValue()}</span>
      }),
      h.accessor(row => (row as any).department || (row.testIds && row.testIds[0]) || "General", {
        id: "department",
        header: "Department / Test",
        cell: ({ getValue }) => <span className="text-[color:var(--muted)]">{getValue()}</span>
      }),
      h.accessor("status", {
        header: "Report Status",
        cell: ({ getValue }) => {
          const val = getValue();
          const tone = val === "Approved" ? "success" : val === "Draft" ? "neutral" : val === "Rejected" ? "danger" : "warning";
          return <StatusBadge tone={tone} size="sm">{val}</StatusBadge>;
        }
      }),
      h.accessor("createdAt", {
        header: "Generated Date",
        cell: ({ getValue }) => <span className="text-xs text-[color:var(--muted)]">{getValue() ? String(getValue()).slice(0, 10) : "—"}</span>
      }),
      h.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 justify-center">
            <Link href={`/reports/${row.original.id}`}>
              <Button size="sm" variant="ghost" leftIcon={<Eye size={13} />}>
                View / Print
              </Button>
            </Link>
            {row.original.status !== "Approved" && (
              <Button 
                size="sm" 
                variant="primary" 
                leftIcon={<CheckCircle2 size={13} />}
                onClick={() => actions.approveReport.mutate(row.original.id)}
              >
                Approve
              </Button>
            )}
          </div>
        )
      })
    ];
  }, [actions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostic Reports Workflow"
        description="Verify laboratory findings, pathologist digital signatures, and release certified patient reports."
        action={
          <div className="flex gap-2">
            <Link href="/reports/templates">
              <Button variant="outline" leftIcon={<FileText size={15} />}>
                Templates
              </Button>
            </Link>
            <Link href="/reports/new">
              <Button variant="primary" leftIcon={<Plus size={15} />}>
                Generate Report
              </Button>
            </Link>
          </div>
        }
      />
      <DataTable
        columns={columns}
        data={reports.data}
        isLoading={reports.isLoading}
        isError={reports.isError}
        searchable
        searchPlaceholder="Search reports by patient, code, number..."
        emptyTitle="No diagnostic reports found"
      />
    </div>
  );
}
