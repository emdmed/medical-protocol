/**
 * CLI-safe blood oxygen validation — self-contained, no React dependency.
 * Logic mirrors blood-oxygen-validations.tsx.
 */

export const bloodOxygenValidations = {
  spo2: {
    isValid: (value: string | number): boolean => {
      const num = parseFloat(String(value));
      return !isNaN(num) && num >= 70 && num <= 100;
    },

    isLow: (value: string | number): boolean => {
      const num = parseFloat(String(value));
      return !isNaN(num) && num < 95;
    },

    isCritical: (value: string | number): boolean => {
      const num = parseFloat(String(value));
      return !isNaN(num) && num < 90;
    },

    getSeverity: (value: string | number): "critical" | "low" | "normal" | "invalid" => {
      if (!bloodOxygenValidations.spo2.isValid(value)) return "invalid";
      if (bloodOxygenValidations.spo2.isCritical(value)) return "critical";
      if (bloodOxygenValidations.spo2.isLow(value)) return "low";
      return "normal";
    },

    MIN_VALUE: 70,
    MAX_VALUE: 100,
    LOW_THRESHOLD: 95,
    CRITICAL_THRESHOLD: 90,
  },

  fio2: {
    isValid: (value: string | number): boolean => {
      const num = parseFloat(String(value));
      return !isNaN(num) && num >= 21 && num <= 100;
    },

    isSupplemental: (value: string | number): boolean => {
      const num = parseFloat(String(value));
      return !isNaN(num) && num > 21;
    },

    isRoomAir: (value: string | number): boolean => {
      const num = parseFloat(String(value));
      return num === 21;
    },

    MIN_VALUE: 21,
    MAX_VALUE: 100,
    DEFAULT_VALUE: 21,
    ROOM_AIR_VALUE: 21,
  },

  utils: {
    calculateRatio: (spo2Value: string | number, fio2Value: string | number): string | null => {
      const spo2 = parseFloat(String(spo2Value));
      const fio2 = parseFloat(String(fio2Value));

      if (isNaN(spo2) || isNaN(fio2) || fio2 === 0) return null;

      const ratio = (spo2 / (fio2 / 100));
      return ratio.toFixed(0);
    },
  },
};

/** @deprecated Use bloodOxygenValidations instead */
export const BloodOxygenValidations = bloodOxygenValidations;
