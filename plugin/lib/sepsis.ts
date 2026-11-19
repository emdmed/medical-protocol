/**
 * Pure Sepsis/SOFA monitoring functions — shared between React component and CLI.
 * Sepsis-3 (2016 Third International Consensus), scored with SOFA-2 (JAMA 2025), and Surviving Sepsis Campaign 2026.
 */

import { safeParseFloat } from "./utils/safeParseFloat";

// ─── SOFA-2 Organ Scoring (each 0-4) ────────────────────────────────
// Ranzani et al., Development and Validation of the SOFA-2 Score, JAMA 2025;334(23):2090-2103.
// Missing values score 0 (no dysfunction), as in the SOFA-2 derivation.

/**
 * Respiratory SOFA-2. PaO2:FiO2 >300→0, ≤300→1, ≤225→2, ≤150+advanced support→3,
 * ≤75+advanced support→4; any ECMO→4. Without advanced support the maximum is 2,
 * unless support is unavailable or precluded by a ceiling of treatment.
 * Advanced support = HFNC, CPAP, BiPAP/NIV or invasive ventilation.
 * SpO2:FiO2 is used only when PaO2 is unavailable and SpO2 <98% (≤300→1, ≤250→2, ≤200→3, ≤120→4).
 */
export const calculateRespirationSOFA = (
  paO2: string,
  fiO2: string,
  advancedSupport: boolean,
  ecmo = false,
  spO2 = "",
  ceilingOfTreatment = false,
): number => {
  if (ecmo) return 4;
  const fio2 = safeParseFloat(fiO2);
  if (fio2 < 21 || fio2 > 100) return 0;
  const pao2 = safeParseFloat(paO2);
  const spo2 = safeParseFloat(spO2);

  let cuts: [number, number, number, number];
  let ratio: number;
  if (pao2 > 0) {
    ratio = pao2 / (fio2 / 100);
    cuts = [300, 225, 150, 75];
  } else if (spo2 > 0 && spo2 < 98) {
    ratio = spo2 / (fio2 / 100);
    cuts = [300, 250, 200, 120];
  } else {
    return 0;
  }

  const supportCounts = advancedSupport || ceilingOfTreatment;
  if (ratio <= cuts[3] && supportCounts) return 4;
  if (ratio <= cuts[2] && supportCounts) return 3;
  if (ratio <= cuts[1]) return 2;
  if (ratio <= cuts[0]) return 1;
  return 0;
};

/**
 * Hemostasis SOFA-2: platelets (×10³/µL). >150→0, ≤150→1, ≤100→2, ≤80→3, ≤50→4
 */
export const calculateCoagulationSOFA = (platelets: string): number => {
  const p = safeParseFloat(platelets);
  if (platelets === "" || p <= 0) return 0;
  if (p <= 50) return 4;
  if (p <= 80) return 3;
  if (p <= 100) return 2;
  if (p <= 150) return 1;
  return 0;
};

/**
 * Liver SOFA-2: total bilirubin (mg/dL). ≤1.2→0, ≤3.0→1, ≤6.0→2, ≤12.0→3, >12→4
 */
export const calculateLiverSOFA = (bilirubin: string): number => {
  const b = safeParseFloat(bilirubin);
  if (bilirubin === "" || b <= 0) return 0;
  if (b > 12) return 4;
  if (b > 6.0) return 3;
  if (b > 3.0) return 2;
  if (b > 1.2) return 1;
  return 0;
};

/**
 * Cardiovascular SOFA-2. Doses in µg/kg/min, continuous infusion ≥1 h, norepinephrine as base.
 * NE+E sum: ≤0.2→2, >0.2–0.4→3, >0.4→4. "Other agent" = any other vasopressor or inotrope
 * (vasopressin, dobutamine, …): alone→2, with low-dose NE+E→3, with medium-dose NE+E→4.
 * Mechanical circulatory support→4. Dopamine as the only vasopressor: ≤20→2, >20–40→3, >40→4.
 * No vasoactives: MAP <70→1. If vasoactives are unavailable or precluded by a ceiling of
 * treatment, MAP alone: 60–69→1, 50–59→2, 40–49→3, <40→4.
 */
