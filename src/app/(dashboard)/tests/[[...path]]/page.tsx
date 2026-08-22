import { LabManager } from "@/components/laboratory/lab-manager";
export default async function TestsPage({ params }: Readonly<{ params: Promise<{ path?: string[] }> }>) { const { path } = await params; return <LabManager kind="tests" path={path ?? []}/>; }
