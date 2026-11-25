/**
 * Focal pulmonary syndrome: history, chest signs and imaging in, a bounded verdict out. Ported from
 * medextract's `syndromes/respiratory/rule.ts` (`assessRespiratory`).
 *
 * THREE STREAMS, KEPT APART. The history the patient gives, the chest the examiner found (per side,
 * in chest-exam's vocabulary) and what imaging reported are separate inputs, and pneumonia's evidence
 * level is read off which stream a finding came from: a film filed as a chest sign is a wrong verdict.
 *
 * IT SAYS LESS THAN IT COULD, ON PURPOSE. Unilateral crackles with no symptoms is `indeterminate`
 * and names no differential (alkor's pu-13: a clinician wrote "?early right basal pneumonia" over
 * exactly that). A diagnosis enters the differential only when its DISCRIMINATING evidence is
 * present, never because it is the commonest cause of a sign.
 *
 * NOTHING HERE RECOMMENDS A TREATMENT. `next` names what would discriminate: a film, an
 * examination, a saturation, a duration. It does not name an antibiotic.
 */

import { SIDES, type ChestExamination, type ChestSide, type Side, type Trachea } from "./chest-exam";
import { safeParseFloatOrNull } from "./utils/safeParseFloat";

export const FOCAL_PULMONARY_LIMITS = {
  /** A measured temperature at or above this is fever. NICE NG250 lists 38 °C or higher among the signs of adult pneumonia. */
  feverAtLeastC: 38.0,
} as const;

/** Each history finding's values; a finding left out was not stated. */
export const HISTORY_FINDINGS = {
  cough: ["present", "absent"],
  sputum: ["purulent", "mucoid", "blood_stained", "none"],
  reportedFever: ["present", "absent"],
  pleuriticPain: ["present", "absent"],
  breathlessness: ["present", "absent"],
} as const;

/** One imaging item is identified by these. */
export const IMAGING_KEYS = ["modality", "finding", "result", "side", "timing"] as const;
export const IMAGING_FINDINGS = {
  modality: ["chest_radiograph", "ct_chest", "chest_ultrasound"],
  finding: ["consolidation", "pleural_effusion", "atelectasis", "collapse", "pulmonary_oedema", "pneumothorax", "normal", "other"],
  result: ["present", "absent"],
  side: ["right", "left", "bilateral", "not_stated"],
  timing: ["current", "historical"],
} as const;

export type ImagingKey = (typeof IMAGING_KEYS)[number];
export type ImagingItem = { [K in ImagingKey]: (typeof IMAGING_FINDINGS)[K][number] };

export type FocalPulmonaryVerdict = "supported" | "unsupported" | "indeterminate";

export const FOCAL_PULMONARY_REASONS = [
  "focal_imaging",
  "focal_signs_with_symptoms",
  "focal_signs_without_symptoms",
  "bilateral_findings",
  "no_focal_sign",
  "no_chest_evidence",
] as const;
export type FocalPulmonaryReason = (typeof FOCAL_PULMONARY_REASONS)[number];

/** Three levels, never merged: imaging, signs with symptoms, signs alone. */
export const PNEUMONIA_EVIDENCE = ["imaging-supported", "clinically-suspected", "physical-sign-only", "none"] as const;
export type PneumoniaEvidence = (typeof PNEUMONIA_EVIDENCE)[number];

export const DIFFERENTIAL = ["pneumonia", "atelectasis", "pleural_effusion", "pulmonary_oedema"] as const;
export type Differential = (typeof DIFFERENTIAL)[number];

export const NEXT = ["chest_imaging", "chest_examination", "re_examine_chest", "oxygen_saturation", "symptom_duration"] as const;
export type Next = (typeof NEXT)[number];

export type FocalPulmonaryInput = { [K in keyof typeof HISTORY_FINDINGS]?: (typeof HISTORY_FINDINGS)[K][number] } & {
  /** Days, as stated. */
  symptomDurationDays?: string;
  /** Left out, the signs decide, as in chest-exam: a chest with none recorded was not examined. */
  examination?: ChestExamination;
  trachea?: Trachea;
  right?: ChestSide;
  left?: ChestSide;
  imaging?: ImagingItem[];
  /** Measured, °C. A reported fever goes in `reportedFever`. */
  temperatureC?: string;
  /** Measured SpO2, %. Only read to say whether it is missing. */
  oxygenSaturation?: string;
};

/** The examination's focal side and imaging's disagree, or the examination found none where imaging did. */
export interface FocalConflict {
  examinationSide: Side | null;
  imagingSide: Side;
  imagingFinding: ImagingItem["finding"];
}

export interface FocalPulmonaryAssessment {
  verdict: FocalPulmonaryVerdict;
  reason: FocalPulmonaryReason;
  /** Imaging's side wins over the chest's. */
  focalSide: Side | "bilateral" | null;
  pneumoniaEvidence: PneumoniaEvidence;
  /** In `DIFFERENTIAL` order. Each only when its discriminating evidence is present. */
  differential: Differential[];
  /** In `NEXT` order. What would discriminate, never what to treat. */
  next: Next[];
  /** Stated, never resolved. */
  conflict: FocalConflict | null;
}

const CRACKLES: readonly string[] = ["crackles", "crackles_and_wheeze"];

