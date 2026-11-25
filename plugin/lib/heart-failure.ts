/**
 * Heart failure from the bedside examination: which side is congested, and whether that congestion
 * is the syndrome. Ported from medextract's `syndromes/heart-failure/rule.ts`.
 *
 * "Left" and "right" are BEDSIDE CONGESTION PATTERNS, NOT VENTRICULAR FUNCTION: lungs congested
 * behind the left heart, systemic veins behind the right, both, or neither. Whether a ventricle is
 * failing is an echocardiogram's question, and no echo is read here. NO STUDY MEASURED THIS SPLIT:
 * the right-sided signs are Ibrahim's list (ESC e-Journal of Cardiology Practice 14, 2016), the rule
 * over them is alkor's choice, so no sensitivity or specificity may be quoted for the verdict.
 *
 * - Left: crackles at both bases, or a third heart sound not attributed to the right ventricle.
 *   Crackles at one base are a local process (a pneumonia), so they are a chest examined and clear.
 * - Right: the neck decides alone, either way, and a raised JVP over a clear chest is enough (an RV
 *   infarct). A measured height is binned by `getJVPCategory` (> 8 cmH2O, McGee), never by the
 *   impression beside it. Only when nobody assessed the neck do three routes make the limb present:
 *   a positive hepatojugular reflux, a pulsatile liver, or a loaded RV sign (heave, loud P2, RV
 *   gallop, TR murmur) paired with a venous congestion sign (liver, ascites, dependent oedema).
 *   Either half of the pair alone has a common other cause, and no route makes the limb absent.
 * - A limb is `absent` only when somebody listened to the chest or looked at the neck.
 * - Syndrome: congestion is heart failure only with a cardinal symptom (ESC 2021): breathlessness
 *   or leg swelling. The symptoms decide no side.
 *
 * Nothing here recommends a treatment: `next` names the examination that would decide a limb.
 */

import { calculateJVPcmH2O, getJVPCategory, type JVPReference } from "./cardiology";
import type { JugularVenousPressure } from "./shock";
import type { Presence } from "./volume";

export type HeartFailureVerdict = "left" | "right" | "biventricular" | "no_congestion" | "indeterminate";
export type Limb = "present" | "absent" | "not_determined";
export type HeartFailureReason = "left_sided_not_determined" | "right_sided_not_determined" | "neither_determined";

export const LEFT_SIDED_SIGNS = ["bilateral_crackles", "third_heart_sound"] as const;
/** The neck, then the three routes read only when nobody assessed it. */
export const RIGHT_SIDED_SIGNS = ["jugular_venous_pressure", "hepatojugular_reflux", "pulsatile_liver", "right_ventricular_and_systemic_signs"] as const;
/** Reported beside the right limb, deciding it only through the routes above. */
export const SYSTEMIC_SIGNS = ["hepatojugular_reflux", "hepatomegaly", "ascites", "peripheral_oedema"] as const;
/** Reported beside the verdict, deciding it only through the routes above. */
export const RIGHT_VENTRICULAR_SIGNS = ["parasternal_heave", "loud_p2", "right_ventricular_gallop", "tricuspid_regurgitation_murmur", "pulmonary_regurgitation_murmur", "kussmaul_sign"] as const;
export const SYMPTOMS = ["breathlessness", "leg_swelling"] as const;
export const SYNDROMES = ["heart_failure", "congestion_without_symptoms", "symptoms_not_recorded", "no_congestion_found"] as const;
/** The examination that would decide an undetermined limb. Never a treatment. */
export const NEXT = ["chest_auscultation", "jugular_venous_pressure"] as const;

export type LeftSidedSign = (typeof LEFT_SIDED_SIGNS)[number];
export type RightSidedSign = (typeof RIGHT_SIDED_SIGNS)[number];
export type SystemicSign = (typeof SYSTEMIC_SIGNS)[number];
export type RightVentricularSign = (typeof RIGHT_VENTRICULAR_SIGNS)[number];
export type Symptom = (typeof SYMPTOMS)[number];
export type HeartFailureSyndrome = (typeof SYNDROMES)[number];
export type Next = (typeof NEXT)[number];

