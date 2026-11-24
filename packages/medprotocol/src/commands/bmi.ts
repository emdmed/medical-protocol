import { calculateBMI, getBMICategory } from "../../../../plugin/lib/bmi";
import { fail, parseFlags, printTable } from "../cli";

const USAGE = `Usage: medprotocol bmi [options]

Options:
  --weight <number>      Weight (lbs for imperial, kg for metric)
  --height-ft <number>   Height in feet (imperial)
  --height-in <number>   Height in inches (imperial)
  --height-m <number>    Height in meters (metric, requires --metric)
  --metric               Use metric units (kg, meters)
  --json                 Output as JSON
  --help                 Show this help

Examples:
  medprotocol bmi --weight 154 --height-ft 5 --height-in 9
  medprotocol bmi --weight 70 --height-m 1.75 --metric`;

export const run = (argv: string[]): void => {
  const values = parseFlags(argv, {
    weight: { type: "string" },
    "height-ft": { type: "string" },
    "height-in": { type: "string" },
    "height-m": { type: "string" },
    metric: { type: "boolean", default: false },
  }, USAGE);
  if (!values) return;

  if (!values.weight) return fail("--weight is required", USAGE);

  const isMetric = values.metric!;

  if (isMetric && !values["height-m"]) return fail("--height-m is required with --metric", USAGE);

  if (!isMetric && !values["height-ft"] && !values["height-in"]) {
    return fail("--height-ft and/or --height-in required (or use --metric --height-m)", USAGE);
  }

  const bmi = calculateBMI(
    values.weight!,
    values["height-ft"] || "0",
    values["height-in"] || "0",
    values["height-m"] || "0",
    isMetric,
  );

  const category = getBMICategory(bmi);

  if (!bmi) return fail("Could not calculate BMI — check input values");

  const data = {
    bmi: parseFloat(bmi),
    category,
    units: isMetric ? "metric" : "imperial",
    weight: parseFloat(values.weight!),
    ...(isMetric
      ? { heightM: parseFloat(values["height-m"]!) }
      : {
          heightFt: parseFloat(values["height-ft"] || "0"),
          heightIn: parseFloat(values["height-in"] || "0"),
        }),
  };

  const heightDisplay = isMetric
    ? `${values["height-m"]}m`
    : `${values["height-ft"] || 0}'${values["height-in"] || 0}"`;

  const weightUnit = isMetric ? "kg" : "lbs";

  printTable(data, values.json, "BMI Calculator", [
    ["BMI", bmi],
    ["Category", category],
    ["Weight", `${values.weight} ${weightUnit}`],
    ["Height", heightDisplay],
  ]);
};
