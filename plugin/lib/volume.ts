/**
 * Volume overload from the bedside examination: a count of congestion signs.
 *
 * Built on the Framingham heart-failure criteria (McKee et al., N Engl J Med 1971;285:1441-6):
 * two majors, or one major and two minors. THIS IS NOT THOSE CRITERIA. It is the subset a physical
 * examination can produce; the radiograph, symptom, catheter, vital-capacity, weight and heart-rate
 * items are dropped. The subset has never been validated, so no Framingham sensitivity or
 * specificity may be quoted for it. The JVP major is bedside inspection of the neck (a measured
 * height binned at the shared 7 cmH2O line), not Framingham's > 16 cmH2O catheter value. Ported from medextract's
 * `syndromes/volume/rule.ts`.
 */

import { binJvp, type JugularVenousPressure } from "./shock";
import { safeParseFloatOrNull } from "./utils/safeParseFloat";

/** `absent` is assessed and negative; without it `no_overload` would be unreachable. */
export const PRESENCE = ["present", "absent", "not_assessed"] as const;
export type Presence = (typeof PRESENCE)[number];

/** Framingham's counts (McKee et al. 1971): two majors, or one major and two minors. */
export const VOLUME_LIMITS = {
  majorForPositive: 2,
  majorWithMinors: 1,
  minorsWithOneMajor: 2,
} as const;

export const MAJOR_FINDINGS = ["jvp", "rales", "s3Gallop", "hepatojugularReflux"] as const;
export type MajorFinding = (typeof MAJOR_FINDINGS)[number];

export const MINOR_FINDINGS = ["bilateralAnkleEdema", "hepatomegaly", "pleuralEffusion"] as const;
export type MinorFinding = (typeof MINOR_FINDINGS)[number];

export type VolumeFinding = MajorFinding | MinorFinding;
const FINDINGS: readonly VolumeFinding[] = [...MAJOR_FINDINGS, ...MINOR_FINDINGS];

/** `no_overload`, not `euvolemic`: a count short of the threshold has not shown euvolaemia. */
export type VolumeStatus = "overload" | "no_overload" | "indeterminate";

export type VolumeReason = "no_exam_documented" | "unassessed_findings_could_change_verdict";

export const VOLUME_LABELS: Record<VolumeStatus, string> = {
  overload: "Volume overload",
  no_overload: "No volume overload on examination",
  indeterminate: "Indeterminate",
};

export const VOLUME_REASONS: Record<VolumeReason, string> = {
  no_exam_documented: "None of the seven congestion signs was assessed",
  unassessed_findings_could_change_verdict: "Signs not assessed could still reach the threshold",
};

/** Say this wherever the result is shown. */
export const VOLUME_CAVEAT = "Examination subset of the Framingham criteria, never validated on its own. Not a diagnosis.";

/** Every finding left out counts as `not_assessed`. No vital signs: the heart-rate minor is dropped. */
export interface VolumeExam {
  jvp?: JugularVenousPressure;
  /** cmH2O, when the neck was measured. Only read when `jvp` is `not_assessed`. */
  jvpCmH2O?: string;
  /** Bilateral; crackles at one base are `absent`. */
  rales?: Presence;
  s3Gallop?: Presence;
  hepatojugularReflux?: Presence;
  bilateralAnkleEdema?: Presence;
  hepatomegaly?: Presence;
  pleuralEffusion?: Presence;
}

export interface VolumeAssessment {
  status: VolumeStatus;
  /** Why the rule declined; null when it decided. */
  reason: VolumeReason | null;
  /** Unassessed findings that would settle an indeterminate verdict on their own. Empty when no single one would. */
  pivotal: VolumeFinding[];
}

interface ResolvedVolume {
  major: number;
  minor: number;
  unassessed: VolumeFinding[];
  bestCaseMajor: number;
  bestCaseMinor: number;
}

const isMajor = (name: VolumeFinding) => (MAJOR_FINDINGS as readonly string[]).includes(name);

/** The criteria as one line. */
export const meets = (major: number, minor: number): boolean =>
  major >= VOLUME_LIMITS.majorForPositive || (major >= VOLUME_LIMITS.majorWithMinors && minor >= VOLUME_LIMITS.minorsWithOneMajor);

export const resolveVolume = (exam: VolumeExam, jvp: JugularVenousPressure): ResolvedVolume => {
  const stateOf = (name: VolumeFinding): Presence =>
    name === "jvp" ? (jvp === "not_assessed" ? "not_assessed" : jvp === "elevated" ? "present" : "absent") : exam[name] ?? "not_assessed";
  const present = FINDINGS.filter((n) => stateOf(n) === "present");
  const unassessed = FINDINGS.filter((n) => stateOf(n) === "not_assessed");
  const major = present.filter(isMajor).length;
  const minor = present.length - major;
  const unassessedMajors = unassessed.filter(isMajor).length;
  return {
    major,
    minor,
    unassessed,
    bestCaseMajor: major + unassessedMajors,
    bestCaseMinor: minor + unassessed.length - unassessedMajors,
  };
};

/**
 * A flip test, not a list of required findings: unassessed signs can only add, so a met count is
 * overload whatever is missing, and a negative is only reported when even the best case misses.
 */
export const classify = (r: ResolvedVolume): Omit<VolumeAssessment, "pivotal"> => {
  if (r.unassessed.length === FINDINGS.length) return { status: "indeterminate", reason: "no_exam_documented" };
  if (meets(r.major, r.minor)) return { status: "overload", reason: null };
  if (meets(r.bestCaseMajor, r.bestCaseMinor)) return { status: "indeterminate", reason: "unassessed_findings_could_change_verdict" };
  return { status: "no_overload", reason: null };
};

/** Unassessed findings the best case cannot reach the threshold without. */
export const pivotalFindings = (r: ResolvedVolume): VolumeFinding[] => {
  if (classify(r).status !== "indeterminate") return [];
  return r.unassessed.filter((name) =>
    !meets(r.bestCaseMajor - (isMajor(name) ? 1 : 0), r.bestCaseMinor - (isMajor(name) ? 0 : 1)));
};

/** Null when the measured JVP is not a usable number. */
export const assessVolume = (exam: VolumeExam): VolumeAssessment | null => {
  const cm = safeParseFloatOrNull(exam.jvpCmH2O);
  if (exam.jvpCmH2O?.trim() && (cm === null || cm < 0)) return null;
  const resolved = resolveVolume(exam, binJvp(exam.jvp ?? "not_assessed", cm));
  return { ...classify(resolved), pivotal: pivotalFindings(resolved) };
};