/** Allowed values beyond plain presence, from medextract's heart-failure schema. */
export const HEART_FAILURE_FINDINGS = {
  legSwelling: ["present", "one_leg_only", "absent", "not_assessed"],
  crackles: ["bilateral", "unilateral", "none", "not_assessed"],
  thirdHeartSound: ["left_or_unsided", "right_ventricular", "absent", "not_assessed"],
  hepatomegaly: ["present", "pulsatile", "absent", "not_assessed"],
  peripheralOedema: ["dependent", "unilateral", "absent", "not_assessed"],
} as const;

/** Every finding left out counts as `not_assessed`. */
export interface HeartFailureExam {
  breathlessness?: Presence;
  legSwelling?: (typeof HEART_FAILURE_FINDINGS.legSwelling)[number];
  crackles?: (typeof HEART_FAILURE_FINDINGS.crackles)[number];
  /** `right_ventricular`: heard at the left sternal edge, louder on inspiration. */
  thirdHeartSound?: (typeof HEART_FAILURE_FINDINGS.thirdHeartSound)[number];
  parasternalHeave?: Presence;
  loudP2?: Presence;
  tricuspidRegurgitationMurmur?: Presence;
  pulmonaryRegurgitationMurmur?: Presence;
  /** The examiner's impression. Read only when no usable height was measured. */
  jvp?: JugularVenousPressure;
  /** The measured height in cm, as written. Needs `jvpReference`. */
  jvpHeightCm?: string;
  jvpReference?: JVPReference;
  kussmaulSign?: Presence;
  hepatojugularReflux?: Presence;
  hepatomegaly?: (typeof HEART_FAILURE_FINDINGS.hepatomegaly)[number];
  ascites?: Presence;
  peripheralOedema?: (typeof HEART_FAILURE_FINDINGS.peripheralOedema)[number];
}

export interface HeartFailureAssessment {
  verdict: HeartFailureVerdict;
  /** Why the rule declined; null when it decided. */
  reason: HeartFailureReason | null;
  left: Limb;
  right: Limb;
  /** The signs that made each limb present; empty otherwise. */
  leftSigns: LeftSidedSign[];
  rightSigns: RightSidedSign[];
  /** Found, whatever the limb. */
  systemicSigns: SystemicSign[];
  rightVentricularSigns: RightVentricularSign[];
  symptoms: Symptom[];
  syndrome: HeartFailureSyndrome;
  /** The neck as the rule read it: a measured height binned, else the impression. */
  jvp: JugularVenousPressure;
  /** A measured height that could not be used, with why. The neck falls back to the impression. */
  notCalculated: string[];
  next: Next[];
}

const VERDICTS: Record<"present" | "absent", Record<"present" | "absent", HeartFailureVerdict>> = {
  present: { present: "biventricular", absent: "left" },
  absent: { present: "right", absent: "no_congestion" },
};

