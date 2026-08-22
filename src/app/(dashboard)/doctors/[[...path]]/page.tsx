import { EntityManager } from "@/components/forms/entity-manager";
export default async function DoctorsPage({ params }: Readonly<{ params: Promise<{ path?: string[] }> }>) { const { path } = await params; return <EntityManager kind="doctors" path={path ?? []}/>; }
