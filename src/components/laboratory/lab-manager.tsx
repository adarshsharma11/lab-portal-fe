"use client";
import React, { useMemo } from "react";
import { Field, Form, Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import { PageHeader, StatusBadge, Button, Input, Field as UIField, Grid2, Card, cn } from "@/components/ui/index";
import { DataTable } from "@/components/tables/DataTable";
import { ResultSection, ResultTable } from "@/components/laboratory/result-engine";
import { useCreateSample, useCreateTest, useResults, useSample, useSamples, useTest, useTests } from "@/features/laboratory/hooks";
import type { Sample, Test } from "@/types/domain";

type Kind = "samples" | "tests";
type Entity = Sample | Test;

export function LabManager({ kind, path }: Readonly<{ kind: Kind; path: readonly string[] }>) {
  const router = useRouter();
  const sampleList = useSamples();
  const testList = useTests();
  const sampleDetail = useSample(path[0] ?? "");
  const testDetail = useTest(path[0] ?? "");
  
  const createSample = useCreateSample();
  const createTest = useCreateTest();
  const results = useResults();
  
  const isSample = kind === "samples";
  const list = isSample ? sampleList : testList;
  const detail = isSample ? sampleDetail : testDetail;

  const columns = useMemo(() => {
    const h = createColumnHelper<Entity>();
    return [
      h.accessor(row => ("accession" in row ? row.accession : row.name), {
        id: "id_name",
        header: isSample ? "Sample ID" : "Test",
        cell: ({ getValue }) => <span className="font-semibold text-[color:var(--foreground)]">{getValue()}</span>
      }),
      h.accessor(row => ("patientId" in row ? row.patientId : row.department), {
        id: "patient_dept",
        header: isSample ? "Patient" : "Department",
        cell: ({ getValue }) => <span className="text-[color:var(--muted)]">{getValue()}</span>
      }),
      h.accessor(row => row.status ?? "Active", {
        id: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const val = getValue();
          const tone = val === "Completed" || val === "Active" ? "success" : val === "Processing" ? "warning" : "neutral";
          return <StatusBadge tone={tone} size="sm">{val}</StatusBadge>;
        }
      }),
      h.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Link href={`/${kind}/${row.original.id}`}>
              <Button size="sm" variant="ghost">View</Button>
            </Link>
          </div>
        )
      })
    ];
  }, [isSample, kind]);

  if (!path.length) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title={isSample ? "Samples" : "Tests"} 
          description={isSample ? "Track collection, receipt, and processing." : "Manage catalogued and assigned laboratory tests."} 
          action={
            <Link href={`/${kind}/new`}>
              <Button variant="primary">New {isSample ? "sample" : "test"}</Button>
            </Link>
          } 
        />
        <DataTable
          columns={columns}
          data={list.data}
          isLoading={list.isLoading}
          isError={list.isError}
          searchable
          searchPlaceholder={`Search ${kind}...`}
          emptyTitle={`No ${kind} found`}
        />
      </div>
    );
  }

  if (path[0] === "new") {
    const initial = isSample 
      ? { accession: `LIS-${Date.now().toString().slice(-6)}`, barcode: `BC${Date.now()}`, patientId: "pat-01", sampleType: "Blood", collectedAt: "2026-08-22T10:00", priority: "Routine", status: "Collected", notes: "" } 
      : { code: "NEW", name: "", department: "Hematology", sampleId: "smp-01", sampleType: "Blood", price: 0, referenceRange: "", unit: "", turnaroundHours: 4, status: "Active" };
    
    const submit = (values: typeof initial) => (isSample 
      ? createSample.mutateAsync(values as Omit<Sample, "id">) 
      : createTest.mutateAsync(values as Omit<Test, "id">)
    ).then(() => router.push(`/${kind}`));
    
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader 
          title={`New ${isSample ? "sample" : "test"}`} 
          description="Save this record to continue the laboratory workflow."
        />
        <Card>
          <Formik initialValues={initial} onSubmit={submit}>
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <Grid2>
                  {Object.keys(initial).map((key) => (
                    <UIField key={key} label={key.replace(/([A-Z])/g, " $1")} name={key}>
                      <Field name={key} as={Input} />
                    </UIField>
                  ))}
                </Grid2>
                <div className="pt-4 border-t border-[color:var(--line)]">
                  <Button type="submit" variant="primary" loading={isSubmitting}>Save</Button>
                </div>
              </Form>
            )}
          </Formik>
        </Card>
      </div>
    );
  }

  const item = detail.data;
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader 
        title={item && ("accession" in item ? item.accession : item.name) || "Loading..."} 
        description="Linked laboratory record."
      />
      {item && (
        <Card padding={false} className="overflow-hidden">
          <dl className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[color:var(--line)]">
            {Object.entries(item).filter(([key]) => key !== "id").map(([key, value], i) => (
              <div className={cn("p-4", i > 1 && "sm:border-t border-[color:var(--line)]")} key={key}>
                <dt className="text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">{key}</dt>
                <dd className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">{String(value || "—")}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}
      {!isSample && (
        <div className="mt-8">
          <ResultSection title="Results">
            <ResultTable results={(results.data ?? []).filter((result) => result.testId === path[0])} />
          </ResultSection>
        </div>
      )}
    </div>
  );
}
