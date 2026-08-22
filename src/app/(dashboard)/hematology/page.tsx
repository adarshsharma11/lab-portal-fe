import { DepartmentPage } from "@/components/laboratory/department-page";
export default function Page() { return <DepartmentPage title="Hematology" sections={[{ label: "CBC & differential", items: ["CBC", "3-part differential", "5-part differential", "RBC indices", "Hemoglobin", "Hematocrit", "MCV", "MCH", "MCHC", "RDW", "Platelets", "ESR", "Peripheral smear"] }]}/>; }
