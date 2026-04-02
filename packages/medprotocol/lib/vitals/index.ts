/**
 * CLI-safe vitals barrel — re-exports from self-contained modules.
 * For React components, import directly from the source validation files.
 */

export {
  BLOOD_PRESSURE_LIMITS,
  getBloodPressureCategory,
} from "./blood-pressure";

export {
  HEART_RATE_LIMITS,
  getHeartRateCategory,
} from "./heart-rate";

export {
  RESPIRATORY_RATE_LIMITS,
  getRespiratoryRateCategory,
} from "./respiratory-rate";

export {
  TEMPERATURE_LIMITS,
  validateTemperatureInput,
  isElevatedTemperature,
  isLowTemperature,
  parseTemperatureValue,
  getTemperatureLimits,
  getTemperatureStatusCli,
} from "./temperature";

export { BloodOxygenValidations } from "./blood-oxygen";
