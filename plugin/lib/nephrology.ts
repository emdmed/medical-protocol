// Shared with ckd.ts — one implementation
export { checkESAEligibility, getCKDMBDMonitoring } from "./ckd";
import { assessPhosphate, assessPTH, assessVitaminD, correctCalcium, classifyAnemia } from "./ckd";
import type { Severity } from "./severity";

/**
 * Nephrology specialty calculations.
 *
 * - Cardio-metabolic: lipid targets, HbA1c classification, BP in CKD
 * - Phospho-calcic: Ca×P product, corrected Ca, PTH targets by CKD stage
 * - Anemia: iron deficiency assessment, Hb target, TSAT/ferritin adequacy
 */

const sf = (v: string): number => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

// ═══════════════════════════════════════════════════════════════════
// CARDIO-METABOLIC
// ═══════════════════════════════════════════════════════════════════

export function classifyLDL(ldl: string): {
  label: string;
  severity: Severity;
} {
  const v = sf(ldl);
  if (v === 0) return { label: "—", severity: "normal" };
  // CKD patients: LDL < 70 optimal for high CV risk
  if (v < 70) return { label: "Optimal", severity: "normal" };
  if (v < 100) return { label: "Acceptable", severity: "normal" };
  if (v < 130) return { label: "Borderline", severity: "warning" };
  return { label: "Elevated", severity: "critical" };
}

export function classifyHbA1c(hba1c: string): {
  label: string;
  severity: Severity;
} {
  const v = sf(hba1c);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 5.7) return { label: "Normal", severity: "normal" };
  if (v < 6.5) return { label: "Prediabetes", severity: "warning" };
  if (v < 8.0) return { label: "Controlled diabetic", severity: "warning" };
  return { label: "Uncontrolled diabetic", severity: "critical" };
}

export function classifyBPInCKD(
  sbp: string,
  dbp: string,
): { label: string; severity: Severity } {
  const s = sf(sbp);
  const d = sf(dbp);
  if (s === 0 || d === 0) return { label: "—", severity: "normal" };
  // KDIGO 2021: target < 120/80 for CKD
  if (s < 120 && d < 80) return { label: "On target", severity: "normal" };
  if (s < 140 && d < 90) return { label: "Above target", severity: "warning" };
  return { label: "Uncontrolled", severity: "critical" };
}

export function classifyTriglycerides(tg: string): {
  label: string;
  severity: Severity;
} {
  const v = sf(tg);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 150) return { label: "Normal", severity: "normal" };
  if (v < 200) return { label: "Borderline", severity: "warning" };
  if (v < 500) return { label: "Elevated", severity: "warning" };
  return { label: "Very high", severity: "critical" };
}

export function classifyLpa(lpa: string): {
  label: string;
  severity: Severity;
} {
  const v = sf(lpa);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 30) return { label: "Normal", severity: "normal" };
  if (v < 50) return { label: "Elevated", severity: "warning" };
  return { label: "Very high", severity: "critical" };
}

export function classifyNonHDL(nonHdl: number): {
  label: string;
  severity: Severity;
} {
  if (nonHdl <= 0) return { label: "—", severity: "normal" };
  if (nonHdl < 100) return { label: "Optimal", severity: "normal" };
  if (nonHdl < 130) return { label: "Acceptable", severity: "normal" };
  if (nonHdl < 160) return { label: "Borderline", severity: "warning" };
  return { label: "Elevated", severity: "critical" };
}

export function classifyApoB(apoB: string): {
  label: string;
  severity: Severity;
} {
  const v = sf(apoB);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 80) return { label: "Optimal", severity: "normal" };
  if (v < 100) return { label: "Acceptable", severity: "normal" };
  if (v < 120) return { label: "Borderline", severity: "warning" };
  return { label: "Elevated", severity: "critical" };
}

/** Non-HDL cholesterol = total cholesterol − HDL (mg/dL). */
export function calculateNonHDL(totalCholesterol: string, hdl: string): number | null {
  const tc = sf(totalCholesterol);
  const h = sf(hdl);
  if (tc === 0 || h === 0 || h >= tc) return null;
  return Math.round(tc - h);
}

export interface StatinIndicationInput {
  age: number | null;
  gfrCategory: string;
  onDialysis?: boolean;
  kidneyTransplant?: boolean;
  alreadyOnStatin?: boolean;
  /** Known coronary disease (MI or coronary revascularization) */
  coronaryDisease?: boolean;
  hasDiabetes?: boolean;
  priorIschemicStroke?: boolean;
  /** Estimated 10-year incidence of coronary death or non-fatal MI > 10% */
  tenYearCoronaryRiskOver10?: boolean;
}

/**
 * Statin indication in adult CKD (KDIGO 2013 Lipid Management in CKD, recs 2.1–2.4).
 * LDL level does not drive the decision; age, eGFR, dialysis and risk factors do.
 */
