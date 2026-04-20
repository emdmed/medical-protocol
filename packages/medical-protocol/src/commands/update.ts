import { parseArgs } from "util";
import { version as VERSION } from "../../package.json";
import { getBundledPluginDir, getTargetDir, listFiles, copyFile } from "../files";
import { hashFile, readManifest, writeManifest, type FileManifest } from "../manifest";
import { formatError, printResult, formatHeader, formatTable } from "../../../../lib/format";
import * as fs from "fs";
import * as path from "path";

export function run(argv: string[]): void {
  const { values } = parseArgs({
    args: argv,
    options: {
      dir: { type: "string", default: process.cwd() },
      force: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(
      `Usage: medical-protocol update [--dir <path>] [--force] [--json]\n\n` +
        `Update the plugin to the latest bundled version.\n\n` +
        `Options:\n` +
        `  --dir <path>   Target project directory (default: cwd)\n` +
        `  --force        Overwrite locally modified files\n` +
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
  const updated: string[] = [];
  const skipped: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  const newHashes: Record<string, string> = {};

  for (const relPath of bundledFiles) {
    const bundledPath = path.join(bundledDir, relPath);
    const installedPath = path.join(targetDir, relPath);
    const bundledHash = hashFile(bundledPath);
    const manifestHash = manifest.files[relPath];

    // New file not in manifest
    if (!manifestHash) {
      copyFile(bundledPath, installedPath);
      newHashes[relPath] = bundledHash;
      added.push(relPath);
      continue;
    }

    // File unchanged from bundled perspective
    if (bundledHash === manifestHash) {
      newHashes[relPath] = manifestHash;
      continue;
    }

    // Bundled file changed — check for local modifications
    if (fs.existsSync(installedPath)) {
      const installedHash = hashFile(installedPath);
      if (installedHash !== manifestHash && !values.force) {
        // Locally modified — skip unless forced
        skipped.push(relPath);
        newHashes[relPath] = manifest.files[relPath]; // keep old hash
        continue;
      }
    }

    copyFile(bundledPath, installedPath);
    newHashes[relPath] = bundledHash;
    updated.push(relPath);
  }

  // Remove files that no longer exist in bundled
  const bundledSet = new Set(bundledFiles);
  for (const relPath of Object.keys(manifest.files)) {
    if (!bundledSet.has(relPath)) {
      const installedPath = path.join(targetDir, relPath);
      if (fs.existsSync(installedPath)) {
        fs.unlinkSync(installedPath);
      }
      removed.push(relPath);
    }
  }

  const newManifest: FileManifest = {
    version: VERSION,
    installedAt: new Date().toISOString(),
    files: newHashes,
  };
  writeManifest(targetDir, newManifest);

  // Ensure plugin is registered in .claude/settings.json
  const settingsPath = path.join(values.dir!, ".claude", "settings.json");
  registerPlugin(settingsPath);

  const totalChanged = updated.length + added.length + removed.length;
  const data = {
    status: totalChanged === 0 && skipped.length === 0 ? "up-to-date" : "updated",
    version: VERSION,
    updated,
    added,
    removed,
    skipped,
  };

  printResult(data, values.json!, () => {
    const lines = [formatHeader("medical-protocol plugin update")];
    lines.push(
      formatTable([
        ["Version", `v${VERSION}`],
        ["Updated", `${updated.length}`],
        ["Added", `${added.length}`],
        ["Removed", `${removed.length}`],
        ["Skipped", `${skipped.length} (locally modified)`],
      ]),
    );

    if (skipped.length > 0) {
      lines.push(`\n  Skipped files (use --force to overwrite):`);
      for (const f of skipped) lines.push(`    ${f}`);
    }

    lines.push("");
    return lines.join("\n");
  });
}

const PLUGIN_KEY = "medical-protocol@medical-protocol";

function registerPlugin(settingsPath: string): void {
  let settings: Record<string, unknown> = {};

  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    } catch {
      settings = {};
    }
  }

  const enabled = (settings.enabledPlugins ?? {}) as Record<string, boolean>;
  if (enabled[PLUGIN_KEY]) return;

  enabled[PLUGIN_KEY] = true;
  settings.enabledPlugins = enabled;

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}
