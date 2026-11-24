import { formatError } from "../../../plugin/lib/format";

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

type Subcommand = (argv: string[], json: boolean) => void;

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
  subcommands[subcommand](subArgs, subArgs.includes("--json"));
};