export const calculateCardiovascularSOFA = (
  map: string,
  dopamine: string,
  dobutamine: string,
  epinephrine: string,
  norepinephrine: string,
  otherVasopressor = false,
  mechanicalSupport = false,
  ceilingOfTreatment = false,
): number => {
  if (mechanicalSupport) return 4;
  const mapVal = safeParseFloat(map);
  const dopa = safeParseFloat(dopamine);
  const neE = safeParseFloat(norepinephrine) + safeParseFloat(epinephrine);
  const otherAgent = otherVasopressor || safeParseFloat(dobutamine) > 0;

  if (neE > 0) {
    const withOther = otherAgent || dopa > 0;
    if (neE > 0.4) return 4;
    if (neE > 0.2) return withOther ? 4 : 3;
    return withOther ? 3 : 2;
  }
  if (dopa > 0 && !otherVasopressor) {
    if (dopa > 40) return 4;
    if (dopa > 20) return 3;
    return 2;
  }
  if (otherAgent || dopa > 0) return 2;

  if (mapVal <= 0) return 0;
  if (ceilingOfTreatment) {
    if (mapVal < 40) return 4;
    if (mapVal < 50) return 3;
    if (mapVal < 60) return 2;
  }
  return mapVal < 70 ? 1 : 0;
};

/**
 * Brain SOFA-2: GCS 15→0, 13–14→1, 9–12→2, 6–8→3, 3–5→4.
 * Drugs to treat delirium score at least 1. Sedated: use the last GCS before sedation.
 */
export const calculateCNSSOFA = (gcs: string, deliriumDrugs = false): number => {
  const g = safeParseFloat(gcs);
  let score = 0;
  if (gcs !== "" && g > 0) {
    if (g <= 5) score = 4;
    else if (g <= 8) score = 3;
    else if (g <= 12) score = 2;
    else if (g <= 14) score = 1;
  }
  return deliriumDrugs ? Math.max(score, 1) : score;
};

/**
 * Kidney SOFA-2. Creatinine (mg/dL): ≤1.2→0, ≤2.0→1, ≤3.5→2, >3.5→3.
 * Urine output over the collection: <0.5 mL/kg/h for 6–12 h→1, ≥12 h→2;
 * <0.3 mL/kg/h for ≥24 h or anuria for ≥12 h→3.
 * Receiving RRT (incl. chronic), or meeting RRT criteria→4:
 * (creatinine >1.2 or UO <0.3 mL/kg/h for >6 h) AND (K⁺ ≥6.0 or [pH ≤7.20 and HCO₃⁻ ≤12]).
 * RRT given only for non-renal reasons should not be passed as onRRT.
 */
export const calculateRenalSOFA = (
  creatinine: string,
  urineOutput: string,
  weight: string,
  hours: string,
  onRRT = false,
  potassium = "",
  pH = "",
  bicarbonate = "",
): number => {
  if (onRRT) return 4;
  const cr = safeParseFloat(creatinine);
  const uo = safeParseFloat(urineOutput);
  const w = safeParseFloat(weight);
  const h = safeParseFloat(hours);

  // shortcut: one averaged collection stands in for "sustained for N hours"; feed hourly data when available
  const rate = urineOutput !== "" && w > 0 && h > 0 ? uo / (w * h) : null;

  const k = safeParseFloat(potassium);
  const ph = safeParseFloat(pH);
  const hco3 = safeParseFloat(bicarbonate);
  const kidneyInjury = cr > 1.2 || (rate !== null && rate < 0.3 && h > 6);
  const lifeThreatening = k >= 6.0 || (pH !== "" && bicarbonate !== "" && ph <= 7.2 && hco3 <= 12);
  if (kidneyInjury && lifeThreatening) return 4;

  let crScore = 0;
  if (creatinine !== "" && cr > 0) {
    if (cr > 3.5) crScore = 3;
    else if (cr > 2.0) crScore = 2;
    else if (cr > 1.2) crScore = 1;
  }

  let uoScore = 0;
  if (rate !== null) {
    if ((uo === 0 && h >= 12) || (rate < 0.3 && h >= 24)) uoScore = 3;
    else if (rate < 0.5 && h >= 12) uoScore = 2;
    else if (rate < 0.5 && h >= 6) uoScore = 1;
  }

  return Math.max(crScore, uoScore);
};

