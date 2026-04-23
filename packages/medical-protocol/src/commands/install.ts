import { version as VERSION } from "../../package.json";
import {
  getBundledPluginDir,
  getSkillsDir,
  getHooksDir,
  getSettingsPath,
  listFiles,
  copyFile,
  getGlobalPluginCacheDir,
  getInstalledPluginsPath,
  getDefaultSourceDir,
  symlinkDir,
  symlinkFile,
  cloneOrPullRepo,
} from "../files";
import { hashFile, writeManifest, type FileManifest } from "../manifest";
import { formatError, printResult, formatHeader, formatTable } from "../../../../lib/format";
import * as fs from "fs";
import * as path from "path";

interface InstallOptions {
  dir: string;
  force?: boolean;
  link?: boolean;
  source?: string;
  json?: boolean;
}

export function run(opts: InstallOptions): void {
  const useLink = opts.link || !!opts.source;
  const baseDir = opts.dir;
  const skillsDir = getSkillsDir(baseDir);

  const manifestPath = path.join(skillsDir, ".manifest.json");
  if (fs.existsSync(manifestPath) && !opts.force) {
    process.stderr.write(
      formatError(`Skills already installed at ${skillsDir}\nUse --force to overwrite, or use 'update' to update changed files.`) + "\n",
    );
    process.exitCode = 1;
    return;
  }

  if (useLink) {
    installLinked(baseDir, opts.source, !!opts.force, !!opts.json);
  } else {
    installCopy(baseDir, !!opts.force, !!opts.json);
  }
}

function installLinked(baseDir: string, sourcePath: string | undefined, force: boolean, json: boolean): void {
  const sourceDir = sourcePath ?? getDefaultSourceDir();
  const skillsDir = getSkillsDir(baseDir);
  const hooksDir = getHooksDir(baseDir);

  // Clone or pull the source repo
  let repoAction: string;
  try {
    const result = cloneOrPullRepo(sourceDir);
    repoAction = result.cloned ? "cloned" : "updated";
  } catch (e) {
    process.stderr.write(formatError((e as Error).message) + "\n");
    process.exitCode = 1;
    return;
  }

  const pluginDir = path.join(sourceDir, "plugin");
  if (!fs.existsSync(pluginDir)) {
    process.stderr.write(formatError(`Plugin directory not found at ${pluginDir}. Is this the right repo?`) + "\n");
    process.exitCode = 1;
    return;
  }

  const sourceSkillsDir = path.join(pluginDir, "skills");
  const sourceHooksDir = path.join(pluginDir, "hooks");
  const bundledSettingsPath = path.join(pluginDir, "settings.json");

  // Remove existing skills dir if force
  if (fs.existsSync(skillsDir) && force) {
    const stat = fs.lstatSync(skillsDir);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(skillsDir);
    } else {
      fs.rmSync(skillsDir, { recursive: true });
    }
  }

  // Symlink skills directory
  if (fs.existsSync(sourceSkillsDir)) {
    symlinkDir(sourceSkillsDir, skillsDir);
  }

  // Symlink individual hook files (not the whole dir, so doctors can add their own)
  let hookCount = 0;
  if (fs.existsSync(sourceHooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
    const hookFiles = listFiles(sourceHooksDir);
    for (const relPath of hookFiles) {
      // Skip hooks.json — we merge it instead
      if (relPath === "hooks.json") continue;
      const target = path.join(sourceHooksDir, relPath);
      const linkPath = path.join(hooksDir, relPath);
      symlinkFile(target, linkPath);
      hookCount++;
    }

    // Merge hooks.json
    const sourceHooksJson = path.join(sourceHooksDir, "hooks.json");
    if (fs.existsSync(sourceHooksJson)) {
      mergeHooksJson(path.join(hooksDir, "hooks.json"), sourceHooksJson);
    }
  }

  // Merge settings.json
  if (fs.existsSync(bundledSettingsPath)) {
    mergeSettings(getSettingsPath(baseDir), bundledSettingsPath);
  }

  // Write manifest with link mode (into the project, not the symlinked dir)
  const manifestDir = path.join(baseDir, ".claude");
  fs.mkdirSync(manifestDir, { recursive: true });
  const manifest: FileManifest = {
    version: VERSION,
    installedAt: new Date().toISOString(),
    files: {},
    mode: "link",
    sourcePath: sourceDir,
  };
  writeManifest(manifestDir, manifest);

  // Sync global cache + installed_plugins.json
  const cacheDir = getGlobalPluginCacheDir(VERSION);
  syncGlobalCache(pluginDir, cacheDir, VERSION);
  updateInstalledPlugins(path.resolve(baseDir), VERSION, pluginDir);

  const data = {
    status: "installed",
    mode: "link",
    version: VERSION,
    repoAction,
    sourcePath: sourceDir,
    skillsDir,
    hooksDir,
    hookFiles: hookCount,
    globalCache: cacheDir,
  };

  printResult(data, json, () =>
    [
      formatHeader("medical-protocol installed (linked)"),
      formatTable([
        ["Version", `v${VERSION}`],
        ["Mode", "symlink"],
        ["Source", sourceDir],
        ["Repo", repoAction],
        ["Skills", `${skillsDir} -> ${sourceSkillsDir}`],
        ["Hooks", `${hookCount} files symlinked`],
        ["Global cache", cacheDir],
      ]),
      "",
    ].join("\n"),
  );
}

