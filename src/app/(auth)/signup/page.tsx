"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Field, Form, Formik } from "formik";
import { LockKeyhole, Mail, User as UserIcon, Phone, ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { authService } from "@/lib/auth/auth-service";

const signupSchema = Yup.object({
  name: Yup.string().trim().required("Full name is required").min(2, "Name must be at least 2 characters"),
  email: Yup.string().trim().email("Please enter a valid email address").required("Email address is required"),
  password: Yup.string().required("Password is required").min(6, "Password must be at least 6 characters"),
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .oneOf([Yup.ref("password")], "Passwords do not match"),
  role: Yup.string()
    .required("Please select your role")
    .oneOf(["Doctor", "Technician", "Pathologist", "Other"], "Invalid role selected"),
  mobile: Yup.string().trim(),
});

const initialValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "Doctor",
  mobile: "",
};

const roleOptions = [
  { value: "Doctor", label: "Doctor" },
  { value: "Technician", label: "Technician" },
  { value: "Pathologist", label: "Pathologist" },
  { value: "Other", label: "Other" },
];

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  return (
    <main className="grid min-h-screen bg-[#f4f8f9] lg:grid-cols-2">
      {/* Left Brand Image Section */}
      <section className="hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 lg:flex lg:flex-col lg:items-center lg:justify-center relative overflow-hidden border-r border-[color:var(--line)]">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
        
        <div className="relative w-full max-w-xl p-8 flex flex-col items-center justify-center">
          <div className="relative w-full aspect-[16/9] transition-transform duration-300 hover:scale-[1.02]">
            <Image
              src="/branding/bxl-diagnostic-brand.webp"
              alt="BXL Diagnostic (A unit of Botlif Life Sciences Pvt Ltd)"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain drop-shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Right Form Card */}
      <section className="flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mobile Brand Header */}
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="relative h-20 w-64 max-w-full">
              <Image
                src="/branding/bxl-diagnostic-brand.webp"
                alt="BXL Diagnostic"
                fill
                priority
                sizes="256px"
                className="object-contain"
              />
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[color:var(--foreground)]">Create your account</h2>
            <p className="mt-1.5 text-sm text-[color:var(--muted)]">Select your role and enter your details to get started.</p>
          </div>

          {serverError && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
              {serverError}
            </div>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={signupSchema}
            onSubmit={async (values, helpers) => {
              setServerError(null);
              try {
                await authService.register({
                  name: values.name,
                  email: values.email,
                  password: values.password,
                  role: values.role,
                  mobile: values.mobile || undefined,
                });
                router.replace("/dashboard");
              } catch (error) {
                const msg = error instanceof Error ? error.message : "Unable to complete registration. Please try again.";
                setServerError(msg);
                helpers.setSubmitting(false);
              }
            }}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="mt-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[color:var(--foreground)] uppercase tracking-wide">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 text-[color:var(--muted)]" size={16} />
                    <Field
                      name="name"
                      type="text"
                      placeholder="e.g. Dr. Maya Sharma"
                      className="w-full rounded-xl border border-[color:var(--line)] bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#176b87] focus:ring-1 focus:ring-[#176b87]"
                    />
                  </div>
                  {touched.name && errors.name && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name}</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[color:var(--foreground)] uppercase tracking-wide">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 text-[color:var(--muted)]" size={16} />
                    <Field
                      name="email"
                      type="email"
                      placeholder="e.g. maya.sharma@hospital.org"
                      className="w-full rounded-xl border border-[color:var(--line)] bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#176b87] focus:ring-1 focus:ring-[#176b87]"
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email}</p>
                  )}
                </div>

                {/* Role Selection Dropdown */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[color:var(--foreground)] uppercase tracking-wide">
                    Select Your Role <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-3 text-[color:var(--muted)]" size={16} />
                    <Field
                      name="role"
                      as="select"
                      className="w-full rounded-xl border border-[color:var(--line)] bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#176b87] focus:ring-1 focus:ring-[#176b87]"
                    >
                      {roleOptions.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </Field>
                  </div>
                  {touched.role && errors.role && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{errors.role}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[color:var(--foreground)] uppercase tracking-wide">
                    Contact Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 text-[color:var(--muted)]" size={16} />
                    <Field
                      name="mobile"
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      className="w-full rounded-xl border border-[color:var(--line)] bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#176b87] focus:ring-1 focus:ring-[#176b87]"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[color:var(--foreground)] uppercase tracking-wide">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <LockKeyhole className="absolute left-3.5 top-3 text-[color:var(--muted)]" size={16} />
                      <Field
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-[color:var(--line)] bg-white py-2.5 pl-10 pr-9 text-sm outline-none transition focus:border-[#176b87] focus:ring-1 focus:ring-[#176b87]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[color:var(--foreground)] uppercase tracking-wide">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <LockKeyhole className="absolute left-3.5 top-3 text-[color:var(--muted)]" size={16} />
                      <Field
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-[color:var(--line)] bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#176b87] focus:ring-1 focus:ring-[#176b87]"
                      />
                    </div>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 w-full rounded-xl bg-[#176b87] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#11576f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Creating account…" : "Create Account"}
                  <ArrowRight size={16} />
                </button>
              </Form>
            )}
          </Formik>

          <div className="mt-6 border-t border-[color:var(--line)] pt-5 text-center text-xs text-[color:var(--muted)]">
            <p>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-[#176b87] hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
