"use client";
import React, { useMemo, useRef, useState } from "react";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import {
  Camera, CheckCircle2, ClipboardList, FileCheck2, Mail, MapPin, Phone, Shield, 
  User as UserIcon, CalendarDays, Loader2, Trash2, Upload, AlertCircle, Sparkles
} from "lucide-react";
import { Avatar, Button, Card, Divider, Field as UIField, FormSection, Grid2, Grid3, Input, KPICard, PageHeader, Select, StatusBadge, Tag, cn } from "@/components/ui";
import { useProfile, useUpdateProfile } from "@/features/settings/hooks";
import { authService } from "@/lib/auth/auth-service";
import type { UserRole } from "@/types/domain";

const profileSchema = Yup.object({
  name: Yup.string().required("Full name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  mobile: Yup.string(),
  dateOfBirth: Yup.string(),
  gender: Yup.string(),
  location: Yup.string(),
});

const roleInfo: Record<UserRole | string, { description: string; tone: "info" | "success" | "warning" | "danger" | "neutral" }> = {
  Admin: { description: "Full access to all laboratory modules, franchises, and administration.", tone: "info" },
  Administrator: { description: "Full access to all laboratory modules, franchises, and administration.", tone: "info" },
  Franchise: { description: "Manage franchise branch patients, tests, bookings, and revenue share.", tone: "info" },
  Pathologist: { description: "Results interpretation, diagnostic validation, and report release.", tone: "success" },
  Technician: { description: "Patients, sample collections, analyzer runs, and result entry.", tone: "warning" },
  Receptionist: { description: "Patient registration, appointments, and diagnostic billing.", tone: "neutral" },
  Doctor: { description: "Referring practitioner patients and authorized report reviews.", tone: "info" },
};

const permissions = [
  { key: "patients:read", label: "View patients", default: true },
  { key: "patients:write", label: "Create / edit patients", default: true },
  { key: "samples:write", label: "Register samples & tests", default: true },
  { key: "results:write", label: "Enter laboratory results", default: true },
  { key: "reports:approve", label: "Approve & release reports", default: false },
  { key: "qc:manage", label: "Review QC violations", default: false },
  { key: "users:manage", label: "Manage users & roles", default: false },
  { key: "billing:manage", label: "Billing & invoices", default: true },
  { key: "inventory:manage", label: "Inventory & suppliers", default: false },
] as const;

export function ProfilePage() {
  const profile = useProfile();
  const update = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const granted = useMemo(() => {
    const role = profile.data?.role === "Administrator" ? "Admin" : profile.data?.role;
    if (role === "Admin") return new Set(permissions.map((p) => p.key));
    const perms = new Set<string>(["patients:read"]);
    if (role === "Technician" || role === "Pathologist" || role === "Franchise") {
      perms.add("patients:write").add("samples:write").add("results:write");
    }
    if (role === "Pathologist") {
      perms.add("reports:approve").add("qc:manage");
    }
    if (role === "Receptionist" || role === "Franchise") {
      perms.add("patients:write").add("billing:manage");
    }
    return perms;
  }, [profile.data?.role]);

  const info = profile.data?.role ? roleInfo[profile.data.role] ?? roleInfo["Technician"] : undefined;

  /**
   * Client-side Image compression & upload handler
   * Resizes image to optimal profile dimensions (400x400) and saves as base64
   */
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be less than 5MB.");
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);
    setSuccessMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          // Resize & crop to square canvas for sharp, lightweight storage
          const canvas = document.createElement("canvas");
          const size = 400;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            throw new Error("Unable to initialize image processor.");
          }

          // Center crop calculation
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const base64Data = canvas.toDataURL("image/jpeg", 0.9);

          // Save to backend database for logged-in user
          await update.mutateAsync({ avatar: base64Data });
          authService.updateSession({ avatar: base64Data });

          setSuccessMessage("Profile photo updated successfully!");
          setIsUploadingImage(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        };
        img.onerror = () => {
          setUploadError("Failed to process image file.");
          setIsUploadingImage(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setUploadError("Failed to read image file.");
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message || "Failed to update profile image.");
      setIsUploadingImage(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;
    setIsUploadingImage(true);
    setUploadError(null);
    try {
      await update.mutateAsync({ avatar: "" });
      authService.updateSession({ avatar: undefined });
      setSuccessMessage("Profile photo removed.");
    } catch (err: any) {
      setUploadError(err.message || "Failed to remove profile photo.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Account Settings"
        title="My Profile"
        description="Manage your personal profile, credentials, profile photo, and role-based permissions."
      />

      {uploadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-3">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {profile.data && (
        <>
          <Card padding={false} className="overflow-hidden shadow-sm">
            <div className="relative h-32 bg-gradient-to-r from-[#176b87] via-[#0284c7] to-[#38bdf8]">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 30%, white 1px, transparent 1px)",
                backgroundSize: "32px 32px"
              }} />
            </div>
            <div className="px-6 pb-6">
              <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4">
                  {/* Avatar Upload Container */}
                  <div className="relative group">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer rounded-full border-4 border-[color:var(--surface)] bg-[color:var(--surface)] shadow-md p-0.5 hover:ring-2 hover:ring-[#176b87] transition-all relative overflow-hidden"
                      title="Click to change profile picture"
                    >
                      <Avatar initials={profile.data.initials} size="xl" src={profile.data.avatar} />
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center rounded-full">
                          <Loader2 size={22} className="animate-spin text-white" />
                        </div>
                      )}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="absolute bottom-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[color:var(--surface)] bg-[#176b87] text-white shadow-md hover:bg-[#13586f] transition-all" 
                      title="Upload new profile image"
                    >
                      <Camera size={14} />
                    </button>

                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                      onChange={handleImageFileChange}
                    />
                  </div>

                  <div className="text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <p className="text-xl font-bold text-[color:var(--foreground)]">{profile.data.name}</p>
                    </div>
                    <p className="text-xs text-[color:var(--muted)] mt-0.5">{profile.data.email}</p>
                    <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <StatusBadge tone={info?.tone ?? "info"} size="md">
                        {profile.data.role === "Administrator" ? "Admin" : profile.data.role}
                      </StatusBadge>
                      {profile.data.active !== false ? (
                        <Tag tone="success">Active Account</Tag>
                      ) : (
                        <Tag tone="warning">Account Inactive</Tag>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-center sm:justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    leftIcon={<Upload size={14} />}
                    onClick={() => fileInputRef.current?.click()}
                    loading={isUploadingImage}
                  >
                    Change Photo
                  </Button>
                  {profile.data.avatar && (
                    <Button 
                      variant="danger-outline" 
                      size="sm"
                      leftIcon={<Trash2 size={14} />}
                      onClick={handleRemovePhoto}
                      loading={isUploadingImage}
                    >
                      Remove
                    </Button>
                  )}
                  <Button 
                    variant="primary" 
                    size="sm"
                    leftIcon={<FileCheck2 size={14} />} 
                    onClick={() => update.mutate({ ...profile.data! })}
                    loading={update.isPending}
                  >
                    Sync Profile
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Grid3>
            <KPICard label="Reports Authorized" value={312} icon={FileCheck2} iconTone="success" supportingText="Certified diagnostic records" />
            <KPICard label="Specimens Processed" value={846} icon={ClipboardList} iconTone="info" supportingText="Clinical test workload" />
            <KPICard label="Granted Privileges" value={granted.size} icon={Shield} iconTone="warning" supportingText={`of ${permissions.length} security permissions`} />
          </Grid3>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-5">
              <FormSection title="Personal Information" description="Update your full name, contact mobile, gender, and laboratory workstation.">
                <Formik 
                  initialValues={{ ...profile.data }} 
                  validationSchema={profileSchema} 
                  enableReinitialize 
                  onSubmit={async (values) => {
                    await update.mutateAsync(values);
                    setSuccessMessage("Profile details updated successfully.");
                  }}
                >
                  {({ errors, touched, isSubmitting }) => (
                    <Form className="space-y-5">
                      <Grid2>
                        <UIField label="Full Name" name="name" required error={touched.name ? (errors.name as string) : undefined}>
                          <Field name="name" as={Input} />
                        </UIField>
                        <UIField label="Email Address" name="email" required error={touched.email ? (errors.email as string) : undefined}>
                          <Field name="email" type="email" as={Input} />
                        </UIField>
                        <UIField label="Mobile Number" name="mobile" hint="For urgent critical alerts and notifications">
                          <Field name="mobile" as={Input} placeholder="+91 98000 00000" />
                        </UIField>
                        <UIField label="Gender" name="gender">
                          <Field name="gender" as={Select}>
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </Field>
                        </UIField>
                        <UIField label="Date of Birth" name="dateOfBirth">
                          <Field name="dateOfBirth" type="date" as={Input} />
                        </UIField>
                        <UIField label="Location / Workstation" name="location" hint="Primary department or franchise branch">
                          <Field name="location" as={Input} placeholder="Central Laboratory / Hematology Wing" />
                        </UIField>
                      </Grid2>
                      <Divider />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[color:var(--muted)] inline-flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          Changes sync instantly across your active session.
                        </p>
                        <Button type="submit" variant="primary" loading={isSubmitting || update.isPending} leftIcon={<UserIcon size={15} />}>
                          Save Profile
                        </Button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </FormSection>
            </div>

            <div className="space-y-5">
              <FormSection title="Account & Security" description="System role, privileges, and assigned permissions.">
                <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[color:var(--muted)]">Assigned System Role</span>
                    <span className="font-bold text-[color:var(--foreground)]">{profile.data.role === "Administrator" ? "Admin" : profile.data.role}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[color:var(--line)] pt-3">
                    <span className="text-[color:var(--muted)]">Role Scope</span>
                    <span className="font-medium text-slate-700">{info?.description}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[color:var(--line)] pt-3">
                    <span className="text-[color:var(--muted)]">Account Status</span>
                    <span className="font-semibold text-emerald-700">Verified & Active</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--muted)]">Active Module Permissions</h4>
                  <div className="space-y-2">
                    {permissions.map((p) => {
                      const hasPerm = granted.has(p.key);
                      return (
                        <div key={p.key} className="flex items-center justify-between text-xs py-1">
                          <span className={cn(hasPerm ? "text-[color:var(--foreground)] font-medium" : "text-[color:var(--muted)]")}>
                            {p.label}
                          </span>
                          {hasPerm ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 size={12} /> Allowed
                            </span>
                          ) : (
                            <span className="text-[11px] text-[color:var(--muted)]">Restricted</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </FormSection>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
