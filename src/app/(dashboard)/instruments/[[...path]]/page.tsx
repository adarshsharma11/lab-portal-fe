"use client";
import { use } from "react";
import { InstrumentsPage } from "@/components/instruments/InstrumentsPage";
export default function InstrumentsRoute({ params }: Readonly<{ params: Promise<{ path?: string[] }> }>) {
  const { path } = use(params);
  return <InstrumentsPage path={path ?? []} />;
}
