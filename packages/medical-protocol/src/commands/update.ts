import * as p from "@clack/prompts";
import pc from "picocolors";
import { execSync } from "child_process";
import { version as VERSION } from "../../package.json";
import { getBundledPluginDir, getSkillsDir, getHooksDir, getSettingsPath, listFiles, copyFile } from "../files";
import { hashFile, readManifest, writeManifest, type FileManifest } from "../manifest";
import { formatError, printResult, formatHeader, formatTable } from "../../../../lib/format";
import { isInteractive, confirmOverwriteModified } from "../prompts";
import * as fs from "fs";
import * as path from "path";

interface UpdateOptions {
  dir: string;
  force?: boolean;
  json?: boolean;
  yes?: boolean;
}

export async function run(opts: UpdateOptions): Promise<void> {
  const baseDir = opts.dir;
  const skillsDir = getSkillsDir(baseDir);

  // Check for link-mode manifest in .claude/ dir
  const linkManifest = readManifest(path.join(baseDir, ".claude"));
  if (linkManifest?.mode === "link") {
    if (isInteractive(opts)) {
      await updateLinkedInteractive(baseDir, linkManifest);
    } else {
      updateLinked(baseDir, linkManifest, !!opts.json);
    }
    return;
  }

  // Fall back to copy-mode manifest in skills dir
  const manifest = readManifest(skillsDir);
  if (!manifest) {
    if (isInteractive(opts)) {
      p.log.error("Not installed. Run 'medical-protocol install' first.");
    } else {
      process.stderr.write(formatError("Not installed. Run 'medical-protocol install' first.") + "\n");
    }
    process.exitCode = 1;
    return;
  }

  if (isInteractive(opts)) {
    await updateCopyInteractive(baseDir, manifest, !!opts.force);
  } else {
    updateCopy(baseDir, manifest, !!opts.force, !!opts.json);
  }
}

