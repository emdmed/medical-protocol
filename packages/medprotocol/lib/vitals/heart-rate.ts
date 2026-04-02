/**
 * CLI-safe heart rate validation — self-contained, no React dependency.
 * Logic mirrors heart-rate-validations.tsx.
 */

export interface HeartRateCategory {
  category: "Elevated" | "Low" | "Normal";
}

export const HEART_RATE_LIMITS = {
  MIN: 30,
  MAX: 220,
  CATEGORIES: { ELEVATED: 100, LOW: 60 },
};

export const getHeartRateCategory = (heartRate: number): HeartRateCategory | null => {
  if (!heartRate) return null;

  if (heartRate > HEART_RATE_LIMITS.CATEGORIES.ELEVATED) {
    return { category: "Elevated" };
  }

  if (heartRate < HEART_RATE_LIMITS.CATEGORIES.LOW) {
    return { category: "Low" };
  }

  return { category: "Normal" };
};