export function getStatinIndication(input: StatinIndicationInput): {
  indicated: boolean;
  recommendation: string;
  grade: string;
} {
  const { age, gfrCategory } = input;
  if (input.onDialysis) {
    return input.alreadyOnStatin
      ? { indicated: true, recommendation: "On dialysis and already on a statin: KDIGO criterion to continue met", grade: "2C" }
      : { indicated: false, recommendation: "On dialysis, not on a statin: KDIGO criterion to start a statin not met", grade: "2A" };
  }
  if (input.kidneyTransplant) {
    return { indicated: true, recommendation: "Kidney transplant recipient: meets KDIGO statin criterion", grade: "2B" };
  }
  if (age === null || age < 18) {
    return { indicated: false, recommendation: "Adult criteria only (age ≥18 required)", grade: "" };
  }
  if (!gfrCategory) {
    return { indicated: false, recommendation: "GFR category required", grade: "" };
  }
  const below60 = ["G3a", "G3b", "G4", "G5"].includes(gfrCategory);
  if (age >= 50) {
    return below60
      ? { indicated: true, recommendation: "Age ≥50 with eGFR <60: meets KDIGO criterion for statin or statin/ezetimibe", grade: "1A" }
      : { indicated: true, recommendation: "Age ≥50 with eGFR ≥60: meets KDIGO statin criterion", grade: "1B" };
  }
  const factors = [
    input.coronaryDisease && "coronary disease",
    input.hasDiabetes && "diabetes",
    input.priorIschemicStroke && "prior ischemic stroke",
    input.tenYearCoronaryRiskOver10 && "10-y coronary risk >10%",
  ].filter(Boolean);
  if (factors.length > 0) {
    return { indicated: true, recommendation: `Age 18–49 with ${factors.join(", ")}: meets KDIGO statin criterion`, grade: "2A" };
  }
  return { indicated: false, recommendation: "Age 18–49 without high-risk factors: KDIGO statin criterion not met", grade: "" };
}

// ═══════════════════════════════════════════════════════════════════
// PHOSPHO-CALCIC
// ═══════════════════════════════════════════════════════════════════

/** Ca × P product (mg²/dL²). Target: < 55 */
export function calculateCaPhProduct(
  calcium: string,
  phosphorus: string,
): number | null {
  const ca = sf(calcium);
  const ph = sf(phosphorus);
  if (ca === 0 || ph === 0) return null;
  return Math.round(ca * ph * 10) / 10;
}

/** Albumin-corrected calcium: Ca_corr = Ca + 0.8 × (4.0 − albumin) */
export function calculateCorrectedCalcium(
  calcium: string,
  albumin: string,
): number | null {
  const corrected = correctCalcium(calcium, albumin);
  return corrected === 0 ? null : corrected;
}

export function classifyCalcium(ca: string): {
  label: string;
  severity: Severity;
} {
  const v = sf(ca);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 8.5) return { label: "Hypocalcemia", severity: "warning" };
  if (v > 10.5) return { label: "Hypercalcemia", severity: "warning" };
  return { label: "Normal", severity: "normal" };
}

export function classifyPhosphorus(ph: string): {
  label: string;
  severity: Severity;
} {
  const v = sf(ph);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 2.5) return { label: "Hypophosphatemia", severity: "warning" };
  if (v > 4.5) return { label: "Hyperphosphatemia", severity: "warning" };
  return { label: "Normal", severity: "normal" };
}

/** PTH display class, consistent with assessPTH (normal range G1–G3b; 2–9× ULN for G4–G5). */
export function classifyPTH(pth: string, gfrCategory?: string): {
  label: string;
  severity: Severity;
} {
  const v = sf(pth);
  if (v === 0) return { label: "—", severity: "normal" };
  if (gfrCategory === "G4" || gfrCategory === "G5") {
    if (v > 585) return { label: "Very high (>9× ULN)", severity: "critical" };
    if (v >= 130) return { label: "Within target (2–9× ULN)", severity: "normal" };
    return { label: "Below target (<2× ULN)", severity: "warning" };
  }
  if (v > 65) return { label: "Elevated", severity: "warning" };
  if (v < 15) return { label: "Low", severity: "warning" };
  return { label: "Normal", severity: "normal" };
}

export function classifyVitaminD(vd: string): {
  label: string;
  severity: Severity;
} {
  const v = sf(vd);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 20) return { label: "Deficiency", severity: "critical" };
  if (v < 30) return { label: "Insufficiency", severity: "warning" };
  return { label: "Sufficient", severity: "normal" };
}

export function classifyCaPhProduct(product: number): {
  label: string;
  severity: Severity;
} {
  if (product < 55) return { label: "Normal", severity: "normal" };
  return { label: "Elevated — vascular calcification risk", severity: "critical" };
}

// ═══════════════════════════════════════════════════════════════════
// ANEMIA
// ═══════════════════════════════════════════════════════════════════

