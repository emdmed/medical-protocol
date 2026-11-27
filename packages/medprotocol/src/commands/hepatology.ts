import {
  calculateFIB4,
  getMASLDRiskStratification,
  getMASLDTreatmentRecommendation,
} from "../../../../plugin/lib/hepatology";
import { fail, parseFlags, printTable, requireFlags } from "../cli";

const USAGE = `Usage: medprotocol hepatology [options]

MASLD screening (ADA 2026 Fig 4.3): FIB-4, then LSM or ELF when FIB-4 is indeterminate.

Options:
  --age <number>         Age in years (required)
  --ast <number>         AST in U/L (required)
  --alt <number>         ALT in U/L (required)
  --platelets <number>   Platelets in 10^9/L, e.g. 200 (required)
  --lsm <number>         Liver stiffness in kPa (optional, phase 2)
  --elf <number>         ELF score (optional, phase 2)
  --json                 Output as JSON
  --help                 Show this help

Examples:
  medprotocol hepatology --age 55 --ast 40 --alt 35 --platelets 200
  medprotocol hepatology --age 55 --ast 40 --alt 35 --platelets 150 --lsm 9.2`;

export const run = (argv: string[]): void => {
  const values = parseFlags(argv, {
    age: { type: "string" },
    ast: { type: "string" },
    alt: { type: "string" },
    platelets: { type: "string" },
    lsm: { type: "string" },
    elf: { type: "string" },
  }, USAGE);
  if (!values) return;

  if (!requireFlags(values, ["age", "ast", "alt", "platelets"], USAGE)) return;

  const fib4 = calculateFIB4(values.age!, values.ast!, values.alt!, values.platelets!);
  // The lib returns score 0 for any input ≤0 or not a number.
  if (fib4.score === 0) return fail("Could not calculate FIB-4 — age, AST, ALT and platelets must be numbers > 0");

  const risk = getMASLDRiskStratification(fib4.tier, values.lsm, values.elf);
  // Treatment text is shown only for warning or critical (context/hepatology.md).
  const treatment = risk.severity === "normal" ? null : getMASLDTreatmentRecommendation(risk.referral, risk.severity);

  const data = { fib4: fib4.score, fib4Tier: fib4.tier, ...risk, treatment };

  printTable(data, values.json, "MASLD Screening", [
    ["FIB-4", `${fib4.score} (${fib4.tier})`],
    ["Stage", risk.stage],
    ["Action", risk.action],
    ["Interval", risk.interval],
    ["Severity", risk.severity],
    ...(treatment
      ? ([["Obesity", treatment.obesity], ["Diabetes", treatment.diabetes], ["MASH", treatment.mash]] as [string, string][])
      : []),
  ]);
};
