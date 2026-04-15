/**
 * Pure DKA (Diabetic Ketoacidosis) monitoring functions — shared between React component and CLI.
 */

import { safeParseFloat } from "./utils/safeParseFloat";

/**
 * Glucose reduction rate.
 * Target: ≥3.0 mmol/L/hr or ≥54 mg/dL/hr
 */
export const calculateGlucoseReductionRate = (
  current: string,
  previous: string,
  hours: string,
): string | null => {
  const h = safeParseFloat(hours);
  if (h <= 0) return null;
  if (current === "" || previous === "") return null;
  const curr = safeParseFloat(current);
  const prev = safeParseFloat(previous);
  // Rate = (previous - current) / hours  (positive = decreasing, which is good)
  const rate = (prev - curr) / h;
  return rate.toFixed(1);
};

/**
 * Check if glucose reduction rate meets target.
 * Target: ≥3.0 mmol/L/hr (mmol) or ≥54 mg/dL/hr (mgdl)
 */
export const isGlucoseOnTarget = (rate: string | null, unit: "mmol" | "mgdl"): boolean => {
  if (!rate) return false;
  const r = parseFloat(rate);
  if (isNaN(r)) return false;
  return unit === "mmol" ? r >= 3.0 : r >= 54;
};

/**
 * Ketone reduction rate.
 * Target: ≥0.5 mmol/L/hr
 */
export const calculateKetoneReductionRate = (
  current: string,
  previous: string,
  hours: string,
): string | null => {
  const h = safeParseFloat(hours);
  if (h <= 0) return null;
  if (current === "" || previous === "") return null;
  const curr = safeParseFloat(current);
  const prev = safeParseFloat(previous);
  const rate = (prev - curr) / h;
  return rate.toFixed(2);
};

/**
 * Check if ketone reduction rate meets target (≥0.5 mmol/L/hr).
 */
export const isKetoneOnTarget = (rate: string | null): boolean => {
  if (!rate) return false;
  const r = parseFloat(rate);
  return !isNaN(r) && r >= 0.5;
};

/**
 * Bicarbonate increase rate.
 * Target: ≥3.0 mmol/L/hr
 */
export const calculateBicarbonateIncreaseRate = (
  current: string,
  previous: string,
  hours: string,
): string | null => {
  const h = safeParseFloat(hours);
  if (h <= 0) return null;
  if (current === "" || previous === "") return null;
  const curr = safeParseFloat(current);
  const prev = safeParseFloat(previous);
  // Rate = (current - previous) / hours  (positive = increasing, which is good)
  const rate = (curr - prev) / h;
  return rate.toFixed(1);
};

/**
 * Check if bicarbonate increase rate meets target (≥3.0 mmol/L/hr).
 */
export const isBicarbonateOnTarget = (rate: string | null): boolean => {
  if (!rate) return false;
  const r = parseFloat(rate);
  return !isNaN(r) && r >= 3.0;
};

/**
 * Classify potassium level.
 */
export const classifyPotassium = (value: string): string => {
  const v = safeParseFloat(value);
  if (v === 0 && value === "") return "Unknown";
  if (v < 3.0) return "Critical Low";
  if (v < 4.0) return "Low";
  if (v <= 5.0) return "Normal";
  if (v <= 6.0) return "High";
  return "Critical High";
};

/**
 * Get potassium severity for badge coloring.
 */
export const getPotassiumSeverity = (value: string): string => {
  const v = safeParseFloat(value);
  if (v === 0 && value === "") return "default";
  if (v < 3.0) return "critical";
  if (v < 4.0) return "warning";
  if (v <= 5.0) return "normal";
  if (v <= 6.0) return "warning";
  return "critical";
};

/**
 * Calculate urine output rate.
 * Target: ≥0.5 mL/kg/hr
 */
export const calculateUrineOutputRate = (
  volume: string,
  weight: string,
  hours: string,
): string | null => {
  const w = safeParseFloat(weight);
  const h = safeParseFloat(hours);
  if (w <= 0 || h <= 0) return null;
  const vol = safeParseFloat(volume);
  // Rate = volume / (weight × hours) in mL/kg/hr
  const rate = vol / (w * h);
  return rate.toFixed(2);
};

/**
 * Check if urine output rate meets target (≥0.5 mL/kg/hr).
 */
export const isUrineOutputOnTarget = (rate: string | null): boolean => {
  if (!rate) return false;
  const r = parseFloat(rate);
  return !isNaN(r) && r >= 0.5;
};

/**
 * Classify GCS (Glasgow Coma Scale).
 */
export const classifyGCS = (value: string): string => {
  const v = safeParseFloat(value);
  if (v === 0 && value === "") return "Unknown";
  if (v < 3 || v > 15) return "Invalid";
  if (v === 15) return "Normal";
  if (v >= 13) return "Mild";
  if (v >= 9) return "Moderate";
  return "Severe";
};

/**
 * Check if GCS is decreasing (drop ≥2 = cerebral edema warning).
 */
export const isGCSDecreasing = (current: string, previous: string): boolean => {
  const curr = safeParseFloat(current);
  const prev = safeParseFloat(previous);
  if (curr === 0 || prev === 0) return false;
  return (prev - curr) >= 2;
};

/**
 * Assess DKA resolution — all 4 criteria must be met.
 * 1. Glucose < 11.1 mmol/L (< 200 mg/dL)
 * 2. Ketones < 0.6 mmol/L
 * 3. Bicarbonate ≥ 15 mmol/L
 * 4. pH > 7.30
 */
export const assessDKAResolution = (
  glucose: string,
  ketones: string,
  bicarbonate: string,
  pH: string,
  unit: "mmol" | "mgdl",
): { resolved: boolean; criteria: Record<string, boolean> } => {
  const glu = safeParseFloat(glucose);
  const ket = safeParseFloat(ketones);
  const bic = safeParseFloat(bicarbonate);
  const ph = safeParseFloat(pH);

  const glucoseThreshold = unit === "mmol" ? 11.1 : 200;
  const glucoseMet = glu > 0 && glu < glucoseThreshold;
  const ketonesMet = ket >= 0 && ketones !== "" && ket < 0.6;
  const bicarbonateMet = bic >= 15;
  const pHMet = ph > 7.30;

  return {
    resolved: glucoseMet && ketonesMet && bicarbonateMet && pHMet,
    criteria: {
      glucose: glucoseMet,
      ketones: ketonesMet,
      bicarbonate: bicarbonateMet,
      pH: pHMet,
    },
  };
};

/**
 * Suggest insulin adjustment based on glucose level and reduction rate.
 */
export const suggestInsulinAdjustment = (
  glucose: string,
  rate: string | null,
  insulinRate: string,
  unit: "mmol" | "mgdl",
): string => {
  const glu = safeParseFloat(glucose);
  const ins = safeParseFloat(insulinRate);

  if (glu === 0 && glucose === "") return "Insufficient data";
  if (ins <= 0) return "Insufficient data";

  // Thresholds
  const lowThreshold = unit === "mmol" ? 14 : 252;
  const targetThreshold = unit === "mmol" ? 11.1 : 200;

  if (glu < targetThreshold) {
    return "Consider switching to subcutaneous insulin";
  }

  if (glu < lowThreshold) {
    return "Consider reducing insulin rate and adding dextrose";
  }

  // Check reduction rate
  if (rate) {
    const r = parseFloat(rate);
    if (!isNaN(r)) {
      const targetRate = unit === "mmol" ? 3.0 : 54;
      if (r < targetRate) {
        return "Consider increasing insulin rate";
      }
    }
  }

  return "Maintain current insulin rate";
};
