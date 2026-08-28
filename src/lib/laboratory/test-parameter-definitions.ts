export interface ParameterDefinition {
  id: string;
  name: string;
  unit: string;
  method?: string;
  machine?: string;
  min?: number | null;
  max?: number | null;
  referenceRange: string;
  criticalLow?: number | null;
  criticalHigh?: number | null;
  defaultValue?: string;
  options?: string[]; // for categorical results like Negative/Positive or Visual color
}

export interface TestInterpretation {
  heading: string;
  content: string;
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface TestDefinition {
  code: string;
  name: string;
  department: string;
  sampleType: string;
  standardPrice: number;
  parameters: ParameterDefinition[];
  interpretations?: TestInterpretation[];
  remarks?: string[];
  guidelinesRef?: string;
}

export const STANDARD_TEST_CATALOG: readonly TestDefinition[] = [
  {
    code: "CBC",
    name: "Complete Blood Count (CBC / Hemogram)",
    department: "Hematology",
    sampleType: "Whole Blood EDTA",
    standardPrice: 450,
    guidelinesRef: "International Council for Standardization in Haematology (ICSH)",
    parameters: [
      { id: "hb", name: "Haemoglobin (HB)", unit: "g/dL", min: 13.0, max: 17.0, referenceRange: "13.0 - 17.0", criticalLow: 7.0, criticalHigh: 20.0, method: "Spectrophotometry", machine: "Horiba Yumizen H1500", defaultValue: "14.2" },
      { id: "tlc", name: "Total Leucocyte Count (TLC / WBC)", unit: "10^3/µL", min: 4.0, max: 10.0, referenceRange: "4.0 - 10.0", criticalLow: 2.0, criticalHigh: 30.0, method: "Impedance", machine: "Horiba Yumizen H1500", defaultValue: "6.8" },
      { id: "pcv", name: "Hematocrit (PCV)", unit: "%", min: 40.0, max: 50.0, referenceRange: "40.0 - 50.0", method: "Calculated", machine: "Horiba Yumizen H1500", defaultValue: "42.5" },
      { id: "rbc", name: "Red Blood Cell Count (RBC)", unit: "10^6/µL", min: 4.50, max: 5.50, referenceRange: "4.50 - 5.50", method: "Impedance", machine: "Horiba Yumizen H1500", defaultValue: "4.85" },
      { id: "mcv", name: "Mean Corp Volume (MCV)", unit: "fL", min: 83.0, max: 101.0, referenceRange: "83.0 - 101.0", method: "Derived from RBC Histogram", machine: "Horiba Yumizen H1500", defaultValue: "88.0" },
      { id: "mch", name: "Mean Corp Hb (MCH)", unit: "pg", min: 27.0, max: 32.0, referenceRange: "27.0 - 32.0", method: "Calculated", machine: "Horiba Yumizen H1500", defaultValue: "29.5" },
      { id: "mchc", name: "Mean Corp Hb Conc (MCHC)", unit: "g/dL", min: 31.5, max: 34.5, referenceRange: "31.5 - 34.5", method: "Calculated", machine: "Horiba Yumizen H1500", defaultValue: "33.2" },
      { id: "rdw_cv", name: "RDW - CV", unit: "%", min: 11.6, max: 14.0, referenceRange: "11.6 - 14.0", method: "Derived from RBC Histogram", machine: "Horiba Yumizen H1500", defaultValue: "13.1" },
      { id: "rdw_sd", name: "RDW - SD", unit: "fL", min: 39.0, max: 46.0, referenceRange: "39.0 - 46.0", method: "Derived from RBC Histogram", machine: "Horiba Yumizen H1500", defaultValue: "42.0" },
      { id: "plt", name: "Platelet Count (PLT)", unit: "10^3/µL", min: 150, max: 410, referenceRange: "150 - 410", criticalLow: 50, criticalHigh: 800, method: "Impedance", machine: "Horiba Yumizen H1500", defaultValue: "245" },
      { id: "neutrophils", name: "Neutrophils", unit: "%", min: 40, max: 80, referenceRange: "40 - 80", method: "Flow-Cytometry DHSS", machine: "Horiba Yumizen H1500", defaultValue: "62.0" },
      { id: "lymphocytes", name: "Lymphocytes", unit: "%", min: 20, max: 40, referenceRange: "20 - 40", method: "Flow-Cytometry DHSS", machine: "Horiba Yumizen H1500", defaultValue: "28.5" },
      { id: "monocytes", name: "Monocytes", unit: "%", min: 2, max: 10, referenceRange: "2 - 10", method: "Flow-Cytometry DHSS", machine: "Horiba Yumizen H1500", defaultValue: "6.0" },
      { id: "eosinophils", name: "Eosinophils", unit: "%", min: 1, max: 6, referenceRange: "1 - 6", method: "Flow-Cytometry DHSS", machine: "Horiba Yumizen H1500", defaultValue: "3.0" },
      { id: "basophils", name: "Basophils", unit: "%", min: 0, max: 2, referenceRange: "0 - 2", method: "Impedance", machine: "Horiba Yumizen H1500", defaultValue: "0.5" },
    ],
    interpretations: [
      {
        heading: "Clinical Interpretation & Peripheral Smear Remarks",
        content: "The complete blood count reflects normal erythropoiesis, normocytic normochromic red cells, and adequate platelet distribution. No toxic granulation or atypical leucocytes noted on automated differential review."
      }
    ],
    remarks: [
      "1. Results verified with automated multi-angle hydrodynamic flow cytometry and impedance measurement.",
      "2. Clinical correlation recommended for any isolated borderline differentials.",
      "3. Giant platelets: Absent. Adequate platelet aggregation seen."
    ]
  },
  {
    code: "LIPID",
    name: "Lipid Profile Advance",
    department: "Biochemistry",
    sampleType: "Serum",
    standardPrice: 650,
    guidelinesRef: "Lipid Association of India (LAI) & NCEP ATP-IV",
    parameters: [
      { id: "chol_total", name: "Total Cholesterol", unit: "mg/dL", min: 0, max: 200, referenceRange: "< 200 Desirable", criticalHigh: 300, method: "CHO-POD (Trac. Abel-Kendall)", machine: "Beckman Coulter AU 5800", defaultValue: "165.0" },
      { id: "triglycerides", name: "Serum Triglycerides", unit: "mg/dL", min: 0, max: 150, referenceRange: "< 150 Desirable", criticalHigh: 500, method: "GPO-POD", machine: "Beckman Coulter AU 5800", defaultValue: "128.0" },
      { id: "hdl", name: "Serum HDL Cholesterol", unit: "mg/dL", min: 40, max: 60, referenceRange: "40 - 60 Optimal", method: "Direct Enzymatic Immunoinhibition", machine: "Beckman Coulter AU 5800", defaultValue: "48.0" },
      { id: "ldl", name: "LDL Cholesterol Calculated", unit: "mg/dL", min: 0, max: 100, referenceRange: "< 100 Optimal", criticalHigh: 190, method: "Calculated (Friedewald)", machine: "Beckman Coulter AU 5800", defaultValue: "91.4" },
      { id: "vldl", name: "VLDL Cholesterol Calculated", unit: "mg/dL", min: 0, max: 30, referenceRange: "< 30 Desirable", method: "Calculated", machine: "Beckman Coulter AU 5800", defaultValue: "25.6" },
      { id: "chol_hdl_ratio", name: "Total CHOL / HDL Ratio", unit: "Ratio", min: 3.30, max: 4.40, referenceRange: "3.30 - 4.40", method: "Calculated", machine: "Beckman Coulter AU 5800", defaultValue: "3.44" },
      { id: "ldl_hdl_ratio", name: "LDL / HDL Cholesterol Ratio", unit: "Ratio", min: 0.5, max: 3.0, referenceRange: "0.5 - 3.0 Low Risk", method: "Calculated", machine: "Beckman Coulter AU 5800", defaultValue: "1.90" },
      { id: "non_hdl", name: "Non-HDL Cholesterol", unit: "mg/dL", min: 0, max: 160, referenceRange: "0 - 160 Desirable", method: "Calculated", machine: "Beckman Coulter AU 5800", defaultValue: "117.0" },
    ],
    interpretations: [
      {
        heading: "Cardiovascular Risk Stratification (NCEP ATP IV / LAI)",
        content: "Optimal lipid targets: LDL-C < 100 mg/dL (Low/Moderate Risk) or < 70 mg/dL (High Risk). Total Cholesterol and Triglycerides within desirable therapeutic thresholds.",
        table: {
          headers: ["Risk Category", "Target LDL-C", "Target Non-HDL", "Apo-B"],
          rows: [
            ["Low Risk", "< 100 mg/dL", "< 130 mg/dL", "< 90 mg/dL"],
            ["Moderate Risk", "< 100 mg/dL", "< 130 mg/dL", "< 90 mg/dL"],
            ["High Risk", "< 70 mg/dL", "< 100 mg/dL", "< 80 mg/dL"],
            ["Very High Risk", "< 50 mg/dL", "< 80 mg/dL", "< 65 mg/dL"],
          ]
        }
      }
    ],
    remarks: [
      "1. Lipid testing performed following recommended 10-12 hour overnight fasting protocol.",
      "2. Friedewald calculation is valid when Triglycerides < 400 mg/dL."
    ]
  },
  {
    code: "LFT",
    name: "Liver Function Test (LFT)",
    department: "Biochemistry",
    sampleType: "Serum",
    standardPrice: 700,
    guidelinesRef: "American Association for the Study of Liver Diseases (AASLD)",
    parameters: [
      { id: "bili_total", name: "Serum Bilirubin, (Total)", unit: "mg/dL", min: 0.3, max: 1.2, referenceRange: "0.3 - 1.2", criticalHigh: 5.0, method: "DPD", machine: "Beckman Coulter AU 5800", defaultValue: "0.75" },
      { id: "bili_direct", name: "Serum Bilirubin, (Direct)", unit: "mg/dL", min: 0.0, max: 0.2, referenceRange: "0.0 - 0.2", method: "DPD", machine: "Beckman Coulter AU 5800", defaultValue: "0.15" },
      { id: "bili_indirect", name: "Serum Bilirubin, (Indirect)", unit: "mg/dL", min: 0.0, max: 0.8, referenceRange: "0.0 - 0.8", method: "Calculated", machine: "Beckman Coulter AU 5800", defaultValue: "0.60" },
      { id: "ast_sgot", name: "Aspartate Aminotransferase (AST/SGOT)", unit: "U/L", min: 3, max: 50, referenceRange: "3 - 50", criticalHigh: 250, method: "UV without P5P", machine: "Beckman Coulter AU 5800", defaultValue: "24.0" },
      { id: "alt_sgpt", name: "Alanine Aminotransferase (ALT/SGPT)", unit: "U/L", min: 3, max: 50, referenceRange: "3 - 50", criticalHigh: 250, method: "UV without P5P", machine: "Beckman Coulter AU 5800", defaultValue: "22.0" },
      { id: "alp", name: "Alkaline Phosphatase (ALP)", unit: "U/L", min: 43, max: 115, referenceRange: "43 - 115", method: "AMP Buffer", machine: "Beckman Coulter AU 5800", defaultValue: "76.0" },
      { id: "ggt", name: "Gamma Glutamyl Transferase (GGT)", unit: "U/L", min: 5, max: 55, referenceRange: "5 - 55", method: "IFCC", machine: "Beckman Coulter AU 5800", defaultValue: "32.0" },
      { id: "total_protein", name: "Serum Total Protein", unit: "g/dL", min: 6.6, max: 8.3, referenceRange: "6.6 - 8.3", method: "Biuret", machine: "Beckman Coulter AU 5800", defaultValue: "7.30" },
      { id: "albumin", name: "Serum Albumin", unit: "g/dL", min: 3.5, max: 5.2, referenceRange: "3.5 - 5.2", method: "Bromocresol Green (BCG)", machine: "Beckman Coulter AU 5800", defaultValue: "4.20" },
      { id: "globulin", name: "Serum Globulin", unit: "g/dL", min: 3.0, max: 4.2, referenceRange: "3.0 - 4.2", method: "Calculated", machine: "Beckman Coulter AU 5800", defaultValue: "3.10" },
      { id: "ag_ratio", name: "Albumin / Globulin Ratio", unit: "Ratio", min: 1.2, max: 2.5, referenceRange: "1.2 - 2.5", method: "Calculated", machine: "Beckman Coulter AU 5800", defaultValue: "1.35" },
    ],
    interpretations: [
      {
        heading: "Hepatic Evaluation & Enzymes",
        content: "Transaminases (AST/ALT) and excretory enzymes (ALP/GGT) demonstrate preserved hepatocellular integrity with normal protein-synthetic capacity (Albumin/Globulin ratio within normal physiological limits)."
      }
    ],
    remarks: [
      "1. Bilirubin is measured by diazo reaction spectrophotometry.",
      "2. Mild isolated enzyme elevations may occur after vigorous physical exertion or medication."
    ]
  },
  {
    code: "KFT",
    name: "Kidney Function Test (KFT / Renal Profile)",
    department: "Biochemistry",
    sampleType: "Serum",
    standardPrice: 650,
    guidelinesRef: "Kidney Disease Improving Global Outcomes (KDIGO)",
    parameters: [
      { id: "creatinine", name: "Serum Creatinine", unit: "mg/dL", min: 0.7, max: 1.4, referenceRange: "0.7 - 1.4", criticalHigh: 4.0, method: "Modified Jaffe, Kinetic", machine: "Beckman Coulter AU 5800", defaultValue: "0.92" },
      { id: "egfr", name: "eGFR (Estimated Glomerular Filtration Rate)", unit: "mL/min/1.73m²", min: 90, max: 140, referenceRange: "> 90 Normal", criticalLow: 30, method: "Calculated (CKD-EPI)", machine: "Beckman Coulter AU 5800", defaultValue: "105.0" },
      { id: "blood_urea", name: "Blood Urea", unit: "mg/dL", min: 17, max: 43, referenceRange: "17 - 43", criticalHigh: 100, method: "GLDH, Kinetic assay", machine: "Beckman Coulter AU 5800", defaultValue: "26.0" },
      { id: "bun", name: "Blood Urea Nitrogen (BUN)", unit: "mg/dL", min: 8, max: 20, referenceRange: "8 - 20", method: "Calculated", machine: "Beckman Coulter AU 5800", defaultValue: "12.1" },
      { id: "uric_acid", name: "Serum Uric Acid", unit: "mg/dL", min: 3.5, max: 7.2, referenceRange: "3.5 - 7.2", method: "Uricase PAP", machine: "Beckman Coulter AU 5800", defaultValue: "5.4" },
      { id: "calcium", name: "Serum Calcium", unit: "mg/dL", min: 8.8, max: 10.6, referenceRange: "8.8 - 10.6", criticalLow: 6.0, criticalHigh: 13.0, method: "Arsenazo III", machine: "Beckman Coulter AU 5800", defaultValue: "9.5" },
      { id: "phosphorus", name: "Serum Phosphorus", unit: "mg/dL", min: 2.5, max: 4.5, referenceRange: "2.5 - 4.5", method: "Phosphomolybdate Complex", machine: "Beckman Coulter AU 5800", defaultValue: "3.6" },
      { id: "bun_creat_ratio", name: "BUN / Creatinine Ratio", unit: "Ratio", min: 10, max: 20, referenceRange: "10 - 20", method: "Calculated", machine: "Beckman Coulter AU 5800", defaultValue: "13.1" },
    ],
    interpretations: [
      {
        heading: "Renal Function & eGFR Interpretation",
        content: "Serum creatinine and estimated GFR indicate normal stage 1 renal clearance (> 90 mL/min/1.73m²). Electrolytes and mineral balance are maintained within physiological reference ranges.",
        table: {
          headers: ["CKD Stage", "eGFR Range (mL/min/1.73m²)", "Description"],
          rows: [
            ["Stage 1", "≥ 90", "Normal / High function"],
            ["Stage 2", "60 – 89", "Mild reduction"],
            ["Stage 3a / 3b", "30 – 59", "Moderate reduction"],
            ["Stage 4", "15 – 29", "Severe reduction"],
            ["Stage 5", "< 15", "Kidney failure"],
          ]
        }
      }
    ],
    remarks: [
      "1. eGFR calculated using standardized CKD-EPI formula adjusted for adult biological reference ranges.",
      "2. Adequate hydration recommended prior to subsequent monitoring."
    ]
  },
  {
    code: "HBA1C",
    name: "HbA1c (Glycosylated Hemoglobin)",
    department: "Biochemistry",
    sampleType: "Whole Blood EDTA",
    standardPrice: 500,
    guidelinesRef: "American Diabetes Association (ADA) Standards of Care 2024",
    parameters: [
      { id: "hba1c", name: "HbA1c (Glycosylated Hemoglobin)", unit: "%", min: 4.2, max: 5.7, referenceRange: "< 5.7 Normal", criticalHigh: 10.0, method: "Ion-Exchange HPLC", machine: "Tosoh G11 Automated Glycohemoglobin Analyzer", defaultValue: "5.4" },
      { id: "eag", name: "Average Estimated Glucose (eAG)", unit: "mg/dL", min: 70, max: 117, referenceRange: "70 - 117", method: "Calculated (28.7 × HbA1c - 46.7)", machine: "Tosoh G11", defaultValue: "108.3" },
    ],
    interpretations: [
      {
        heading: "American Diabetes Association (ADA) Diagnostic Criteria",
        content: "HbA1c reflects mean glycemic control over the preceding 90–120 days.",
        table: {
          headers: ["Diagnostic Category", "HbA1c (%)", "Estimated Avg Glucose (eAG)"],
          rows: [
            ["Normal / Non-Diabetic", "< 5.7 %", "< 117 mg/dL"],
            ["Pre-Diabetes / Impaired Glycemia", "5.7 – 6.4 %", "117 – 137 mg/dL"],
            ["Diabetes Mellitus", "≥ 6.5 %", "≥ 140 mg/dL"],
          ]
        }
      }
    ],
    remarks: [
      "1. NGSP certified and IFCC traceable High Performance Liquid Chromatography (HPLC).",
      "2. In cases of hemoglobin variants or hemolytic conditions, alternative glycemic monitoring (fructosamine) should be considered."
    ]
  },
  {
    code: "FBS",
    name: "Fasting Blood Sugar (Glucose)",
    department: "Biochemistry",
    sampleType: "Sodium Fluoride Plasma",
    standardPrice: 150,
    guidelinesRef: "ADA Diagnostic Guidelines",
    parameters: [
      { id: "fbs", name: "Glucose, Fasting Plasma", unit: "mg/dL", min: 70, max: 100, referenceRange: "70 - 100 Normal", criticalLow: 50, criticalHigh: 300, method: "Hexokinase Enzymatic", machine: "Beckman Coulter DXC 700 AU", defaultValue: "88.0" },
    ],
    interpretations: [
      {
        heading: "Fasting Glucose Classification",
        content: "Normal fasting plasma glucose: 70–100 mg/dL. Impaired fasting glucose (prediabetes): 101–125 mg/dL. Provisional diabetes: ≥ 126 mg/dL."
      }
    ],
    remarks: [
      "1. Sample drawn in sodium fluoride glycolytic inhibitor tube after 8-10 hour fast."
    ]
  },
  {
    code: "THYROID",
    name: "Thyroid Profile (Total T3, T4 & TSH Ultra-Sensitive)",
    department: "Immunology",
    sampleType: "Serum",
    standardPrice: 600,
    guidelinesRef: "American Thyroid Association (ATA)",
    parameters: [
      { id: "t3", name: "Tri-Iodothyronine (T3, Total)", unit: "ng/mL", min: 0.60, max: 1.81, referenceRange: "0.60 - 1.81", method: "Chemiluminescence Immunoassay (CLIA)", machine: "Siemens Atellica IM 1600", defaultValue: "1.15" },
      { id: "t4", name: "Thyroxine (T4, Total)", unit: "µg/dL", min: 3.2, max: 12.6, referenceRange: "3.2 - 12.6", method: "Chemiluminescence Immunoassay (CLIA)", machine: "Siemens Atellica IM 1600", defaultValue: "7.8" },
      { id: "tsh", name: "Thyroid Stimulating Hormone (TSH) Ultra-sensitive", unit: "µIU/mL", min: 0.55, max: 4.78, referenceRange: "0.55 - 4.78", criticalLow: 0.1, criticalHigh: 20.0, method: "Chemiluminescence Immunoassay (CLIA)", machine: "Siemens Atellica IM 1600", defaultValue: "2.10" },
    ],
    interpretations: [
      {
        heading: "Thyroid Axis Evaluation",
        content: "TSH and circulating total thyroid hormone levels demonstrate euthyroid state with intact pituitary-thyroid feedback regulation.",
        table: {
          headers: ["Pregnancy Trimester", "TSH Biological Reference Interval (µIU/mL)"],
          rows: [
            ["First Trimester", "0.10 – 2.50"],
            ["Second Trimester", "0.20 – 3.00"],
            ["Third Trimester", "0.30 – 3.00"],
          ]
        }
      }
    ],
    remarks: [
      "1. Circadian peak of TSH occurs between 2:00 AM – 4:00 AM; basal morning sampling recommended.",
      "2. Free fractions (FT3/FT4) or anti-TPO antibodies recommended if autoimmune etiology is suspected."
    ]
  },
  {
    code: "URINE",
    name: "Urine Routine & Microscopic Examination",
    department: "Clinical Pathology",
    sampleType: "Clean Catch Midstream Urine",
    standardPrice: 250,
    guidelinesRef: "European Confederation of Laboratory Medicine (ECLM)",
    parameters: [
      { id: "u_color", name: "Colour", unit: "Visual", referenceRange: "Pale Yellow", method: "Physical Examination", defaultValue: "Pale Yellow", options: ["Pale Yellow", "Yellow", "Dark Yellow", "Amber", "Red / Turbid"] },
      { id: "u_app", name: "Appearance", unit: "Visual", referenceRange: "Clear", method: "Physical Examination", defaultValue: "Clear", options: ["Clear", "Hazy", "Cloudy", "Turbid"] },
      { id: "u_sg", name: "Specific Gravity", unit: "Ratio", min: 1.001, max: 1.035, referenceRange: "1.001 - 1.035", method: "Dipstick-Ion Exchange", machine: "URIPLUS 600", defaultValue: "1.018" },
      { id: "u_ph", name: "pH", unit: "pH", min: 4.5, max: 7.5, referenceRange: "4.5 - 7.5", method: "Dipstick-Double Indicator", machine: "URIPLUS 600", defaultValue: "6.0" },
      { id: "u_prot", name: "Urine Protein / Albumin", unit: "Dipstick", referenceRange: "Negative", method: "Dipstick-Bromophenol Blue", machine: "URIPLUS 600", defaultValue: "Negative", options: ["Negative", "Trace", "1+ (30 mg/dL)", "2+ (100 mg/dL)", "3+ (300 mg/dL)"] },
      { id: "u_glu", name: "Urine Glucose", unit: "Dipstick", referenceRange: "Negative", method: "Dipstick-Glucose Oxidase", machine: "URIPLUS 600", defaultValue: "Negative", options: ["Negative", "Trace", "1+", "2+", "3+"] },
      { id: "u_ket", name: "Ketones", unit: "Dipstick", referenceRange: "Negative", method: "Dipstick-Nitroprusside", machine: "URIPLUS 600", defaultValue: "Negative", options: ["Negative", "Trace", "Positive"] },
      { id: "u_bili", name: "Bilirubin", unit: "Dipstick", referenceRange: "Negative", method: "Dipstick-Ehrlichs", machine: "URIPLUS 600", defaultValue: "Negative", options: ["Negative", "Positive"] },
      { id: "u_uro", name: "Urobilinogen", unit: "Dipstick", referenceRange: "Normal", method: "Dipstick-Ehrlichs", machine: "URIPLUS 600", defaultValue: "Normal", options: ["Normal", "Elevated"] },
      { id: "u_nit", name: "Nitrite", unit: "Dipstick", referenceRange: "Negative", method: "Dipstick-Griess", machine: "URIPLUS 600", defaultValue: "Negative", options: ["Negative", "Positive"] },
      { id: "u_bld", name: "Blood / Hemoglobin", unit: "Dipstick", referenceRange: "Nil", method: "Dipstick-Peroxidase", machine: "URIPLUS 600", defaultValue: "Nil", options: ["Nil", "Trace", "Moderate", "Large"] },
      { id: "u_pus", name: "Pus Cells (Leucocytes)", unit: "/HPF", min: 0, max: 5, referenceRange: "0 - 5", method: "Microscopic Examination", defaultValue: "1-2" },
      { id: "u_epi", name: "Epithelial Cells", unit: "/HPF", min: 0, max: 5, referenceRange: "0 - 5", method: "Microscopic Examination", defaultValue: "1-2" },
      { id: "u_rbc", name: "RBCs", unit: "/HPF", referenceRange: "Nil", method: "Microscopic Examination", defaultValue: "Nil" },
      { id: "u_casts", name: "Casts", unit: "/LPF", referenceRange: "Nil", method: "Microscopic Examination", defaultValue: "Nil" },
      { id: "u_cryst", name: "Crystals", unit: "/HPF", referenceRange: "Nil", method: "Microscopic Examination", defaultValue: "Nil" },
      { id: "u_bac", name: "Bacteria", unit: "/HPF", referenceRange: "Absent", method: "Microscopic Examination", defaultValue: "Absent", options: ["Absent", "Few", "Moderate", "Many"] },
    ],
    interpretations: [
      {
        heading: "Urine Routine Microscopic Evaluation",
        content: "Microscopic examination of centrifugal sediment reveals normal physiological cellular components without significant bacteriuria, casts, or crystal precipitation."
      }
    ],
    remarks: [
      "1. Fresh early morning mid-stream specimen collected in sterile container.",
      "2. Dipstick automated optical reflectance with manual microscopy validation."
    ]
  },
  {
    code: "ELECTROLYTES",
    name: "Serum Electrolytes (Sodium, Potassium, Chloride)",
    department: "Electrolytes",
    sampleType: "Serum",
    standardPrice: 400,
    guidelinesRef: "Clinical Laboratory Improvement Amendments (CLIA)",
    parameters: [
      { id: "na", name: "Serum Sodium (Na+)", unit: "mmol/L", min: 136, max: 146, referenceRange: "136 - 146", criticalLow: 120, criticalHigh: 160, method: "Direct Ion Selective Electrode (ISE)", machine: "Roche 9180 Electrolyte Analyzer", defaultValue: "140.0" },
      { id: "k", name: "Serum Potassium (K+)", unit: "mmol/L", min: 3.5, max: 5.1, referenceRange: "3.5 - 5.1", criticalLow: 2.8, criticalHigh: 6.2, method: "Direct Ion Selective Electrode (ISE)", machine: "Roche 9180 Electrolyte Analyzer", defaultValue: "4.2" },
      { id: "cl", name: "Serum Chloride (Cl-)", unit: "mmol/L", min: 101, max: 109, referenceRange: "101 - 109", criticalLow: 80, criticalHigh: 125, method: "Direct Ion Selective Electrode (ISE)", machine: "Roche 9180 Electrolyte Analyzer", defaultValue: "104.0" },
    ],
    interpretations: [
      {
        heading: "Acid-Base & Fluid Balance",
        content: "Serum sodium, potassium, and chloride concentrations reflect preserved extracellular osmolar and fluid balance."
      }
    ],
    remarks: [
      "1. Direct ISE measurement avoids pseudohyponatremia in hyperproteinemic/hyperlipidemic specimens."
    ]
  }
] as const;

export function getTestParameterSchema(testNameOrCode: string): TestDefinition {
  const query = (testNameOrCode || "").toLowerCase().trim();
  
  // 1. Direct match by code or name
  const found = STANDARD_TEST_CATALOG.find(t => 
    t.code.toLowerCase() === query || 
    t.name.toLowerCase().includes(query) ||
    query.includes(t.code.toLowerCase()) ||
    query.includes(t.name.toLowerCase())
  );
  if (found) return found;

  // 2. Fallback heuristic for other tests
  if (query.includes("blood") || query.includes("hem") || query.includes("cbc")) {
    return STANDARD_TEST_CATALOG[0]; // CBC
  }
  if (query.includes("lipid") || query.includes("cholesterol") || query.includes("triglyceride")) {
    return STANDARD_TEST_CATALOG[1]; // Lipid
  }
  if (query.includes("liver") || query.includes("lft") || query.includes("bilirubin") || query.includes("sgot") || query.includes("sgpt")) {
    return STANDARD_TEST_CATALOG[2]; // LFT
  }
  if (query.includes("kidney") || query.includes("kft") || query.includes("renal") || query.includes("creatinine") || query.includes("urea")) {
    return STANDARD_TEST_CATALOG[3]; // KFT
  }
  if (query.includes("sugar") || query.includes("glucose") || query.includes("fbs") || query.includes("diabetes")) {
    return STANDARD_TEST_CATALOG[5]; // FBS
  }
  if (query.includes("hba1c") || query.includes("glycated")) {
    return STANDARD_TEST_CATALOG[4]; // HbA1c
  }
  if (query.includes("thyroid") || query.includes("tsh") || query.includes("t3") || query.includes("t4")) {
    return STANDARD_TEST_CATALOG[6]; // Thyroid
  }
  if (query.includes("urine")) {
    return STANDARD_TEST_CATALOG[7]; // Urine
  }
  if (query.includes("electrolyte") || query.includes("sodium") || query.includes("potassium")) {
    return STANDARD_TEST_CATALOG[8]; // Electrolytes
  }

  // 3. Generic dynamic schema
  return {
    code: testNameOrCode.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "") || "TEST",
    name: testNameOrCode || "Diagnostic Clinical Test",
    department: "Clinical Pathology",
    sampleType: "Serum / Blood",
    standardPrice: 350,
    parameters: [
      {
        id: "param_1",
        name: testNameOrCode || "Test Result Parameter",
        unit: "mg/dL",
        referenceRange: "Normal",
        method: "Automated Clinical Analyzer",
        defaultValue: "Normal",
      }
    ],
    remarks: [
      "1. Test analyzed according to standard clinical laboratory operating procedures."
    ]
  };
}

