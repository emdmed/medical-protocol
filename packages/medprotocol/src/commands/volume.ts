import { SHOCK_FINDINGS } from "../../../../plugin/lib/shock";
import { MCKEE_1971 } from "../../../../plugin/lib/sources";
import { PRESENCE, VOLUME_CAVEAT, VOLUME_LABELS, VOLUME_REASONS, assessVolume, type VolumeExam } from "../../../../plugin/lib/volume";
import { fail, parseFlags, printTable } from "../cli";

const USAGE = `Usage: medprotocol volume [options]

Volume overload from the bedside examination: a count of congestion signs (two majors, or one
major and two minors). Examination only: BNP, the chest film and the echo are not inputs. The
examination subset of the Framingham criteria, never validated on its own: not a diagnosis.

Options (each finding: ${PRESENCE.join(" | ")}):
  --jvp <finding>           ${SHOCK_FINDINGS.jvp.join(" | ")} (major)
  --jvp-cm <number>         Measured JVP in cmH2O; only read when --jvp is not given
  --crackles <finding>      Bilateral rales (major); crackles at one base are absent
  --s3 <finding>            S3 gallop (major)
  --hjr <finding>           Hepatojugular reflux (major)
  --edema <finding>         Bilateral ankle edema (minor)
  --hepatomegaly <finding>  Hepatomegaly (minor)
  --effusion <finding>      Pleural effusion on examination (minor)
  --json                    Output as JSON
  --help                    Show this help

A finding left out is not_assessed. A count that only unassessed signs could still reach is
indeterminate, and the signs that would settle it are listed.

Examples:
  medprotocol volume --jvp elevated --crackles present
  medprotocol volume --jvp-cm 5 --crackles absent --s3 absent --hjr absent --edema present`;

const FLAGS = {
  crackles: "rales",
  s3: "s3Gallop",
  hjr: "hepatojugularReflux",
  edema: "bilateralAnkleEdema",
  hepatomegaly: "hepatomegaly",
  effusion: "pleuralEffusion",
} as const;

export const run = (argv: string[]): void => {
  const values = parseFlags(argv, {
    jvp: { type: "string" },
    "jvp-cm": { type: "string" },
    crackles: { type: "string" },
    s3: { type: "string" },
    hjr: { type: "string" },
    edema: { type: "string" },
    hepatomegaly: { type: "string" },
    effusion: { type: "string" },
  }, USAGE);
  if (!values) return;

  const allowed: readonly string[] = SHOCK_FINDINGS.jvp;
  if (values.jvp !== undefined && !allowed.includes(values.jvp)) return fail(`--jvp must be one of: ${allowed.join(", ")}`);
  for (const flag of Object.keys(FLAGS) as (keyof typeof FLAGS)[]) {
    const value = values[flag];
    if (value !== undefined && !(PRESENCE as readonly string[]).includes(value)) return fail(`--${flag} must be one of: ${PRESENCE.join(", ")}`);
  }

  // the cast: each value was checked against its list just above
  const exam = Object.fromEntries(Object.entries(FLAGS).map(([flag, name]) => [name, values[flag as keyof typeof FLAGS]]));
  const result = assessVolume({ ...exam, jvp: values.jvp, jvpCmH2O: values["jvp-cm"] } as VolumeExam);

  if (!result) return fail("Could not assess — the measured JVP must be a number ≥ 0");

  const data = {
    ...result,
    label: VOLUME_LABELS[result.status],
    reasonText: result.reason ? VOLUME_REASONS[result.reason] : null,
    caveat: VOLUME_CAVEAT,
    source: MCKEE_1971,
  };

  printTable(data, values.json, "Volume Overload (bedside examination)", [
    ["Verdict", data.label],
    ...(data.reasonText ? [["Why", data.reasonText] as [string, string]] : []),
    ...(result.pivotal.length ? [["Would settle it", result.pivotal.join(", ")] as [string, string]] : []),
    ["Note", VOLUME_CAVEAT],
    ["Source", MCKEE_1971],
  ]);
};
