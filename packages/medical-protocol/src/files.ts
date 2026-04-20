import * as fs from "fs";
import * as path from "path";

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
