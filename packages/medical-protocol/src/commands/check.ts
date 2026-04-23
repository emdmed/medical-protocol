import * as p from "@clack/prompts";
import pc from "picocolors";
import { version as VERSION } from "../../package.json";
import { getBundledPluginDir, getSkillsDir, getHooksDir, listFiles, isSymlink, getRepoStatus } from "../files";
import { hashFile, readManifest } from "../manifest";
import { formatError, printResult, formatHeader, formatTable } from "../../../../lib/format";
import { isInteractive } from "../prompts";
import * as fs from "fs";
import * as path from "path";

interface CheckOptions {
  dir: string;
  json?: boolean;
  yes?: boolean;
}

export async function run(opts: CheckOptions): Promise<void> {
  const baseDir = opts.dir;
  const skillsDir = getSkillsDir(baseDir);

  // Check for link-mode manifest in .claude/ dir
  const linkManifest = readManifest(path.join(baseDir, ".claude"));
  if (linkManifest?.mode === "link") {
    if (isInteractive(opts)) {
      await checkLinkedInteractive(baseDir, linkManifest);
    } else {
      checkLinked(baseDir, linkManifest, !!opts.json);
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
    await checkCopyInteractive(baseDir, manifest);
  } else {
    checkCopy(baseDir, manifest, !!opts.json);
  }
}

async function checkLinkedInteractive(baseDir: string, manifest: import("../manifest").FileManifest): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" medical-protocol ")));

  const s = p.spinner();
  s.start("Checking plugin status...");

  const { issues, repoStatus } = gatherLinkedStatus(baseDir, manifest);
  const healthy = issues.length === 0;

  if (healthy) {
    s.stop(pc.green("Plugin is healthy"));
  } else {
    s.stop(pc.yellow(`${issues.length} issue(s) found`));
  }

  p.log.info(`Version: v${manifest.version} | Mode: symlink`);

  if (repoStatus) {
    p.log.info(`Branch: ${repoStatus.branch} | Ahead: ${repoStatus.ahead} | Behind: ${repoStatus.behind}`);
    if (repoStatus.behind > 0) {
      p.log.warn(`Behind by ${repoStatus.behind} commits — run 'medical-protocol update' to pull latest.`);
    }
  }

  if (issues.length > 0) {
    for (const issue of issues) {
      p.log.warn(issue);
    }
  }

  p.outro(healthy ? pc.green("All good") : pc.yellow("Issues need attention"));

  if (!healthy) {
    process.exitCode = 1;
  }
}

async function checkCopyInteractive(baseDir: string, manifest: import("../manifest").FileManifest): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" medical-protocol ")));

  const s = p.spinner();
  s.start("Checking plugin status...");

  const { stale, added, removed, modified, upToDate } = gatherCopyStatus(baseDir, manifest);

  if (upToDate) {
    s.stop(pc.green("Plugin is up-to-date"));
  } else {
    s.stop(pc.yellow("Updates available"));
  }

  p.log.info(`Installed: v${manifest.version} | Bundled: v${VERSION}`);

  if (stale.length > 0) p.log.warn(`Stale: ${stale.length} file(s)`);
  if (added.length > 0) p.log.info(`New: ${added.length} file(s)`);
  if (removed.length > 0) p.log.info(`Removed upstream: ${removed.length} file(s)`);
  if (modified.length > 0) p.log.warn(`Locally modified: ${modified.length} file(s)`);

  p.outro(upToDate ? pc.green("All good") : pc.yellow("Run 'medical-protocol update' to update"));

  if (!upToDate) {
    process.exitCode = 1;
  }
}

function gatherLinkedStatus(baseDir: string, manifest: import("../manifest").FileManifest) {
  const skillsDir = getSkillsDir(baseDir);
  const hooksDir = getHooksDir(baseDir);
  const sourcePath = manifest.sourcePath!;
  const issues: string[] = [];

  if (!fs.existsSync(skillsDir)) {
    issues.push("Skills directory missing");
  } else if (!isSymlink(skillsDir)) {
    issues.push("Skills directory is not a symlink (expected linked mode)");
  } else {
    const target = fs.readlinkSync(skillsDir);
    if (!fs.existsSync(target)) {
      issues.push(`Skills symlink target missing: ${target}`);
    }
  }

  if (fs.existsSync(hooksDir)) {
    const entries = fs.readdirSync(hooksDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "hooks.json") continue;
      const fullPath = path.join(hooksDir, entry.name);
      if (isSymlink(fullPath)) {
        const target = fs.readlinkSync(fullPath);
        if (!fs.existsSync(target)) {
          issues.push(`Broken hook symlink: ${entry.name} -> ${target}`);
        }
      }
    }
  }

  let repoStatus: { branch: string; ahead: number; behind: number } | null = null;
  if (fs.existsSync(path.join(sourcePath, ".git"))) {
    try {
      repoStatus = getRepoStatus(sourcePath);
    } catch {
      issues.push("Could not read source repo status");
    }
  } else {
    issues.push(`Source repo not found at ${sourcePath}`);
  }

  return { issues, repoStatus };
}

