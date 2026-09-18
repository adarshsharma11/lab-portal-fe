import { LETTERHEAD_TEMPLATE_BASE64 } from "./letterhead-template-base64";
import { LETTERHEAD_ALIGARH_BASE64 } from "./letterhead-aligarh-base64";

export interface FranchiseLetterheadConfig {
  id: "varanasi" | "aligarh" | string;
  franchiseName: string;
  franchiseCode: string;
  franchiseCity: string;
  backgroundImage: string;
  paddingTop: string;
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
  doctorSignatureArea: {
    showOverlayDoctorTitle: boolean;
    doctorName?: string;
    doctorCredentials?: string;
  };
  footerNoteArea: {
    endOfReportText: string;
  };
}

/**
 * Letterhead Template Configuration for Varanasi Franchise (BL Diagnostic Hub)
 */
export const VARANASI_LETTERHEAD_CONFIG: FranchiseLetterheadConfig = {
  id: "varanasi",
  franchiseName: "Varanasi",
  franchiseCode: "VAR-01",
  franchiseCity: "Varanasi",
  backgroundImage: LETTERHEAD_TEMPLATE_BASE64,
  paddingTop: "165px",
  paddingBottom: "140px",
  paddingLeft: "36px",
  paddingRight: "48px",
  doctorSignatureArea: {
    showOverlayDoctorTitle: false, // Dr. Namrata's signature and credentials are pre-printed on the background
  },
  footerNoteArea: {
    endOfReportText: "Page 1 of 1 · *** End Of Report ***",
  },
};

/**
 * Letterhead Template Configuration for Aligarh Franchise (DEV HOSPITAL PATHOLOGY)
 */
export const ALIGARH_LETTERHEAD_CONFIG: FranchiseLetterheadConfig = {
  id: "aligarh",
  franchiseName: "Aligarh",
  franchiseCode: "ALG-02",
  franchiseCity: "Aligarh",
  backgroundImage: LETTERHEAD_ALIGARH_BASE64,
  paddingTop: "276px",
  paddingBottom: "155px",
  paddingLeft: "36px",
  paddingRight: "48px",
  doctorSignatureArea: {
    showOverlayDoctorTitle: false, // Dr. Batra Varshney credentials are pre-printed on the header of the letterhead
    doctorName: "Dr. Batra Varshney",
    doctorCredentials: "M.B.B.S. M.D. (Pathology)",
  },
  footerNoteArea: {
    endOfReportText: "Page 1 of 1 · *** End Of Report ***",
  },
};

/**
 * Registry of all available franchise letterheads
 */
export const FRANCHISE_LETTERHEAD_REGISTRY: Record<string, FranchiseLetterheadConfig> = {
  varanasi: VARANASI_LETTERHEAD_CONFIG,
  aligarh: ALIGARH_LETTERHEAD_CONFIG,
  "alg-02": ALIGARH_LETTERHEAD_CONFIG,
  "var-01": VARANASI_LETTERHEAD_CONFIG,
};

export interface ResolveLetterheadOptions {
  franchiseId?: string | null;
  franchiseCode?: string | null;
  franchiseCity?: string | null;
  franchiseName?: string | null;
  report?: any;
  patient?: any;
  franchisesList?: Array<{ id: string; name?: string; code?: string; city?: string }>;
}

/**
 * Dynamically resolves the correct letterhead configuration based on franchise ID, code, city, or name.
 * Falls back safely to Varanasi (default) if unassigned or unrecognized.
 */
export function resolveReportLetterhead(options?: ResolveLetterheadOptions): FranchiseLetterheadConfig {
  if (!options) return VARANASI_LETTERHEAD_CONFIG;

  const { franchiseId, franchiseCode, franchiseCity, franchiseName, report, patient, franchisesList } = options;

  // Gather all identifier strings for the target franchise
  const identifiers: string[] = [];

  const addId = (val?: unknown) => {
    if (typeof val === "string" && val.trim()) {
      identifiers.push(val.trim().toLowerCase());
    }
  };

  addId(franchiseId);
  addId(franchiseCode);
  addId(franchiseCity);
  addId(franchiseName);

  // Check from report object
  if (report) {
    addId(report.franchiseId);
    if (typeof report.franchise === "object" && report.franchise) {
      addId(report.franchise.id);
      addId(report.franchise.code);
      addId(report.franchise.name);
      addId(report.franchise.city);
    }
  }

  // Check from patient object
  if (patient) {
    addId(patient.franchiseId);
    if (typeof patient.franchise === "object" && patient.franchise) {
      addId(patient.franchise.id);
      addId(patient.franchise.code);
      addId(patient.franchise.name);
      addId(patient.franchise.city);
    }
  }

  // Cross-reference with loaded franchises list if franchiseId is present
  const targetFranchiseId = franchiseId || report?.franchiseId || patient?.franchiseId;
  if (targetFranchiseId && franchisesList && franchisesList.length > 0) {
    const fObj = franchisesList.find((f) => f.id === targetFranchiseId);
    if (fObj) {
      addId(fObj.id);
      addId(fObj.code);
      addId(fObj.name);
      addId(fObj.city);
    }
  }

  // Detection logic for Aligarh
  const isAligarh = identifiers.some(
    (idStr) =>
      idStr === "aligarh" ||
      idStr === "alg-02" ||
      idStr.includes("aligarh") ||
      idStr.includes("alg-") ||
      idStr.includes("dev hospital") ||
      idStr.includes("vishakha")
  );

  if (isAligarh) {
    return ALIGARH_LETTERHEAD_CONFIG;
  }

  // Default / Varanasi
  return VARANASI_LETTERHEAD_CONFIG;
}
