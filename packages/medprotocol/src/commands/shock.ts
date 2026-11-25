import { SHOCK_FINDINGS, SHOCK_LABELS, SHOCK_REASONS, classifyShock } from "../../../../plugin/lib/shock";
import { VAZQUEZ_2010 } from "../../../../plugin/lib/sources";
import { fail, parseFlags, printTable, requireFlags } from "../cli";

const USAGE = `Usage: medprotocol shock [options]

Shock category from the bedside examination (skin temperature by JVP). A bedside heuristic from a
pilot study, right in 76% of its own patients: not a diagnosis.

Options:
  --sbp <number>         Systolic blood pressure in mmHg (required)
  --minutes <number>     How long the hypotension has lasted, in minutes
  --skin <finding>       ${SHOCK_FINDINGS.skin.join(" | ")}
  --jvp <finding>        ${SHOCK_FINDINGS.jvp.join(" | ")}
  --jvp-cm <number>      Measured JVP in cmH2O; only read when --jvp is not given
  --cap-refill <finding> ${SHOCK_FINDINGS.capillaryRefill.join(" | ")}
  --pulse <finding>      ${SHOCK_FINDINGS.pulseVolume.join(" | ")}
  --lungs <finding>      ${SHOCK_FINDINGS.lungExam.join(" | ")}
  --json                 Output as JSON
  --help                 Show this help

A finding left out is not_assessed. Capillary refill, pulse and lungs never change the category;
they are reported as supporting it or pointing elsewhere.

Examples:
  medprotocol shock --sbp 82 --minutes 45 --skin cool --jvp elevated
  medprotocol shock --sbp 78 --minutes 60 --skin warm --jvp-cm 5 --cap-refill brisk`;

const FLAGS = { skin: "skin", jvp: "jvp", "cap-refill": "capillaryRefill", pulse: "pulseVolume", lungs: "lungExam" } as const;

export const run = (argv: string[]): void => {
  const values = parseFlags(argv, {
    sbp: { type: "string" },
    minutes: { type: "string" },
    skin: { type: "string" },
    jvp: { type: "string" },
    "jvp-cm": { type: "string" },
    "cap-refill": { type: "string" },
    pulse: { type: "string" },
    lungs: { type: "string" },
  }, USAGE);
  if (!values) return;

  if (!requireFlags(values, ["sbp"], USAGE)) return;

  for (const [flag, name] of Object.entries(FLAGS)) {
    const allowed: readonly string[] = SHOCK_FINDINGS[name];
    const value = values[flag as keyof typeof FLAGS];
    if (value !== undefined && !allowed.includes(value)) return fail(`--${flag} must be one of: ${allowed.join(", ")}`);
  }

  // the cast: each value was checked against its list just above
  const finding = <K extends keyof typeof FLAGS>(flag: K) => values[flag] as (typeof SHOCK_FINDINGS)[(typeof FLAGS)[K]][number] | undefined;
  const result = classifyShock({
    systolic: values.sbp!,
    durationMinutes: values.minutes,
    skin: finding("skin"),
    jvp: finding("jvp"),
    jvpCmH2O: values["jvp-cm"],
    capillaryRefill: finding("cap-refill"),
    pulseVolume: finding("pulse"),
    lungExam: finding("lungs"),
  });

  if (!result) return fail("Could not classify — check input values (systolic > 0, minutes and JVP not negative)");

  const data = {
    ...result,
    label: SHOCK_LABELS[result.category],
    reasonText: result.reason ? SHOCK_REASONS[result.reason] : null,
    source: VAZQUEZ_2010,
  };

  printTable(data, values.json, "Shock Category (bedside examination)", [
    ["Category", data.label],
    ...(data.reasonText ? [["Why", data.reasonText] as [string, string]] : []),
    ["JVP used", result.jvp],
    ["Supporting findings", result.supporting.join(", ") || "none"],
    ["Findings pointing elsewhere", result.discordant.join(", ") || "none"],
    ["Source", VAZQUEZ_2010],
  ]);
};