function gatherCopyStatus(baseDir: string, manifest: import("../manifest").FileManifest) {
  const skillsDir = getSkillsDir(baseDir);
  const bundledDir = getBundledPluginDir();
  const bundledSkillsDir = path.join(bundledDir, "skills");
  const bundledHooksDir = path.join(bundledDir, "hooks");

  const stale: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];

  const allBundledKeys = new Set<string>();

  for (const [prefix, bundledBase] of [
    ["skills", bundledSkillsDir],
    ["hooks", bundledHooksDir],
  ] as const) {
    if (!fs.existsSync(bundledBase)) continue;
    const files = listFiles(bundledBase);
    for (const relPath of files) {
      const key = `${prefix}/${relPath}`;
      allBundledKeys.add(key);
      const bundledHash = hashFile(path.join(bundledBase, relPath));
      const manifestHash = manifest.files[key];

      if (!manifestHash) {
        added.push(key);
      } else if (bundledHash !== manifestHash) {
        stale.push(key);
      }
    }
  }

  for (const key of Object.keys(manifest.files)) {
    if (!allBundledKeys.has(key)) {
      removed.push(key);
    }
  }

  for (const key of Object.keys(manifest.files)) {
    const installedPath = resolveInstalledPath(baseDir, key);
    if (!installedPath || !fs.existsSync(installedPath)) continue;
    const installedHash = hashFile(installedPath);
    if (installedHash !== manifest.files[key]) {
      modified.push(key);
    }
  }

  const upToDate = stale.length === 0 && added.length === 0 && removed.length === 0;

  return { stale, added, removed, modified, upToDate };
}

function checkLinked(baseDir: string, manifest: import("../manifest").FileManifest, json: boolean): void {
  const sourcePath = manifest.sourcePath!;
  const { issues, repoStatus } = gatherLinkedStatus(baseDir, manifest);
  const healthy = issues.length === 0;

  const data = {
    status: healthy ? "healthy" : "issues-found",
    mode: "link",
    installedVersion: manifest.version,
    bundledVersion: VERSION,
    sourcePath,
    repoStatus,
    issues,
  };

  printResult(data, json, () => {
    const lines = [formatHeader("medical-protocol status (linked)")];
    lines.push(
      formatTable([
        ["Installed version", `v${manifest.version}`],
        ["Bundled version", `v${VERSION}`],
        ["Mode", "symlink"],
        ["Source", sourcePath],
        ["Status", healthy ? "Healthy" : `${issues.length} issue(s)`],
      ]),
    );

    if (repoStatus) {
      lines.push(
        formatTable([
          ["Branch", repoStatus.branch],
          ["Ahead", `${repoStatus.ahead}`],
          ["Behind", `${repoStatus.behind}`],
        ]),
      );
      if (repoStatus.behind > 0) {
        lines.push(`\n  Run 'medical-protocol update --dir ${path.resolve(baseDir)}' to pull latest changes.`);
      }
    }

    if (issues.length > 0) {
      lines.push(`\n  Issues:`);
      for (const issue of issues) lines.push(`    - ${issue}`);
    }

    lines.push("");
    return lines.join("\n");
  });

  if (!healthy) {
    process.exitCode = 1;
  }
}

function checkCopy(baseDir: string, manifest: import("../manifest").FileManifest, json: boolean): void {
  const { stale, added, removed, modified, upToDate } = gatherCopyStatus(baseDir, manifest);

  const data = {
    status: upToDate ? "up-to-date" : "updates-available",
    mode: "copy",
    installedVersion: manifest.version,
    bundledVersion: VERSION,
    stale,
    added,
    removed,
    modified,
  };

  printResult(data, json, () => {
    const lines = [formatHeader("medical-protocol status")];
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

function resolveInstalledPath(baseDir: string, key: string): string | null {
  if (key.startsWith("skills/")) {
    return path.join(getSkillsDir(baseDir), key.slice("skills/".length));
  }
  if (key.startsWith("hooks/")) {
    return path.join(getHooksDir(baseDir), key.slice("hooks/".length));
  }
  return null;
}
