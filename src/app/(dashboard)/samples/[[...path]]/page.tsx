import { LabManager } from "@/components/laboratory/lab-manager";
export default async function SamplesPage({ params }: Readonly<{ params: Promise<{ path?: string[] }> }>) { const { path } = await params; return <LabManager kind="samples" path={path ?? []}/>; }