// ─── Composite SOFA ─────────────────────────────────────────────────

export interface SOFAReading {
  paO2: string; fiO2: string; advancedRespiratorySupport: boolean;
  platelets: string; bilirubin: string;
  map: string; dopamine: string; dobutamine: string;
  epinephrine: string; norepinephrine: string;
  gcs: string; creatinine: string; urineOutput: string;
  ecmo?: boolean; spO2?: string;
  otherVasopressor?: boolean; mechanicalCirculatorySupport?: boolean;
  deliriumDrugs?: boolean;
  onRRT?: boolean; potassium?: string; pH?: string; bicarbonate?: string;
  ceilingOfTreatment?: boolean;
}

/**
 * Total SOFA-2 score: sum of 6 organ scores (0-24).
 */
export const calculateTotalSOFA = (
  reading: SOFAReading,
  weight: string,
  hours: string,
): number => {
  const ceiling = reading.ceilingOfTreatment ?? false;
  return (
    calculateRespirationSOFA(
      reading.paO2, reading.fiO2, reading.advancedRespiratorySupport,
      reading.ecmo, reading.spO2, ceiling,
    ) +
    calculateCoagulationSOFA(reading.platelets) +
    calculateLiverSOFA(reading.bilirubin) +
    calculateCardiovascularSOFA(
      reading.map, reading.dopamine, reading.dobutamine,
      reading.epinephrine, reading.norepinephrine,
      reading.otherVasopressor, reading.mechanicalCirculatorySupport, ceiling,
    ) +
    calculateCNSSOFA(reading.gcs, reading.deliriumDrugs) +
    calculateRenalSOFA(
      reading.creatinine, reading.urineOutput, weight, hours,
      reading.onRRT, reading.potassium, reading.pH, reading.bicarbonate,
    )
  );
};

/**
 * SOFA delta: change from baseline.
 */
export const calculateSOFADelta = (current: number, baseline: string): number => {
  const base = safeParseFloat(baseline);
  return current - base;
};

// ─── qSOFA Screening ────────────────────────────────────────────────

/**
 * qSOFA score (0-3): RR≥22 (+1), SBP≤100 (+1), GCS<15 (+1).
 * Prognostic only. SSC 2026 recommends against qSOFA alone for screening (use NEWS/NEWS2, MEWS or SIRS).
 */
export const calculateQSOFA = (
  respiratoryRate: string,
  sbp: string,
  gcs: string,
): number => {
  let score = 0;
  const rr = safeParseFloat(respiratoryRate);
  const s = safeParseFloat(sbp);
  const g = safeParseFloat(gcs);

  if (rr >= 22) score++;
  if (s > 0 && s <= 100) score++;
  if (g > 0 && g < 15) score++;

  return score;
};

/**
 * qSOFA positive if score ≥ 2.
 */
export const isQSOFAPositive = (score: number): boolean => score >= 2;

// ─── Sepsis-3 Assessment ────────────────────────────────────────────

/**
 * Sepsis-3: suspected infection + acute rise in SOFA ≥ 2 from baseline.
 * Baseline is assumed 0 when unknown (calculateSOFADelta does this), so the delta equals the score.
 * A known baseline (e.g. chronic organ dysfunction) must not be counted.
 */
export const assessSepsis = (
  sofaScore: number,
  sofaDelta: number,
  suspectedInfection: boolean,
): boolean => {
  void sofaScore;
  if (!suspectedInfection) return false;
  return sofaDelta >= 2;
};

/**
 * Septic shock: sepsis + vasopressors needed to maintain MAP ≥65 + lactate >2.
 */
export const assessSepticShock = (
  hasSepsis: boolean,
  vasopressorsNeeded: boolean,
  lactate: string,
): boolean => {
  if (!hasSepsis) return false;
  if (!vasopressorsNeeded) return false;
  const lac = safeParseFloat(lactate);
  return lac > 2;
};

// ─── Hour-1 Bundle ──────────────────────────────────────────────────

