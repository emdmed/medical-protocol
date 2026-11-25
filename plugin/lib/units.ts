/**
 * The values an extraction hands on (`toInputs`), put in the unit the calculators take. The note's
 * own value and unit stay in `from`, so a screen can show both. Exact conversions only; a unit not
 * listed here is left as stated.
 */

import { FIELDS, type ExtractedInput, type FieldKey } from "./extraction";

const UMOL_PER_MGDL = 88.4; // creatinine, 113.12 g/mol
const MMHG_PER_KPA = 7.50062;

/** Per key: the note's unit (lower case) → what to multiply by, and the decimals kept. The target is the key's first unit in `FIELDS`. */
const FACTORS: Partial<Record<FieldKey, { digits: number; from: Record<string, number> }>> = {
  creatinine: { digits: 2, from: { "µmol/l": 1 / UMOL_PER_MGDL, "μmol/l": 1 / UMOL_PER_MGDL, "umol/l": 1 / UMOL_PER_MGDL } },
  hb: { digits: 1, from: { "g/l": 0.1 } },
  albumin: { digits: 1, from: { "g/l": 0.1 } },
  pao2: { digits: 1, from: { kpa: MMHG_PER_KPA } },
  pco2: { digits: 1, from: { kpa: MMHG_PER_KPA } },
  "hypotension-min": { digits: 0, from: { h: 60, hr: 60, hrs: 60, hour: 60, hours: 60, horas: 60 } },
};

export interface ConvertedInput extends ExtractedInput {
  /** The value and unit as the note states them; set only when the value was converted. */
  from?: string;
}

/** `input` in the unit the calculators take for `key`; unchanged when it is already there, has no unit, or has no exact conversion. */
export const toExpectedUnit = (key: FieldKey, input: ExtractedInput): ConvertedInput => {
  // an FiO2 with no unit from 0.21 to 1 can only be a fraction: as a percentage it would be below air
  if (key === "fio2" && !input.unit && input.value >= 0.21 && input.value <= 1) {
    return { ...input, value: Number((input.value * 100).toFixed(1)), unit: "%", from: String(input.value) };
  }
  const rule = FACTORS[key];
  const factor = input.unit && rule?.from[input.unit.trim().toLowerCase()];
  if (!rule || !factor) return input;
  return { ...input, value: Number((input.value * factor).toFixed(rule.digits)), unit: (FIELDS[key].units as readonly string[])[0], from: `${input.value} ${input.unit}` };
};
