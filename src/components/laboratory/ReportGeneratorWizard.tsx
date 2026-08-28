"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  AlertCircle, CheckCircle2, ChevronRight, ClipboardCheck, FileText, 
  FlaskConical, Sparkles, User, ArrowLeft, Plus, ShieldCheck, Microscope
} from "lucide-react";
import { PageHeader, Card, Button, Input, Select, Textarea, Field as UIField, StatusBadge, cn } from "@/components/ui/index";
import { usePatients, useDoctors } from "@/features/crud/hooks";
import { useSamples } from "@/features/laboratory/hooks";
import { useReportTemplates } from "@/features/reports/hooks";
import { reportApi } from "@/mocks/services/resources";
import { 
  STANDARD_TEST_CATALOG, 
  getTestParameterSchema, 
  evaluateParameterFlag,
  type ParameterDefinition,
  type TestDefinition
} from "@/lib/laboratory/test-parameter-definitions";
import type { Patient, Sample, Doctor } from "@/types/domain";

export function ReportGeneratorWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get("patientId") || "";
  const initialTestCode = searchParams.get("testCode") || "CBC";
  const initialSampleId = searchParams.get("sampleId") || "";

  const patientsQuery = usePatients();
  const doctorsQuery = useDoctors();
  const samplesQuery = useSamples();
  const templatesQuery = useReportTemplates();

  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [selectedTestName, setSelectedTestName] = useState(initialTestCode);
  const [customTestName, setCustomTestName] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [accession, setAccession] = useState(`LIS-${Date.now().toString().slice(-6)}`);
  const [barcode, setBarcode] = useState(`E${Date.now().toString().slice(-7)}`);
  const [sampleType, setSampleType] = useState("Whole Blood EDTA");
  const [reportStatus, setReportStatus] = useState<"Draft" | "Pending Review" | "Approved">("Pending Review");
  const [pathologist, setPathologist] = useState("Dr. Pranjali Sejwal, MBBS, MD Pathology");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Current Patient
  const currentPatient = useMemo(() => {
    return (patientsQuery.data ?? []).find((p: Patient) => p.id === selectedPatientId || p.patientCode === selectedPatientId);
  }, [patientsQuery.data, selectedPatientId]);

  // Set default doctor from patient when patient changes
  useEffect(() => {
    if (currentPatient?.referringDoctorId && !selectedDoctorId) {
      setSelectedDoctorId(currentPatient.referringDoctorId);
    }
  }, [currentPatient, selectedDoctorId]);

  // If initialPatientId not set, pick first patient
  useEffect(() => {
    if (!selectedPatientId && (patientsQuery.data ?? []).length > 0) {
      setSelectedPatientId(patientsQuery.data![0].id);
    }
  }, [patientsQuery.data, selectedPatientId]);

  // Load Test Schema
  const activeTestSchema: TestDefinition = useMemo(() => {
    const testKey = selectedTestName === "CUSTOM" ? customTestName : selectedTestName;
    return getTestParameterSchema(testKey);
  }, [selectedTestName, customTestName]);

  // Parameter values state
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  // Reset or initialize parameter values whenever test schema changes
  useEffect(() => {
    const initialVals: Record<string, string> = {};
    activeTestSchema.parameters.forEach(param => {
      initialVals[param.id] = param.defaultValue || "";
    });
    setParamValues(initialVals);
    setSampleType(activeTestSchema.sampleType);
    
    // Set default interpretation
    if (activeTestSchema.interpretations && activeTestSchema.interpretations.length > 0) {
      setComments(activeTestSchema.interpretations[0].content);
    } else {
      setComments("Clinical findings correlate with biological laboratory standards. Routine follow-up suggested.");
    }
  }, [activeTestSchema]);

  const handleValueChange = (paramId: string, val: string) => {
    setParamValues(prev => ({ ...prev, [paramId]: val }));
  };

  const handleQuickFillNormal = () => {
    const normalVals: Record<string, string> = {};
    activeTestSchema.parameters.forEach(p => {
      normalVals[p.id] = p.defaultValue || "";
    });
    setParamValues(normalVals);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) {
      setErrorMessage("Please select a patient to generate the report.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Build results payload
      const resultsPayload = activeTestSchema.parameters.map(param => {
        const value = paramValues[param.id] ?? "";
        const evalResult = evaluateParameterFlag(value, param);
        return {
          parameter: param.name,
          value,
          unit: param.unit,
          referenceRange: param.referenceRange,
          abnormalFlag: evalResult.isAbnormal,
          criticalFlag: evalResult.isCritical,
          comments: param.method ? `Method: ${param.method}` : undefined,
        };
      });

      const reportPayload = {
        patientId: currentPatient.id,
        doctorId: selectedDoctorId || undefined,
        accession,
        barcode,
        sampleType,
        testName: activeTestSchema.name,
        testCode: activeTestSchema.code,
        department: activeTestSchema.department,
        status: reportStatus,
        pathologist,
        comments,
        results: resultsPayload,
        testIds: [activeTestSchema.name],
      };

      const response = await reportApi.create(reportPayload as any);
      const createdId = response.data.id;
      router.push(`/reports/${createdId}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate diagnostic report. Please check the inputs.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <PageHeader
        title="Generate Diagnostic Report"
        description="Select patient, load dynamic test parameters, enter technician values, and release verified diagnostic report."
        action={
          <Link href="/reports">
            <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
              Back to Reports
            </Button>
          </Link>
        }
      />

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Patient & Test Order Selection */}
        <Card className="border border-[color:var(--line)] shadow-xs">
          <div className="border-b border-[color:var(--line)] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-lg bg-[#e8f4f7] text-[#176b87] font-bold">
                1
              </div>
              <div>
                <h3 className="text-base font-bold text-[color:var(--foreground)]">Patient & Test Association</h3>
                <p className="text-xs text-[color:var(--muted)]">Select registered patient and laboratory test to perform.</p>
              </div>
            </div>
            {currentPatient && (
              <StatusBadge tone="success" size="sm">
                Patient Verified: {currentPatient.name}
              </StatusBadge>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <UIField label="Select Patient" name="patientId" required>
              <Select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="" disabled>Select patient...</option>
                {(patientsQuery.data ?? []).map((p: Patient) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.patientCode}) · {p.age}Y/{p.sex}
                  </option>
                ))}
              </Select>
            </UIField>

            <UIField label="Select Diagnostic Test" name="testCode" required>
              <Select
                value={selectedTestName}
                onChange={(e) => setSelectedTestName(e.target.value)}
              >
                <optgroup label="Standard Diagnostic Profiles">
                  {STANDARD_TEST_CATALOG.map(t => (
                    <option key={t.code} value={t.code}>
                      {t.name} ({t.department})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Custom / Other">
                  <option value="CUSTOM">Other / Custom Lab Test</option>
                </optgroup>
              </Select>
            </UIField>

            <UIField label="Referring Doctor" name="doctorId">
              <Select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              >
                <option value="">Self / Clinical OPD</option>
                {(doctorsQuery.data ?? []).map((d: Doctor) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialty})
                  </option>
                ))}
              </Select>
            </UIField>
          </div>

          {selectedTestName === "CUSTOM" && (
            <div className="mt-4 pt-4 border-t border-[color:var(--line)]">
              <UIField label="Custom Test Name" name="customTestName" required>
                <Input
                  value={customTestName}
                  onChange={(e) => setCustomTestName(e.target.value)}
                  placeholder="e.g. Vitamin D-25 Hydroxy, Serum Ferritin, CRP Quantitative"
                />
              </UIField>
            </div>
          )}

          {/* Auto-populated Patient & Sample Overview Box */}
          {currentPatient && (
            <div className="mt-6 rounded-xl bg-[color:var(--surface-2)]/60 border border-[color:var(--line)] p-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[color:var(--muted)] block">Patient Code</span>
                  <span className="font-mono font-bold text-[color:var(--foreground)]">{currentPatient.patientCode}</span>
                </div>
                <div>
                  <span className="text-[color:var(--muted)] block">Age / Gender</span>
                  <span className="font-semibold text-[color:var(--foreground)]">{currentPatient.age} Yrs / {currentPatient.sex}</span>
                </div>
                <div>
                  <span className="text-[color:var(--muted)] block">Contact Phone</span>
                  <span className="font-medium text-[color:var(--foreground)]">{currentPatient.phone}</span>
                </div>
                <div>
                  <span className="text-[color:var(--muted)] block">Sample Barcode</span>
                  <span className="font-mono font-bold text-[#176b87]">{barcode}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Step 2: Dynamic Test-Specific Parameters Table */}
        <Card className="border border-[color:var(--line)] shadow-xs overflow-hidden">
          <div className="border-b border-[color:var(--line)] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-lg bg-[#e8f4f7] text-[#176b87] font-bold">
                2
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[color:var(--foreground)]">
                    {activeTestSchema.name}
                  </h3>
                  <StatusBadge tone="info" size="sm">
                    {activeTestSchema.department}
                  </StatusBadge>
                </div>
                <p className="text-xs text-[color:var(--muted)]">
                  {activeTestSchema.parameters.length} test-specific parameters loaded dynamically. Enter observed patient values.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Sparkles size={14} />}
              onClick={handleQuickFillNormal}
              title="Pre-fill normal physiological values for quick testing"
            >
              Autofill Reference Normal
            </Button>
          </div>

          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-[color:var(--surface-2)] text-[11px] font-semibold uppercase tracking-[0.06em] text-[color:var(--muted)]">
                <tr>
                  <th className="px-6 py-3">Parameter / Analyte</th>
                  <th className="px-4 py-3">Observed Value</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Biological Ref. Interval</th>
                  <th className="px-4 py-3">Method & Instrument</th>
                  <th className="px-6 py-3 text-center">Status / Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--line)]">
                {activeTestSchema.parameters.map((param) => {
                  const val = paramValues[param.id] ?? "";
                  const evalResult = evaluateParameterFlag(val, param);

                  return (
                    <tr key={param.id} className="hover:bg-[color:var(--surface-2)]/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-[color:var(--foreground)]">{param.name}</span>
                      </td>
                      <td className="px-4 py-3.5 w-44">
                        {param.options ? (
                          <Select
                            value={val}
                            onChange={(e) => handleValueChange(param.id, e.target.value)}
                            className="h-9 text-sm"
                          >
                            {param.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            type="text"
                            value={val}
                            onChange={(e) => handleValueChange(param.id, e.target.value)}
                            placeholder="Enter value"
                            className={cn(
                              "h-9 font-mono font-medium",
                              evalResult.flag === "Critical" && "border-rose-500 bg-rose-50 text-rose-900 focus:ring-rose-300",
                              (evalResult.flag === "High" || evalResult.flag === "Low") && "border-amber-500 bg-amber-50 text-amber-900"
                            )}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[color:var(--muted)] font-mono">
                        {param.unit || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[color:var(--muted)]">
                        <span className="font-medium text-[color:var(--foreground)]">{param.referenceRange}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[color:var(--muted)]">
                        <p className="truncate max-w-[200px]">{param.method || "Standard Clinical Assay"}</p>
                        {param.machine && (
                          <p className="text-[10px] text-[color:var(--muted-2)] truncate max-w-[200px]">{param.machine}</p>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <StatusBadge tone={evalResult.tone} size="sm">
                          {evalResult.flag}
                        </StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Step 3: Clinical Interpretation & Signatory */}
        <Card className="border border-[color:var(--line)] shadow-xs">
          <div className="border-b border-[color:var(--line)] pb-4 mb-6 flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-[#e8f4f7] text-[#176b87] font-bold">
              3
            </div>
            <div>
              <h3 className="text-base font-bold text-[color:var(--foreground)]">Clinical Interpretation & Authorization</h3>
              <p className="text-xs text-[color:var(--muted)]">Diagnostic remarks, medical guidelines, and pathologist signatory.</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4 sm:col-span-2">
              <UIField 
                label="Clinical Interpretation & Diagnostic Remarks" 
                name="comments"
                hint="Pre-filled according to international diagnostic guidelines (ADA, NCEP, ICSH, KDIGO). Editable for custom patient observations."
              >
                <Textarea
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter clinical observations, peripheral smear notes, or differential diagnosis..."
                />
              </UIField>
            </div>

            <UIField label="Authorized Signatory Pathologist" name="pathologist" required>
              <Select
                value={pathologist}
                onChange={(e) => setPathologist(e.target.value)}
              >
                <option>Dr. Pranjali Sejwal, MBBS, MD Pathology</option>
                <option>Dr. Ananya Rao, MBBS, MD Pathology, Consultant Pathologist</option>
                <option>Dr. Preeti, MBBS, MD Biochemistry, Consultant Biochemist</option>
                <option>Dr. K. Menon, MD Clinical Pathology</option>
              </Select>
            </UIField>

            <UIField label="Report Release Status" name="reportStatus" required>
              <Select
                value={reportStatus}
                onChange={(e) => setReportStatus(e.target.value as any)}
              >
                <option value="Pending Review">Pending Review (Draft for Pathologist)</option>
                <option value="Approved">Approved & Released (Final Report)</option>
                <option value="Draft">Draft</option>
              </Select>
            </UIField>
          </div>

          {/* Submission Bar */}
          <div className="mt-8 pt-6 border-t border-[color:var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
              <ShieldCheck size={16} className="text-[#176b87]" />
              <span>Report will be cryptographically registered in LIMS database with unique Barcode & Report Number.</span>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/reports">
                <Button type="button" variant="ghost">Cancel</Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                leftIcon={<ClipboardCheck size={16} />}
              >
                Save & Generate Report
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
