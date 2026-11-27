// The synthetic patients of `medprotocol syndromic --serve`: one person for all six bedside rules.
// Ported from a generated test app (components/medprotocol/patient/generate.ts); plugin/lib stays the only clinical logic.
// One synthetic patient for all six assessments: a story picks every module's scenario, and shared findings
// are drawn once (systolic, skin, JVP, crackles, the chest signs, SpO2, rate), so the panels describe one person.
// Stories: septic shock from lobar pneumonia, cardiogenic shock with pulmonary oedema, hypovolaemic shock,
// hypercapnic COPD exacerbation, large pleural effusion. The user may set some results first (`want`); the story
// is then picked among those that have them. A "no" result no such story has is taken from a story that has it,
// and the patient is marked mixed: those panels may not describe the same person.
// Each draw is kept only when every rule returns the story's expected verdict (building.md §3). No noise:
// a whole patient is the clean teaching case. Results still come only from the lib.

import { classifyShock, type ShockExam } from "../../../plugin/lib/shock";
import { assessVolume, type VolumeExam } from "../../../plugin/lib/volume";
import { assessHeartFailure, type HeartFailureExam } from "../../../plugin/lib/heart-failure";
import { SIDES, assessChestExam, type ChestExam, type ChestSide, type FocalSyndrome, type Side, type Trachea } from "../../../plugin/lib/chest-exam";
import { assessFocalPulmonary, type FocalPulmonaryInput } from "../../../plugin/lib/focal-pulmonary";
import { assessRespiratoryFailure, type RespiratoryFailureInput } from "../../../plugin/lib/respiratory-failure";

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
const chance = (p: number) => Math.random() < p;
/** Uniform in [min, max], rounded to `digits` decimals, as a string (the libs take strings). */
const uniform = (min: number, max: number, digits = 0) => (min + Math.random() * (max - min)).toFixed(digits);
/** Draw until the rules agree with the story, up to 20 times, then keep the last draw (building.md §3). */
const drawChecked = <T,>(draw: () => T, matches: (value: T) => boolean): T => {
  let value = draw();
  for (let i = 1; i < 20 && !matches(value); i++) value = draw();
  return value;
};
/** 4-character code shown as "Synthetic patient 7K3Q". No I/O/0/1, to read aloud cleanly. */
export const patientCode = () => Array.from({ length: 4 }, () => pick([..."ABCDEFGHJKLMNPQRSTUVWXYZ23456789"])).join("");

const NORMAL: ChestSide = { expansion: "normal", percussion: "resonant", breathSounds: "vesicular", addedSounds: "none", vocalResonance: "normal" };
const FOCAL: Partial<Record<FocalSyndrome, () => ChestSide>> = {
  consolidation: () => ({ expansion: "reduced", percussion: "dull", breathSounds: "bronchial", addedSounds: "crackles", vocalResonance: "increased" }),
  pleural_effusion: () => ({ expansion: "reduced", percussion: "stony_dull", breathSounds: pick(["reduced", "absent"]), addedSounds: "none", vocalResonance: "reduced" }),
};
/** A clean chest (chest-exam.md § Synthetic patient generator): one side carries the syndrome, the other is normal. */
const drawChest = (scenario: "normal" | "consolidation" | "pleural_effusion"): { exam: ChestExam; side: Side } => {
  const side = pick(SIDES);
  if (scenario === "normal") return { side, exam: { examination: "performed", trachea: "central", right: { ...NORMAL }, left: { ...NORMAL } } };
  const trachea: Trachea = chance(0.25) && scenario === "pleural_effusion" ? `deviated_${other(side)}` : "central";
  return { side, exam: { examination: "performed", trachea, [side]: FOCAL[scenario]!(), [other(side)]: { ...NORMAL } } };
};

