import { parseArgs } from "util";
import { version as VERSION } from "../../package.json";
import { getBundledPluginDir, getTargetDir, listFiles, copyFile } from "../files";
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
        `Install the medical-protocol plugin into your project.\n\n` +
        `Options:\n` +
        `  --dir <path>   Target project directory (default: cwd)\n` +
        `  --force        Overwrite existing installation\n` +
        `  --json         Output as JSON\n`,
    );
    return;
  }

  const targetDir = getTargetDir(values.dir!);
  const bundledDir = getBundledPluginDir();

  if (!fs.existsSync(bundledDir)) {
    process.stderr.write(formatError("Bundled plugin directory not found. Package may be corrupted.") + "\n");
    process.exitCode = 1;
    return;
  }

  if (fs.existsSync(targetDir) && !values.force) {
    process.stderr.write(
      formatError(`Plugin already installed at ${targetDir}\nUse --force to overwrite, or use 'update' to update changed files.`) + "\n",
    );
    process.exitCode = 1;
    return;
  }

  const files = listFiles(bundledDir);
  const fileHashes: Record<string, string> = {};

  for (const relPath of files) {
    const src = path.join(bundledDir, relPath);
    const dest = path.join(targetDir, relPath);
    copyFile(src, dest);
    fileHashes[relPath] = hashFile(src);
  }

  const manifest: FileManifest = {
    version: VERSION,
    installedAt: new Date().toISOString(),
    files: fileHashes,
  };
  writeManifest(targetDir, manifest);

  // Register plugin in .claude/settings.json so Claude Code discovers it
  const settingsPath = path.join(values.dir!, ".claude", "settings.json");
  registerPlugin(settingsPath);

  const data = {
    status: "installed",
    version: VERSION,
    filesInstalled: files.length,
    targetDir,
  };

  printResult(data, values.json!, () =>
    [
      formatHeader("medical-protocol plugin installed"),
      formatTable([
        ["Version", `v${VERSION}`],
        ["Files", `${files.length}`],
        ["Location", targetDir],
      ]),
      "",
    ].join("\n"),
  );
}

const PLUGIN_KEY = "medical-protocol@medical-protocol";

function registerPlugin(settingsPath: string): void {
  let settings: Record<string, unknown> = {};

  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    } catch {
      // If settings.json is malformed, start fresh
      settings = {};
    }
  }

  const enabled = (settings.enabledPlugins ?? {}) as Record<string, boolean>;
  if (enabled[PLUGIN_KEY]) return; // Already registered

  enabled[PLUGIN_KEY] = true;
  settings.enabledPlugins = enabled;

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}
