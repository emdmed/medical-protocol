import {
  HEART_FAILURE_FINDINGS,
  HF_CAVEAT,
  HF_LABELS,
  HF_NEXT_LABELS,
  HF_REASONS,
  HF_SYNDROME_LABELS,
  assessHeartFailure,
  type HeartFailureExam,
} from "../../../../plugin/lib/heart-failure";
import { SHOCK_FINDINGS } from "../../../../plugin/lib/shock";
import { ESC_HF_2021, IBRAHIM_2016, STATPEARLS_RHF } from "../../../../plugin/lib/sources";
import { PRESENCE } from "../../../../plugin/lib/volume";
import { fail, parseFlags, printTable } from "../cli";

const H = HEART_FAILURE_FINDINGS;

/** flag → exam key and its allowed values */
const FLAGS = {
  breathlessness: ["breathlessness", PRESENCE],
  "leg-swelling": ["legSwelling", H.legSwelling],
  crackles: ["crackles", H.crackles],
  s3: ["thirdHeartSound", H.thirdHeartSound],
  heave: ["parasternalHeave", PRESENCE],
  p2: ["loudP2", PRESENCE],
  "tr-murmur": ["tricuspidRegurgitationMurmur", PRESENCE],
  "pr-murmur": ["pulmonaryRegurgitationMurmur", PRESENCE],
  jvp: ["jvp", SHOCK_FINDINGS.jvp],
  "jvp-ref": ["jvpReference", ["right-atrium", "sternal-angle"]],
  kussmaul: ["kussmaulSign", PRESENCE],
  hjr: ["hepatojugularReflux", PRESENCE],
  liver: ["hepatomegaly", H.hepatomegaly],
  ascites: ["ascites", PRESENCE],
  oedema: ["peripheralOedema", H.peripheralOedema],
} as const;

const list = (flag: keyof typeof FLAGS) => FLAGS[flag][1].join(" | ");

const USAGE = `Usage: medprotocol heart-failure [options]

Heart failure from the bedside examination: which side is congested (left: the lungs, right: the
systemic veins), and whether a cardinal symptom makes that congestion the syndrome. Left and right
are congestion patterns, not ventricular function. No study measured this rule: not a diagnosis.

Options (a finding left out is not_assessed):
  --breathlessness <v>   ${list("breathlessness")}
  --leg-swelling <v>     ${list("leg-swelling")} (the history)
  --crackles <v>         ${list("crackles")}
  --s3 <v>               ${list("s3")}
  --heave <v>            Parasternal heave: ${list("heave")}
  --p2 <v>               Loud P2: ${list("p2")}
  --tr-murmur <v>        Tricuspid regurgitation murmur: ${list("tr-murmur")}
  --pr-murmur <v>        Pulmonary regurgitation murmur: ${list("pr-murmur")}
  --jvp <v>              ${list("jvp")} (the impression; a usable --jvp-cm wins)
  --jvp-cm <number>      Measured JVP height in cm
  --jvp-ref <v>          ${list("jvp-ref")}: where --jvp-cm was measured from
  --kussmaul <v>         Kussmaul's sign: ${list("kussmaul")}
  --hjr <v>              Hepatojugular reflux: ${list("hjr")}
  --liver <v>            ${list("liver")}
  --ascites <v>          ${list("ascites")}
  --oedema <v>           ${list("oedema")} (on examination)
  --json                 Output as JSON
  --help                 Show this help

A height with no --jvp-ref, or an implausible one, is not used: the impression decides the neck and
the height is listed under "Not calculated".

Examples:
  medprotocol heart-failure --breathlessness present --crackles bilateral --jvp elevated
  medprotocol heart-failure --crackles none --jvp-cm 4 --jvp-ref sternal-angle`;

export const run = (argv: string[]): void => {
  const options: Record<string, { type: "string" }> = { "jvp-cm": { type: "string" } };
  for (const flag of Object.keys(FLAGS)) options[flag] = { type: "string" };
  const values = parseFlags(argv, options, USAGE) as Record<string, string | boolean | undefined> | undefined;
  if (!values) return;

  const exam: Record<string, string | undefined> = { jvpHeightCm: values["jvp-cm"] as string | undefined };
  for (const [flag, [key, allowed]] of Object.entries(FLAGS)) {
    const value = values[flag] as string | undefined;
    if (value !== undefined && !(allowed as readonly string[]).includes(value)) return fail(`--${flag} must be one of: ${allowed.join(", ")}`);
    exam[key] = value;
  }

  // the cast: each value was checked against its list just above
  const result = assessHeartFailure(exam as HeartFailureExam);
  const sources = [IBRAHIM_2016, ESC_HF_2021, STATPEARLS_RHF];
  const data = {
    ...result,
    label: HF_LABELS[result.verdict],
    reasonText: result.reason ? HF_REASONS[result.reason] : null,
    syndromeText: HF_SYNDROME_LABELS[result.syndrome],
    nextText: result.next.map((n) => HF_NEXT_LABELS[n]),
    caveat: HF_CAVEAT,
    sources,
  };

  const row = (label: string, items: string[]): [string, string][] => (items.length ? [[label, items.join(", ")]] : []);
  printTable(data, Boolean(values.json), "Heart Failure (bedside examination)", [
    ["Verdict", data.label],
    ...row("Why", data.reasonText ? [data.reasonText] : []),
    ["Syndrome", data.syndromeText],
    ...row("Left signs", result.leftSigns),
    ...row("Right signs", result.rightSigns),
    ...row("Systemic signs", result.systemicSigns),
    ...row("RV signs", result.rightVentricularSigns),
    ...row("Not calculated", result.notCalculated),
    ...row("Would decide it", data.nextText),
    ["Note", HF_CAVEAT],
    ["Sources", sources.join("; ")],
  ]);
};
