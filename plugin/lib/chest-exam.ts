/**
 * Chest examination syndromes: the classic semiology table, one side at a time. Ported from
 * medextract's `syndromes/respiratory/syndrome.ts` (`classifyRespiratory`).
 *
 * EXAMINATION ONLY. No history, no vital sign and no imaging: a film reporting consolidation is not
 * a bedside consolidation syndrome, and a chest nobody examined is `not_examined` whatever its film
 * says. Weighing the three streams is the focal pulmonary rule's job, not this one's.
 *
 * Four focal syndromes, each by the sign that tells it from the other three, first row that matches:
 * - Pneumothorax: hyperresonant, breath sounds reduced or absent, trachea not pulled toward the side.
 * - Pleural effusion: stony dull, trachea not pulled toward the side.
 * - Consolidation: dull (or percussion unrecorded) with bronchial breathing or increased vocal resonance.
 * - Atelectasis: dull, breath sounds reduced or absent, trachea pulled toward the side.
 * A trachea pulled toward an effusion or a pneumothorax is a collapse sign the table cannot weigh,
 * so the side is `indeterminate`. Two whole-chest patterns sit beside them: wheeze on both sides
 * (bronchial obstruction) and crackles on both sides (diffuse crackles, which interstitial disease
 * and pulmonary oedema both produce and this table does not split).
 *
 * It says less than it could: crackles alone on one side, a dull quiet side with the trachea central,
 * and a hyperresonant side with no breath sounds recorded are all `indeterminate`, never the
 * commonest cause. NOTHING HERE IS A DIAGNOSIS: pneumonia, infarction and tumour all consolidate.
 */

export const CHEST_EXAMINATION = ["performed", "documented_not_performed", "not_mentioned"] as const;
export const TRACHEA = ["central", "deviated_left", "deviated_right"] as const;
export const SIDES = ["right", "left"] as const;
/** The signs examined on each side, in alkor's order. */
export const SIDE_FIELDS = ["expansion", "percussion", "breathSounds", "addedSounds", "vocalResonance"] as const;
/** Each sign's recorded values; a sign left out was not recorded. */
export const SIDE_FINDINGS = {
  expansion: ["normal", "reduced"],
  percussion: ["resonant", "dull", "stony_dull", "hyperresonant"],
  breathSounds: ["vesicular", "bronchial", "reduced", "absent"],
  addedSounds: ["none", "crackles", "crackles_clearing_on_cough", "wheeze", "crackles_and_wheeze"],
  vocalResonance: ["normal", "increased", "reduced"],
} as const;

export const FOCAL_SYNDROMES = ["consolidation", "pleural_effusion", "atelectasis", "pneumothorax"] as const;
/** `no_syndrome` is assessed with no focal syndrome; not "normal", since a side under diffuse crackles has one. */
export const SIDE_VERDICTS = [...FOCAL_SYNDROMES, "no_syndrome", "indeterminate", "not_examined"] as const;
export const PATTERNS = ["bronchial_obstruction", "diffuse_crackles"] as const;
/** Why a side is `indeterminate`: a row waits on an unrecorded sign, or no row fits what was recorded. */
export const INDETERMINATE_REASONS = ["sign_not_recorded", "no_row_explains"] as const;

export type ChestExamination = (typeof CHEST_EXAMINATION)[number];
export type Trachea = (typeof TRACHEA)[number];
export type Side = (typeof SIDES)[number];
export type SideField = (typeof SIDE_FIELDS)[number];
export type FocalSyndrome = (typeof FOCAL_SYNDROMES)[number];
export type SideVerdict = (typeof SIDE_VERDICTS)[number];
export type ChestPattern = (typeof PATTERNS)[number];
export type IndeterminateReason = (typeof INDETERMINATE_REASONS)[number];

export type ChestSide = { [F in SideField]?: (typeof SIDE_FINDINGS)[F][number] };

export interface ChestExam {
  /** Left out, the signs decide: a side with none recorded is `not_examined`. Anything but `performed` overrides them. */
  examination?: ChestExamination;
  trachea?: Trachea;
  right?: ChestSide;
  left?: ChestSide;
}

/** An abnormal sign no row explains. `value` narrows `crackles_and_wheeze` to the half a pattern leaves. */
export interface UnexplainedSign {
  sign: SideField;
  value: string;
}

/** An unrecorded sign that, with any of `values`, would complete `syndrome`'s row. */
export interface UnrecordedSign {
  syndrome: FocalSyndrome;
  sign: SideField | "trachea";
  values: string[];
}

export interface SideAssessment {
  verdict: SideVerdict;
  /** Null unless `indeterminate`. */
  reason: IndeterminateReason | null;
  /** Empty unless `indeterminate`. */
  unexplained: UnexplainedSign[];
  /**
   * Empty unless `indeterminate`. A row is listed only when a recorded sign matches it and no
   * recorded sign contradicts it: no further examination makes a contradicted row true.
   */
  unrecorded: UnrecordedSign[];
}

export interface ChestExamAssessment {
  right: SideAssessment;
  left: SideAssessment;
  /** In `PATTERNS` order. */
  patterns: ChestPattern[];
}

const CRACKLES: readonly string[] = ["crackles", "crackles_and_wheeze"];
const WHEEZE: readonly string[] = ["wheeze", "crackles_and_wheeze"];
const QUIET: readonly string[] = ["reduced", "absent"];

type Pull = "toward" | "away" | "central" | null;

const trachealPull = (trachea: Trachea | undefined, side: Side): Pull =>
  trachea === undefined ? null : trachea === "central" ? "central" : trachea === `deviated_${side}` ? "toward" : "away";