export const assessHeartFailure = (exam: HeartFailureExam): HeartFailureAssessment => {
  const notCalculated: string[] = [];
  let cmH2O: number | null = null;
  const height = exam.jvpHeightCm?.trim();
  if (height && !exam.jvpReference) {
    // "JVP 4 cm" could be either reference, five centimetres apart; not guessed.
    notCalculated.push(`jugular venous pressure ${height} cm: no reference point written (right atrium or sternal angle)`);
  } else if (height && exam.jvpReference) {
    cmH2O = calculateJVPcmH2O(height, exam.jvpReference);
    if (cmH2O === null) notCalculated.push(`jugular venous pressure ${height} cm (${exam.jvpReference}): not a plausible height`);
  }
  const jvp: JugularVenousPressure = cmH2O !== null ? (getJVPCategory(cmH2O) === "Elevated" ? "elevated" : "normal_or_low") : exam.jvp ?? "not_assessed";

  const crackles = exam.crackles ?? "not_assessed";
  const leftMet: Record<LeftSidedSign, boolean> = {
    bilateral_crackles: crackles === "bilateral",
    third_heart_sound: exam.thirdHeartSound === "left_or_unsided",
  };
  const leftSigns = LEFT_SIDED_SIGNS.filter((s) => leftMet[s]);
  // Absent needs a chest somebody listened to, whatever the heart sounds.
  const left: Limb = leftSigns.length ? "present" : crackles !== "not_assessed" ? "absent" : "not_determined";

  const systemicMet: Record<SystemicSign, boolean> = {
    hepatojugular_reflux: exam.hepatojugularReflux === "present",
    hepatomegaly: exam.hepatomegaly === "present" || exam.hepatomegaly === "pulsatile",
    ascites: exam.ascites === "present",
    peripheral_oedema: exam.peripheralOedema === "dependent",
  };
  const rvMet: Record<RightVentricularSign, boolean> = {
    parasternal_heave: exam.parasternalHeave === "present",
    loud_p2: exam.loudP2 === "present",
    right_ventricular_gallop: exam.thirdHeartSound === "right_ventricular",
    tricuspid_regurgitation_murmur: exam.tricuspidRegurgitationMurmur === "present",
    pulmonary_regurgitation_murmur: exam.pulmonaryRegurgitationMurmur === "present",
    kussmaul_sign: exam.kussmaulSign === "present",
  };

  // An assessed neck decides alone; only an unassessed one opens the other routes.
  const unseen = jvp === "not_assessed";
  const loaded = rvMet.parasternal_heave || rvMet.loud_p2 || rvMet.right_ventricular_gallop || rvMet.tricuspid_regurgitation_murmur;
  const congested = systemicMet.hepatomegaly || systemicMet.ascites || systemicMet.peripheral_oedema;
  const rightMet: Record<RightSidedSign, boolean> = {
    jugular_venous_pressure: jvp === "elevated",
    hepatojugular_reflux: unseen && systemicMet.hepatojugular_reflux,
    pulsatile_liver: unseen && exam.hepatomegaly === "pulsatile",
    right_ventricular_and_systemic_signs: unseen && loaded && congested,
  };
  const rightSigns = RIGHT_SIDED_SIGNS.filter((s) => rightMet[s]);
  // Absent needs a neck somebody looked at: no route makes the limb absent.
  const right: Limb = rightSigns.length ? "present" : jvp === "normal_or_low" ? "absent" : "not_determined";

  const symptoms = SYMPTOMS.filter((s) => (s === "breathlessness" ? exam.breathlessness : exam.legSwelling) === "present");
  // Silence is not a patient without symptoms: that needs both denied.
  const denied = exam.breathlessness === "absent" && exam.legSwelling === "absent";
  const syndrome: HeartFailureSyndrome =
    left !== "present" && right !== "present" ? "no_congestion_found"
      : symptoms.length ? "heart_failure"
      : denied ? "congestion_without_symptoms"
      : "symptoms_not_recorded";

  let verdict: HeartFailureVerdict = "indeterminate";
  let reason: HeartFailureReason | null = null;
  if (left !== "not_determined" && right !== "not_determined") verdict = VERDICTS[left][right];
  else reason = left === right ? "neither_determined" : left === "not_determined" ? "left_sided_not_determined" : "right_sided_not_determined";

  return {
    verdict,
    reason,
    left,
    right,
    leftSigns,
    rightSigns,
    systemicSigns: SYSTEMIC_SIGNS.filter((s) => systemicMet[s]),
    rightVentricularSigns: RIGHT_VENTRICULAR_SIGNS.filter((s) => rvMet[s]),
    symptoms,
    syndrome,
    jvp,
    notCalculated,
    next: NEXT.filter((n) => (n === "chest_auscultation" ? left : right) === "not_determined"),
  };
};
