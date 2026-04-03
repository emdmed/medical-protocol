import { parseArgs } from "node:util";
import {
  calculateGlucoseReductionRate,
  isGlucoseOnTarget,
  assessDKAResolution,
  suggestInsulinAdjustment,
} from "../../../../lib/dka";
import { formatHeader, formatTable, printResult, formatError } from "../format";

const USAGE = `Usage: medprotocol dka [options]

Options:
  --glucose <number>       Current glucose value (required)
  --prev-glucose <number>  Previous glucose value (for rate calculation)
  --hours <number>         Hours between readings (default: 1)
  --ketones <number>       Current ketones (mmol/L)
  --bicarbonate <number>   Current bicarbonate (mEq/L)
  --ph <number>            Current pH
  --insulin-rate <number>  Current insulin rate (U/hr)
  --unit <mgdl|mmol>       Glucose unit (default: mgdl)
  --json                   Output as JSON
  --help                   Show this help

Examples:
  medprotocol dka --glucose 400 --prev-glucose 460 --hours 2 --unit mgdl
  medprotocol dka --glucose 350 --ketones 3.0 --bicarbonate 12 --ph 7.20 --unit mgdl`;

export const run = (argv: string[]): void => {
  const { values } = parseArgs({
    args: argv,
    options: {
      glucose: { type: "string" },
      "prev-glucose": { type: "string" },
      hours: { type: "string", default: "1" },
      ketones: { type: "string" },
      bicarbonate: { type: "string" },
      ph: { type: "string" },
      "insulin-rate": { type: "string" },
      unit: { type: "string", default: "mgdl" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(USAGE + "\n");
    return;
  }

  if (!values.glucose) {
    process.stderr.write(formatError("--glucose is required") + "\n\n" + USAGE + "\n");
    process.exitCode = 1;
    return;
  }

  const unit = (values.unit === "mmol" ? "mmol" : "mgdl") as "mmol" | "mgdl";
  const unitLabel = unit === "mgdl" ? "mg/dL" : "mmol/L";

  const rows: [string, string][] = [
    ["Glucose", `${values.glucose} ${unitLabel}`],
  ];

  const data: Record<string, unknown> = {
    glucose: parseFloat(values.glucose!),
    unit,
  };

  // Rate calculation
  if (values["prev-glucose"]) {
    const rate = calculateGlucoseReductionRate(
      values.glucose!,
      values["prev-glucose"]!,
      values.hours!,
    );

    if (rate) {
      const onTarget = isGlucoseOnTarget(rate, unit);
      rows.push(["Glucose rate", `${rate} ${unitLabel}/hr`]);
      rows.push(["On target", onTarget ? "Yes" : "No"]);
      data.glucoseRate = parseFloat(rate);
      data.glucoseOnTarget = onTarget;
    }
  }

  // Resolution assessment
  if (values.ketones && values.bicarbonate && values.ph) {
    const resolution = assessDKAResolution(
      values.glucose!,
      values.ketones!,
      values.bicarbonate!,
      values.ph!,
      unit,
    );

    rows.push(["Ketones", `${values.ketones} mmol/L`]);
    rows.push(["Bicarbonate", `${values.bicarbonate} mEq/L`]);
    rows.push(["pH", values.ph!]);
    rows.push(["DKA Resolved", resolution.resolved ? "Yes" : "No"]);

    data.ketones = parseFloat(values.ketones!);
    data.bicarbonate = parseFloat(values.bicarbonate!);
    data.pH = parseFloat(values.ph!);
    data.resolved = resolution.resolved;
    data.criteria = resolution.criteria;
  }

  // Insulin suggestion
  if (values["insulin-rate"]) {
    const rate = values["prev-glucose"]
      ? calculateGlucoseReductionRate(
          values.glucose!,
          values["prev-glucose"]!,
          values.hours!,
        )
      : null;

    const suggestion = suggestInsulinAdjustment(
      values.glucose!,
      rate,
      values["insulin-rate"]!,
      unit,
    );

    rows.push(["Insulin rate", `${values["insulin-rate"]} U/hr`]);
    rows.push(["Suggestion", suggestion]);
    data.insulinRate = parseFloat(values["insulin-rate"]!);
    data.insulinSuggestion = suggestion;
  }

  printResult(data, values.json!, () => {
    return [formatHeader("DKA Assessment"), formatTable(rows)].join("\n");
  });
};
