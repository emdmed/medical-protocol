/**
 * CLI-safe respiratory rate validation — self-contained, no React dependency.
 * Logic mirrors respiratory-rate-validations.tsx.
 */

export interface RespiratoryRateValidation {
  category: "Elevated" | "Low" | "Normal";
}

export const RESPIRATORY_RATE_LIMITS = {
  MIN: 8,
  MAX: 40,
  CATEGORIES: { ELEVATED: 18, LOW: 12 },
};

export const getRespiratoryRateCategory = (
  respiratoryRate: string | number,
): RespiratoryRateValidation | null => {
  const rate =
    typeof respiratoryRate === "string"
      ? parseInt(respiratoryRate)
      : respiratoryRate;

  if (!rate || isNaN(rate)) return null;

  if (rate > RESPIRATORY_RATE_LIMITS.CATEGORIES.ELEVATED) {
    return { category: "Elevated" };
  }

  if (rate < RESPIRATORY_RATE_LIMITS.CATEGORIES.LOW) {
    return { category: "Low" };
  }

  return { category: "Normal" };
};
