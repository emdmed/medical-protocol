import { parseArgs } from "node:util";
import { calculatePaFi, getPaFiClassification, getPaFiSeverity } from "../../../../plugin/lib/pafi";
import { formatHeader, formatTable, printResult } from "../../../../plugin/lib/format";
import { fail, requireFlags } from "../cli";

const USAGE = `Usage: medprotocol pafi [options]

Options:
  --pao2 <number>    PaO2 in mmHg (required)
  --fio2 <number>    FiO2 as percentage, 21-100 (required)
  --json             Output as JSON
  --help             Show this help

Examples:
  medprotocol pafi --pao2 60 --fio2 40
  medprotocol pafi --pao2 90 --fio2 21`;

export const run = (argv: string[]): void => {
  const { values } = parseArgs({
    args: argv,
    options: {
      pao2: { type: "string" },
      fio2: { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(USAGE + "\n");
    return;
  }

  if (!requireFlags(values, ["pao2", "fio2"], USAGE)) return;

  const paFi = calculatePaFi(values.pao2!, values.fio2!);

  if (!paFi) return fail("Could not calculate PaFi — check input values (PaO2 > 0, FiO2 21-100)");

  const classification = getPaFiClassification(paFi);
  const severity = getPaFiSeverity(paFi);

  const data = {
    paFi: parseFloat(paFi),
    classification,
    severity,
    paO2: parseFloat(values.pao2!),
    fiO2: parseFloat(values.fio2!),
  };

  printResult(data, values.json!, () => {
    return [
      formatHeader("PaFi Calculator"),
      formatTable([
        ["PaFi Ratio", paFi],
        ["Classification", classification],
        ["Severity", severity],
        ["PaO2", `${values.pao2} mmHg`],
        ["FiO2", `${values.fio2}%`],
      ]),
    ].join("\n");
  });
};
