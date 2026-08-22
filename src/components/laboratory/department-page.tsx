import { PageHeader, Card, Grid4 } from "@/components/ui/index";
import { calculateAnionGap, calculateLdl, calculateVldl } from "@/lib/utils/lab-calculations";

export function DepartmentPage({ title, sections }: Readonly<{ title: string; sections: readonly Readonly<{ label: string; items: readonly string[] }>[] }>) {
  return (
    <div className="space-y-8">
      <PageHeader 
        title={title} 
        description="Department worklist and reusable result entry parameters." 
      />
      
      {sections.map((section) => (
        <section key={section.label}>
          <h2 className="font-semibold text-lg mb-4 text-[color:var(--foreground)]">{section.label}</h2>
          <Grid4>
            {section.items.map((item) => (
              <Card key={item} className="flex items-center justify-center text-center p-4 min-h-[80px]">
                <span className="text-sm font-medium">{item}</span>
              </Card>
            ))}
          </Grid4>
        </section>
      ))}
      
      {title === "Biochemistry" && (
        <div className="rounded-lg bg-[color:var(--brand-50)] p-4 text-sm text-[color:var(--brand-700)] border border-[color:var(--brand-100)]">
          <span className="font-semibold mr-2">Calculated parameters available:</span> 
          LDL {calculateLdl(180, 48, 120).toFixed(0)} mg/dL · VLDL {calculateVldl(120)} mg/dL
        </div>
      )}
      
      {title === "Electrolytes" && (
        <div className="rounded-lg bg-[color:var(--brand-50)] p-4 text-sm text-[color:var(--brand-700)] border border-[color:var(--brand-100)]">
          <span className="font-semibold mr-2">Anion gap calculation preview:</span> 
          {calculateAnionGap(140, 104, 24)} mmol/L
        </div>
      )}
    </div>
  );
}
