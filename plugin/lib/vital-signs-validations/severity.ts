/**
 * Severity grading for vital signs.
 *
 * Maps the categories produced by ../validations/* onto the shared severity
 * scale defined in components/medprotocol-theme.css, so a mildly abnormal
 * value reads as a warning while a dangerous one reads as critical.
 *
 * The validation modules are intentionally left untouched — this layer only
 * grades their output.
 *
 * @note The critical cutoffs below are common adult reference values
 *       (hypertensive crisis, severe tachy/bradycardia, severe tachypnea,
 *       hyperpyrexia, severe hypothermia, severe hypoxemia). They drive
 *       display emphasis only. Review them against your own protocol.
 */
import { getBloodPressureCategory } from "./blood-pressure-validations";
import { getHeartRateCategory } from "./heart-rate-validations";
import {
  getRespiratoryRateCategory,
  parseRespiratoryRateValue,
} from "./respiratory-rate-validations";
import {
  getTemperatureStatus,
  parseTemperatureValue,
} from "./temperature-validations";
import { bloodOxygenValidations } from "./blood-oxygen-validations";
import type { Severity } from "../severity";

export type VitalSeverity = Severity;

export interface SeverityResult {
  severity: VitalSeverity;
  /** Short badge label, or null when the value is normal or unset. */
  label: string | null;
}

const NORMAL: SeverityResult = { severity: "normal", label: null };

const critical = (label: string): SeverityResult => ({
  severity: "critical",
  label,
});

const warning = (label: string): SeverityResult => ({
  severity: "warning",
  label,
});

export const CRITICAL_LIMITS = {
  BLOOD_PRESSURE: {
    HIGH_SYSTOLIC: 180,
    HIGH_DIASTOLIC: 120,
    LOW_SYSTOLIC: 80,
    LOW_DIASTOLIC: 50,
  },
  HEART_RATE: { HIGH: 130, LOW: 45 },
  RESPIRATORY_RATE: { HIGH: 30, LOW: 8 },
  TEMPERATURE: {
    FAHRENHEIT: { HIGH: 105.8, LOW: 89.6 },
    CELSIUS: { HIGH: 41, LOW: 32 },
  },
};

export const getBloodPressureSeverity = (
  systolic: number | null | undefined,
  diastolic: number | null | undefined,
): SeverityResult => {
  if (systolic == null || diastolic == null) return NORMAL;

  const limits = CRITICAL_LIMITS.BLOOD_PRESSURE;

  if (systolic >= limits.HIGH_SYSTOLIC || diastolic >= limits.HIGH_DIASTOLIC) {
    return critical("Hypertensive crisis");
  }

  if (systolic < limits.LOW_SYSTOLIC || diastolic < limits.LOW_DIASTOLIC) {
    return critical("Severe hypotension");
  }

  const category = getBloodPressureCategory(systolic, diastolic);
  if (!category || category.category === "Normal") return NORMAL;

  return warning(category.category);
};

export const getHeartRateSeverity = (
  heartRate: number | null | undefined,
): SeverityResult => {
  if (heartRate == null) return NORMAL;

  if (heartRate > CRITICAL_LIMITS.HEART_RATE.HIGH) {
    return critical("Severe tachycardia");
  }

  if (heartRate < CRITICAL_LIMITS.HEART_RATE.LOW) {
    return critical("Severe bradycardia");
  }

  const category = getHeartRateCategory(heartRate);
  if (!category || category.category === "Normal") return NORMAL;

  return warning(category.category);
};

export const getRespiratoryRateSeverity = (
  respiratoryRate: string | number | null | undefined,
): SeverityResult => {
  const rate = parseRespiratoryRateValue(respiratoryRate ?? null);
  if (rate === null) return NORMAL;

  if (rate > CRITICAL_LIMITS.RESPIRATORY_RATE.HIGH) {
    return critical("Severe tachypnea");
  }

  if (rate < CRITICAL_LIMITS.RESPIRATORY_RATE.LOW) {
    return critical("Severe bradypnea");
  }

  const category = getRespiratoryRateCategory(rate);
  if (!category || category.category === "Normal") return NORMAL;

  return warning(category.category);
};

export const getTemperatureSeverity = (
  temperature: string | number | null | undefined,
  useFahrenheit: boolean = true,
): SeverityResult => {
  const value = parseTemperatureValue(temperature ?? "");
  if (value === null) return NORMAL;

  const limits = useFahrenheit
    ? CRITICAL_LIMITS.TEMPERATURE.FAHRENHEIT
    : CRITICAL_LIMITS.TEMPERATURE.CELSIUS;

  if (value >= limits.HIGH) return critical("Hyperpyrexia");
  if (value < limits.LOW) return critical("Severe hypothermia");

  const status = getTemperatureStatus(value, useFahrenheit);
  if (!status || status.type === "normal") return NORMAL;

  return warning(status.label);
};

export const getBloodOxygenSeverity = (
  saturation: number | null | undefined,
): SeverityResult => {
  if (saturation == null) return NORMAL;

  switch (bloodOxygenValidations.spo2.getSeverity(saturation)) {
    case "critical":
      return critical("Severe hypoxemia");
    case "low":
      return warning("Low");
    default:
      return NORMAL;
  }
};
