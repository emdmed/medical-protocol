import * as fs from "fs";
import * as path from "path";

export const PLUGIN_DIR_NAME = ".claude/plugins/medical-protocol";

export function getBundledPluginDir(): string {
  // dist/index.js → dist/ → package root → plugin/
  return path.resolve(__dirname, "..", "plugin");
}

export function getTargetDir(baseDir: string): string {
  return path.join(baseDir, PLUGIN_DIR_NAME);
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
