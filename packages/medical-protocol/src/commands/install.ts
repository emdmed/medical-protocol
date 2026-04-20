import { parseArgs } from "util";
import { version as VERSION } from "../../package.json";
import { getBundledPluginDir, getSkillsDir, getHooksDir, getSettingsPath, listFiles, copyFile, getGlobalPluginCacheDir, getInstalledPluginsPath } from "../files";
import { hashFile, writeManifest, type FileManifest } from "../manifest";
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
      `Usage: medical-protocol install [--dir <path>] [--force] [--json]\n\n` +
        `Install the medical-protocol skills into your project.\n\n` +
        `Options:\n` +
        `  --dir <path>   Target project directory (default: cwd)\n` +
        `  --force        Overwrite existing installation\n` +
        `  --json         Output as JSON\n`,
    );
    return;
  }

  const baseDir = values.dir!;
  const skillsDir = getSkillsDir(baseDir);
  const hooksDir = getHooksDir(baseDir);
  const bundledDir = getBundledPluginDir();

  if (!fs.existsSync(bundledDir)) {
    process.stderr.write(formatError("Bundled plugin directory not found. Package may be corrupted.") + "\n");
    process.exitCode = 1;
    return;
  }

  const manifestPath = path.join(skillsDir, ".manifest.json");
  if (fs.existsSync(manifestPath) && !values.force) {
    process.stderr.write(
      formatError(`Skills already installed at ${skillsDir}\nUse --force to overwrite, or use 'update' to update changed files.`) + "\n",
    );
    process.exitCode = 1;
    return;
  }

  const bundledSkillsDir = path.join(bundledDir, "skills");
  const bundledHooksDir = path.join(bundledDir, "hooks");
  const bundledSettingsPath = path.join(bundledDir, "settings.json");

  const fileHashes: Record<string, string> = {};
  let totalFiles = 0;

  // Copy skills
  if (fs.existsSync(bundledSkillsDir)) {
    const skillFiles = listFiles(bundledSkillsDir);
    for (const relPath of skillFiles) {
      const src = path.join(bundledSkillsDir, relPath);
      const dest = path.join(skillsDir, relPath);
      copyFile(src, dest);
      const key = `skills/${relPath}`;
      fileHashes[key] = hashFile(src);
      totalFiles++;
    }
  }

  // Copy hooks
  if (fs.existsSync(bundledHooksDir)) {
    const hookFiles = listFiles(bundledHooksDir);
    for (const relPath of hookFiles) {
      const src = path.join(bundledHooksDir, relPath);
      const dest = path.join(hooksDir, relPath);
      copyFile(src, dest);
      const key = `hooks/${relPath}`;
      fileHashes[key] = hashFile(src);
      totalFiles++;
    }
  }

  // Merge permissions into settings.json (don't overwrite existing settings)
  if (fs.existsSync(bundledSettingsPath)) {
    mergeSettings(getSettingsPath(baseDir), bundledSettingsPath);
  }

  const manifest: FileManifest = {
    version: VERSION,
    installedAt: new Date().toISOString(),
    files: fileHashes,
  };
  writeManifest(skillsDir, manifest);

  // Sync global plugin cache
  const cacheDir = getGlobalPluginCacheDir(VERSION);
  syncGlobalCache(bundledDir, cacheDir, VERSION);
  updateInstalledPlugins(path.resolve(baseDir), VERSION, cacheDir);

  const data = {
    status: "installed",
    version: VERSION,
    filesInstalled: totalFiles,
    skillsDir,
    hooksDir,
    globalCache: cacheDir,
  };

  printResult(data, values.json!, () =>
    [
      formatHeader("medical-protocol installed"),
      formatTable([
        ["Version", `v${VERSION}`],
        ["Files", `${totalFiles}`],
        ["Skills", skillsDir],
        ["Hooks", hooksDir],
        ["Global cache", cacheDir],
      ]),
      "",
    ].join("\n"),
  );
}

function syncGlobalCache(bundledDir: string, cacheDir: string, version: string): void {
  // Copy plugin contents (skills, hooks, context, reference, settings.json) to global cache
  const dirsToSync = ["skills", "hooks", "context", "reference"];
  for (const dir of dirsToSync) {
    const srcDir = path.join(bundledDir, dir);
    if (!fs.existsSync(srcDir)) continue;
    const files = listFiles(srcDir);
    for (const relPath of files) {
      copyFile(path.join(srcDir, relPath), path.join(cacheDir, dir, relPath));
    }
  }

  // Copy settings.json
  const settingsSrc = path.join(bundledDir, "settings.json");
  if (fs.existsSync(settingsSrc)) {
    copyFile(settingsSrc, path.join(cacheDir, "settings.json"));
  }

  // Write .claude-plugin/plugin.json
  const pluginJsonDir = path.join(cacheDir, ".claude-plugin");
  fs.mkdirSync(pluginJsonDir, { recursive: true });
  const pluginJson = {
    name: "medical-protocol",
    version,
    description: "Medical protocol plugin for Claude Code — clinical interface builder with safety hooks for healthcare professionals. Use /medical-protocol:start to begin.",
    author: { name: "Medical Protocol Team" },
    homepage: "https://github.com/emdmed/medical-protocol",
    skills: "./skills",
  };
  fs.writeFileSync(path.join(pluginJsonDir, "plugin.json"), JSON.stringify(pluginJson, null, 2) + "\n");
}

function updateInstalledPlugins(projectPath: string, version: string, installPath: string): void {
  const pluginsPath = getInstalledPluginsPath();
  let data: { version: number; plugins: Record<string, Array<Record<string, unknown>>> } = { version: 2, plugins: {} };
  if (fs.existsSync(pluginsPath)) {
    try {
      data = JSON.parse(fs.readFileSync(pluginsPath, "utf-8"));
    } catch {
      data = { version: 2, plugins: {} };
    }
  }

  const key = "medical-protocol@medical-protocol";
  const entries = (data.plugins[key] ?? []) as Array<Record<string, unknown>>;
  const now = new Date().toISOString();

  const idx = entries.findIndex(e => e.projectPath === projectPath);
  const entry = {
    scope: "project",
    projectPath,
    installPath,
    version,
    installedAt: idx >= 0 ? entries[idx].installedAt : now,
    lastUpdated: now,
  };

  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);

  data.plugins[key] = entries;
  fs.mkdirSync(path.dirname(pluginsPath), { recursive: true });
  fs.writeFileSync(pluginsPath, JSON.stringify(data, null, 2) + "\n");
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

  // Merge allow/deny lists (add bundled entries that aren't already present)
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
