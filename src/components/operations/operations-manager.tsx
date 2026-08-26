"use client";
import React, { useState, useEffect } from "react";
import { Field, Form, Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { Printer, ArrowLeft, Eye, Edit3, Trash2, Plus, AlertTriangle } from "lucide-react";
import { PageHeader, StatusBadge, Button, Input, Select, Field as UIField, Grid2, Card, cn } from "@/components/ui/index";
import { useAppointment, useAppointments, useCreateAppointment, useCreateInvoice, useDeleteAppointment, useDeleteInvoice, useInvoice, useInvoices, useUpdateAppointment, useUpdateInvoice } from "@/features/operations/hooks";
import { authService } from "@/lib/auth/auth-service";
import type { Appointment, Invoice, UserRole } from "@/types/domain";

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
  { name: "patientId", label: "Patient ID / Code", type: "text", placeholder: "pat-01 or PT-10023", required: true, hint: "Enter registered patient code" },
  { name: "doctorId", label: "Consulting Doctor", type: "text", placeholder: "doc-01 or Dr. Verma", required: true },
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
  { name: "patientId", label: "Patient ID / Code", type: "text", placeholder: "pat-01 or PT-10023", required: true },
  { name: "doctorId", label: "Referring Doctor", type: "text", placeholder: "doc-01 or Dr. Rajesh Verma", required: true },
  { name: "billDate", label: "Invoice Date", type: "date", required: true },
  { name: "itemDescription", label: "Test / Item Description", type: "text", placeholder: "Complete Blood Count (CBC) + Lipid Profile", required: true, colSpan: 2 },
  { name: "itemQuantity", label: "Quantity", type: "number", placeholder: "1", required: true },
  { name: "itemMrp", label: "Item Price (₹)", type: "number", placeholder: "850", required: true },
  { name: "discount", label: "Discount (₹)", type: "number", placeholder: "50" },
  { name: "sgst", label: "SGST (₹)", type: "number", placeholder: "22.5" },
  { name: "cgst", label: "CGST (₹)", type: "number", placeholder: "22.5" },
  {
    name: "paymentStatus",
    label: "Payment Status",
    type: "select",
    required: true,
    options: [
      { label: "Select payment status", value: "" },
      { label: "Paid (Full settlement received)", value: "Paid" },
      { label: "Pending (Payment due)", value: "Pending" },
      { label: "Partially Paid", value: "Partially Paid" },
      { label: "Cancelled", value: "Cancelled" },
    ],
  },
  { name: "addedBy", label: "Biller / Staff Name", type: "text", placeholder: "Finance Desk / Dr. Ananya Rao", required: true },
];

const appointmentSchema = Yup.object({
  patientId: Yup.string().trim().required("Patient ID is required (. pat-01)"),
  doctorId: Yup.string().trim().required("Doctor identifier is required"),
  date: Yup.string().required("Appointment date is required"),
  time: Yup.string().required("Appointment time is required"),
  type: Yup.string().required("Please select an appointment type"),
  status: Yup.string().required("Please select an appointment status").oneOf(["Upcoming", "Completed", "Cancelled", "In-Progress"], "Invalid status"),
  appointmentLink: Yup.string().trim().url("Please enter a valid URL (. https://meet.google.com/...)"),
  createdBy: Yup.string().trim().required("Staff / Creator name is required"),
});

const invoiceSchema = Yup.object({
  billNumber: Yup.string().trim(),
  patientId: Yup.string().trim().required("Patient ID is required (. pat-01)"),
  doctorId: Yup.string().trim().required("Referring doctor is required"),
  billDate: Yup.string().required("Invoice date is required"),
  itemDescription: Yup.string().trim().required("Test or item description is required"),
  itemQuantity: Yup.number().typeError("Quantity must be a number").required("Quantity is required").min(1, "Quantity must be at least 1"),
  itemMrp: Yup.number().typeError("Price must be a number").required("Price is required").min(0, "Price cannot be negative"),
  discount: Yup.number().typeError("Discount must be a number").min(0, "Discount cannot be negative"),
  sgst: Yup.number().typeError("SGST must be a number").min(0, "Tax cannot be negative"),
  cgst: Yup.number().typeError("CGST must be a number").min(0, "Tax cannot be negative"),
  paymentStatus: Yup.string().required("Please select payment status").oneOf(["Pending", "Paid", "Partially Paid", "Cancelled"], "Invalid payment status"),
  addedBy: Yup.string().trim().required("Biller staff name is required"),
});

