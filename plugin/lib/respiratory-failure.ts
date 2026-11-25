/**
 * Respiratory failure and distress: gas exchange and bedside signs in, two separate verdicts out.
 * Ported from medextract's `syndromes/respiratory-failure/rule.ts` (`assessRespiratoryFailure`).
 *
 * TWO VERDICTS THAT STAY APART. FAILURE is gas exchange, decided by numbers (a saturation or an
 * arterial gas). DISTRESS is work of breathing, decided at the bedside (a rate and four signs). A
 * tiring asthmatic with a rate of 12 is in failure with no rate to show for it (rf-09); a patient
 * breathing 32 a minute on a probe that will not read is in distress with no measure of failure (rf-06).
 *
 * IT SAYS LESS THAN IT COULD, ON PURPOSE.
 *   - A normal number on oxygen is what the support achieves (rf-04, rf-10): indeterminate.
 *   - A normal number with nothing saying what the patient was breathing is not reassurance (rf-05).
 *   - Hypercapnia is decided only by an arterial gas. A venous pCO2 is not a PaCO2 (rf-07). Without
 *     one it is `not_determined`, never `absent`.
 *
 * NOTHING HERE RECOMMENDS A TREATMENT. `next` names what would decide what the verdicts left open.
 */

import { analyze } from "./acid-base";
import { MMHG_PER_KPA } from "./units";
import { bloodOxygenValidations } from "./vital-signs-validations/blood-oxygen-validations";
import { safeParseFloatOrNull } from "./utils/safeParseFloat";

/** Source: alkor's pack.toml `[clinical.respiratoryFailureRule]`. */
export const RESPIRATORY_FAILURE_LIMITS = {
  /** A measured rate at or above this is distress: the rate BTS and CURB-65 treat as severe in an adult. */
  distressRespiratoryRateAtLeast: 30,
  /** An arterial PaO2 below this (8 kPa) is hypoxaemia: the conventional definition of hypoxaemic failure. */
  arterialPo2BelowMmHg: 60,
  /** An arterial PaCO2 above this (6 kPa), with the disorder below, is hypercapnia. */
  arterialPco2AboveMmHg: 45,
  /** `analyze`'s primary disorder that makes a gas hypercapnic; a compensated retainer is "Mixed Disorder", not acute failure. */
  hypercapnicDisorder: "Respiratory Acidosis",
  /** The SpO2 severity (vital-signs-validations) that is hypoxaemia: below 90%. "low" (90-94%) is not failure. */
  saturationSeverity: "critical",
} as const;

/** Each enum finding's values, in alkor's schema order; a finding left out was not stated. */
export const ENUM_FIELDS = {
  oxygenSupport: ["room_air", "supplemental_oxygen", "non_invasive_ventilation", "invasive_ventilation"],
  accessoryMuscles: ["present", "absent"],
  speech: ["full_sentences", "limited"],
  paradoxicalBreathing: ["present", "absent"],
  cyanosis: ["present", "absent"],
  bloodGas: ["arterial", "venous"],
  gasUnit: ["kPa", "mmHg"],
} as const;
/** The gas numbers, as the note writes them, in `gasUnit`. */
export const GAS_FIELDS = ["ph", "po2", "pco2", "hco3"] as const;

export type RespiratoryFailureInput = { [K in keyof typeof ENUM_FIELDS]?: (typeof ENUM_FIELDS)[K][number] } & {
  [K in (typeof GAS_FIELDS)[number]]?: string;
} & {
  /** Measured, breaths/min. */
  respiratoryRate?: string;
  /** Measured SpO2, %, on whatever `oxygenSupport` says. */
  oxygenSaturation?: string;
};

export type FailureVerdict = "present" | "absent" | "indeterminate";

export const FAILURE_REASONS = [
  "hypoxaemia",
  "hypercapnia",
  "hypoxaemia_and_hypercapnia",
  "adequate_on_room_air",
  "venous_gas_only",
  "adequate_on_support",
  "oxygen_support_not_stated",
  "saturation_not_calculated",
  "no_oxygenation_measure",
] as const;
export type FailureReason = (typeof FAILURE_REASONS)[number];

export type Limb = "present" | "absent" | "not_determined";
export type DistressVerdict = "present" | "absent" | "not_assessed";

export const DISTRESS_SIGNS = ["respiratory_rate", "accessory_muscles", "speech", "paradoxical_breathing", "cyanosis"] as const;
export type DistressSign = (typeof DISTRESS_SIGNS)[number];

export const NEXT = ["oxygen_saturation", "oxygen_support", "room_air_saturation", "arterial_blood_gas", "respiratory_rate"] as const;
export type Next = (typeof NEXT)[number];

