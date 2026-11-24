import { parseArgs, type ParseArgsOptionsConfig } from "node:util";
import { formatError, formatHeader, formatTable, printResult } from "../../../plugin/lib/format";

// Prints "Error: <message>", then the usage text when given, and marks the run as failed.
export const fail = (message: string, usage?: string): void => {
  process.stderr.write(formatError(message) + "\n" + (usage ? "\n" + usage + "\n" : ""));
  process.exitCode = 1;
};

// False (after printing the error) when any named flag is empty or absent.
export const requireFlags = (values: Record<string, unknown>, names: string[], usage: string): boolean => {
  const missing = names.filter((name) => !values[name]);
  if (missing.length === 0) return true;
  fail(`Missing required flags: ${missing.map((name) => `--${name}`).join(", ")}`, usage);
  return false;
};

// Parses a command's flags; every command also takes --json and --help.
// Null (after printing the usage text) when --help was given. A mistyped flag throws; index.ts reports it.
export const parseFlags = <const T extends ParseArgsOptionsConfig>(argv: string[], options: T, usage: string) => {
  const { values } = parseArgs({
    args: argv,
    options: { ...options, json: { type: "boolean", default: false }, help: { type: "boolean", default: false } },
    strict: true,
  });
  // the cast: inside this generic function TypeScript cannot yet see the two flags added above
  if ((values as { help?: boolean }).help) {
    process.stdout.write(usage + "\n");
    return null;
  }
  return values;
};

// The usual output of a calculator: a title and one table, or the data as JSON.
export const printTable = (
  data: Record<string, unknown>,
  json: boolean,
  title: string,
  rows: [string, string][],
): void => printResult(data, json, () => [formatHeader(title), formatTable(rows)].join("\n"));

type Subcommand = (argv: string[]) => void;

export const runSubcommand = (argv: string[], usage: string, subcommands: Record<string, Subcommand>): void => {
  const [subcommand, ...subArgs] = argv;
  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    process.stdout.write(usage + "\n");
    return;
  }
  // hasOwn: "ckd toString" must be an unknown sub-command, not Object.prototype.toString
  if (!Object.hasOwn(subcommands, subcommand)) {
    process.stderr.write(
      formatError(`Unknown sub-command: ${subcommand}`) + `\n\nAvailable: ${Object.keys(subcommands).join(", ")}\n`,
    );
    process.exitCode = 1;
    return;
  }
  subcommands[subcommand](subArgs);
};
