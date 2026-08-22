import { EntityManager } from "@/components/forms/entity-manager";
export default async function PatientsPage({ params }: Readonly<{ params: Promise<{ path?: string[] }> }>) { const { path } = await params; return <EntityManager kind="patients" path={path ?? []}/>; }