export type WholePatient = {
  story: string;
  /** Assessments set to a "no" result the story does not have: their findings come from a story that has it. */
  mixed: (keyof WholePatient["findings"])[];
  findings: {
    shock: ShockExam;
    volume: VolumeExam;
    "heart-failure": HeartFailureExam;
    "chest-exam": ChestExam;
    "focal-pulmonary": FocalPulmonaryInput;
    "respiratory-failure": RespiratoryFailureInput;
  };
};

const p = (yes: boolean): "present" | "absent" => (yes ? "present" : "absent");
const other = (s: Side): Side => (s === "right" ? "left" : "right");
const gas = (po2: [number, number], pco2: [number, number], hco3: [number, number]): RespiratoryFailureInput => {
  const c = uniform(...pco2), b = uniform(...hco3);
  return { bloodGas: "arterial", gasUnit: "mmHg", po2: uniform(...po2), pco2: c, hco3: b, ph: (6.1 + Math.log10(Number(b) / (0.03 * Number(c)))).toFixed(2) };
};
const NO_OVERLOAD: VolumeExam = { rales: "absent", s3Gallop: "absent", hepatojugularReflux: "absent", bilateralAnkleEdema: "absent", hepatomegaly: "absent", pleuralEffusion: "absent" };
const NO_RIGHT: HeartFailureExam = { thirdHeartSound: "absent", peripheralOedema: "absent", hepatomegaly: "absent", hepatojugularReflux: "absent", ascites: "absent", legSwelling: "absent" };
/** Both sides normal but for the same added sound, the whole-chest pattern. */
const bothSides = (added: ChestSide["addedSounds"]): ChestExam => {
  const { exam } = drawChest("normal");
  return { ...exam, right: { ...exam.right, addedSounds: added }, left: { ...exam.left, addedSounds: added } };
};

export type Id = keyof WholePatient["findings"];
/** What each rule says for a story, as the user picks it before generating. Names the scenario; the screen still shows the lib's verdict. */
export type Results = Record<Id, string>;
type Story = { name: string; results: Results; draw: () => WholePatient["findings"]; expect: (f: WholePatient["findings"]) => boolean };

const v = (f: WholePatient["findings"]) => ({
  shock: classifyShock(f.shock)?.category,
  volume: assessVolume(f.volume)?.status,
  hf: assessHeartFailure(f["heart-failure"]).verdict,
  chest: assessChestExam(f["chest-exam"]),
  focal: assessFocalPulmonary(f["focal-pulmonary"]),
  rf: assessRespiratoryFailure(f["respiratory-failure"]),
});

