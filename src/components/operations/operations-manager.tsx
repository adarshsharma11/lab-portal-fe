"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Field, Form, Formik } from "formik";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as Yup from "yup";
import { Printer, ArrowLeft, Eye, Edit3, Trash2, Plus, AlertTriangle, Sparkles, FlaskConical, Receipt, ShieldCheck, FileText, CheckCircle2, X } from "lucide-react";
import { PageHeader, StatusBadge, Button, Input, Select, Field as UIField, Grid2, Card, cn, SearchableCombobox, ComboboxOption } from "@/components/ui/index";
import { useAppointment, useAppointments, useCreateAppointment, useCreateInvoice, useDeleteAppointment, useDeleteInvoice, useInvoice, useInvoices, useUpdateAppointment, useUpdateInvoice } from "@/features/operations/hooks";
import { useTestMasters } from "@/features/test-masters/hooks";
import { useEntityList } from "@/features/crud/hooks";
import { useLaboratorySettings } from "@/features/settings/hooks";
import { authService } from "@/lib/auth/auth-service";
import { SubParameterSelect } from "@/components/laboratory/SubParameterSelect";
import { getSubParametersForTest } from "@/lib/laboratory/test-parameter-definitions";
import type { Appointment, Doctor, Franchise, Invoice, Patient, TestMaster, UserRole } from "@/types/domain";

const referringDoctorValue = (name: string) => `Referred by Doctor – ${name}`;

function findDoctorByRef(doctors: readonly Doctor[], ref?: string | null) {
  if (!ref) return null;
  return doctors.find((d) => d.id === ref || d.name === ref || referringDoctorValue(d.name) === ref) || null;
}

interface FormFieldDef {
  name: string;
  label: string;
  type: "text" | "select" | "date" | "time" | "number";
  placeholder?: string;
  required?: boolean;
  hint?: string;
  colSpan?: 1 | 2;
  options?: readonly { label: string; value: string }[];
}

const appointmentFields: readonly FormFieldDef[] = [
  { name: "patientId", label: "Select Patient", type: "text", placeholder: "Search registered patient...", required: true, hint: "Search by patient name, code, phone" },
  { name: "doctorId", label: "Consulting Doctor", type: "text", placeholder: "Select doctor...", required: true, hint: "Search consulting doctor" },
  { name: "date", label: "Appointment Date", type: "date", required: true },
  { name: "time", label: "Appointment Time", type: "time", required: true },
  {
    name: "type",
    label: "Appointment Type",
    type: "select",
    required: true,
    options: [
      { label: "Select appointment type", value: "" },
      { label: "Clinical Consultation", value: "Consultation" },
      { label: "Sample Collection / Phlebotomy", value: "Sample Collection" },
      { label: "Routine Health Checkup", value: "Routine Checkup" },
      { label: "Follow-up Review", value: "Follow-up" },
      { label: "Diagnostic Report Discussion", value: "Diagnostic Review" },
    ],
  },
  {
    name: "status",
    label: "Appointment Status",
    type: "select",
    required: true,
    options: [
      { label: "Select status", value: "" },
      { label: "Upcoming (Confirmed)", value: "Upcoming" },
      { label: "In-Progress (Patient checked in)", value: "In-Progress" },
      { label: "Completed (Visit finished)", value: "Completed" },
      { label: "Cancelled (Patient/Doctor cancelled)", value: "Cancelled" },
    ],
  },
  { name: "appointmentLink", label: "Telehealth / Virtual Link", type: "text", placeholder: "https://meet.google.com/xyz-abc", colSpan: 2 },
  { name: "createdBy", label: "Created By (Staff Name)", type: "text", placeholder: "Reception Desk / Dr. Ananya Rao", required: true, colSpan: 2 },
];

const invoiceFields: readonly FormFieldDef[] = [
  { name: "billNumber", label: "Bill / Invoice Number", type: "text", placeholder: "INV-100452 (auto-generated if empty)" },
  { name: "billDate", label: "Invoice Date", type: "date", required: true },
  { name: "patientId", label: "Select Patient", type: "text", placeholder: "Search registered patient...", required: true, hint: "Patient details auto-fill on select" },
  { name: "doctorId", label: "Referring Doctor / Business Source", type: "text", placeholder: "Select doctor or referral source...", required: true, hint: "E.g. Doctor, Blood Collection Centre, Direct / Walk-in" },
  { name: "itemDescription", label: "Diagnostic Test / Service (Master Database)", type: "text", placeholder: "Search test name from database...", required: true, hint: "Search test catalog to auto-populate rate and price", colSpan: 2 },
  { name: "itemMrp", label: "Unit Rate / MRP (₹)", type: "number", placeholder: "850", required: true, hint: "Auto-filled from test master" },
  { name: "discount", label: "Discount (₹)", type: "number", placeholder: "0" },
  {
    name: "paymentStatus",
    label: "Payment Status",
    type: "select",
    required: true,
    options: [
      { label: "Select payment status", value: "" },
      { label: "Paid", value: "Paid" },
      { label: "Pending", value: "Pending" },
    ],
  },
  { name: "addedBy", label: "Biller / Staff Name", type: "text", placeholder: "Finance Desk / Dr. Ananya Rao", required: true },
];

const appointmentSchema = Yup.object({
  patientId: Yup.string().trim().required("Patient selection is required"),
  doctorId: Yup.string().trim().required("Doctor selection is required"),
  date: Yup.string().required("Appointment date is required"),
  time: Yup.string().required("Appointment time is required"),
  type: Yup.string().required("Please select an appointment type"),
  status: Yup.string().required("Please select an appointment status").oneOf(["Upcoming", "Completed", "Cancelled", "In-Progress"], "Invalid status"),
  appointmentLink: Yup.string().trim().url("Please enter a valid URL (. https://meet.google.com/...)"),
  createdBy: Yup.string().trim().required("Staff / Creator name is required"),
});

const invoiceSchema = Yup.object({
  billNumber: Yup.string().trim(),
  patientId: Yup.string().trim().required("Patient selection is required"),
  doctorId: Yup.string().trim().required("Referring doctor / business source is required"),
  billDate: Yup.string().required("Invoice date is required"),
  itemDescription: Yup.string().trim().required("Test or item description is required"),
  itemQuantity: Yup.number().typeError("Quantity must be a number").min(1, "Quantity must be at least 1").default(1),
  itemMrp: Yup.number().typeError("Price must be a number").required("Price is required").min(0, "Price cannot be negative"),
  discount: Yup.number().typeError("Discount must be a number").min(0, "Discount cannot be negative").default(0),
  sgst: Yup.number().typeError("SGST must be a number").min(0, "Tax cannot be negative").default(0),
  cgst: Yup.number().typeError("CGST must be a number").min(0, "Tax cannot be negative").default(0),
  paymentStatus: Yup.string().required("Please select payment status").oneOf(["Pending", "Paid"], "Invalid payment status"),
  addedBy: Yup.string().trim().required("Biller staff name is required"),
});