export function evaluateParameterFlag(
  valueStr: string | number,
  param: ParameterDefinition
): {
  isAbnormal: boolean;
  isCritical: boolean;
  flag: "Normal" | "High" | "Low" | "Critical" | "Borderline";
  tone: "success" | "warning" | "danger" | "neutral";
} {
  const str = String(valueStr ?? "").trim();
  if (!str) {
    return { isAbnormal: false, isCritical: false, flag: "Normal", tone: "neutral" };
  }

  // Categorical string evaluations (Negative, Nil, Clear, Pale Yellow)
  const lower = str.toLowerCase();
  if (lower === "negative" || lower === "nil" || lower === "normal" || lower === "absent" || lower === "clear" || lower === "pale yellow") {
    return { isAbnormal: false, isCritical: false, flag: "Normal", tone: "success" };
  }
  if (lower === "positive" || lower === "present" || lower.includes("trace") || lower.includes("1+") || lower.includes("2+") || lower.includes("3+")) {
    return { isAbnormal: true, isCritical: false, flag: "Borderline", tone: "warning" };
  }

  const val = parseFloat(str);
  if (isNaN(val)) {
    return { isAbnormal: false, isCritical: false, flag: "Normal", tone: "neutral" };
  }

  // Critical checks
  if (param.criticalLow !== undefined && param.criticalLow !== null && val <= param.criticalLow) {
    return { isAbnormal: true, isCritical: true, flag: "Critical", tone: "danger" };
  }
  if (param.criticalHigh !== undefined && param.criticalHigh !== null && val >= param.criticalHigh) {
    return { isAbnormal: true, isCritical: true, flag: "Critical", tone: "danger" };
  }

  // Range checks
  if (param.min !== undefined && param.min !== null && val < param.min) {
    return { isAbnormal: true, isCritical: false, flag: "Low", tone: "warning" };
  }
  if (param.max !== undefined && param.max !== null && val > param.max) {
    return { isAbnormal: true, isCritical: false, flag: "High", tone: "warning" };
  }

  return { isAbnormal: false, isCritical: false, flag: "Normal", tone: "success" };
}