const STORIES: Story[] = [
  {
    name: "Septic shock from lobar pneumonia",
    results: { shock: "Septic", volume: "No overload", "heart-failure": "No congestion", "chest-exam": "Consolidation, one side", "focal-pulmonary": "Pneumonia on imaging", "respiratory-failure": "Failure with distress" },
    draw: () => {
      const { exam: chest, side } = drawChest("consolidation");
      const spo2 = uniform(85, 89);
      return {
        shock: { systolic: uniform(72, 88), durationMinutes: uniform(30, 180), skin: "warm", jvp: "normal_or_low", capillaryRefill: "brisk", pulseVolume: "bounding", lungExam: "unilateral_crackles" },
        volume: { jvp: "normal_or_low", ...NO_OVERLOAD },
        "heart-failure": { breathlessness: "present", crackles: "unilateral", jvp: "normal_or_low", ...NO_RIGHT },
        "chest-exam": chest,
        "focal-pulmonary": {
          cough: "present", sputum: "purulent", reportedFever: "present", pleuriticPain: "present", breathlessness: "present",
          symptomDurationDays: uniform(2, 6), temperatureC: uniform(38.4, 39.8, 1), oxygenSaturation: spo2, ...chest,
          imaging: [{ modality: "chest_radiograph", finding: "consolidation", result: "present", side, timing: "current" }],
        },
        "respiratory-failure": { oxygenSupport: "supplemental_oxygen", oxygenSaturation: spo2, respiratoryRate: uniform(24, 34), accessoryMuscles: "present", paradoxicalBreathing: "absent", cyanosis: "absent", speech: "limited", ...gas([50, 59], [28, 36], [18, 24]) },
      };
    },
    expect: (f) => {
      const r = v(f), side = (["right", "left"] as const).find((s) => r.chest[s].verdict === "consolidation");
      return r.shock === "septic" && r.volume === "no_overload" && r.hf === "no_congestion" && !!side && r.chest[other(side)].verdict === "no_syndrome"
        && r.focal.pneumoniaEvidence === "imaging-supported" && r.rf.failure === "present" && r.rf.distress === "present";
    },
  },
  {
    name: "Cardiogenic shock with pulmonary oedema",
    results: { shock: "Cardiogenic", volume: "Overload", "heart-failure": "Congestion, left side", "chest-exam": "Crackles on both sides", "focal-pulmonary": "Not supported", "respiratory-failure": "Failure" },
    draw: () => {
      const spo2 = uniform(84, 89);
      return {
        shock: { systolic: uniform(72, 88), durationMinutes: uniform(30, 180), skin: "cool", jvp: "elevated", capillaryRefill: "delayed", pulseVolume: "thready", lungExam: "bilateral_crackles" },
        volume: { jvp: "elevated", rales: "present", s3Gallop: "present", hepatojugularReflux: "present", bilateralAnkleEdema: p(chance(0.6)), hepatomegaly: p(chance(0.4)), pleuralEffusion: "absent" },
        "heart-failure": { breathlessness: "present", crackles: "bilateral", thirdHeartSound: "left_or_unsided", jvp: "elevated", hepatojugularReflux: "present", peripheralOedema: chance(0.6) ? "dependent" : "absent", hepatomegaly: "absent", ascites: "absent" },
        "chest-exam": bothSides("crackles"),
        "focal-pulmonary": {
          cough: p(chance(0.5)), sputum: pick(["none", "mucoid"]), reportedFever: "absent", pleuriticPain: "absent", breathlessness: "present",
          symptomDurationDays: uniform(1, 3), temperatureC: uniform(36.4, 37.4, 1), oxygenSaturation: spo2, ...bothSides("crackles"),
          imaging: [{ modality: "chest_radiograph", finding: "pulmonary_oedema", result: "present", side: "bilateral", timing: "current" }],
        },
        "respiratory-failure": { oxygenSupport: "supplemental_oxygen", oxygenSaturation: spo2, respiratoryRate: uniform(26, 34), accessoryMuscles: "present", paradoxicalBreathing: "absent", cyanosis: "absent", speech: "limited", ...gas([50, 59], [30, 38], [19, 24]) },
      };
    },
    expect: (f) => {
      const r = v(f);
      return r.shock === "cardiogenic" && r.volume === "overload" && (r.hf === "biventricular" || r.hf === "left")
        && r.chest.right.verdict === "no_syndrome" && r.chest.left.verdict === "no_syndrome" && r.chest.patterns.includes("diffuse_crackles")
        && r.focal.verdict === "unsupported" && r.rf.failure === "present";
    },
  },
  {
    name: "Hypovolaemic shock",
    results: { shock: "Hypovolaemic", volume: "No overload", "heart-failure": "No congestion", "chest-exam": "Normal", "focal-pulmonary": "Not supported", "respiratory-failure": "No failure, no distress" },
    draw: () => {
      const spo2 = uniform(95, 99), rr = uniform(18, 26);
      return {
        shock: { systolic: uniform(70, 88), durationMinutes: uniform(30, 120), skin: "cool", jvp: "normal_or_low", capillaryRefill: "delayed", pulseVolume: "thready", lungExam: "clear" },
        volume: { jvp: "normal_or_low", ...NO_OVERLOAD },
        "heart-failure": { breathlessness: "absent", crackles: "none", jvp: "normal_or_low", ...NO_RIGHT },
        "chest-exam": drawChest("normal").exam,
        "focal-pulmonary": { cough: "absent", reportedFever: "absent", pleuriticPain: "absent", breathlessness: "absent", temperatureC: uniform(35.8, 37.0, 1), oxygenSaturation: spo2, ...drawChest("normal").exam, imaging: [] },
        "respiratory-failure": { oxygenSupport: "room_air", oxygenSaturation: spo2, respiratoryRate: rr, accessoryMuscles: "absent", paradoxicalBreathing: "absent", cyanosis: "absent", speech: "full_sentences" },
      };
    },
    expect: (f) => {
      const r = v(f);
      return r.shock === "hypovolemic" && r.volume === "no_overload" && r.hf === "no_congestion" && r.chest.right.verdict === "no_syndrome"
        && r.chest.left.verdict === "no_syndrome" && r.focal.verdict === "unsupported" && r.rf.failure === "absent" && r.rf.distress === "absent";
    },
  },
  {
    name: "Hypercapnic COPD exacerbation",
    results: { shock: "Not in shock (indeterminate)", volume: "No overload", "heart-failure": "No congestion", "chest-exam": "Wheeze on both sides", "focal-pulmonary": "Not supported", "respiratory-failure": "Hypercapnic failure" },
    draw: () => {
      const spo2 = uniform(84, 89);
      return {
        // not hypotensive: the shock rule declines the patient as outside its cohort
        shock: { systolic: uniform(118, 156), skin: "warm", jvp: "normal_or_low", capillaryRefill: "brisk", pulseVolume: "normal", lungExam: "clear" },
        volume: { jvp: "normal_or_low", ...NO_OVERLOAD },
        "heart-failure": { breathlessness: "present", crackles: "none", jvp: "normal_or_low", ...NO_RIGHT },
        "chest-exam": bothSides("wheeze"),
        "focal-pulmonary": {
          cough: "present", sputum: pick(["mucoid", "purulent"]), reportedFever: "absent", pleuriticPain: "absent", breathlessness: "present",
          symptomDurationDays: uniform(3, 7), temperatureC: uniform(36.6, 37.6, 1), oxygenSaturation: spo2, ...bothSides("wheeze"),
          imaging: [{ modality: "chest_radiograph", finding: "normal", result: "present", side: "not_stated", timing: "current" }],
        },
        "respiratory-failure": { oxygenSupport: "non_invasive_ventilation", oxygenSaturation: spo2, respiratoryRate: uniform(26, 34), accessoryMuscles: "present", paradoxicalBreathing: p(chance(0.5)), cyanosis: p(chance(0.5)), speech: "limited", ...gas([50, 58], [62, 85], [26, 30]) },
      };
    },
    expect: (f) => {
      const r = v(f);
      return r.shock === "indeterminate" && r.volume === "no_overload" && r.hf === "no_congestion" && r.chest.patterns.includes("bronchial_obstruction")
        && r.focal.verdict === "unsupported" && r.rf.failure === "present" && r.rf.hypercapnia === "present";
    },
  },
  {
    name: "Large pleural effusion",
    results: { shock: "Not in shock (indeterminate)", volume: "No overload", "heart-failure": "No congestion", "chest-exam": "Pleural effusion, one side", "focal-pulmonary": "Supported", "respiratory-failure": "Distress without failure" },
    draw: () => {
      const { exam: chest, side } = drawChest("pleural_effusion");
      const spo2 = uniform(91, 94);
      return {
        shock: { systolic: uniform(112, 148), skin: "warm", jvp: "normal_or_low", capillaryRefill: "brisk", pulseVolume: "normal", lungExam: "clear" },
        volume: { jvp: "normal_or_low", ...NO_OVERLOAD, pleuralEffusion: "present" },
        "heart-failure": { breathlessness: "present", crackles: "none", jvp: "normal_or_low", ...NO_RIGHT },
        "chest-exam": chest,
        "focal-pulmonary": {
          cough: p(chance(0.5)), reportedFever: "absent", pleuriticPain: p(chance(0.4)), breathlessness: "present",
          symptomDurationDays: uniform(10, 30), temperatureC: uniform(36.5, 37.4, 1), oxygenSaturation: spo2, ...chest,
          imaging: [{ modality: pick(["chest_radiograph", "chest_ultrasound"]), finding: "pleural_effusion", result: "present", side, timing: "current" }],
        },
        "respiratory-failure": { oxygenSupport: "room_air", oxygenSaturation: spo2, respiratoryRate: uniform(22, 28), accessoryMuscles: "present", paradoxicalBreathing: "absent", cyanosis: "absent", speech: "limited" },
      };
    },
    expect: (f) => {
      const r = v(f), side = (["right", "left"] as const).find((s) => r.chest[s].verdict === "pleural_effusion");
      return r.shock === "indeterminate" && r.volume === "no_overload" && r.hf === "no_congestion" && !!side && r.chest[other(side)].verdict === "no_syndrome"
        && r.focal.verdict === "supported" && r.rf.failure === "absent" && r.rf.distress === "present";
    },
  },
];