function InvoicePrintView({
  invoice,
  labData,
  patient,
  doctor,
  layout,
}: {
  invoice: Invoice;
  labData?: any;
  patient?: Patient | null;
  doctor?: Doctor | null;
  layout: "a4" | "thermal";
}) {
  const labName = labData?.name || "BL Dignostic LIMS";
  const labLogo = labData?.logo;
  const labAddress = labData?.address || "142, Healthcare Avenue, Bengaluru, Karnataka 560001, India";
  const labPhone = labData?.phone || "+91 80 4455 6677";
  const labEmail = labData?.email || "lab@pathologylis.example";
  const labAccreditation = labData?.accreditation || "NABL ACCREDITED ISO 15189:2012";
  const labLicense = labData?.licenseNumber || "KAR-LAB-2024-1482";

  const patientName = patient?.name || (invoice as any).patient?.name || invoice.patientId || "Patient";
  const patientCode = patient?.patientCode || (invoice as any).patient?.patientCode || invoice.patientId || "PID-001";
  const patientAgeGender = patient?.age ? `${patient.age} Y / ${patient.sex || "—"}` : ((invoice as any).patient?.age ? `${(invoice as any).patient.age} Y / ${(invoice as any).patient?.sex || "—"}` : "—");
  const patientPhone = patient?.phone || (invoice as any).patient?.phone || "—";
  const doctorName = doctor?.name || (invoice as any).doctor?.name || invoice.doctorId || "Self / Consultant";

  let rawItems: any = invoice.items;
  if (typeof rawItems === "string") {
    try {
      rawItems = JSON.parse(rawItems);
    } catch {
      rawItems = [];
    }
  }
  const items: any[] = Array.isArray(rawItems) && rawItems.length > 0
    ? rawItems
    : [{ description: (invoice as any).itemDescription || "Diagnostic Pathology Services", quantity: Number((invoice as any).itemQuantity) || 1, mrp: Number((invoice as any).itemMrp) || Number(invoice.total) || 450 }];

  const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.mrp), 0);
  const discount = Number(invoice.discount || 0);
  const taxes = Number(invoice.sgst || 0) + Number(invoice.cgst || 0);
  const grandTotal = Number(invoice.total || (subtotal - discount + taxes));

  if (layout === "thermal") {
    return (
      <div 
        id="printable-bill-thermal"
        className="w-[80mm] max-w-[320px] mx-auto bg-white text-black p-4 font-mono text-[11px] leading-tight border border-dashed border-slate-300 rounded shadow-sm print:border-0 print:shadow-none print:p-0 print:w-full print:max-w-none"
        style={{ color: "#000000", backgroundColor: "#ffffff" }}
      >
        {/* Thermal Header */}
        <div className="text-center pb-2 border-b border-dashed border-slate-400">
          {labLogo ? (
            <img 
              src={labLogo} 
              alt={labName} 
              className="max-h-12 max-w-[140px] mx-auto object-contain mb-1" 
              crossOrigin="anonymous"
            />
          ) : (
            <div className="font-black text-sm uppercase tracking-wide">{labName}</div>
          )}
          <p className="font-bold text-xs mt-0.5">{labName}</p>
          <p className="text-[10px] text-slate-700">{labAddress}</p>
          <p className="text-[10px] text-slate-700">Phone: {labPhone}</p>
          <div className="inline-block border border-black px-1.5 py-0.5 font-bold text-[10px] mt-1 uppercase">
            *** CASH / PATIENT RECEIPT ***
          </div>
        </div>

        {/* Thermal Bill Meta */}
        <div className="py-2 text-[10px] space-y-0.5 border-b border-dashed border-slate-400">
          <div className="flex justify-between">
            <span>Bill No: <b>{invoice.billNumber}</b></span>
            <span>Date: {invoice.billDate}</span>
          </div>
          <div>Patient: <b>{patientName}</b></div>
          <div className="flex justify-between">
            <span>PID: {patientCode}</span>
            <span>Age/Sex: {patientAgeGender}</span>
          </div>
          <div>Phone: {patientPhone}</div>
          <div>Ref Doctor: {doctorName}</div>
        </div>

        {/* Thermal Items List */}
        <div className="py-2 border-b border-dashed border-slate-400">
          <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-slate-300">
            <span className="flex-1">Test / Description</span>
            <span className="w-8 text-center">Qty</span>
            <span className="w-16 text-right">Amount</span>
          </div>
          <div className="space-y-1.5 pt-1.5">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[10px] items-start">
                <span className="flex-1 pr-1 font-medium">{item.description}</span>
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="w-16 text-right font-bold">₹{(item.quantity * item.mrp).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Thermal Financial Totals */}
        <div className="py-2 text-[10px] space-y-1 border-b border-dashed border-slate-400">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between font-semibold">
              <span>Discount:</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          {taxes > 0 && (
            <div className="flex justify-between">
              <span>Taxes:</span>
              <span>₹{taxes.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-black border-t border-black pt-1">
            <span>NET AMOUNT:</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold pt-0.5">
            <span>PAYMENT STATUS:</span>
            <span className="uppercase">{invoice.paymentStatus || "PAID"}</span>
          </div>
        </div>

        {/* Thermal Footer */}
        <div className="pt-2 text-center text-[9px] text-slate-700 space-y-0.5">
          <p>Billed by: {invoice.addedBy || "Billing Desk"}</p>
          <p className="font-bold">Thank you for choosing {labName}!</p>
          <p>*** Computer Generated Receipt ***</p>
        </div>
      </div>
    );
  }

  // Standard A4 Layout
  return (
    <article 
      id="printable-bill-a4"
      className="max-w-4xl mx-auto bg-white text-slate-900 border border-slate-200 rounded-xl p-8 sm:p-10 shadow-sm print:border-0 print:shadow-none print:p-0 print:max-w-none print:w-full font-sans"
      style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
    >
      {/* A4 Header Section */}
      <header className="border-b-2 border-[#176b87] pb-5 mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-xl bg-[#176b87] text-white shrink-0 overflow-hidden shadow-sm">
            {labLogo ? (
              <img 
                src={labLogo} 
                alt={labName} 
                className="size-full object-contain bg-white p-1 rounded-xl"
                crossOrigin="anonymous"
              />
            ) : (
              <FlaskConical size={30} color="#ffffff" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#176b87]" style={{ color: "#176b87" }}>
              {labName}
            </h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Clinical Diagnostics & Pathology Reference Laboratory
            </p>
            <p className="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">
              {labAddress}
            </p>
          </div>
        </div>

        <div className="text-right sm:text-right shrink-0 flex flex-col items-start sm:items-end text-xs text-slate-600 space-y-1">
          <div className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <ShieldCheck size={14} className="text-emerald-700" /> {labAccreditation}
          </div>
          <p><span className="text-slate-400 font-medium">Licence:</span> <span className="font-mono font-semibold text-slate-800">{labLicense}</span></p>
          <p><span className="text-slate-400 font-medium">Phone:</span> <span className="font-semibold text-slate-800">{labPhone}</span></p>
          <p><span className="text-slate-400 font-medium">Email:</span> <span className="text-slate-800">{labEmail}</span></p>
        </div>
      </header>

      {/* Invoice Type & Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#e8f4f7] border border-[#bce0e9] rounded-lg px-4 py-2.5 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#176b87]">Tax Invoice / Diagnostic Bill</span>
          <p className="text-lg font-black text-slate-900 font-mono leading-tight">{invoice.billNumber}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-slate-500 block text-[11px]">Invoice Date</span>
            <span className="font-bold text-slate-800">{invoice.billDate}</span>
          </div>
          <div className="border-l border-slate-300 pl-3">
            <StatusBadge tone={invoice.paymentStatus === "Paid" ? "success" : invoice.paymentStatus === "Partially Paid" ? "warning" : "pending"} size="md">
              {invoice.paymentStatus || "Paid"}
            </StatusBadge>
          </div>
        </div>
      </div>

      {/* Patient & Doctor Meta Grid */}
      <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 mb-6 text-xs text-slate-700">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4">
          <div>
            <span className="text-slate-500 text-[11px] block">Patient Name</span>
            <span className="font-bold text-slate-900 text-sm">{patientName}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Patient ID / UHID</span>
            <span className="font-mono font-bold text-[#176b87]">{patientCode}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Age / Gender</span>
            <span className="font-semibold text-slate-800">{patientAgeGender}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Contact Number</span>
            <span className="font-semibold text-slate-800">{patientPhone}</span>
          </div>

          <div className="sm:col-span-2 border-t border-slate-200/80 pt-2.5">
            <span className="text-slate-500 text-[11px] block">Referring Doctor</span>
            <span className="font-bold text-slate-900">{doctorName}</span>
          </div>
          <div className="sm:col-span-2 border-t border-slate-200/80 pt-2.5">
            <span className="text-slate-500 text-[11px] block">Billed By / Desk Officer</span>
            <span className="font-semibold text-slate-800">{invoice.addedBy || "Billing Desk"}</span>
          </div>
        </div>
      </section>

      {/* Itemized Test / Services Table */}
      <section className="mb-6">
        <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Investigation / Service Description</th>
              <th className="py-2.5 px-3 text-center w-16">Qty</th>
              <th className="py-2.5 px-3 text-right w-28">Rate (₹)</th>
              <th className="py-2.5 px-3 text-right w-32">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/50" : ""}>
                <td className="py-3 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                <td className="py-3 px-3 font-semibold text-slate-900">{item.description}</td>
                <td className="py-3 px-3 text-center text-slate-700 font-mono">{item.quantity}</td>
                <td className="py-3 px-3 text-right font-mono text-slate-700">₹{item.mrp.toFixed(2)}</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{(item.quantity * item.mrp).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Financial Summary & Settlement Grid */}
      <section className="grid sm:grid-cols-2 gap-6 items-start mb-8">
        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 text-xs text-slate-600 space-y-2">
          <p className="font-bold text-slate-800 text-xs uppercase tracking-wide">Terms & Payment Information</p>
          <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-slate-600">
            <li>Reports can be collected online using your Patient ID.</li>
            <li>This is a computer-generated tax invoice and requires no physical signature.</li>
            <li>All samples are processed in accordance with NABL / ISO 15189 standards.</li>
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 p-4 bg-white text-xs space-y-2.5">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">₹{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-amber-700 font-semibold">
              <span>Discount Applied:</span>
              <span className="font-mono">-₹{discount.toFixed(2)}</span>
            </div>
          )}
          {taxes > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Taxes (SGST + CGST):</span>
              <span className="font-mono font-semibold">₹{taxes.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline border-t-2 border-slate-900 pt-3 text-base font-black text-slate-900">
            <span>Grand Total:</span>
            <span className="text-xl font-mono text-[#176b87]">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Signatory & Verification Block */}
      <footer className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-slate-500">
        <div>
          <p className="text-[11px]">Date Printed: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
          <p className="text-[10px] text-slate-400">Generated via BL Diagnostics LIMS Workspace</p>
        </div>

        <div className="text-right sm:text-right">
          <div className="inline-block border-b border-slate-400 w-48 mb-1.5" />
          <p className="font-bold text-slate-800 text-xs">Authorized Signatory</p>
          <p className="text-[11px] text-slate-500">{labName}</p>
        </div>
      </footer>
    </article>
  );
}

export function OperationsManager({ kind, path }: Readonly<{ kind: "appointments" | "billing"; path: readonly string[] }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPatientId = searchParams?.get("patientId") || searchParams?.get("patient") || "";
  const urlPatientCode = searchParams?.get("patientCode") || "";
  const urlDoctorId = searchParams?.get("doctorId") || "";
  const urlFranchiseId = searchParams?.get("franchiseId") || "";

  const isAppointment = kind === "appointments";
  const [currentRole, setCurrentRole] = useState<UserRole | undefined>(undefined);
  const [currentSession, setCurrentSession] = useState<{ role?: UserRole; franchiseId?: string; id?: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [activePrintLayout, setActivePrintLayout] = useState<"a4" | "thermal">("a4");
  const [printModalInvoice, setPrintModalInvoice] = useState<Invoice | null>(null);
  const [proceedToReport, setProceedToReport] = useState(false);
  const [selectedBillingTests, setSelectedBillingTests] = useState<Array<{ name: string; code: string; mrp: number; rate: number; department?: string; subParameters?: string[] }>>([
    { name: "", code: "", mrp: 0, rate: 0, subParameters: [] }
  ]);

  useEffect(() => {
    const s = authService.getSession();
    if (s) {
      setCurrentSession({ role: s.role, franchiseId: s.franchiseId, id: s.id });
      if (s.role) setCurrentRole(s.role);
    }
  }, []);

  const lab = useLaboratorySettings();
  const isAdmin = currentRole === "Admin" || currentRole === "Administrator";
  const isFranchise = currentRole === "Franchise";
  const isTechnician = currentRole === "Technician";
  const isBilling = currentRole === "Billing";
  const canManage = isAdmin || isFranchise || isTechnician || isBilling;
  const franchisesList = useEntityList<Franchise>("franchises");
  const patientsList = useEntityList<Patient>("patients");
  const doctorsList = useEntityList<Doctor>("doctors");
  const testMastersQuery = useTestMasters("", undefined, 2500);

  const printBillDirectly = (layout: "a4" | "thermal") => {
    setActivePrintLayout(layout);
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const franchiseOptions = useMemo(() => {
    const franchises = (franchisesList.data ?? []) as Franchise[];
    return [
      { label: "Select Franchise...", value: "" },
      ...franchises.map((f) => ({
        label: `${f.name} (${f.code || f.city || "Branch"})`,
        value: f.id,
      })),
      { label: "+ Other / Add New Franchise", value: "__add_franchise__" },
    ];
  }, [franchisesList.data]);

  const getPatientComboboxOptions = (formFranchiseId?: string): ComboboxOption[] => {
    const allPatients = (patientsList.data ?? []) as Patient[];
    let filtered = allPatients;
    if (isAdmin) {
      if (formFranchiseId && formFranchiseId !== "__add_franchise__") {
        filtered = allPatients.filter((p) => p.franchiseId === formFranchiseId);
      } else {
        filtered = [];
      }
    } else if (currentSession?.franchiseId) {
      filtered = allPatients.filter((p) => !p.franchiseId || p.franchiseId === currentSession.franchiseId);
    }

    return filtered.map((p) => ({
      value: p.id,
      label: p.name,
      secondary: `Code: ${p.patientCode || p.id} · Age: ${p.age} · ${p.sex || ""}`,
      badge: p.phone,
      extra: p,
    }));
  };

  const getDoctorComboboxOptions = (formFranchiseId?: string): ComboboxOption[] => {
    const allDoctors = (doctorsList.data ?? []) as Doctor[];
    let filtered = allDoctors;
    if (isAdmin) {
      if (formFranchiseId && formFranchiseId !== "__add_franchise__") {
        filtered = allDoctors.filter((d) => !d.franchiseId || d.franchiseId === formFranchiseId);
      }
    } else if (currentSession?.franchiseId) {
      filtered = allDoctors.filter((d) => !d.franchiseId || d.franchiseId === currentSession.franchiseId);
    }

    const doctorItems: ComboboxOption[] = filtered.map((d) => ({
      value: referringDoctorValue(d.name),
      label: referringDoctorValue(d.name),
      secondary: d.specialty ? `${d.specialty} · ${d.city || "Practitioner"}` : "Practitioner",
      badge: d.phone,
      extra: d,
    }));

    const businessSources: ComboboxOption[] = [
      {
        value: "Direct / Walk-in",
        label: "Direct / Walk-in (Self Referral)",
        secondary: "Standard OPD walk-in patient",
        badge: "Direct",
      },
      {
        value: "Referred by Blood Collection Centre",
        label: "Referred by Blood Collection Centre",
        secondary: "Collection kiosk / phlebotomy centre",
        badge: "Collection Hub",
      },
      {
        value: "Referred by Health Camp / Outreach",
        label: "Referred by Health Camp / Outreach",
        secondary: "Community screening / corporate camp",
        badge: "Outreach",
      },
    ];

    return [...businessSources, ...doctorItems];
  };

  const testMasterComboboxOptions = useMemo<ComboboxOption[]>(() => {
    const tests = testMastersQuery.data ?? [];
    return tests.map((t) => ({
      value: t.name,
      label: t.name,
      secondary: `Code: ${t.code} · Rate: ₹${t.rate} · MRP: ₹${t.mrp}`,
      badge: `₹${t.mrp || t.rate}`,
      extra: t,
    }));
  }, [testMastersQuery.data]);

  const appointments = useAppointments();
  const invoices = useInvoices();
  const isNew = path[0] === "new";
  const id = isNew ? "" : path[0];
  const edit = path[1] === "edit";

  const appointment = useAppointment(isAppointment && path[0] && path[0] !== "new" ? path[0] : "");
  const invoice = useInvoice(!isAppointment && path[0] && path[0] !== "new" ? path[0] : "");
  
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();

  const list = isAppointment ? appointments.data : invoices.data;

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    if (isAppointment) {
      await deleteAppointment.mutateAsync(confirmDeleteId);
    } else {
      await deleteInvoice.mutateAsync(confirmDeleteId);
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
          title={isAppointment ? "Appointments" : "Billing & Invoices"} 
          description={isAppointment ? "Coordinate patient visits and clinical consultations." : "Manage invoices, payments, and laboratory charges."} 
          action={
            <Link href={`/${kind}/new`}>
              <Button variant="primary" leftIcon={<Plus size={16} />}>New {isAppointment ? "appointment" : "invoice"}</Button>
            </Link>
          } 
        />
        <div className="overflow-x-auto rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-[color:var(--line)] text-xs uppercase text-[color:var(--muted)]">
              <tr>
                <th className="pb-3">{isAppointment ? "Patient" : "Bill number"}</th>
                <th className="pb-3">{isAppointment ? "Date / time" : "Patient"}</th>
                {isAdmin && <th className="pb-3">Franchise</th>}
                <th className="pb-3">Status</th>
                <th className="pb-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(list ?? []).map((row: any) => (
                <tr className="border-b border-[color:var(--line)] last:border-b-0 hover:bg-[color:var(--surface-2)]" key={row.id}>
                  <td className="py-3.5 font-semibold">{"billNumber" in row ? row.billNumber : row.patientId === "pat-01" ? "Maya Srinivasan" : row.patient?.name || row.patientId}</td>
                  <td className="py-3.5">{"billDate" in row ? row.patient?.name || row.patientId : `${row.date} · ${row.time}`}</td>
                  {isAdmin && (
                    <td className="py-3.5">
                      <span className="inline-flex items-center rounded-md bg-[#e8f4f7] px-2 py-0.5 text-xs font-semibold text-[#176b87]">
                        {row.franchise?.name || row.franchise?.code || "Central Lab"}
                      </span>
                    </td>
                  )}
                  <td className="py-3.5">
                    <StatusBadge tone={("paymentStatus" in row ? row.paymentStatus === "Paid" : row.status === "Upcoming" || row.status === "Completed") ? "success" : "warning"}>
                      {"paymentStatus" in row ? row.paymentStatus : row.status}
                    </StatusBadge>
                  </td>
                  <td className="py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link href={`/${kind}/${row.id}`}>
                        <Button size="sm" variant="ghost" leftIcon={<Eye size={13} />}>View</Button>
                      </Link>
                      {!isAppointment && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          leftIcon={<Printer size={13} />}
                          onClick={() => {
                            setPrintModalInvoice(row);
                          }}
                        >
                          Print
                        </Button>
                      )}
                      {canManage && (
                        <>
                          <Link href={`/${kind}/${row.id}/edit`}>
                            <Button size="sm" variant="secondary" leftIcon={<Edit3 size={13} />}>Edit</Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="danger-outline" 
                            leftIcon={<Trash2 size={13} />}
                            onClick={() => setConfirmDeleteId(row.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Print Bill Modal */}
        {printModalInvoice && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm overflow-y-auto print:p-0">
            {/* Print styles */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  size: ${activePrintLayout === "thermal" ? "80mm auto" : "A4 portrait"};
                  margin: ${activePrintLayout === "thermal" ? "0mm" : "8mm"};
                }
                body {
                  background: #ffffff !important;
                  color: #000000 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .sidebar-layout aside,
                .sidebar-layout header,
                .no-print-children,
                .print-hide,
                button,
                nav {
                  display: none !important;
                }
                #modal-printable-invoice-section {
                  display: block !important;
                  visibility: visible !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
              }
            `}} />

            <div className="relative w-full max-w-4xl rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-2xl my-8 print:border-0 print:shadow-none print:p-0 print:my-0 print:max-w-none">
              <div className="flex items-center justify-between border-b border-[color:var(--line)] pb-4 mb-5 print-hide">
                <div className="flex items-center gap-2">
                  <div className="grid size-9 place-items-center rounded-xl bg-[#176b87] text-white">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[color:var(--foreground)]">Print Bill / Tax Invoice</h3>
                    <p className="text-xs text-[color:var(--muted)]">Invoice #{printModalInvoice.billNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Format Selector */}
                  <div className="flex rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-2)] p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setActivePrintLayout("a4")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
                        activePrintLayout === "a4" ? "bg-[#176b87] text-white font-semibold shadow-xs" : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                      )}
                    >
                      <FileText size={13} /> A4 Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePrintLayout("thermal")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
                        activePrintLayout === "thermal" ? "bg-[#176b87] text-white font-semibold shadow-xs" : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                      )}
                    >
                      <Receipt size={13} /> Thermal (80mm)
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer size={14} />}
                    onClick={() => printBillDirectly("a4")}
                  >
                    Print A4
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Receipt size={14} />}
                    onClick={() => printBillDirectly("thermal")}
                  >
                    Print Thermal (80mm)
                  </Button>
                  <button
                    type="button"
                    onClick={() => setPrintModalInvoice(null)}
                    className="p-1.5 text-[color:var(--muted)] hover:text-[color:var(--foreground)] rounded-lg hover:bg-[color:var(--surface-2)]"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Printable Invoice Area */}
              <div id="modal-printable-invoice-section" className="overflow-y-auto max-h-[70vh] print:max-h-none print:overflow-visible">
                <InvoicePrintView
                  invoice={printModalInvoice}
                  labData={lab.data}
                  patient={((patientsList.data ?? []).find((p: any) => p.id === printModalInvoice.patientId || p.patientCode === printModalInvoice.patientId || p.name === printModalInvoice.patientId) || (printModalInvoice as any).patient) as Patient}
                  doctor={((doctorsList.data ?? []).find((d: any) => d.id === printModalInvoice.doctorId || d.name === printModalInvoice.doctorId) || (printModalInvoice as any).doctor) as Doctor}
                  layout={activePrintLayout}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[color:var(--line)] pt-4 mt-5 print-hide">
                <Button variant="ghost" onClick={() => setPrintModalInvoice(null)}>
                  Close
                </Button>
                <Button variant="outline" leftIcon={<Printer size={15} />} onClick={() => printBillDirectly("a4")}>
                  Print A4
                </Button>
                <Button variant="primary" leftIcon={<Receipt size={15} />} onClick={() => printBillDirectly("thermal")}>
                  Print Thermal (80mm)
                </Button>
              </div>
            </div>
          </div>
        )}

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
                  <p className="text-xs text-[color:var(--muted)]">This will delete the {isAppointment ? "appointment" : "invoice"} from database.</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-[color:var(--muted)] leading-relaxed">
                Are you sure you want to permanently delete this {isAppointment ? "appointment record" : "invoice"}? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-2 border-t border-[color:var(--line)] pt-4">
                <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  loading={isAppointment ? deleteAppointment.isPending : deleteInvoice.isPending} 
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
    const rawRecord = (isAppointment ? appointment.data : invoice.data) as Record<string, any> | undefined;

    // Find target patient if preloaded via URL query param
    const targetPatient = (isNew && (urlPatientId || urlPatientCode) && patientsList.data)
      ? ((patientsList.data as Patient[]).find(p => p.id === urlPatientId || p.patientCode === urlPatientId || (urlPatientCode && p.patientCode === urlPatientCode)) || null)
      : null;

    const patientDoctorId = targetPatient?.referringDoctorId || (targetPatient as Patient & { referringDoctor?: { id?: string } } | null)?.referringDoctor?.id;
    const resolvedDoctorObj = findDoctorByRef(doctorsList.data ?? [], urlDoctorId || patientDoctorId);
    const initialDoctorValue = resolvedDoctorObj ? referringDoctorValue(resolvedDoctorObj.name) : "";

    const initialValues = isNew
      ? isAppointment
        ? { 
            patientId: targetPatient ? targetPatient.id : (urlPatientId || ""), 
            doctorId: initialDoctorValue, 
            date: new Date().toISOString().slice(0, 10), 
            time: "10:00", 
            type: "Consultation", 
            status: "Upcoming", 
            appointmentLink: "", 
            createdBy: "Reception Desk", 
            franchiseId: targetPatient?.franchiseId || urlFranchiseId || "" 
          }
        : { 
            billNumber: targetPatient?.patientCode || urlPatientCode || (urlPatientId.startsWith("BL-") ? urlPatientId : "") || "", 
            patientId: targetPatient ? targetPatient.id : (urlPatientId || ""), 
            doctorId: initialDoctorValue, 
            billDate: new Date().toISOString().slice(0, 10), 
            itemDescription: "", 
            itemQuantity: 1, 
            itemMrp: "", 
            discount: 0, 
            sgst: 0, 
            cgst: 0, 
            paymentStatus: "Paid", 
            addedBy: "Finance Desk", 
            franchiseId: targetPatient?.franchiseId || urlFranchiseId || "" 
          }
      : isAppointment
      ? {
          patientId: rawRecord?.patientId ?? "",
          doctorId: rawRecord?.doctorId ?? "",
          date: rawRecord?.date ?? "",
          time: rawRecord?.time ?? "",
          type: rawRecord?.type ?? "",
          status: rawRecord?.status ?? "",
          appointmentLink: rawRecord?.appointmentLink ?? "",
          createdBy: rawRecord?.createdBy ?? "",
          franchiseId: rawRecord?.franchiseId ?? "",
        }
      : {
          billNumber: rawRecord?.billNumber ?? "",
          patientId: rawRecord?.patientId ?? "",
          doctorId: rawRecord?.doctorId ?? "",
          billDate: rawRecord?.billDate ?? "",
          itemDescription: rawRecord?.items?.[0]?.description ?? "",
          itemQuantity: rawRecord?.items?.[0]?.quantity ?? 1,
          itemMrp: rawRecord?.items?.[0]?.mrp ?? "",
          discount: rawRecord?.discount ?? 0,
          sgst: rawRecord?.sgst ?? 0,
          cgst: rawRecord?.cgst ?? 0,
          paymentStatus: rawRecord?.paymentStatus ?? "Paid",
          addedBy: rawRecord?.addedBy ?? "",
          franchiseId: rawRecord?.franchiseId ?? "",
        };

    const baseFields = isAppointment ? appointmentFields : invoiceFields;
    const fields: FormFieldDef[] = isAdmin
      ? [
          {
            name: "franchiseId",
            label: "Assign to Franchise",
            type: "select",
            required: true,
            options: franchiseOptions,
            hint: "Select which Franchise owns this record.",
            colSpan: 2,
          },
          ...baseFields,
        ]
      : [...baseFields];

    const schema = (isAppointment ? appointmentSchema : invoiceSchema).shape(
      isAdmin
        ? {
            franchiseId: Yup.string().trim().required("Please select which Franchise this record belongs to."),
          }
        : {}
    );

    const updateBillingTest = (
      idx: number, 
      testMaster: TestMaster | null, 
      testName: string, 
      setFieldValue: (field: string, value: any) => void
    ) => {
      const updated = [...selectedBillingTests];
      if (testMaster) {
        const defaultSubs = getSubParametersForTest(testMaster.name);
        updated[idx] = {
          name: testMaster.name,
          code: testMaster.code || "",
          mrp: testMaster.mrp || testMaster.rate || 0,
          rate: testMaster.rate || testMaster.mrp || 0,
          department: testMaster.department || "",
          subParameters: defaultSubs,
        };
      } else {
        const defaultSubs = getSubParametersForTest(testName);
        updated[idx] = {
          name: testName,
          code: "",
          mrp: 0,
          rate: 0,
          subParameters: defaultSubs,
        };
      }
      setSelectedBillingTests(updated);
      const totalMrp = updated.reduce((sum, t) => sum + (t.mrp || 0), 0);
      const descriptions = updated.map(t => t.name).filter(Boolean).join(", ");
      setFieldValue("itemMrp", totalMrp);
      setFieldValue("itemDescription", descriptions || "Diagnostic Tests");
    };

    const updateBillingSubParameters = (idx: number, subParams: string[]) => {
      const updated = [...selectedBillingTests];
      if (updated[idx]) {
        updated[idx] = {
          ...updated[idx],
          subParameters: subParams,
        };
        setSelectedBillingTests(updated);
      }
    };

    const addBillingTest = () => {
      setSelectedBillingTests(prev => [...prev, { name: "", code: "", mrp: 0, rate: 0, subParameters: [] }]);
    };

    const removeBillingTest = (idx: number, setFieldValue: (field: string, value: any) => void) => {
      const updated = selectedBillingTests.filter((_, i) => i !== idx);
      const finalTests = updated.length > 0 ? updated : [{ name: "", code: "", mrp: 0, rate: 0, subParameters: [] }];
      setSelectedBillingTests(finalTests);
      const totalMrp = finalTests.reduce((sum, t) => sum + (t.mrp || 0), 0);
      const descriptions = finalTests.map(t => t.name).filter(Boolean).join(", ");
      setFieldValue("itemMrp", totalMrp);
      setFieldValue("itemDescription", descriptions || "Diagnostic Tests");
    };

    const submit = async (values: typeof initialValues) => {
      setFormError(null);
      if (values.franchiseId === "__add_franchise__") {
        router.push("/franchises/new");
        return;
      }

      try {
        if (isAppointment) {
          if (isNew) {
            await createAppointment.mutateAsync({
              ...values,
              franchiseId: values.franchiseId || undefined,
            } as unknown as Omit<Appointment, "id">);
          } else {
            await updateAppointment.mutateAsync({ 
              id, 
              input: {
                ...values,
                franchiseId: values.franchiseId || undefined,
              } as Partial<Appointment> 
            });
          }
          router.push(`/${kind}`);
        } else {
          const v = values as unknown as { billNumber: string; patientId: string; doctorId: string; billDate: string; itemDescription: string; itemQuantity?: number; itemMrp: number; discount?: number; sgst?: number; cgst?: number; paymentStatus: string; addedBy: string; franchiseId?: string };
          const validTests = selectedBillingTests.filter(t => t.name.trim() !== "");
          const subtotal = validTests.length > 0 
            ? validTests.reduce((sum, t) => sum + (t.mrp || 0), 0)
            : (Number(v.itemMrp) || 0);
          const discountVal = Number(v.discount) || 0;
          const total = Math.max(0, subtotal - discountVal);

          const itemsPayload = validTests.length > 0
            ? validTests.map(t => ({
                description: t.name,
                code: t.code,
                quantity: 1,
                mrp: Number(t.mrp) || 0,
              }))
            : [{ description: v.itemDescription || "Diagnostic Pathology Services", quantity: 1, mrp: Number(v.itemMrp) || 0 }];

          const payload: Omit<Invoice, "id"> = {
            billNumber: v.billNumber || `INV-${Date.now().toString().slice(-6)}`,
            patientId: v.patientId,
            doctorId: v.doctorId,
            franchiseId: v.franchiseId || (currentSession?.franchiseId ?? undefined),
            billDate: v.billDate,
            items: itemsPayload,
            discount: discountVal,
            sgst: 0,
            cgst: 0,
            total,
            paymentStatus: v.paymentStatus as Invoice["paymentStatus"],
            addedBy: v.addedBy,
          };

          let createdInvoiceRes: any = null;
          if (isNew) {
            createdInvoiceRes = await createInvoice.mutateAsync(payload);
          } else {
            createdInvoiceRes = await updateInvoice.mutateAsync({ id, input: payload });
          }

          if (proceedToReport) {
            const selectedCodes = validTests.map(t => ({
              name: t.name,
              code: t.code || t.name,
              department: t.department || "General Pathology",
              mrp: t.mrp || 0,
              subParameters: t.subParameters && t.subParameters.length > 0 ? t.subParameters : undefined,
            }));
            const testsParam = encodeURIComponent(JSON.stringify(selectedCodes));
            const targetDocId = findDoctorByRef(doctorsList.data ?? [], v.doctorId)?.id || urlDoctorId || v.doctorId;
            const targetPatientCode = targetPatient?.patientCode || urlPatientCode || v.billNumber || "";
            const invId = (createdInvoiceRes as any)?.data?.id || (createdInvoiceRes as any)?.id || "";
            router.push(`/reports/new?patientId=${encodeURIComponent(v.patientId)}&patientCode=${encodeURIComponent(targetPatientCode)}&tests=${testsParam}&doctorId=${encodeURIComponent(targetDocId)}&franchiseId=${encodeURIComponent(v.franchiseId || "")}&invoiceId=${encodeURIComponent(invId)}`);
          } else {
            router.push(`/${kind}`);
          }
        }
      } catch (err: any) {
        const msg = err?.message || "Failed to save record. Please check the inputs.";
        setFormError(msg);
      }
    };

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader 
          title={isNew ? `New ${isAppointment ? "appointment" : "invoice"}` : `Edit ${isAppointment ? "appointment" : "invoice"}`} 
          description={
            !isAppointment
              ? "Generate patient diagnostic invoice. Select patient & multiple tests to auto-calculate charges from Test Master database."
              : "Coordinate patient clinical consultation and laboratory visits."
          }
          action={
            <Link href={`/${kind}`}>
              <Button variant="ghost">← Back to {isAppointment ? "appointments" : "billing"}</Button>
            </Link>
          }
        />

        {formError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-3 shadow-sm">
            <AlertTriangle size={20} className="shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold">Unable to save {isAppointment ? "appointment" : "invoice"}</p>
              <p className="text-xs text-rose-600 mt-0.5">{formError}</p>
            </div>
          </div>
        )}

        {!isAppointment && (
          <div className="flex items-center gap-2.5 rounded-[var(--radius)] border border-[#176b87]/20 bg-[#e8f4f7]/60 p-3 text-xs text-[#176b87]">
            <Sparkles size={16} className="shrink-0" />
            <span>
              <strong>Dynamic Master Billing:</strong> Add multiple tests from the catalog. Individual test MRPs automatically add up together in real time.
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
            {({ errors, touched, values, isSubmitting, setFieldValue }) => {
              // Calculate live total preview from multi tests
              const validTests = selectedBillingTests.filter(t => t.name.trim() !== "");
              const multiTestMrp = validTests.reduce((sum, t) => sum + (t.mrp || 0), 0);
              const liveSubtotal = validTests.length > 0 ? multiTestMrp : (Number(values.itemMrp) || 0);
              const disc = Number(values.discount) || 0;
              const liveGrandTotal = Math.max(0, liveSubtotal - disc);

              const patientOpts = getPatientComboboxOptions(values.franchiseId);
              const doctorOpts = (() => {
                const opts = getDoctorComboboxOptions(values.franchiseId);
                if (resolvedDoctorObj && initialDoctorValue && !opts.some((o) => o.value === initialDoctorValue)) {
                  return [{ value: initialDoctorValue, label: initialDoctorValue, extra: resolvedDoctorObj }, ...opts];
                }
                return opts;
              })();
              const isPatientLocked = Boolean(targetPatient && urlPatientId);

              return (
                <Form className="space-y-6">
                  <Grid2>
                    {fields.map((field) => {
                      const errorMsg = touched[field.name as keyof typeof touched] ? (errors[field.name as keyof typeof errors] as string) : undefined;

                      // 1. Patient selection (Searchable Combobox)
                      if (field.name === "patientId") {
                        const selectedPatient = (patientsList.data ?? []).find(
                          (p) => p.id === values.patientId || p.patientCode === values.patientId || p.name === values.patientId
                        );

                        return (
                          <div key={field.name} className="space-y-3 sm:col-span-2">
                            <UIField 
                              label={field.label} 
                              name={field.name} 
                              required={field.required}
                              hint={isPatientLocked ? "🔒 Patient locked from previous registration step" : (isAdmin && !values.franchiseId ? "⚠️ Please select a Franchise above first to load patients for that branch." : field.hint)}
                              error={errorMsg}
                            >
                              <SearchableCombobox
                                options={patientOpts}
                                value={values.patientId}
                                onChange={(val, opt) => {
                                  setFieldValue("patientId", val);
                                  if (opt?.extra) {
                                    const p = opt.extra as Patient;
                                    if (p.patientCode && !values.billNumber) {
                                      setFieldValue("billNumber", p.patientCode);
                                    }
                                    if (p.referringDoctorId) {
                                      const doc = findDoctorByRef(doctorsList.data ?? [], p.referringDoctorId);
                                      if (doc) setFieldValue("doctorId", referringDoctorValue(doc.name));
                                    }
                                    if (isAdmin && p.franchiseId && !values.franchiseId) {
                                      setFieldValue("franchiseId", p.franchiseId);
                                    }
                                  }
                                }}
                                placeholder={
                                  isAdmin && !values.franchiseId 
                                    ? "← Select Franchise above first to load patients..." 
                                    : patientOpts.length === 0 
                                    ? "No patients registered under this franchise" 
                                    : "Select registered patient (type name, code, phone)..."
                                }
                                searchPlaceholder="Search by name, patient code, phone..."
                                loading={patientsList.isLoading}
                                disabled={isPatientLocked || (isAdmin && !values.franchiseId)}
                              />
                            </UIField>

                            {/* Auto-populated Patient Registration Details Card for Billing */}
                            {!isAppointment && selectedPatient && (
                              <div className="rounded-xl border border-[#176b87]/30 bg-[#e8f4f7]/70 p-3.5 text-xs text-[#176b87] shadow-xs">
                                <div className="flex items-center justify-between border-b border-[#176b87]/20 pb-2 mb-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-emerald-500" />
                                    <span className="font-bold text-sm text-[color:var(--foreground)]">{selectedPatient.name}</span>
                                    <span className="font-mono text-xs font-semibold bg-white/80 px-2 py-0.5 rounded border border-[#176b87]/20">
                                      {selectedPatient.patientCode || selectedPatient.id}
                                    </span>
                                  </div>
                                  <StatusBadge tone="success" size="sm">Registered Patient</StatusBadge>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                                  <div>
                                    <span className="text-[color:var(--muted)] block">Age & Gender</span>
                                    <span className="font-semibold text-[color:var(--foreground)]">{selectedPatient.age} yrs · {selectedPatient.sex || "—"}</span>
                                  </div>
                                  <div>
                                    <span className="text-[color:var(--muted)] block">Contact Phone</span>
                                    <span className="font-mono font-semibold text-[color:var(--foreground)]">{selectedPatient.phone || "—"}</span>
                                  </div>
                                  <div>
                                    <span className="text-[color:var(--muted)] block">Blood Group</span>
                                    <span className="font-semibold text-rose-600">{selectedPatient.bloodGroup || "Not Recorded"}</span>
                                  </div>
                                  <div>
                                    <span className="text-[color:var(--muted)] block">Registered Franchise</span>
                                    <span className="font-semibold text-[#176b87]">
                                      {franchisesList.data?.find(f => f.id === selectedPatient.franchiseId)?.name || "Central Lab"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // 2. Doctor selection (Searchable Combobox)
                      if (field.name === "doctorId") {
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
                              options={doctorOpts}
                              value={values.doctorId}
                              onChange={(val) => setFieldValue("doctorId", val)}
                              placeholder={isAppointment ? "Select consulting doctor..." : "Select referring doctor or business source (e.g. Doctor, Collection Centre, Direct)..."}
                              searchPlaceholder="Search doctor or business referral source..."
                              loading={doctorsList.isLoading}
                            />
                          </UIField>
                        );
                      }

                      // 3. Multi-Test Selection Builder for Billing Form
                      if (!isAppointment && field.name === "itemDescription") {
                        return (
                          <div key={field.name} className="space-y-4 sm:col-span-2 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-2)]/50 p-4">
                            <div className="flex items-center justify-between border-b border-[color:var(--line)] pb-3">
                              <div>
                                <h4 className="text-sm font-bold text-[color:var(--foreground)] flex items-center gap-2">
                                  <FlaskConical size={16} className="text-[#176b87]" />
                                  Diagnostic Test / Service (Master Database)
                                </h4>
                                <p className="text-xs text-[color:var(--muted)]">
                                  Select one or multiple tests. Rates & MRPs automatically sum together.
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                leftIcon={<Plus size={14} />}
                                onClick={addBillingTest}
                              >
                                Add Another Test
                              </Button>
                            </div>

                            <div className="space-y-3">
                              {selectedBillingTests.map((testItem, idx) => (
                                <div key={idx} className="flex flex-col gap-2 bg-[color:var(--surface)] p-3 rounded-xl border border-[color:var(--line)] shadow-xs">
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <div className="flex-1">
                                      <SearchableCombobox
                                        options={testMasterComboboxOptions}
                                        value={testItem.name}
                                        onChange={(val, opt) => {
                                          const tm = (opt?.extra as TestMaster) || null;
                                          updateBillingTest(idx, tm, val, setFieldValue);
                                        }}
                                        placeholder={`Select test ${idx + 1} from Master Database (e.g. CBC, Lipid, Calcium)...`}
                                        searchPlaceholder="Type test name or code..."
                                        loading={testMastersQuery.isLoading}
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e8f4f7] border border-[#176b87]/20 text-[#176b87] font-mono text-xs font-bold min-w-[90px] justify-center">
                                        ₹{Number(testItem.mrp || 0).toFixed(2)}
                                      </div>
                                      {selectedBillingTests.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeBillingTest(idx, setFieldValue)}
                                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                          title="Remove test"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Dynamic Sub-Parameters Selector */}
                                  {testItem.name && (
                                    <SubParameterSelect
                                      testName={testItem.name}
                                      selectedSubParameters={testItem.subParameters || []}
                                      onChange={(newSubs) => updateBillingSubParameters(idx, newSubs)}
                                      className="mt-1"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Aggregated MRP Breakdown */}
                            <div className="flex flex-wrap items-center justify-between pt-2 text-xs border-t border-[color:var(--line)] gap-2">
                              <span className="text-[color:var(--muted)] font-medium">
                                Total Tests Selected: <strong className="text-[color:var(--foreground)]">{selectedBillingTests.filter(t => t.name).length}</strong>
                                {selectedBillingTests.filter(t => t.name).length > 1 && (
                                  <span className="ml-1 text-[11px] text-[#176b87]">
                                    ({selectedBillingTests.filter(t => t.name).map(t => `₹${t.mrp || 0}`).join(" + ")})
                                  </span>
                                )}
                              </span>
                              <div className="text-right">
                                <span className="text-[color:var(--muted)] mr-2">Total MRP / Rate:</span>
                                <span className="font-mono text-sm font-black text-[#176b87]">
                                  ₹{selectedBillingTests.reduce((sum, t) => sum + (t.mrp || 0), 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // 4. Rate / MRP Field (Auto-calculated from tests)
                      if (!isAppointment && field.name === "itemMrp") {
                        return (
                          <UIField 
                            key={field.name} 
                            label={field.label} 
                            name={field.name} 
                            required={field.required}
                            hint="Auto-calculated from all selected tests"
                            error={errorMsg}
                          >
                            <Input
                              type="number"
                              name={field.name}
                              value={liveSubtotal}
                              readOnly
                              className="font-mono font-bold text-[#176b87] bg-[color:var(--surface-2)]"
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
                                if (field.name === "franchiseId") {
                                  const curP = (patientsList.data ?? []).find(p => p.id === values.patientId || p.patientCode === values.patientId);
                                  if (curP && curP.franchiseId !== selected) {
                                    setFieldValue("patientId", "");
                                  }
                                }
                              }}
                            >
                              {field.options?.map((opt) => (
                                <option key={opt.value} value={opt.value} disabled={opt.value === "" && field.required}>
                                  {opt.label}
                                </option>
                              ))}
                            </Field>
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

                  {/* Dynamic invoice calculation summary card */}
                  {!isAppointment && (
                    <div className="rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--surface-2)] p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--muted)] mb-3">Live Billing Summary</h4>
                      <div className="grid sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-[color:var(--muted)]">Subtotal (Qty × Rate)</span>
                          <p className="text-base font-bold text-[color:var(--foreground)] mt-0.5">₹{liveSubtotal.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-[color:var(--muted)]">Discount</span>
                          <p className="text-base font-bold text-amber-600 mt-0.5">-₹{disc.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-[color:var(--muted)]">Net Total Amount</span>
                          <p className="text-lg font-black text-[#176b87] mt-0.5">₹{liveGrandTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[color:var(--line)]">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      loading={isSubmitting || createAppointment.isPending || createInvoice.isPending || updateAppointment.isPending || updateInvoice.isPending}
                      onClick={() => setProceedToReport(false)}
                    >
                      Save {isAppointment ? "Appointment" : "Invoice"}
                    </Button>
                    {!isAppointment && (
                      <Button
                        type="submit"
                        variant="secondary"
                        leftIcon={<FileText size={15} />}
                        loading={isSubmitting || createInvoice.isPending}
                        onClick={() => setProceedToReport(true)}
                      >
                        Save & Proceed to Report
                      </Button>
                    )}
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
                        Delete {isAppointment ? "Appointment" : "Invoice"}
                      </Button>
                    )}
                  </div>
                </Form>
              );
            }}
          </Formik>
        </Card>
      </div>
    );
  }

  const detail = isAppointment ? appointment.data : invoice.data;
  if (!detail) return <p className="text-sm text-[color:var(--muted)]">Loading…</p>;

  if ("billNumber" in detail) {
    const matchedPatient = (patientsList.data ?? []).find((p: any) => p.id === detail.patientId || p.patientCode === detail.patientId || p.name === detail.patientId) || (detail as any).patient;
    const matchedDoctor = (doctorsList.data ?? []).find((d: any) => d.id === detail.doctorId || d.name === detail.doctorId) || (detail as any).doctor;

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Global Print Style for A4 & Thermal */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: ${activePrintLayout === "thermal" ? "80mm auto" : "A4 portrait"};
              margin: ${activePrintLayout === "thermal" ? "0mm" : "8mm"};
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .sidebar-layout aside,
            .sidebar-layout header,
            .no-print-children,
            .print-hide,
            button,
            nav {
              display: none !important;
            }
            #printable-invoice-section {
              display: block !important;
              visibility: visible !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}} />

        {/* Top Action Bar (hidden on print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print-hide">
          <div className="flex items-center gap-3">
            <Link href={`/${kind}`}>
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={15} />}>
                All Invoices
              </Button>
            </Link>
            <span className="text-xs text-[color:var(--muted)]">/</span>
            <span className="font-mono text-xs font-bold text-[color:var(--foreground)]">{detail.billNumber}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Format Selector */}
            <div className="flex rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setActivePrintLayout("a4")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
                  activePrintLayout === "a4" ? "bg-[#176b87] text-white shadow-xs font-semibold" : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                )}
              >
                <FileText size={13} /> A4 Standard
              </button>
              <button
                type="button"
                onClick={() => setActivePrintLayout("thermal")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
                  activePrintLayout === "thermal" ? "bg-[#176b87] text-white shadow-xs font-semibold" : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                )}
              >
                <Receipt size={13} /> Thermal (80mm)
              </button>
            </div>

            <Button
              variant="outline"
              leftIcon={<Printer size={15} />}
              onClick={() => printBillDirectly("a4")}
            >
              Print A4
            </Button>
            <Button
              variant="primary"
              leftIcon={<Receipt size={15} />}
              onClick={() => printBillDirectly("thermal")}
            >
              Print Thermal
            </Button>

            {canManage && (
              <>
                <Link href={`/${kind}/${id}/edit`}>
                  <Button variant="secondary" size="sm" leftIcon={<Edit3 size={14} />}>Edit</Button>
                </Link>
                <Button 
                  variant="danger-outline" 
                  size="sm"
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => setConfirmDeleteId(id)}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Printable Invoice Section */}
        <div id="printable-invoice-section">
          <InvoicePrintView
            invoice={detail as Invoice}
            labData={lab.data}
            patient={matchedPatient}
            doctor={matchedDoctor}
            layout={activePrintLayout}
          />
        </div>

        {/* Delete Confirmation Modal in Invoice View */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-lg)]">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="grid size-10 place-items-center rounded-xl bg-rose-50">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[color:var(--foreground)]">Confirm Permanent Delete</h3>
                  <p className="text-xs text-[color:var(--muted)]">This will delete the invoice from database.</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-[color:var(--muted)] leading-relaxed">
                Are you sure you want to permanently delete this invoice?
              </p>
              <div className="mt-6 flex justify-end gap-2 border-t border-[color:var(--line)] pt-4">
                <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </Button>
                <Button variant="danger" loading={deleteInvoice.isPending} onClick={handleDelete}>
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title="Appointment Detail" 
        description="Patient consultation appointment record." 
        action={
          <div className="flex items-center gap-2">
            <Link href={`/${kind}`}>
              <Button variant="ghost">← Back to appointments</Button>
            </Link>
            {canManage && (
              <>
                <Link href={`/${kind}/${id}/edit`}>
                  <Button variant="outline" leftIcon={<Edit3 size={15} />}>Edit Appointment</Button>
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
          {Object.entries(detail).filter(([key]) => key !== "id").map(([key, value]) => (
            <div className="bg-[color:var(--surface)] p-4" key={key}>
              <dt className="text-xs font-semibold uppercase text-[color:var(--muted)]">{key.replace(/([A-Z])/g, " $1")}</dt>
              <dd className="mt-1 text-sm font-medium">{typeof value === "object" ? JSON.stringify(value) : String(value || "—")}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* Delete Confirmation Modal in Appointment View */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-lg)]">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="grid size-10 place-items-center rounded-xl bg-rose-50">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[color:var(--foreground)]">Confirm Permanent Delete</h3>
                <p className="text-xs text-[color:var(--muted)]">This will delete the appointment from database.</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-[color:var(--muted)] leading-relaxed">
              Are you sure you want to permanently delete this appointment record?
            </p>
            <div className="mt-6 flex justify-end gap-2 border-t border-[color:var(--line)] pt-4">
              <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="danger" loading={deleteAppointment.isPending} onClick={handleDelete}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