/** The arterial gas as read: in mmHg, with `analyze`'s primary disorder. */
export interface ArterialGas {
  /** The note's unit, or inferred from the pCO2 when unwritten. */
  unit: "kPa" | "mmHg" | null;
  ph: number | null;
  po2MmHg: number | null;
  pco2MmHg: number | null;
  hco3: number | null;
  /** null when the gas lacked pH, pCO2 or HCO3. */
  disorder: string | null;
}

export interface RespiratoryFailureAssessment {
  failure: FailureVerdict;
  failureReason: FailureReason;
  hypoxaemia: Limb;
  hypercapnia: Limb;
  distress: DistressVerdict;
  /** In `DISTRESS_SIGNS` order. Empty unless distress is present. */
  distressSigns: DistressSign[];
  /** In `NEXT` order. What would decide what the verdicts left open, never what to treat. */
  next: Next[];
  measured: { respiratoryRate: number | null; oxygenSaturation: number | null };
  /** Only an arterial gas; a venous gas is never here. */
  arterialGas: ArterialGas | null;
  /** A number that could not be used, with why. */
  notCalculated: string[];
}

/**
 * A PaCO2 is 3-15 kPa or 20-120 mmHg in anyone alive, so 20 splits the ranges. A pO2 cannot settle
 * it (8 kPa and 60 mmHg are both unremarkable), so no unit and no pCO2 leaves no usable pressures.
 */
const unitOf = (stated: RespiratoryFailureInput["gasUnit"], pco2: number | null): ArterialGas["unit"] =>
  stated ?? (pco2 === null ? null : pco2 <= 20 ? "kPa" : "mmHg");

/** Rounded to a tenth, so the number compared is the number printed (rf-09: 8.0 kPa is 60.0, not below 60). */
const inMmHg = (x: number | null, unit: ArterialGas["unit"]): number | null =>
  x === null || unit === null ? null : unit === "kPa" ? Math.round(x * MMHG_PER_KPA * 10) / 10 : x;

export const assessRespiratoryFailure = (input: RespiratoryFailureInput): RespiratoryFailureAssessment => {
  const L = RESPIRATORY_FAILURE_LIMITS;
  const respiratoryRate = safeParseFloatOrNull(input.respiratoryRate);
  const oxygenSaturation = safeParseFloatOrNull(input.oxygenSaturation);
  const saturationGiven = !!input.oxygenSaturation?.trim();
  const notCalculated: string[] = [];

  let severity: string | null = null;
  if (saturationGiven) {
    const s = bloodOxygenValidations.spo2;
    if (s.isValid(input.oxygenSaturation!)) severity = s.getSeverity(input.oxygenSaturation!);
    else notCalculated.push(`saturation ${input.oxygenSaturation}%: ${s.getErrorMessage(input.oxygenSaturation!)}`);
  }

  let arterialGas: ArterialGas | null = null;
  if (input.bloodGas === "arterial") {
    const [ph, po2, pco2, hco3] = GAS_FIELDS.map((f) => safeParseFloatOrNull(input[f]));
    const unit = unitOf(input.gasUnit, pco2);
    const pco2MmHg = inMmHg(pco2, unit);
    const abg = pco2MmHg === null ? null : analyze({
      values: { pH: input.ph ?? "", pCO2: String(pco2MmHg), HCO3: input.hco3 ?? "", Na: "", Cl: "", Albumin: "" },
      isChronic: false,
    });
    arterialGas = { unit, ph, po2MmHg: inMmHg(po2, unit), pco2MmHg, hco3, disorder: abg?.disorder ?? null };
  }
  const po2 = arterialGas?.po2MmHg ?? null;

  // Either measure over its line is enough, and only room air lets a number clear it.
  const hypoxaemia: Limb =
    severity === L.saturationSeverity || (po2 !== null && po2 < L.arterialPo2BelowMmHg)
      ? "present"
      : input.oxygenSupport === "room_air" && (severity !== null || po2 !== null)
        ? "absent"
        : "not_determined";

  const hypercapnia: Limb =
    arterialGas?.disorder == null
      ? "not_determined"
      : arterialGas.disorder === L.hypercapnicDisorder && arterialGas.pco2MmHg! > L.arterialPco2AboveMmHg
        ? "present"
        : "absent";

  let failure: FailureVerdict;
  let failureReason: FailureReason;
  if (hypoxaemia === "present" || hypercapnia === "present") {
    failure = "present";
    failureReason = hypoxaemia === hypercapnia ? "hypoxaemia_and_hypercapnia" : hypoxaemia === "present" ? "hypoxaemia" : "hypercapnia";
  } else if (hypoxaemia === "absent") {
    // A venous gas is someone asking about CO2; it cannot answer, so failure is not called absent over it.
    failure = input.bloodGas === "venous" ? "indeterminate" : "absent";
    failureReason = input.bloodGas === "venous" ? "venous_gas_only" : "adequate_on_room_air";
  } else {
    failure = "indeterminate";
    failureReason =
      !saturationGiven && po2 === null
        ? "no_oxygenation_measure"
        : severity === null && po2 === null
          ? "saturation_not_calculated"
          : input.oxygenSupport === undefined
            ? "oxygen_support_not_stated"
            : "adequate_on_support";
  }

  const met: Record<DistressSign, boolean> = {
    respiratory_rate: respiratoryRate !== null && respiratoryRate >= L.distressRespiratoryRateAtLeast,
    accessory_muscles: input.accessoryMuscles === "present",
    speech: input.speech === "limited",
    paradoxical_breathing: input.paradoxicalBreathing === "present",
    cyanosis: input.cyanosis === "present",
  };
  const distressSigns = DISTRESS_SIGNS.filter((s) => met[s]);
  // Absent needs a measured rate under the line: no rate and no sign is not an assessment.
  const distress: DistressVerdict = distressSigns.length ? "present" : respiratoryRate !== null ? "absent" : "not_assessed";

  const next = NEXT.filter((n) => {
    if (n === "oxygen_saturation") return !saturationGiven && po2 === null;
    if (n === "oxygen_support") return failureReason === "oxygen_support_not_stated";
    // Only for oxygen: a ventilated patient has no saturation on air to take.
    if (n === "room_air_saturation") return failureReason === "adequate_on_support" && input.oxygenSupport === "supplemental_oxygen";
    if (n === "arterial_blood_gas") {
      return hypercapnia === "not_determined" && (failure === "present" || distress === "present" || failureReason === "venous_gas_only");
    }
    return respiratoryRate === null && distress !== "present";
  });

  return {
    failure,
    failureReason,
    hypoxaemia,
    hypercapnia,
    distress,
    distressSigns,
    next,
    measured: { respiratoryRate, oxygenSaturation },
    arterialGas,
    notCalculated,
  };
};

