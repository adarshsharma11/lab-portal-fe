import { EntityManager } from "@/components/forms/entity-manager";

export default async function FranchisesPage({ params }: Readonly<{ params: Promise<{ path?: string[] }> }>) {
  const { path } = await params;
  return <EntityManager kind="franchises" path={path ?? []} />;
}
