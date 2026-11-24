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
