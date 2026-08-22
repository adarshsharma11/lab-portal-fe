import { EntityManager } from "@/components/forms/entity-manager";
export default async function UsersPage({ params }: Readonly<{ params: Promise<{ path?: string[] }> }>) { const { path } = await params; return <EntityManager kind="users" path={path ?? []}/>; }