const examined = (e: ChestExam) => e.examination === undefined || e.examination === "performed";

/** `crackles_clearing_on_cough` is basal atelectasis at the bedside, not a diffuse crackle. */
const patternsOf = (e: ChestExam): ChestPattern[] => {
  if (!examined(e)) return [];
  const both = (set: readonly string[]) => SIDES.every((s) => set.includes(e[s]?.addedSounds ?? ""));
  return PATTERNS.filter((p) => both(p === "bronchial_obstruction" ? WHEEZE : CRACKLES));
};

const unexplainedSigns = (s: ChestSide, patterns: ChestPattern[]): UnexplainedSign[] => {
  const out: UnexplainedSign[] = [];
  const add = (sign: SideField) => out.push({ sign, value: s[sign]! });
  if (s.expansion === "reduced") add("expansion");
  if (["dull", "stony_dull", "hyperresonant"].includes(s.percussion ?? "")) add("percussion");
  if (["bronchial", ...QUIET].includes(s.breathSounds ?? "")) add("breathSounds");
  if (s.vocalResonance === "increased" || s.vocalResonance === "reduced") add("vocalResonance");
  const a = s.addedSounds;
  if (a === "crackles_clearing_on_cough") add("addedSounds");
  else if (a !== undefined && a !== "none") {
    // Explained only when every part of it is on both sides; otherwise name the focal half.
    const crackles = CRACKLES.includes(a) && !patterns.includes("diffuse_crackles");
    const wheeze = WHEEZE.includes(a) && !patterns.includes("bronchial_obstruction");
    if (a === "crackles_and_wheeze" && crackles !== wheeze) out.push({ sign: "addedSounds", value: crackles ? "crackles" : "wheeze" });
    else if (crackles || wheeze) add("addedSounds");
  }
  return out;
};

type Missing = Omit<UnrecordedSign, "syndrome">;
type Condition = { met: true; recorded: boolean } | { met: false; missing: Missing[] };

/** The rows of `classifySide` as conditions, read only to say what a declined side waits on. */
const rowConditions = (s: ChestSide, pull: Pull, side: Side): [FocalSyndrome, Condition[]][] => {
  const is = (sign: SideField, values: readonly string[]): Condition =>
    s[sign] === undefined
      ? { met: false, missing: [{ sign, values: [...values] }] }
      : values.includes(s[sign]!) ? { met: true, recorded: true } : { met: false, missing: [] };
  const notToward: Condition = pull === "toward" ? { met: false, missing: [] } : { met: true, recorded: pull !== null };
  const toward: Condition = pull === null
    ? { met: false, missing: [{ sign: "trachea", values: [`deviated_${side}`] }] }
    : pull === "toward" ? { met: true, recorded: true } : { met: false, missing: [] };
  const percussion: Condition = s.percussion === undefined ? { met: true, recorded: false } : is("percussion", ["dull"]);
  const b = is("breathSounds", ["bronchial"]);
  const v = is("vocalResonance", ["increased"]);
  const sign: Condition = b.met ? b : v.met ? v : { met: false, missing: [...b.missing, ...v.missing] };
  return [
    ["pneumothorax", [is("percussion", ["hyperresonant"]), is("breathSounds", QUIET), notToward]],
    ["pleural_effusion", [is("percussion", ["stony_dull"]), notToward]],
    ["consolidation", [percussion, sign]],
    ["atelectasis", [is("percussion", ["dull"]), is("breathSounds", QUIET), toward]],
  ];
};

const unrecordedSigns = (s: ChestSide, pull: Pull, side: Side): UnrecordedSign[] =>
  rowConditions(s, pull, side).flatMap(([syndrome, conditions]) => {
    const contradicted = conditions.some((c) => !c.met && !c.missing.length);
    const anchored = conditions.some((c) => c.met && c.recorded);
    if (contradicted || !anchored) return [];
    return conditions.flatMap((c) => (c.met ? [] : c.missing)).map((m) => ({ syndrome, ...m }));
  });

const classifySide = (e: ChestExam, side: Side, patterns: ChestPattern[]): SideAssessment => {
  const decided = (verdict: SideVerdict): SideAssessment => ({ verdict, reason: null, unexplained: [], unrecorded: [] });
  const s = e[side] ?? {};
  if (!examined(e) || SIDE_FIELDS.every((f) => s[f] === undefined)) return decided("not_examined");
  const pull = trachealPull(e.trachea, side);
  const quiet = QUIET.includes(s.breathSounds ?? "");

  if (s.percussion === "hyperresonant" && quiet && pull !== "toward") return decided("pneumothorax");
  if (s.percussion === "stony_dull" && pull !== "toward") return decided("pleural_effusion");
  if ((s.percussion === "dull" || s.percussion === undefined) && (s.breathSounds === "bronchial" || s.vocalResonance === "increased")) {
    return decided("consolidation");
  }
  if (s.percussion === "dull" && quiet && pull === "toward") return decided("atelectasis");

  const unexplained = unexplainedSigns(s, patterns);
  if (!unexplained.length) return decided("no_syndrome");
  const unrecorded = unrecordedSigns(s, pull, side);
  return { verdict: "indeterminate", reason: unrecorded.length ? "sign_not_recorded" : "no_row_explains", unexplained, unrecorded };
};

export const assessChestExam = (exam: ChestExam): ChestExamAssessment => {
  const patterns = patternsOf(exam);
  return { right: classifySide(exam, "right", patterns), left: classifySide(exam, "left", patterns), patterns };
};
