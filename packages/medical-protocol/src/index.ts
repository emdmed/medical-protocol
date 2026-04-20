#!/usr/bin/env node

import { version as VERSION } from "../package.json";

const USAGE = `medical-protocol — Install and manage the medical-protocol plugin for Claude Code

Usage: medical-protocol <command> [options]

Commands:
  install          Install the plugin into your project
  check            Check if the plugin is up-to-date
  update           Update the plugin to the latest bundled version

Global options:
  --dir <path>     Target project directory (default: current directory)
  --force          Overwrite existing installation or locally modified files
  --json           Output as JSON
  --help           Show help
  --version        Show version

Examples:
  npx medical-protocol install
  npx medical-protocol check
  npx medical-protocol update
  npx medical-protocol install --dir /path/to/project
  npx medical-protocol check --json`;

const command = process.argv[2];
const commandArgs = process.argv.slice(3);

if (command === "--version" || command === "-v") {
  process.stdout.write(`medical-protocol v${VERSION}\n`);
  process.exit(0);
}

if (!command || command === "--help" || command === "-h") {
  process.stdout.write(USAGE + "\n");
  process.exit(0);
}

const commands: Record<string, () => Promise<{ run: (argv: string[]) => void }>> = {
  install: () => import("./commands/install"),
  check: () => import("./commands/check"),
  update: () => import("./commands/update"),
};

const loader = commands[command];

if (!loader) {
  process.stderr.write(
    `Unknown command: ${command}\n\nAvailable commands: ${Object.keys(commands).join(", ")}\n`,
  );
  process.exitCode = 1;
} else {
  loader().then((mod) => mod.run(commandArgs));
}
