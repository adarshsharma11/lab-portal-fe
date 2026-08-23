"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Field, Form, Formik } from "formik";
import { LockKeyhole, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { authService } from "@/lib/auth/auth-service";

const schema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const [initialCredentials] = useState({ email: "", password: "" });
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

      {/* Right Login Card */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
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
            <h2 className="text-3xl font-bold tracking-tight text-[color:var(--foreground)]">Welcome back</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">Sign in to your laboratory workspace.</p>
          </div>

          {serverError && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
              {serverError}
            </div>
          )}

          <Formik
            initialValues={initialCredentials}
            enableReinitialize
            validationSchema={schema}
            onSubmit={async (values, helpers) => {
              setServerError(null);
              try {
                await authService.login(values);
                router.replace("/dashboard");
              } catch (error) {
                const msg = error instanceof Error ? error.message : "Unable to sign in. Please verify your credentials.";
                setServerError(msg);
                helpers.setSubmitting(false);
              }
            }}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)]">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 text-[color:var(--muted)]" size={17} />
                    <Field
                      name="email"
                      type="email"
                      placeholder="e.g. yourname@domain.com"
                      className="w-full rounded-xl border border-[color:var(--line)] bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#176b87] focus:ring-1 focus:ring-[#176b87]"
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)]">Password</label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-3 text-[color:var(--muted)]" size={17} />
                    <Field
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[color:var(--line)] bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#176b87] focus:ring-1 focus:ring-[#176b87]"
                    />
                  </div>
                  {touched.password && errors.password && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 w-full rounded-xl bg-[#176b87] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#11576f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Signing in…" : "Sign In"}
                  <ArrowRight size={16} />
                </button>
              </Form>
            )}
          </Formik>

          <div className="mt-6 border-t border-[color:var(--line)] pt-4 text-center text-xs text-[color:var(--muted)]">
            <p>
              Don't have an account?{" "}
              <Link href="/signup" className="font-semibold text-[#176b87] hover:underline">
                Create new account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
