import { ReportWorkflow } from "@/components/laboratory/report-workflow";
export default async function ReportsPage({ params }: Readonly<{ params: Promise<{ path?: string[] }> }>) { const { path } = await params; return <ReportWorkflow path={path ?? []}/>; }