/**
 * Check that every indicated bundle item was started in time (SSC 2021/2026).
 * - Lactate, blood cultures, antimicrobials: always.
 * - ≥30 mL/kg crystalloid: only with hypotension or lactate ≥4 mmol/L.
 * - Vasopressors: only if hypotension persists during/after fluids (MAP <65).
 * - Time limit: 60 min; 180 min for possible sepsis without shock.
 * Omitted context fields keep the item required (safe default).
 */
export const assessBundleCompliance = (
  bundle: {
    lactateMeasured: boolean;
    bloodCulturesObtained: boolean;
    antibioticsGiven: boolean;
    fluidBolusGiven: boolean;
    vasopressorsStarted: boolean;
    bundleStartTime: number | null;
    hypotension?: boolean;
    initialLactate?: string;
    persistentHypotension?: boolean;
    possibleSepsisWithoutShock?: boolean;
  },
  currentTime: number,
): { complete: boolean; allItemsDone: boolean; withinTimeLimit: boolean; pending: string[]; timeLimitMinutes: number } => {
  const fluidContextKnown = bundle.hypotension !== undefined || bundle.initialLactate !== undefined;
  const fluidsIndicated = !fluidContextKnown
    || !!bundle.hypotension
    || safeParseFloat(bundle.initialLactate ?? "") >= 4;
  const vasopressorsIndicated = bundle.persistentHypotension ?? true;

  const pending = [
    !bundle.lactateMeasured && "lactate",
    !bundle.bloodCulturesObtained && "blood cultures",
    !bundle.antibioticsGiven && "antimicrobials",
    fluidsIndicated && !bundle.fluidBolusGiven && "fluids",
    vasopressorsIndicated && !bundle.vasopressorsStarted && "vasopressors",
  ].filter((x): x is string => !!x);
  const allItemsDone = pending.length === 0;
  const timeLimitMinutes = bundle.possibleSepsisWithoutShock ? 180 : 60;

  if (!bundle.bundleStartTime) {
    return { complete: false, allItemsDone, withinTimeLimit: false, pending, timeLimitMinutes };
  }

  const elapsedMinutes = (currentTime - bundle.bundleStartTime) / 60;
  const withinTimeLimit = elapsedMinutes <= timeLimitMinutes;

  return {
    complete: allItemsDone && withinTimeLimit,
    allItemsDone,
    withinTimeLimit,
    pending,
    timeLimitMinutes,
  };
};

// ─── Lactate Clearance ──────────────────────────────────────────────

/**
 * Calculate lactate clearance: % decrease from initial to repeat.
 * Returns null if inputs are invalid.
 */
export const calculateLactateClearance = (
  initial: string,
  repeat: string,
): string | null => {
  const init = safeParseFloat(initial);
  const rep = safeParseFloat(repeat);
  if (init <= 0 || initial === "") return null;
  if (repeat === "") return null;
  const clearance = ((init - rep) / init) * 100;
  return clearance.toFixed(1);
};

/**
 * Adequate lactate clearance: ≥10% decrease.
 */
export const isLactateClearanceAdequate = (clearance: string | null): boolean => {
  if (!clearance) return false;
  const c = parseFloat(clearance);
  return !isNaN(c) && c >= 10;
};

// ─── Utilities ──────────────────────────────────────────────────────

/**
 * SOFA severity level based on total score.
 */
export const getSOFASeverityLevel = (
  score: number,
): "Low" | "Moderate" | "High" | "Very High" => {
  if (score <= 5) return "Low";
  if (score <= 10) return "Moderate";
  if (score <= 15) return "High";
  return "Very High";
};

/**
 * Get severity color key for SOFA level.
 */
export const getSOFASeverity = (
  score: number,
): "normal" | "warning" | "critical" => {
  if (score <= 5) return "normal";
  if (score <= 10) return "warning";
  return "critical";
};

/**
 * Check if any vasopressor is running (for septic shock).
 * Dobutamine is an inotrope, not a vasopressor: it is accepted for positional compatibility but not counted.
 */
export const hasVasopressors = (
  dopamine: string,
  dobutamine: string,
  epinephrine: string,
  norepinephrine: string,
  otherVasopressor = false,
): boolean => {
  void dobutamine;
  return (
    otherVasopressor ||
    safeParseFloat(dopamine) > 0 ||
    safeParseFloat(epinephrine) > 0 ||
    safeParseFloat(norepinephrine) > 0
  );
};
