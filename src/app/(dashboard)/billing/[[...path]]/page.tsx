import { OperationsManager } from "@/components/operations/operations-manager";
export default async function Page({ params }: Readonly<{ params: Promise<{ path?: string[] }> }>) { const { path } = await params; return <OperationsManager kind="billing" path={path ?? []}/>; }