/** Wheeze alone does not make a side abnormal: it is an airway sign, not a focal one. */
const abnormal = (s: ChestSide): boolean =>
  ["dull", "stony_dull", "hyperresonant"].includes(s.percussion ?? "") ||
  ["bronchial", "reduced", "absent"].includes(s.breathSounds ?? "") ||
  ["crackles", "crackles_clearing_on_cough", "crackles_and_wheeze"].includes(s.addedSounds ?? "") ||
  ["increased", "reduced"].includes(s.vocalResonance ?? "") ||
  s.expansion === "reduced";

/** The signs of consolidation specifically. Stony dullness and reduced resonance are the effusion's. */
const consolidationSign = (s: ChestSide): boolean =>
  s.percussion === "dull" || s.breathSounds === "bronchial" || s.vocalResonance === "increased" || CRACKLES.includes(s.addedSounds ?? "");

const FOCAL_IMAGING: readonly string[] = ["consolidation", "atelectasis", "collapse", "pleural_effusion", "pneumothorax"];

export const assessFocalPulmonary = (input: FocalPulmonaryInput): FocalPulmonaryAssessment => {
  const side = (s: Side): ChestSide => input[s] ?? {};
  const imaging = input.imaging ?? [];
  const temperatureC = safeParseFloatOrNull(input.temperatureC);
  const performed = input.examination === undefined
    ? SIDES.some((s) => Object.keys(side(s)).length > 0)
    : input.examination === "performed";

  const symptomatic =
    input.cough === "present" ||
    ["purulent", "mucoid", "blood_stained"].includes(input.sputum ?? "") ||
    input.pleuriticPain === "present" ||
    input.breathlessness === "present" ||
    input.reportedFever === "present" ||
    (temperatureC !== null && temperatureC >= FOCAL_PULMONARY_LIMITS.feverAtLeastC);

  const hit = performed ? SIDES.filter((s) => abnormal(side(s))) : [];
  const exam: Side | "bilateral" | null = hit.length === 2 ? "bilateral" : (hit[0] ?? null);
  const examSide = exam === "bilateral" ? null : exam;

  const current = imaging.filter((i) => i.timing === "current");
  // A negative, historical or bilateral film is not focal.
  const film = current.find((i) => i.result === "present" && FOCAL_IMAGING.includes(i.finding) && (i.side === "right" || i.side === "left"));
  const filmSide = film ? (film.side as Side) : null;
  const bilateralFilm = current.some((i) => i.result === "present" && i.side === "bilateral");
  const imagingHas = (finding: ImagingItem["finding"], result: ImagingItem["result"]) =>
    current.some((i) => i.finding === finding && i.result === result);

  let verdict: FocalPulmonaryVerdict;
  let reason: FocalPulmonaryReason;
  if (film) [verdict, reason] = ["supported", "focal_imaging"];
  else if (examSide) [verdict, reason] = symptomatic ? ["supported", "focal_signs_with_symptoms"] : ["indeterminate", "focal_signs_without_symptoms"];
  else if (exam === "bilateral" || bilateralFilm) [verdict, reason] = ["unsupported", "bilateral_findings"];
  else if (performed) [verdict, reason] = ["unsupported", "no_focal_sign"];
  else [verdict, reason] = ["indeterminate", "no_chest_evidence"];

  // Only from consolidation, and a current film saying "no consolidation" rules the examination down.
  let pneumoniaEvidence: PneumoniaEvidence = "none";
  if (imagingHas("consolidation", "present")) pneumoniaEvidence = "imaging-supported";
  else if (examSide && consolidationSign(side(examSide)) && !imagingHas("consolidation", "absent")) {
    pneumoniaEvidence = symptomatic ? "clinically-suspected" : "physical-sign-only";
  }

  const either = (p: (s: ChestSide) => boolean) => SIDES.some((s) => p(side(s)));
  const differential = DIFFERENTIAL.filter((d) => {
    if (d === "pneumonia") return pneumoniaEvidence === "imaging-supported" || pneumoniaEvidence === "clinically-suspected";
    if (d === "atelectasis") {
      return either((s) => s.addedSounds === "crackles_clearing_on_cough") || imagingHas("atelectasis", "present") || imagingHas("collapse", "present");
    }
    if (d === "pleural_effusion") return either((s) => s.percussion === "stony_dull") || imagingHas("pleural_effusion", "present");
    return imagingHas("pulmonary_oedema", "present") || SIDES.every((s) => CRACKLES.includes(side(s).addedSounds ?? ""));
  });

  const conflict: FocalConflict | null =
    film && filmSide && performed && (exam === null || (examSide !== null && examSide !== filmSide))
      ? { examinationSide: examSide, imagingSide: filmSide, imagingFinding: film.finding }
      : null;

  const next = NEXT.filter((n) => {
    if (n === "chest_imaging") return current.length === 0 && examSide !== null;
    if (n === "chest_examination") return !performed && film !== undefined;
    if (n === "re_examine_chest") return conflict !== null;
    if (n === "oxygen_saturation") return verdict === "supported" && safeParseFloatOrNull(input.oxygenSaturation) === null;
    return verdict === "supported" && safeParseFloatOrNull(input.symptomDurationDays) === null;
  });

  const focalSide = filmSide ?? exam ?? (bilateralFilm ? "bilateral" : null);
  return { verdict, reason, focalSide, pneumoniaEvidence, differential, next, conflict };
};
