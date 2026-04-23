import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import { execSync } from "child_process";

export function getBundledPluginDir(): string {
  // dist/index.js → dist/ → package root → plugin/
  return path.resolve(__dirname, "..", "plugin");
}

export function getSkillsDir(baseDir: string): string {
  return path.join(baseDir, ".claude", "skills");
}

export function getHooksDir(baseDir: string): string {
  return path.join(baseDir, ".claude", "hooks");
}

export function getSettingsPath(baseDir: string): string {
  return path.join(baseDir, ".claude", "settings.json");
}

export function listFiles(dir: string): string[] {
  const results: string[] = [];

  function walk(current: string): void {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        results.push(path.relative(dir, fullPath));
      }
    }
  }

  walk(dir);
  return results.sort();
}

export function copyFile(src: string, dest: string): void {
  const destDir = path.dirname(dest);
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  if (dest.endsWith(".sh")) {
    fs.chmodSync(dest, 0o755);
  }
}

export function getGlobalPluginCacheDir(version: string): string {
  return path.join(homedir(), ".claude", "plugins", "cache", "medical-protocol", "medical-protocol", version);
}

export function getInstalledPluginsPath(): string {
  return path.join(homedir(), ".claude", "plugins", "installed_plugins.json");
}

const REPO_URL = "https://github.com/emdmed/medical-protocol.git";

export function getDefaultSourceDir(): string {
  return path.join(homedir(), ".medical-protocol");
}

export function symlinkDir(target: string, linkPath: string): void {
  const parent = path.dirname(linkPath);
  fs.mkdirSync(parent, { recursive: true });
  if (fs.existsSync(linkPath)) {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(linkPath);
    } else {
      throw new Error(`${linkPath} already exists and is not a symlink. Remove it first or use --force.`);
    }
  }
  fs.symlinkSync(target, linkPath, "dir");
}

export function symlinkFile(target: string, linkPath: string): void {
  const parent = path.dirname(linkPath);
  fs.mkdirSync(parent, { recursive: true });
  try {
    if (fs.lstatSync(linkPath)) {
      fs.unlinkSync(linkPath);
    }
  } catch {
    // doesn't exist, fine
  }
  fs.symlinkSync(target, linkPath, "file");
}

export function cloneOrPullRepo(sourceDir: string): { cloned: boolean } {
  if (fs.existsSync(path.join(sourceDir, ".git"))) {
    // Verify remote URL matches
    try {
      const remote = execSync("git remote get-url origin", { cwd: sourceDir, encoding: "utf-8" }).trim();
      if (!remote.includes("emdmed/medical-protocol")) {
        throw new Error(
          `${sourceDir} exists but remote origin (${remote}) does not match expected repo. Use --source to specify a different path.`,
        );
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("does not match")) throw e;
      throw new Error(`${sourceDir} exists but is not a valid git repository.`);
    }
    try {
      execSync("git pull --ff-only", { cwd: sourceDir, stdio: "pipe" });
    } catch {
      // pull may fail if working tree is dirty (e.g., dev clone) — that's ok
    }
    return { cloned: false };
  }

  fs.mkdirSync(path.dirname(sourceDir), { recursive: true });
  execSync(`git clone ${REPO_URL} "${sourceDir}"`, { stdio: "pipe" });
  return { cloned: true };
}

export function isSymlink(filePath: string): boolean {
  try {
    return fs.lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

export function getRepoStatus(sourceDir: string): { branch: string; ahead: number; behind: number } {
  try {
    execSync("git fetch --quiet", { cwd: sourceDir, stdio: "pipe", timeout: 10000 });
  } catch {
    // fetch may fail offline — that's ok
  }
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: sourceDir, encoding: "utf-8" }).trim();
  let ahead = 0;
  let behind = 0;
  try {
    const status = execSync("git rev-list --left-right --count HEAD...@{upstream}", {
      cwd: sourceDir,
      encoding: "utf-8",
    }).trim();
    const parts = status.split(/\s+/);
    ahead = parseInt(parts[0], 10) || 0;
    behind = parseInt(parts[1], 10) || 0;
  } catch {
    // no upstream tracking
  }
  return { branch, ahead, behind };
}