export const STORY_NAMES = STORIES.map((s) => s.name);

/** Each assessment's "no" result, offered whatever else is set. */
const NO: Results = { shock: "Not in shock (indeterminate)", volume: "No overload", "heart-failure": "No congestion", "chest-exam": "Normal", "focal-pulmonary": "Not supported", "respiratory-failure": "No failure, no distress" };

const ids = (want: Partial<Results>) => (Object.keys(want) as Id[]).filter((id) => want[id]);
/** The stories that have every result set in `want`, "no" results aside; an empty `want` matches all. */
const storiesWith = (want: Partial<Results>) =>
  STORIES.filter((s) => ids(want).every((id) => want[id] === NO[id] || s.results[id] === want[id]));

/** Each assessment's results: those that fit a story with what is set on the others, and always its "no". */
export const resultOptions = (want: Partial<Results>, id: Id) =>
  [...new Set([...storiesWith({ ...want, [id]: undefined }).map((s) => s.results[id]), NO[id]])];

/**
 * A patient from a random story with the results set in `want` (any story when none is set), preferring one that also
 * has the "no" results set. A "no" the story lacks takes that assessment's findings from a story that has it (`mixed`).
 */
export function generateWholePatient(want: Partial<Results> = {}): WholePatient {
  const set = ids(want), fits = storiesWith(want);
  const score = (x: Story) => set.filter((id) => x.results[id] === want[id]).length;
  const best = Math.max(...fits.map(score));
  const s = pick(fits.filter((x) => score(x) === best));
  const findings = drawChecked(s.draw, s.expect);
  const mixed = set.filter((id) => s.results[id] !== want[id]);
  for (const id of mixed) {
    const d = pick(STORIES.filter((x) => x.results[id] === want[id]));
    Object.assign(findings, { [id]: drawChecked(d.draw, d.expect)[id] });
  }
  return { story: s.name, findings, mixed };
}

/** For the self-check: how often a story's draw meets its expected verdicts on the first try. */
export const storyPassRate = (name: string, n = 500) => {
  const s = STORIES.find((x) => x.name === name)!;
  let ok = 0;
  for (let i = 0; i < n; i++) if (s.expect(s.draw())) ok++;
  return ok / n;
};

/** The six rules in the syndromic workflow's order (workflows/syndromic.md). */
export const ASSESSMENTS: { id: Id; title: string }[] = [
  { id: "shock", title: "Shock category" },
  { id: "volume", title: "Volume overload" },
  { id: "heart-failure", title: "Heart failure" },
  { id: "chest-exam", title: "Chest examination" },
  { id: "focal-pulmonary", title: "Focal pulmonary syndrome" },
  { id: "respiratory-failure", title: "Respiratory failure and distress" },
];
