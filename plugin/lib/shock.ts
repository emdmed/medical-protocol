/**
 * Shock category from the bedside examination: skin temperature by jugular venous pressure.
 *
 * Vazquez et al. (J Hosp Med 2010;5:471-474), a pilot study of 68 patients hypotensive for more than
 * 30 minutes. The two findings put 52 of 68 (76%) in the right category. That is the ceiling: the
 * result is a bedside heuristic, not a diagnosis. Ported from medextract's `syndromes/shock/rule.ts`.
 */

import { safeParseFloatOrNull } from "./utils/safeParseFloat";

/** The study's cut-offs. Outside its cohort the rule declines to answer. */
export const SHOCK_LIMITS = {
  /** Systolic below this, in mmHg. */
  systolicBelow: 90,
  /** For at least this many minutes. */
  minutesAtLeast: 30,
  /** A measured JVP above this, in cmH2O, is elevated. Strictly above. */
  jvpElevatedAboveCmH2O: 7,
} as const;

/** Every finding can be `not_assessed`: a finding nobody examined is never guessed. */
export const SHOCK_FINDINGS = {
  skin: ["warm", "cool", "not_assessed"],
  jvp: ["elevated", "normal_or_low", "not_assessed"],
  capillaryRefill: ["brisk", "delayed", "not_assessed"],
  pulseVolume: ["bounding", "normal", "thready", "not_assessed"],
  lungExam: ["clear", "bilateral_crackles", "unilateral_crackles", "not_assessed"],
} as const;

export type SkinTemperature = (typeof SHOCK_FINDINGS.skin)[number];
export type JugularVenousPressure = (typeof SHOCK_FINDINGS.jvp)[number];
export type CapillaryRefill = (typeof SHOCK_FINDINGS.capillaryRefill)[number];
export type PulseVolume = (typeof SHOCK_FINDINGS.pulseVolume)[number];
export type LungExam = (typeof SHOCK_FINDINGS.lungExam)[number];

/** Obstructive shock is absent on purpose: the study had none, and the two findings cannot tell it from cardiogenic. */
export type ShockCategory = "septic" | "cardiogenic" | "hypovolemic" | "indeterminate";

export type IndeterminateReason = "outside_studied_cohort" | "primary_finding_not_assessed" | "discordant_primary_findings";

export type SecondaryFinding = "capillaryRefill" | "pulseVolume" | "lungExam";

export interface ShockExam {
  /** mmHg */
  systolic: string;
  /** How long the hypotension has lasted, in minutes. Empty when not known. */
  durationMinutes?: string;
  skin?: SkinTemperature;
  jvp?: JugularVenousPressure;
  /** cmH2O, when the neck was measured. Only read when `jvp` is `not_assessed`. */
  jvpCmH2O?: string;
  capillaryRefill?: CapillaryRefill;
  pulseVolume?: PulseVolume;
  lungExam?: LungExam;
}

export interface ShockAssessment {
  category: ShockCategory;
  /** Why the rule declined; null when it named a category. */
  reason: IndeterminateReason | null;
  /** The JVP the rule used, after a measured height was binned. */
  jvp: JugularVenousPressure;
  /** Secondary findings that point at the category. They never change it. */
  supporting: SecondaryFinding[];
  /** Secondary findings that point at another category. They never change it; always show them. */
  discordant: SecondaryFinding[];
}

export const SHOCK_LABELS: Record<ShockCategory, string> = {
  septic: "Septic pattern",
  cardiogenic: "Cardiogenic pattern",
  hypovolemic: "Hypovolemic pattern",
  indeterminate: "Indeterminate",
};

export const SHOCK_REASONS: Record<IndeterminateReason, string> = {
  outside_studied_cohort: `Not the studied patients: needs systolic below ${SHOCK_LIMITS.systolicBelow} mmHg for at least ${SHOCK_LIMITS.minutesAtLeast} minutes`,
  primary_finding_not_assessed: "Skin temperature or JVP was not assessed",
  discordant_primary_findings: "Warm skin with an elevated JVP: the study assigns no category",
};

/** An examiner's impression wins over a measured height; the height only decides a neck nobody judged. */
export const binJvp = (jvp: JugularVenousPressure, cmH2O: number | null): JugularVenousPressure => {
  if (jvp !== "not_assessed" || cmH2O === null) return jvp;
  return cmH2O > SHOCK_LIMITS.jvpElevatedAboveCmH2O ? "elevated" : "normal_or_low";
};

/** Say this wherever the result is shown. */
export const SHOCK_CAVEAT = "Bedside heuristic, right in 52 of its 68 study patients (76%). Not a diagnosis.";

/**
 * Which category a secondary finding points at, keyed `finding:value`. A normal pulse, a delayed
 * refill, a thready pulse, a clear chest and crackles at one base fit more than one category, so
 * they point nowhere.
 */
export const SHOCK_SUGGESTS: Record<string, ShockCategory> = {
  "capillaryRefill:brisk": "septic",
  "pulseVolume:bounding": "septic",
  "lungExam:bilateral_crackles": "cardiogenic",
};

/** Null when the systolic, the duration or the measured JVP is not a usable number. */
export const classifyShock = (exam: ShockExam): ShockAssessment | null => {
  const systolic = safeParseFloatOrNull(exam.systolic);
  const minutes = safeParseFloatOrNull(exam.durationMinutes);
  const cm = safeParseFloatOrNull(exam.jvpCmH2O);
  if (systolic === null || systolic <= 0) return null;
  if ((exam.durationMinutes?.trim() && (minutes === null || minutes < 0)) || (exam.jvpCmH2O?.trim() && (cm === null || cm < 0))) return null;

  const skin = exam.skin ?? "not_assessed";
  const jvp = binJvp(exam.jvp ?? "not_assessed", cm);
  const declined = (reason: IndeterminateReason): ShockAssessment => ({ category: "indeterminate", reason, jvp, supporting: [], discordant: [] });

  // an unknown duration declines too: the rule was derived in sustained hypotension only
  if (systolic >= SHOCK_LIMITS.systolicBelow || minutes === null || minutes < SHOCK_LIMITS.minutesAtLeast) return declined("outside_studied_cohort");
  if (skin === "not_assessed" || jvp === "not_assessed") return declined("primary_finding_not_assessed");
  if (skin === "warm" && jvp === "elevated") return declined("discordant_primary_findings");

  const category: ShockCategory = skin === "warm" ? "septic" : jvp === "elevated" ? "cardiogenic" : "hypovolemic";
  const pointing = (["capillaryRefill", "pulseVolume", "lungExam"] as const).filter((name) => SHOCK_SUGGESTS[`${name}:${exam[name]}`]);
  return {
    category,
    reason: null,
    jvp,
    supporting: pointing.filter((name) => SHOCK_SUGGESTS[`${name}:${exam[name]}`] === category),
    discordant: pointing.filter((name) => SHOCK_SUGGESTS[`${name}:${exam[name]}`] !== category),
  };
};
