/**
 * Pure PaFi (PaO2/FiO2) calculation functions — shared between React component and CLI.
 */

import { safeParseFloat } from "./utils/safeParseFloat";

export const calculatePaFi = (paO2: string, fiO2: string): string | null => {
  const paO2Num = safeParseFloat(paO2);
  const fiO2Num = safeParseFloat(fiO2);

  if (paO2Num <= 0) return null;
  if (fiO2Num < 21 || fiO2Num > 100) return null;

  // PaFi = PaO2 / (FiO2 / 100)
  const ratio = paO2Num / (fiO2Num / 100);
  return ratio.toFixed(0);
};

// Berlin Definition (JAMA 2012;307:2526-2533) oxygenation ranges: mild 201–300, moderate 101–200, severe ≤100.
// The ratio alone is not an ARDS diagnosis: Berlin also needs timing, imaging, origin of edema and PEEP ≥5.
/** The cut-offs and the name of each band, low to high. A ratio equal to a cut-off belongs to the band below it. */
export const PAFI_BANDS = {
  cuts: [100, 200, 300],
  labels: ["Berlin severe range", "Berlin moderate range", "Berlin mild range", "Normal"],
} as const;

export const getPaFiClassification = (paFi: string | null): string => {
  if (!paFi) return "Unknown";
  const value = parseFloat(paFi);
  if (isNaN(value)) return "Unknown";
  return PAFI_BANDS.labels[PAFI_BANDS.cuts.filter((cut) => value > cut).length];
};

export const getPaFiSeverity = (paFi: string | null): string => {
  if (!paFi) return "default";
  const value = parseFloat(paFi);
  if (isNaN(value)) return "default";
  if (value > 300) return "normal";
  if (value > 200) return "mild";
  if (value > 100) return "moderate";
  return "severe";
};