function installCopy(baseDir: string, force: boolean, json: boolean): void {
  const skillsDir = getSkillsDir(baseDir);
  const hooksDir = getHooksDir(baseDir);
  const bundledDir = getBundledPluginDir();

  if (!fs.existsSync(bundledDir)) {
    process.stderr.write(formatError("Bundled plugin directory not found. Package may be corrupted.") + "\n");
    process.exitCode = 1;
    return;
  }

  const bundledSkillsDir = path.join(bundledDir, "skills");
  const bundledHooksDir = path.join(bundledDir, "hooks");
  const bundledSettingsPath = path.join(bundledDir, "settings.json");

  const fileHashes: Record<string, string> = {};
  let totalFiles = 0;

  // Remove symlink if switching from link to copy mode
  if (fs.existsSync(skillsDir) && fs.lstatSync(skillsDir).isSymbolicLink()) {
    fs.unlinkSync(skillsDir);
  }

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

  // Merge permissions into settings.json
  if (fs.existsSync(bundledSettingsPath)) {
    mergeSettings(getSettingsPath(baseDir), bundledSettingsPath);
  }

  const manifest: FileManifest = {
    version: VERSION,
    installedAt: new Date().toISOString(),
    files: fileHashes,
    mode: "copy",
  };
  writeManifest(skillsDir, manifest);

  // Sync global plugin cache
  const cacheDir = getGlobalPluginCacheDir(VERSION);
  syncGlobalCache(bundledDir, cacheDir, VERSION);
  updateInstalledPlugins(path.resolve(baseDir), VERSION, cacheDir);

  const data = {
    status: "installed",
    mode: "copy",
    version: VERSION,
    filesInstalled: totalFiles,
    skillsDir,
    hooksDir,
    globalCache: cacheDir,
  };

  printResult(data, json, () =>
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
  const dirsToSync = ["skills", "hooks", "context", "reference"];
  for (const dir of dirsToSync) {
    const srcDir = path.join(bundledDir, dir);
    if (!fs.existsSync(srcDir)) continue;
    const files = listFiles(srcDir);
    for (const relPath of files) {
      copyFile(path.join(srcDir, relPath), path.join(cacheDir, dir, relPath));
    }
  }

  const settingsSrc = path.join(bundledDir, "settings.json");
  if (fs.existsSync(settingsSrc)) {
    copyFile(settingsSrc, path.join(cacheDir, "settings.json"));
  }

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

  // Merge each hook event (PreToolUse, PostToolUse, etc.)
  for (const [event, hooks] of Object.entries(source)) {
    if (!Array.isArray(hooks)) continue;
    const existingHooks = (existing[event] ?? []) as Array<Record<string, unknown>>;
    for (const hook of hooks) {
      const hookObj = hook as Record<string, unknown>;
      // Check if a hook with the same command already exists
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
