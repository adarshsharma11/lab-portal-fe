import { EntityManager } from "@/components/forms/entity-manager";

export default async function TechniciansPage({ params }: Readonly<{ params: Promise<{ path?: string[] }> }>) {
  const { path } = await params;
  return <EntityManager kind="technicians" path={path ?? []} />;
}
