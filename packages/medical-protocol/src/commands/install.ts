import * as p from "@clack/prompts";
import pc from "picocolors";
import { version as VERSION } from "../../package.json";
import {
  getBundledPluginDir,
  getSkillsDir,
  getHooksDir,
  getLibDir,
  getScriptsDir,
  getAgentsDir,
  listFiles,
  copyFile,
  getDefaultSourceDir,
  symlinkDir,
  symlinkFile,
  cloneOrPullRepo,
  isLink,
  removeLink,
} from "../files";
import { hashFile, writeManifest, readManifest, type FileManifest } from "../manifest";
import { mergeSettings } from "../settings";
import { formatError, printResult, formatHeader, formatTable } from "../../../../plugin/lib/format";
import { isInteractive, selectInstallMode, confirmAlreadyInstalled, promptSourcePath, confirmInstallAgentBrowser } from "../prompts";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface InstallOptions {
  dir: string;
  force?: boolean;
  link?: boolean;
  source?: string;
  json?: boolean;
  yes?: boolean;
  agentBrowser?: boolean;
}

export async function run(opts: InstallOptions): Promise<void> {
  if (isInteractive(opts) && !opts.force && !opts.link && !opts.source) {
    await runInteractive(opts);
  } else {
    runNonInteractive(opts);
  }
}

async function runInteractive(opts: InstallOptions): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" medical-protocol ")));

  const baseDir = opts.dir;
  const skillsDir = getSkillsDir(baseDir);
  const manifestPath = path.join(skillsDir, ".manifest.json");
  const linkManifest = readManifest(path.join(baseDir, ".claude"));
  const alreadyInstalled = fs.existsSync(manifestPath) || linkManifest?.mode === "link";

  if (alreadyInstalled) {
    const action = await confirmAlreadyInstalled();
    if (action === "cancel") {
      p.cancel("Installation cancelled.");
      return;
    }
    if (action === "update") {
      // Delegate to update command
      const updateMod = await import("./update");
      p.outro("Switching to update...");
      await updateMod.run({ dir: baseDir, yes: true });
      return;
    }
    // "reinstall" — continue with force
    opts.force = true;
  }

  const mode = await selectInstallMode();
  if (mode === "cancel") {
    p.cancel("Installation cancelled.");
    return;
  }

  if (mode === "link") {
    let sourcePath = opts.source;
    if (!sourcePath) {
      sourcePath = (await promptSourcePath()) ?? undefined;
    }
    const s = p.spinner();
    s.start("Cloning/updating source repo...");
    try {
      installLinked(baseDir, sourcePath, !!opts.force, false);
      s.stop(pc.green("Plugin installed (symlink mode)"));
    } catch (e) {
      s.error(pc.red("Installation failed"));
      p.log.error((e as Error).message);
      process.exitCode = 1;
      return;
    }
  } else {
    const s = p.spinner();
    s.start("Installing plugin...");
    try {
      installCopy(baseDir, !!opts.force, false);
      s.stop(pc.green("Plugin installed"));
    } catch (e) {
      s.error(pc.red("Installation failed"));
      p.log.error((e as Error).message);
      process.exitCode = 1;
      return;
    }
  }

  await promptAndInstallAgentBrowser();

  p.outro(`Done! Plugin v${VERSION} installed`);
}

