import { CHEST_EXAMINATION, SIDES, SIDE_FINDINGS, TRACHEA, type SideField } from "../../../../plugin/lib/chest-exam";
import {
  FOCAL_CAVEAT,
  FOCAL_DIFFERENTIAL_LABELS,
  FOCAL_EVIDENCE_LABELS,
  FOCAL_LABELS,
  FOCAL_NEXT_LABELS,
  FOCAL_REASONS,
  HISTORY_FINDINGS,
  IMAGING_FINDINGS,
  IMAGING_KEYS,
  assessFocalPulmonary,
  type FocalPulmonaryInput,
} from "../../../../plugin/lib/focal-pulmonary";
import { fail, parseFlags, printTable } from "../cli";

/** Same per-side flag suffixes as `medprotocol chest`. */
const SIGN_FLAGS: Record<string, SideField> = {
  expansion: "expansion",
  percussion: "percussion",
  "breath-sounds": "breathSounds",
  "added-sounds": "addedSounds",
  "vocal-resonance": "vocalResonance",
};

const HISTORY_FLAGS: Record<string, keyof typeof HISTORY_FINDINGS> = {
  cough: "cough",
  sputum: "sputum",
  fever: "reportedFever",
  "pleuritic-pain": "pleuriticPain",
  breathlessness: "breathlessness",
};

const NUMBER_FLAGS = { "duration-days": "symptomDurationDays", temp: "temperatureC", spo2: "oxygenSaturation" } as const;

const pad = (s: string) => `  ${s.padEnd(30)}`;
const historyLines = Object.entries(HISTORY_FLAGS).map(([f, k]) => `${pad(`--${f} <v>`)}${HISTORY_FINDINGS[k].join(" | ")}`).join("\n");
const signLines = Object.entries(SIGN_FLAGS).map(([f, s]) => `    ${f.padEnd(28)}${SIDE_FINDINGS[s].join(" | ")}`).join("\n");
const imagingLines = IMAGING_KEYS.map((k) => `    ${k.padEnd(28)}${IMAGING_FINDINGS[k].join(" | ")}`).join("\n");

const USAGE = `Usage: medprotocol pulmonary [options]

Focal pulmonary syndrome from history, chest signs and imaging, kept apart: a bounded verdict,
pneumonia's evidence level, a differential and what would discriminate. Not a diagnosis, never a
treatment.

History (a finding left out was not stated):
${historyLines}
${pad("--duration-days <n>")}Symptom duration, days

Measured:
${pad("--temp <C>")}Temperature, °C (fever at 38 or higher)
${pad("--spo2 <%>")}Oxygen saturation

Chest signs (same flags as medprotocol chest; a sign left out was not recorded):
${pad("--examination <v>")}${CHEST_EXAMINATION.join(" | ")} (left out, the signs decide)
${pad("--trachea <v>")}${TRACHEA.join(" | ")}
${pad("--right-<sign> <v>")}e.g. --left-percussion dull
${pad("--left-<sign> <v>")}
${signLines}

Imaging (repeatable, one per item):
${pad("--imaging <m,f,r,s,t>")}${IMAGING_KEYS.join(",")}, in that order:
${imagingLines}

  --json                        Output as JSON
  --help                        Show this help

Examples:
  medprotocol pulmonary --cough present --temp 38.4 --right-percussion dull --right-breath-sounds bronchial
  medprotocol pulmonary --left-added-sounds crackles --imaging chest_radiograph,consolidation,present,left,current`;

export const run = (argv: string[]): void => {
  const options: Record<string, { type: "string"; multiple?: boolean }> = {
    examination: { type: "string" },
    trachea: { type: "string" },
    imaging: { type: "string", multiple: true },
  };
  for (const f of [...Object.keys(HISTORY_FLAGS), ...Object.keys(NUMBER_FLAGS)]) options[f] = { type: "string" };
  for (const side of SIDES) for (const f of Object.keys(SIGN_FLAGS)) options[`${side}-${f}`] = { type: "string" };
  const values = parseFlags(argv, options, USAGE) as Record<string, string | string[] | boolean | undefined> | undefined;
  if (!values) return;

  const checks: [string, readonly string[]][] = [["examination", CHEST_EXAMINATION], ["trachea", TRACHEA]];
  for (const [f, k] of Object.entries(HISTORY_FLAGS)) checks.push([f, HISTORY_FINDINGS[k]]);
  for (const side of SIDES) for (const [f, s] of Object.entries(SIGN_FLAGS)) checks.push([`${side}-${f}`, SIDE_FINDINGS[s]]);
  for (const [flag, allowed] of checks) {
    const value = values[flag] as string | undefined;
    if (value !== undefined && !allowed.includes(value)) return fail(`--${flag} must be one of: ${allowed.join(", ")}`);
  }
  for (const f of Object.keys(NUMBER_FLAGS)) {
    const value = values[f] as string | undefined;
    if (value !== undefined && !Number.isFinite(Number(value))) return fail(`--${f} must be a number`);
  }

  const imaging: Record<string, string>[] = [];
  for (const item of (values.imaging as string[] | undefined) ?? []) {
    const parts = item.split(",").map((p) => p.trim());
    if (parts.length !== IMAGING_KEYS.length) return fail(`--imaging takes ${IMAGING_KEYS.length} values: ${IMAGING_KEYS.join(",")}`);
    for (const [i, key] of IMAGING_KEYS.entries()) {
      const allowed: readonly string[] = IMAGING_FINDINGS[key];
      if (!allowed.includes(parts[i])) return fail(`--imaging ${key} must be one of: ${allowed.join(", ")}`);
    }
    imaging.push(Object.fromEntries(IMAGING_KEYS.map((k, i) => [k, parts[i]])));
  }

  const side = (s: string) => Object.fromEntries(Object.entries(SIGN_FLAGS).map(([f, sign]) => [sign, values[`${s}-${f}`]]));
  const input = {
    ...Object.fromEntries(Object.entries(HISTORY_FLAGS).map(([f, k]) => [k, values[f]])),
    ...Object.fromEntries(Object.entries(NUMBER_FLAGS).map(([f, k]) => [k, values[f]])),
    examination: values.examination,
    trachea: values.trachea,
    right: side("right"),
    left: side("left"),
    imaging,
  };

  // the cast: each value was checked against its list just above
  const result = assessFocalPulmonary(input as unknown as FocalPulmonaryInput);
  const data = {
    ...result,
    label: FOCAL_LABELS[result.verdict],
    reasonText: FOCAL_REASONS[result.reason],
    evidenceText: FOCAL_EVIDENCE_LABELS[result.pneumoniaEvidence],
    differentialText: result.differential.map((d) => FOCAL_DIFFERENTIAL_LABELS[d]),
    nextText: result.next.map((n) => FOCAL_NEXT_LABELS[n]),
    caveat: FOCAL_CAVEAT,
  };

  const c = result.conflict;
  printTable(data, Boolean(values.json), "Focal Pulmonary Syndrome", [
    ["Verdict", data.label],
    ["Why", data.reasonText],
    ["Focal side", result.focalSide ?? "None"],
    ["Pneumonia evidence", data.evidenceText],
    ["Differential", data.differentialText.join(", ") || "None named"],
    ...(c ? [["Conflict", `examination ${c.examinationSide ?? "no focal side"}, imaging ${c.imagingFinding} ${c.imagingSide}`] as [string, string]] : []),
    ...(data.nextText.length ? [["Next", data.nextText.join("; ")] as [string, string]] : []),
    ["Note", FOCAL_CAVEAT],
  ]);
};
