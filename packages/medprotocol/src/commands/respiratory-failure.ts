import {
  ENUM_FIELDS,
  GAS_FIELDS,
  RF_CAVEAT,
  RF_DISTRESS_LABELS,
  RF_FAILURE_LABELS,
  RF_FAILURE_REASONS,
  RF_LIMB_LABELS,
  RF_NEXT_LABELS,
  RF_SIGN_LABELS,
  assessRespiratoryFailure,
  type RespiratoryFailureInput,
} from "../../../../plugin/lib/respiratory-failure";
import { fail, parseFlags, printTable } from "../cli";

const ENUM_FLAGS: Record<string, keyof typeof ENUM_FIELDS> = {
  "oxygen-support": "oxygenSupport",
  "accessory-muscles": "accessoryMuscles",
  speech: "speech",
  "paradoxical-breathing": "paradoxicalBreathing",
  cyanosis: "cyanosis",
  "blood-gas": "bloodGas",
  "gas-unit": "gasUnit",
};

const pad = (s: string) => `  ${s.padEnd(30)}`;
const enumLines = Object.entries(ENUM_FLAGS).map(([f, k]) => `${pad(`--${f} <v>`)}${ENUM_FIELDS[k].join(" | ")}`).join("\n");

const USAGE = `Usage: medprotocol respiratory-failure [options]

Respiratory failure (gas exchange) and respiratory distress (work of breathing), two verdicts kept
apart. Not a diagnosis, never a treatment.

Findings (a finding left out was not stated):
${enumLines}

Measured:
${pad("--rr <n>")}Respiratory rate, breaths/min (distress at 30 or more)
${pad("--spo2 <%>")}Oxygen saturation, on whatever --oxygen-support says
${pad("--ph <n>")}Blood gas pH (needs --blood-gas)
${pad("--po2 <n>")}Blood gas pO2, in --gas-unit
${pad("--pco2 <n>")}Blood gas pCO2, in --gas-unit (unit inferred from it when left out)
${pad("--hco3 <n>")}Blood gas HCO3, mmol/L

  --json                        Output as JSON
  --help                        Show this help

Examples:
  medprotocol respiratory-failure --oxygen-support room_air --spo2 86 --rr 34 --accessory-muscles present
  medprotocol respiratory-failure --blood-gas arterial --gas-unit kPa --ph 7.28 --po2 7.5 --pco2 8.1 --hco3 28`;

export const run = (argv: string[]): void => {
  const options: Record<string, { type: "string" }> = {};
  for (const f of [...Object.keys(ENUM_FLAGS), ...GAS_FIELDS, "rr", "spo2"]) options[f] = { type: "string" };
  const values = parseFlags(argv, options, USAGE) as Record<string, string | boolean | undefined> | undefined;
  if (!values) return;

  for (const [flag, key] of Object.entries(ENUM_FLAGS)) {
    const value = values[flag] as string | undefined;
    const allowed: readonly string[] = ENUM_FIELDS[key];
    if (value !== undefined && !allowed.includes(value)) return fail(`--${flag} must be one of: ${allowed.join(", ")}`);
  }
  // --spo2 is left to the lib: a saturation it refuses is listed under notCalculated, not failed on.
  for (const f of [...GAS_FIELDS, "rr"]) {
    const value = values[f] as string | undefined;
    if (value !== undefined && !Number.isFinite(Number(value))) return fail(`--${f} must be a number`);
  }
  if (GAS_FIELDS.some((f) => values[f] !== undefined) && !values["blood-gas"]) {
    return fail("--ph, --po2, --pco2 and --hco3 need --blood-gas arterial or venous");
  }

  const input = {
    ...Object.fromEntries(Object.entries(ENUM_FLAGS).map(([f, k]) => [k, values[f]])),
    ...Object.fromEntries(GAS_FIELDS.map((f) => [f, values[f]])),
    respiratoryRate: values.rr,
    oxygenSaturation: values.spo2,
  };

  // the cast: each enum value was checked against its list just above
  const result = assessRespiratoryFailure(input as RespiratoryFailureInput);
  const data = {
    ...result,
    failureLabel: RF_FAILURE_LABELS[result.failure],
    failureReasonText: RF_FAILURE_REASONS[result.failureReason],
    distressLabel: RF_DISTRESS_LABELS[result.distress],
    distressSignsText: result.distressSigns.map((s) => RF_SIGN_LABELS[s]),
    nextText: result.next.map((n) => RF_NEXT_LABELS[n]),
    caveat: RF_CAVEAT,
  };

  const g = result.arterialGas;
  printTable(data, Boolean(values.json), "Respiratory Failure and Distress", [
    ["Failure", data.failureLabel],
    ["Why", data.failureReasonText],
    ["Hypoxaemia", RF_LIMB_LABELS[result.hypoxaemia]],
    ["Hypercapnia", RF_LIMB_LABELS[result.hypercapnia]],
    ...(g ? [["Arterial gas", `PaO2 ${g.po2MmHg ?? "?"} mmHg, PaCO2 ${g.pco2MmHg ?? "?"} mmHg${g.disorder ? `, ${g.disorder}` : ""}`] as [string, string]] : []),
    ["Distress", data.distressLabel],
    ...(data.distressSignsText.length ? [["Distress signs", data.distressSignsText.join(", ")] as [string, string]] : []),
    ...(result.notCalculated.length ? [["Not calculated", result.notCalculated.join("; ")] as [string, string]] : []),
    ...(data.nextText.length ? [["Next", data.nextText.join("; ")] as [string, string]] : []),
    ["Note", RF_CAVEAT],
  ]);
};