// agent-browser is an external CLI used by the browser-QA workflow. It's optional —
// the plugin works without it, so install failures are non-fatal.
function isAgentBrowserInstalled(): boolean {
  try {
    execSync("agent-browser --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function installAgentBrowser(silent: boolean): void {
  const stdio = silent ? "ignore" : "inherit";
  execSync("npm install -g agent-browser", { stdio });
  // First run downloads the bundled Chrome.
  execSync("agent-browser install", { stdio });
}

async function promptAndInstallAgentBrowser(): Promise<void> {
  if (isAgentBrowserInstalled()) {
    p.log.info("agent-browser already installed — browser QA enabled.");
    return;
  }
  const wants = await confirmInstallAgentBrowser();
  if (!wants) return;
  const s = p.spinner();
  s.start("Installing agent-browser (also downloads a browser)...");
  try {
    installAgentBrowser(true);
    s.stop(pc.green("agent-browser installed"));
  } catch (e) {
    s.error(pc.yellow("Could not install agent-browser — skipping (the plugin works without it)"));
    p.log.warn((e as Error).message);
  }
}

function runNonInteractive(opts: InstallOptions): void {
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

  try {
    if (useLink) installLinked(baseDir, opts.source, !!opts.force, !!opts.json);
    else installCopy(baseDir, !!opts.force, !!opts.json);
  } catch (e) {
    process.stderr.write(formatError((e as Error).message) + "\n");
    process.exitCode = 1;
    return;
  }

  // Optional browser-QA tool — only when explicitly requested via --agent-browser.
  if (opts.agentBrowser && process.exitCode !== 1 && !isAgentBrowserInstalled()) {
    try {
      installAgentBrowser(!!opts.json);
    } catch (e) {
      if (!opts.json) {
        process.stderr.write(formatError(`agent-browser install failed (skipped): ${(e as Error).message}`) + "\n");
      }
    }
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

  // Remove existing skills dir if force
  if (fs.existsSync(skillsDir) && force) {
    if (isLink(skillsDir)) {
      removeLink(skillsDir);
    } else {
      fs.rmSync(skillsDir, { recursive: true });
    }
  }

  // Symlink skills directory
  if (fs.existsSync(sourceSkillsDir)) {
    symlinkDir(sourceSkillsDir, skillsDir);
  }

  // Link the clinical logic and CLI beside skills/, where skills reach them
  for (const [dir, dest] of [["lib", getLibDir(baseDir)], ["scripts", getScriptsDir(baseDir)]]) {
    const src = path.join(pluginDir, dir);
    if (!fs.existsSync(src)) continue;
    if (fs.existsSync(dest) && force) {
      if (isLink(dest)) removeLink(dest);
      else fs.rmSync(dest, { recursive: true });
    }
    symlinkDir(src, dest);
  }

  // Symlink individual agent files (doctors can add their own agents beside them)
  const sourceAgentsDir = path.join(pluginDir, "agents");
  if (fs.existsSync(sourceAgentsDir)) {
    for (const relPath of listFiles(sourceAgentsDir)) {
      symlinkFile(path.join(sourceAgentsDir, relPath), path.join(getAgentsDir(baseDir), relPath));
    }
  }

  // Symlink individual hook files (not the whole dir, so doctors can add their own)
  let hookCount = 0;
  if (fs.existsSync(sourceHooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
    const hookFiles = listFiles(sourceHooksDir);
    for (const relPath of hookFiles) {
      // hooks.json is registered in settings.json below, not read from here
      if (relPath === "hooks.json") continue;
      const target = path.join(sourceHooksDir, relPath);
      const linkPath = path.join(hooksDir, relPath);
      symlinkFile(target, linkPath);
      hookCount++;
    }
  }

  // Permissions and hooks into settings.json
  mergeSettings(baseDir, pluginDir);

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

  const data = {
    status: "installed",
    mode: "link",
    version: VERSION,
    repoAction,
    sourcePath: sourceDir,
    skillsDir,
    hooksDir,
    hookFiles: hookCount,
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
      ]),
      "",
      "Next: open Claude Code in this project and run  /medical-protocol:start  to build your first interface.",
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

  const fileHashes: Record<string, string> = {};
  let totalFiles = 0;

  // Remove symlink if switching from link to copy mode
  if (fs.existsSync(skillsDir) && isLink(skillsDir)) {
    removeLink(skillsDir);
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

  // Copy clinical logic
  const bundledLibDir = path.join(bundledDir, "lib");
  if (fs.existsSync(bundledLibDir)) {
    for (const relPath of listFiles(bundledLibDir)) {
      const src = path.join(bundledLibDir, relPath);
      copyFile(src, path.join(getLibDir(baseDir), relPath));
      fileHashes[`lib/${relPath}`] = hashFile(src);
      totalFiles++;
    }
  }

  // Copy the medprotocol CLI
  const bundledScriptsDir = path.join(bundledDir, "scripts");
  if (fs.existsSync(bundledScriptsDir)) {
    for (const relPath of listFiles(bundledScriptsDir)) {
      const src = path.join(bundledScriptsDir, relPath);
      copyFile(src, path.join(getScriptsDir(baseDir), relPath));
      fileHashes[`scripts/${relPath}`] = hashFile(src);
      totalFiles++;
    }
  }

  // Copy subagents
  const bundledAgentsDir = path.join(bundledDir, "agents");
  if (fs.existsSync(bundledAgentsDir)) {
    for (const relPath of listFiles(bundledAgentsDir)) {
      const src = path.join(bundledAgentsDir, relPath);
      copyFile(src, path.join(getAgentsDir(baseDir), relPath));
      fileHashes[`agents/${relPath}`] = hashFile(src);
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

  // Permissions and hooks into settings.json
  mergeSettings(baseDir, bundledDir);

  const manifest: FileManifest = {
    version: VERSION,
    installedAt: new Date().toISOString(),
    files: fileHashes,
    mode: "copy",
  };
  writeManifest(skillsDir, manifest);

  const data = {
    status: "installed",
    mode: "copy",
    version: VERSION,
    filesInstalled: totalFiles,
    skillsDir,
    hooksDir,
  };

  printResult(data, json, () =>
    [
      formatHeader("medical-protocol installed"),
      formatTable([
        ["Version", `v${VERSION}`],
        ["Files", `${totalFiles}`],
        ["Skills", skillsDir],
        ["Hooks", hooksDir],
      ]),
      "",
      "Next: open Claude Code in this project and run  /medical-protocol:start  to build your first interface.",
      "",
    ].join("\n"),
  );
}