/**
 * Hb against the ESA treatment target (KDIGO 2012 anemia recs 3.2.3–3.2.4):
 * keep ≤11.5 g/dL, never intentionally >13. For anemia diagnosis use classifyAnemiaBySex.
 */
export function classifyHemoglobin(hb: string): {
  label: string;
  severity: Severity;
} {
  const v = sf(hb);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 7) return { label: "Severe anemia", severity: "critical" };
  if (v < 10) return { label: "Below ESA target", severity: "warning" };
  if (v <= 11.5) return { label: "Within ESA target", severity: "normal" };
  if (v <= 13) return { label: "Above ESA target (>11.5)", severity: "warning" };
  return { label: "Too high on ESA (>13)", severity: "critical" };
}

export function classifyFerritin(ferritin: string): {
  label: string;
  severity: Severity;
} {
  const v = sf(ferritin);
  if (v === 0) return { label: "—", severity: "normal" };
  // CKD non-dialysis: ferritin < 100 = absolute deficiency
  if (v < 100) return { label: "Absolute deficiency", severity: "critical" };
  if (v < 200) return { label: "Low stores", severity: "warning" };
  if (v > 800) return { label: "Overload", severity: "warning" };
  return { label: "Adequate", severity: "normal" };
}

export function classifyTSAT(tsat: string): {
  label: string;
  severity: Severity;
} {
  const v = sf(tsat);
  if (v === 0) return { label: "—", severity: "normal" };
  // CKD: TSAT < 20% = functional iron deficiency
  if (v < 20) return { label: "Functional deficiency", severity: "critical" };
  if (v > 50) return { label: "Oversaturation", severity: "warning" };
  return { label: "Adequate", severity: "normal" };
}

/**
 * Iron therapy (KDIGO 2012 anemia recs 2.1.2–2.1.3): absolute/functional deficiency
 * (ferritin <100 ng/mL or TSAT <20%), or a trial of iron when TSAT ≤30% and ferritin ≤500.
 * Not routinely given when ferritin >500.
 */
export function needsIronSupplementation(
  ferritin: string,
  tsat: string,
): { needed: boolean; reason: string } {
  const f = sf(ferritin);
  const t = sf(tsat);
  if (f === 0 && t === 0) return { needed: false, reason: "" };
  if (f > 500) return { needed: false, reason: "Ferritin >500 ng/mL; above KDIGO iron criteria" };
  if ((f > 0 && f < 100) || (t > 0 && t < 20)) {
    return { needed: true, reason: "Absolute or functional iron deficiency" };
  }
  if (f === 0 || t === 0) return { needed: false, reason: "Both ferritin and TSAT are needed" };
  if (t <= 30) {
    return { needed: true, reason: "TSAT ≤30% and ferritin ≤500 ng/mL: meets KDIGO criterion for a trial of iron" };
  }
  return { needed: false, reason: "Adequate iron stores" };
}

/**
 * Sex-specific anemia classification (KDIGO 2012), display wrapper over ckd.classifyAnemia.
 * Male: Hb <13 g/dL anemic; Female: Hb <12 g/dL anemic.
 */
export function classifyAnemiaBySex(
  hb: string,
  sex: string,
): { label: string; severity: Severity; anemic: boolean } {
  const { anemic, severity } = classifyAnemia(hb, sex);
  if (severity === "unknown") return { label: "—", severity: "normal", anemic: false };
  if (severity === "none") return { label: "Normal", severity: "normal", anemic: false };
  if (severity === "mild") return { label: "Mild anemia", severity: "warning", anemic };
  return { label: severity === "moderate" ? "Moderate anemia" : "Severe anemia", severity: "critical", anemic };
}

// ═══════════════════════════════════════════════════════════════════
// PHOSPHO-CALCIC RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════

/** Phosphate recommendation by GFR category (wraps ckd.assessPhosphate; blank input → empty). */
export function getPhosphateRecommendation(
  phosphorus: string,
  gfrCategory = "",
): { status: string; recommendation: string } {
  if (sf(phosphorus) === 0) return { status: "unknown", recommendation: "" };
  return assessPhosphate(phosphorus, gfrCategory);
}

/** PTH recommendation by GFR category (wraps ckd.assessPTH; blank input → empty). */
export function getPTHRecommendation(
  pth: string,
  gfrCategory = "",
): { status: string; recommendation: string } {
  if (sf(pth) === 0) return { status: "unknown", recommendation: "" };
  return assessPTH(pth, gfrCategory);
}

/** Vitamin D recommendation (wraps ckd.assessVitaminD; blank input → empty). */
export function getVitaminDRecommendation(
  vitaminD: string,
): { status: string; recommendation: string } {
  if (sf(vitaminD) === 0) return { status: "unknown", recommendation: "" };
  return assessVitaminD(vitaminD);
}

