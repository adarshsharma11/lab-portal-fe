"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  AlertCircle, CheckCircle2, ChevronRight, ClipboardCheck, FileText, 
  FlaskConical, Sparkles, User, ArrowLeft, Plus, ShieldCheck, Microscope
} from "lucide-react";
import { PageHeader, Card, Button, Input, Select, Textarea, Field as UIField, StatusBadge, cn, SearchableCombobox, ComboboxOption } from "@/components/ui/index";
import { usePatients, useDoctors } from "@/features/crud/hooks";
import { useSamples } from "@/features/laboratory/hooks";
import { useTestMasters } from "@/features/test-masters/hooks";
import { useReportTemplates } from "@/features/reports/hooks";
import { reportApi } from "@/mocks/services/resources";
import { 
  STANDARD_TEST_CATALOG, 
  getTestParameterSchema, 
  evaluateParameterFlag,
  type ParameterDefinition,
  type TestDefinition
} from "@/lib/laboratory/test-parameter-definitions";
import type { Patient, Sample, Doctor, TestMaster } from "@/types/domain";

export function ReportGeneratorWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get("patientId") || "";
  const initialTestCode = searchParams.get("testCode") || "CBC";
  const initialSampleId = searchParams.get("sampleId") || "";

  const patientsQuery = usePatients();
  const doctorsQuery = useDoctors();
  const samplesQuery = useSamples();
  const testMastersQuery = useTestMasters("", undefined, 500);
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

  // Combobox options
  const patientComboboxOptions = useMemo<ComboboxOption[]>(() => {
    const patients = (patientsQuery.data ?? []) as Patient[];
    return patients.map((p) => ({
      value: p.id,
      label: p.name,
      secondary: `Code: ${p.patientCode || p.id} · Age: ${p.age} · ${p.sex || ""}`,
      badge: p.phone,
      extra: p,
    }));
  }, [patientsQuery.data]);

  const doctorComboboxOptions = useMemo<ComboboxOption[]>(() => {
    const doctors = (doctorsQuery.data ?? []) as Doctor[];
    return doctors.map((d) => ({
      value: d.id,
      label: d.name,
      secondary: d.specialty || "Practitioner",
      badge: d.phone,
      extra: d,
    }));
  }, [doctorsQuery.data]);

  const testMasterComboboxOptions = useMemo<ComboboxOption[]>(() => {
    const dbTests = (testMastersQuery.data ?? []) as TestMaster[];
    
    // Combine standard schemas and all DB test masters
    const dbOptions: ComboboxOption[] = dbTests.map((t) => ({
      value: t.code || t.name,
      label: t.name,
      secondary: `Code: ${t.code} · Rate: ₹${t.rate} · MRP: ₹${t.mrp}`,
      badge: t.department,
      extra: t,
    }));

    return dbOptions;
  }, [testMastersQuery.data]);

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
        description="Select patient, load dynamic test parameters from Master Database, enter technician values, and release verified diagnostic report."
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
                <p className="text-xs text-[color:var(--muted)]">Search registered patient and select diagnostic test from Master Database.</p>
              </div>
            </div>
            {currentPatient && (
              <StatusBadge tone="success" size="sm">
                Patient Verified: {currentPatient.name}
              </StatusBadge>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <UIField label="Select Registered Patient" name="patientId" required hint="Type name, patient code, phone">
              <SearchableCombobox
                options={patientComboboxOptions}
                value={selectedPatientId}
                onChange={(val) => setSelectedPatientId(val)}
                placeholder="Search patient..."
                searchPlaceholder="Search by name, code, phone..."
                loading={patientsQuery.isLoading}
              />
            </UIField>

            <UIField label="Diagnostic Test (Master Database)" name="testCode" required hint="Search 1,000+ tests by name or code">
              <SearchableCombobox
                options={testMasterComboboxOptions}
                value={selectedTestName}
                onChange={(val, opt) => {
                  setSelectedTestName(val);
                  if (opt?.extra?.sampleType) {
                    setSampleType(opt.extra.sampleType);
                  }
                }}
                placeholder="Search test name or code..."
                searchPlaceholder="Type test name (e.g. Calcium, CBC, Glucose)..."
                loading={testMastersQuery.isLoading}
              />
            </UIField>

            <UIField label="Referring Doctor" name="doctorId" hint="Select practitioner">
              <SearchableCombobox
                options={doctorComboboxOptions}
                value={selectedDoctorId}
                onChange={(val) => setSelectedDoctorId(val)}
                placeholder="Select consulting doctor..."
                searchPlaceholder="Search doctor..."
                loading={doctorsQuery.isLoading}
              />
            </UIField>
          </div>

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
              leftIcon={<Sparkles size={14} className="text-[#176b87]" />}
              onClick={handleQuickFillNormal}
            >
              Fill Reference Normals
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[color:var(--line)] bg-[color:var(--surface-2)]/80 text-[color:var(--muted)] uppercase font-semibold">
                  <th className="py-3 px-4">Test Parameter</th>
                  <th className="py-3 px-4 w-44">Observed Value</th>
                  <th className="py-3 px-4">Units</th>
                  <th className="py-3 px-4">Biological Reference Interval</th>
                  <th className="py-3 px-4">Flag / Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--line)]">
                {activeTestSchema.parameters.map((param) => {
                  const val = paramValues[param.id] ?? "";
                  const evalResult = evaluateParameterFlag(val, param);

                  return (
                    <tr 
                      key={param.id} 
                      className={cn(
                        "hover:bg-[color:var(--surface-2)]/40 transition-colors",
                        evalResult.isCritical && "bg-rose-50/50",
                        evalResult.isAbnormal && !evalResult.isCritical && "bg-amber-50/40"
                      )}
                    >
                      <td className="py-3.5 px-4 font-semibold text-[color:var(--foreground)]">
                        <div>{param.name}</div>
                        {param.method && (
                          <span className="text-[10px] text-[color:var(--muted)]">
                            {param.method}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <Input
                          value={val}
                          onChange={(e) => handleValueChange(param.id, e.target.value)}
                          placeholder="e.g. value..."
                          className={cn(
                            "h-8 text-xs font-mono font-medium",
                            evalResult.isCritical && "border-rose-500 ring-1 ring-rose-500",
                            evalResult.isAbnormal && !evalResult.isCritical && "border-amber-500"
                          )}
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[color:var(--muted)]">
                        {param.unit || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-[color:var(--muted)] font-mono">
                        {param.referenceRange}
                      </td>
                      <td className="py-3.5 px-4">
                        {evalResult.isCritical ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                            <AlertCircle size={12} /> CRITICAL
                          </span>
                        ) : evalResult.isAbnormal ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                            {evalResult.flag === "High" ? "↑ HIGH" : "↓ LOW"}
                          </span>
                        ) : val ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-medium">
                            <CheckCircle2 size={12} /> Normal
                          </span>
                        ) : (
                          <span className="text-[color:var(--muted)] text-[11px]">Pending entry</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Step 3: Specimen & Clinical Impression */}
        <Card className="border border-[color:var(--line)] shadow-xs">
          <div className="border-b border-[color:var(--line)] pb-4 mb-6 flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-[#e8f4f7] text-[#176b87] font-bold">
              3
            </div>
            <div>
              <h3 className="text-base font-bold text-[color:var(--foreground)]">Clinical Impression & Pathologist Release</h3>
              <p className="text-xs text-[color:var(--muted)]">Enter doctor comments, specimen details, and signatory sign-off.</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <UIField label="Accession Number" name="accession" required>
              <Input value={accession} onChange={(e) => setAccession(e.target.value)} />
            </UIField>

            <UIField label="Sample Specimen Type" name="sampleType" required>
              <Input value={sampleType} onChange={(e) => setSampleType(e.target.value)} />
            </UIField>

            <UIField label="Release Status" name="reportStatus" required>
              <Select
                value={reportStatus}
                onChange={(e: any) => setReportStatus(e.target.value)}
              >
                <option value="Draft">Draft (Technician Entry)</option>
                <option value="Pending Review">Pending Review (Quality Check)</option>
                <option value="Approved">Approved (Final Signed Report)</option>
              </Select>
            </UIField>

            <div className="sm:col-span-3">
              <UIField label="Signing Pathologist" name="pathologist" required>
                <Input value={pathologist} onChange={(e) => setPathologist(e.target.value)} />
              </UIField>
            </div>

            <div className="sm:col-span-3">
              <UIField label="Clinical Interpretation & Pathological Comments" name="comments">
                <Textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter medical notes, clinical correlation advice, or laboratory remarks..."
                />
              </UIField>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 pt-6 border-t border-[color:var(--line)] flex items-center justify-between">
            <Link href="/reports">
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              leftIcon={<ShieldCheck size={18} />}
            >
              Generate & Save Diagnostic Report
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
