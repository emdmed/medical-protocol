import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

export interface FileManifest {
  version: string;
  installedAt: string;
  files: Record<string, string>;
  mode?: "copy" | "link";
  sourcePath?: string;
}

const MANIFEST_NAME = ".manifest.json";

export function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath);
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  return `sha256:${hash}`;
}

export function readManifest(pluginDir: string): FileManifest | null {
  const manifestPath = path.join(pluginDir, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as FileManifest;
  } catch {
    return null;
  }
}

export function writeManifest(pluginDir: string, manifest: FileManifest): void {
  const manifestPath = path.join(pluginDir, MANIFEST_NAME);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}