export function OperationsManager({ kind, path }: Readonly<{ kind: "appointments" | "billing"; path: readonly string[] }>) {
  const router = useRouter();
  const isAppointment = kind === "appointments";
  const [currentRole, setCurrentRole] = useState<UserRole | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const s = authService.getSession();
    if (s?.role) setCurrentRole(s.role);
  }, []);

  const isAdmin = currentRole === "Admin" || currentRole === "Administrator";

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
                <th className="pb-3">Status</th>
                <th className="pb-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(list ?? []).map((row) => (
                <tr className="border-b border-[color:var(--line)] last:border-b-0 hover:bg-[color:var(--surface-2)]" key={row.id}>
                  <td className="py-3.5 font-semibold">{"billNumber" in row ? row.billNumber : row.patientId === "pat-01" ? "Maya Srinivasan" : row.patientId}</td>
                  <td className="py-3.5">{"billDate" in row ? row.patientId : `${row.date} · ${row.time}`}</td>
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
                      {isAdmin && (
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
    const initialValues = isNew
      ? isAppointment
        ? { patientId: "", doctorId: "", date: "", time: "", type: "", status: "", appointmentLink: "", createdBy: "" }
        : { billNumber: "", patientId: "", doctorId: "", billDate: "", itemDescription: "", itemQuantity: 1, itemMrp: "", discount: 0, sgst: 0, cgst: 0, paymentStatus: "", addedBy: "" }
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
          paymentStatus: rawRecord?.paymentStatus ?? "",
          addedBy: rawRecord?.addedBy ?? "",
        };

    const fields = isAppointment ? appointmentFields : invoiceFields;
    const schema = isAppointment ? appointmentSchema : invoiceSchema;

    const submit = async (values: typeof initialValues) => {
      if (isAppointment) {
        if (isNew) {
          await createAppointment.mutateAsync(values as unknown as Omit<Appointment, "id">);
        } else {
          await updateAppointment.mutateAsync({ id, input: values as Partial<Appointment> });
        }
      } else {
        const v = values as unknown as { billNumber: string; patientId: string; doctorId: string; billDate: string; itemDescription: string; itemQuantity: number; itemMrp: number; discount: number; sgst: number; cgst: number; paymentStatus: string; addedBy: string };
        const subtotal = (Number(v.itemQuantity) || 1) * (Number(v.itemMrp) || 0);
        const discountVal = Number(v.discount) || 0;
        const taxVal = (Number(v.sgst) || 0) + (Number(v.cgst) || 0);
        const total = Math.max(0, subtotal - discountVal + taxVal);

        const payload: Omit<Invoice, "id"> = {
          billNumber: v.billNumber || `INV-${Date.now().toString().slice(-6)}`,
          patientId: v.patientId,
          doctorId: v.doctorId,
          billDate: v.billDate,
          items: [{ description: v.itemDescription, quantity: Number(v.itemQuantity) || 1, mrp: Number(v.itemMrp) || 0 }],
          discount: discountVal,
          sgst: Number(v.sgst) || 0,
          cgst: Number(v.cgst) || 0,
          total,
          paymentStatus: v.paymentStatus as Invoice["paymentStatus"],
          addedBy: v.addedBy,
        };
        if (isNew) {
          await createInvoice.mutateAsync(payload);
        } else {
          await updateInvoice.mutateAsync({ id, input: payload });
        }
      }
      router.push(`/${kind}`);
    };

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader 
          title={isNew ? `New ${isAppointment ? "appointment" : "invoice"}` : `Edit ${isAppointment ? "appointment" : "invoice"}`} 
          description="Complete all required information below. Validation is performed before saving."
          action={
            <Link href={`/${kind}`}>
              <Button variant="ghost">← Back to {isAppointment ? "appointments" : "billing"}</Button>
            </Link>
          }
        />
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
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-6">
                <Grid2>
                  {fields.map((field) => {
                    const errorMsg = touched[field.name as keyof typeof touched] ? (errors[field.name as keyof typeof errors] as string) : undefined;
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
                          <Field name={field.name} as={Select}>
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
                <div className="flex gap-3 pt-4 border-t border-[color:var(--line)]">
                  <Button type="submit" variant="primary" loading={isSubmitting || createAppointment.isPending || createInvoice.isPending || updateAppointment.isPending || updateInvoice.isPending}>
                    Save {isAppointment ? "Appointment" : "Invoice"}
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
                      Delete {isAppointment ? "Appointment" : "Invoice"}
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

  const detail = isAppointment ? appointment.data : invoice.data;
  if (!detail) return <p className="text-sm text-[color:var(--muted)]">Loading…</p>;

  if ("billNumber" in detail) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader 
          title={detail.billNumber} 
          description="Professional tax invoice preview." 
          action={
            <div className="flex gap-2 items-center">
              <Link href={`/${kind}`}>
                <Button variant="ghost">← Back to billing</Button>
              </Link>
              {isAdmin && (
                <>
                  <Link href={`/${kind}/${id}/edit`}>
                    <Button variant="outline" leftIcon={<Edit3 size={15} />}>Edit Invoice</Button>
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
              <Button variant="outline" leftIcon={<Printer size={16} />} onClick={() => window.print()}>
                Print Invoice
              </Button>
            </div>
          } 
        />
        <article className="rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-sm)] print:border-0">
          <header className="flex justify-between border-b border-[color:var(--line)] pb-5">
            <div>
              <p className="text-2xl font-bold text-[color:var(--brand-600)]">BLDignostics LIMS</p>
              <p className="text-xs text-[color:var(--muted)]">Clinical Diagnostics & Pathology Laboratory</p>
            </div>
            <StatusBadge tone={detail.paymentStatus === "Paid" ? "success" : "warning"} size="lg">
              {detail.paymentStatus}
            </StatusBadge>
          </header>
          <div className="grid grid-cols-2 gap-6 py-6 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-[color:var(--muted)]">Patient ID</p>
              <p className="mt-1 font-bold">{detail.patientId}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[color:var(--muted)]">Consulting Doctor</p>
              <p className="mt-1 font-bold">{detail.doctorId}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[color:var(--muted)]">Invoice Date</p>
              <p className="mt-1">{detail.billDate}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[color:var(--muted)]">Billed By</p>
              <p className="mt-1">{detail.addedBy}</p>
            </div>
          </div>
          <table className="w-full text-left text-sm border-t border-[color:var(--line)]">
            <thead>
              <tr className="border-b border-[color:var(--line)] text-xs uppercase text-[color:var(--muted)]">
                <th className="py-3">Item Description</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Unit Price (₹)</th>
                <th className="py-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {detail.items.map((item, idx) => (
                <tr className="border-b border-[color:var(--line)]" key={idx}>
                  <td className="py-3.5 font-medium">{item.description}</td>
                  <td className="py-3.5 text-center">{item.quantity}</td>
                  <td className="py-3.5 text-right">₹{item.mrp}</td>
                  <td className="py-3.5 text-right font-semibold">₹{item.quantity * item.mrp}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ml-auto mt-6 max-w-xs space-y-2 text-sm">
            <p className="flex justify-between text-[color:var(--muted)]">
              <span>Discount</span>
              <span>₹{detail.discount}</span>
            </p>
            <p className="flex justify-between text-[color:var(--muted)]">
              <span>Taxes (SGST + CGST)</span>
              <span>₹{detail.sgst + detail.cgst}</span>
            </p>
            <p className="flex justify-between border-t border-[color:var(--line)] pt-3 text-lg font-bold text-[color:var(--foreground)]">
              <span>Grand Total</span>
              <span>₹{detail.total}</span>
            </p>
          </div>
        </article>

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
            {isAdmin && (
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
              <dd className="mt-1 text-sm font-medium">{String(value || "—")}</dd>
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
