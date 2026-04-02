/**
 * CLI-safe blood pressure validation — self-contained, no React dependency.
 * Logic mirrors blood-pressure-validations.tsx.
 */

export const BLOOD_PRESSURE_LIMITS = {
  SYSTOLIC: { MIN: 40, MAX: 350, VALIDATION_MIN: 50 },
  DIASTOLIC: { MIN: 10, MAX: 130 },
  CATEGORIES: {
    HIGH_SYSTOLIC: 130,
    HIGH_DIASTOLIC: 90,
    LOW_SYSTOLIC: 90,
    LOW_DIASTOLIC: 60,
  },
};

export interface BloodPressureCategory {
  category: "High" | "Low";
}

export const getBloodPressureCategory = (
  systolic: number,
  diastolic: number,
): BloodPressureCategory | null => {
  if (!systolic || !diastolic) return null;

  const { HIGH_SYSTOLIC, HIGH_DIASTOLIC, LOW_SYSTOLIC, LOW_DIASTOLIC } =
    BLOOD_PRESSURE_LIMITS.CATEGORIES;

  if (systolic > HIGH_SYSTOLIC || diastolic >= HIGH_DIASTOLIC) {
    return { category: "High" };
  }

  if (systolic < LOW_SYSTOLIC || diastolic < LOW_DIASTOLIC) {
    return { category: "Low" };
  }

  return null;
};
