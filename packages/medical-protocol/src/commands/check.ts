import { parseArgs } from "util";
import { version as VERSION } from "../../package.json";
import { getBundledPluginDir, getTargetDir, listFiles } from "../files";
import { hashFile, readManifest } from "../manifest";
import { formatError, printResult, formatHeader, formatTable } from "../../../../lib/format";
import * as fs from "fs";
import * as path from "path";

export function run(argv: string[]): void {
  const { values } = parseArgs({
    args: argv,
    options: {
      dir: { type: "string", default: process.cwd() },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(
      `Usage: medical-protocol check [--dir <path>] [--json]\n\n` +
        `Check if the installed plugin is up-to-date.\n\n` +
        `Options:\n` +
        `  --dir <path>   Target project directory (default: cwd)\n` +
        `  --json         Output as JSON\n`,
    );
    return;
  }

  const targetDir = getTargetDir(values.dir!);
  const bundledDir = getBundledPluginDir();

  const manifest = readManifest(targetDir);
  if (!manifest) {
    process.stderr.write(formatError("Plugin not installed. Run 'medical-protocol install' first.") + "\n");
    process.exitCode = 1;
    return;
  }

  const bundledFiles = listFiles(bundledDir);
  const stale: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];

  // Check bundled files against manifest
  for (const relPath of bundledFiles) {
    const bundledHash = hashFile(path.join(bundledDir, relPath));
    const manifestHash = manifest.files[relPath];

    if (!manifestHash) {
      added.push(relPath);
    } else if (bundledHash !== manifestHash) {
      stale.push(relPath);
    }
  }

  // Check for removed files (in manifest but not in bundled)
  const bundledSet = new Set(bundledFiles);
  for (const relPath of Object.keys(manifest.files)) {
    if (!bundledSet.has(relPath)) {
      removed.push(relPath);
    }
  }

  // Check installed files for local modifications
  for (const relPath of Object.keys(manifest.files)) {
    const installedPath = path.join(targetDir, relPath);
    if (!fs.existsSync(installedPath)) continue;
    const installedHash = hashFile(installedPath);
    if (installedHash !== manifest.files[relPath]) {
      modified.push(relPath);
    }
  }

  const upToDate = stale.length === 0 && added.length === 0 && removed.length === 0;
  const data = {
    status: upToDate ? "up-to-date" : "updates-available",
    installedVersion: manifest.version,
    bundledVersion: VERSION,
    stale,
    added,
    removed,
    modified,
  };

  printResult(data, values.json!, () => {
    const lines = [formatHeader("medical-protocol plugin status")];
    lines.push(
      formatTable([
        ["Installed version", `v${manifest.version}`],
        ["Bundled version", `v${VERSION}`],
        ["Status", upToDate ? "Up-to-date" : "Updates available"],
      ]),
    );

    if (stale.length > 0) {
      lines.push(`\n  Stale (${stale.length}):`);
      for (const f of stale) lines.push(`    ${f}`);
    }
    if (added.length > 0) {
      lines.push(`\n  New files (${added.length}):`);
      for (const f of added) lines.push(`    ${f}`);
    }
    if (removed.length > 0) {
      lines.push(`\n  Removed upstream (${removed.length}):`);
      for (const f of removed) lines.push(`    ${f}`);
    }
    if (modified.length > 0) {
      lines.push(`\n  Locally modified (${modified.length}):`);
      for (const f of modified) lines.push(`    ${f}`);
    }

    lines.push("");
    return lines.join("\n");
  });

  if (!upToDate) {
    process.exitCode = 1;
  }
}
