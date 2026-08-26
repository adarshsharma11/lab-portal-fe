import { EntityManager } from "@/components/forms/entity-manager";

export default async function PathologistsPage({ params }: Readonly<{ params: Promise<{ path?: string[] }> }>) {
  const { path } = await params;
  return <EntityManager kind="pathologists" path={path ?? []} />;
}
