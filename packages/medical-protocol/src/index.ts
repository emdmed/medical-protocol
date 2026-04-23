#!/usr/bin/env node

import { Command } from "commander";
import { version as VERSION } from "../package.json";

const program = new Command();

program
  .name("medical-protocol")
  .description("Install and manage the medical-protocol plugin for Claude Code")
  .version(`v${VERSION}`, "-v, --version")
  .option("-y, --yes", "Skip prompts, use defaults");

program
  .command("install")
  .description("Install the plugin into your project")
  .option("--dir <path>", "Target project directory", process.cwd())
  .option("--force", "Overwrite existing installation")
  .option("--link", "Use symlinks to a shared repo clone instead of copying")
  .option("--source <path>", "Path to repo clone (default: ~/.medical-protocol)")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const yes = program.opts().yes;
    const mod = await import("./commands/install");
    await mod.run({ ...opts, yes });
  });

program
  .command("check")
  .description("Check if the plugin is up-to-date")
  .option("--dir <path>", "Target project directory", process.cwd())
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const yes = program.opts().yes;
    const mod = await import("./commands/check");
    await mod.run({ ...opts, yes });
  });

program
  .command("update")
  .description("Update the plugin to the latest version")
  .option("--dir <path>", "Target project directory", process.cwd())
  .option("--force", "Overwrite locally modified files")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const yes = program.opts().yes;
    const mod = await import("./commands/update");
    await mod.run({ ...opts, yes });
  });

program.action(() => {
  program.help();
});

program.parse();
