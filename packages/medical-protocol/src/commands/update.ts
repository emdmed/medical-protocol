import { parseArgs } from "util";
import { version as VERSION } from "../../package.json";
import { getBundledPluginDir, getSkillsDir, getHooksDir, getSettingsPath, listFiles, copyFile } from "../files";
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
        `Update skills to the latest bundled version.\n\n` +
        `Options:\n` +
        `  --dir <path>   Target project directory (default: cwd)\n` +
        `  --force        Overwrite locally modified files\n` +
        `  --json         Output as JSON\n`,
    );
    return;
  }

  const baseDir = values.dir!;
  const skillsDir = getSkillsDir(baseDir);
  const hooksDir = getHooksDir(baseDir);
  const bundledDir = getBundledPluginDir();

  const manifest = readManifest(skillsDir);
  if (!manifest) {
    process.stderr.write(formatError("Not installed. Run 'medical-protocol install' first.") + "\n");
    process.exitCode = 1;
    return;
  }

  const bundledSkillsDir = path.join(bundledDir, "skills");
  const bundledHooksDir = path.join(bundledDir, "hooks");

  const updated: string[] = [];
  const skipped: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  const newHashes: Record<string, string> = {};

  // Process skills
  if (fs.existsSync(bundledSkillsDir)) {
    processDir(bundledSkillsDir, skillsDir, "skills", manifest, values.force!, newHashes, updated, skipped, added);
  }

  // Process hooks
  if (fs.existsSync(bundledHooksDir)) {
    processDir(bundledHooksDir, hooksDir, "hooks", manifest, values.force!, newHashes, updated, skipped, added);
  }

  // Remove files that no longer exist in bundled
  const bundledKeys = new Set(Object.keys(newHashes));
  for (const key of Object.keys(manifest.files)) {
    if (bundledKeys.has(key)) continue;
    // Determine installed path from key
    const installedPath = resolveInstalledPath(baseDir, key);
    if (installedPath && fs.existsSync(installedPath)) {
      fs.unlinkSync(installedPath);
    }
    removed.push(key);
  }

  const newManifest: FileManifest = {
    version: VERSION,
    installedAt: new Date().toISOString(),
    files: newHashes,
  };
  writeManifest(skillsDir, newManifest);

  // Re-merge settings
  const bundledSettingsPath = path.join(bundledDir, "settings.json");
  if (fs.existsSync(bundledSettingsPath)) {
    mergeSettings(getSettingsPath(baseDir), bundledSettingsPath);
  }

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
    const lines = [formatHeader("medical-protocol update")];
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

function processDir(
  bundledBase: string,
  installedBase: string,
  prefix: string,
  manifest: FileManifest,
  force: boolean,
  newHashes: Record<string, string>,
  updated: string[],
  skipped: string[],
  added: string[],
): void {
  const files = listFiles(bundledBase);
  for (const relPath of files) {
    const key = `${prefix}/${relPath}`;
    const bundledPath = path.join(bundledBase, relPath);
    const installedPath = path.join(installedBase, relPath);
    const bundledHash = hashFile(bundledPath);
    const manifestHash = manifest.files[key];

    if (!manifestHash) {
      copyFile(bundledPath, installedPath);
      newHashes[key] = bundledHash;
      added.push(key);
      continue;
    }

    if (bundledHash === manifestHash) {
      newHashes[key] = manifestHash;
      continue;
    }

    if (fs.existsSync(installedPath)) {
      const installedHash = hashFile(installedPath);
      if (installedHash !== manifestHash && !force) {
        skipped.push(key);
        newHashes[key] = manifest.files[key];
        continue;
      }
    }

    copyFile(bundledPath, installedPath);
    newHashes[key] = bundledHash;
    updated.push(key);
  }
}

function resolveInstalledPath(baseDir: string, key: string): string | null {
  if (key.startsWith("skills/")) {
    return path.join(getSkillsDir(baseDir), key.slice("skills/".length));
  }
  if (key.startsWith("hooks/")) {
    return path.join(getHooksDir(baseDir), key.slice("hooks/".length));
  }
  return null;
}

function mergeSettings(targetPath: string, bundledPath: string): void {
  let existing: Record<string, unknown> = {};
  if (fs.existsSync(targetPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
    } catch {
      existing = {};
    }
  }

  const bundled: Record<string, unknown> = JSON.parse(fs.readFileSync(bundledPath, "utf-8"));
  const bundledPerms = (bundled.permissions ?? {}) as Record<string, string[]>;
  const existingPerms = (existing.permissions ?? {}) as Record<string, string[]>;

  for (const key of ["allow", "deny"] as const) {
    const bundledList = bundledPerms[key] ?? [];
    const existingList = existingPerms[key] ?? [];
    const existingSet = new Set(existingList);
    const merged = [...existingList];
    for (const entry of bundledList) {
      if (!existingSet.has(entry)) {
        merged.push(entry);
      }
    }
    if (merged.length > 0) {
      if (!existingPerms[key]) existingPerms[key] = [];
      existingPerms[key] = merged;
    }
  }

  existing.permissions = existingPerms;
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(existing, null, 2) + "\n");
}