export const RF_FAILURE_LABELS: Record<FailureVerdict, string> = {
  present: "Respiratory failure",
  absent: "No respiratory failure",
  indeterminate: "Failure indeterminate",
};

export const RF_FAILURE_REASONS: Record<FailureReason, string> = {
  hypoxaemia: "Hypoxaemia: SpO2 below 90% or PaO2 below 60 mmHg (8 kPa)",
  hypercapnia: "Hypercapnia: an arterial respiratory acidosis with PaCO2 above 45 mmHg (6 kPa)",
  hypoxaemia_and_hypercapnia: "Hypoxaemia and hypercapnia",
  adequate_on_room_air: "Oxygenation adequate on room air",
  venous_gas_only: "Oxygenation adequate on room air, but only a venous gas: CO2 is not answered",
  adequate_on_support: "Oxygenation adequate on oxygen or ventilation: that is what the support achieves",
  oxygen_support_not_stated: "Oxygenation adequate, but nothing says what the patient was breathing",
  saturation_not_calculated: "The saturation could not be used",
  no_oxygenation_measure: "No saturation and no arterial PaO2",
};

export const RF_LIMB_LABELS: Record<Limb, string> = {
  present: "Present",
  absent: "Absent",
  not_determined: "Not determined",
};

export const RF_DISTRESS_LABELS: Record<DistressVerdict, string> = {
  present: "Respiratory distress",
  absent: "No respiratory distress",
  not_assessed: "Distress not assessed",
};

export const RF_SIGN_LABELS: Record<DistressSign, string> = {
  respiratory_rate: "Respiratory rate 30/min or more",
  accessory_muscles: "Accessory muscle use",
  speech: "Speech limited",
  paradoxical_breathing: "Paradoxical breathing",
  cyanosis: "Cyanosis",
};

export const RF_NEXT_LABELS: Record<Next, string> = {
  oxygen_saturation: "Measure oxygen saturation",
  oxygen_support: "State what the patient was breathing (room air, oxygen or ventilation)",
  room_air_saturation: "A saturation on room air, if safe to take",
  arterial_blood_gas: "Arterial blood gas",
  respiratory_rate: "Count the respiratory rate",
};

/** Say this wherever the result is shown. */
export const RF_CAVEAT = "Two bounded reads kept apart: failure is gas exchange, distress is work of breathing. Not a diagnosis and not a treatment: a normal number on oxygen is what the support achieves.";
