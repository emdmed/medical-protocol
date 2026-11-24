import {
  calculateWaterBalance,
  calculateInsensibleLoss,
  calculateEndogenousGeneration,
  calculateDefecationLoss,
  safeParseFloat,
} from "../../../../plugin/lib/water-balance";
import { formatHeader, formatTable, printResult } from "../../../../plugin/lib/format";
import { fail, parseFlags } from "../cli";

const USAGE = `Usage: medprotocol water-balance [options]

Options:
  --weight <number>    Patient weight in kg (required)
  --oral <number>      Oral fluid intake in mL (default: 0)
  --iv <number>        IV fluid intake in mL (default: 0)
  --diuresis <number>  Urine output in mL (default: 0)
  --stools <number>    Number of stools (default: 0)
  --json               Output as JSON
  --help               Show this help

Examples:
  medprotocol water-balance --weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2
  medprotocol water-balance --weight 70 --oral 1500 --json`;

export const run = (argv: string[]): void => {
  const values = parseFlags(argv, {
    weight: { type: "string" },
    oral: { type: "string", default: "0" },
    iv: { type: "string", default: "0" },
    diuresis: { type: "string", default: "0" },
    stools: { type: "string", default: "0" },
  }, USAGE);
  if (!values) return;

  if (!values.weight) return fail("--weight is required", USAGE);

  const weightNum = safeParseFloat(values.weight);
  const insensible = calculateInsensibleLoss(weightNum);
  const endogenous = calculateEndogenousGeneration(weightNum);
  const defecation = calculateDefecationLoss(values.stools!);
  const balance = calculateWaterBalance(
    values.weight!,
    values.oral!,
    values.iv!,
    values.diuresis!,
    values.stools!,
  );

  const totalIntake =
    safeParseFloat(values.oral!) +
    safeParseFloat(values.iv!) +
    safeParseFloat(endogenous);
  const totalOutput =
    safeParseFloat(values.diuresis!) +
    safeParseFloat(defecation) +
    safeParseFloat(insensible);

  const data = {
    balance: parseInt(balance, 10),
    totalIntake: Math.round(totalIntake),
    totalOutput: Math.round(totalOutput),
    intake: {
      oral: safeParseFloat(values.oral!),
      iv: safeParseFloat(values.iv!),
      endogenous: parseInt(endogenous, 10),
    },
    output: {
      diuresis: safeParseFloat(values.diuresis!),
      defecation: parseInt(defecation, 10),
      insensible: parseInt(insensible, 10),
    },
    weight: weightNum,
  };

  printResult(data, values.json, () => {
    const sign = parseInt(balance, 10) > 0 ? "+" : "";

    return [
      formatHeader("Water Balance"),
      formatTable([
        ["Net Balance", `${sign}${balance} mL`],
        ["Total Intake", `${Math.round(totalIntake)} mL`],
        ["Total Output", `${Math.round(totalOutput)} mL`],
      ]),
      "",
      "  Intake breakdown:",
      formatTable([
        ["  Oral", `${values.oral} mL`],
        ["  IV", `${values.iv} mL`],
        ["  Endogenous", `${endogenous} mL`],
      ]),
      "",
      "  Output breakdown:",
      formatTable([
        ["  Diuresis", `${values.diuresis} mL`],
        ["  Defecation", `${defecation} mL`],
        ["  Insensible", `${insensible} mL`],
      ]),
    ].join("\n");
  });
};
