"use client";
import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import {
  Bell, Building2, ClipboardList, FileSignature, FlaskConical, ListOrdered, Palette, Receipt, Ruler, Settings2, Shield, Globe2
} from "lucide-react";
import { DataTable } from "@/components/tables/DataTable";
import {
  Alert, Button, Card, Checkbox, Divider, Field as UIField, FormSection, Grid2, Grid3, Grid4, Input, KPICard, PageHeader, Select, StatusBadge, Switch, Tabs, Tag, Textarea, cn
} from "@/components/ui";
import {
  useLaboratorySettings, useNotificationSettings, useReferenceRangeMutations, useReferenceRanges, useReportSettings, useSystemPreferences, useUnitMutations, useUnits, useUpdateLaboratory, useUpdateNotificationSettings, useUpdateReportSettings, useUpdateSystemPreferences
} from "@/features/settings/hooks";
import type { NotificationSettings, ReferenceRange, SystemPreferences, UnitDefinition } from "@/types/domain";

const laboratorySchema = Yup.object({
  name: Yup.string().required("Laboratory name is required"),
  address: Yup.string().required("Address is required"),
  phone: Yup.string().required("Phone is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  website: Yup.string().url("Invalid URL"),
  accreditation: Yup.string(),
  licenseNumber: Yup.string(),
});

const reportSchema = Yup.object({
  header: Yup.string().required("Report header is required"),
  footer: Yup.string().required("Footer text is required"),
  signature: Yup.string(),
  reportNumberingPrefix: Yup.string().required("Prefix is required"),
  reportNumberingNext: Yup.number().positive("Must be positive").integer().required("Next number is required"),
  dateFormat: Yup.string().required("Date format is required"),
  showLogo: Yup.boolean(),
  showSignatory: Yup.boolean(),
  autoApprovePathologist: Yup.boolean(),
});

const rangeSchema = Yup.object({
  testCode: Yup.string().trim().required("Test code is required (e.g. CBC)"),
  testName: Yup.string().trim().required("Test name is required (e.g. Complete Blood Count)"),
  parameter: Yup.string().trim().required("Parameter name is required (e.g. Hemoglobin)"),
  gender: Yup.string().required("Please select gender option").oneOf(["Both", "Male", "Female"], "Invalid option"),
  ageMin: Yup.number().typeError("Min age must be a number").min(0, "Age cannot be negative"),
  ageMax: Yup.number().typeError("Max age must be a number").min(0, "Age cannot be negative"),
  minimum: Yup.number().typeError("Minimum reference value is required").required("Minimum value is required"),
  maximum: Yup.number().typeError("Maximum reference value is required").required("Maximum value is required"),
  unit: Yup.string().trim().required("Unit is required (e.g. g/dL)"),
  criticalLow: Yup.number().typeError("Must be a number").nullable(),
  criticalHigh: Yup.number().typeError("Must be a number").nullable(),
});

const unitSchema = Yup.object({
  code: Yup.string().trim().required("Unit code is required (e.g. mg/dL)"),
  name: Yup.string().trim().required("Full unit name is required (e.g. milligrams per deciliter)"),
  category: Yup.string().required("Please select category"),
  conversionFactor: Yup.number().typeError("Conversion factor must be a number").required("Conversion factor is required"),
  baseUnit: Yup.string().trim(),
});

export function SettingsPage() {
  const [tab, setTab] = useState("laboratory");
  const lab = useLaboratorySettings();
  const report = useReportSettings();
  const ranges = useReferenceRanges();
  const units = useUnits();
  const notifications = useNotificationSettings();
  const system = useSystemPreferences();

  const updateLab = useUpdateLaboratory();
  const updateReport = useUpdateReportSettings();
  const updateNotif = useUpdateNotificationSettings();
  const updateSystem = useUpdateSystemPreferences();
  const rangeMut = useReferenceRangeMutations();
  const unitMut = useUnitMutations();

  const [rangeForm, setRangeForm] = useState<{ open: boolean; id?: string; default?: Record<string, unknown> }>({ open: false });
  const [unitForm, setUnitForm] = useState<{ open: boolean; id?: string; default?: Record<string, unknown> }>({ open: false });

  const rangeColumns = useMemo(() => {
    const h = createColumnHelper<ReferenceRange>();
    return [
      h.accessor("testCode", { header: "Test Code", cell: ({ getValue }) => <Tag tone="info">{getValue()}</Tag> }),
      h.accessor("testName", { header: "Test", cell: ({ getValue }) => <span className="font-semibold">{getValue()}</span> }),
      h.accessor("parameter", { header: "Parameter" }),
      h.accessor("gender", { header: "Gender", cell: ({ getValue }) => <StatusBadge tone="neutral" size="sm">{getValue()}</StatusBadge> }),
      h.accessor("ageMin", { header: "Age Range", cell: ({ row }) => `${row.original.ageMin ?? 0} – ${row.original.ageMax ?? 99} y` }),
      h.accessor("minimum", {
        header: "Reference Range",
        cell: ({ row }) => (
          <div>
            <p className="font-mono font-semibold text-xs">{row.original.minimum} – {row.original.maximum} <span className="text-[color:var(--muted)] font-normal">{row.original.unit}</span></p>
            {(row.original.criticalLow || row.original.criticalHigh) && (
              <p className="text-[10px] text-[color:var(--danger)] mt-0.5">Crit: {row.original.criticalLow ?? "—"} / {row.original.criticalHigh ?? "—"}</p>
            )}
          </div>
        ),
      }),
      h.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setRangeForm({ open: true, id: row.original.id, default: { ...row.original } })}>Edit</Button>
            <Button size="sm" variant="ghost" className="text-[color:var(--danger)]" onClick={() => rangeMut.remove.mutate(row.original.id)}>Delete</Button>
          </div>
        ),
      }),
    ] as const;
  }, [rangeMut]);

  const unitColumns = useMemo(() => {
    const h = createColumnHelper<UnitDefinition>();
    return [
      h.accessor("code", { header: "Code", cell: ({ getValue }) => <span className="font-mono font-semibold">{getValue()}</span> }),
      h.accessor("name", { header: "Name" }),
      h.accessor("category", { header: "Category", cell: ({ getValue }) => <Tag tone="info">{getValue()}</Tag> }),
      h.accessor("baseUnit", { header: "Base", cell: ({ getValue }) => getValue() ? <span className="font-mono text-xs">{getValue()}</span> : "—" }),
      h.accessor("conversionFactor", { header: "Factor", cell: ({ getValue }) => getValue() ?? "—" }),
      h.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setUnitForm({ open: true, id: row.original.id, default: { ...row.original } })}>Edit</Button>
            <Button size="sm" variant="ghost" className="text-[color:var(--danger)]" onClick={() => unitMut.remove.mutate(row.original.id)}>Delete</Button>
          </div>
        ),
      }),
    ] as const;
  }, [unitMut]);

  const kpiData = [
    { label: "Reference Ranges", value: ranges.data?.length, icon: Ruler, tone: "info" as const },
    { label: "Units Defined", value: units.data?.length, icon: ListOrdered, tone: "success" as const },
    { label: "Active Alerts", value: Object.values(notifications.data ?? {} as NotificationSettings).filter(v => v === true).length, icon: Bell, tone: "warning" as const },
    { label: "Departments", value: 8, icon: Building2, tone: "info" as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description="Configure laboratory information, reports, reference data, notifications, and system preferences. Changes here apply across the LIS workspace."
        action={<Button variant="outline" leftIcon={<Shield size={15} />}>Access control</Button>}
      />

      <Grid4>
        {kpiData.map((k, i) => (
          <KPICard key={i} label={k.label} value={k.value} icon={k.icon} iconTone={k.tone} isLoading={ranges.isLoading || units.isLoading || notifications.isLoading} />
        ))}
      </Grid4>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: "laboratory", label: "Laboratory", icon: Building2 },
          { key: "report", label: "Reports", icon: Receipt },
          { key: "ranges", label: "Reference Ranges", badge: ranges.data ? String(ranges.data.length) : undefined },
          { key: "units", label: "Units", badge: units.data ? String(units.data.length) : undefined },
          { key: "notifications", label: "Notifications", icon: Bell },
          { key: "system", label: "System", icon: Settings2 },
        ] as unknown as Parameters<typeof Tabs>[0]["tabs"]}
      />

      {tab === "laboratory" && lab.data && (
        <div className="max-w-4xl space-y-5">
          <FormSection title="Laboratory Information" description="This information appears on reports, invoices, and public-facing documentation.">
            <Formik initialValues={lab.data} validationSchema={laboratorySchema} enableReinitialize onSubmit={(values) => updateLab.mutate(values)}>
              {({ errors, touched }) => (
                <Form className="space-y-5">
                  <Grid2>
                    <UIField label="Laboratory Name" name="name" required error={touched.name ? errors.name as string : undefined}>
                      <Field name="name" as={Input} />
                    </UIField>
                    <UIField label="Accreditation / Certification" name="accreditation">
                      <Field name="accreditation" as={Input} placeholder="e.g. NABL, CAP, ISO 15189" />
                    </UIField>
                    <UIField label="License Number" name="licenseNumber">
                      <Field name="licenseNumber" as={Input} />
                    </UIField>
                    <UIField label="Website" name="website" hint="Optional public website">
                      <Field name="website" as={Input} placeholder="https://…" />
                    </UIField>
                    <UIField label="Phone" name="phone" required error={touched.phone ? errors.phone as string : undefined}>
                      <Field name="phone" as={Input} />
                    </UIField>
                    <UIField label="Email" name="email" required error={touched.email ? errors.email as string : undefined}>
                      <Field name="email" as={Input} type="email" />
                    </UIField>
                  </Grid2>
                  <UIField label="Full Address" name="address" required error={touched.address ? errors.address as string : undefined}>
                    <Field name="address" as={Textarea} rows={3} />
                  </UIField>
                  <Divider />
                  <div className="flex justify-between items-center">
                    <Alert tone="info" title="Branding preview">
                      Laboratory header and logo should be uploaded in the Reports tab once storage is available.
                    </Alert>
                    <Button type="submit" variant="primary" loading={updateLab.isPending}>Save Laboratory Info</Button>
                  </div>
                </Form>
              )}
            </Formik>
          </FormSection>
        </div>
      )}

      {tab === "report" && report.data && (
        <div className="max-w-4xl space-y-5">
          <FormSection title="Report Appearance" description="Configure the visual layout, numbering, and signatory behavior for pathology reports.">
            <Formik initialValues={report.data} validationSchema={reportSchema} enableReinitialize onSubmit={(values) => updateReport.mutate(values)}>
              {({ errors, touched, values }) => (
                <Form className="space-y-5">
                  <Grid2>
                    <UIField label="Report Header Text" name="header" required error={touched.header ? errors.header as string : undefined}>
                      <Field name="header" as={Input} />
                    </UIField>
                    <UIField label="Date Format" name="dateFormat" required>
                      <Field name="dateFormat" as={Select}>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </Field>
                    </UIField>
                    <UIField label="Report Number Prefix" name="reportNumberingPrefix" required>
                      <Field name="reportNumberingPrefix" as={Input} placeholder="RPT-" />
                    </UIField>
                    <UIField label="Next Report Number" name="reportNumberingNext" required error={touched.reportNumberingNext ? errors.reportNumberingNext as string : undefined}>
                      <Field name="reportNumberingNext" as={Input} type="number" />
                    </UIField>
                  </Grid2>
                  <UIField label="Footer Text" name="footer" required error={touched.footer ? errors.footer as string : undefined}>
                    <Field name="footer" as={Textarea} rows={2} />
                  </UIField>
                  <UIField label="Default Pathologist Signature" name="signature" hint="Appears when Show Signatory is enabled">
                    <Field name="signature" as={Textarea} rows={3} placeholder="Dr. Ananya Rao, MD (Pathology)\nConsultant Pathologist" />
                  </UIField>
                  <div className="grid gap-4 rounded-xl bg-[color:var(--surface-2)] p-4 sm:grid-cols-3">
                    <Checkbox checked={!!values.showLogo} onChange={(v) => (values.showLogo = v)} id="s1" label="Display logo on reports" />
                    <Checkbox checked={!!values.showSignatory} onChange={(v) => (values.showSignatory = v)} id="s2" label="Include pathologist signature block" />
                    <Checkbox checked={!!values.autoApprovePathologist} onChange={(v) => (values.autoApprovePathologist = v)} id="s3" label="Auto-approve pathologist results" />
                  </div>
                  <Divider />
                  <div className="flex justify-end gap-2">
                    <Button type="submit" variant="primary" loading={updateReport.isPending} leftIcon={<FileSignature size={15} />}>
                      Save Report Settings
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </FormSection>
        </div>
      )}

      {tab === "ranges" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[color:var(--muted)]">Define reference ranges for each parameter by gender and age band. These are used during result validation to flag abnormal and critical values.</p>
            <Button variant="primary" size="sm" leftIcon={<FlaskConical size={14} />} onClick={() => setRangeForm({ open: true, default: { testCode: "", testName: "", parameter: "", gender: "Both", minimum: 0, maximum: 0, unit: "" } })}>
              Add Reference Range
            </Button>
          </div>
          <DataTable
            columns={[...rangeColumns]}
            data={ranges.data}
            isLoading={ranges.isLoading}
            isError={ranges.isError}
            pageSize={12}
            searchable
            searchPlaceholder="Search tests, parameters…"
            emptyTitle="No reference ranges defined"
            emptyDescription="All patient results will validate against ranges added here."
            emptyIcon={Ruler}
          />
        </div>
      )}

      {tab === "units" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[color:var(--muted)]">Manage the catalog of units of measurement used across all test panels. Include optional base-unit conversions for later calculation support.</p>
            <Button variant="primary" size="sm" leftIcon={<ListOrdered size={14} />} onClick={() => setUnitForm({ open: true, default: { code: "", name: "", category: "General", baseUnit: "", conversionFactor: 1 } })}>
              Add Unit
            </Button>
          </div>
          <DataTable
            columns={[...unitColumns]}
            data={units.data}
            isLoading={units.isLoading}
            isError={units.isError}
            pageSize={12}
            searchable
            searchPlaceholder="Search units…"
            emptyTitle="No units defined"
            emptyDescription="Define common units and their conversions."
            emptyIcon={ListOrdered}
          />
        </div>
      )}

      {tab === "notifications" && notifications.data && (
        <div className="max-w-4xl space-y-5">
          <FormSection title="Alert Channels" description="Configure how the system should notify users of critical events.">
            <div className="grid gap-5 sm:grid-cols-3">
              {(["emailNotifications", "smsNotifications", "pushNotifications"] as const).map((k) => (
                <div key={k} className="rounded-xl border border-[color:var(--line)] p-4">
                  <Switch
                    checked={!!notifications.data?.[k]}
                    onChange={(v) => updateNotif.mutate({ [k]: v } as Partial<NotificationSettings>)}
                    label={k === "emailNotifications" ? "Email" : k === "smsNotifications" ? "SMS" : "In-app / Push"}
                  />
                  <p className="mt-2 text-xs text-[color:var(--muted)]">
                    {k === "emailNotifications" && "Deliver alerts to user email addresses"}
                    {k === "smsNotifications" && "Text alerts for mobile registered users"}
                    {k === "pushNotifications" && "Desktop and browser notifications"}
                  </p>
                </div>
              ))}
            </div>
          </FormSection>
          <FormSection title="Alert Triggers" description="Enable the scenarios that should actively generate notifications.">
            <div className="grid gap-5 sm:grid-cols-2">
              {([
                ["criticalResultAlerts", "Critical results", "Flagged panic values must be acknowledged by clinical staff", "danger" as const],
                ["pendingReportAlerts", "Pending reports", "Daily digest of reports awaiting pathologist approval", "warning" as const],
                ["qcAlerts", "QC violations", "Westgard rules and out-of-range QC failures", "warning" as const],
                ["inventoryAlerts", "Low inventory", "Stock below reorder threshold triggers replenishment", "info" as const],
                ["appointmentReminders", "Appointment reminders", "Pre-visit reminders for patients and doctors", "info" as const],
              ] as const).map(([k, title, desc, tone]) => (
                <div key={k} className={cn(
                  "rounded-xl border p-4 flex items-start justify-between gap-4",
                  tone === "danger" ? "border-[color:var(--danger-line)] bg-[color:var(--danger-bg)]/30"
                  : tone === "warning" ? "border-[color:var(--warning-line)] bg-[color:var(--warning-bg)]/30"
                  : "border-[color:var(--info-line)] bg-[color:var(--info-bg)]/30"
                )}>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">{desc}</p>
                  </div>
                  <Switch
                    checked={!!notifications.data?.[k as keyof NotificationSettings]}
                    onChange={(v) => updateNotif.mutate({ [k]: v } as Partial<NotificationSettings>)}
                  />
                </div>
              ))}
            </div>
          </FormSection>
        </div>
      )}

      {tab === "system" && system.data && (
        <div className="max-w-4xl space-y-5">
          <FormSection title="System Preferences" description="Workspace display and behavior defaults per user profile.">
            <Formik initialValues={system.data} enableReinitialize onSubmit={(values) => updateSystem.mutate(values)}>
              {({ values }) => (
                <Form className="space-y-5">
                  <Grid3>
                    <UIField label="Timezone" name="timezone">
                      <Field name="timezone" as={Select}>
                        {["Asia/Kolkata", "Asia/Singapore", "Asia/Dubai", "Europe/London", "America/New_York", "Australia/Sydney"].map(tz => <option key={tz}>{tz}</option>)}
                      </Field>
                    </UIField>
                    <UIField label="Date Format" name="dateFormat">
                      <Field name="dateFormat" as={Select}>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </Field>
                    </UIField>
                    <UIField label="Time Format" name="timeFormat">
                      <Field name="timeFormat" as={Select}>
                        <option value="12h">12-hour (AM/PM)</option>
                        <option value="24h">24-hour</option>
                      </Field>
                    </UIField>
                    <UIField label="Language" name="language">
                      <Field name="language" as={Select}>
                        {["English", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi"].map(l => <option key={l}>{l}</option>)}
                      </Field>
                    </UIField>
                    <UIField label="Default Landing Page" name="defaultLandingPage">
                      <Field name="defaultLandingPage" as={Select}>
                        {["/dashboard", "/patients", "/samples", "/reports", "/results", "/quality-control"].map(p => <option key={p}>{p}</option>)}
                      </Field>
                    </UIField>
                    <UIField label="Results Per Page" name="resultsPerPage" hint="Tables across the application">
                      <Field name="resultsPerPage" as={Input} type="number" />
                    </UIField>
                  </Grid3>
                  <div className="grid gap-5 rounded-xl bg-[color:var(--surface-2)] p-4 sm:grid-cols-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold inline-flex items-center gap-2"><Palette size={15} /> Theme</p>
                        <p className="mt-1 text-xs text-[color:var(--muted)]">Display mode</p>
                      </div>
                      <div className="flex rounded-lg border p-0.5">
                        {(["light", "dark", "system"] as const).map((t) => (
                          <button type="button" key={t} onClick={() => { values.theme = t; }} className={cn("h-8 px-3 rounded-md text-xs font-semibold", values.theme === t ? "bg-[color:var(--surface)]" : "text-[color:var(--muted)]")}>
                            {t[0].toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe2 size={18} className="text-[color:var(--brand-600)]" />
                      <div>
                        <p className="text-sm font-semibold">i18n ready</p>
                        <p className="text-xs text-[color:var(--muted)]">Translation placeholders in place</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield size={18} className="text-[color:var(--success)]" />
                      <div>
                        <p className="text-sm font-semibold">Secure headers</p>
                        <p className="text-xs text-[color:var(--muted)]">Ready for HTTPS / CSP deployment</p>
                      </div>
                    </div>
                  </div>
                  <Divider />
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" loading={updateSystem.isPending}>Save Preferences</Button>
                  </div>
                </Form>
              )}
            </Formik>
          </FormSection>
        </div>
      )}

      {rangeForm.open && (
        <div className="fixed inset-0 z-[55] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setRangeForm({ open: false })}>
          <div className="w-full max-w-xl rounded-[var(--radius-xl)] border bg-[color:var(--surface)] p-6 shadow-[var(--shadow-lg)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-5">{rangeForm.id ? "Edit Reference Range" : "Add Reference Range"}</h3>
            <Formik
              initialValues={(rangeForm.default ?? { testCode: "", testName: "", parameter: "", gender: "Both", ageMin: "", ageMax: "", minimum: "", maximum: "", unit: "", criticalLow: "", criticalHigh: "" }) as Record<string, unknown>}
              validationSchema={rangeSchema}
              validateOnMount={false}
              validateOnChange={true}
              validateOnBlur={true}
              enableReinitialize
              onSubmit={(values) => {
                const payload = {
                  ...values,
                  ageMin: Number(values.ageMin) || 0,
                  ageMax: Number(values.ageMax) || 120,
                  minimum: Number(values.minimum) || 0,
                  maximum: Number(values.maximum) || 0,
                  criticalLow: values.criticalLow !== "" ? Number(values.criticalLow) : undefined,
                  criticalHigh: values.criticalHigh !== "" ? Number(values.criticalHigh) : undefined,
                };
                if (rangeForm.id) {
                  rangeMut.update.mutate({ id: rangeForm.id, input: payload as never });
                } else {
                  rangeMut.create.mutate(payload as never);
                }
                setRangeForm({ open: false });
              }}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-4">
                  <Grid2>
                    <UIField label="Test Code" name="testCode" required error={touched.testCode ? errors.testCode as string : undefined}>
                      <Field name="testCode" as={Input} placeholder="e.g. CBC" />
                    </UIField>
                    <UIField label="Test Name" name="testName" required error={touched.testName ? errors.testName as string : undefined}>
                      <Field name="testName" as={Input} placeholder="e.g. Complete Blood Count" />
                    </UIField>
                    <UIField label="Parameter" name="parameter" required error={touched.parameter ? errors.parameter as string : undefined}>
                      <Field name="parameter" as={Input} placeholder="e.g. Hemoglobin" />
                    </UIField>
                    <UIField label="Gender" name="gender" required error={touched.gender ? errors.gender as string : undefined}>
                      <Field name="gender" as={Select}>
                        <option value="Both">Both (All Genders)</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </Field>
                    </UIField>
                    <UIField label="Minimum Age (Years)" name="ageMin" error={touched.ageMin ? errors.ageMin as string : undefined}>
                      <Field name="ageMin" as={Input} type="number" placeholder="e.g. 18" />
                    </UIField>
                    <UIField label="Maximum Age (Years)" name="ageMax" error={touched.ageMax ? errors.ageMax as string : undefined}>
                      <Field name="ageMax" as={Input} type="number" placeholder="e.g. 65" />
                    </UIField>
                    <UIField label="Minimum Value" name="minimum" required error={touched.minimum ? errors.minimum as string : undefined}>
                      <Field name="minimum" as={Input} type="number" step="any" placeholder="e.g. 13.0" />
                    </UIField>
                    <UIField label="Maximum Value" name="maximum" required error={touched.maximum ? errors.maximum as string : undefined}>
                      <Field name="maximum" as={Input} type="number" step="any" placeholder="e.g. 17.0" />
                    </UIField>
                    <UIField label="Unit" name="unit" required error={touched.unit ? errors.unit as string : undefined}>
                      <Field name="unit" as={Input} placeholder="e.g. g/dL" />
                    </UIField>
                    <UIField label="Critical Low (Alert)" name="criticalLow" error={touched.criticalLow ? errors.criticalLow as string : undefined}>
                      <Field name="criticalLow" as={Input} type="number" step="any" placeholder="e.g. 7.0" />
                    </UIField>
                  </Grid2>
                  <UIField label="Critical High (Alert)" name="criticalHigh" error={touched.criticalHigh ? errors.criticalHigh as string : undefined}>
                    <Field name="criticalHigh" as={Input} type="number" step="any" placeholder="e.g. 20.0" />
                  </UIField>
                  <div className="flex justify-end gap-2 pt-2 border-t border-[color:var(--line)]">
                    <Button type="button" variant="ghost" onClick={() => setRangeForm({ open: false })}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={isSubmitting || (rangeForm.id ? rangeMut.update.isPending : rangeMut.create.isPending)}>Save</Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {unitForm.open && (
        <div className="fixed inset-0 z-[55] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setUnitForm({ open: false })}>
          <div className="w-full max-w-lg rounded-[var(--radius-xl)] border bg-[color:var(--surface)] p-6 shadow-[var(--shadow-lg)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-5">{unitForm.id ? "Edit Unit" : "Add Unit"}</h3>
            <Formik
              initialValues={(unitForm.default ?? { code: "", name: "", category: "General", baseUnit: "", conversionFactor: 1 }) as Record<string, unknown>}
              validationSchema={unitSchema}
              validateOnMount={false}
              validateOnChange={true}
              validateOnBlur={true}
              enableReinitialize
              onSubmit={(values) => {
                const payload = {
                  ...values,
                  conversionFactor: Number(values.conversionFactor) || 1,
                };
                if (unitForm.id) {
                  unitMut.update.mutate({ id: unitForm.id, input: payload as never });
                } else {
                  unitMut.create.mutate(payload as never);
                }
                setUnitForm({ open: false });
              }}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-4">
                  <Grid2>
                    <UIField label="Unit Code" name="code" required hint="Short identifier (e.g. mg/dL)" error={touched.code ? errors.code as string : undefined}>
                      <Field name="code" as={Input} placeholder="e.g. mg/dL" />
                    </UIField>
                    <UIField label="Full Name" name="name" required error={touched.name ? errors.name as string : undefined}>
                      <Field name="name" as={Input} placeholder="e.g. milligrams per deciliter" />
                    </UIField>
                    <UIField label="Category" name="category" required error={touched.category ? errors.category as string : undefined}>
                      <Field name="category" as={Select}>
                        {["General", "Hematology", "Biochemistry", "Electrolytes", "Enzymes", "Immunology", "Microbiology"].map(c => <option key={c} value={c}>{c}</option>)}
                      </Field>
                    </UIField>
                    <UIField label="Conversion Factor" name="conversionFactor" hint="Base-unit multiplier" error={touched.conversionFactor ? errors.conversionFactor as string : undefined}>
                      <Field name="conversionFactor" as={Input} type="number" step="any" placeholder="1" />
                    </UIField>
                  </Grid2>
                  <UIField label="Base Unit" name="baseUnit" hint="e.g. mmol/L for conversion reference">
                    <Field name="baseUnit" as={Input} placeholder="e.g. mmol/L" />
                  </UIField>
                  <div className="flex justify-end gap-2 pt-2 border-t border-[color:var(--line)]">
                    <Button type="button" variant="ghost" onClick={() => setUnitForm({ open: false })}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={isSubmitting || (unitForm.id ? unitMut.update.isPending : unitMut.create.isPending)}>Save</Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
}