async function updateLinkedInteractive(baseDir: string, manifest: FileManifest): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" medical-protocol ")));

  const sourcePath = manifest.sourcePath!;

  if (!fs.existsSync(path.join(sourcePath, ".git"))) {
    p.log.error(`Source repo not found at ${sourcePath}`);
    p.outro(pc.red("Update failed"));
    process.exitCode = 1;
    return;
  }

  const s = p.spinner();
  s.start("Pulling latest changes...");

  let pullOutput: string;
  let pullFailed = false;
  try {
    pullOutput = execSync("git pull --ff-only", { cwd: sourcePath, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    pullOutput = "Pull skipped (working tree has local changes)";
    pullFailed = true;
  }

  const alreadyUpToDate = !pullFailed && pullOutput.includes("Already up to date");

  // Re-merge hooks.json and settings.json
  const pluginDir = path.join(sourcePath, "plugin");
  const hooksDir = getHooksDir(baseDir);
  const sourceHooksJson = path.join(pluginDir, "hooks", "hooks.json");
  if (fs.existsSync(sourceHooksJson)) {
    mergeHooksJson(path.join(hooksDir, "hooks.json"), sourceHooksJson);
  }

  const bundledSettingsPath = path.join(pluginDir, "settings.json");
  if (fs.existsSync(bundledSettingsPath)) {
    mergeSettings(getSettingsPath(baseDir), bundledSettingsPath);
  }

  // Update manifest timestamp
  const newManifest: FileManifest = {
    ...manifest,
    installedAt: new Date().toISOString(),
  };
  writeManifest(path.join(baseDir, ".claude"), newManifest);

  if (pullFailed) {
    s.stop(pc.yellow("Pull skipped (local changes in repo)"));
  } else if (alreadyUpToDate) {
    s.stop(pc.green("Already up-to-date"));
  } else {
    s.stop(pc.green("Updated via git pull"));
  }

  p.outro(alreadyUpToDate ? pc.green("All good") : "Done");
}

async function updateCopyInteractive(baseDir: string, manifest: FileManifest, force: boolean): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" medical-protocol ")));

  const s = p.spinner();
  s.start("Checking for updates...");

  const skillsDir = getSkillsDir(baseDir);
  const hooksDir = getHooksDir(baseDir);
  const bundledDir = getBundledPluginDir();
  const bundledSkillsDir = path.join(bundledDir, "skills");
  const bundledHooksDir = path.join(bundledDir, "hooks");

  // First pass: gather what needs updating
  const updated: string[] = [];
  const skipped: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  const newHashes: Record<string, string> = {};

  if (fs.existsSync(bundledSkillsDir)) {
    processDir(bundledSkillsDir, skillsDir, "skills", manifest, force, newHashes, updated, skipped, added);
  }
  if (fs.existsSync(bundledHooksDir)) {
    processDir(bundledHooksDir, hooksDir, "hooks", manifest, force, newHashes, updated, skipped, added);
  }

  // If there are skipped (modified) files and not forcing, prompt
  if (skipped.length > 0 && !force) {
    s.stop(pc.yellow(`${skipped.length} locally modified file(s) found`));
    const overwrite = await confirmOverwriteModified(skipped);
    if (overwrite) {
      // Re-process with force for the skipped files
      const s2 = p.spinner();
      s2.start("Overwriting modified files...");
      for (const key of [...skipped]) {
        const [prefix, ...rest] = key.split("/");
        const relPath = rest.join("/");
        const bundledBase = prefix === "skills" ? bundledSkillsDir : bundledHooksDir;
        const installedBase = prefix === "skills" ? skillsDir : hooksDir;
        const bundledPath = path.join(bundledBase, relPath);
        const installedPath = path.join(installedBase, relPath);
        const bundledHash = hashFile(bundledPath);
        copyFile(bundledPath, installedPath);
        newHashes[key] = bundledHash;
        updated.push(key);
      }
      // Clear skipped since we overwrote them
      skipped.length = 0;
      s2.stop(pc.green("Modified files overwritten"));
    }
  } else if (skipped.length === 0) {
    // No issues
  }

  // Handle removed files
  const bundledKeys = new Set(Object.keys(newHashes));
  for (const key of Object.keys(manifest.files)) {
    if (bundledKeys.has(key)) continue;
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
    mode: "copy",
  };
  writeManifest(skillsDir, newManifest);

  const bundledSettingsPath = path.join(bundledDir, "settings.json");
  if (fs.existsSync(bundledSettingsPath)) {
    mergeSettings(getSettingsPath(baseDir), bundledSettingsPath);
  }

  const totalChanged = updated.length + added.length + removed.length;

  // Stop spinner if it's still running (no modified files case)
  if (skipped.length === 0 && totalChanged === 0) {
    s.stop(pc.green("Already up-to-date"));
  } else if (totalChanged > 0 && skipped.length === 0) {
    s.stop(pc.green(`${totalChanged} file(s) updated`));
  }

  if (updated.length > 0) p.log.success(`Updated: ${updated.length} file(s)`);
  if (added.length > 0) p.log.success(`Added: ${added.length} file(s)`);
  if (removed.length > 0) p.log.info(`Removed: ${removed.length} file(s)`);
  if (skipped.length > 0) p.log.warn(`Skipped: ${skipped.length} locally modified file(s)`);

  p.outro(`Done! Plugin v${VERSION}`);
}

