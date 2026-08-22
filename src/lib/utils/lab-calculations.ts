export const calculateAnionGap = (sodium: number, chloride: number, bicarbonate: number): number => sodium - chloride - bicarbonate;
export const calculateLdl = (cholesterol: number, hdl: number, triglycerides: number): number => cholesterol - hdl - triglycerides / 5;
export const calculateVldl = (triglycerides: number): number => triglycerides / 5;
export const calculateEgfr = (creatinine: number, age: number, female: boolean): number => { const factor = female ? 0.742 : 1; return Math.round(175 * Math.pow(creatinine, -1.154) * Math.pow(age, -0.203) * factor); };
