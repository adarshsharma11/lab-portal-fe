import { EntityManager } from "@/components/forms/entity-manager";
export default async function SuppliersPage({ params }: Readonly<{ params: Promise<{ path?: string[] }> }>) { const { path } = await params; return <EntityManager kind="suppliers" path={path ?? []}/>; }