function updateLinked(baseDir: string, manifest: FileManifest, json: boolean): void {
  const sourcePath = manifest.sourcePath!;

  if (!fs.existsSync(path.join(sourcePath, ".git"))) {
    process.stderr.write(formatError(`Source repo not found at ${sourcePath}`) + "\n");
    process.exitCode = 1;
    return;
  }

  // Git pull in source repo
  let pullOutput: string;
  let pullFailed = false;
  try {
    pullOutput = execSync("git pull --ff-only", { cwd: sourcePath, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    pullOutput = "Pull skipped (working tree has local changes)";
    pullFailed = true;
  }

  const alreadyUpToDate = !pullFailed && pullOutput.includes("Already up to date");

  // Re-merge hooks.json and settings.json
  const pluginDir = path.join(sourcePath, "plugin");
  const hooksDir = getHooksDir(baseDir);
  const sourceHooksJson = path.join(pluginDir, "hooks", "hooks.json");
  if (fs.existsSync(sourceHooksJson)) {
    mergeHooksJson(path.join(hooksDir, "hooks.json"), sourceHooksJson);
  }

  const bundledSettingsPath = path.join(pluginDir, "settings.json");
  if (fs.existsSync(bundledSettingsPath)) {
    mergeSettings(getSettingsPath(baseDir), bundledSettingsPath);
  }

  // Update manifest timestamp
  const newManifest: FileManifest = {
    ...manifest,
    installedAt: new Date().toISOString(),
  };
  writeManifest(path.join(baseDir, ".claude"), newManifest);

  const statusText = pullFailed ? "pull-skipped" : alreadyUpToDate ? "up-to-date" : "updated";
  const data = {
    status: statusText,
    mode: "link",
    sourcePath,
    pullOutput,
  };

  const statusLabel = pullFailed
    ? "Pull skipped (local changes)"
    : alreadyUpToDate
      ? "Already up-to-date"
      : "Updated via git pull";

  printResult(data, json, () =>
    [
      formatHeader("medical-protocol update (linked)"),
      formatTable([
        ["Mode", "symlink"],
        ["Source", sourcePath],
        ["Status", statusLabel],
      ]),
      !alreadyUpToDate && !pullFailed ? `\n  ${pullOutput}` : "",
      "",
    ].join("\n"),
  );
}

function updateCopy(baseDir: string, manifest: FileManifest, force: boolean, json: boolean): void {
  const skillsDir = getSkillsDir(baseDir);
  const hooksDir = getHooksDir(baseDir);
  const bundledDir = getBundledPluginDir();

  const bundledSkillsDir = path.join(bundledDir, "skills");
  const bundledHooksDir = path.join(bundledDir, "hooks");

  const updated: string[] = [];
  const skipped: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  const newHashes: Record<string, string> = {};

  if (fs.existsSync(bundledSkillsDir)) {
    processDir(bundledSkillsDir, skillsDir, "skills", manifest, force, newHashes, updated, skipped, added);
  }

  if (fs.existsSync(bundledHooksDir)) {
    processDir(bundledHooksDir, hooksDir, "hooks", manifest, force, newHashes, updated, skipped, added);
  }

  const bundledKeys = new Set(Object.keys(newHashes));
  for (const key of Object.keys(manifest.files)) {
    if (bundledKeys.has(key)) continue;
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
    mode: "copy",
  };
  writeManifest(skillsDir, newManifest);

  const bundledSettingsPath = path.join(bundledDir, "settings.json");
  if (fs.existsSync(bundledSettingsPath)) {
    mergeSettings(getSettingsPath(baseDir), bundledSettingsPath);
  }

  const totalChanged = updated.length + added.length + removed.length;
  const data = {
    status: totalChanged === 0 && skipped.length === 0 ? "up-to-date" : "updated",
    mode: "copy",
    version: VERSION,
    updated,
    added,
    removed,
    skipped,
  };

  printResult(data, json, () => {
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

function mergeHooksJson(targetPath: string, sourcePath: string): void {
  let existing: Record<string, unknown> = {};
  if (fs.existsSync(targetPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
    } catch {
      existing = {};
    }
  }

  const source: Record<string, unknown> = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));

  for (const [event, hooks] of Object.entries(source)) {
    if (!Array.isArray(hooks)) continue;
    const existingHooks = (existing[event] ?? []) as Array<Record<string, unknown>>;
    for (const hook of hooks) {
      const hookObj = hook as Record<string, unknown>;
      const exists = existingHooks.some(
        (h) => h.command === hookObj.command,
      );
      if (!exists) {
        existingHooks.push(hookObj);
      }
    }
    existing[event] = existingHooks;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(existing, null, 2) + "\n");
}
