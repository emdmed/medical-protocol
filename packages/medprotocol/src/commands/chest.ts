import {
  CHEST_CAVEAT,
  CHEST_EXAMINATION,
  CHEST_LABELS,
  CHEST_PATTERN_LABELS,
  CHEST_REASONS,
  CHEST_SIGN_LABELS,
  SIDES,
  SIDE_FINDINGS,
  TRACHEA,
  assessChestExam,
  type ChestExam,
  type SideAssessment,
  type SideField,
} from "../../../../plugin/lib/chest-exam";
import { fail, parseFlags, printTable } from "../cli";

/** Flag suffix → sign, e.g. --left-breath-sounds → breathSounds. */
const SIGN_FLAGS: Record<string, SideField> = {
  expansion: "expansion",
  percussion: "percussion",
  "breath-sounds": "breathSounds",
  "added-sounds": "addedSounds",
  "vocal-resonance": "vocalResonance",
};

const signLines = Object.entries(SIGN_FLAGS)
  .map(([flag, sign]) => `    ${flag.padEnd(28)}${SIDE_FINDINGS[sign].join(" | ")}`)
  .join("\n");

const USAGE = `Usage: medprotocol chest [options]

Chest examination syndromes, one side at a time: consolidation, pleural effusion, atelectasis or
pneumothorax by the classic semiology table, plus wheeze or crackles on both sides. Examination
only: a film is not an input. Not a diagnosis.

Options (a sign left out was not recorded):
  --examination <v>             ${CHEST_EXAMINATION.join(" | ")} (left out, the signs decide)
  --trachea <v>                 ${TRACHEA.join(" | ")}
  --right-<sign> <v>            One flag per side and sign, e.g. --left-percussion dull:
  --left-<sign> <v>
${signLines}
  --json                        Output as JSON
  --help                        Show this help

A side with no sign recorded is not_examined. A side whose signs no row fits is indeterminate, with
the unexplained signs and any unrecorded sign that would complete a row.

Examples:
  medprotocol chest --right-percussion dull --right-breath-sounds bronchial --left-percussion resonant
  medprotocol chest --trachea deviated_left --left-percussion dull --left-breath-sounds absent`;

export const run = (argv: string[]): void => {
  const options: Record<string, { type: "string" }> = { examination: { type: "string" }, trachea: { type: "string" } };
  for (const side of SIDES) for (const flag of Object.keys(SIGN_FLAGS)) options[`${side}-${flag}`] = { type: "string" };
  const values = parseFlags(argv, options, USAGE) as Record<string, string | boolean | undefined> | undefined;
  if (!values) return;

  const checks: [string, readonly string[]][] = [["examination", CHEST_EXAMINATION], ["trachea", TRACHEA]];
  for (const side of SIDES) for (const [flag, sign] of Object.entries(SIGN_FLAGS)) checks.push([`${side}-${flag}`, SIDE_FINDINGS[sign]]);
  for (const [flag, allowed] of checks) {
    const value = values[flag] as string | undefined;
    if (value !== undefined && !allowed.includes(value)) return fail(`--${flag} must be one of: ${allowed.join(", ")}`);
  }

  const side = (s: string) => Object.fromEntries(Object.entries(SIGN_FLAGS).map(([flag, sign]) => [sign, values[`${s}-${flag}`]]));
  const exam = { examination: values.examination, trachea: values.trachea, right: side("right"), left: side("left") };

  // the cast: each value was checked against its list just above
  const result = assessChestExam(exam as unknown as ChestExam);
  const describe = (a: SideAssessment) => ({ label: CHEST_LABELS[a.verdict], reasonText: a.reason ? CHEST_REASONS[a.reason] : null });
  const data = {
    ...result,
    rightText: describe(result.right),
    leftText: describe(result.left),
    patternText: result.patterns.map((p) => CHEST_PATTERN_LABELS[p]),
    caveat: CHEST_CAVEAT,
  };

  const sideRows = (side: "right" | "left"): [string, string][] => {
    const a = result[side];
    const name = side === "right" ? "Right" : "Left";
    const rows: [string, string][] = [[name, CHEST_LABELS[a.verdict]]];
    if (a.reason) rows.push([`  Why`, CHEST_REASONS[a.reason]]);
    if (a.unexplained.length) rows.push([`  Unexplained`, a.unexplained.map((u) => `${CHEST_SIGN_LABELS[u.sign]} ${u.value}`).join(", ")]);
    for (const u of a.unrecorded) rows.push([`  ${CHEST_LABELS[u.syndrome]} if`, `${CHEST_SIGN_LABELS[u.sign]} ${u.values.join(" or ")}`]);
    return rows;
  };

  printTable(data, Boolean(values.json), "Chest Examination (bedside syndromes)", [
    ...sideRows("right"),
    ...sideRows("left"),
    ...(data.patternText.length ? [["Both sides", data.patternText.join(", ")] as [string, string]] : []),
    ["Note", CHEST_CAVEAT],
  ]);
};
